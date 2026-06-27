import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { runWithGeocodeCache } from './lib/geocode-cache'
import { reportsRouter } from './routes/reports'
import { analyticsRouter } from './routes/analytics'
import { aiRouter } from './routes/ai'
import { leaderboardRouter } from './routes/leaderboard'
import { geoRouter } from './routes/geo'
import { threadsRouter } from './routes/threads'
import { usersRouter } from './routes/users'
import { departmentsRouter } from './routes/departments'
const app = express()
const PORT = Number(process.env.PORT) || 3001
const isProd = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  runWithGeocodeCache(() => next())
})

const publicDir = path.resolve(__dirname, '../../public')
app.use('/public', express.static(publicDir))

const healthHandler = async (_req: express.Request, res: express.Response) => {
  let firestore = 'unknown'
  try {
    const { db } = await import('./lib/firebase-admin')
    await db.collection('issues').limit(1).get()
    firestore = 'connected'
  } catch {
    firestore = 'error'
  }
  res.json({
    status: firestore === 'connected' ? 'ok' : 'degraded',
    service: 'community-hero-api',
    phase: 19,
    firestore,
    timestamp: new Date().toISOString(),
    stack: ['Node.js', 'Express', 'Firebase Admin', 'Gemini', 'Google Maps'],
  })
}

app.get('/api/health', healthHandler)
app.get('/health', healthHandler)

app.get('/api', (_req, res) => {
  res.json({ name: 'Community Hero API', version: '1.0.0', docs: '/api/health' })
})

app.use('/api/reports', reportsRouter)
app.use('/api/internal', analyticsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/leaderboard', leaderboardRouter)
app.use('/api/geo', geoRouter)
app.use('/api/threads', threadsRouter)
app.use('/api/users', usersRouter)
app.use('/api/departments', departmentsRouter)

const frontendDist = path.resolve(__dirname, '../../frontend/dist')
const spaIndex = path.join(frontendDist, 'index.html')
if (isProd || fs.existsSync(spaIndex)) {
  app.use(express.static(frontendDist))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(spaIndex)
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Community Hero API listening on 0.0.0.0:${PORT}`)
})
