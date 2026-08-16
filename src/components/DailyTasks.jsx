import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Flame, Award, Calendar, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DailyTasks() {
  const { session } = useAuth()
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
    if (!session?.user?.id) return
    try {
      setIsLoading(true)
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', session.user.id)
        
      if (tasksError) throw tasksError

      const { data: logsData, error: logsError } = await supabase
        .from('daily_task_logs')
        .select('*')
        .eq('user_id', session.user.id)

      if (logsError) throw logsError

      setDailyTasks(tasksData || [])
      setLogs(logsData || [])
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
    if (!newTitle.trim() || !session?.user?.id) return
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert([{ title: newTitle, user_id: session.user.id }])
        .select()
        .single()
        
      if (error) throw error
      
      setDailyTasks(prev => [...prev, data])
      setNewTitle('')
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Daily Task
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', id)
        
      if (error) throw error
      
      setDailyTasks(prev => prev.filter(t => t.id !== id))
      setLogs(prev => prev.filter(l => l.daily_task_id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle log completion status
  const handleToggle = async (taskId, dateStr) => {
    const isCurrentlyDone = logs.some(l => l.daily_task_id === taskId && l.completed_date === dateStr && l.is_completed)
    const nextStatus = !isCurrentlyDone

    try {
      // Optimistic update
      const tempLogId = Math.random().toString()
      const optimisticLog = { id: tempLogId, daily_task_id: taskId, completed_date: dateStr, is_completed: nextStatus, user_id: session.user.id }
      
      setLogs(prev => {
        const filtered = prev.filter(l => !(l.daily_task_id === taskId && l.completed_date === dateStr))
        return nextStatus ? [...filtered, optimisticLog] : filtered
      })

      if (nextStatus) {
        const { data, error } = await supabase
          .from('daily_task_logs')
          .insert([{ daily_task_id: taskId, completed_date: dateStr, is_completed: nextStatus, user_id: session.user.id }])
          .select()
          .single()
        
        if (error) throw error
        setLogs(prev => prev.map(l => l.id === tempLogId ? data : l))
      } else {
        const { error } = await supabase
          .from('daily_task_logs')
          .delete()
          .eq('daily_task_id', taskId)
          .eq('completed_date', dateStr)
          
        if (error) throw error
      }
    } catch (err) {
      console.error(err)
      // Revert state on error
      fetchData()
    }
  }

  // Completion calculation helper
  const getLogStatus = (taskId, dateStr) => {
    return logs.some(l => l.daily_task_id === taskId && l.completed_date === dateStr && l.is_completed)
  }

  // Stats Calculations
  const totalTasks = dailyTasks.length
  const completedToday = dailyTasks.filter(t => getLogStatus(t.id, todayStr)).length
  const completionRateToday = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0

  // Calculate Streak
  const calculateStreak = () => {
    if (totalTasks === 0) return 0
    let streak = 0
    let checkDate = new Date()

    while (true) {
      const dateStr = getLocalDateString(checkDate)
      const tasksDoneThisDay = dailyTasks.filter(t => getLogStatus(t.id, dateStr)).length
      
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
    if (totalTasks === 0) return 'bg-[#171A23] border-white/5'
    const doneCount = dailyTasks.filter(t => getLogStatus(t.id, dateStr)).length
    if (doneCount === 0) return 'bg-[#171A23] border-white/5'
    const pct = doneCount / totalTasks
    if (pct <= 0.33) return 'bg-emerald-900/40 border-emerald-800/50 text-emerald-600'
    if (pct <= 0.66) return 'bg-emerald-600/40 border-emerald-500/50 text-emerald-400'
    return 'bg-emerald-500 border-emerald-400 shadow-glow-green text-emerald-950'
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full relative">
      {/* Header Block */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-brand text-xs font-semibold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
          <Award className="w-3.5 h-3.5" />
          <span>Routine Consistency Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">Daily Tasks</h1>
        <p className="text-sm text-slate-400">Form lasting habits, complete daily milestones, and defeat procrastination.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-medium space-y-1 shadow-card">
          <p className="font-bold flex items-center gap-2">⚠️ RLS Policy or Table Setup Required</p>
          <p>{error}</p>
          <div className="bg-canvas/50 p-3 rounded border border-rose-500/20 font-mono text-[10px] whitespace-pre-wrap mt-2 select-all">
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
              className="flex-1 text-sm px-4 py-3 bg-canvas border border-white/5 text-white rounded-xl focus:outline-hidden focus:ring-1 focus:ring-brand focus:border-brand placeholder-zinc-500 shadow-inner"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-brand text-white rounded-xl hover:bg-brandHover text-sm font-semibold flex items-center gap-1.5 shadow-card cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Goal</span>
            </button>
          </form>

          {/* Habit Checklist */}
          {isLoading ? (
            <div className="p-12 text-center text-zinc-500 text-sm">Loading daily tasks...</div>
          ) : dailyTasks.length === 0 ? (
            <div className="p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center space-y-2">
              <Zap className="w-8 h-8 text-zinc-500 mx-auto" />
              <h3 className="text-sm font-semibold text-zinc-300">No habits added yet</h3>
              <p className="text-xs text-zinc-500">Add regular daily goals above to start building consistency.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyTasks.map(task => (
                <div 
                  key={task.id}
                  className="p-5 bg-surface border border-white/5 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:border-white/10 backdrop-blur-md"
                >
                  {/* Habit info */}
                  <div className="flex items-center justify-between sm:justify-start gap-4 flex-1">
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-semibold text-sm text-slate-100 block truncate">{task.title}</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Added on {new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 7-Day Completion Tracker Grid */}
                  <div className="flex gap-2 justify-between sm:justify-end">
                    {past7Days.map(day => {
                      const isDone = getLogStatus(task.id, day.dateStr)
                      const isToday = day.dateStr === todayStr
                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => handleToggle(task.id, day.dateStr)}
                          className={`flex flex-col items-center p-1.5 w-10 rounded-lg border text-center transition-all cursor-pointer ${
                            isDone 
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-glow-green' 
                              : isToday
                                ? 'bg-white/10 border-white/30 text-white font-bold'
                                : 'bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10'
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
          <div className="p-6 bg-surface text-white rounded-2xl border border-white/5 shadow-top-glow-blue flex flex-col items-center text-center space-y-4 relative overflow-hidden backdrop-blur-md">
            {/* Subtle glow behind ring */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] bg-brand/10 blur-[50px] pointer-events-none rounded-full" />
            
            <h3 className="font-semibold text-xs text-zinc-400 uppercase tracking-widest relative z-10">Today's Focus Status</h3>
            
            {/* SVG Radial Progress Bar */}
            <div className="relative w-36 h-36 flex items-center justify-center z-10">
              <svg className="w-full h-full transform -rotate-90">
                {/* Track circle */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  strokeWidth="8"
                  stroke="#171A23"
                  fill="transparent"
                />
                {/* Completion indicator */}
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  strokeWidth="8"
                  stroke={completionRateToday === 100 ? '#10b981' : '#3b82f6'}
                  fill="transparent"
                  strokeDasharray={351.85}
                  strokeDashoffset={351.85 - (351.85 * completionRateToday) / 100}
                  strokeLinecap="round"
                  className={`transition-all duration-500 ${completionRateToday === 100 ? 'drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]'}`}
                />
              </svg>
              {/* Inner details */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold tracking-tight text-white">{completionRateToday}%</span>
                <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">{completedToday}/{totalTasks} Done</span>
              </div>
            </div>

            {/* Anti-procrastination messages */}
            <div className="text-xs text-zinc-400 leading-relaxed px-2 relative z-10">
              {completionRateToday === 0 ? "Commit to starting just one small goal today to break the cycle." :
               completionRateToday < 50 ? "Doing something poorly is better than doing nothing at all. Keep pushing!" :
               completionRateToday < 100 ? "Almost there! Complete your remaining habits to win the day." :
               "🎉 100% completion! Procrastination defeated. Excellent consistency today!"}
            </div>
          </div>

          {/* Streaks Widget */}
          <div className="p-5 bg-surface border border-white/5 rounded-2xl shadow-card flex items-center justify-between backdrop-blur-md transition-all hover:border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${currentStreak > 0 ? 'bg-orange-500/10 border-orange-500/30 shadow-glow-rose' : 'bg-white/5 border-white/10'}`}>
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-400 fill-orange-400 animate-pulse' : 'text-zinc-600'}`} />
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Consistency Streak</span>
                <span className="text-lg font-bold text-white leading-none">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentStreak >= 3 ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 shadow-glow-rose' : 'text-zinc-400 bg-white/5 border-white/10'}`}>
                {currentStreak >= 3 ? 'On Fire 🔥' : 'Building Up'}
              </span>
            </div>
          </div>

          {/* Git-Style 30-Day Contribution Heatmap */}
          <div className="p-5 bg-surface border border-white/5 rounded-2xl shadow-top-glow-green space-y-3 backdrop-blur-md">
            <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>30-Day Progress Heatmap</span>
            </h4>
            
            {/* Heatmap grid */}
            <div className="grid grid-cols-6 gap-1.5 pt-1.5">
              {past30Days.map(day => (
                <div
                  key={day.dateStr}
                  className={`aspect-square w-full rounded-md border flex flex-col justify-between p-1 transition-all hover:scale-110 cursor-default ${getGridColor(day.dateStr)}`}
                  title={`${day.dateObj.toLocaleDateString()}: completed ${dailyTasks.filter(t => getLogStatus(t.id, day.dateStr)).length}/${totalTasks} tasks`}
                >
                  <span className="text-[7px] font-bold opacity-60 select-none block leading-none">{day.dayNum}</span>
                </div>
              ))}
            </div>

            {/* Grid Legend */}
            <div className="flex items-center justify-end gap-1.5 text-[9px] text-zinc-500 font-medium pt-1.5">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-[#171A23] border border-white/5"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-900/40 border border-emerald-800/50"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-600/40 border border-emerald-500/50"></div>
              <div className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-400 shadow-glow-green"></div>
              <span>More</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
