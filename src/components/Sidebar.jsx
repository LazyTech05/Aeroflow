import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Settings, 
  X, 
  Sparkles 
} from 'lucide-react'
import { HeaderUserSection } from './HeaderUserSection'

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  mobileMenuOpen, 
  setMobileMenuOpen,
  onOpenShareModal,
  onToggleNotes
}) {
  return (
    <>
      {/* Overlay Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r border-white/5 bg-canvas flex flex-col justify-between
        transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex h-full
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Branding Block */}
        <div className="p-6 border-b border-white/5 relative overflow-hidden">
          {/* Subtle neon glow behind logo */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[50px] bg-brand/20 blur-[40px] pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface border border-white/10 flex items-center justify-center shadow-card">
                <Sparkles className="w-4 h-4 text-brand" />
              </div>
              <div>
                <span className="font-bold text-white tracking-wide block text-base leading-none">AeroFlow</span>
                <span className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase mt-0.5 block">Productivity</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/10 md:hidden text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <span className="px-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest block mb-3">Workspace</span>
          
          <button
            onClick={() => { onToggleNotes(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <BookOpen className="w-4 h-4" />
            <span>Quick Note Canvas</span>
          </button>

          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'dashboard' 
                ? 'bg-brand text-white shadow-card' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : ''}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'history' 
                ? 'bg-brand text-white shadow-card' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'history' ? 'text-white' : ''}`} />
            <span>Notes History</span>
          </button>

          <button
            onClick={() => { setActiveTab('completed'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'completed' 
                ? 'bg-brand text-white shadow-card' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <CheckSquare className={`w-4 h-4 ${activeTab === 'completed' ? 'text-white' : ''}`} />
            <span>Completed Tasks</span>
          </button>

          <button
            onClick={() => { setActiveTab('daily-tasks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'daily-tasks' 
                ? 'bg-brand text-white shadow-card' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'daily-tasks' ? 'text-white' : ''}`} />
            <span>Daily Tasks</span>
          </button>
        </nav>

        {/* User Card / Settings */}
        <div className="p-4 border-t border-white/5 bg-canvas">
          <HeaderUserSection onOpenShareModal={onOpenShareModal} />
        </div>
      </aside>
    </>
  )
}
