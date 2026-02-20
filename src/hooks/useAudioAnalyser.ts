import { useCallback, useEffect, useRef, useState } from 'react'
import type { AudioState, SensitivitySettings } from '../types/index.ts'
import { extractFrequencyBands } from '../utils/audioProcessing.ts'
import { BeatDetector } from '../utils/beatDetection.ts'

const emptyBands = { subBass: 0, bass: 0, lowMid: 0, mid: 0, highMid: 0, treble: 0 }

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

  const [audio, setAudio] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    fileName: null,
    frequencyData: null,
    timeDomainData: null,
    frequencyBands: emptyBands,
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
    }
  }, [sensitivity.fftSize, sensitivity.smoothing])

  const tick = useCallback(() => {
    const analyser = analyserRef.current
    const ctx = audioContextRef.current
    if (!analyser || !ctx) return

    const freqData = new Uint8Array(analyser.frequencyBinCount)
    const timeData = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(freqData)
    analyser.getByteTimeDomainData(timeData)

    const bands = extractFrequencyBands(freqData, sensitivity.fftSize, sensitivity)
    const isBeat = beatDetectorRef.current.detect(freqData)
    if (isBeat) {
      setBeat(true)
      setTimeout(() => setBeat(false), 100)
    }

    const elapsed = ctx.currentTime - startTimeRef.current

    setAudio((prev) => ({
      ...prev,
      currentTime: elapsed,
      frequencyData: freqData,
      timeDomainData: timeData,
      frequencyBands: bands,
    }))

    rafRef.current = requestAnimationFrame(tick)
  }, [sensitivity])

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

      setAudio((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
        duration: audioBuffer.duration,
        fileName: file.name,
        frequencyData: null,
        timeDomainData: null,
        frequencyBands: emptyBands,
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
      setAudio((prev) => {
        if (prev.currentTime >= prev.duration - 0.1) {
          cancelAnimationFrame(rafRef.current)
          pauseOffsetRef.current = 0
          return { ...prev, isPlaying: false, currentTime: 0, frequencyBands: emptyBands }
        }
        return prev
      })
    }

    startTimeRef.current = ctx.currentTime - pauseOffsetRef.current
    source.start(0, pauseOffsetRef.current)

    setAudio((prev) => ({ ...prev, isPlaying: true }))
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

    setAudio((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const togglePlay = useCallback(() => {
    if (audio.isPlaying) pause()
    else play()
  }, [audio.isPlaying, pause, play])

  const seek = useCallback(
    (time: number) => {
      pauseOffsetRef.current = time
      if (audio.isPlaying) {
        play()
      } else {
        setAudio((prev) => ({ ...prev, currentTime: time }))
      }
    },
    [audio.isPlaying, play],
  )

  const setVolume = useCallback((vol: number) => {
    if (gainRef.current) gainRef.current.gain.value = vol
    setAudio((prev) => ({ ...prev, volume: vol }))
  }, [])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      sourceRef.current?.stop()
      audioContextRef.current?.close()
    }
  }, [])

  return { audio, beat, loadAudioFile, togglePlay, seek, setVolume }
}
