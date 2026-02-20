import { useEffect, useState } from 'react'

const isTauri = () => '__TAURI__' in window || '__TAURI_INTERNALS__' in window

export function useOSTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [accentColor, setAccentColor] = useState('#0078d4')

  useEffect(() => {
    // Detect OS theme preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setTheme(mediaQuery.matches ? 'dark' : 'light')

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    // Get Windows accent color via Tauri
    if (isTauri()) {
      import('@tauri-apps/api/core').then(({ invoke }) => {
        invoke<string>('get_system_accent_color')
          .then((color) => setAccentColor(color))
          .catch((err) => console.error('Failed to get accent color:', err))
      })
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return { theme, accentColor }
}
