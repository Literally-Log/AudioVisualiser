import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext.tsx'

type AudioSource = 'file' | 'system'

const isTauri = () => '__TAURI__' in window || '__TAURI_INTERNALS__' in window

export function AudioSourceSelector() {
  const { audio } = useApp()
  const [source, setSource] = useState<AudioSource>('file')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const desktop = isTauri()

  if (!desktop) return null

  const handleSourceChange = async (newSource: AudioSource) => {
    if (source === newSource) return
    setError(null)

    if (source === 'system') {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('stop_system_audio_capture')
        setIsCapturing(false)
      } catch {}
    }

    setSource(newSource)

    if (newSource === 'system') {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        await invoke('start_system_audio_capture')
        setIsCapturing(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
        setIsCapturing(false)
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-white/60 text-xs uppercase tracking-wider mb-1">Audio Source</h3>
      <div className="flex gap-2 p-1.5 glass-panel rounded-xl">
        <SourceButton
          active={source === 'file'}
          onClick={() => handleSourceChange('file')}
          label="File Upload"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
            </svg>
          }
        />
        <SourceButton
          active={source === 'system'}
          onClick={() => handleSourceChange('system')}
          label="System Audio"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 12h.01" />
            </svg>
          }
        />
      </div>

      <AnimatePresence>
        {source === 'system' && error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <p className="text-red-400 text-xs">{error}</p>
          </motion.div>
        )}
        {source === 'system' && isCapturing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 glass-panel rounded-lg flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white/60 text-xs">Capturing system audio</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SourceButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        flex-1 px-3 py-2.5 rounded-lg text-xs font-medium
        transition-all duration-200 relative overflow-hidden
        ${active ? 'text-white' : 'text-white/50 hover:text-white/80'}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {active && (
        <motion.div
          layoutId="activeAudioSource"
          className="absolute inset-0 bg-white/10 rounded-lg"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative flex items-center justify-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </motion.button>
  )
}
