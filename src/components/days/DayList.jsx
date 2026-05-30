import { format, parseISO, isToday } from 'date-fns'

export default function DayList({ days, selectedIdx, onSelect, dayTotals }) {
  return (
    <ul className="py-2">
      {days.map((day, i) => {
        const date = parseISO(day.date)
        const total = dayTotals?.[i]?.total || 0
        const selected = i === selectedIdx
        return (
          <li key={day.id}>
            <button
              onClick={() => onSelect(i)}
              className={`w-full text-left px-2 py-2.5 flex flex-col items-center border-l-4 transition
                ${selected
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                {format(date, 'EEE')}
              </span>
              <span className={`text-lg font-bold leading-none mt-0.5 ${selected ? 'text-red-600' : 'text-gray-800'}`}>
                {format(date, 'd')}
              </span>
              <span className="text-xs text-gray-400 mt-0.5">{format(date, 'MMM')}</span>
              {total > 0 && (
                <span className="text-xs text-orange-600 font-medium mt-1">
                  ¥{total.toLocaleString()}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
