import { useCallback, useEffect, useState } from 'react'
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Issue } from '../../../shared/types'
import { apiGetIssue } from './api'
import { getFirebaseDb, isFirebaseConfigured } from './firebase'

export type IssueEvent = {
  id?: string
  type: string
  timestamp: string
}

function docToIssue(id: string, data: Record<string, unknown>): Issue {
  return { id, ...data } as Issue
}

function normalizeEvents(raw: unknown[]): IssueEvent[] {
  return raw
    .map((e) => {
      const row = e as Record<string, unknown>
      const type = typeof row.type === 'string' ? row.type : 'update'
      const timestamp =
        typeof row.timestamp === 'string'
          ? row.timestamp
          : row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : ''
      return { id: typeof row.id === 'string' ? row.id : undefined, type, timestamp }
    })
    .filter((e) => e.timestamp)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function useLiveIssue(issueId: string | undefined) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [events, setEvents] = useState<IssueEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  const loadViaApi = useCallback(() => {
    if (!issueId) return Promise.resolve()
    return apiGetIssue(issueId)
      .then((r) => {
        setIssue(r.issue)
        setEvents(normalizeEvents(r.events))
      })
      .catch(() => {
        setIssue(null)
        setEvents([])
      })
      .finally(() => setLoading(false))
  }, [issueId])

  useEffect(() => {
    if (!issueId) {
      setIssue(null)
      setEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    const db = getFirebaseDb()
    let unsubIssue: (() => void) | undefined
    let unsubEvents: (() => void) | undefined

    if (isFirebaseConfigured && db) {
      setLive(true)
      unsubIssue = onSnapshot(
        doc(db, 'issues', issueId),
        (snap) => {
          if (snap.exists()) {
            setIssue(docToIssue(snap.id, snap.data() as Record<string, unknown>))
          } else {
            setIssue(null)
          }
          setLoading(false)
        },
        () => {
          setLive(false)
          void loadViaApi()
        },
      )

      unsubEvents = onSnapshot(
        query(collection(db, 'issues', issueId, 'events'), orderBy('timestamp', 'asc')),
        (snap) => {
          setEvents(
            snap.docs.map((d) => {
              const data = d.data()
              return {
                id: d.id,
                type: String(data.type ?? 'update'),
                timestamp: String(data.timestamp ?? ''),
              }
            }),
          )
        },
        () => {
          void loadViaApi()
        },
      )
    } else {
      setLive(false)
      void loadViaApi()
    }

    return () => {
      unsubIssue?.()
      unsubEvents?.()
    }
  }, [issueId, loadViaApi])

  return { issue, events, loading, live, refresh: loadViaApi }
}
