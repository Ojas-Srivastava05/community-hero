export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_IMAGE_WIDTH = 1280

export type MediaValidation = 'ok' | 'not-image' | 'too-large'

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

/** Resize to max width and convert to WebP; falls back to original file on canvas failure. */
export async function preprocessImageForUpload(file: File): Promise<File> {
  try {
    const blob = await resizeImageToWebp(file, MAX_IMAGE_WIDTH)
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } catch {
    return file
  }
}
