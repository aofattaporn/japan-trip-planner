import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function JoinTripPage() {
  const { shareCode } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState('loading') // 'loading' | 'success' | 'error'
  const [tripId, setTripId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function join() {
      const { data, error } = await supabase.rpc('join_trip_by_code', { p_code: shareCode })
      if (error) {
        setErrorMsg(
          error.message.includes('invalid_share_code')
            ? 'Invalid or expired share code.'
            : error.message
        )
        setState('error')
        return
      }
      setTripId(data)
      setState('success')
    }
    join()
  }, [shareCode])

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Joining trip…</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <p className="font-medium text-red-500">{errorMsg}</p>
          <Link to="/" className="mt-4 text-sm text-red-600 underline block">Back to my trips</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="font-semibold text-gray-800 text-lg">You've joined the trip!</p>
        <p className="text-gray-400 text-sm mt-1">You can now view and edit this trip together.</p>
        <button
          onClick={() => navigate(`/trips/${tripId}`)}
          className="mt-5 bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          Open trip
        </button>
      </div>
    </div>
  )
}
