import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Flame, Award, Calendar, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { API_URL } from '../config'

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DailyTasks() {
  const [dailyTasks, setDailyTasks] = useState([])
  const [logs, setLogs] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Last 7 days helper for the weekly grid
  const getPastNDays = (n) => {
    const days = []
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        dateStr: getLocalDateString(d),
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        dateObj: d
      })
    }
    return days
  }

  const past7Days = getPastNDays(7)
  const past30Days = getPastNDays(30)
  const todayStr = getLocalDateString(new Date())

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${API_URL}/api/daily-tasks`)
      if (!res.ok) throw new Error('Failed to fetch daily tasks')
      const data = await res.json()
      setDailyTasks(data.tasks || [])
      setLogs(data.logs || [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Could not connect to database. Make sure you run the SQL migration script!')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Create new Daily Task (Habit)
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const res = await fetch(`${API_URL}/api/daily-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
      if (!res.ok) throw new Error('Failed to add daily task')
      const task = await res.json()
      setDailyTasks(prev => [...prev, task])
      setNewTitle('')
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Daily Task
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/daily-tasks/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete daily task')
      setDailyTasks(prev => prev.filter(t => t._id !== id))
      setLogs(prev => prev.filter(l => l.dailyTaskId !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle log completion status
  const handleToggle = async (taskId, dateStr) => {
    const isCurrentlyDone = logs.some(l => l.dailyTaskId === taskId && l.completedDate === dateStr && l.isCompleted)
    const nextStatus = !isCurrentlyDone

    try {
      // Optimistic update
      const tempLogId = Math.random().toString()
      const optimisticLog = { _id: tempLogId, dailyTaskId: taskId, completedDate: dateStr, isCompleted: nextStatus }
      
      setLogs(prev => {
        const filtered = prev.filter(l => !(l.dailyTaskId === taskId && l.completedDate === dateStr))
        return nextStatus ? [...filtered, optimisticLog] : filtered
      })

      const res = await fetch(`${API_URL}/api/daily-tasks/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyTaskId: taskId, date: dateStr, isCompleted: nextStatus })
      })
      if (!res.ok) throw new Error('Failed to toggle status')
      
      // Update with server log representation
      const actualLog = await res.json()
      setLogs(prev => prev.map(l => l._id === tempLogId ? actualLog : l))
    } catch (err) {
      console.error(err)
      // Revert state on error
      fetchData()
    }
  }

  // Completion calculation helper
  const getLogStatus = (taskId, dateStr) => {
    return logs.some(l => l.dailyTaskId === taskId && l.completedDate === dateStr && l.isCompleted)
  }

  // Stats Calculations
  const totalTasks = dailyTasks.length
  const completedToday = dailyTasks.filter(t => getLogStatus(t._id, todayStr)).length
  const completionRateToday = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0

  // Calculate Streak
  const calculateStreak = () => {
    if (totalTasks === 0) return 0
    let streak = 0
    let checkDate = new Date()

    while (true) {
      const dateStr = getLocalDateString(checkDate)
      const tasksDoneThisDay = dailyTasks.filter(t => getLogStatus(t._id, dateStr)).length
      
      // If today has no tasks completed yet, we can skip today and check yesterday to keep streak alive
      if (dateStr === todayStr && tasksDoneThisDay === 0) {
        checkDate.setDate(checkDate.getDate() - 1)
        continue
      }

      if (tasksDoneThisDay === totalTasks) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const currentStreak = calculateStreak()

  // 30-Day Grid data
  const getGridColor = (dateStr) => {
    if (totalTasks === 0) return 'bg-zinc-100 border-zinc-200'
    const doneCount = dailyTasks.filter(t => getLogStatus(t._id, dateStr)).length
    if (doneCount === 0) return 'bg-zinc-100 border-zinc-200'
    const pct = doneCount / totalTasks
    if (pct <= 0.33) return 'bg-emerald-100 border-emerald-200'
    if (pct <= 0.66) return 'bg-emerald-300 border-emerald-400'
    return 'bg-emerald-500 border-emerald-600'
  }

  return (
    <div className="space-y-8 max-w-4xl mx-full">
      {/* Header Block */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          <Award className="w-3.5 h-3.5 text-zinc-400" />
          <span>Routine Consistency Tracker</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Daily Tasks</h1>
        <p className="text-sm text-zinc-500">Form lasting habits, complete daily milestones, and defeat procrastination.</p>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium space-y-1">
          <p className="font-bold">⚠️ RLS Policy or Table Setup Required</p>
          <p>{error}</p>
          <div className="bg-white/60 p-3 rounded border border-amber-150 font-mono text-[10px] whitespace-pre-wrap mt-2 select-all">
{`alter table daily_tasks disable row level security;
alter table daily_task_logs disable row level security;`}
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Habits Management (2/3 cols on lg screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Habit Form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              placeholder="Create a new daily habit (e.g. Meditate, Code 1hr)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 text-sm px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-zinc-950 focus:border-zinc-950"
            />
            <button
              type="submit"
              className="px-4 py-3 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 text-sm font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </form>

          {/* Habit Checklist */}
          {isLoading ? (
            <div className="p-12 text-center text-zinc-400 text-sm">Loading daily tasks...</div>
          ) : dailyTasks.length === 0 ? (
            <div className="p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20 text-center space-y-2">
              <Zap className="w-8 h-8 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-950">No habits added yet</h3>
              <p className="text-xs text-zinc-400">Add regular daily goals above to start building consistency.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyTasks.map(task => (
                <div 
                  key={task._id}
                  className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:shadow-2xs"
                >
                  {/* Habit info */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-sm text-zinc-900 block truncate">{task.title}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Added on {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-550 hover:bg-red-50 cursor-pointer transition-opacity"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 7-Day Completion Tracker Grid */}
                  <div className="flex gap-2 justify-between sm:justify-end">
                    {past7Days.map(day => {
                      const isDone = getLogStatus(task._id, day.dateStr)
                      const isToday = day.dateStr === todayStr
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => handleToggle(task._id, day.dateStr)}
                          className={`flex flex-col items-center p-1.5 w-10 rounded-lg border text-center transition-all cursor-pointer ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs' 
                              : isToday
                                ? 'bg-zinc-50 border-zinc-900 text-zinc-900 font-bold'
                                : 'bg-zinc-50 border-zinc-150 text-zinc-500 hover:bg-zinc-100'
                          }`}
                          title={`Toggle status for ${day.dateObj.toLocaleDateString()}`}
                        >
                          <span className="text-[8px] uppercase tracking-wide opacity-80">{day.label}</span>
                          <span className="text-xs font-bold mt-0.5">{day.dayNum}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Visual Progress Dashboard (1/3 cols on lg screens) */}
        <div className="space-y-6">
          {/* Today's Ring Summary */}
          <div className="p-6 bg-zinc-900 text-white rounded-2xl border border-zinc-800 shadow-sm flex flex-col items-center text-center space-y-4">
            <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest">Today's Focus Status</h3>
            
            {/* SVG Radial Progress Bar */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Track circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  strokeWidth="8"
                  stroke="#27272a"
                  fill="transparent"
                />
                {/* Completion indicator */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  strokeWidth="8"
                  stroke={completionRateToday === 100 ? '#10b981' : '#f59e0b'}
                  fill="transparent"
                  strokeDasharray={351.85}
                  strokeDashoffset={351.85 - (351.85 * completionRateToday) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              {/* Inner details */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold tracking-tight">{completionRateToday}%</span>
                <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">{completedToday}/{totalTasks} Done</span>
              </div>
            </div>

            {/* Anti-procrastination messages */}
            <div className="text-xs text-zinc-300 leading-relaxed px-2">
              {completionRateToday === 0 ? "Commit to starting just one small goal today to break the cycle." :
               completionRateToday < 50 ? "Doing something poorly is better than doing nothing at all. Keep pushing!" :
               completionRateToday < 100 ? "Almost there! Complete your remaining habits to win the day." :
               "🎉 100% completion! Procrastination defeated. Excellent consistency today!"}
            </div>
          </div>

          {/* Streaks Widget */}
          <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-3xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-orange-400'}`} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Consistency Streak</span>
                <span className="text-lg font-bold text-zinc-900 leading-none">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-600 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
                {currentStreak >= 3 ? 'On Fire 🔥' : 'Building Up'}
              </span>
            </div>
          </div>

          {/* Git-Style 30-Day Contribution Heatmap */}
          <div className="p-5 bg-white border border-zinc-200/80 rounded-2xl shadow-3xs space-y-3">
            <h4 className="font-semibold text-xs text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>30-Day Progress Heatmap</span>
            </h4>
            
            {/* Heatmap grid */}
            <div className="grid grid-cols-6 gap-1.5 pt-1.5">
              {past30Days.map(day => (
                <div
                  key={day.dateStr}
                  className={`aspect-square w-full rounded-md border flex flex-col justify-between p-1 transition-all ${getGridColor(day.dateStr)}`}
                  title={`${day.dateObj.toLocaleDateString()}: completed ${dailyTasks.filter(t => getLogStatus(t._id, day.dateStr)).length}/${totalTasks} tasks`}
                >
                  <span className="text-[7px] font-bold text-zinc-400 select-none block leading-none">{day.dayNum}</span>
                </div>
              ))}
            </div>

            {/* Grid Legend */}
            <div className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-400 font-medium pt-1.5">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-zinc-100 border border-zinc-200"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-300 border border-emerald-400"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600"></div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
