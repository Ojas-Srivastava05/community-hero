const DB_NAME = 'community-hero-queue'
const STORE = 'pending-reports'
const DB_VERSION = 2

export type QueuedReport = {
  id: string
  createdAt: string
  data: Record<string, string | number | boolean | undefined>
  imageDataUrl?: string
  imageName?: string
  imageType?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
  })
}

function dataUrlToFile(dataUrl: string, name: string, type: string): File {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta?.match(/data:(.*?);/)?.[1] || type
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: mime })
}

export async function queueOfflineReport(
  data: QueuedReport['data'],
  imageFile?: File | null,
): Promise<string> {
  let imageDataUrl: string | undefined
  let imageName: string | undefined
  let imageType: string | undefined
  if (imageFile) {
    imageDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(imageFile)
    })
    imageName = imageFile.name
    imageType = imageFile.type
  }
  const id = crypto.randomUUID()
  const item: QueuedReport = {
    id,
    createdAt: new Date().toISOString(),
    data,
    imageDataUrl,
    imageName,
    imageType,
  }
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(item)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
  return id
}

export async function listQueuedReports(): Promise<QueuedReport[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      db.close()
      resolve((req.result as QueuedReport[]) || [])
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

export async function removeQueuedReport(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function flushOfflineQueue(
  submit: (data: QueuedReport['data'], file?: File) => Promise<void>,
): Promise<number> {
  const items = await listQueuedReports()
  let flushed = 0
  for (const item of items) {
    try {
      const file =
        item.imageDataUrl && item.imageName
          ? dataUrlToFile(item.imageDataUrl, item.imageName, item.imageType || 'image/jpeg')
          : undefined
      await submit(item.data, file)
      await removeQueuedReport(item.id)
      flushed++
    } catch {
      break
    }
  }
  return flushed
}

export function registerOfflineSync(
  submit: (data: QueuedReport['data'], file?: File) => Promise<void>,
): () => void {
  const run = () => {
    if (!navigator.onLine) return
    void flushOfflineQueue(submit)
  }
  window.addEventListener('online', run)
  run()
  return () => window.removeEventListener('online', run)
}
