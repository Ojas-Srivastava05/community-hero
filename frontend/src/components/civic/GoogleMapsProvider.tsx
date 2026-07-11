import { createContext, useContext, type ReactNode } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const libraries = ['places'] as ('places')[]

type GoogleMapsContextValue = {
  isLoaded: boolean
  loadError: Error | undefined
  hasKey: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  loadError: undefined,
  hasKey: false,
})

export function useGoogleMaps() {
  return useContext(GoogleMapsContext)
}

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const hasKey = Boolean(MAPS_KEY && MAPS_KEY !== 'your-api-key')
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'civic-google-maps',
    googleMapsApiKey: hasKey ? MAPS_KEY! : '',
    libraries,
    preventGoogleFontsLoading: true,
  })

  return (
    <GoogleMapsContext.Provider value={{ isLoaded: hasKey && isLoaded, loadError, hasKey }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}
