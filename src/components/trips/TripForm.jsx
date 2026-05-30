import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { XIcon } from 'lucide-react'

export default function TripForm({ trip, userId, onSaved, onClose }) {
  const [name, setName] = useState(trip?.name || '')
  const [startDate, setStartDate] = useState(trip?.start_date || '')
  const [endDate, setEndDate] = useState(trip?.end_date || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (endDate < startDate) { setError('End date must be after start date'); return }
    setSaving(true)

    if (trip) {
      const { data, error: err } = await supabase
        .from('trips')
        .update({ name, start_date: startDate, end_date: endDate })
        .eq('id', trip.id)
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data, false)
    } else {
      const { data, error: err } = await supabase
        .from('trips')
        .insert({ name, start_date: startDate, end_date: endDate, user_id: userId })
        .select()
        .single()
      if (err) { setError(err.message); setSaving(false); return }
      onSaved(data, true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{trip ? 'Edit Trip' : 'New Trip'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={20} /></button>
        </div>
        <form onSubmit={submit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tokyo & Kyoto Spring 2025"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                required type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                required type="date"
                value={endDate}
                min={startDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : trip ? 'Save changes' : 'Create trip'}
          </button>
        </form>
      </div>
    </div>
  )
}
