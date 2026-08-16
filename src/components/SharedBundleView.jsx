import { useState, useEffect } from 'react'
import { BookOpen, Calendar, ShieldAlert, Check, Copy, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { supabase } from '../lib/supabaseClient'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-3 p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 select-none z-10 opacity-0 group-hover/code:opacity-100 transition-opacity duration-200 shadow-sm border border-zinc-700/50"
      title="Copy code"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      <span className="text-[9px] font-bold">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

const renderCode = ({ node, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '')
  const codeContent = String(children).replace(/\n$/, '')
  
  if (match) {
    return (
      <div className="relative group/code my-4">
        <CopyButton text={codeContent} />
        <span className="absolute top-2.5 left-4 text-[9px] font-bold text-zinc-500 uppercase tracking-wider select-none z-10">
          {match[1]}
        </span>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '2.5rem 1rem 1rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            lineHeight: '1.4',
            background: '#1e1e1e'
          }}
          {...props}
        >
          {codeContent}
        </SyntaxHighlighter>
      </div>
    )
  }
  
  return (
    <code className={`${className || ''} bg-zinc-150 text-zinc-800 px-1.5 py-0.5 rounded text-xs font-mono`} {...props}>
      {children}
    </code>
  )
}

export default function SharedBundleView({ shareId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchSharedNotes = async () => {
      try {
        setLoading(true)
        
        // Fetch share bundle
        const { data: shareData, error: shareError } = await supabase
          .from('shares')
          .select('note_ids')
          .eq('id', shareId)
          .single()
          
        if (shareError || !shareData) {
          throw new Error('This shared link does not exist or has expired')
        }
        
        // Fetch actual notes
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .in('id', shareData.note_ids)
          
        if (notesError) throw notesError
        
        setNotes(notesData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (shareId) {
      fetchSharedNotes()
    }
  }, [shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading secure shared notes bundle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-glow-rose">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">{error}</p>
        <a 
          href="/"
          className="text-xs font-semibold px-4 py-2 border border-white/10 bg-surface hover:bg-surfaceHover rounded-lg text-slate-300 shadow-card transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas text-slate-100 font-sans antialiased overflow-y-auto selection:bg-brand/30 selection:text-white">
      {/* Premium Header */}
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-canvas/80 border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand/20 border border-brand/50 flex items-center justify-center text-brand shadow-card select-none">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">AeroFlow Share</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest shadow-glow-green select-none">
            Public Read-Only
          </span>
        </div>
      </header>

      {/* Main Workspace Column */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-2 border-b border-white/10 pb-6 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-brand/10 blur-[60px] pointer-events-none rounded-full" />
          <div className="flex items-center gap-1.5 text-brand text-xs font-semibold uppercase tracking-widest relative z-10 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Shared Document Bundle</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wide relative z-10">Classmate Shared Notes</h1>
          <p className="text-sm text-slate-400 relative z-10">Secure access to individual study documents shared by Varun Erabati.</p>
        </div>

        <div className="space-y-10">
          {notes.map((note, index) => (
            <article 
              key={note.id || index}
              className="p-8 border border-white/10 rounded-2xl bg-surface shadow-card space-y-6 backdrop-blur-md"
            >
              {/* Note Header */}
              <div className="space-y-2 border-b border-white/5 pb-4">
                <h2 className="text-2xl font-bold text-white tracking-wide">{note.title || 'Untitled Draft'}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  <span>Shared on: {new Date(note.created_at || new Date()).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Optional Top Image */}
              {note.image_url && (
                <div className="relative overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <img
                    src={note.image_url}
                    alt="Document preview"
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              )}

              {/* Note Rich Content Body */}
              <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: renderCode,
                    img: ({ src, alt, ...props }) => (
                      <img
                        src={src}
                        alt={alt || 'Embedded image'}
                        className="max-h-80 w-full object-cover rounded-xl my-3 shadow-xl border border-white/10 select-none"
                        {...props}
                      />
                    )
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              </div>
            </article>
          ))}

          {notes.length === 0 && (
            <div className="p-16 border border-dashed border-white/10 rounded-2xl bg-surface/50 text-center space-y-3 backdrop-blur-sm">
              <BookOpen className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-300">Empty Bundle</h3>
              <p className="text-sm text-zinc-500 max-w-sm mx-auto">This shared bundle does not contain any notes.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-3xl mx-auto py-12 px-6 border-t border-white/10 flex justify-center text-center text-xs text-zinc-600 font-medium">
        <span>© {new Date().getFullYear()} AeroFlow. Built securely.</span>
      </footer>
    </div>
  )
}
