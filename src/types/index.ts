export type VisualizationType =
  | 'bars'
  | 'radial'
  | 'waveform'
  | 'particles'
  | 'sphere'
  | 'tunnel'
  | 'shader'

export type FrequencyRange = 'full' | 'bass' | 'treble'

export type CameraMode = 'static' | 'orbit' | 'dolly' | 'random'

export type RenderQuality = 'low' | 'medium' | 'high' | 'ultra'

export type MirrorMode = 'none' | 'vertical' | 'horizontal' | 'both'

export type Resolution = 8 | 16 | 32 | 64 | 128 | 256 | 512

export interface FrequencyBands {
  subBass: number
  bass: number
  lowMid: number
  mid: number
  highMid: number
  treble: number
}

export interface ColorSettings {
  primary: string
  secondary: string
  accent: string
  background: string
}

export interface SensitivitySettings {
  bassBoost: number
  trebleBoost: number
  overall: number
  smoothing: number
  fftSize: number
  frequencyRange: FrequencyRange
}

export interface FrequencyTuningSettings {
  subBassGain: number   // 0-200 %
  bassGain: number      // 0-200 %
  midGain: number       // 0-200 %
  trebleGain: number    // 0-200 %
  minFrequency: number  // Hz (20-2000)
  maxFrequency: number  // Hz (2000-20000)
  smoothness: number    // 0-100 %
}

export interface PeakHoldSettings {
  enabled: boolean
  falloffTime: number   // seconds (0.1-5)
  scaleX: number        // 0.1-3
  scaleY: number        // 0.1-3
}

export interface VisualizationSettings {
  resolution: Resolution
  scale: number         // 0.1-3
  mirror: MirrorMode
}

export interface EffectSettings {
  bloomEnabled: boolean
  bloomIntensity: number
  bloomThreshold: number
  chromaticAberration: boolean
  chromaticAberrationOffset: number
  filmGrain: boolean
  filmGrainIntensity: number
  vignette: boolean
  vignetteIntensity: number
  rotationSpeed: number
  cameraMode: CameraMode
  particleDensity: number
  trailLength: number
}

export interface PerformanceSettings {
  quality: RenderQuality
  fpsCap: number
  antialiasing: boolean
}

export interface BehaviorSettings {
  autoSwitch: boolean
  beatFlash: boolean
  idleAnimation: boolean
  hideUITimeout: number
}

export interface Preset {
  name: string
  vizType: VisualizationType
  colors: ColorSettings
  sensitivity: SensitivitySettings
  effects: EffectSettings
}

export interface CustomPreset extends Preset {
  isCustom: true
  visualization: VisualizationSettings
  frequencyTuning: FrequencyTuningSettings
  peakHold: PeakHoldSettings
  createdAt: number
}

export interface AudioState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  fileName: string | null
}

export interface VisualizerState {
  activeType: VisualizationType
  previousType: VisualizationType | null
  transitionProgress: number
}

export interface Settings {
  colors: ColorSettings
  sensitivity: SensitivitySettings
  effects: EffectSettings
  performance: PerformanceSettings
  behavior: BehaviorSettings
  visualization: VisualizationSettings
  frequencyTuning: FrequencyTuningSettings
  peakHold: PeakHoldSettings
  activePreset: string | null
}

export type RecordingStatus = 'idle' | 'recording' | 'stopping' | 'error'

export interface RecordingState {
  status: RecordingStatus
  duration: number
  format: string | null
  error: string | null
}

export interface AudioFrameData {
  frequencyData: Uint8Array | null
  timeDomainData: Uint8Array | null
  frequencyBands: FrequencyBands
}

export interface AppContextType {
  audio: AudioState
  frameDataRef: React.RefObject<AudioFrameData>
  recording: RecordingState
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  visualizer: VisualizerState
  settings: Settings
  customPresets: CustomPreset[]
  setVisualizationType: (type: VisualizationType) => void
  updateColors: (colors: Partial<ColorSettings>) => void
  updateSensitivity: (sens: Partial<SensitivitySettings>) => void
  updateEffects: (fx: Partial<EffectSettings>) => void
  updatePerformance: (perf: Partial<PerformanceSettings>) => void
  updateBehavior: (beh: Partial<BehaviorSettings>) => void
  updateVisualization: (viz: Partial<VisualizationSettings>) => void
  updateFrequencyTuning: (ft: Partial<FrequencyTuningSettings>) => void
  updatePeakHold: (ph: Partial<PeakHoldSettings>) => void
  loadPreset: (preset: Preset) => void
  loadCustomPreset: (preset: CustomPreset) => void
  saveCustomPreset: (name: string) => void
  deleteCustomPreset: (name: string) => void
  resetSettings: () => void
  startRecording: () => void
  stopRecording: () => void
  loadAudioFile: (file: File) => void
  togglePlay: () => void
  seek: (time: number) => void
  setVolume: (vol: number) => void
}
