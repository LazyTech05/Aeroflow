import { useState } from 'react'
import { Plus } from 'lucide-react'

export default function TaskInput({ onAddTask, inputRef }) {
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState('Work')
  const [reminderTime, setReminderTime] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    onAddTask(newTaskText.trim(), newTaskCategory, reminderTime || null)
    setNewTaskText('')
    setReminderTime('')
  }

  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-surface shadow-top-glow-blue space-y-4 relative overflow-hidden transition-all hover:border-white/10">
      <label htmlFor="focus-input" className="block text-xs font-bold text-slate-300 uppercase tracking-widest relative z-10">
        What is your focus next?
      </label>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="focus-input"
            type="text"
            placeholder="e.g. Design app dashboard layouts..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="w-full pl-4 pr-24 py-3 bg-canvas border border-white/5 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-brand focus:border-brand transition-all shadow-inner relative z-10"
          />
          {/* Category Selector integrated inside the input container for clean aesthetics */}
          <div className="absolute right-2 top-1.5 flex items-center z-20">
            <select 
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="bg-surface hover:bg-white/5 text-[11px] text-zinc-300 font-semibold px-2 py-1.5 rounded-lg border border-white/5 focus:ring-1 focus:ring-brand cursor-pointer shadow-sm"
            >
              <option value="Work" className="bg-zinc-900 text-white">Work</option>
              <option value="Personal" className="bg-zinc-900 text-white">Personal</option>
              <option value="Design" className="bg-zinc-900 text-white">Design</option>
              <option value="Dev" className="bg-zinc-900 text-white">Dev</option>
            </select>
          </div>
        </div>
        
        {/* Minimalist datetime-local picker */}
        <input 
          type="datetime-local" 
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="px-3 py-3 bg-canvas border border-white/5 rounded-xl text-sm text-zinc-300 focus:outline-hidden focus:ring-1 focus:ring-brand focus:border-brand transition-all shadow-inner cursor-pointer hover:bg-white/5 relative z-10"
          title="Set target reminder date/time"
        />

        <button 
          type="submit" 
          className="px-6 py-3 bg-brand hover:bg-brandHover text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all shadow-card cursor-pointer whitespace-nowrap relative z-10 border border-white/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>
    </div>
  )
}
