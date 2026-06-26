import { Router } from 'express'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'
import { z } from 'zod'
import { db } from '../lib/firebase-admin'
import { chatWithTools } from '../lib/gemini'
import { requireAuth, type AuthedRequest } from '../middleware/auth'
import { chatLimit } from '../middleware/rateLimit'
import { haversineKm } from '../lib/geo'
import { CATEGORIES, DEPARTMENTS } from '../types/shared'

export const aiRouter = Router()

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

function resolveDepartment(departmentId: string) {
  const key = departmentId.toLowerCase().replace(/\s+/g, '_') as keyof typeof DEPARTMENTS
  if (DEPARTMENTS[key]) {
    const dept = DEPARTMENTS[key]
    return {
      department_id: key,
      name: dept.name,
      sla_hours: dept.slaHours,
      contact: `${dept.name} helpline (demo)`,
      categories: [key],
    }
  }
  const match = CATEGORIES.find((c) => DEPARTMENTS[c].name.toLowerCase().includes(departmentId.toLowerCase()))
  if (match) {
    const dept = DEPARTMENTS[match]
    return {
      department_id: match,
      name: dept.name,
      sla_hours: dept.slaHours,
      contact: `${dept.name} helpline (demo)`,
      categories: [match],
    }
  }
  return {
    department_id: 'other',
    name: DEPARTMENTS.other.name,
    sla_hours: DEPARTMENTS.other.slaHours,
    contact: 'General civic helpline (demo)',
    categories: ['other'],
  }
}

aiRouter.post('/chat', requireAuth, chatLimit, async (req: AuthedRequest, res) => {
  try {
    const parsed = chatSchema.safeParse(req.body)
    if (!parsed.success) {
      sendError(res, 400, ErrorCodes.INVALID_MEDIA, 'Invalid chat request')
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
          wardId?: string
        }[]
        const searchLat = (args.lat as number) ?? lat
        const searchLng = (args.lng as number) ?? lng
        const statusFilter = args.status as string | undefined
        if (statusFilter) issues = issues.filter((i) => i.status === statusFilter)
        if (searchLat && searchLng) {
          const radius = (args.radius_km as number) || 5
          issues = issues
            .map((i) => ({ ...i, dist: haversineKm(searchLat, searchLng, i.lat, i.lng) }))
            .filter((i) => i.dist <= radius)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 10)
            .map(({ dist: _d, ...rest }) => rest)
        } else {
          issues = issues.slice(0, 10)
        }
        return issues
      }
      if (name === 'getMyReports') {
        const snap = await db.collection('issues').where('reporterId', '==', req.user!.uid).limit(10).get()
        return snap.docs.map((d) => ({ id: d.id, title: d.data().title, status: d.data().status }))
      }
      if (name === 'getIssueById') {
        const id = String(args.issue_id || args.id || '')
        const doc = await db.collection('issues').doc(id).get()
        if (!doc.exists) return { error: 'NOT_FOUND', id }
        const votes = await doc.ref.collection('votes').count().get()
        const events = await doc.ref.collection('events').orderBy('timestamp', 'desc').limit(5).get()
        return {
          id: doc.id,
          ...doc.data(),
          vote_count: votes.data().count,
          recent_events: events.docs.map((e) => ({ id: e.id, ...e.data() })),
        }
      }
      if (name === 'searchIssues') {
        const q = String(args.query || '').toLowerCase()
        const wardId = args.ward_id as string | undefined
        const snap = await db.collection('issues').limit(50).get()
        const ranked = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((i) => {
            const data = i as { title?: string; description?: string; category?: string; wardId?: string }
            if (wardId && data.wardId !== wardId) return false
            if (!q) return true
            const hay = `${data.title || ''} ${data.description || ''} ${data.category || ''}`.toLowerCase()
            return hay.includes(q)
          })
          .slice(0, 10)
        return ranked
      }
      if (name === 'getHotspots') {
        const wardFilter = args.ward_id as string | undefined
        const snap = await db.collection('issues').limit(100).get()
        const grid: Record<string, number> = {}
        for (const d of snap.docs) {
          const data = d.data()
          if (wardFilter && data.wardId !== wardFilter) continue
          const gh = (data.geohash || '').slice(0, 5)
          if (gh) grid[gh] = (grid[gh] || 0) + 1
        }
        return Object.entries(grid)
          .map(([geohash, count]) => ({ geohash, count, risk_score: Math.min(100, count * 12) }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }
      if (name === 'getDepartmentInfo') {
        return resolveDepartment(String(args.department_id || 'other'))
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
    sendServerError(res, e)
  }
})
