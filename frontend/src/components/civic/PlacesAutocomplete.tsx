import { useEffect, useRef } from 'react'
import { Autocomplete } from '@react-google-maps/api'
import { useGoogleMaps } from './GoogleMapsProvider'

type PlacesAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  className?: string
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address or place',
  className,
}: PlacesAutocompleteProps) {
  const { isLoaded, hasKey } = useGoogleMaps()
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    return () => {
      autocompleteRef.current = null
    }
  }, [])

  if (!hasKey || !isLoaded) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    )
  }

  return (
    <Autocomplete
      onLoad={(ac) => {
        autocompleteRef.current = ac
      }}
      onPlaceChanged={() => {
        const ac = autocompleteRef.current
        if (!ac) return
        const place = ac.getPlace()
        const loc = place.geometry?.location
        if (!loc) return
        const address = place.formatted_address || place.name || value
        onChange(address)
        onPlaceSelect({ lat: loc.lat(), lng: loc.lng(), address })
      }}
      options={{ fields: ['formatted_address', 'geometry', 'name'] }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </Autocomplete>
  )
}
