import { MAX_IMAGE_WIDTH, preprocessImageForUpload } from './image-media'
import { MAX_VIDEO_BYTES, MAX_VIDEO_MB } from '../../../shared/constants'

export { MAX_VIDEO_BYTES, MAX_VIDEO_MB }

export type VideoValidation = 'ok' | 'not-video' | 'too-large'

export function validateVideoFile(file: File): VideoValidation {
  if (!file.type.startsWith('video/')) return 'not-video'
  if (file.size > MAX_VIDEO_BYTES) return 'too-large'
  return 'ok'
}

function loadVideoElement(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.onloadeddata = () => resolve(video)
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video'))
    }
    video.src = url
  })
}

function seekVideo(video: HTMLVideoElement, timeSec: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 2 && Math.abs(video.currentTime - timeSec) < 0.05) {
      resolve()
      return
    }
    const timeout = window.setTimeout(() => {
      video.removeEventListener('seeked', onSeeked)
      reject(new Error('Video seek timeout'))
    }, 8000)
    const onSeeked = () => {
      window.clearTimeout(timeout)
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = Math.max(0, Math.min(timeSec, video.duration || timeSec))
  })
}

function captureFrame(video: HTMLVideoElement, maxWidth: number): Promise<Blob> {
  const w = video.videoWidth || 640
  const h = video.videoHeight || 480
  const scale = w > maxWidth ? maxWidth / w : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Frame capture failed'))),
      'image/webp',
      0.85,
    )
  })
}

/** Extract keyframes at 0%, 50%, and 100% of video duration as WebP files. */
export async function extractVideoKeyframes(videoFile: File): Promise<File[]> {
  const video = await loadVideoElement(videoFile)
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1
  const times = [0, duration * 0.5, Math.max(0, duration - 0.05)]
  const frames: File[] = []

  try {
    for (let i = 0; i < times.length; i++) {
      await seekVideo(video, times[i]!)
      const blob = await captureFrame(video, MAX_IMAGE_WIDTH)
      frames.push(
        new File([blob], `frame-${i}.webp`, { type: 'image/webp', lastModified: Date.now() }),
      )
    }
  } finally {
    if (video.src.startsWith('blob:')) URL.revokeObjectURL(video.src)
  }

  return Promise.all(frames.map((f) => preprocessImageForUpload(f)))
}
