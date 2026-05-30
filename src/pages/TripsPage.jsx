import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import TripForm from '../components/trips/TripForm'
import { format, parseISO } from 'date-fns'
import { PlusIcon, PencilIcon, TrashIcon, LogOutIcon, UserPlusIcon, XIcon } from 'lucide-react'

function JoinTripModal({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function join(e) {
    e.preventDefault()
    setJoining(true)
    setError('')
    const { data: tripId, error: err } = await supabase.rpc('join_trip_by_code', {
      p_code: code.trim().toUpperCase(),
    })
    if (err) {
      setError(err.message.includes('invalid_share_code') ? 'Invalid share code.' : err.message)
      setJoining(false)
      return
    }
    onJoined(tripId)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Join a Trip</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XIcon size={20} /></button>
        </div>
        <form onSubmit={join} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Share code</label>
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC12345"
              maxLength={8}
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={joining || code.trim().length < 4}
            className="bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
          >
            {joining ? 'Joining…' : 'Join Trip'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function TripsPage() {
  const { user, signOut } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const navigate = useNavigate()

  async function loadTrips() {
    const { data } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true })
    setTrips(data || [])
    setLoading(false)
  }

  useEffect(() => { loadTrips() }, [])

  async function deleteTrip(id, e) {
    e.stopPropagation()
    if (!confirm('Delete this trip and all its data?')) return
    await supabase.from('trips').delete().eq('id', id)
    setTrips(t => t.filter(x => x.id !== id))
  }

  function openEdit(trip, e) {
    e.stopPropagation()
    setEditing(trip)
    setFormOpen(true)
  }

  function onSaved(trip, isNew) {
    if (isNew) setTrips(t => [...t, trip])
    else setTrips(t => t.map(x => x.id === trip.id ? trip : x))
    setFormOpen(false)
    setEditing(null)
  }

  const nights = t => {
    const a = parseISO(t.start_date), b = parseISO(t.end_date)
    return Math.round((b - a) / 86400000)
  }

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🗾</span>
          <h1 className="text-xl font-bold tracking-tight">Japan Trip Planner</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setJoinOpen(true)}
            className="flex items-center gap-1 bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-red-800 transition"
          >
            <UserPlusIcon size={16} />
            Join
          </button>
          <button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="flex items-center gap-1 bg-white text-red-600 font-semibold px-3 py-1.5 rounded-lg text-sm hover:bg-red-50 transition"
          >
            <PlusIcon size={16} />
            New Trip
          </button>
          {/* User avatar + sign out */}
          <div className="flex items-center gap-2 border-l border-red-500 pl-3">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full border-2 border-white/40 object-cover" />
              : <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center text-sm font-bold">{displayName[0].toUpperCase()}</div>
            }
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-red-700 transition"
            >
              <LogOutIcon size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-gray-400 mt-16">Loading…</p>
        ) : trips.length === 0 ? (
          <div className="text-center mt-20 text-gray-400">
            <div className="text-5xl mb-3">✈️</div>
            <p className="text-lg font-medium">No trips yet</p>
            <p className="text-sm mt-1">Click "New Trip" to start planning</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trips.map(trip => {
              const isOwner = trip.user_id === user?.id
              return (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/trips/${trip.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-red-200 hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-800 text-lg group-hover:text-red-600 transition truncate">{trip.name}</h2>
                        {!isOwner && (
                          <span className="shrink-0 text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">Shared</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
                        <span className="ml-2 text-gray-400">· {nights(trip)} nights</span>
                      </p>
                    </div>
                    {isOwner && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={e => openEdit(trip, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        >
                          <PencilIcon size={15} />
                        </button>
                        <button
                          onClick={e => deleteTrip(trip.id, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {formOpen && (
        <TripForm
          trip={editing}
          userId={user?.id}
          onSaved={onSaved}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}

      {joinOpen && (
        <JoinTripModal
          onClose={() => setJoinOpen(false)}
          onJoined={tripId => { setJoinOpen(false); navigate(`/trips/${tripId}`) }}
        />
      )}
    </div>
  )
}
