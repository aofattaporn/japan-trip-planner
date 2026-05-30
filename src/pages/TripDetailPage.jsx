import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, parseISO, addDays, eachDayOfInterval } from 'date-fns'
import DayList from '../components/days/DayList'
import PlanTabs from '../components/plans/PlanTabs'
import ActivityList from '../components/activities/ActivityList'
import BudgetSummary from '../components/budget/BudgetSummary'
import MapView from '../components/map/MapView'
import { ArrowLeftIcon, MapIcon, ListIcon } from 'lucide-react'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])    // [{id, date, active_plan_id, plans:[]}]
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [mobileTab, setMobileTab] = useState('plan') // 'plan' | 'map'

  // Load trip + days + plans
  useEffect(() => {
    async function init() {
      setLoading(true)

      const { data: tripData } = await supabase
        .from('trips').select('*').eq('id', tripId).single()
      if (!tripData) { navigate('/'); return }
      setTrip(tripData)

      // Fetch existing days
      const { data: existingDays } = await supabase
        .from('days')
        .select('*, plans(*)')
        .eq('trip_id', tripId)
        .order('date', { ascending: true })

      const dateRange = eachDayOfInterval({
        start: parseISO(tripData.start_date),
        end: parseISO(tripData.end_date),
      })

      // Auto-generate missing days
      let builtDays = []
      for (const date of dateRange) {
        const dateStr = format(date, 'yyyy-MM-dd')
        const found = existingDays?.find(d => d.date === dateStr)
        if (found) {
          builtDays.push({ ...found, plans: found.plans || [] })
        } else {
          // Create day
          const { data: newDay } = await supabase
            .from('days')
            .insert({ trip_id: tripId, date: dateStr })
            .select()
            .single()
          // Create default Plan A
          const { data: newPlan } = await supabase
            .from('plans')
            .insert({ day_id: newDay.id, name: 'Plan A' })
            .select()
            .single()
          // Set it as active
          await supabase
            .from('days')
            .update({ active_plan_id: newPlan.id })
            .eq('id', newDay.id)
          builtDays.push({ ...newDay, active_plan_id: newPlan.id, plans: [newPlan] })
        }
      }

      setDays(builtDays)
      setLoading(false)
    }
    init()
  }, [tripId])

  const selectedDay = days[selectedDayIdx]
  const activePlanId = selectedDay?.active_plan_id
  const activePlan = selectedDay?.plans?.find(p => p.id === activePlanId)

  // Load activities for active plan
  useEffect(() => {
    if (!activePlanId) { setActivities([]); return }
    supabase
      .from('activities')
      .select('*')
      .eq('plan_id', activePlanId)
      .order('time', { ascending: true, nullsFirst: false })
      .then(({ data }) => setActivities(data || []))
  }, [activePlanId])

  const refreshActivities = useCallback(async () => {
    if (!activePlanId) return
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('plan_id', activePlanId)
      .order('time', { ascending: true, nullsFirst: false })
    setActivities(data || [])
  }, [activePlanId])

  async function setActivePlan(dayId, planId) {
    await supabase.from('days').update({ active_plan_id: planId }).eq('id', dayId)
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, active_plan_id: planId } : d
    ))
  }

  async function addPlan(dayId) {
    const day = days.find(d => d.id === dayId)
    const nextName = `Plan ${String.fromCharCode(65 + (day?.plans?.length || 0))}`
    const { data: newPlan } = await supabase
      .from('plans')
      .insert({ day_id: dayId, name: nextName })
      .select()
      .single()
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, plans: [...(d.plans || []), newPlan] } : d
    ))
  }

  async function deletePlan(dayId, planId) {
    const day = days.find(d => d.id === dayId)
    if (day?.plans?.length <= 1) return // keep at least one plan
    await supabase.from('plans').delete().eq('id', planId)
    const remaining = day.plans.filter(p => p.id !== planId)
    let newActiveId = day.active_plan_id
    if (day.active_plan_id === planId) {
      newActiveId = remaining[0]?.id || null
      await supabase.from('days').update({ active_plan_id: newActiveId }).eq('id', dayId)
    }
    setDays(prev => prev.map(d =>
      d.id === dayId ? { ...d, plans: remaining, active_plan_id: newActiveId } : d
    ))
  }

  async function renamePlan(planId, dayId, newName) {
    await supabase.from('plans').update({ name: newName }).eq('id', planId)
    setDays(prev => prev.map(d =>
      d.id === dayId
        ? { ...d, plans: d.plans.map(p => p.id === planId ? { ...p, name: newName } : p) }
        : d
    ))
  }

  // Budget for all days (active plans only)
  const [allActivities, setAllActivities] = useState({})
  useEffect(() => {
    if (days.length === 0) return
    const planIds = days.map(d => d.active_plan_id).filter(Boolean)
    if (planIds.length === 0) return
    supabase
      .from('activities')
      .select('plan_id, price_jpy')
      .in('plan_id', planIds)
      .then(({ data }) => {
        const map = {}
        ;(data || []).forEach(a => {
          if (!map[a.plan_id]) map[a.plan_id] = 0
          map[a.plan_id] += Number(a.price_jpy || 0)
        })
        setAllActivities(map)
      })
  }, [days, activities]) // re-run when activities change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading trip...</p>
      </div>
    )
  }

  const dayTotals = days.map(d => ({
    date: d.date,
    total: allActivities[d.active_plan_id] || 0,
  }))
  const tripTotal = dayTotals.reduce((s, d) => s + d.total, 0)
  const todayTotal = allActivities[activePlanId] || 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-red-600 text-white px-4 py-3 flex items-center gap-3 shadow shrink-0">
        <button onClick={() => navigate('/')} className="hover:bg-red-700 p-1 rounded-lg transition">
          <ArrowLeftIcon size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-lg truncate">{trip?.name}</h1>
          <p className="text-red-200 text-xs">
            {format(parseISO(trip.start_date), 'MMM d')} – {format(parseISO(trip.end_date), 'MMM d, yyyy')}
          </p>
        </div>
        {/* Mobile tab toggle */}
        <div className="flex lg:hidden gap-1 bg-red-700 rounded-lg p-0.5">
          <button
            onClick={() => setMobileTab('plan')}
            className={`p-1.5 rounded-md transition ${mobileTab === 'plan' ? 'bg-white text-red-600' : 'text-red-200'}`}
          >
            <ListIcon size={16} />
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`p-1.5 rounded-md transition ${mobileTab === 'map' ? 'bg-white text-red-600' : 'text-red-200'}`}
          >
            <MapIcon size={16} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Day list sidebar */}
        <aside className="w-28 sm:w-36 border-r border-gray-200 bg-white overflow-y-auto shrink-0">
          <DayList
            days={days}
            selectedIdx={selectedDayIdx}
            onSelect={setSelectedDayIdx}
            dayTotals={dayTotals}
          />
        </aside>

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto flex flex-col ${mobileTab === 'map' ? 'hidden lg:flex' : 'flex'}`}>
          {selectedDay && (
            <>
              <PlanTabs
                day={selectedDay}
                onActivate={planId => setActivePlan(selectedDay.id, planId)}
                onAdd={() => addPlan(selectedDay.id)}
                onDelete={planId => deletePlan(selectedDay.id, planId)}
                onRename={(planId, name) => renamePlan(planId, selectedDay.id, name)}
              />
              <div className="flex-1 overflow-y-auto">
                <ActivityList
                  activities={activities}
                  planId={activePlanId}
                  onRefresh={refreshActivities}
                />
                <BudgetSummary
                  todayTotal={todayTotal}
                  tripTotal={tripTotal}
                  dayTotals={dayTotals}
                />
              </div>
            </>
          )}
        </main>

        {/* Map panel */}
        <aside className={`lg:w-96 xl:w-[480px] border-l border-gray-200 ${mobileTab === 'map' ? 'flex flex-1' : 'hidden lg:flex'}`}>
          <MapView activities={activities} />
        </aside>
      </div>
    </div>
  )
}
