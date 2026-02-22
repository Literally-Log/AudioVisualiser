import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  AppContextType,
  AudioState,
  BehaviorSettings,
  ColorSettings,
  CustomPreset,
  EffectSettings,
  FrequencyTuningSettings,
  PeakHoldSettings,
  PerformanceSettings,
  Preset,
  SensitivitySettings,
  Settings,
  VisualizationSettings,
  VisualizerState,
  VisualizationType,
} from '../types/index.ts'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser.ts'
import { useRecorder } from '../hooks/useRecorder.ts'
import { defaultEffects, defaultFrequencyTuning, defaultPeakHold, defaultSensitivity, defaultVisualization } from '../utils/presets.ts'

const STORAGE_KEY = 'music-visualizer-settings'
const CUSTOM_PRESETS_KEY = 'music-visualizer-custom-presets'

const defaultSettings: Settings = {
  colors: { primary: '#ff00ff', secondary: '#00ffff', accent: '#ff0088', background: '#0a0014' },
  sensitivity: defaultSensitivity,
  effects: defaultEffects,
  performance: { quality: 'high', fpsCap: 60, antialiasing: true },
  behavior: { autoSwitch: false, beatFlash: true, idleAnimation: true, hideUITimeout: 5 },
  visualization: defaultVisualization,
  frequencyTuning: defaultFrequencyTuning,
  peakHold: defaultPeakHold,
  activePreset: 'Cyberpunk',
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function sanitizeSettings(input: Settings): Settings {
  const validResolutions = [8, 16, 32, 64, 128, 256, 512] as const
  const resolution = validResolutions.includes(input.visualization.resolution)
    ? input.visualization.resolution
    : defaultVisualization.resolution

  return {
    ...input,
    sensitivity: {
      ...input.sensitivity,
      overall: clampNumber(input.sensitivity.overall, 0.1, 3, defaultSensitivity.overall),
      smoothing: clampNumber(input.sensitivity.smoothing, 0, 0.95, defaultSensitivity.smoothing),
    },
    effects: {
      ...input.effects,
      cameraAzimuth: clampNumber(input.effects.cameraAzimuth, -180, 180, defaultEffects.cameraAzimuth),
      cameraPolar: clampNumber(input.effects.cameraPolar, 1, 179, defaultEffects.cameraPolar),
    },
    visualization: {
      ...input.visualization,
      resolution,
      scale: clampNumber(input.visualization.scale, 0.1, 3, defaultVisualization.scale),
      heightMultiplier: clampNumber(input.visualization.heightMultiplier, 0.1, 20, defaultVisualization.heightMultiplier),
    },
    frequencyTuning: {
      ...input.frequencyTuning,
      subBassGain: clampNumber(input.frequencyTuning.subBassGain, 0, 200, defaultFrequencyTuning.subBassGain),
      bassGain: clampNumber(input.frequencyTuning.bassGain, 0, 200, defaultFrequencyTuning.bassGain),
      midGain: clampNumber(input.frequencyTuning.midGain, 0, 200, defaultFrequencyTuning.midGain),
      trebleGain: clampNumber(input.frequencyTuning.trebleGain, 0, 200, defaultFrequencyTuning.trebleGain),
      smoothness: clampNumber(input.frequencyTuning.smoothness, 0, 100, defaultFrequencyTuning.smoothness),
    },
    peakHold: {
      ...input.peakHold,
      falloffTime: clampNumber(input.peakHold.falloffTime, 0.1, 5, defaultPeakHold.falloffTime),
      scaleX: clampNumber(input.peakHold.scaleX, 0.1, 3, defaultPeakHold.scaleX),
      scaleY: clampNumber(input.peakHold.scaleY, 0.1, 3, defaultPeakHold.scaleY),
    },
  }
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const merged: Settings = {
        ...defaultSettings,
        ...parsed,
        visualization: { ...defaultVisualization, ...parsed.visualization },
        frequencyTuning: { ...defaultFrequencyTuning, ...parsed.frequencyTuning },
        peakHold: { ...defaultPeakHold, ...parsed.peakHold },
      }
      return sanitizeSettings(merged)
    }
  } catch {}
  return defaultSettings
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {}
}

function loadCustomPresets(): CustomPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveCustomPresets(presets: CustomPreset[]) {
  try {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets))
  } catch {}
}

const AppCtx = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(loadCustomPresets)
  const [visualizer, setVisualizer] = useState<VisualizerState>({
    activeType: 'bars',
    previousType: null,
    transitionProgress: 1,
  })

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const { playback, beat, frameDataRef, audioContextRef, gainRef, loadAudioFile, togglePlay, seek, setVolume } = useAudioAnalyser(settings.sensitivity)

  const { recording, startRecording, stopRecording } = useRecorder(canvasRef, audioContextRef, gainRef)

  // Map playback to AudioState shape for backward compat with UI components
  const audio: AudioState = useMemo(() => ({
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
    duration: playback.duration,
    volume: playback.volume,
    fileName: playback.fileName,
  }), [playback])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveCustomPresets(customPresets)
  }, [customPresets])

  const setVisualizationType = useCallback((type: VisualizationType) => {
    setVisualizer((prev) => ({
      activeType: type,
      previousType: prev.activeType,
      transitionProgress: 0,
    }))
    const start = performance.now()
    const animate = () => {
      const elapsed = performance.now() - start
      const progress = Math.min(1, elapsed / 500)
      setVisualizer((prev) => ({ ...prev, transitionProgress: progress }))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [])

  const updateColors = useCallback((c: Partial<ColorSettings>) => {
    setSettings((prev) => ({ ...prev, colors: { ...prev.colors, ...c }, activePreset: null }))
  }, [])

  const updateSensitivity = useCallback((s: Partial<SensitivitySettings>) => {
    setSettings((prev) => ({ ...prev, sensitivity: { ...prev.sensitivity, ...s }, activePreset: null }))
  }, [])

  const updateEffects = useCallback((fx: Partial<EffectSettings>) => {
    setSettings((prev) => ({ ...prev, effects: { ...prev.effects, ...fx }, activePreset: null }))
  }, [])

  const updatePerformance = useCallback((p: Partial<PerformanceSettings>) => {
    setSettings((prev) => ({ ...prev, performance: { ...prev.performance, ...p } }))
  }, [])

  const updateBehavior = useCallback((b: Partial<BehaviorSettings>) => {
    setSettings((prev) => ({ ...prev, behavior: { ...prev.behavior, ...b } }))
  }, [])

  const updateVisualization = useCallback((viz: Partial<VisualizationSettings>) => {
    setSettings((prev) => ({ ...prev, visualization: { ...prev.visualization, ...viz }, activePreset: null }))
  }, [])

  const updateFrequencyTuning = useCallback((ft: Partial<FrequencyTuningSettings>) => {
    setSettings((prev) => ({ ...prev, frequencyTuning: { ...prev.frequencyTuning, ...ft }, activePreset: null }))
  }, [])

  const updatePeakHold = useCallback((ph: Partial<PeakHoldSettings>) => {
    setSettings((prev) => ({ ...prev, peakHold: { ...prev.peakHold, ...ph }, activePreset: null }))
  }, [])

  const loadPreset = useCallback(
    (preset: Preset) => {
      setSettings((prev) => ({
        ...prev,
        colors: preset.colors,
        sensitivity: preset.sensitivity,
        effects: preset.effects,
        activePreset: preset.name,
      }))
      setVisualizationType(preset.vizType)
    },
    [setVisualizationType],
  )

  const loadCustomPreset = useCallback(
    (preset: CustomPreset) => {
      setSettings((prev) => ({
        ...prev,
        colors: preset.colors,
        sensitivity: preset.sensitivity,
        effects: preset.effects,
        visualization: preset.visualization,
        frequencyTuning: preset.frequencyTuning,
        peakHold: preset.peakHold,
        activePreset: preset.name,
      }))
      setVisualizationType(preset.vizType)
    },
    [setVisualizationType],
  )

  const saveCustomPreset = useCallback(
    (name: string) => {
      const preset: CustomPreset = {
        isCustom: true,
        name,
        vizType: visualizer.activeType,
        colors: { ...settings.colors },
        sensitivity: { ...settings.sensitivity },
        effects: { ...settings.effects },
        visualization: { ...settings.visualization },
        frequencyTuning: { ...settings.frequencyTuning },
        peakHold: { ...settings.peakHold },
        createdAt: Date.now(),
      }
      setCustomPresets((prev) => {
        const filtered = prev.filter((p) => p.name !== name)
        return [...filtered, preset]
      })
      setSettings((prev) => ({ ...prev, activePreset: name }))
    },
    [visualizer.activeType, settings],
  )

  const deleteCustomPreset = useCallback((name: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.name !== name))
    setSettings((prev) => prev.activePreset === name ? { ...prev, activePreset: null } : prev)
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ ...defaultSettings })
    setVisualizationType('bars')
  }, [setVisualizationType])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<AppContextType>(() => ({
    audio,
    frameDataRef,
    recording,
    canvasRef,
    visualizer,
    settings,
    customPresets,
    setVisualizationType,
    updateColors,
    updateSensitivity,
    updateEffects,
    updatePerformance,
    updateBehavior,
    updateVisualization,
    updateFrequencyTuning,
    updatePeakHold,
    loadPreset,
    loadCustomPreset,
    saveCustomPreset,
    deleteCustomPreset,
    resetSettings,
    startRecording,
    stopRecording,
    loadAudioFile,
    togglePlay,
    seek,
    setVolume,
  }), [audio, frameDataRef, recording, canvasRef, visualizer, settings, customPresets, setVisualizationType, updateColors, updateSensitivity, updateEffects, updatePerformance, updateBehavior, updateVisualization, updateFrequencyTuning, updatePeakHold, loadPreset, loadCustomPreset, saveCustomPreset, deleteCustomPreset, resetSettings, startRecording, stopRecording, loadAudioFile, togglePlay, seek, setVolume])

  return (
    <AppCtx.Provider value={contextValue}>
      {children}
    </AppCtx.Provider>
  )
}

export function useApp(): AppContextType {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { AppCtx }
