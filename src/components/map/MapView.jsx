import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { fetchNearbyStations } from '../../lib/overpass'
import { ACTIVITY_TYPES } from '../../lib/constants'

// Fix Leaflet default icon issue with bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function makeActivityIcon(type, index) {
  const meta = ACTIVITY_TYPES[type] || ACTIVITY_TYPES.other
  return L.divIcon({
    className: '',
    html: `<div style="background:${meta.pinColor};width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.35);border:2px solid white">${index + 1}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const stationIcon = L.divIcon({
  className: '',
  html: `<div style="background:#0ea5e9;width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.3);border:1.5px solid white">🚉</div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Recenter map when activities change
function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

export default function MapView({ activities }) {
  const [stations, setStations] = useState([])

  const mapped = useMemo(
    () => activities.filter(a => a.lat != null && a.lng != null),
    [activities]
  )

  // Default center: Tokyo
  const center = useMemo(() => {
    if (mapped.length === 0) return [35.6762, 139.6503]
    const lat = mapped.reduce((s, a) => s + a.lat, 0) / mapped.length
    const lng = mapped.reduce((s, a) => s + a.lng, 0) / mapped.length
    return [lat, lng]
  }, [mapped])

  // Fetch stations around the centroid of mapped activities
  useEffect(() => {
    if (mapped.length === 0) { setStations([]); return }
    fetchNearbyStations(center[0], center[1], 1000)
      .then(setStations)
      .catch(() => {})
  }, [center, mapped.length])

  return (
    <div className="w-full h-full min-h-64">
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%', minHeight: '16rem' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />

        {mapped.map((a, i) => (
          <Marker key={a.id} position={[a.lat, a.lng]} icon={makeActivityIcon(a.type, i)}>
            <Popup>
              <div className="text-sm">
                <strong>{a.title}</strong>
                {a.time && <div className="text-gray-500">{a.time.slice(0,5)}</div>}
                {a.price_jpy != null && (
                  <div className="text-orange-600 font-semibold">¥{Number(a.price_jpy).toLocaleString()}</div>
                )}
                {a.note && <div className="text-gray-400 mt-1 text-xs">{a.note}</div>}
              </div>
            </Popup>
          </Marker>
        ))}

        {stations.map(s => (
          <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon}>
            <Popup>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-gray-400">Train station</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
