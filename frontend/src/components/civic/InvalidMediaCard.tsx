import { AlertCircle, Camera } from 'lucide-react'
import { GlassCard } from './GlassCard'

export type InvalidMediaReason = 'not-image' | 'too-large'

const MESSAGES: Record<InvalidMediaReason, string> = {
  'not-image': 'Please choose a photo file (JPEG, PNG, or WebP).',
  'too-large': 'This image is over 10 MB. Choose a smaller photo or take a new one.',
}

export function InvalidMediaCard({
  reason,
  onRetake,
}: {
  reason: InvalidMediaReason
  onRetake: () => void
}) {
  return (
    <GlassCard className="border-sev-critical/30 bg-sev-critical/10">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 shrink-0 text-sev-critical" />
        <div>
          <p className="text-sm font-bold text-sev-critical">Invalid media</p>
          <p className="mt-1 text-xs text-ink-muted">{MESSAGES[reason]}</p>
          <button
            type="button"
            onClick={onRetake}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-coral"
          >
            <Camera className="size-3.5" /> Retake photo
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
