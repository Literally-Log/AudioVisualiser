import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext.tsx'
import PresetSelector from './PresetSelector.tsx'
import { AudioSourceSelector } from '../Desktop/AudioSourceSelector.tsx'
import type { VisualizationType, CameraMode, MirrorMode, Resolution } from '../../types/index.ts'

interface Props {
  isOpen: boolean
}

const vizTypes: { type: VisualizationType; label: string; icon: string }[] = [
  { type: 'bars', label: 'Bars', icon: '|||' },
  { type: 'radial', label: 'Radial', icon: '()' },
  { type: 'waveform', label: 'Wave', icon: '~' },
 // { type: 'particles', label: 'Particles', icon: '...' },
  { type: 'sphere', label: 'Sphere', icon: 'O' },
  { type: 'tunnel', label: 'Tunnel', icon: '>' },
  { type: 'shader', label: 'Shader', icon: '#' },
]

const resolutionOptions: Resolution[] = [8, 16, 32, 64, 128, 256, 512]

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 appearance-none bg-white/15 rounded-full accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
      />
      <span className="text-white/40 text-xs w-12 text-right font-mono">
        {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}{unit || ''}
      </span>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <span className="text-white/50 text-xs flex-1">{label}</span>
      <div
        className={`w-8 h-4 rounded-full transition-colors relative ${value ? 'bg-white/30' : 'bg-white/10'}`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </div>
    </label>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-24 shrink-0">{label}</span>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-white/20 cursor-pointer bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
        />
      </div>
      <span className="text-white/40 text-xs font-mono">{value}</span>
    </div>
  )
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-xs w-24 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="flex-1 bg-white/10 text-white/70 text-xs px-2 py-1.5 rounded-lg border border-white/10 outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-white/60 text-xs uppercase tracking-wider mb-3">{title}</h3>
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SettingsPanel({ isOpen }: Props) {
  const {
    audio,
    visualizer,
    settings,
    recording,
    setVisualizationType,
    updateColors,
    updateSensitivity,
    updateEffects,
    updateBehavior,
    updateVisualization,
    updateFrequencyTuning,
    updatePeakHold,
    resetSettings,
    startRecording,
    stopRecording,
  } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 bottom-0 w-80 z-20 overflow-y-auto backdrop-blur-2xl bg-black/60 border-l border-white/10"
        >
          <div className="p-5 pt-16 space-y-6">
            {/* Audio Source (Desktop only) */}
            <AudioSourceSelector />

            {/* Visualization Type */}
            <div>
              <SectionHeader title="Visualization" />
              <div className="grid grid-cols-4 gap-1.5">
                {vizTypes.map((v) => (
                  <button
                    key={v.type}
                    onClick={() => setVisualizationType(v.type)}
                    className={`px-2 py-2.5 rounded-lg text-center transition-all text-xs ${
                      visualizer.activeType === v.type
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 text-white/50 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="text-base leading-none mb-1">{v.icon}</div>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <PresetSelector />

            {/* Visualization Settings (Resolution, Scale, Mirror) */}
            <div>
              <SectionHeader title="Display" />
              <div className="space-y-2.5">
                {/* Resolution */}
                <div className="flex items-center gap-3">
                  <span className="text-white/50 text-xs w-24 shrink-0">Resolution</span>
                  <div className="flex-1 flex gap-1">
                    {resolutionOptions.map((res) => (
                      <button
                        key={res}
                        onClick={() => updateVisualization({ resolution: res })}
                        className={`flex-1 py-1 rounded text-xs transition-all ${
                          settings.visualization.resolution === res
                            ? 'bg-white/25 text-white'
                            : 'bg-white/5 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                <Slider
                  label="Scale"
                  value={settings.visualization.scale}
                  min={0.1}
                  max={3}
                  step={0.1}
                  onChange={(v) => updateVisualization({ scale: v })}
                  unit="x"
                />

                <Select
                  label="Mirror"
                  value={settings.visualization.mirror}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'vertical', label: 'Vertical' },
                    { value: 'horizontal', label: 'Horizontal' },
                    { value: 'both', label: 'Both Axes' },
                  ]}
                  onChange={(v) => updateVisualization({ mirror: v as MirrorMode })}
                />
              </div>
            </div>

            {/* Colors */}
            <div>
              <SectionHeader title="Colors" />
              <div className="space-y-2.5">
                <ColorPicker label="Primary" value={settings.colors.primary} onChange={(v) => updateColors({ primary: v })} />
                <ColorPicker label="Secondary" value={settings.colors.secondary} onChange={(v) => updateColors({ secondary: v })} />
                <ColorPicker label="Accent" value={settings.colors.accent} onChange={(v) => updateColors({ accent: v })} />
                <ColorPicker label="Background" value={settings.colors.background} onChange={(v) => updateColors({ background: v })} />
              </div>
            </div>

            {/* Audio Sensitivity */}
            <div>
              <SectionHeader title="Audio Sensitivity" />
              <div className="space-y-2.5">
                <Slider label="Bass Boost" value={settings.sensitivity.bassBoost} min={0} max={2} step={0.1} onChange={(v) => updateSensitivity({ bassBoost: v })} />
                <Slider label="Treble Boost" value={settings.sensitivity.trebleBoost} min={0} max={2} step={0.1} onChange={(v) => updateSensitivity({ trebleBoost: v })} />
                <Slider label="Overall" value={settings.sensitivity.overall} min={0.1} max={3} step={0.1} onChange={(v) => updateSensitivity({ overall: v })} />
                <Slider label="Smoothing" value={settings.sensitivity.smoothing} min={0} max={0.95} step={0.05} onChange={(v) => updateSensitivity({ smoothing: v })} />
              </div>
            </div>

            {/* Frequency Tuning */}
            <div>
              <SectionHeader title="Frequency Tuning" />
              <div className="space-y-2.5">
                <Slider label="Sub Bass" value={settings.frequencyTuning.subBassGain} min={0} max={200} step={5} onChange={(v) => updateFrequencyTuning({ subBassGain: v })} unit="%" />
                <Slider label="Bass" value={settings.frequencyTuning.bassGain} min={0} max={200} step={5} onChange={(v) => updateFrequencyTuning({ bassGain: v })} unit="%" />
                <Slider label="Mid-Range" value={settings.frequencyTuning.midGain} min={0} max={200} step={5} onChange={(v) => updateFrequencyTuning({ midGain: v })} unit="%" />
                <Slider label="Treble" value={settings.frequencyTuning.trebleGain} min={0} max={200} step={5} onChange={(v) => updateFrequencyTuning({ trebleGain: v })} unit="%" />
                <Slider label="Min Freq" value={settings.frequencyTuning.minFrequency} min={20} max={2000} step={10} onChange={(v) => updateFrequencyTuning({ minFrequency: v })} unit="Hz" />
                <Slider label="Max Freq" value={settings.frequencyTuning.maxFrequency} min={2000} max={20000} step={100} onChange={(v) => updateFrequencyTuning({ maxFrequency: v })} unit="Hz" />
                <Slider label="Smoothness" value={settings.frequencyTuning.smoothness} min={0} max={100} step={5} onChange={(v) => updateFrequencyTuning({ smoothness: v })} unit="%" />
              </div>
            </div>

            {/* Peak Hold */}
            <div>
              <SectionHeader title="Peak Hold" />
              <div className="space-y-2.5">
                <Toggle label="Enable Peak Hold" value={settings.peakHold.enabled} onChange={(v) => updatePeakHold({ enabled: v })} />
                {settings.peakHold.enabled && (
                  <>
                    <Slider label="Falloff Time" value={settings.peakHold.falloffTime} min={0.1} max={5} step={0.1} onChange={(v) => updatePeakHold({ falloffTime: v })} unit="s" />
                    <Slider label="Scale X" value={settings.peakHold.scaleX} min={0.1} max={3} step={0.1} onChange={(v) => updatePeakHold({ scaleX: v })} />
                    <Slider label="Scale Y" value={settings.peakHold.scaleY} min={0.1} max={3} step={0.1} onChange={(v) => updatePeakHold({ scaleY: v })} />
                  </>
                )}
              </div>
            </div>

            {/* Effects */}
            <div>
              <SectionHeader title="Effects" />
              <div className="space-y-2.5">
                <Toggle label="Bloom" value={settings.effects.bloomEnabled} onChange={(v) => updateEffects({ bloomEnabled: v })} />
                {settings.effects.bloomEnabled && (
                  <Slider label="Bloom Intensity" value={settings.effects.bloomIntensity} min={0} max={5} step={0.1} onChange={(v) => updateEffects({ bloomIntensity: v })} />
                )}
                <Toggle label="Chromatic Aberration" value={settings.effects.chromaticAberration} onChange={(v) => updateEffects({ chromaticAberration: v })} />
                {settings.effects.chromaticAberration && (
                  <Slider label="Offset" value={settings.effects.chromaticAberrationOffset} min={0} max={0.01} step={0.001} onChange={(v) => updateEffects({ chromaticAberrationOffset: v })} />
                )}
                <Toggle label="Film Grain" value={settings.effects.filmGrain} onChange={(v) => updateEffects({ filmGrain: v })} />
                {settings.effects.filmGrain && (
                  <Slider label="Grain Amount" value={settings.effects.filmGrainIntensity} min={0} max={1} step={0.05} onChange={(v) => updateEffects({ filmGrainIntensity: v })} />
                )}
                <Toggle label="Vignette" value={settings.effects.vignette} onChange={(v) => updateEffects({ vignette: v })} />
                {settings.effects.vignette && (
                  <Slider label="Vignette" value={settings.effects.vignetteIntensity} min={0} max={1} step={0.05} onChange={(v) => updateEffects({ vignetteIntensity: v })} />
                )}
                <Slider label="Rotation" value={settings.effects.rotationSpeed} min={-5} max={5} step={0.1} onChange={(v) => updateEffects({ rotationSpeed: v })} />

                <Select
                  label="Camera"
                  value={settings.effects.cameraMode}
                  options={[
                    { value: 'static', label: 'Static' },
                    { value: 'orbit', label: 'Orbit' },
                    { value: 'dolly', label: 'Dolly' },
                  ]}
                  onChange={(v) => updateEffects({ cameraMode: v as CameraMode })}
                />
              </div>
            </div>

            {/* Behavior */}
            <div>
              <SectionHeader title="Behavior" />
              <div className="space-y-2.5">
                <Toggle label="Beat Flash" value={settings.behavior.beatFlash} onChange={(v) => updateBehavior({ beatFlash: v })} />
                <Toggle label="Idle Animation" value={settings.behavior.idleAnimation} onChange={(v) => updateBehavior({ idleAnimation: v })} />
                <Slider label="Hide UI (sec)" value={settings.behavior.hideUITimeout} min={0} max={30} step={1} onChange={(v) => updateBehavior({ hideUITimeout: v })} />
              </div>
            </div>

            {/* Recording */}
            <div>
              <SectionHeader title="Recording" />
              <div className="space-y-2.5">
                {recording.status === 'idle' ? (
                  <button
                    onClick={startRecording}
                    disabled={!audio.isPlaying}
                    className={`w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2 ${
                      audio.isPlaying
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                        : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-current" />
                    Start Recording
                  </button>
                ) : recording.status === 'recording' ? (
                  <div className="space-y-2">
                    <button
                      onClick={stopRecording}
                      className="w-full py-2.5 rounded-lg text-xs font-medium bg-red-500/30 text-red-200 border border-red-500/40 hover:bg-red-500/40 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
                      Stop Recording ({formatDuration(recording.duration)})
                    </button>
                    <p className="text-white/30 text-xs text-center">
                      {recording.format?.includes('mp4') ? 'MP4' : 'WebM'} at 60fps
                    </p>
                  </div>
                ) : recording.status === 'stopping' ? (
                  <p className="text-white/40 text-xs text-center py-2">Processing recording...</p>
                ) : null}

                {recording.error && (
                  <p className="text-red-400/80 text-xs">{recording.error}</p>
                )}

                {recording.status === 'idle' && !audio.isPlaying && audio.fileName && (
                  <p className="text-white/30 text-xs">Play audio first to enable recording</p>
                )}
              </div>
            </div>

            {/* Reset to Defaults */}
            <div className="pt-4 border-t border-white/10">
              {!confirmReset ? (
                <button
                  onClick={() => {
                    setConfirmReset(true)
                    setTimeout(() => setConfirmReset(false), 4000)
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-medium text-white/40 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white/60 transition-all"
                >
                  Reset All Settings to Defaults
                </button>
              ) : (
                <button
                  onClick={() => {
                    resetSettings()
                    setConfirmReset(false)
                  }}
                  className="w-full py-2.5 rounded-lg text-xs font-medium text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all"
                >
                  Confirm Reset? Click again to reset
                </button>
              )}
            </div>

            <div className="h-24" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
