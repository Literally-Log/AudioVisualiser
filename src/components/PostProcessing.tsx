import { useApp } from '../context/AppContext.tsx'
import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'

export default function PostProcessingEffects() {
  const { settings } = useApp()
  const fx = settings.effects

  return (
    <EffectComposer>
      <Bloom
        intensity={fx.bloomEnabled ? fx.bloomIntensity : 0}
        luminanceThreshold={fx.bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      {fx.chromaticAberration ? (
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(fx.chromaticAberrationOffset, fx.chromaticAberrationOffset)}
        />
      ) : (
        <></>
      )}
      {fx.filmGrain ? (
        <Noise blendFunction={BlendFunction.OVERLAY} premultiply />
      ) : (
        <></>
      )}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={fx.vignette ? fx.vignetteIntensity : 0}
      />
    </EffectComposer>
  )
}
