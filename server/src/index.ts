import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'community-hero-api',
    phase: 1,
    timestamp: new Date().toISOString(),
    stack: ['Node.js', 'Express', 'Firebase Admin (Phase 2+)'],
  })
})

app.get('/api', (_req, res) => {
  res.json({
    name: 'Community Hero API',
    version: '0.1.0',
    docs: '/api/health',
  })
})

app.listen(PORT, () => {
  console.log(`Community Hero API listening on :${PORT}`)
})
