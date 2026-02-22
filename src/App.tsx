import { useState, useEffect } from 'react'
import VisualizerCanvas from './components/VisualizerCanvas.tsx'
import FileUpload from './components/UI/FileUpload.tsx'
import PlaybackControls from './components/UI/PlaybackControls.tsx'
import SettingsPanel from './components/UI/SettingsPanel.tsx'
import SettingsToggle from './components/UI/SettingsToggle.tsx'
import { CustomTitlebar } from './components/Desktop/CustomTitlebar.tsx'
import { WallpaperMode } from './components/Desktop/WallpaperMode.tsx'
import { useOSTheme } from './hooks/useOSTheme.ts'
import { useApp } from './context/AppContext.tsx'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { theme, accentColor } = useOSTheme()
  const { recording } = useApp()

  // Apply OS theme and accent color to root element
  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.style.setProperty('--accent-color', accentColor)

    // Parse hex to RGB for CSS variable
    const r = parseInt(accentColor.slice(1, 3), 16)
    const g = parseInt(accentColor.slice(3, 5), 16)
    const b = parseInt(accentColor.slice(5, 7), 16)
    document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`)
  }, [theme, accentColor])

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <CustomTitlebar />
      <WallpaperMode />
      <VisualizerCanvas />
      <FileUpload />
      <PlaybackControls />
      <SettingsToggle isOpen={settingsOpen} toggle={() => setSettingsOpen((p) => !p)} />
      <SettingsPanel isOpen={settingsOpen} />

      {recording.status === 'recording' && (
        <div className="fixed top-5 left-5 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md bg-black/40 border border-red-500/30">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-300 text-xs font-mono">
            REC {formatDuration(recording.duration)}
          </span>
        </div>
      )}
    </div>
  )
}
