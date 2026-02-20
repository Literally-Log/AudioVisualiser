import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Lazy import Tauri APIs - only available in desktop context
const isTauri = () => '__TAURI__' in window || '__TAURI_INTERNALS__' in window

async function getTauriWindow() {
  const { getCurrentWindow } = await import('@tauri-apps/api/window')
  return getCurrentWindow()
}

export function CustomTitlebar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    setDesktop(isTauri())
  }, [])

  useEffect(() => {
    if (!desktop) return
    const checkMaximized = async () => {
      try {
        const win = await getTauriWindow()
        setIsMaximized(await win.isMaximized())
      } catch {}
    }
    checkMaximized()
    const interval = setInterval(checkMaximized, 500)
    return () => clearInterval(interval)
  }, [desktop])

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout> | undefined

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 60) {
        setIsVisible(true)
        clearTimeout(hideTimeout)
        hideTimeout = setTimeout(() => setIsVisible(false), 2500)
      } else if (e.clientY > 100) {
        clearTimeout(hideTimeout)
        hideTimeout = setTimeout(() => setIsVisible(false), 1000)
      }
    }

    setIsVisible(true)
    const initialHide = setTimeout(() => setIsVisible(false), 3000)

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      clearTimeout(hideTimeout)
      clearTimeout(initialHide)
    }
  }, [])

  if (!desktop) return null

  const handleMinimize = async () => {
    try {
      const win = await getTauriWindow()
      await win.minimize()
    } catch {}
  }

  const handleMaximize = async () => {
    try {
      const win = await getTauriWindow()
      await win.toggleMaximize()
    } catch {}
  }

  const handleClose = async () => {
    try {
      const win = await getTauriWindow()
      await win.close()
    } catch {}
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-0 left-0 right-0 h-14 z-[9999]"
        >
          {/* Gradient backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-xl pointer-events-none" />

          {/* Drag region - entire titlebar is draggable */}
          <div
            data-tauri-drag-region
            className="absolute inset-0"
          />

          {/* App branding */}
          <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shadow-lg shadow-blue-500/50" />
            <span className="text-white/70 text-sm font-medium tracking-wider">
              AudioViz
            </span>
          </div>

          {/* Window controls */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
            {/* Minimize */}
            <motion.button
              onClick={handleMinimize}
              className="group relative w-10 h-10 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-white/60 group-hover:bg-white transition-colors" />
              </div>
            </motion.button>

            {/* Maximize/Restore */}
            <motion.button
              onClick={handleMaximize}
              className="group relative w-10 h-10 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                {isMaximized ? (
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute top-0 right-0 w-3 h-3 border-[1.5px] border-white/60 group-hover:border-white rounded-[2px] transition-colors" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-[1.5px] border-white/60 group-hover:border-white rounded-[2px] bg-black/40 transition-colors" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 border-[1.5px] border-white/60 group-hover:border-white rounded-[2px] transition-colors" />
                )}
              </div>
            </motion.button>

            {/* Close */}
            <motion.button
              onClick={handleClose}
              className="group relative w-10 h-10 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-red-500/20 transition-colors duration-200" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-4 h-4">
                  <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-white/60 group-hover:bg-red-400 rotate-45 transition-colors" />
                  <div className="absolute top-1/2 left-0 w-full h-[1.5px] bg-white/60 group-hover:bg-red-400 -rotate-45 transition-colors" />
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
