import { Router } from 'express'
import { z } from 'zod'
import { db } from '../lib/firebase-admin'
import { chatWithTools } from '../lib/gemini'
import { requireAuth, type AuthedRequest } from '../middleware/auth'

export const aiRouter = Router()

const chatSchema = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.string() })),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

aiRouter.post('/chat', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const parsed = chatSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() })
      return
    }
    const { messages, lat, lng } = parsed.data

    const toolHandler = async (name: string, args: Record<string, unknown>) => {
      if (name === 'findNearbyIssues') {
        const snap = await db.collection('issues').limit(20).get()
        const issues = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (lat && lng) {
          return issues
            .map((i) => {
              const data = i as Record<string, unknown>
              return {
                ...i,
                dist: Math.hypot((data.lat as number) - lat, (data.lng as number) - lng) * 111,
              }
            })
            .filter((i) => i.dist < (args.radius_km as number || 1))
            .slice(0, 5)
        }
        return issues.slice(0, 5)
      }
      if (name === 'getMyReports') {
        const snap = await db.collection('issues').where('reporterId', '==', req.user!.uid).limit(10).get()
        return snap.docs.map((d) => ({ id: d.id, title: d.data().title, status: d.data().status }))
      }
      return null
    }

    const reply = await chatWithTools(messages, toolHandler)
    res.json({ reply })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
