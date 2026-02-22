import { Suspense, lazy } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useApp } from '../context/AppContext.tsx'
import PostProcessingEffects from './PostProcessing.tsx'

const FrequencyBars = lazy(() => import('./visualizations/FrequencyBars.tsx'))
const RadialSpectrum = lazy(() => import('./visualizations/RadialSpectrum.tsx'))
const Waveform = lazy(() => import('./visualizations/Waveform.tsx'))
const ParticleSystem = lazy(() => import('./visualizations/ParticleSystem.tsx'))
const SphereMorph = lazy(() => import('./visualizations/SphereMorph.tsx'))
const Tunnel = lazy(() => import('./visualizations/Tunnel.tsx'))
const ShaderViz = lazy(() => import('./visualizations/ShaderViz.tsx'))

function ActiveVisualization() {
  const { visualizer } = useApp()

  switch (visualizer.activeType) {
    case 'bars':
      return <FrequencyBars />
    case 'radial':
      return <RadialSpectrum />
    case 'waveform':
      return <Waveform />
    case 'particles':
      return <ParticleSystem />
    case 'sphere':
      return <SphereMorph />
    case 'tunnel':
      return <Tunnel />
    case 'shader':
      return <ShaderViz />
    default:
      return <FrequencyBars />
  }
}

/**
 * Mirror scene: renders the visualization with proper reflection.
 * Each half is scaled down and offset so the original and its mirror
 * sit side-by-side without overlapping.
 *
 * - Horizontal: left half is original, right half is X-flipped reflection
 * - Vertical: top half is original, bottom half is Y-flipped reflection
 * - Both: four quadrants — original top-left, reflections in other three
 */
function MirrorScene() {
  const { settings } = useApp()
  const mirror = settings.visualization.mirror

  if (mirror === 'none') {
    return <ActiveVisualization />
  }

  const mirrorH = mirror === 'horizontal' || mirror === 'both'
  const mirrorV = mirror === 'vertical' || mirror === 'both'

  // Scale each copy to fit its portion of the view, and offset to position
  const sx = mirrorH ? 0.5 : 1
  const sy = mirrorV ? 0.5 : 1
  // Offset units in world space to separate the halves (tuned for camera at z=6, fov=60)
  const ox = mirrorH ? -2.0 : 0
  const oy = mirrorV ? 1.5 : 0

  return (
    <group>
      {/* Original quadrant */}
      <group position={[ox, oy, 0]} scale={[sx, sy, 1]}>
        <ActiveVisualization />
      </group>

      {/* Horizontal reflection (flip X) */}
      {mirrorH && (
        <group position={[-ox, oy, 0]} scale={[-sx, sy, 1]}>
          <ActiveVisualization />
        </group>
      )}

      {/* Vertical reflection (flip Y) */}
      {mirrorV && (
        <group position={[ox, -oy, 0]} scale={[sx, -sy, 1]}>
          <ActiveVisualization />
        </group>
      )}

      {/* Diagonal reflection (flip both) — only when both axes are mirrored */}
      {mirrorH && mirrorV && (
        <group position={[-ox, -oy, 0]} scale={[-sx, -sy, 1]}>
          <ActiveVisualization />
        </group>
      )}
    </group>
  )
}

export default function VisualizerCanvas() {
  const { settings, canvasRef } = useApp()
  const isOrbit = settings.effects.cameraMode === 'orbit'

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      gl={{ antialias: settings.performance.antialiasing, alpha: true, preserveDrawingBuffer: true }}
      dpr={settings.performance.quality === 'low' ? 1 : settings.performance.quality === 'ultra' ? 2 : 1.5}
      onCreated={(state) => {
        canvasRef.current = state.gl.domElement
      }}
    >
      <color attach="background" args={[settings.colors.background]} />
      <Suspense fallback={null}>
        <MirrorScene />
        <PostProcessingEffects />
      </Suspense>
      {isOrbit && <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />}
    </Canvas>
  )
}
