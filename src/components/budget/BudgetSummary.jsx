import { WalletIcon } from 'lucide-react'

export default function BudgetSummary({ todayTotal, tripTotal, dayTotals }) {
  return (
    <div className="bg-white mx-3 my-3 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-orange-50">
        <WalletIcon size={16} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-orange-700">Budget</h3>
      </div>
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">Today (active plan)</p>
          <p className="text-xl font-bold text-gray-800 mt-0.5">¥{todayTotal.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total trip</p>
          <p className="text-xl font-bold text-orange-600 mt-0.5">¥{tripTotal.toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}
