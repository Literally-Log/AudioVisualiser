import type { FrequencyTuningSettings, PeakHoldSettings, Preset, VisualizationSettings } from '../types/index.ts'

export const defaultSensitivity = {
  bassBoost: 1.0,
  trebleBoost: 1.0,
  overall: 1.0,
  smoothing: 0.8,
  fftSize: 2048,
  frequencyRange: 'full' as const,
}

export const defaultEffects = {
  bloomEnabled: true,
  bloomIntensity: 1.5,
  bloomThreshold: 0.2,
  chromaticAberration: false,
  chromaticAberrationOffset: 0.002,
  filmGrain: false,
  filmGrainIntensity: 0.3,
  vignette: true,
  vignetteIntensity: 0.5,
  rotationSpeed: 0,
  cameraMode: 'static' as const,
  particleDensity: 3000,
  trailLength: 0,
}

export const defaultVisualization: VisualizationSettings = {
  resolution: 64,
  scale: 1.0,
  mirror: 'none',
}

export const defaultFrequencyTuning: FrequencyTuningSettings = {
  subBassGain: 100,
  bassGain: 100,
  midGain: 100,
  trebleGain: 100,
  minFrequency: 20,
  maxFrequency: 20000,
  smoothness: 50,
}

export const defaultPeakHold: PeakHoldSettings = {
  enabled: false,
  falloffTime: 1.0,
  scaleX: 1.0,
  scaleY: 0.3,
}

export const presets: Preset[] = [
  {
    name: 'Cyberpunk',
    vizType: 'bars',
    colors: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ff0088', background: '#0a0014' },
    sensitivity: { ...defaultSensitivity, bassBoost: 1.4 },
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 2.0, chromaticAberration: true },
  },
  {
    name: 'Retro Wave',
    vizType: 'radial',
    colors: { primary: '#8b00ff', secondary: '#ff6600', accent: '#ff0066', background: '#1a0033' },
    sensitivity: { ...defaultSensitivity, overall: 1.2 },
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 1.8, vignette: true, vignetteIntensity: 0.7 },
  },
  {
    name: 'Monochrome',
    vizType: 'waveform',
    colors: { primary: '#ffffff', secondary: '#888888', accent: '#cccccc', background: '#000000' },
    sensitivity: defaultSensitivity,
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 1.0, filmGrain: true },
  },
  {
    name: 'Ocean',
    vizType: 'sphere',
    colors: { primary: '#0088ff', secondary: '#00ddcc', accent: '#00ffaa', background: '#000d1a' },
    sensitivity: { ...defaultSensitivity, smoothing: 0.85 },
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 1.2, rotationSpeed: 0.5 },
  },
  {
    name: 'Matrix',
    vizType: 'tunnel',
    colors: { primary: '#00ff00', secondary: '#003300', accent: '#00cc00', background: '#000000' },
    sensitivity: { ...defaultSensitivity, trebleBoost: 1.3 },
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 1.5, filmGrain: true, filmGrainIntensity: 0.15 },
  },
  {
    name: 'Aurora',
    vizType: 'shader',
    colors: { primary: '#00ff88', secondary: '#8800ff', accent: '#ff0088', background: '#000511' },
    sensitivity: { ...defaultSensitivity, smoothing: 0.9 },
    effects: { ...defaultEffects, bloomEnabled: true, bloomIntensity: 1.8, chromaticAberration: true, chromaticAberrationOffset: 0.003 },
  },
]
