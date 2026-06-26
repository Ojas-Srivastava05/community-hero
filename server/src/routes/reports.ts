import { Router } from 'express'
import multer from 'multer'
import { v4 as uuid } from 'uuid'
import ngeohash from 'ngeohash'
import { z } from 'zod'
import { db, bucket } from '../lib/firebase-admin'
import { analyzeImage } from '../lib/gemini'
import {
  runAgentPipeline,
  awardPoints,
  notifyStatusChange,
  enrichIssuesWithSla,
  runCitizenCommunicator,
  type AwardResult,
} from '../lib/agents'
import { compareBeforeAfter } from '../lib/gemini'
import { generateEmbedding, issueEmbeddingText } from '../lib/embeddings'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { reportLimit, upvoteLimit } from '../middleware/rateLimit'
import { deriveWardId, haversineKm, reverseGeocodeServer } from '../lib/geo'
import { validateImageBuffer } from '../lib/media-validation'
import { upsertThreadForIssue } from './threads'
import { CATEGORIES, DEPARTMENTS, type IssueAnalysis } from '../types/shared'
import { sendError, ErrorCodes, sendServerError, isApiError } from '../lib/errors'
import { runIntakeAgent } from '../lib/agents/intake'
import { toOpen311Record } from '../lib/open311'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
export const reportsRouter = Router()

const boolish = z.union([z.boolean(), z.string().transform((s) => s === 'true' || s === '1')])

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.enum(CATEGORIES),
  severity: z.coerce.number().min(1).max(5),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  address: z.string().optional(),
  mergeIntoId: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  safety_risk: boolish.optional(),
  department: z.string().optional(),
  ai_analyzed: boolish.optional(),
  analysis: z.string().optional(),
})

function parseAnalysisFromBody(
  data: z.infer<typeof createSchema>,
  body: Record<string, unknown>,
): IssueAnalysis {
  if (data.analysis) {
    try {
      return JSON.parse(data.analysis) as IssueAnalysis
    } catch {
      /* fall through */
    }
  }
  if (body.analysis && typeof body.analysis === 'object') {
    return body.analysis as IssueAnalysis
  }
  return {
    category: data.category,
    severity: data.severity,
    title: data.title,
    description: data.description,
    department: data.department || '',
    safety_risk: data.safety_risk ?? data.severity >= 4,
    confidence: data.confidence ?? (data.ai_analyzed ? 0.85 : 0.9),
  }
}

function isPublicIssue(issue: { status?: string; aiMetadata?: { needs_review?: boolean } }) {
  if (issue.status === 'Draft') return false
  if (issue.aiMetadata?.needs_review) return false
  return true
}

reportsRouter.post('/analyze', requireAuth, upload.single('image'), async (req: AuthedRequest, res) => {
  try {
    if (!req.file) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'Image required')
      return
    }
    const hint = req.body.hint as string | undefined
    const intake = await runIntakeAgent(req.file.buffer, hint)
    if (!intake.ok) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, intake.reason || 'Image failed safety or civic check')
      return
    }
    const analysis = await analyzeImage(req.file.buffer, req.file.mimetype, hint)
    res.json({ analysis })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/', requireAuth, reportLimit, upload.array('images', 3), async (req: AuthedRequest, res) => {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      const missingGps = !Number.isFinite(Number(req.body.lat)) || !Number.isFinite(Number(req.body.lng))
      if (missingGps) {
        sendError(res, 400, ErrorCodes.GPS_REQUIRED, 'Location required — enable GPS or place a pin on the map')
        return
      }
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'Invalid report data')
      return
    }
    const data = parsed.data

    if (data.mergeIntoId) {
      const target = await db.collection('issues').doc(data.mergeIntoId).get()
      if (!target.exists) {
        sendError(res, 404, ErrorCodes.NOT_FOUND, 'Merge target not found')
        return
      }
      const count = (target.data()?.upvoteCount ?? 0) + 1
      await target.ref.update({ upvoteCount: count, updatedAt: new Date().toISOString() })
      await target.ref.collection('events').add({
        type: 'merge',
        actorId: req.user!.uid,
        payload: { mergedFrom: 'new-report', title: data.title },
        timestamp: new Date().toISOString(),
      })
      const mergeAward = await awardPoints(req.user!.uid, 15, 'merge')
      res.status(201).json({
        id: data.mergeIntoId,
        merged: true,
        issue: { id: data.mergeIntoId, ...target.data(), upvoteCount: count },
        pointsEarned: mergeAward,
      })
      return
    }

    const id = uuid()
    const files = (req.files as Express.Multer.File[]) || []

    for (const file of files) {
      const intake = await runIntakeAgent(file.buffer, data.description, data.title, data.description)
      if (!intake.ok) {
        sendError(res, 400, ErrorCodes.INVALID_MEDIA, intake.reason || 'Image failed safety or civic check')
        return
      }
    }

    const geoPromise = data.address
      ? Promise.resolve({
          address: data.address,
          wardId: deriveWardId(data.address, data.lat, data.lng),
        })
      : reverseGeocodeServer(data.lat, data.lng)

    for (const file of files) {
      const validation = validateImageBuffer(file.buffer, file.mimetype)
      if (!validation.ok) {
        sendError(res, 400, ErrorCodes.INVALID_MEDIA, validation.reason)
        return
      }
    }

    const uploadFile = async (file: Express.Multer.File): Promise<string | null> => {
      try {
        const ext = file.mimetype.split('/')[1] || 'jpg'
        const path = `issues/${id}/${uuid()}.${ext}`
        const blob = bucket.file(path)
        await blob.save(file.buffer, { metadata: { contentType: file.mimetype } })
        try {
          await blob.makePublic()
          return `https://storage.googleapis.com/${bucket.name}/${path}`
        } catch {
          const [signedUrl] = await blob.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
          })
          return signedUrl
        }
      } catch (storageErr) {
        console.error('Image upload failed (report will save without photo):', storageErr)
        return null
      }
    }

    const [geo, ...uploadedUrls] = await Promise.all([
      geoPromise,
      ...files.map((file) => uploadFile(file)),
    ])
    const imageUrls = uploadedUrls.filter((url): url is string => Boolean(url))

    const geohash = ngeohash.encode(data.lat, data.lng, 7)
    const now = new Date().toISOString()
    const embedText = issueEmbeddingText(data.title, data.description, data.category)
    const embedding = await generateEmbedding(embedText)
    const issue = {
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'Submitted',
      lat: data.lat,
      lng: data.lng,
      address: geo.address,
      geohash,
      embedding,
      wardId: geo.wardId || deriveWardId(geo.address, data.lat, data.lng),
      imageUrls,
      reporterId: req.user!.uid,
      reporterEmail: req.user!.email || '',
      departmentId: '',
      upvoteCount: 0,
      verificationLevel: 0,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('issues').doc(id).set(issue)

    let analysis = parseAnalysisFromBody(data, req.body as Record<string, unknown>)
    if (files.length > 0 && data.confidence === undefined && !data.analysis && !data.ai_analyzed) {
      const vision = await analyzeImage(files[0].buffer, files[0].mimetype, data.description)
      analysis = {
        ...vision,
        title: data.title || vision.title,
        description: data.description || vision.description,
        category: data.category || vision.category,
        severity: data.severity || vision.severity,
      }
    }

    let pointsEarned: AwardResult = { pointsAwarded: 0, badgesEarned: [] }
    try {
      const firstImage = files[0]
      const pipelineResult = await runAgentPipeline({
        issueId: id,
        analysis,
        lat: data.lat,
        lng: data.lng,
        reporterId: req.user!.uid,
        wardId: geo.wardId,
        title: data.title,
        description: data.description,
        imageBuffer: firstImage?.buffer,
        imageMime: firstImage?.mimetype,
        createdAt: now,
        precomputedEmbedding: embedding,
      })
      await upsertThreadForIssue(id, geohash, data.title, data.category, embedding)
      pointsEarned = pipelineResult.pointsEarned ?? pointsEarned
    } catch (agentErr) {
      console.error('Agent pipeline failed (report saved):', agentErr)
      await db.collection('issues').doc(id).update({
        departmentId: analysis.department || DEPARTMENTS[data.category]?.name || 'General Civic',
        updatedAt: new Date().toISOString(),
      })
    }

    const saved = await db.collection('issues').doc(id).get()
    const savedData = saved.data()!
    const dupes = (savedData.aiMetadata as { duplicate_suggestions?: { id: string; title: string; similarity?: number; distanceM?: number }[] })?.duplicate_suggestions

    const needsReview = analysis.confidence < 0.7
    const statusCode = needsReview ? 202 : 201
    const responseBody: Record<string, unknown> = {
      id,
      issue: { id, ...savedData },
      duplicateSuggestions: dupes || [],
      pointsEarned,
    }
    if (needsReview) {
      responseBody.code = ErrorCodes.NEEDS_REVIEW
    } else if (dupes && dupes.length > 0) {
      responseBody.code = ErrorCodes.DUPLICATE_SUGGESTED
    }

    res.status(statusCode).json(responseBody)
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const status = req.query.status as string | undefined
    const lat = req.query.lat ? Number(req.query.lat) : undefined
    const lng = req.query.lng ? Number(req.query.lng) : undefined
    const radiusKm = req.query.radius_km ? Number(req.query.radius_km) : undefined
    const includeDraft = req.query.include_draft === '1'
    const sortByPriority = req.query.sort === 'priority'

    const includeDemo = req.query.include_demo === '1'
    const fetchLimit = lat !== undefined && lng !== undefined ? Math.min(limit * 4, 100) : limit

    let q = sortByPriority
      ? db.collection('issues').orderBy('priorityScore', 'desc').limit(fetchLimit)
      : db.collection('issues').orderBy('createdAt', 'desc').limit(fetchLimit)
    if (status) {
      q = sortByPriority
        ? db.collection('issues').where('status', '==', status).orderBy('priorityScore', 'desc').limit(fetchLimit)
        : db.collection('issues').where('status', '==', status).orderBy('createdAt', 'desc').limit(fetchLimit)
    }
    const snap = await q.get()
    let issues = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string
      lat: number
      lng: number
      isDemo?: boolean
      reporterId?: string
      status?: string
      aiMetadata?: { needs_review?: boolean }
      slaDeadline?: string
      slaBreached?: boolean
      priorityScore?: number
    }[]

    if (sortByPriority) {
      issues = (await enrichIssuesWithSla(issues)) as typeof issues
    }

    if (!includeDemo) {
      issues = issues.filter((i) => !i.isDemo && i.reporterId !== 'demo-seed')
    }

    if (!includeDraft) {
      issues = issues.filter((i) => isPublicIssue(i))
    }

    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      const radius = radiusKm && Number.isFinite(radiusKm) ? radiusKm : 25
      issues = issues
        .map((i) => ({ ...i, _dist: haversineKm(lat, lng, i.lat, i.lng) }))
        .filter((i) => i._dist <= radius)
        .sort((a, b) => (sortByPriority ? (b.priorityScore ?? 0) - (a.priorityScore ?? 0) : a._dist - b._dist))
        .map(({ _dist, ...rest }) => rest)
    } else if (sortByPriority) {
      issues.sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
    }

    issues = issues.slice(0, limit)

    res.json({ issues })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.get('/mine', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const snap = await db
      .collection('issues')
      .where('reporterId', '==', req.user!.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
    res.json({ issues: snap.docs.map((d) => ({ id: d.id, ...d.data() })) })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.get('/:id/vote', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const vote = await db
      .collection('issues')
      .doc(String(req.params.id))
      .collection('votes')
      .doc(req.user!.uid)
      .get()
    res.json({ voted: vote.exists })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('issues').doc(req.params.id).get()
    if (!doc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Not found')
      return
    }
    const data = doc.data()!
    const [enriched] = await enrichIssuesWithSla([{ id: doc.id, ...data }])
    const events = await db
      .collection('issues')
      .doc(req.params.id)
      .collection('events')
      .orderBy('timestamp', 'asc')
      .get()
    res.json({
      issue: enriched,
      events: events.docs.map((d) => ({ id: d.id, ...d.data() })),
    })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/:id/upvote', requireAuth, upvoteLimit, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const { processUpvote } = await import('../lib/agents')
    const result = await processUpvote(id, req.user!.uid)
    if (!result.ok) {
      sendError(
        res,
        403,
        ErrorCodes.FORBIDDEN,
        'Upvoting requires at least one prior report or an account older than 24 hours.',
      )
      return
    }
    if (result.already) {
      res.json({ already: true, count: result.count, verificationLevel: result.verificationLevel })
      return
    }
    res.json({
      count: result.count,
      verificationLevel: result.verificationLevel,
      pointsEarned: result.pointsAwarded
        ? { pointsAwarded: result.pointsAwarded, badgesEarned: result.badgesEarned ?? [] }
        : undefined,
    })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/:id/merge', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const sourceId = String(req.params.id)
    const { targetId } = req.body as { targetId?: string }
    if (!targetId) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'targetId required')
      return
    }
    const [source, target] = await Promise.all([
      db.collection('issues').doc(sourceId).get(),
      db.collection('issues').doc(targetId).get(),
    ])
    if (!source.exists || !target.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Issue not found')
      return
    }
    const count = (target.data()?.upvoteCount ?? 0) + (source.data()?.upvoteCount ?? 0) + 1
    await target.ref.update({ upvoteCount: count, updatedAt: new Date().toISOString() })
    await source.ref.update({ status: 'Closed', mergedInto: targetId, updatedAt: new Date().toISOString() })
    await target.ref.collection('events').add({
      type: 'merge',
      actorId: req.user!.uid,
      payload: { sourceId },
      timestamp: new Date().toISOString(),
    })
    const mergeAward = await awardPoints(req.user!.uid, 15, 'merge')
    res.json({ ok: true, targetId, upvoteCount: count, pointsEarned: mergeAward })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/:id/open311/export', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const doc = await db.collection('issues').doc(String(req.params.id)).get()
    if (!doc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Issue not found')
      return
    }
    const record = toOpen311Record(doc.id, doc.data()!)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=open311-${doc.id}.json`)
    res.json(record)
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/:id/reopen', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const doc = await db.collection('issues').doc(id).get()
    if (!doc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Not found')
      return
    }
    const data = doc.data()!
    const admins = (process.env.ADMIN_EMAILS || '').split(',')
    const isReporter = data.reporterId === req.user!.uid
    const isAdmin = req.user!.email && admins.includes(req.user!.email)
    if (!isReporter && !isAdmin) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
      return
    }
    if (!['Resolved', 'Closed'].includes(data.status)) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'Only resolved/closed issues can be reopened')
      return
    }
    await doc.ref.update({ status: 'Submitted', resolvedAt: null, updatedAt: new Date().toISOString() })
    await doc.ref.collection('events').add({
      type: 'reopen',
      actorId: req.user!.uid,
      payload: {},
      timestamp: new Date().toISOString(),
    })
    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.post('/bulk-status', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { ids, status } = req.body as { ids?: string[]; status?: string }
    if (!ids?.length || !status) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'ids and status required')
      return
    }
    const admins = (process.env.ADMIN_UIDS || '').split(',')
    const adminEmails = (process.env.ADMIN_EMAILS || 'srivastavaojas454@gmail.com').split(',')
    const isAdmin =
      admins.includes(req.user!.uid) ||
      (req.user!.email && adminEmails.includes(req.user!.email))
    if (!isAdmin) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
      return
    }

    const now = new Date().toISOString()
    const updated: string[] = []
    for (const issueId of ids.slice(0, 50)) {
      const doc = await db.collection('issues').doc(issueId).get()
      if (!doc.exists) continue
      const data = doc.data()!
      await doc.ref.update({ status, updatedAt: now })
      await doc.ref.collection('events').add({
        type: 'status_change',
        actorId: req.user!.uid,
        payload: { status, bulk: true },
        timestamp: now,
      })
      if (data.reporterId && data.status !== status) {
        const narrative = await runCitizenCommunicator(status, data.title || 'Your report', data.departmentId)
        await notifyStatusChange(issueId, data.reporterId, status, data.title || 'Your report', {
          en: narrative.narrativeEn,
          hi: narrative.narrativeHi,
        })
      }
      updated.push(issueId)
    }
    res.json({ ok: true, updated })
  } catch (e) {
    sendServerError(res, e)
  }
})

reportsRouter.patch('/:id/status', requireAuth, (req, res, next) => {
  upload.single('proof')(req, res, (err) => {
    if (err) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, err.message || 'Invalid proof upload')
      return
    }
    next()
  })
}, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : ''
    if (!status) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'status field required')
      return
    }
    const admins = (process.env.ADMIN_UIDS || '').split(',')
    const adminEmails = (process.env.ADMIN_EMAILS || 'srivastavaojas454@gmail.com').split(',')
    const isAdmin =
      admins.includes(req.user!.uid) ||
      (req.user!.email && adminEmails.includes(req.user!.email))
    if (!isAdmin) {
      sendError(res, 403, ErrorCodes.FORBIDDEN, 'Forbidden')
      return
    }

    const issueDoc = await db.collection('issues').doc(id).get()
    if (!issueDoc.exists) {
      sendError(res, 404, ErrorCodes.NOT_FOUND, 'Not found')
      return
    }
    const issueData = issueDoc.data()!

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    }
    if (status === 'Resolved' || status === 'Closed') {
      updates.resolvedAt = new Date().toISOString()
      const reporterId = issueData.reporterId
      if (reporterId) {
        const { awardPoints } = await import('../lib/agents')
        await awardPoints(reporterId, 25, 'resolved') // Fix Follower badge
      }
    }

    if (req.file) {
      try {
        const ext = req.file.mimetype.split('/')[1] || 'jpg'
        const path = `issues/${id}/proof.${ext}`
        const blob = bucket.file(path)
        await blob.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } })
        try {
          await blob.makePublic()
          updates.proofImageUrl = `https://storage.googleapis.com/${bucket.name}/${path}`
        } catch {
          const [signedUrl] = await blob.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
          })
          updates.proofImageUrl = signedUrl
        }

        const beforeUrl = (issueData.imageUrls as string[] | undefined)?.[0]
        if (beforeUrl && req.file) {
          try {
            const beforeRes = await fetch(beforeUrl)
            const beforeBuffer = Buffer.from(await beforeRes.arrayBuffer())
            const comparison = await compareBeforeAfter(
              beforeBuffer,
              req.file.buffer,
              beforeRes.headers.get('content-type') || 'image/jpeg',
              req.file.mimetype,
            )
            updates['aiMetadata.data_source'] = 'ai'
            updates['aiMetadata.proofComparison'] = comparison
            await db.collection('issues').doc(id).collection('events').add({
              type: 'proof_comparison',
              actorId: 'vision-agent',
              payload: comparison,
              timestamp: new Date().toISOString(),
            })
          } catch (compareErr) {
            console.error('Proof comparison failed:', compareErr)
          }
        }
      } catch (e) {
        console.error('Proof upload failed:', e)
      }
    }

    if (status === 'Resolved' || status === 'Closed') {
      updates.slaBreached = false
    }

    await db.collection('issues').doc(id).update(updates)
    await db.collection('issues').doc(id).collection('events').add({
      type: 'status_change',
      actorId: req.user!.uid,
      payload: { status, hasProof: !!req.file },
      timestamp: new Date().toISOString(),
    })

    if (issueData.reporterId && issueData.status !== status) {
      const narrative = await runCitizenCommunicator(
        status,
        issueData.title || 'Your report',
        issueData.departmentId as string | undefined,
      )
      await notifyStatusChange(
        id,
        issueData.reporterId,
        status,
        issueData.title || 'Your report',
        { en: narrative.narrativeEn, hi: narrative.narrativeHi },
      )
    }

    res.json({ ok: true })
  } catch (e) {
    sendServerError(res, e)
  }
})
