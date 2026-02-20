import { useEffect, useRef, useState, useCallback } from 'react'
import type { FrequencyBands } from '../types/index.ts'

const isTauri = () => '__TAURI__' in window || '__TAURI_INTERNALS__' in window

interface SystemFrequencyData {
  bands: number[]
  bass: number
  mid: number
  treble: number
  sub_bass: number
  low_mid: number
  high_mid: number
  timestamp: number
}

export function useSystemAudio() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [frequencyBands, setFrequencyBands] = useState<FrequencyBands>({
    subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0,
  })
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  const startCapture = useCallback(async () => {
    if (!isTauri()) {
      setError('System audio capture only available in desktop app')
      return
    }
    try {
      setError(null)
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('start_system_audio_capture')
      setIsCapturing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsCapturing(false)
    }
  }, [])

  const stopCapture = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('stop_system_audio_capture')
      setIsCapturing(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    } catch (err) {
      console.error('Failed to stop capture:', err)
    }
  }, [])

  // Poll frequency data from Rust backend
  useEffect(() => {
    if (!isCapturing) return

    const poll = async () => {
      const now = performance.now()
      if (now - lastUpdateRef.current < 16) { // 60fps cap
        rafRef.current = requestAnimationFrame(poll)
        return
      }
      lastUpdateRef.current = now

      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const data = await invoke<SystemFrequencyData>('get_frequency_data')

        setFrequencyBands({
          subBass: data.sub_bass,
          bass: data.bass,
          lowMid: data.low_mid,
          mid: data.mid,
          highMid: data.high_mid,
          treble: data.treble,
        })

        // Convert float bands to Uint8Array for compatibility with existing visualizations
        const uint8 = new Uint8Array(data.bands.length)
        for (let i = 0; i < data.bands.length; i++) {
          uint8[i] = Math.round(data.bands[i] * 255)
        }
        setFrequencyData(uint8)
      } catch (err) {
        console.error('Poll error:', err)
      }

      if (isCapturing) {
        rafRef.current = requestAnimationFrame(poll)
      }
    }

    rafRef.current = requestAnimationFrame(poll)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isCapturing])

  return { isCapturing, frequencyBands, frequencyData, startCapture, stopCapture, error }
}
