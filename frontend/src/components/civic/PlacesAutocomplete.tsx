import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Loader2, MapPin, Search } from 'lucide-react'
import { apiGeoSearch, type GeoSearchResult } from '@/lib/api'
import { cn } from '@/lib/utils'

type PlacesAutocompleteProps = {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: { lat: number; lng: number; address: string }) => void
  placeholder?: string
  className?: string
  /** Bias search near current map pin / GPS */
  bias?: { lat: number; lng: number }
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search address or place',
  className,
  bias,
}: PlacesAutocompleteProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<GeoSearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [searchError, setSearchError] = useState<string | null>(null)

  const runSearch = useCallback(
    async (query: string) => {
      const q = query.trim()
      if (q.length < 3) {
        setResults([])
        setOpen(false)
        setSearchError(null)
        return
      }
      setLoading(true)
      setSearchError(null)
      try {
        const found = await apiGeoSearch(q, bias)
        setResults(found)
        setOpen(found.length > 0)
        setActiveIndex(found.length > 0 ? 0 : -1)
        if (found.length === 0) setSearchError('No places found — try a landmark or tap the map')
      } catch {
        setResults([])
        setOpen(false)
        setSearchError('Search unavailable — tap the map to drop your pin')
      } finally {
        setLoading(false)
      }
    },
    [bias],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const pick = (place: GeoSearchResult) => {
    onChange(place.address)
    onPlaceSelect({ lat: place.lat, lng: place.lng, address: place.address })
    setOpen(false)
    setResults([])
    setSearchError(null)
  }

  const onInputChange = (next: string) => {
    onChange(next)
    setSearchError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(next), 320)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const place = results[activeIndex]
      if (place) pick(place)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <input
          value={value}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(className, 'pl-9 pr-9')}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-muted" />
        )}
      </div>

      {searchError && !loading && (
        <p className="mt-1.5 text-[11px] text-amber">{searchError}</p>
      )}

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-2xl border border-rule bg-paper py-1 shadow-lg"
        >
          {results.map((place, idx) => (
            <li key={`${place.lat}-${place.lng}-${idx}`} role="option" aria-selected={idx === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm text-ink hover:bg-coral-soft/40',
                  idx === activeIndex && 'bg-coral-soft/50',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(place)}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-coral" />
                <span className="line-clamp-2">{place.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
