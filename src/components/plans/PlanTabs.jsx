import { useState } from 'react'
import { PlusIcon, XIcon, PencilIcon, CheckIcon } from 'lucide-react'

export default function PlanTabs({ day, onActivate, onAdd, onDelete, onRename }) {
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')

  function startRename(plan) {
    setEditingId(plan.id)
    setEditName(plan.name)
  }

  function commitRename(plan) {
    if (editName.trim() && editName !== plan.name) onRename(plan.id, editName.trim())
    setEditingId(null)
  }

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-white overflow-x-auto shrink-0">
      {(day.plans || []).map(plan => {
        const isActive = plan.id === day.active_plan_id
        const isEditing = editingId === plan.id
        return (
          <div
            key={plan.id}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm shrink-0 transition
              ${isActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {isEditing ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(plan) }}
                  className="w-20 bg-transparent outline-none text-sm"
                />
                <button onClick={() => commitRename(plan)} className="text-green-600">
                  <CheckIcon size={13} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onActivate(plan.id)}
                  className="font-medium"
                >
                  {plan.name}
                </button>
                <button
                  onClick={() => startRename(plan)}
                  className="opacity-50 hover:opacity-100 ml-0.5"
                >
                  <PencilIcon size={11} />
                </button>
                {day.plans.length > 1 && (
                  <button
                    onClick={() => onDelete(plan.id)}
                    className="opacity-50 hover:opacity-100 hover:text-red-500"
                  >
                    <XIcon size={11} />
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
      <button
        onClick={onAdd}
        className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
        title="Add plan"
      >
        <PlusIcon size={15} />
      </button>
    </div>
  )
}
