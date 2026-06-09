import { 
  LayoutDashboard, 
  BookOpen, 
  CheckSquare, 
  Settings, 
  X, 
  Sparkles 
} from 'lucide-react'

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
        fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-zinc-50 flex flex-col justify-between
        transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex h-full
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Branding Block */}
        <div className="p-6 border-b border-zinc-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-semibold text-zinc-900 tracking-tight block text-base leading-none">AeroFlow</span>
                <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase mt-0.5 block">Productivity</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-md hover:bg-zinc-100 md:hidden text-zinc-500 hover:text-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <span className="px-3 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">Workspace</span>
          
          <button
            onClick={() => { onToggleNotes(); setMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-850 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-zinc-400" />
            <span className="font-semibold">Quick Note Canvas</span>
          </button>

          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'dashboard' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-850'
            }`}
          >
            <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-zinc-900' : 'text-zinc-400'}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => { setActiveTab('history'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'history' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'history' ? 'text-zinc-900' : 'text-zinc-400'}`} />
            <span>Notes History</span>
          </button>

          <button
            onClick={() => { setActiveTab('completed'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'completed' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800'
            }`}
          >
            <CheckSquare className={`w-4 h-4 ${activeTab === 'completed' ? 'text-zinc-900' : 'text-zinc-400'}`} />
            <span>Completed Tasks</span>
          </button>

          <button
            onClick={() => { setActiveTab('daily-tasks'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              activeTab === 'daily-tasks' 
                ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200' 
                : 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'daily-tasks' ? 'text-zinc-900' : 'text-zinc-400'}`} />
            <span>Daily Tasks</span>
          </button>
        </nav>

        {/* User Card / Settings */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200/50 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center font-semibold text-xs text-zinc-700">
                VE
              </div>
              <div className="leading-tight">
                <span className="font-semibold text-xs text-zinc-900 block">Varun Erabati</span>
              </div>
            </div>
            <button 
              onClick={onOpenShareModal}
              className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
              title="Share Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
