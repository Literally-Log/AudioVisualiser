import { useState, useEffect } from 'react'
import VisualizerCanvas from './components/VisualizerCanvas.tsx'
import FileUpload from './components/UI/FileUpload.tsx'
import PlaybackControls from './components/UI/PlaybackControls.tsx'
import SettingsPanel from './components/UI/SettingsPanel.tsx'
import SettingsToggle from './components/UI/SettingsToggle.tsx'
import { CustomTitlebar } from './components/Desktop/CustomTitlebar.tsx'
import { WallpaperMode } from './components/Desktop/WallpaperMode.tsx'
import { useOSTheme } from './hooks/useOSTheme.ts'

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { theme, accentColor } = useOSTheme()

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
    </div>
  )
}
