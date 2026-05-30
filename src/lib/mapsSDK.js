const KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

let promise = null

export function loadMapsSDK() {
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) { resolve(); return }
    console.log('[Google Maps] loading SDK')
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&language=en`
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  return promise
}
