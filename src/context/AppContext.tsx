import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        ...defaultSettings,
        ...parsed,
        visualization: { ...defaultVisualization, ...parsed.visualization },
        frequencyTuning: { ...defaultFrequencyTuning, ...parsed.frequencyTuning },
        peakHold: { ...defaultPeakHold, ...parsed.peakHold },
      }
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

  const { playback, beat, frameDataRef, loadAudioFile, togglePlay, seek, setVolume } = useAudioAnalyser(settings.sensitivity)

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
    loadAudioFile,
    togglePlay,
    seek,
    setVolume,
  }), [audio, frameDataRef, visualizer, settings, customPresets, setVisualizationType, updateColors, updateSensitivity, updateEffects, updatePerformance, updateBehavior, updateVisualization, updateFrequencyTuning, updatePeakHold, loadPreset, loadCustomPreset, saveCustomPreset, deleteCustomPreset, resetSettings, loadAudioFile, togglePlay, seek, setVolume])

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
