import { useCallback, useEffect, useRef, useState } from 'react'
import type { RecordingState } from '../types/index.ts'

interface FormatCandidate {
  mimeType: string
  videoBitsPerSecond: number
  audioBitsPerSecond: number
}

function detectBestFormat(): FormatCandidate | null {
  const candidates: FormatCandidate[] = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 320_000 },
    { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 12_000_000, audioBitsPerSecond: 320_000 },
    { mimeType: 'video/webm;codecs=vp8,opus', videoBitsPerSecond: 10_000_000, audioBitsPerSecond: 256_000 },
    { mimeType: 'video/webm', videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 },
  ]
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mimeType)) return c
  }
  return null
}

function triggerDownload(blob: Blob, mimeType: string) {
  const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `visualizer-${timestamp}.${ext}`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, 1000)
}

export function useRecorder(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioContextRef: React.RefObject<AudioContext | null>,
  gainRef: React.RefObject<GainNode | null>,
) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const recordingStartTimeRef = useRef(0)
  const timerRef = useRef(0)

  const [recording, setRecording] = useState<RecordingState>({
    status: 'idle',
    duration: 0,
    format: null,
    error: null,
  })

  const startRecording = useCallback(() => {
    const canvas = canvasRef.current
    const audioCtx = audioContextRef.current
    const gain = gainRef.current

    if (!canvas) {
      setRecording((prev) => ({ ...prev, status: 'error', error: 'Canvas not ready yet.' }))
      return
    }

    const format = detectBestFormat()
    if (!format) {
      setRecording((prev) => ({ ...prev, status: 'error', error: 'Your browser does not support video recording.' }))
      return
    }

    // Video stream from canvas at 60fps
    const canvasStream = canvas.captureStream(60)

    // Audio tap — connect gain node to a MediaStreamDestination in parallel (if audio is ready)
    const tracks = [...canvasStream.getVideoTracks()]
    if (audioCtx && gain) {
      const audioDest = audioCtx.createMediaStreamDestination()
      gain.connect(audioDest)
      audioDestRef.current = audioDest
      tracks.push(...audioDest.stream.getAudioTracks())
    }

    const combinedStream = new MediaStream(tracks)

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: format.mimeType,
      videoBitsPerSecond: format.videoBitsPerSecond,
      audioBitsPerSecond: format.audioBitsPerSecond,
    })

    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      // Disconnect the audio tap if it was connected
      if (audioDestRef.current && gain) {
        try { gain.disconnect(audioDestRef.current) } catch {}
      }
      audioDestRef.current = null

      const blob = new Blob(chunksRef.current, { type: format.mimeType })
      triggerDownload(blob, format.mimeType)

      clearInterval(timerRef.current)
      setRecording({ status: 'idle', duration: 0, format: null, error: null })
    }

    recorder.onerror = () => {
      setRecording((prev) => ({ ...prev, status: 'error', error: 'Recording failed unexpectedly.' }))
    }

    // Request data every 1s to avoid huge memory spikes
    recorder.start(1000)
    mediaRecorderRef.current = recorder
    recordingStartTimeRef.current = performance.now()

    // Timer for duration display
    timerRef.current = window.setInterval(() => {
      setRecording((prev) => ({
        ...prev,
        duration: (performance.now() - recordingStartTimeRef.current) / 1000,
      }))
    }, 250)

    setRecording({ status: 'recording', duration: 0, format: format.mimeType, error: null })
  }, [canvasRef, audioContextRef, gainRef])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      setRecording((prev) => ({ ...prev, status: 'stopping' }))
      recorder.stop()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state !== 'inactive') {
        mediaRecorderRef.current?.stop()
      }
      clearInterval(timerRef.current)
    }
  }, [])

  return { recording, startRecording, stopRecording }
}
