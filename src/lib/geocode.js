import { loadMapsSDK } from './mapsSDK'

const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const LS_KEY = 'place_cache_v1'

function loadCache() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
function saveCache(cache) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cache)) } catch {}
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return { results: [], source: 'google' }

  await loadMapsSDK()
  const { AutocompleteSuggestion } = await window.google.maps.importLibrary('places')

  console.log('[Places API] autocomplete →', query)
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    includedRegionCodes: ['jp'],
    language: 'en',
  })

  const results = (suggestions || []).map(s => {
    const p = s.placePrediction
    return {
      placeId: p.placeId,
      name: p.mainText?.text || p.text?.text || '',
      secondary: p.secondaryText?.text || '',
      display: p.text?.text || '',
      lat: null,
      lng: null,
    }
  })

  return { results, source: 'google' }
}

export async function selectPlace(place) {
  const cache = loadCache()
  if (cache[place.placeId]?.lat != null) return cache[place.placeId]

  console.log('[Google Maps] geocode → place_id:', place.placeId, '|', place.name)
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?place_id=${encodeURIComponent(place.placeId)}&key=${KEY}`
  )
  const data = await res.json()
  const geo = data.results?.[0]

  if (!geo) throw new Error(`Geocoding returned no results (status: ${data.status})`)

  const entry = {
    placeId: place.placeId,
    name: place.name,
    secondary: place.secondary || '',
    lat: geo.geometry.location.lat,
    lng: geo.geometry.location.lng,
    display: geo.formatted_address || place.display,
  }

  const fresh = loadCache()
  fresh[place.placeId] = entry
  saveCache(fresh)
  return entry
}
