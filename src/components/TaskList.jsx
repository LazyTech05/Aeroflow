import { useState } from 'react'
import { Trash2, Sparkles, Check, CheckSquare, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export default function TaskList({ tasks, onToggleTask, onDeleteTask }) {
  const [viewMode, setViewMode] = useState('list') // 'list' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date())

  const ongoingTasks = tasks.filter(task => !task.isCompleted)
  const completedTasks = tasks.filter(task => task.isCompleted)

  // Calendar math
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const getTasksForDay = (dayNum) => {
    return tasks.filter(task => {
      if (!task.reminderTime) return false
      const d = new Date(task.reminderTime)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum
    })
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
        <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-3">
          <span className="w-1.5 h-5 rounded-full bg-blue-500 shadow-glow-blue" />
          <span>Milestones & Schedule</span>
        </h2>
        
        <div className="flex items-center bg-[#171A23] p-1 rounded-lg border border-white/5 select-none">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-brand text-white shadow-card'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Checklist
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-brand text-white shadow-card'
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-8">
          {/* 1. Primary & Ongoing Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Ongoing Checklist <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-glow-blue">{ongoingTasks.length} pending</span>
              </span>
            </div>

            {ongoingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-300">All caught up!</h3>
                <p className="text-xs text-zinc-500 max-w-[240px]">Create a task above to define your next primary milestone.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ongoingTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`group flex items-center justify-between p-4 border rounded-xl shadow-card transition-all duration-300 hover:border-white/10 relative overflow-hidden ${
                      task.isOverdue
                        ? 'bg-rose-950/20 border-rose-500/30 hover:bg-rose-900/30 shadow-top-glow-rose'
                        : 'bg-surface hover:bg-surfaceHover border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0 z-10 relative">
                      <button 
                        onClick={() => onToggleTask(task.id)}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                          task.isOverdue

                            ? 'border-rose-400/50 hover:border-rose-400 hover:bg-rose-500/10 shadow-[inset_0_0_8px_rgba(244,63,94,0.2)]'
                            : 'border-white/20 hover:border-blue-400 hover:bg-blue-500/10'
                        }`}
                      >
                        <span className="sr-only">Complete task</span>
                      </button>
                      
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-sm font-medium truncate ${task.isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                        {task.isOverdue && (
                          <Clock className="w-4 h-4 text-rose-500 shrink-0" title="Overdue task" />
                        )}
                      </div>

                      {task.reminderTime && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${
                          task.isOverdue 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                            : 'bg-white/5 text-zinc-400 border-white/10'
                        }`}>
                          <Clock className="w-2.5 h-2.5 opacity-70" />
                          {new Date(task.reminderTime).toLocaleString([], {
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </span>
                      )}

                      {task.category && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                          task.isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-glow-rose' :
                          task.category === 'Design' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-glow-purple' :
                          task.category === 'Product' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(251,191,36,0.3)]' :
                          task.category === 'Engineering' || task.category === 'Dev' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-glow-green' :
                          task.category === 'Personal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-glow-blue' :
                          'bg-white/10 text-slate-300 border-white/20'
                        }`}>
                          {task.category.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Previously Done Log */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Log history <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-glow-green">{completedTasks.length} items</span>
              </span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-zinc-500" />
                <h3 className="text-sm font-semibold text-zinc-300">No completed tasks yet</h3>
                <p className="text-xs text-zinc-500 max-w-[240px]">Complete a task on your Dashboard to log it here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-surface border border-white/5 rounded-xl shadow-card backdrop-blur-md opacity-70 hover:opacity-100 transition-all hover:border-white/10"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button 
                          onClick={() => onToggleTask(task.id)}
                          className="w-5 h-5 rounded border border-brand/50 bg-brand/20 flex items-center justify-center text-brand cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium text-zinc-500 line-through truncate">{task.title}</span>
                        
                        {task.reminderTime && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 text-zinc-500 border border-white/10 flex items-center gap-1 shrink-0">
                            <Clock className="w-2.5 h-2.5 opacity-60" />
                            {new Date(task.reminderTime).toLocaleString([], {
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        )}

                        {task.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 border border-white/10 shrink-0 uppercase tracking-widest">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                      >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Calendar View rendering */
        <div className="p-6 bg-surface border border-white/5 rounded-2xl shadow-card space-y-4">
          {/* Calendar Header controls */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white tracking-wide">{monthName} {year}</span>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1 border border-white/10 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Weekday headers */}
            {weekdays.map(day => (
              <span key={day} className="text-center text-[10px] font-bold text-zinc-400 uppercase py-1 select-none">{day}</span>
            ))}

            {/* Empty padding cell offsets */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square bg-canvas/50 rounded-lg border border-transparent"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1
              const dayTasks = getTasksForDay(dayNum)
              return (
                <div 
                  key={`day-${dayNum}`}
                  className="aspect-square p-1.5 border border-white/5 hover:bg-white/5 transition-colors rounded-lg flex flex-col justify-between min-h-[60px]"
                >
                  <span className="text-[10px] font-extrabold text-zinc-500 select-none block leading-none">{dayNum}</span>
                  
                  {/* Task indicator dots or list */}
                  <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <span 
                        key={task.id} 
                        className={`text-[8px] px-1 rounded-sm block truncate leading-normal select-none font-semibold ${
                          task.isCompleted 
                            ? 'bg-white/5 text-zinc-500 line-through border border-white/5' 
                            : 'bg-brand/20 text-brand border border-brand/30'
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </span>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[7px] font-bold text-zinc-400 block text-right mt-0.5">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
