import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getCurrentPosition, locationLabel, reverseGeocode, type GeoPlace } from './geo'

type LocationState = GeoPlace & { label: string }

type LocationContextValue = {
  location: LocationState | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const LocationContext = createContext<LocationContextValue | null>(null)

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pos = await getCurrentPosition()
      const place = await reverseGeocode(pos.lat, pos.lng)
      setLocation({ ...place, label: locationLabel(place) })
    } catch (e) {
      setError(String(e))
      setLocation(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({ location, loading, error, refresh }),
    [location, loading, error, refresh],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}
