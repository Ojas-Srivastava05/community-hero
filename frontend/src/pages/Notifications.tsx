import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, ChevronRight } from 'lucide-react'
import { AppShell, PageHeader } from '@/components/layout/AppShell'
import { GlassCard } from '@/components/civic/GlassCard'
import { PageSkeleton } from '@/components/PageSkeleton'
import { useAuth } from '../lib/auth'
import { apiListNotifications, apiMarkAllNotificationsRead, apiMarkNotificationRead } from '../lib/api'
import { fadeUp, stagger } from '../lib/motion'
import { cn } from '@/lib/utils'

type NotificationItem = {
  id: string
  title: string
  body: string
  issueId?: string
  type?: string
  read?: boolean
  createdAt: string
}

export function NotificationsPage() {
  const { user, signInWithDemo, signingIn } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const data = await apiListNotifications(token)
      setItems(data.notifications as NotificationItem[])
      setUnread(data.unreadCount)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user])

  const markRead = async (id: string) => {
    if (!user) return
    const token = await user.getIdToken()
    await apiMarkNotificationRead(id, token)
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    setUnread((c) => Math.max(0, c - 1))
  }

  const markAll = async () => {
    if (!user || markingAll) return
    setMarkingAll(true)
    try {
      const token = await user.getIdToken()
      await apiMarkAllNotificationsRead(token)
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    } finally {
      setMarkingAll(false)
    }
  }

  if (!user) {
    return (
      <AppShell>
        <PageHeader title="Notifications" subtitle="Status updates on your reports" />
        <div className="px-5 pt-8 text-center">
          <Bell className="mx-auto size-10 text-ink-muted" />
          <p className="mt-3 text-sm text-ink-muted">Sign in to see issue status alerts.</p>
          <button
            type="button"
            disabled={signingIn}
            onClick={() => signInWithDemo('citizen')}
            className="mt-4 rounded-full bg-coral px-5 py-2 text-sm font-bold text-paper"
          >
            Enter as demo citizen
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
        right={
          unread > 0 ? (
            <button
              type="button"
              disabled={markingAll}
              onClick={markAll}
              className="flex items-center gap-1 rounded-full border border-rule px-3 py-1 text-[10px] font-bold text-ink"
            >
              <CheckCheck className="size-3" />
              Mark all
            </button>
          ) : null
        }
      />
      {loading ? (
        <PageSkeleton />
      ) : items.length === 0 ? (
        <div className="px-5 pt-8 text-center">
          <p className="text-sm text-ink-muted">No notifications yet. Report an issue to get status updates.</p>
          <Link to="/report" className="mt-4 inline-block text-sm font-bold text-coral">
            Report an issue →
          </Link>
        </div>
      ) : (
        <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2 px-5 pt-4">
          {items.map((n) => (
            <motion.li key={n.id} variants={fadeUp}>
              <GlassCard
                className={cn('p-4', !n.read && 'border border-coral/30 bg-coral-soft/15')}
                onClick={() => {
                  if (!n.read) void markRead(n.id)
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    <p className="mt-1 text-xs text-ink-muted">{n.body}</p>
                    <p className="mt-2 text-[10px] text-ink-muted">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-coral" />}
                </div>
                {n.issueId && (
                  <Link
                    to={`/issues/${n.issueId}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-coral"
                    onClick={() => {
                      if (!n.read) void markRead(n.id)
                    }}
                  >
                    View issue <ChevronRight className="size-3" />
                  </Link>
                )}
              </GlassCard>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </AppShell>
  )
}
