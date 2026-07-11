import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, MapPin } from 'lucide-react'
import { CivicMap } from '@/components/civic/CivicMap'
import { SeverityBadge } from '@/components/civic/SeverityBadge'
import { useLiveIssues } from '../lib/use-live-issues'
import { apiSeverityToUi, categoryLabel, issueArea, issueImage } from '@/lib/issue-ui'
import type { Issue } from '../../../shared/types'

/**
 * Embeddable map widget for RWAs / news sites.
 * Usage: <iframe src="https://…/embed/map?lat=12.97&lng=77.59" width="100%" height="560" />
 */
export function EmbedMapPage() {
  const [params] = useSearchParams()
  const lat = Number(params.get('lat')) || 12.9716
  const lng = Number(params.get('lng')) || 77.5946
  const radiusKm = Number(params.get('radius') || 25)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const { issues, loading } = useLiveIssues({
    lat,
    lng,
    radiusKm,
    fetchLimit: 80,
    preferApi: true,
    geoFallback: true,
  })

  const selected = useMemo(
    () => issues.find((i) => i.id === selectedId) as Issue | undefined,
    [issues, selectedId],
  )

  useEffect(() => {
    document.title = 'Community Hero · Live map embed'
  }, [])

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0B0F14] text-white">
      <CivicMap
        center={{ lat, lng }}
        zoom={13}
        issues={issues}
        selectedId={selectedId}
        onSelect={setSelectedId}
        className="absolute inset-0 size-full"
      />
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-3 pb-8 pt-3">
        <div className="flex items-center gap-2 text-xs font-bold">
          <MapPin className="size-3.5 text-[#E8773D]" />
          Community Hero
          {loading ? <span className="font-medium text-white/60">· loading…</span> : <span className="font-medium text-white/60">· {issues.length} issues</span>}
        </div>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-[#E8773D] px-3 py-1.5 text-[11px] font-bold text-white"
        >
          Open app <ExternalLink className="size-3" />
        </a>
      </div>
      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-20 overflow-hidden rounded-2xl border border-white/15 bg-[#151B23]/95 shadow-xl backdrop-blur">
          <Link to={`/issues/${selected.id}`} target="_blank" className="flex gap-3 p-3">
            <img
              src={issueImage(selected)}
              alt=""
              className="size-16 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <SeverityBadge severity={apiSeverityToUi(selected.severity)} />
              <p className="mt-1 truncate text-sm font-bold text-white">{selected.title}</p>
              <p className="truncate text-[11px] text-white/60">
                {categoryLabel(selected.category)} · {issueArea(selected)}
              </p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
