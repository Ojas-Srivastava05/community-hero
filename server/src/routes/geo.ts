import { Router } from 'express'
import { resolvePublicPath } from '../lib/public-path'
import { reverseGeocodeServer, searchPlacesServer } from '../lib/geo'
import { runWithGeocodeCache } from '../lib/geocode-cache'
import { sendError, ErrorCodes, sendServerError } from '../lib/errors'

export const geoRouter = Router()

geoRouter.get('/reverse', async (req, res) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      sendError(res, 400, ErrorCodes.GPS_REQUIRED, 'lat and lng required')
      return
    }
    const place = await runWithGeocodeCache(() => reverseGeocodeServer(lat, lng))
    res.json({ ...place, lat, lng })
  } catch (e) {
    sendServerError(res, e)
  }
})

geoRouter.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (q.length < 3) {
      res.json({ results: [] })
      return
    }
    const lat = req.query.lat !== undefined ? Number(req.query.lat) : undefined
    const lng = req.query.lng !== undefined ? Number(req.query.lng) : undefined
    const results = await searchPlacesServer(q, lat, lng)
    res.json({ results })
  } catch (e) {
    sendServerError(res, e)
  }
})

geoRouter.get('/wards', (_req, res) => {
  const file = resolvePublicPath('ward-geojson.json')
  res.type('application/json')
  res.sendFile(file, (err) => {
    if (err) sendError(res, 404, ErrorCodes.NOT_FOUND, 'Ward GeoJSON not found')
  })
})
