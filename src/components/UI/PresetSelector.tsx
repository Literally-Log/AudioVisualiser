import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../context/AppContext.tsx'
import { presets } from '../../utils/presets.ts'

export default function PresetSelector() {
  const { settings, customPresets, loadPreset, loadCustomPreset, saveCustomPreset, deleteCustomPreset } = useApp()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleSave = () => {
    const name = presetName.trim()
    if (!name) return
    saveCustomPreset(name)
    setPresetName('')
    setShowSaveDialog(false)
  }

  const handleDelete = (name: string) => {
    if (confirmDelete === name) {
      deleteCustomPreset(name)
      setConfirmDelete(null)
    } else {
      setConfirmDelete(name)
      // Auto-clear the confirm state after 3 seconds
      setTimeout(() => setConfirmDelete((c) => c === name ? null : c), 3000)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white/60 text-xs uppercase tracking-wider">Presets</h3>
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="text-white/40 hover:text-white/80 text-xs transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Save Current
        </button>
      </div>

      {/* Save preset dialog */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="Preset name..."
                maxLength={24}
                autoFocus
                className="flex-1 bg-white/10 text-white text-xs px-3 py-2 rounded-lg border border-white/10 outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <button
                onClick={handleSave}
                disabled={!presetName.trim()}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-white/15 text-white hover:bg-white/25 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => { setShowSaveDialog(false); setPresetName('') }}
                className="px-2 py-2 rounded-lg text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Built-in presets */}
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <motion.button
            key={preset.name}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => loadPreset(preset)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border ${
              settings.activePreset === preset.name
                ? 'border-white/40 bg-white/15 text-white'
                : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
              />
              {preset.name}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom presets */}
      {customPresets.length > 0 && (
        <div className="mt-3">
          <h4 className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Custom</h4>
          <div className="grid grid-cols-2 gap-2">
            {customPresets.map((preset) => (
              <motion.div
                key={preset.name}
                whileHover={{ scale: 1.03 }}
                className="relative group"
              >
                <button
                  onClick={() => loadCustomPreset(preset)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border text-left ${
                    settings.activePreset === preset.name
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ background: `linear-gradient(135deg, ${preset.colors.primary}, ${preset.colors.secondary})` }}
                    />
                    <span className="truncate">{preset.name}</span>
                  </div>
                </button>
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(preset.name) }}
                  className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all
                    ${confirmDelete === preset.name
                      ? 'bg-red-500/80 text-white opacity-100'
                      : 'bg-white/10 text-white/40 opacity-0 group-hover:opacity-100 hover:bg-red-500/60 hover:text-white'
                    }`}
                  title={confirmDelete === preset.name ? 'Click again to confirm delete' : 'Delete preset'}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
