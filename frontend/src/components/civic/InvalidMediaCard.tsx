import { AlertCircle, Camera } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { MAX_IMAGE_MB, MAX_VIDEO_MB } from '@/lib/shared-constants'

export type InvalidMediaReason = 'not-image' | 'too-large' | 'video-too-large' | 'blank'

const MESSAGES: Record<InvalidMediaReason, string> = {
  'not-image': 'Please choose a photo or video file (JPEG, PNG, WebP, or MP4).',
  'too-large': `This photo is over ${MAX_IMAGE_MB} MB. Choose a smaller image or take a new one.`,
  'video-too-large': `This video is over ${MAX_VIDEO_MB} MB. Trim it or record a shorter clip.`,
  blank: 'This photo looks blank or too dark. Retake with the issue clearly visible.',
}

export function InvalidMediaCard({
  reason,
  onRetake,
}: {
  reason: InvalidMediaReason
  onRetake: () => void
}) {
  const retakeLabel = reason === 'video-too-large' ? 'Choose another video' : 'Retake photo'
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
            <Camera className="size-3.5" /> {retakeLabel}
          </button>
        </div>
      </div>
    </GlassCard>
  )
}
