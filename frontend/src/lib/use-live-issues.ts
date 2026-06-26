import { useCallback, useEffect, useRef } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Issue } from '../../../shared/types'
import { apiListIssues } from './api'
import { haversineKm } from './geo'
import { getFirebaseDb, isFirebaseConfigured } from './firebase'
import { useIssueStore } from '../stores/useIssueStore'

export type LiveIssuesOpts = {
  lat?: number
  lng?: number
  radiusKm?: number
  excludeDemo?: boolean
  fetchLimit?: number
}

function docToIssue(id: string, data: Record<string, unknown>): Issue {
  return { id, ...data } as Issue
}

function filterDemo(issues: Issue[]): Issue[] {
  return issues.filter((i) => !i.isDemo && i.reporterId !== 'demo-seed')
}

function applyGeoFilter(issues: Issue[], lat?: number, lng?: number, radiusKm?: number): Issue[] {
  if (lat === undefined || lng === undefined || !radiusKm) return issues
  return issues.filter((i) => haversineKm(lat, lng, i.lat, i.lng) <= radiusKm)
}

export function useLiveIssues(opts: LiveIssuesOpts = {}) {
  const { lat, lng, radiusKm, excludeDemo = true, fetchLimit = 100 } = opts
  const { issues, loading, livePulse, setIssues, setLoading, setLivePulse } = useIssueStore()
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flashLive = useCallback(() => {
    setLivePulse(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setLivePulse(false), 2000)
  }, [setLivePulse])

  const applyFilters = useCallback(
    (raw: Issue[]) => {
      let filtered = excludeDemo ? filterDemo(raw) : raw
      filtered = applyGeoFilter(filtered, lat, lng, radiusKm)
      return filtered.slice(0, fetchLimit)
    },
    [excludeDemo, lat, lng, radiusKm, fetchLimit],
  )

  const loadViaApi = useCallback(() => {
    return apiListIssues(fetchLimit, {
      lat,
      lng,
      radiusKm,
      includeDemo: !excludeDemo,
    })
      .then((r) => {
        setIssues(r.issues)
        flashLive()
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchLimit, lat, lng, radiusKm, excludeDemo, flashLive, setIssues, setLoading])

  useEffect(() => {
    setLoading(true)
    const db = getFirebaseDb()
    let interval: ReturnType<typeof setInterval> | undefined
    let unsub: (() => void) | undefined

    const startPolling = () => {
      loadViaApi()
      interval = setInterval(loadViaApi, 15_000)
    }

    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(fetchLimit))
      unsub = onSnapshot(
        q,
        (snap) => {
          const raw = snap.docs.map((d) => docToIssue(d.id, d.data() as Record<string, unknown>))
          setIssues(applyFilters(raw))
          flashLive()
          setLoading(false)
        },
        () => startPolling(),
      )
    } else {
      startPolling()
    }

    const onFocus = () => loadViaApi()
    window.addEventListener('focus', onFocus)
    return () => {
      unsub?.()
      if (interval) clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
    }
  }, [applyFilters, flashLive, fetchLimit, loadViaApi, setIssues, setLoading])

  return { issues, loading, livePulse, refresh: loadViaApi }
}
