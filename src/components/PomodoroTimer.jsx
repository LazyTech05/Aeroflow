import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Clock, ChevronDown, ChevronUp } from 'lucide-react'

export default function PomodoroTimer() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [mode, setMode] = useState('focus') // 'focus' | 'short' | 'long'
  const [isActive, setIsActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  
  const timerRef = useRef(null)

  const modeTimes = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60
  }

  // Handle switching modes
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setIsActive(false)
    setTimeLeft(modeTimes[newMode])
  }

  // Timer logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsActive(false)
            clearInterval(timerRef.current)
            
            // Audio alert notification
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
              const osc = audioCtx.createOscillator()
              const gain = audioCtx.createGain()
              osc.connect(gain)
              gain.connect(audioCtx.destination)
              osc.frequency.setValueAtTime(440, audioCtx.currentTime) // A4 note
              gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
              osc.start()
              osc.stop(audioCtx.currentTime + 0.5) // play for 0.5s
            } catch (e) {
              console.error('Audio notification failed:', e)
            }
            
            alert(`⏰ Pomodoro session completed! Time for a ${mode === 'focus' ? 'break' : 'focus session'}.`)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }

    return () => clearInterval(timerRef.current)
  }, [isActive, mode])

  const toggleTimer = () => {
    setIsActive(!isActive)
  }

  const resetTimer = () => {
    setIsActive(false)
    setTimeLeft(modeTimes[mode])
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const totalDuration = modeTimes[mode]
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100

  // 1. Collapsed State: Tiny round floating badge showing timer
  if (!isExpanded) {
    return (
      <button 
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
        title="Open Focus Timer"
      >
        <Clock className="w-5 h-5 animate-pulse" />
        {isActive && (
          <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-zinc-950 font-bold px-1.5 py-0.5 rounded-full border border-zinc-950">
            {formatTime(timeLeft)}
          </span>
        )}
      </button>
    )
  }

  // 2. Expanded State: Premium Glassmorphic Card
  return (
    <div className="fixed bottom-6 right-6 z-50 w-64 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-xl text-white backdrop-blur-md flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <div className="flex items-center gap-1.5 text-zinc-400 font-bold text-[10px] uppercase tracking-wider">
          <Clock className="w-3.5 h-3.5" />
          <span>Focus Timer</span>
        </div>
        <button 
          onClick={() => setIsExpanded(false)}
          className="p-0.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Switches */}
      <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-850 select-none text-[9px] font-bold">
        {['focus', 'short', 'long'].map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex-1 py-1 rounded-md transition-all cursor-pointer capitalize ${
              mode === m 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-white'
            }`}
          >
            {m === 'focus' ? 'Focus' : m === 'short' ? 'Short Break' : 'Long Break'}
          </button>
        ))}
      </div>

      {/* Radial Progress + Time Countdown */}
      <div className="relative flex items-center justify-center py-2">
        <svg className="w-36 h-36 transform -rotate-90">
          <circle
            cx="72"
            cy="72"
            r="60"
            strokeWidth="6"
            stroke="#18181b"
            fill="transparent"
          />
          <circle
            cx="72"
            cy="72"
            r="60"
            strokeWidth="6"
            stroke={mode === 'focus' ? '#f59e0b' : '#3b82f6'}
            fill="transparent"
            strokeDasharray={376.99}
            strokeDashoffset={376.99 - (376.99 * progressPercent) / 100}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        {/* Inside countdown */}
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-extrabold tracking-tight font-mono">{formatTime(timeLeft)}</span>
          <span className="text-[8px] text-zinc-450 uppercase tracking-widest mt-0.5 font-bold">
            {isActive ? 'Working' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Timer Control Buttons */}
      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border ${
            isActive 
              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750' 
              : 'bg-white border-white text-zinc-950 hover:bg-zinc-100'
          }`}
        >
          {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-2 border border-zinc-850 hover:bg-zinc-900 rounded-xl cursor-pointer text-zinc-400 hover:text-white"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </div>
  )
}
