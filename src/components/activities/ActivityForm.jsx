import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { TYPE_OPTIONS } from '../../lib/constants'
import { searchPlaces, selectPlace } from '../../lib/geocode'
import { XIcon, MapPinIcon, SearchIcon } from 'lucide-react'

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function SourceBadge({ source }) {
  return source === 'cache'
    ? <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Cache</span>
    : <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Google</span>
}

function PlaceSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [source, setSource] = useState('google')
  const [searching, setSearching] = useState(false)
  const [picking, setPicking] = useState(false)
  const [open, setOpen] = useState(false)
  const genRef = useRef(0)
  const wrapRef = useRef(null)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([])
      setOpen(false)
      setSearching(false)
      return
    }
    const gen = ++genRef.current
    setSearching(true)
    searchPlaces(debouncedQuery)
      .then(({ results: data, source: src }) => {
        if (gen !== genRef.current) return
        setResults(data)
        setSource(src)
        setOpen(data.length > 0)
      })
      .catch(() => {
        if (gen !== genRef.current) return
        setResults([])
        setOpen(false)
      })
      .finally(() => { if (gen === genRef.current) setSearching(false) })
  }, [debouncedQuery])

  useEffect(() => {
    function handle(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function pick(place) {
    setOpen(false)
    setPicking(true)
    try {
      const resolved = await selectPlace(place)
      onSelect({ name: resolved.name, lat: resolved.lat, lng: resolved.lng, display: resolved.display })
    } catch (err) {
      console.error('[pick] geocoding failed:', err)
      // Fall back: fill name only, no pin
      onSelect({ name: place.name, lat: null, lng: null, display: place.display })
    } finally {
      setQuery('')
      setResults([])
      setPicking(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search place name… (e.g. Senso-ji, Shibuya)"
          disabled={picking}
          className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-60"
        />
        {(searching || picking) && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">…</span>
        )}
      </div>
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {results.map((place, i) => (
            <li key={place.placeId || i}>
              <button
                type="button"
                onClick={() => pick(place)}
                className="w-full text-left px-3 py-2.5 hover:bg-red-50 text-sm border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 truncate flex-1">{place.name}</span>
                  <SourceBadge source={source} />
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{place.secondary || place.display}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ActivityForm({ activity, planId, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: activity?.title || '',
    time: activity?.time || '',
    type: activity?.type || 'attraction',
    note: activity?.note || '',
    price_jpy: activity?.price_jpy ?? '',
    lat: activity?.lat ?? null,
    lng: activity?.lng ?? null,
    locationName: activity?.lat ? 'Location set' : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const priceRequired = form.type === 'restaurant'

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function onPlaceSelect(place) {
    setForm(f => ({
      ...f,
      title: f.title || place.name,
      lat: place.lat,
      lng: place.lng,
      locationName: place.name,
    }))
  }

  function clearLocation() {
    setForm(f => ({ ...f, lat: null, lng: null, locationName: '' }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (priceRequired && !form.price_jpy) {
      setError('Price is required for restaurants')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title,
      time: form.time || null,
      type: form.type,
      note: form.note || null,
      price_jpy: form.price_jpy !== '' ? Number(form.price_jpy) : null,
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    }
    if (activity) {
      const { error: err } = await supabase
        .from('activities').update(payload).eq('id', activity.id)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase
        .from('activities').insert({ ...payload, plan_id: planId })
      if (err) { setError(err.message); setSaving(false); return }
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-800">{activity ? 'Edit Activity' : 'New Activity'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">

          {/* Place search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search place <span className="text-gray-400 font-normal">(auto-fills name + pin)</span>
            </label>
            <PlaceSearch onSelect={onPlaceSelect} />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              required value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Senso-ji Temple"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Time + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time" value={form.time}
                onChange={e => set('time', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (¥) {priceRequired && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number" min="0" step="1"
              value={form.price_jpy}
              onChange={e => set('price_jpy', e.target.value)}
              placeholder={priceRequired ? 'Required' : 'Optional'}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              rows={2} value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Reservation info, tips…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>

          {/* Location status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Map pin</label>
            {form.lat != null ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <MapPinIcon size={14} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 flex-1 truncate">{form.locationName || `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}`}</span>
                <button type="button" onClick={clearLocation} className="text-gray-400 hover:text-red-500">
                  <XIcon size={14} />
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                No pin — search a place above to set one automatically
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit" disabled={saving}
            className="bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : activity ? 'Save changes' : 'Add activity'}
          </button>
        </form>
      </div>
    </div>
  )
}
