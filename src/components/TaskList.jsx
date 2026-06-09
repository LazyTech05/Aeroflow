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
      <div className="flex justify-between items-center border-b border-zinc-150 pb-3">
        <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-zinc-400" />
          <span>Milestones & Schedule</span>
        </h2>
        
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 select-none">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-zinc-900 shadow-3xs'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            Checklist
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-zinc-900 shadow-3xs'
                : 'text-zinc-500 hover:text-zinc-900'
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
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">
                Ongoing Checklist ({ongoingTasks.length} pending)
              </span>
            </div>

            {ongoingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20 text-center space-y-2">
                <Sparkles className="w-8 h-8 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-950">All caught up!</h3>
                <p className="text-xs text-zinc-400 max-w-[240px]">Create a task above to define your next primary milestone.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ongoingTasks.map((task) => (
                  <div 
                    key={task._id}
                    className={`group flex items-center justify-between p-4 border rounded-xl shadow-3xs transition-all duration-150 ${
                      task.isOverdue
                        ? 'bg-amber-50/60 border-amber-200/80 hover:bg-amber-100/30'
                        : 'bg-white hover:bg-zinc-50/50 border-zinc-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => onToggleTask(task._id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                          task.isOverdue
                            ? 'border-amber-400 hover:border-amber-600 hover:bg-amber-50'
                            : 'border-zinc-300 hover:border-zinc-900'
                        }`}
                      >
                        <span className="sr-only">Complete task</span>
                      </button>
                      
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`text-sm font-medium truncate ${task.isOverdue ? 'text-amber-900 font-semibold' : 'text-zinc-700'}`}>
                          {task.title}
                        </span>
                        {task.isOverdue && (
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" title="Overdue task" />
                        )}
                      </div>

                      {task.reminderTime && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0 ${
                          task.isOverdue 
                            ? 'bg-amber-100/50 text-amber-700 border-amber-200/40' 
                            : 'bg-zinc-50 text-zinc-400 border-zinc-150'
                        }`}>
                          <Clock className="w-2.5 h-2.5 text-zinc-400" />
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
                          task.isOverdue ? 'bg-amber-100/40 text-amber-800 border-amber-200/30' :
                          task.category === 'Design' ? 'bg-indigo-50/50 text-indigo-600 border-indigo-100' :
                          task.category === 'Product' ? 'bg-amber-50/50 text-amber-700 border-amber-100' :
                          task.category === 'Engineering' || task.category === 'Dev' ? 'bg-emerald-50/50 text-emerald-700 border-emerald-100' :
                          'bg-zinc-100 text-zinc-650 border-zinc-200'
                        }`}>
                          {task.category}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onDeleteTask(task._id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer"
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
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-xs font-bold text-zinc-450 uppercase tracking-wider">
                Log history ({completedTasks.length} items)
              </span>
            </div>

            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20 text-center space-y-2">
                <CheckSquare className="w-8 h-8 text-zinc-300" />
                <h3 className="text-sm font-semibold text-zinc-950">No completed tasks yet</h3>
                <p className="text-xs text-zinc-400 max-w-[240px]">Complete a task on your Dashboard to log it here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedTasks.map((task) => (
                  <div 
                    key={task._id}
                    className="flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-200/60 rounded-xl shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => onToggleTask(task._id)}
                        className="w-5 h-5 rounded-md border border-zinc-900 bg-zinc-900 flex items-center justify-center text-white cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium text-zinc-400 line-through truncate">{task.title}</span>
                      
                      {task.reminderTime && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-zinc-100/50 text-zinc-400 border border-zinc-200/30 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.reminderTime).toLocaleString([], {
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })}
                        </span>
                      )}

                      {task.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 border border-zinc-200/50 shrink-0">
                          {task.category}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => onDeleteTask(task._id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
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
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl shadow-3xs space-y-4">
          {/* Calendar Header controls */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-zinc-900">{monthName} {year}</span>
            <div className="flex gap-1">
              <button 
                onClick={handlePrevMonth}
                className="p-1 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg cursor-pointer text-zinc-650"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-1 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg cursor-pointer text-zinc-650"
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
              <div key={`empty-${idx}`} className="aspect-square bg-zinc-50/50 rounded-lg border border-transparent"></div>
            ))}

            {/* Day cells */}
            {Array.from({ length: totalDays }).map((_, idx) => {
              const dayNum = idx + 1
              const dayTasks = getTasksForDay(dayNum)
              return (
                <div 
                  key={`day-${dayNum}`}
                  className="aspect-square p-1.5 border border-zinc-150 hover:bg-zinc-50/50 rounded-lg flex flex-col justify-between min-h-[60px]"
                >
                  <span className="text-[10px] font-extrabold text-zinc-500 select-none block leading-none">{dayNum}</span>
                  
                  {/* Task indicator dots or list */}
                  <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 3).map(task => (
                      <span 
                        key={task._id} 
                        className={`text-[8px] px-1 rounded-sm block truncate leading-normal select-none font-semibold ${
                          task.isCompleted 
                            ? 'bg-zinc-100 text-zinc-400 line-through border border-zinc-150' 
                            : 'bg-zinc-900 text-white border border-zinc-900'
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
