import { useState, useEffect, useRef } from 'react'
import { Menu, BookOpen, Calendar, CheckSquare, Check, Trash2, Globe, X, Copy } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TaskInput from './components/TaskInput'
import TaskList from './components/TaskList'
import NoteCanvas from './components/NoteCanvas'
import SharedBundleView from './components/SharedBundleView'
import DailyTasks from './components/DailyTasks'
import PomodoroTimer from './components/PomodoroTimer'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthModal } from './components/AuthModal'
import { supabase } from './lib/supabaseClient'

function MainApp() {
  const { session, loading } = useAuth();
  
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
    if (selectedShareNotes.length === 0 || !session?.user?.id) return
    try {
      setGeneratingLink(true)
      
      const { data, error } = await supabase
        .from('shares')
        .insert([{ 
          user_id: session.user.id, 
          note_ids: selectedShareNotes 
        }])
        .select()
        .single()
        
      if (error) throw error
      
      setGeneratedLink(`${window.location.origin}/shared/bundle/${data.id}`)
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
    if (!session) return;
    const fetchData = async () => {
      try {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (!tasksError && tasksData) {
          const mappedTasks = tasksData.map(t => ({
            ...t,
            isCompleted: t.status === 'completed',
            reminderTime: t.due_at,
          }));
          setTasks(mappedTasks);
        }

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!notesError && notesData) {
          setNotes(notesData);
          if (notesData.length > 0) {
            const latestNote = notesData[0];
            setActiveNoteId(latestNote.id);
            setNoteTitle(latestNote.title);
            setNoteBody(latestNote.content);
            setNoteImageUrl(latestNote.image_url || '');
          }
        }
      } catch (error) {
        console.error('Error fetching data on mount:', error)
      }
    }
    fetchData()
  }, [session])

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
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title, 
          category: category || 'Work', 
          due_at: reminderTime,
          user_id: session.user.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newTask = {
          ...data,
          isCompleted: data.status === 'completed',
          reminderTime: data.due_at
        };
        const isOverdue = newTask.reminderTime && new Date(newTask.reminderTime) <= new Date()
        const newTaskWithOverdue = { ...newTask, isOverdue: !!isOverdue }
        setTasks(prevTasks => [newTaskWithOverdue, ...prevTasks])
      }
    } catch (error) {
      console.error('Error adding task:', error)
      alert(`Failed to add task: ${error.message || 'Unknown database error'}`)
    }
  }

  // Handle toggling task completion
  const handleToggleTask = async (id) => {
    if (!session) return;
    const taskToToggle = tasks.find(t => t.id === id)
    if (!taskToToggle) return

    const nextCompleted = !taskToToggle.isCompleted

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: nextCompleted ? 'completed' : 'pending',
          completed_at: nextCompleted ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const updatedTask = {
          ...data,
          isCompleted: data.status === 'completed',
          reminderTime: data.due_at
        };
        const isOverdue = updatedTask.isCompleted
          ? false
          : !!(updatedTask.reminderTime && new Date(updatedTask.reminderTime) <= new Date())
        const updatedTaskWithOverdue = { ...updatedTask, isOverdue }
        setTasks(prevTasks =>
          prevTasks.map(task => task.id === id ? updatedTaskWithOverdue : task)
        )
      }
    } catch (error) {
      console.error('Error toggling task:', error)
      alert(`Failed to update task: ${error.message || 'Unknown database error'}`)
    }
  }

  // Handle deleting task
  const handleDeleteTask = async (id) => {
    if (!session) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prevTasks => prevTasks.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
      alert(`Failed to delete task: ${error.message || 'Unknown database error'}`)
    }
  }

  // Handle saving note (autosave)
  const handleSaveNote = async (title, content, imageUrl) => {
    if (!session) return;
    try {
      if (activeNoteId) {
        const { data, error } = await supabase
          .from('notes')
          .update({ title, content, image_url: imageUrl })
          .eq('id', activeNoteId)
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setNotes(prevNotes =>
            prevNotes.map(n => n.id === activeNoteId ? data : n)
          )
          return data
        }
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert([{ title, content, image_url: imageUrl, user_id: session.user.id }])
          .select()
          .single();
          
        if (error) throw error;

        if (data) {
          setActiveNoteId(data.id)
          setNotes(prevNotes => [data, ...prevNotes])
          return data
        }
      }
    } catch (error) {
      console.error('Error saving note:', error)
      throw error
    }
  }

  // Handle deleting note
  const handleDeleteNote = async (id) => {
    if (!id || !session) return
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (!error) {
        setNotes(prevNotes => prevNotes.filter(note => note.id !== id))
        if (activeNoteId === id) {
          handleNewNote()
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthModal />;
  }

  return (
    <>
      <div className="flex h-screen bg-canvas text-slate-100 font-sans antialiased overflow-hidden relative">
        {/* Global subtle radial background */}
        <div className="absolute inset-0 bg-radial-gradient-subtle pointer-events-none" />
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
      <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden relative z-10">
        {/* Mobile Top bar */}
        <header className="flex md:hidden items-center justify-between px-6 py-4 bg-surface border-b border-white/5">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 shadow-sm cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-white text-sm tracking-wide">AeroFlow</span>
          <button 
            onClick={() => setMobileNotesOpen(true)}
            className="p-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 shadow-sm cursor-pointer transition-colors"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-7xl mx-auto relative w-full">

          {/* Dynamic Header Block */}
          <div className="space-y-1.5 relative">
            <div className="flex items-center gap-2 text-brand text-xs font-semibold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{getFormattedDate()}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-wide">Focus Workspace</h1>
            <p className="text-sm text-zinc-400">Capture priorities, organize actionable tasks, and write freely.</p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-8">
                {/* Focus input field */}
                <TaskInput onAddTask={handleAddTask} inputRef={taskInputRef} />

                {/* Tasks Checklist */}
                <TaskList 
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                />
              </div>

              {/* Student Focus & Study Stats */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-surface border border-white/5 shadow-card space-y-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="w-4 h-4 text-brand" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">Study Focus Stats</h3>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-white/5 transition-transform hover:scale-[1.02] duration-300">
                    <div>
                      <p className="text-3xl font-extrabold text-brand">
                        {tasks.filter(t => t.isCompleted).length}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Tasks Completed</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shadow-card">
                      <Check className="w-6 h-6 text-brand" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-white/5 transition-transform hover:scale-[1.02] duration-300">
                    <div>
                      <p className="text-3xl font-extrabold text-emerald-400">
                        {tasks.filter(t => !t.isCompleted).length}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Pending Milestones</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-card">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                    </div>
                  </div>
                </div>

                {/* Study Tip Card */}
                <div className="p-6 rounded-2xl bg-brand/10 border border-brand/20 shadow-card">
                  <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Quick Tip</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Use the Pomodoro timer in the bottom right to break your study sessions into 25-minute intervals. Consistent short breaks improve retention!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white tracking-wide">Recent Notes Canvas History</h2>
                <button 
                  onClick={() => {
                    setSelectedShareNotes([])
                    setGeneratedLink('')
                    setShareModalOpen(true)
                  }}
                  className="px-3 py-1.5 bg-brand/20 hover:bg-brand/30 border border-brand/30 text-brand rounded-lg text-xs font-semibold shadow-card flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Share Bundle</span>
                </button>
              </div>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {notes.map((note) => (
                  <div 
                    key={note.id}
                    onClick={() => {
                      setActiveNoteId(note.id)
                      setNoteTitle(note.title)
                      setNoteBody(note.content)
                      setNoteImageUrl(note.imageUrl || '')
                      setMobileNotesOpen(true)
                    }}
                    className={`group/card p-5 rounded-2xl flex flex-col justify-between min-h-[140px] cursor-pointer transition-all duration-300 relative ${
                      activeNoteId === note.id 
                        ? 'bg-surface border-brand shadow-top-glow-blue border' 
                        : 'bg-surface border border-white/5 hover:border-white/10 hover:bg-surfaceHover shadow-card'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className={`font-semibold text-sm truncate ${activeNoteId === note.id ? 'text-white' : 'text-slate-200'}`}>{note.title || 'Untitled Draft'}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedShareNotes([note.id])
                              setGeneratedLink('')
                              setShareModalOpen(true)
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer shrink-0 md:opacity-0 md:group-hover/card:opacity-100 ${
                              activeNoteId === note.id 
                                ? 'text-brand hover:text-brand hover:bg-brand/10' 
                                : 'text-zinc-500 hover:text-brand hover:bg-brand/10'
                            }`}
                            title="Share Note"
                          >
                            <Globe className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteNote(note.id)
                            }}
                            className={`p-1.5 rounded-md transition-all cursor-pointer shrink-0 md:opacity-0 md:group-hover/card:opacity-100 ${
                              activeNoteId === note.id 
                                ? 'text-white/50 hover:text-rose-400 hover:bg-rose-500/10' 
                                : 'text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10'
                            }`}
                            title="Delete Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-xs line-clamp-3 whitespace-pre-wrap ${activeNoteId === note.id ? 'text-slate-300' : 'text-zinc-500'}`}>{note.content || 'Empty note...'}</p>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest mt-3">
                      Created: {new Date(note.created_at || new Date()).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {notes.length === 0 && (
                  <div className="col-span-2 p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center space-y-2 backdrop-blur-sm">
                    <BookOpen className="w-8 h-8 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-slate-300">No notes saved</h3>
                    <p className="text-xs text-zinc-500">Your saved history notes will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Completed Tasks Log
                  <span className="text-xs text-zinc-500 font-semibold">({tasks.filter(t => t.isCompleted).length} items)</span>
                </h2>
              </div>

              {tasks.filter(t => t.isCompleted).length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center space-y-2 backdrop-blur-sm">
                  <CheckSquare className="w-8 h-8 text-zinc-600" />
                  <h3 className="text-sm font-semibold text-slate-300">No completed tasks yet</h3>
                  <p className="text-xs text-zinc-500 max-w-[240px]">Complete a task on your Dashboard to log it here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.filter(t => t.isCompleted).map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-4 bg-surface border border-white/5 rounded-xl shadow-card"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className="w-5 h-5 rounded border border-brand bg-brand flex items-center justify-center text-white shadow-top-glow-blue cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-medium text-zinc-500 line-through truncate">{task.title}</span>
                        {task.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/10 uppercase tracking-widest">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-white/5 w-full max-w-md shadow-card flex flex-col overflow-hidden max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-400" />
                <h3 className="font-bold text-white text-sm">Share Notes with Classmates</h3>
              </div>
              <button 
                onClick={() => setShareModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Select the notes you want to bundle together. Anyone with the generated link will have read-only access to their contents.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {notes.map(note => {
                  const isChecked = selectedShareNotes.includes(note.id)
                  return (
                    <label 
                      key={note.id}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all duration-150 ${
                        isChecked 
                          ? 'bg-brand/20 border-brand' 
                          : 'bg-surface border-white/10 hover:bg-surfaceHover'
                      }`}
                    >
                      <span className={`text-xs font-semibold truncate pr-2 ${isChecked ? 'text-brand' : 'text-white'}`}>
                        {note.title || 'Untitled Draft'}
                      </span>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleShareNote(note.id)}
                        className="w-4 h-4 rounded text-brand focus:ring-brand border-white/20 cursor-pointer"
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
                      className="flex-1 text-xs px-3 py-2 bg-canvas border border-white/10 rounded-lg text-white focus:outline-hidden"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-surface border border-white/10 text-white rounded-lg hover:bg-surfaceHover text-xs font-semibold flex items-center gap-1.5 shadow-card cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-surface/50 border-t border-white/5 flex justify-end gap-3">
              <button
                onClick={() => setShareModalOpen(false)}
                className="px-4 py-2 border border-white/10 bg-canvas hover:bg-surfaceHover rounded-lg text-xs font-semibold text-white shadow-card cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleGenerateShareLink}
                disabled={selectedShareNotes.length === 0 || generatingLink}
                className="px-4 py-2 bg-brand text-white hover:bg-brandHover rounded-lg text-xs font-semibold shadow-card disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {generatingLink ? 'Generating...' : 'Generate Public Link'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PomodoroTimer />
    </div>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp/>
    </AuthProvider>
  );
}


