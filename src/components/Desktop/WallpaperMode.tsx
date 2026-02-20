import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const isTauri = () => '__TAURI__' in window || '__TAURI_INTERNALS__' in window

export function WallpaperMode() {
  const [isWallpaperMode, setIsWallpaperMode] = useState(false)
  const [desktop, setDesktop] = useState(false)

  useEffect(() => {
    setDesktop(isTauri())
  }, [])

  useEffect(() => {
    if (!desktop) return

    let unlisten: (() => void) | undefined

    const setup = async () => {
      const { listen } = await import('@tauri-apps/api/event')
      unlisten = await listen('toggle-wallpaper-mode', async () => {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        const newMode = !isWallpaperMode
        setIsWallpaperMode(newMode)

        try {
          if (newMode) {
            await win.setAlwaysOnBottom(true)
            await win.setIgnoreCursorEvents(true)
            await win.maximize()
          } else {
            await win.setAlwaysOnBottom(false)
            await win.setIgnoreCursorEvents(false)
            await win.unmaximize()
          }
        } catch (err) {
          console.error('Wallpaper mode error:', err)
        }
      })
    }

    setup()
    return () => { unlisten?.() }
  }, [desktop, isWallpaperMode])

  if (!desktop) return null

  return (
    <AnimatePresence>
      {isWallpaperMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed top-6 right-6 z-[10000] pointer-events-none"
        >
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-white/80 text-sm font-medium">Wallpaper Mode</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
