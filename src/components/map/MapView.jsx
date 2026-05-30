import { useEffect, useRef, useState, useMemo } from 'react'
import { ACTIVITY_TYPES } from '../../lib/constants'
import { fetchNearbyStations } from '../../lib/overpass'
import { loadMapsSDK } from '../../lib/mapsSDK'

const DEFAULT_CENTER = { lat: 35.6762, lng: 139.6503 } // Tokyo

export default function MapView({ activities }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const activityMarkersRef = useRef([])
  const stationMarkersRef = useRef([])
  const infoWindowRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [stations, setStations] = useState([])

  const mapped = useMemo(
    () => activities.filter(a => a.lat != null && a.lng != null),
    [activities]
  )

  const center = useMemo(() => {
    if (mapped.length === 0) return DEFAULT_CENTER
    return {
      lat: mapped.reduce((s, a) => s + a.lat, 0) / mapped.length,
      lng: mapped.reduce((s, a) => s + a.lng, 0) / mapped.length,
    }
  }, [mapped])

  // Init map once
  useEffect(() => {
    let cancelled = false
    async function init() {
      await loadMapsSDK()
      if (cancelled || !containerRef.current) return
      const { Map } = await window.google.maps.importLibrary('maps')
      mapRef.current = new Map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: 14,
        mapId: 'DEMO_MAP_ID', // replace with a real Map ID from Google Cloud Console for production
      })
      infoWindowRef.current = new window.google.maps.InfoWindow()
      if (!cancelled) setMapReady(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Update activity markers whenever activities change
  useEffect(() => {
    if (!mapReady) return
    async function updateActivityMarkers() {
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker')

      activityMarkersRef.current.forEach(m => { m.map = null })
      activityMarkersRef.current = []

      if (mapped.length === 0) return
      mapRef.current.setCenter(center)

      mapped.forEach((activity, i) => {
        const meta = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.other
        const pin = document.createElement('div')
        pin.style.cssText = [
          `background:${meta.pinColor}`,
          'width:28px', 'height:28px', 'border-radius:50%',
          'display:flex', 'align-items:center', 'justify-content:center',
          'color:white', 'font-weight:700', 'font-size:12px',
          'box-shadow:0 2px 6px rgba(0,0,0,0.35)', 'border:2px solid white', 'cursor:pointer',
        ].join(';')
        pin.textContent = String(i + 1)

        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: activity.lat, lng: activity.lng },
          content: pin,
          title: activity.title,
        })

        marker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="font-size:13px;line-height:1.6">
              <strong>${activity.title}</strong>
              ${activity.time ? `<div style="color:#9ca3af">${activity.time.slice(0, 5)}</div>` : ''}
              ${activity.price_jpy != null ? `<div style="color:#ea580c;font-weight:600">¥${Number(activity.price_jpy).toLocaleString()}</div>` : ''}
              ${activity.note ? `<div style="color:#6b7280;font-size:11px;margin-top:2px">${activity.note}</div>` : ''}
            </div>
          `)
          infoWindowRef.current.open({ anchor: marker, map: mapRef.current })
        })

        activityMarkersRef.current.push(marker)
      })
    }
    updateActivityMarkers()
  }, [mapped, center, mapReady])

  // Fetch nearby train stations
  useEffect(() => {
    if (mapped.length === 0) { setStations([]); return }
    fetchNearbyStations(center.lat, center.lng, 1000)
      .then(setStations)
      .catch(() => {})
  }, [center, mapped.length])

  // Update station markers
  useEffect(() => {
    if (!mapReady) return
    async function updateStationMarkers() {
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker')

      stationMarkersRef.current.forEach(m => { m.map = null })
      stationMarkersRef.current = []

      stations.forEach(station => {
        const pin = document.createElement('div')
        pin.style.cssText = [
          'background:#0ea5e9', 'width:20px', 'height:20px', 'border-radius:4px',
          'display:flex', 'align-items:center', 'justify-content:center',
          'color:white', 'font-size:11px', 'box-shadow:0 1px 4px rgba(0,0,0,0.3)',
          'border:1.5px solid white', 'cursor:pointer',
        ].join(';')
        pin.textContent = '🚉'

        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: station.lat, lng: station.lng },
          content: pin,
          title: station.name,
        })

        marker.addListener('click', () => {
          infoWindowRef.current.setContent(`
            <div style="font-size:13px">
              <strong>${station.name}</strong>
              <div style="color:#9ca3af;font-size:11px">Train station</div>
            </div>
          `)
          infoWindowRef.current.open({ anchor: marker, map: mapRef.current })
        })

        stationMarkersRef.current.push(marker)
      })
    }
    updateStationMarkers()
  }, [stations, mapReady])

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: '16rem' }} />
}
