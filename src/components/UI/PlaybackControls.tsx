import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext.tsx'
import { OpenFileButton } from './FileUpload.tsx'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function PlaybackControls() {
  const { audio, togglePlay, seek, setVolume, settings } = useApp()
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const hideTimeout = settings.behavior.hideUITimeout * 1000

  useEffect(() => {
    if (!audio.fileName) return
    const handler = () => {
      setVisible(true)
      clearTimeout(timerRef.current)
      if (hideTimeout > 0) {
        timerRef.current = setTimeout(() => setVisible(false), hideTimeout)
      }
    }
    window.addEventListener('mousemove', handler)
    handler()
    return () => {
      window.removeEventListener('mousemove', handler)
      clearTimeout(timerRef.current)
    }
  }, [audio.fileName, hideTimeout])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const ratio = (e.clientX - rect.left) / rect.width
      seek(ratio * audio.duration)
    },
    [audio.duration, seek],
  )

  if (!audio.fileName) return null

  const progress = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: visible || hovering ? 1 : 0.15, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="fixed bottom-6 left-6 right-6 z-20 flex items-center gap-4 px-5 py-3 rounded-xl backdrop-blur-xl bg-black/40 border border-white/10"
    >
      {/* Open file button */}
      <OpenFileButton />

      <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors shrink-0">
        {audio.isPlaying ? (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <span className="text-white/60 text-xs font-mono w-10 shrink-0">{formatTime(audio.currentTime)}</span>

      <div
        className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
        onClick={handleProgressClick}
      >
        <div
          className="h-full rounded-full transition-all duration-75"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${settings.colors.primary}, ${settings.colors.secondary})`,
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
        />
      </div>

      <span className="text-white/60 text-xs font-mono w-10 shrink-0">{formatTime(audio.duration)}</span>

      <div className="flex items-center gap-2 shrink-0">
        <svg className="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={audio.volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1 accent-white appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
      </div>

      <span className="text-white/40 text-xs truncate max-w-32">{audio.fileName}</span>
    </motion.div>
  )
}
