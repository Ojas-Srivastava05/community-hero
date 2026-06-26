const MIN_IMAGE_BYTES = 1024
const ALLOWED_IMAGE_MIMES = /^image\/(jpeg|png|webp|gif|heic|heif)$/i

/** Reject tiny uploads and uniformly-compressed blank frames. */
export function isLikelyBlankImage(buffer: Buffer): boolean {
  if (buffer.length < MIN_IMAGE_BYTES) return true

  const sampleCount = Math.min(2048, buffer.length)
  const step = Math.max(1, Math.floor(buffer.length / sampleCount))
  const samples: number[] = []
  for (let i = 0; i < buffer.length; i += step) {
    samples.push(buffer[i]!)
  }

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  const unique = new Set(samples).size

  return unique < 10 && variance < 120
}

export function validateImageBuffer(buffer: Buffer, mimeType: string): { ok: true } | { ok: false; reason: string } {
  if (buffer.length < MIN_IMAGE_BYTES) {
    return { ok: false, reason: 'Image too small or blank' }
  }
  if (!ALLOWED_IMAGE_MIMES.test(mimeType)) {
    return { ok: false, reason: 'Unsupported image type' }
  }
  if (isLikelyBlankImage(buffer)) {
    return { ok: false, reason: 'Image appears blank or invalid' }
  }
  return { ok: true }
}
