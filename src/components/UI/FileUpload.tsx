import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext.tsx'

const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
const ACCEPT_EXT = '.mp3,.wav,.ogg,.flac,.m4a,.aac'

function isAudioFile(file: File): boolean {
  return ACCEPTED.includes(file.type) || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name)
}

export default function FileUpload() {
  const { loadAudioFile, audio } = useApp()
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCountRef = useRef(0)

  // Use document-level drag events to reliably detect file dragging over the window
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current++
      if (e.dataTransfer?.types.includes('Files')) {
        setDragging(true)
      }
    }
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current--
      if (dragCountRef.current <= 0) {
        dragCountRef.current = 0
        setDragging(false)
      }
    }
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      dragCountRef.current = 0
      setDragging(false)
      const file = e.dataTransfer?.files[0]
      if (file && isAudioFile(file)) {
        loadAudioFile(file)
      }
    }

    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [loadAudioFile])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadAudioFile(file)
      e.target.value = ''
    },
    [loadAudioFile],
  )

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <>
      {/* Hidden file input shared by all triggers */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_EXT}
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Drag-and-drop active indicator */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none"
          >
            <div className="border-2 border-dashed border-white/50 rounded-2xl p-16 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m0-16l-4 4m4-4l4 4" />
              </svg>
              <p className="text-white text-2xl font-light">Drop your audio file here</p>
              <p className="text-white/50 text-sm mt-2">MP3, WAV, OGG, FLAC, M4A, AAC</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing screen - shown when no audio is loaded */}
      {!audio.fileName && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center"
        >
          <div
            onClick={openFilePicker}
            className="cursor-pointer group max-w-md w-full mx-6"
          >
            <div className="border border-white/15 rounded-3xl px-12 py-14 text-center backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all duration-500 hover:border-white/25 hover:scale-[1.02]">
              {/* Music icon */}
              <div className="relative mx-auto mb-6 w-20 h-20">
                <svg className="w-20 h-20 text-white/40 group-hover:text-white/70 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                {/* Subtle animated ring */}
                <div className="absolute inset-0 rounded-full border border-white/10 animate-ping opacity-20" />
              </div>

              <p className="text-white/90 text-xl font-light mb-2">Click to choose an audio file</p>
              <p className="text-white/35 text-sm mb-6">or drag & drop anywhere on screen</p>

              <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">MP3</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">WAV</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">OGG</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">FLAC</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">M4A</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  )
}

/**
 * Small button to open file picker — used in playback controls
 * so users can load a new track without returning to the landing screen.
 */
export function OpenFileButton() {
  const { loadAudioFile } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadAudioFile(file)
      e.target.value = ''
    },
    [loadAudioFile],
  )

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_EXT}
        className="hidden"
        onChange={handleFileInput}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="text-white/40 hover:text-white/80 transition-colors shrink-0"
        title="Open audio file"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </button>
    </>
  )
}
