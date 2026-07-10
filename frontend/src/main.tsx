import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          worker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })
  } catch {
    /* offline / private mode */
  }
}

if (document.readyState === 'complete') {
  void registerServiceWorker()
} else {
  window.addEventListener('load', () => void registerServiceWorker())
}
