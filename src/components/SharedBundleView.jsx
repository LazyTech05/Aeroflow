import { useState, useEffect } from 'react'
import { BookOpen, Calendar, ShieldAlert, Check, Copy } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { API_URL } from '../config'

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
        const res = await fetch(`${API_URL}/api/shares/${shareId}`)
        if (!res.ok) {
          throw new Error('This shared link does not exist or has expired')
        }
        const data = await res.json()
        setNotes(data)
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
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-950 mb-4" />
        <p className="text-sm font-medium text-zinc-500">Loading secure shared notes bundle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-900">Access Denied</h2>
        <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">{error}</p>
        <a 
          href="/"
          className="text-xs font-semibold px-4 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 rounded-lg text-zinc-700 shadow-3xs transition-colors"
        >
          Go to Homepage
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans antialiased overflow-y-auto">
      {/* Premium Header */}
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-zinc-200/80 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 flex items-center justify-center text-white font-bold text-xs select-none">
              A
            </div>
            <span className="font-semibold text-zinc-900 text-sm tracking-tight">AeroFlow Share</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200/50 uppercase tracking-wider select-none">
            Public Read-Only
          </span>
        </div>
      </header>

      {/* Main Workspace Column */}
      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        <div className="space-y-2 border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Shared Document Bundle</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Classmate Shared Notes</h1>
          <p className="text-sm text-zinc-500">Secure access to individual study documents shared by Varun Erabati.</p>
        </div>

        <div className="space-y-10">
          {notes.map((note, index) => (
            <article 
              key={note._id || index}
              className="p-8 border border-zinc-200/80 rounded-2xl bg-white shadow-2xs space-y-6"
            >
              {/* Note Header */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{note.title || 'Untitled Draft'}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">
                  <Calendar className="w-3 h-3" />
                  <span>Shared on: {new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Optional Top Image */}
              {note.imageUrl && (
                <div className="relative overflow-hidden rounded-xl border border-zinc-100">
                  <img
                    src={note.imageUrl}
                    alt="Document preview"
                    className="max-h-80 w-full object-cover"
                  />
                </div>
              )}

              {/* Note Rich Content Body */}
              <div className="prose max-w-none text-sm text-zinc-750 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code: renderCode,
                    img: ({ src, alt, ...props }) => (
                      <img
                        src={src}
                        alt={alt || 'Embedded image'}
                        className="max-h-80 w-full object-cover rounded-lg my-3 shadow-2xs border border-zinc-200 select-none"
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
            <div className="p-16 border border-dashed border-zinc-200 rounded-2xl bg-white text-center space-y-3">
              <BookOpen className="w-10 h-10 text-zinc-300 mx-auto" />
              <h3 className="text-base font-bold text-zinc-950">Empty Bundle</h3>
              <p className="text-sm text-zinc-400 max-w-sm mx-auto">This shared bundle does not contain any notes.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-3xl mx-auto py-12 px-6 border-t border-zinc-200/50 flex justify-center text-center text-xs text-zinc-400">
        <span>© {new Date().getFullYear()} AeroFlow. Built securely.</span>
      </footer>
    </div>
  )
}
