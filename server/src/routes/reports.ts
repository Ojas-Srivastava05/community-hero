import { Router } from 'express'
import multer from 'multer'
import { v4 as uuid } from 'uuid'
import ngeohash from 'ngeohash'
import { z } from 'zod'
import { db, bucket } from '../lib/firebase-admin'
import { analyzeImage } from '../lib/gemini'
import { runAgentPipeline } from '../lib/agents'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { reportLimit, upvoteLimit } from '../middleware/rateLimit'
import { deriveWardId, haversineKm, reverseGeocodeServer } from '../lib/geo'
import { upsertThreadForIssue } from './threads'
import { CATEGORIES, DEPARTMENTS } from '../types/shared'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })
export const reportsRouter = Router()

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.enum(CATEGORIES),
  severity: z.coerce.number().min(1).max(5),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  address: z.string().optional(),
  mergeIntoId: z.string().optional(),
})

reportsRouter.post('/analyze', requireAuth, upload.single('image'), async (req: AuthedRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image required' })
      return
    }
    const hint = req.body.hint as string | undefined
    const analysis = await analyzeImage(req.file.buffer, req.file.mimetype, hint)
    res.json({ analysis })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.post('/', requireAuth, reportLimit, upload.array('images', 3), async (req: AuthedRequest, res) => {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }
    const data = parsed.data

    if (data.mergeIntoId) {
      const target = await db.collection('issues').doc(data.mergeIntoId).get()
      if (!target.exists) {
        res.status(404).json({ error: 'Merge target not found' })
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
      const { awardPoints } = await import('../lib/agents')
      await awardPoints(req.user!.uid, 15, 'merge')
      res.status(201).json({ id: data.mergeIntoId, merged: true, issue: { id: data.mergeIntoId, ...target.data(), upvoteCount: count } })
      return
    }

    const geo = data.address
      ? { address: data.address, wardId: deriveWardId(data.address, data.lat, data.lng) }
      : await reverseGeocodeServer(data.lat, data.lng)

    const id = uuid()
    const imageUrls: string[] = []
    const files = (req.files as Express.Multer.File[]) || []

    for (const file of files) {
      try {
        const ext = file.mimetype.split('/')[1] || 'jpg'
        const path = `issues/${id}/${uuid()}.${ext}`
        const blob = bucket.file(path)
        await blob.save(file.buffer, { metadata: { contentType: file.mimetype } })
        try {
          await blob.makePublic()
          imageUrls.push(`https://storage.googleapis.com/${bucket.name}/${path}`)
        } catch {
          const [signedUrl] = await blob.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
          })
          imageUrls.push(signedUrl)
        }
      } catch (storageErr) {
        console.error('Image upload failed (report will save without photo):', storageErr)
      }
    }

    const geohash = ngeohash.encode(data.lat, data.lng, 7)
    const now = new Date().toISOString()
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

    const analysis = {
      category: data.category,
      severity: data.severity,
      title: data.title,
      description: data.description,
      department: '',
      safety_risk: data.severity >= 4,
      confidence: 0.9,
    }
    try {
      await runAgentPipeline(id, analysis, data.lat, data.lng, req.user!.uid, geo.wardId)
      await upsertThreadForIssue(id, geohash, data.title, data.category)
    } catch (agentErr) {
      console.error('Agent pipeline failed (report saved):', agentErr)
      await db.collection('issues').doc(id).update({
        departmentId: DEPARTMENTS[data.category]?.name || 'General Civic',
        updatedAt: new Date().toISOString(),
      })
    }

    const saved = await db.collection('issues').doc(id).get()
    const savedData = saved.data()!
    const dupes = (savedData.aiMetadata as { duplicate_suggestions?: { id: string; title: string }[] })?.duplicate_suggestions
    res.status(201).json({ id, issue: { id, ...savedData }, duplicateSuggestions: dupes || [] })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const status = req.query.status as string | undefined
    const lat = req.query.lat ? Number(req.query.lat) : undefined
    const lng = req.query.lng ? Number(req.query.lng) : undefined
    const radiusKm = req.query.radius_km ? Number(req.query.radius_km) : undefined

    const includeDemo = req.query.include_demo === '1'
    const fetchLimit = lat !== undefined && lng !== undefined ? Math.min(limit * 4, 100) : limit

    let q = db.collection('issues').orderBy('createdAt', 'desc').limit(fetchLimit)
    if (status) q = db.collection('issues').where('status', '==', status).orderBy('createdAt', 'desc').limit(fetchLimit)
    const snap = await q.get()
    let issues = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string
      lat: number
      lng: number
      isDemo?: boolean
      reporterId?: string
    }[]

    if (!includeDemo) {
      issues = issues.filter((i) => !i.isDemo && i.reporterId !== 'demo-seed')
    }

    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      const radius = radiusKm && Number.isFinite(radiusKm) ? radiusKm : 25
      issues = issues
        .map((i) => ({ ...i, _dist: haversineKm(lat, lng, i.lat, i.lng) }))
        .filter((i) => i._dist <= radius)
        .sort((a, b) => a._dist - b._dist)
        .map(({ _dist, ...rest }) => rest)
    }

    issues = issues.slice(0, limit)

    res.json({ issues })
  } catch (e) {
    res.status(500).json({ error: String(e) })
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
    res.status(500).json({ error: String(e) })
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
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.get('/:id', async (req, res) => {
  try {
    const doc = await db.collection('issues').doc(req.params.id).get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const events = await db
      .collection('issues')
      .doc(req.params.id)
      .collection('events')
      .orderBy('timestamp', 'asc')
      .get()
    res.json({
      issue: { id: doc.id, ...doc.data() },
      events: events.docs.map((d) => ({ id: d.id, ...d.data() })),
    })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.post('/:id/upvote', requireAuth, upvoteLimit, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const { processUpvote } = await import('../lib/agents')
    const result = await processUpvote(id, req.user!.uid)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.post('/:id/merge', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const sourceId = String(req.params.id)
    const { targetId } = req.body as { targetId?: string }
    if (!targetId) {
      res.status(400).json({ error: 'targetId required' })
      return
    }
    const [source, target] = await Promise.all([
      db.collection('issues').doc(sourceId).get(),
      db.collection('issues').doc(targetId).get(),
    ])
    if (!source.exists || !target.exists) {
      res.status(404).json({ error: 'Issue not found' })
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
    const { awardPoints } = await import('../lib/agents')
    await awardPoints(req.user!.uid, 15, 'merge')
    res.json({ ok: true, targetId, upvoteCount: count })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.post('/:id/reopen', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const doc = await db.collection('issues').doc(id).get()
    if (!doc.exists) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    const data = doc.data()!
    const admins = (process.env.ADMIN_EMAILS || '').split(',')
    const isReporter = data.reporterId === req.user!.uid
    const isAdmin = req.user!.email && admins.includes(req.user!.email)
    if (!isReporter && !isAdmin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    if (!['Resolved', 'Closed'].includes(data.status)) {
      res.status(400).json({ error: 'Only resolved/closed issues can be reopened' })
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
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.patch('/:id/status', requireAuth, upload.single('proof'), async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const { status } = req.body
    const admins = (process.env.ADMIN_UIDS || '').split(',')
    const adminEmails = (process.env.ADMIN_EMAILS || 'srivastavaojas454@gmail.com').split(',')
    const isAdmin =
      admins.includes(req.user!.uid) ||
      (req.user!.email && adminEmails.includes(req.user!.email))
    if (!isAdmin) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    }
    if (status === 'Resolved' || status === 'Closed') {
      updates.resolvedAt = new Date().toISOString()
      const issue = await db.collection('issues').doc(id).get()
      const reporterId = issue.data()?.reporterId
      if (reporterId) {
        const { awardPoints } = await import('../lib/agents')
        await awardPoints(reporterId, 25, 'resolved')
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
      } catch (e) {
        console.error('Proof upload failed:', e)
      }
    }

    await db.collection('issues').doc(id).update(updates)
    await db.collection('issues').doc(id).collection('events').add({
      type: 'status_change',
      actorId: req.user!.uid,
      payload: { status, hasProof: !!req.file },
      timestamp: new Date().toISOString(),
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
