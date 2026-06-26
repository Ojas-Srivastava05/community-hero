import { Router } from 'express'
import path from 'path'
import { reverseGeocodeServer } from '../lib/geo'
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

geoRouter.get('/wards', (_req, res) => {
  const file = path.resolve(__dirname, '../../../public/ward-geojson.json')
  res.sendFile(file, (err) => {
    if (err) sendError(res, 404, ErrorCodes.NOT_FOUND, 'Ward GeoJSON not found')
  })
})
