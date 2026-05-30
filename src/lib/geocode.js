export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return []
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: 6,
    addressdetails: 1,
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'Accept-Language': 'en,th;q=0.9,ja;q=0.8' },
  })
  return res.json()
}
