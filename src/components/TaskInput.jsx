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
    <div className="p-6 rounded-2xl border border-zinc-200/80 bg-zinc-50/50 shadow-3xs space-y-4">
      <label htmlFor="focus-input" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
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
            className="w-full pl-4 pr-24 py-3 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all shadow-2xs"
          />
          {/* Category Selector integrated inside the input container for clean aesthetics */}
          <div className="absolute right-2 top-1.5 flex items-center">
            <select 
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="bg-zinc-100 hover:bg-zinc-200/80 text-[11px] text-zinc-700 font-semibold px-2 py-1.5 rounded-lg border-0 focus:ring-1 focus:ring-zinc-900/10 cursor-pointer"
            >
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Design">Design</option>
              <option value="Dev">Dev</option>
            </select>
          </div>
        </div>
        
        {/* Minimalist datetime-local picker */}
        <input 
          type="datetime-local" 
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="px-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-500 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all shadow-2xs cursor-pointer hover:bg-zinc-50/30"
          title="Set target reminder date/time"
        />

        <button 
          type="submit" 
          className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>
    </div>
  )
}
