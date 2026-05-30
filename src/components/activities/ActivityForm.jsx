import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { TYPE_OPTIONS } from '../../lib/constants'
import { XIcon } from 'lucide-react'

export default function ActivityForm({ activity, planId, onSaved, onClose }) {
  const [form, setForm] = useState({
    title: activity?.title || '',
    time: activity?.time || '',
    type: activity?.type || 'attraction',
    note: activity?.note || '',
    price_jpy: activity?.price_jpy ?? '',
    lat: activity?.lat ?? '',
    lng: activity?.lng ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const priceRequired = form.type === 'restaurant'

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

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
      lat: form.lat !== '' ? Number(form.lat) : null,
      lng: form.lng !== '' ? Number(form.lng) : null,
    }
    if (activity) {
      const { data, error: err } = await supabase
        .from('activities').update(payload).eq('id', activity.id).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data)
    } else {
      const { data, error: err } = await supabase
        .from('activities').insert({ ...payload, plan_id: planId }).select().single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-800">{activity ? 'Edit Activity' : 'New Activity'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input
              required value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Senso-ji Temple"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              rows={2} value={form.note}
              onChange={e => set('note', e.target.value)}
              placeholder="Reservation info, tips…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (lat, lng)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number" step="any" value={form.lat}
                onChange={e => set('lat', e.target.value)}
                placeholder="35.6762"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <input
                type="number" step="any" value={form.lng}
                onChange={e => set('lng', e.target.value)}
                placeholder="139.6503"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Tip: right-click a place in Google Maps → copy coordinates</p>
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
