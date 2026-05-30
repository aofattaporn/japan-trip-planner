import { useState } from 'react'
import ActivityItem from './ActivityItem'
import ActivityForm from './ActivityForm'
import { PlusIcon } from 'lucide-react'

export default function ActivityList({ activities, planId, onRefresh }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  function onSaved() {
    setFormOpen(false)
    setEditing(null)
    onRefresh()
  }

  function onDeleted() {
    onRefresh()
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Activities</h3>
        {planId && (
          <button
            onClick={() => { setEditing(null); setFormOpen(true) }}
            className="flex items-center gap-1 text-sm text-red-600 font-medium hover:bg-red-50 px-2 py-1 rounded-lg transition"
          >
            <PlusIcon size={14} /> Add
          </button>
        )}
      </div>

      {activities.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">
          No activities yet. Add one!
        </p>
      ) : (
        <ul>
          {activities.map(a => (
            <li key={a.id}>
              <ActivityItem
                activity={a}
                onEdit={() => { setEditing(a); setFormOpen(true) }}
                onDeleted={onDeleted}
              />
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <ActivityForm
          activity={editing}
          planId={planId}
          onSaved={onSaved}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      )}
    </div>
  )
}
