import { supabase } from '../../lib/supabase'
import { ACTIVITY_TYPES } from '../../lib/constants'
import { PencilIcon, TrashIcon, MapPinIcon } from 'lucide-react'

export default function ActivityItem({ activity, onEdit, onDeleted }) {
  const meta = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.other

  async function del() {
    if (!confirm(`Delete "${activity.title}"?`)) return
    await supabase.from('activities').delete().eq('id', activity.id)
    onDeleted(activity.id)
  }

  return (
    <div className="flex items-start gap-3 py-3 px-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 group">
      {/* Time */}
      <div className="w-12 shrink-0 text-right">
        <span className="text-xs text-gray-400 font-mono">
          {activity.time ? activity.time.slice(0, 5) : '—'}
        </span>
      </div>

      {/* Emoji type */}
      <span className="text-lg leading-none mt-0.5 shrink-0">{meta.emoji}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm truncate">{activity.title}</p>
        {activity.note && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{activity.note}</p>
        )}
        {(activity.lat && activity.lng) && (
          <span className="inline-flex items-center gap-0.5 text-xs text-blue-400 mt-0.5">
            <MapPinIcon size={10} /> pinned
          </span>
        )}
      </div>

      {/* Price */}
      {activity.price_jpy != null && (
        <span className="text-sm font-semibold text-orange-600 shrink-0">
          ¥{Number(activity.price_jpy).toLocaleString()}
        </span>
      )}

      {/* Actions */}
      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
        <button onClick={onEdit} className="p-1 rounded text-gray-400 hover:text-blue-600">
          <PencilIcon size={14} />
        </button>
        <button onClick={del} className="p-1 rounded text-gray-400 hover:text-red-500">
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  )
}
