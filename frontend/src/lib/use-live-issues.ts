import { useCallback, useEffect, useRef, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Issue } from '../../../shared/types'
import { apiListIssues } from './api'
import { haversineKm } from './geo'
import { getFirebaseDb, isFirebaseConfigured } from './firebase'
import { useIssueStore } from '../stores/useIssueStore'

export type LiveIssuesScope = 'nearby' | 'expanded' | 'all'

export type LiveIssuesOpts = {
  lat?: number
  lng?: number
  radiusKm?: number
  excludeDemo?: boolean
  fetchLimit?: number
  /** When geo filter returns 0, widen radius then show all issues. Default true. */
  geoFallback?: boolean
  /** Use REST API (geo-aware) instead of Firestore snapshot. Best for map. */
  preferApi?: boolean
}

function docToIssue(id: string, data: Record<string, unknown>): Issue {
  return { id, ...data } as Issue
}

function filterDemo(issues: Issue[]): Issue[] {
  return issues.filter((i) => !i.isDemo && i.reporterId !== 'demo-seed')
}

function isPublicIssue(issue: Issue): boolean {
  if (issue.status === 'Draft') return false
  const meta = issue.aiMetadata as { needs_review?: boolean } | undefined
  if (meta?.needs_review) return false
  return true
}

function applyBaseFilters(issues: Issue[], excludeDemo: boolean): Issue[] {
  let filtered = excludeDemo ? filterDemo(issues) : issues
  return filtered.filter(isPublicIssue)
}

function applyGeoFilter(issues: Issue[], lat?: number, lng?: number, radiusKm?: number): Issue[] {
  if (lat === undefined || lng === undefined || !radiusKm) return issues
  return issues.filter((i) => haversineKm(lat, lng, i.lat, i.lng) <= radiusKm)
}


export function useLiveIssues(opts: LiveIssuesOpts = {}) {
  const {
    lat,
    lng,
    radiusKm,
    excludeDemo = false,
    fetchLimit = 100,
    geoFallback = true,
    preferApi = false,
  } = opts
  const { issues, loading, livePulse, setIssues, setLoading, setLivePulse } = useIssueStore()
  const [scope, setScope] = useState<LiveIssuesScope>('all')
  const [error, setError] = useState<string | null>(null)
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const flashLive = useCallback(() => {
    setLivePulse(true)
    if (pulseTimer.current) clearTimeout(pulseTimer.current)
    pulseTimer.current = setTimeout(() => setLivePulse(false), 2000)
  }, [setLivePulse])

  const applyFilters = useCallback(
    (raw: Issue[]) => {
      let filtered = excludeDemo ? filterDemo(raw) : raw
      filtered = filtered.filter(isPublicIssue)

      if (lat !== undefined && lng !== undefined && radiusKm) {
        const nearby = applyGeoFilter(filtered, lat, lng, radiusKm)
        if (nearby.length > 0) {
          setScope('nearby')
          return nearby.slice(0, fetchLimit)
        }
        if (geoFallback) {
          const expanded = applyGeoFilter(filtered, lat, lng, Math.max(radiusKm * 5, 250))
          if (expanded.length > 0) {
            setScope('expanded')
            return expanded.slice(0, fetchLimit)
          }
          setScope('all')
          return filtered.slice(0, fetchLimit)
        }
        setScope('nearby')
        return []
      }

      setScope('all')
      return filtered.slice(0, fetchLimit)
    },
    [excludeDemo, lat, lng, radiusKm, fetchLimit, geoFallback],
  )

  const loadViaApi = useCallback(async () => {
    setError(null)
    try {
      const apiOpts = { includeDemo: !excludeDemo }

      if (lat !== undefined && lng !== undefined && radiusKm) {
        const nearby = await apiListIssues(fetchLimit, { ...apiOpts, lat, lng, radiusKm })
        let result = applyBaseFilters(nearby.issues, excludeDemo)
        if (result.length > 0) {
          setScope('nearby')
          setIssues(result.slice(0, fetchLimit))
          flashLive()
          return
        }

        if (geoFallback) {
          const expandedRadius = Math.max(radiusKm * 5, 250)
          const expanded = await apiListIssues(fetchLimit, { ...apiOpts, lat, lng, radiusKm: expandedRadius })
          result = applyBaseFilters(expanded.issues, excludeDemo)
          if (result.length > 0) {
            setScope('expanded')
            setIssues(result.slice(0, fetchLimit))
            flashLive()
            return
          }

          const all = await apiListIssues(fetchLimit, apiOpts)
          result = applyBaseFilters(all.issues, excludeDemo)
          setScope('all')
          setIssues(result.slice(0, fetchLimit))
          flashLive()
          return
        }

        setScope('nearby')
        setIssues([])
        return
      }

      const all = await apiListIssues(fetchLimit, apiOpts)
      const result = applyBaseFilters(all.issues, excludeDemo)
      setScope('all')
      setIssues(result.slice(0, fetchLimit))
      flashLive()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load issues')
      console.warn('[useLiveIssues] API load failed:', e)
    } finally {
      setLoading(false)
    }
  }, [fetchLimit, lat, lng, radiusKm, excludeDemo, geoFallback, flashLive, setIssues, setLoading])

  useEffect(() => {
    setLoading(true)
    const db = getFirebaseDb()
    let interval: ReturnType<typeof setInterval> | undefined
    let unsub: (() => void) | undefined

    const startPolling = () => {
      void loadViaApi()
      interval = setInterval(() => void loadViaApi(), 15_000)
    }

    // Firestore snapshot cannot geo-query; map view needs API for reliable nearby data.
    const useFirestore = isFirebaseConfigured && db && !preferApi && radiusKm === undefined

    if (useFirestore) {
      const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'), limit(fetchLimit))
      unsub = onSnapshot(
        q,
        (snap) => {
          const raw = snap.docs.map((d) => docToIssue(d.id, d.data() as Record<string, unknown>))
          setIssues(applyFilters(raw))
          setError(null)
          flashLive()
          setLoading(false)
        },
        () => startPolling(),
      )
    } else {
      startPolling()
    }

    const onFocus = () => void loadViaApi()
    window.addEventListener('focus', onFocus)
    return () => {
      unsub?.()
      if (interval) clearInterval(interval)
      window.removeEventListener('focus', onFocus)
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
    }
  }, [applyFilters, flashLive, fetchLimit, loadViaApi, preferApi, radiusKm, setIssues, setLoading])

  return { issues, loading, livePulse, scope, error, refresh: loadViaApi }
}
