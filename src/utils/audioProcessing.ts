import type { FrequencyBands, SensitivitySettings } from '../types/index.ts'

const SAMPLE_RATE = 44100

function freqToBin(freq: number, fftSize: number): number {
  return Math.round((freq * fftSize) / SAMPLE_RATE)
}

function averageRange(data: Uint8Array, start: number, end: number): number {
  if (start >= end || start >= data.length) return 0
  const s = Math.max(0, start)
  const e = Math.min(data.length, end)
  let sum = 0
  for (let i = s; i < e; i++) sum += data[i]
  return sum / (e - s) / 255
}

export function extractFrequencyBands(
  data: Uint8Array,
  fftSize: number,
  sensitivity: SensitivitySettings,
): FrequencyBands {
  const { bassBoost, trebleBoost, overall } = sensitivity

  const subBass = averageRange(data, freqToBin(20, fftSize), freqToBin(60, fftSize)) * bassBoost * overall
  const bass = averageRange(data, freqToBin(60, fftSize), freqToBin(250, fftSize)) * bassBoost * overall
  const lowMid = averageRange(data, freqToBin(250, fftSize), freqToBin(500, fftSize)) * overall
  const mid = averageRange(data, freqToBin(500, fftSize), freqToBin(2000, fftSize)) * overall
  const highMid = averageRange(data, freqToBin(2000, fftSize), freqToBin(4000, fftSize)) * trebleBoost * overall
  const treble = averageRange(data, freqToBin(4000, fftSize), freqToBin(20000, fftSize)) * trebleBoost * overall

  return {
    subBass: Math.min(1, subBass),
    bass: Math.min(1, bass),
    lowMid: Math.min(1, lowMid),
    mid: Math.min(1, mid),
    highMid: Math.min(1, highMid),
    treble: Math.min(1, treble),
  }
}

export function normalizeFrequencyData(data: Uint8Array): Float32Array {
  const out = new Float32Array(data.length)
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i] / 255
  }
  return out
}
