export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_WIDTH = 1280

export type MediaValidation = 'ok' | 'not-image' | 'too-large' | 'blank'

export function validateImageFile(file: File): MediaValidation {
  if (!file.type.startsWith('image/')) return 'not-image'
  if (file.size > MAX_IMAGE_BYTES) return 'too-large'
  return 'ok'
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/** Detect uniform/blank frames after decode (Section 20.4). */
export async function isBlankImage(file: File): Promise<boolean> {
  try {
    const img = await loadImage(file)
    const sampleW = Math.min(64, img.width)
    const sampleH = Math.min(64, img.height)
    const canvas = document.createElement('canvas')
    canvas.width = sampleW
    canvas.height = sampleH
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.drawImage(img, 0, 0, sampleW, sampleH)
    const { data } = ctx.getImageData(0, 0, sampleW, sampleH)
    let sum = 0
    let sumSq = 0
    const pixels = sampleW * sampleH
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i]! + data[i + 1]! + data[i + 2]!) / 3
      sum += gray
      sumSq += gray * gray
    }
    const mean = sum / pixels
    const variance = sumSq / pixels - mean * mean
    return variance < 12
  } catch {
    return false
  }
}

async function resizeImageToWebp(file: File, maxWidth: number): Promise<Blob> {
  const img = await loadImage(file)
  const scale = img.width > maxWidth ? maxWidth / img.width : 1
  const w = Math.round(img.width * scale)
  const h = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(img, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob) throw new Error('WebP conversion failed')
  return blob
}

/** Resize to max 1280px width and convert to WebP (Section 4.4 / 5.1). */
export async function preprocessImageForUpload(file: File): Promise<File> {
  const blob = await resizeImageToWebp(file, MAX_IMAGE_WIDTH)
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
  return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() })
}

export async function validateAndPreprocessImage(file: File): Promise<{ ok: true; file: File } | { ok: false; reason: Exclude<MediaValidation, 'ok'> }> {
  const basic = validateImageFile(file)
  if (basic !== 'ok') return { ok: false, reason: basic }
  try {
    const processed = await preprocessImageForUpload(file)
    if (await isBlankImage(processed)) return { ok: false, reason: 'blank' }
    return { ok: true, file: processed }
  } catch {
    if (await isBlankImage(file)) return { ok: false, reason: 'blank' }
    return { ok: true, file }
  }
}
