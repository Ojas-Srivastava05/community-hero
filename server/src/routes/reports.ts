import { Router } from 'express'
import multer from 'multer'
import { v4 as uuid } from 'uuid'
import ngeohash from 'ngeohash'
import { z } from 'zod'
import { db, bucket } from '../lib/firebase-admin'
import { analyzeImage } from '../lib/gemini'
import { runAgentPipeline } from '../lib/agents'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { CATEGORIES } from '../types/shared'

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

reportsRouter.post('/', requireAuth, upload.array('images', 3), async (req: AuthedRequest, res) => {
  try {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }
    const data = parsed.data
    const id = uuid()
    const imageUrls: string[] = []
    const files = (req.files as Express.Multer.File[]) || []

    for (const file of files) {
      const path = `issues/${id}/${uuid()}.${file.mimetype.split('/')[1] || 'jpg'}`
      const blob = bucket.file(path)
      await blob.save(file.buffer, { metadata: { contentType: file.mimetype } })
      await blob.makePublic()
      imageUrls.push(`https://storage.googleapis.com/${bucket.name}/${path}`)
    }

    const now = new Date().toISOString()
    const issue = {
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      status: 'Submitted',
      lat: data.lat,
      lng: data.lng,
      address: data.address || '',
      geohash: ngeohash.encode(data.lat, data.lng, 7),
      wardId: 'Koramangala',
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
    await runAgentPipeline(id, analysis, data.lat, data.lng, req.user!.uid)

    const saved = await db.collection('issues').doc(id).get()
    res.status(201).json({ id, issue: { id, ...saved.data() } })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const status = req.query.status as string | undefined
    let q = db.collection('issues').orderBy('createdAt', 'desc').limit(limit)
    if (status) q = db.collection('issues').where('status', '==', status).orderBy('createdAt', 'desc').limit(limit)
    const snap = await q.get()
    const issues = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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

reportsRouter.post('/:id/upvote', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const id = String(req.params.id)
    const { processUpvote } = await import('../lib/agents')
    const result = await processUpvote(id, req.user!.uid)
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})

reportsRouter.patch('/:id/status', requireAuth, async (req: AuthedRequest, res) => {
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
    const updates: Record<string, string> = {
      status,
      updatedAt: new Date().toISOString(),
    }
    if (status === 'Resolved' || status === 'Closed') updates.resolvedAt = new Date().toISOString()
    await db.collection('issues').doc(id).update(updates)
    await db.collection('issues').doc(id).collection('events').add({
      type: 'status_change',
      actorId: req.user!.uid,
      payload: { status },
      timestamp: new Date().toISOString(),
    })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
