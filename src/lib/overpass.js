const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

export async function fetchNearbyStations(lat, lng, radiusMeters = 800) {
  const query = `
    [out:json][timeout:10];
    (
      node["railway"="station"](around:${radiusMeters},${lat},${lng});
      node["railway"="halt"](around:${radiusMeters},${lat},${lng});
    );
    out body;
  `
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  const data = await res.json()
  return data.elements.map(el => ({
    id: el.id,
    name: el.tags?.['name:en'] || el.tags?.name || 'Station',
    lat: el.lat,
    lng: el.lon,
  }))
}
