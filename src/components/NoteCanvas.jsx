import { useState, useEffect, useRef } from 'react'
import { ClipboardList, X, Check, Copy, Plus, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

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

// Convert contentEditable HTML back to markdown with inline image support
function htmlToMarkdown(html) {
  const temp = document.createElement('div')
  temp.innerHTML = html

  let markdown = ''
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      markdown += node.nodeValue
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'IMG') {
        const src = node.getAttribute('src')
        if (src && src.startsWith('data:image/')) {
          markdown += `\n![pasted-image](${src})\n`
        }
      } else if (node.tagName === 'BR') {
        markdown += '\n'
      } else {
        const isBlock = ['DIV', 'P', 'H1', 'H2', 'H3'].includes(node.tagName)
        if (isBlock && markdown && !markdown.endsWith('\n')) {
          markdown += '\n'
        }
        for (const child of node.childNodes) {
          walk(child)
        }
        if (isBlock && !markdown.endsWith('\n')) {
          markdown += '\n'
        }
      }
    }
  }

  for (const child of temp.childNodes) {
    walk(child)
  }

  return markdown.trim()
}

// Convert markdown to clean HTML containing inline image tags
function markdownToHtml(markdown) {
  if (!markdown) return '<div><br></div>'

  // Escape HTML tags to prevent syntax corruption
  let escaped = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Render markdown images as inline image tags
  const htmlWithImgs = escaped.replace(
    /!\[pasted-image\]\((data:image\/[^)]+)\)/g,
    '<img src="$1" class="max-h-60 w-full object-cover rounded-lg my-2 shadow-2xs border border-zinc-200 select-none" data-markdown-img="true" />'
  )

  // Convert lines into HTML divs for contentEditable consistency
  return htmlWithImgs
    .split('\n')
    .map(line => {
      if (line === '') return '<div><br></div>'
      return `<div>${line}</div>`
    })
    .join('')
}

export default function NoteCanvas({ 
  noteTitle, 
  setNoteTitle, 
  noteBody, 
  setNoteBody, 
  noteImageUrl, 
  setNoteImageUrl,
  mobileNotesOpen, 
  setMobileNotesOpen,
  titleInputRef,
  onSaveNote,
  onNewNote,
  activeNoteId,
  onDeleteNote
}) {
  const [copied, setCopied] = useState(false)
  const [isNoteSaved, setIsNoteSaved] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editorMode, setEditorMode] = useState('edit') // 'edit' | 'preview'
  const [slashMenu, setSlashMenu] = useState({ open: false, x: 0, y: 0 })

  const editorRef = useRef(null)
  const lastHtmlRef = useRef('')

  // Reset to edit mode when active note changes
  useEffect(() => {
    setEditorMode('edit')
    setHasUnsavedChanges(false)
    setIsNoteSaved(false)
    setIsSaving(false)
  }, [activeNoteId])

  // Sync state to editor DOM when the note loads or is cleared or when editor remounts
  useEffect(() => {
    if (editorRef.current && editorMode === 'edit') {
      const currentHtml = markdownToHtml(noteBody)
      const isEmpty = editorRef.current.innerHTML === '' || editorRef.current.innerHTML === '<div><br></div>'
      if (isEmpty || lastHtmlRef.current !== currentHtml) {
        editorRef.current.innerHTML = currentHtml
        lastHtmlRef.current = currentHtml
      }
    }
  }, [activeNoteId, noteBody === '', editorMode, mobileNotesOpen])

  const handleApplyFormat = (formatText) => {
    const updatedBody = noteBody.substring(0, noteBody.length - 1) + formatText
    setNoteBody(updatedBody)
    setHasUnsavedChanges(true)

    if (editorRef.current) {
      const currentHtml = markdownToHtml(updatedBody)
      editorRef.current.innerHTML = currentHtml
      lastHtmlRef.current = currentHtml
      editorRef.current.focus()

      // Position cursor at the end
      setTimeout(() => {
        const range = document.createRange()
        const sel = window.getSelection()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }, 10)
    }
    setSlashMenu({ open: false, x: 0, y: 0 })
  }

  const handleEditorInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      lastHtmlRef.current = html
      const markdown = htmlToMarkdown(html)
      setNoteBody(markdown)
      setHasUnsavedChanges(true)

      if (markdown.endsWith('/')) {
        setSlashMenu({ open: true, x: 0, y: 0 })
      } else {
        setSlashMenu({ open: false, x: 0, y: 0 })
      }
    }
  }

  const handlePaste = (e) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          e.preventDefault()
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64 = event.target.result
            
            // Insert img tag at current selection cursor in contentEditable
            const selection = window.getSelection()
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              range.deleteContents()
              
              const img = document.createElement('img')
              img.src = base64
              img.className = 'max-h-60 w-full object-cover rounded-lg my-2 shadow-2xs border border-zinc-200 select-none'
              img.setAttribute('data-markdown-img', 'true')
              
              range.insertNode(img)
              // Move cursor after the inserted image
              range.setStartAfter(img)
              range.setEndAfter(img)
              selection.removeAllRanges()
              selection.addRange(range)
              
              // Trigger input sync
              handleEditorInput()
            }
          }
          reader.readAsDataURL(file)
        }
      }
    }
  }

  // Auto-save feedback loop to the database
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const hasContent = noteTitle.trim() !== '' || noteBody.trim() !== '' || noteImageUrl.trim() !== ''
    if (hasContent) {
      setIsSaving(true)
      const timeout = setTimeout(async () => {
        try {
          if (onSaveNote) {
            await onSaveNote(noteTitle, noteBody, noteImageUrl)
            setHasUnsavedChanges(false)
            setIsSaving(false)
            setIsNoteSaved(true)
          }
        } catch (error) {
          console.error('Error auto-saving note:', error)
          setIsSaving(false)
        }
      }, 800)
      return () => clearTimeout(timeout)
    }
  }, [noteTitle, noteBody, noteImageUrl, hasUnsavedChanges])

  const handleManualSave = async () => {
    setIsSaving(true)
    try {
      if (onSaveNote) {
        await onSaveNote(noteTitle, noteBody, noteImageUrl)
        setHasUnsavedChanges(false)
        setIsSaving(false)
        setIsNoteSaved(true)
      }
    } catch (error) {
      console.error('Error saving note manually:', error)
    }
  }

  const handleCopyNote = () => {
    if (!noteBody) return
    navigator.clipboard.writeText(noteBody)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getWordCount = () => {
    if (!noteBody.trim()) return 0
    return noteBody.trim().split(/\s+/).length
  }

  return (
    <>
      {mobileNotesOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl h-[85vh] bg-surface border border-white/10 shadow-card flex flex-col rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        {/* Canvas Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-surface">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand/20 border border-brand/30 rounded-lg shadow-card">
              <ClipboardList className="w-4 h-4 text-brand" />
            </div>
            <h2 className="font-bold text-white text-sm tracking-wide">Quick Access Notes</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Save Action */}
            <div className="flex items-center gap-1.5">
              {(noteTitle || noteBody) && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-300 ${
                  isSaving ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  hasUnsavedChanges ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-glow-green'
                }`}>
                  {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}
                </span>
              )}
              <button
                onClick={handleManualSave}
                disabled={!hasUnsavedChanges || (!noteTitle && !noteBody)}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-colors shadow-card border border-white/10 ${
                  !hasUnsavedChanges || (!noteTitle && !noteBody) 
                    ? 'bg-white/5 text-zinc-500 border-white/5 cursor-not-allowed opacity-70' 
                    : 'bg-brand hover:bg-brandHover text-white cursor-pointer'
                }`}
              >
                Save Note
              </button>
            </div>

            {/* Edit / Preview Segment Toggle */}
            <div className="flex items-center bg-canvas p-1 rounded-lg border border-white/5 select-none">
              <button
                onClick={() => setEditorMode('edit')}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  editorMode === 'edit'
                    ? 'bg-brand text-white shadow-card'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  editorMode === 'preview'
                    ? 'bg-brand text-white shadow-card'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Preview
              </button>
            </div>
            
            {/* Create new note button */}
            <button 
              onClick={onNewNote}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              title="Create New Note"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button 
              onClick={() => setMobileNotesOpen(false)}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer transition-colors"
              title="Close Note Canvas"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Note Title input */}
        <div className="px-6 py-4 border-b border-white/5 bg-canvas">
          <input
            ref={titleInputRef}
            type="text"
            placeholder="Draft Title..."
            value={noteTitle}
            onChange={(e) => {
              setNoteTitle(e.target.value)
              setHasUnsavedChanges(true)
            }}
            className="w-full text-sm font-semibold text-white placeholder-zinc-500 bg-transparent border-0 border-transparent p-0 focus:ring-0 focus:outline-none focus:border-transparent focus:shadow-none"
          />
        </div>

        {/* Image URL input */}
        <div className="px-6 py-2.5 border-b border-white/5 bg-canvas flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 select-none">Image URL:</span>
          <input
            type="text"
            placeholder="Optional image link..."
            value={noteImageUrl}
            onChange={(e) => {
              setNoteImageUrl(e.target.value)
              setHasUnsavedChanges(true)
            }}
            className="w-full text-xs text-zinc-400 placeholder-zinc-600 bg-transparent border-0 border-transparent p-0 focus:ring-0 focus:outline-none focus:border-transparent focus:shadow-none"
          />
        </div>

        {/* Scrollable distraction-free editor canvas */}
        <div className="flex-1 bg-canvas overflow-y-auto p-6 space-y-4">
          <style>{`
            .editable-editor:empty:before {
              content: attr(data-placeholder);
              color: #475569;
              cursor: text;
              display: block;
            }
          `}</style>
          {noteImageUrl && noteImageUrl.trim() !== '' && (
            <div className="relative group/image">
              <img
                src={noteImageUrl}
                alt="Embedded preview"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
                className="max-h-60 w-full object-cover rounded-xl shadow-xl border border-white/10"
              />
              <button
                onClick={() => {
                  setNoteImageUrl('')
                  setHasUnsavedChanges(true)
                }}
                className="absolute top-2 right-2 p-1 rounded-md bg-white/80 hover:bg-white text-zinc-650 hover:text-zinc-950 shadow-xs cursor-pointer opacity-0 group-hover/image:opacity-100 transition-opacity"
                title="Remove Image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {editorMode === 'edit' ? (
            <div className="relative flex-1 flex flex-col min-h-[300px]">
              {slashMenu.open && (
                <div className="absolute top-0 left-0 z-40 bg-zinc-900 text-white rounded-xl border border-zinc-800 shadow-lg p-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <span className="text-[10px] font-bold text-zinc-400 px-2 uppercase tracking-wide border-r border-zinc-800 mr-1 select-none">Format</span>
                  <button onClick={() => handleApplyFormat('# ')} className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-800 rounded-lg cursor-pointer">H1</button>
                  <button onClick={() => handleApplyFormat('## ')} className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-800 rounded-lg cursor-pointer">H2</button>
                  <button onClick={() => handleApplyFormat('- [ ] ')} className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-800 rounded-lg cursor-pointer">Todo</button>
                  <button onClick={() => handleApplyFormat('> ')} className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-800 rounded-lg cursor-pointer">Quote</button>
                  <button onClick={() => handleApplyFormat('```js\n\n```')} className="px-2.5 py-1 text-xs font-bold hover:bg-zinc-800 rounded-lg font-mono cursor-pointer">Code</button>
                  <button onClick={() => setSlashMenu({ open: false, x: 0, y: 0 })} className="p-1 text-zinc-400 hover:text-white rounded-lg cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onPaste={handlePaste}
                className="editable-editor w-full min-h-[300px] h-full text-sm text-slate-300 placeholder-zinc-600 bg-transparent focus:outline-hidden"
                data-placeholder="Type your unedited, rapid raw thoughts here... (Type / for formatting)"
                style={{
                  outline: 'none',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              />
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-sm text-slate-300 overflow-y-auto leading-relaxed pb-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: renderCode,
                  img: ({ src, alt, ...props }) => (
                    <img
                      src={src}
                      alt={alt || 'Embedded image'}
                      className="max-h-60 w-full object-cover rounded-lg my-2 shadow-2xs border border-zinc-200 select-none"
                      {...props}
                    />
                  )
                }}
              >
                {noteBody || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Note Status, Counters & Utility Actions Bar */}
        <div className="p-6 border-t border-white/5 bg-surface/50 flex items-center justify-between text-xs text-zinc-500 font-medium rounded-b-3xl">
          <div className="flex items-center gap-4">
            <span>{getWordCount()} {getWordCount() === 1 ? 'word' : 'words'}</span>
            <span className="text-zinc-600">|</span>
            <span>{noteBody.length} chars</span>
          </div>

          <div className="flex gap-2">
            {activeNoteId && (
              <button
                onClick={onDeleteNote}
                className="p-2 rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors shadow-3xs flex items-center gap-1.5 cursor-pointer"
                title="Delete Note"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={handleCopyNote}
              disabled={!noteBody}
              className={`p-2 rounded-lg border border-white/10 bg-canvas hover:bg-surface text-zinc-400 hover:text-white transition-colors shadow-3xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Copy to Clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}
