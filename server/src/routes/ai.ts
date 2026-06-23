import { Router } from 'express'
import { z } from 'zod'
import { db } from '../lib/firebase-admin'
import { chatWithTools } from '../lib/gemini'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { chatLimit } from '../middleware/rateLimit'
import { haversineKm } from '../lib/geo'
import { DEPARTMENTS } from '../types/shared'

export const aiRouter = Router()

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

aiRouter.post('/chat', requireAuth, chatLimit, async (req: AuthedRequest, res) => {
  try {
    const parsed = chatSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }
    const { messages, lat, lng } = parsed.data

    const toolHandler = async (name: string, args: Record<string, unknown>) => {
      if (name === 'findNearbyIssues') {
        const snap = await db.collection('issues').limit(50).get()
        let issues = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
          id: string
          lat: number
          lng: number
          title: string
          status: string
          category: string
        }[]
        if (lat && lng) {
          const radius = (args.radius_km as number) || 5
          issues = issues
            .map((i) => ({ ...i, dist: haversineKm(lat, lng, i.lat, i.lng) }))
            .filter((i) => i.dist <= radius)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 8)
            .map(({ dist: _d, ...rest }) => rest)
        } else {
          issues = issues.slice(0, 8)
        }
        return issues
      }
      if (name === 'getMyReports') {
        const snap = await db.collection('issues').where('reporterId', '==', req.user!.uid).limit(10).get()
        return snap.docs.map((d) => ({ id: d.id, title: d.data().title, status: d.data().status }))
      }
      if (name === 'getIssueById') {
        const doc = await db.collection('issues').doc(String(args.id)).get()
        return doc.exists ? { id: doc.id, ...doc.data() } : null
      }
      if (name === 'searchIssues') {
        const q = String(args.query || '').toLowerCase()
        const snap = await db.collection('issues').limit(30).get()
        return snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((i) => {
            const data = i as { title?: string; description?: string; category?: string }
            return (
              data.title?.toLowerCase().includes(q) ||
              data.description?.toLowerCase().includes(q) ||
              data.category?.toLowerCase().includes(q)
            )
          })
          .slice(0, 8)
      }
      if (name === 'getHotspots') {
        const snap = await db.collection('issues').limit(100).get()
        const grid: Record<string, number> = {}
        for (const d of snap.docs) {
          const gh = (d.data().geohash || '').slice(0, 5)
          if (gh) grid[gh] = (grid[gh] || 0) + 1
        }
        return Object.entries(grid)
          .map(([geohash, count]) => ({ geohash, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }
      if (name === 'getDepartmentInfo') {
        const cat = String(args.category || 'other')
        const dept = DEPARTMENTS[cat as keyof typeof DEPARTMENTS]
        return dept || DEPARTMENTS.other
      }
      if (name === 'explainStatus') {
        const status = String(args.status || 'Submitted')
        const map: Record<string, string> = {
          Submitted: 'Your report was received and is awaiting community verification.',
          'Community Verified': 'Enough neighbors confirmed this issue. It is queued for the department.',
          Assigned: 'A civic department has been assigned to handle this.',
          'In Progress': 'Work is underway on this issue.',
          Resolved: 'The department marked this as fixed. You can reopen if still broken.',
          Closed: 'This issue is closed.',
        }
        return { status, explanation: map[status] || 'Status updated.' }
      }
      return null
    }

    const reply = await chatWithTools(messages, toolHandler)
    res.json({ reply })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
