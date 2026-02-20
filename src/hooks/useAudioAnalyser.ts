import { useCallback, useEffect, useRef, useState } from 'react'
import type { FrequencyBands, SensitivitySettings } from '../types/index.ts'
import { extractFrequencyBands } from '../utils/audioProcessing.ts'
import { BeatDetector } from '../utils/beatDetection.ts'

const emptyBands: FrequencyBands = { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 }

/** Frame data stored in a ref — read by visualizations in useFrame, never triggers re-renders */
export interface AudioFrameData {
  frequencyData: Uint8Array | null
  timeDomainData: Uint8Array | null
  frequencyBands: FrequencyBands
}

/** Playback state stored in React state — only updates on user actions */
export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  fileName: string | null
}

export function useAudioAnalyser(sensitivity: SensitivitySettings) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const bufferRef = useRef<AudioBuffer | null>(null)
  const startTimeRef = useRef(0)
  const pauseOffsetRef = useRef(0)
  const rafRef = useRef(0)
  const beatDetectorRef = useRef(new BeatDetector())

  // Pre-allocated arrays — reused every frame, no GC pressure
  const freqArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const timeArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  // Frame data in a ref — visualizations read this directly, no re-renders
  const frameDataRef = useRef<AudioFrameData>({
    frequencyData: null,
    timeDomainData: null,
    frequencyBands: emptyBands,
  })

  // Only playback state in React state — changes infrequently
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    fileName: null,
  })

  const [beat, setBeat] = useState(false)

  const getOrCreateContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = sensitivity.fftSize
      analyserRef.current.smoothingTimeConstant = sensitivity.smoothing
      gainRef.current = audioContextRef.current.createGain()
      gainRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }
    return audioContextRef.current
  }, []) // intentionally no deps - we only create once

  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = sensitivity.fftSize
      analyserRef.current.smoothingTimeConstant = sensitivity.smoothing
      // Resize pre-allocated arrays when FFT size changes
      freqArrayRef.current = null
      timeArrayRef.current = null
    }
  }, [sensitivity.fftSize, sensitivity.smoothing])

  // Store latest sensitivity in a ref so tick can read it without recreating
  const sensitivityRef = useRef(sensitivity)
  sensitivityRef.current = sensitivity

  // Throttle playback time updates to ~4 fps instead of 60
  const lastTimeUpdateRef = useRef(0)

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = audioContextRef.current
    if (!analyser || !ctx) return

    // Reuse pre-allocated arrays
    const binCount = analyser.frequencyBinCount
    if (!freqArrayRef.current || freqArrayRef.current.length !== binCount) {
      freqArrayRef.current = new Uint8Array(binCount) as Uint8Array<ArrayBuffer>
      timeArrayRef.current = new Uint8Array(binCount) as Uint8Array<ArrayBuffer>
    }

    const freqData = freqArrayRef.current
    const timeData = timeArrayRef.current!
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)

    const sens = sensitivityRef.current
    const bands = extractFrequencyBands(freqData, sens.fftSize, sens)

    // Write frame data to ref — no React re-render
    frameDataRef.current.frequencyData = freqData
    frameDataRef.current.timeDomainData = timeData
    frameDataRef.current.frequencyBands = bands

    const isBeat = beatDetectorRef.current.detect(freqData)
    if (isBeat) {
      setBeat(true)
      setTimeout(() => setBeat(false), 100)
    }

    // Only update React state for currentTime ~4 times per second
    const now = performance.now()
    if (now - lastTimeUpdateRef.current > 250) {
      lastTimeUpdateRef.current = now
      const elapsed = ctx.currentTime - startTimeRef.current
      setPlayback((prev) => (Math.abs(prev.currentTime - elapsed) > 0.2 ? { ...prev, currentTime: elapsed } : prev))
    }

    rafRef.current = requestAnimationFrame(tick)
  }, []) // no deps - reads from refs

  const loadAudioFile = useCallback(
    async (file: File) => {
      const ctx = getOrCreateContext()
      if (ctx.state === 'suspended') await ctx.resume()

      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
      bufferRef.current = audioBuffer
      pauseOffsetRef.current = 0
      beatDetectorRef.current.reset()

      if (sourceRef.current) {
        sourceRef.current.stop()
        sourceRef.current.disconnect()
      }
      cancelAnimationFrame(rafRef.current)

      // Clear frame data
      frameDataRef.current.frequencyData = null
      frameDataRef.current.timeDomainData = null
      frameDataRef.current.frequencyBands = emptyBands

      setPlayback((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: audioBuffer.duration,
        fileName: file.name,
      }))
    },
    [getOrCreateContext],
  )

  const play = useCallback(() => {
    const ctx = audioContextRef.current
    const buffer = bufferRef.current
    if (!ctx || !buffer || !gainRef.current) return

    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(gainRef.current)
    sourceRef.current = source

    source.onended = () => {
      setPlayback((prev) => {
        if (prev.currentTime >= prev.duration - 0.1) {
          cancelAnimationFrame(rafRef.current)
          pauseOffsetRef.current = 0
          frameDataRef.current.frequencyData = null
          frameDataRef.current.timeDomainData = null
          frameDataRef.current.frequencyBands = emptyBands
          return { ...prev, isPlaying: false, currentTime: 0 }
        }
        return prev
      })
    }

    startTimeRef.current = ctx.currentTime - pauseOffsetRef.current
    source.start(0, pauseOffsetRef.current)

    setPlayback((prev) => ({ ...prev, isPlaying: true }))
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const pause = useCallback(() => {
    const ctx = audioContextRef.current
    if (!ctx || !sourceRef.current) return

    pauseOffsetRef.current = ctx.currentTime - startTimeRef.current
    sourceRef.current.stop()
    sourceRef.current.disconnect()
    sourceRef.current = null
    cancelAnimationFrame(rafRef.current)

    setPlayback((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const togglePlay = useCallback(() => {
    if (playback.isPlaying) pause()
    else play()
  }, [playback.isPlaying, pause, play])

  const seek = useCallback(
    (time: number) => {
      pauseOffsetRef.current = time
      if (playback.isPlaying) {
        play()
      } else {
        setPlayback((prev) => ({ ...prev, currentTime: time }))
      }
    },
    [playback.isPlaying, play],
  )

  const setVolume = useCallback((vol: number) => {
    if (gainRef.current) gainRef.current.gain.value = vol
    setPlayback((prev) => ({ ...prev, volume: vol }))
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      sourceRef.current?.stop()
      audioContextRef.current?.close()
    }
  }, [])

  return { playback, beat, frameDataRef, loadAudioFile, togglePlay, seek, setVolume }
}
