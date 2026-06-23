import { Router } from 'express'
import { reverseGeocodeServer } from '../lib/geo'

export const geoRouter = Router()

geoRouter.get('/reverse', async (req, res) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: 'lat and lng required' })
      return
    }
    const place = await reverseGeocodeServer(lat, lng)
    res.json({ ...place, lat, lng })
  } catch (e) {
    res.status(500).json({ error: String(e) })
  }
})
