import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ACTIVITY_TYPES } from '../../lib/constants'
import { PencilIcon, TrashIcon, MapPinIcon, XIcon } from 'lucide-react'

export default function ActivityItem({ activity, onEdit, onDeleted }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const meta = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.other

  async function del() {
    setSheetOpen(false)
    if (!confirm(`Delete "${activity.title}"?`)) return
    await supabase.from('activities').delete().eq('id', activity.id)
    onDeleted(activity.id)
  }

  function handleEdit() {
    setSheetOpen(false)
    onEdit()
  }

  return (
    <>
      {/* Row — tap to open bottom sheet */}
      <div
        onClick={() => setSheetOpen(true)}
        className="flex items-center gap-3 py-3 px-4 border-b border-gray-100 last:border-0 cursor-pointer active:bg-gray-50 transition"
      >
        <div className="w-12 shrink-0 text-right">
          <span className="text-xs text-gray-400 font-mono">
            {activity.time ? activity.time.slice(0, 5) : '—'}
          </span>
        </div>

        <span className="text-lg leading-none shrink-0">{meta.emoji}</span>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{activity.title}</p>
          {activity.note && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{activity.note}</p>
          )}
          {activity.lat && activity.lng && (
            <span className="inline-flex items-center gap-0.5 text-xs text-blue-400 mt-0.5">
              <MapPinIcon size={10} /> pinned
            </span>
          )}
        </div>

        {activity.price_jpy != null && (
          <span className="text-sm font-semibold text-orange-600 shrink-0">
            ¥{Number(activity.price_jpy).toLocaleString()}
          </span>
        )}

        {/* Tap hint */}
        <span className="text-gray-300 text-xs shrink-0">›</span>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-t-2xl px-4 pt-4 pb-10 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle + close */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{meta.emoji}</span>
                <div>
                  <p className="font-semibold text-gray-800">{activity.title}</p>
                  {activity.time && (
                    <p className="text-xs text-gray-400">{activity.time.slice(0, 5)}</p>
                  )}
                </div>
              </div>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100">
                <XIcon size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleEdit}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-gray-50 active:bg-blue-50 transition"
              >
                <PencilIcon size={18} className="text-blue-500 shrink-0" />
                <span className="font-medium text-gray-700">Edit activity</span>
              </button>
              <button
                onClick={del}
                className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl bg-gray-50 active:bg-red-50 transition"
              >
                <TrashIcon size={18} className="text-red-500 shrink-0" />
                <span className="font-medium text-red-500">Delete activity</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
