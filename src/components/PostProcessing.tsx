import { useMemo } from 'react'
import { useApp } from '../context/AppContext.tsx'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

export default function PostProcessingEffects() {
  const { settings } = useApp()
  const fx = settings.effects

  // Skip EffectComposer entirely when no effects are active — saves a full render pass
  const hasAnyEffect = fx.bloomEnabled || fx.chromaticAberration || fx.filmGrain || fx.vignette

  // Memoize offset to avoid creating new Vector2 every render
  const offset = useMemo(() => new Vector2(fx.chromaticAberrationOffset, fx.chromaticAberrationOffset), [fx.chromaticAberrationOffset])

  if (!hasAnyEffect) return null

  return (
    <EffectComposer>
      {fx.bloomEnabled ? (
        <Bloom
          intensity={fx.bloomIntensity}
          luminanceThreshold={fx.bloomThreshold}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      ) : (
        <></>
      )}
      {fx.chromaticAberration ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={offset}
        />
      ) : (
        <></>
      )}
      {fx.filmGrain ? (
        <Noise blendFunction={BlendFunction.OVERLAY} premultiply />
      ) : (
        <></>
      )}
      {fx.vignette ? (
        <Vignette
          eskil={false}
          offset={0.1}
          darkness={fx.vignetteIntensity}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  )
}
