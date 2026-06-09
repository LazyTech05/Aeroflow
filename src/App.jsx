import { useState, useEffect, useRef } from 'react'
import { Menu, BookOpen, Calendar, CheckSquare, Check, Trash2, Globe, X, Copy } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import NoteCanvas from './components/NoteCanvas'
import SharedBundleView from './components/SharedBundleView'
import DailyTasks from './components/DailyTasks'
import PomodoroTimer from './components/PomodoroTimer'
import { API_URL } from './config'

function App() {
  // Shared route detection
  const path = window.location.pathname
  const isSharedRoute = path.startsWith('/shared/bundle/')
  const shareId = isSharedRoute ? path.split('/shared/bundle/')[1] : null

  if (isSharedRoute) {
    return <SharedBundleView shareId={shareId} />
  }

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'history' | 'completed'

  // Sharing Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedShareNotes, setSelectedShareNotes] = useState([])
  const [generatedLink, setGeneratedLink] = useState('')
  const [generatingLink, setGeneratingLink] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const handleToggleShareNote = (id) => {
    setSelectedShareNotes(prev => 
      prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]
    )
  }

  const handleGenerateShareLink = async () => {
    if (selectedShareNotes.length === 0) return
    try {
      setGeneratingLink(true)
      const res = await fetch(`${API_URL}/api/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteIds: selectedShareNotes })
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedLink(`${window.location.origin}/shared/bundle/${data.shareId}`)
      }
    } catch (error) {
      console.error('Error generating share link:', error)
    } finally {
      setGeneratingLink(false)
    }
  }

  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Input Refs for Keyboard Navigation
  const taskInputRef = useRef(null)
  const noteTitleInputRef = useRef(null)

  // Tasks State
  const [tasks, setTasks] = useState([])

  // Notes State
  const [notes, setNotes] = useState([])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteImageUrl, setNoteImageUrl] = useState('')
  const [activeNoteId, setActiveNoteId] = useState(null)

  // Fetch tasks and notes on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tasksRes = await fetch(`${API_URL}/api/tasks`)
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          if (Array.isArray(tasksData)) {
            setTasks(tasksData)
          }
        }

        const notesRes = await fetch(`${API_URL}/api/notes`)
        if (notesRes.ok) {
          const notesData = await notesRes.json()
          if (Array.isArray(notesData)) {
            setNotes(notesData)
            // Load the most recently created/updated note into the canvas if any exist
            if (notesData.length > 0) {
              const latestNote = notesData[0] // sorted newest first
              setActiveNoteId(latestNote._id)
              setNoteTitle(latestNote.title)
              setNoteBody(latestNote.content)
              setNoteImageUrl(latestNote.imageUrl || '')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data on mount:', error)
      }
    }
    fetchData()
  }, [])

  // Background Worker for Overdue Reminders
  useEffect(() => {
    const runOverdueSweep = () => {
      const now = new Date()
      setTasks(prevTasks => {
        let changed = false
        const nextTasks = prevTasks.map(task => {
          const isOverdue = !task.isCompleted && task.reminderTime && new Date(task.reminderTime) <= now
          if (task.isOverdue !== isOverdue) {
            changed = true
            return { ...task, isOverdue }
          }
          return task
        })
        return changed ? nextTasks : prevTasks
      })
    }

    runOverdueSweep()

    const interval = setInterval(runOverdueSweep, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleNewNote = () => {
    setActiveNoteId(null)
    setNoteTitle('')
    setNoteBody('')
    setNoteImageUrl('')
    setMobileNotesOpen(true)
    setTimeout(() => {
      noteTitleInputRef.current?.focus()
    }, 50)
  }

  // Global Keyboard Listener Framework
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      )

      if (e.key === 'Escape') {
        if (activeEl) {
          activeEl.blur()
        }
        return
      }

      if (isTyping) return

      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return

      const key = e.key.toLowerCase()
      if (key === 't') {
        e.preventDefault()
        taskInputRef.current?.focus()
      } else if (key === 'n') {
        e.preventDefault()
        handleNewNote()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Mobile drawer UI States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false)

  // Get formatted native date
  const getFormattedDate = () => {
    const today = new Date()
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Handle adding task
  const handleAddTask = async (title, category, reminderTime) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, reminderTime })
      })
      if (res.ok) {
        const newTask = await res.json()
        const isOverdue = newTask.reminderTime && new Date(newTask.reminderTime) <= new Date()
        const newTaskWithOverdue = { ...newTask, isOverdue: !!isOverdue }
        setTasks(prevTasks => [newTaskWithOverdue, ...prevTasks])
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  // Handle toggling task completion
  const handleToggleTask = async (_id) => {
    const taskToToggle = tasks.find(t => t._id === _id)
    if (!taskToToggle) return

    const nextCompleted = !taskToToggle.isCompleted

    try {
      const res = await fetch(`${API_URL}/api/tasks/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: nextCompleted })
      })
      if (res.ok) {
        const updatedTask = await res.json()
        const isOverdue = updatedTask.isCompleted
          ? false
          : !!(updatedTask.reminderTime && new Date(updatedTask.reminderTime) <= new Date())
        const updatedTaskWithOverdue = { ...updatedTask, isOverdue }
        setTasks(prevTasks =>
          prevTasks.map(task => task._id === _id ? updatedTaskWithOverdue : task)
        )
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  // Handle deleting task
  const handleDeleteTask = async (_id) => {
    try {
      const res = await fetch(`${API_URL}/api/tasks/${_id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setTasks(prevTasks => prevTasks.filter(task => task._id !== _id))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Handle saving note (autosave)
  const handleSaveNote = async (title, content, imageUrl) => {
    try {
      if (activeNoteId) {
        const res = await fetch(`${API_URL}/api/notes/${activeNoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, imageUrl })
        })
        if (res.ok) {
          const updatedNote = await res.json()
          setNotes(prevNotes =>
            prevNotes.map(n => n._id === activeNoteId ? updatedNote : n)
          )
          return updatedNote
        }
      } else {
        const res = await fetch(`${API_URL}/api/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, imageUrl })
        })
        if (res.ok) {
          const newNote = await res.json()
          setActiveNoteId(newNote._id)
          setNotes(prevNotes => [newNote, ...prevNotes])
          return newNote
        }
      }
    } catch (error) {
      console.error('Error saving note:', error)
      throw error
    }
  }

  // Handle deleting note
  const handleDeleteNote = async (id) => {
    if (!id) return
    try {
      const res = await fetch(`${API_URL}/api/notes/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setNotes(prevNotes => prevNotes.filter(note => note._id !== id))
        if (activeNoteId === id) {
          handleNewNote()
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50 text-zinc-800 font-sans antialiased overflow-hidden">
      {/* 1. LEFT SIDEBAR */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onOpenShareModal={() => {
          setShareModalOpen(true)
          setGeneratedLink('')
          setSelectedShareNotes([])
        }}
        onToggleNotes={() => setMobileNotesOpen(prev => !prev)}
      />

      {/* 2. CENTER COLUMN */}
      <main className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
        {/* Mobile Top bar */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-zinc-50 border-b border-zinc-200">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 shadow-2xs cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-zinc-900 text-sm tracking-tight">AeroFlow</span>
          <button 
            onClick={() => setMobileNotesOpen(true)}
            className="p-1.5 rounded-md border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-4xl mx-full">

          {/* Dynamic Header Block */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{getFormattedDate()}</span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Focus Workspace</h1>
            <p className="text-sm text-zinc-500">Capture priorities, organize actionable tasks, and write freely.</p>
          </div>

          {activeTab === 'dashboard' && (
            <>
              {/* Focus input field */}
              <TaskInput onAddTask={handleAddTask} inputRef={taskInputRef} />

              {/* Tasks Checklist */}
              <TaskList 
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-zinc-900 tracking-tight">Recent Notes Canvas History</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {notes.map((note) => (
                  <div 
                    key={note._id}
                    onClick={() => {
                      setActiveNoteId(note._id)
                      setNoteTitle(note.title)
                      setNoteBody(note.content)
                      setNoteImageUrl(note.imageUrl || '')
                      setMobileNotesOpen(true)
                    }}
                    className={`group/card p-5 border rounded-xl flex flex-col justify-between min-h-[140px] cursor-pointer transition-all duration-150 relative ${
                      activeNoteId === note._id 
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                        : 'bg-zinc-50/30 border-zinc-200 hover:bg-zinc-100/50 text-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className={`font-semibold text-sm truncate ${activeNoteId === note._id ? 'text-white' : 'text-zinc-900'}`}>{note.title || 'Untitled Draft'}</h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNote(note._id)
                          }}
                          className={`p-1 rounded-md transition-all cursor-pointer shrink-0 md:opacity-0 md:group-hover/card:opacity-100 ${
                            activeNoteId === note._id 
                              ? 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800' 
                              : 'text-zinc-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title="Delete Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className={`text-xs line-clamp-3 whitespace-pre-wrap ${activeNoteId === note._id ? 'text-zinc-300' : 'text-zinc-500'}`}>{note.content || 'Empty note...'}</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-medium mt-3">
                      Created: {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="col-span-2 p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-zinc-300 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-950">No notes saved</h3>
                    <p className="text-xs text-zinc-400">Your saved history notes will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <h2 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                  Completed Tasks Log
                  <span className="text-xs font-normal text-zinc-400 font-bold">({tasks.filter(t => t.isCompleted).length} items)</span>
                </h2>
              </div>

              {tasks.filter(t => t.isCompleted).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/20 text-center space-y-2">
                  <CheckSquare className="w-8 h-8 text-zinc-300" />
                  <h3 className="text-sm font-semibold text-zinc-950">No completed tasks yet</h3>
                  <p className="text-xs text-zinc-400 max-w-[240px]">Complete a task on your Dashboard to log it here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.filter(t => t.isCompleted).map((task) => (
                    <div 
                      key={task._id}
                      className="flex items-center justify-between p-4 bg-zinc-50/50 border border-zinc-200/60 rounded-xl shadow-2xs"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button 
                          onClick={() => handleToggleTask(task._id)}
                          className="w-5 h-5 rounded-md border border-zinc-900 bg-zinc-900 flex items-center justify-center text-white cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium text-zinc-400 line-through truncate">{task.title}</span>
                        {task.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-400 border border-zinc-200/50">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'daily-tasks' && (
            <DailyTasks />
          )}
        </div>
      </main>

      {/* 3. RIGHT COLUMN */}
      <NoteCanvas 
        noteTitle={noteTitle}
        setNoteTitle={setNoteTitle}
        noteBody={noteBody}
        setNoteBody={setNoteBody}
        noteImageUrl={noteImageUrl}
        setNoteImageUrl={setNoteImageUrl}
        mobileNotesOpen={mobileNotesOpen}
        setMobileNotesOpen={setMobileNotesOpen}
        titleInputRef={noteTitleInputRef}
        onSaveNote={handleSaveNote}
        onNewNote={handleNewNote}
        activeNoteId={activeNoteId}
        onDeleteNote={() => handleDeleteNote(activeNoteId)}
      />

      {/* SHARING MODAL OVERLAY */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-md shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-500" />
                <h3 className="font-bold text-zinc-900 text-sm">Share Notes with Classmates</h3>
              </div>
              <button 
                onClick={() => setShareModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-zinc-500 leading-relaxed">
                Select the notes you want to bundle together. Anyone with the generated link will have read-only access to their contents.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notes.map(note => {
                  const isChecked = selectedShareNotes.includes(note._id)
                  return (
                    <label 
                      key={note._id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                        isChecked 
                          ? 'bg-zinc-50 border-zinc-400' 
                          : 'bg-white border-zinc-200 hover:bg-zinc-50/50'
                      }`}
                    >
                      <span className="text-xs font-semibold text-zinc-800 truncate pr-2">
                        {note.title || 'Untitled Draft'}
                      </span>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleShareNote(note._id)}
                        className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900 border-zinc-300 cursor-pointer"
                      />
                    </label>
                  )
                })}

                {notes.length === 0 && (
                  <p className="text-xs text-zinc-400 text-center py-4">
                    No notes available to share. Create some notes first!
                  </p>
                )}
              </div>

              {/* Link Presentation Block */}
              {generatedLink && (
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Generated Public Link</span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-600 focus:outline-hidden"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-zinc-950 text-white rounded-lg hover:bg-zinc-850 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-zinc-50/50 border-t border-zinc-150 flex justify-end gap-3">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-xs font-semibold text-zinc-700 shadow-3xs cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleGenerateShareLink}
                disabled={selectedShareNotes.length === 0 || generatingLink}
                className="px-4 py-2 bg-zinc-950 text-white hover:bg-zinc-850 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {generatingLink ? 'Generating...' : 'Generate Public Link'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PomodoroTimer />
    </div>
  )
}

export default App


