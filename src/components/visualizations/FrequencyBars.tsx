import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

import barVertShader from '../../shaders/bar.vert.glsl'
import barFragShader from '../../shaders/bar.frag.glsl'

export default function FrequencyBars() {
  const { frameDataRef, settings } = useApp()
  const groupRef = useRef<THREE.Group>(null)
  const peakGroupRef = useRef<THREE.Group>(null)

  const barCount = settings.visualization.resolution
  const scale = Number.isFinite(settings.visualization.scale) && settings.visualization.scale > 0
    ? settings.visualization.scale
    : 1
  const heightMultiplier =
    Number.isFinite(settings.visualization.heightMultiplier) && settings.visualization.heightMultiplier > 0
      ? settings.visualization.heightMultiplier
      : 3
  const peakHold = settings.peakHold
  const tuning = settings.frequencyTuning

  const peaksRef = useRef<{ value: number; time: number }[]>([])

  const { meshes, materials, peakMeshes, peakMaterials } = useMemo(() => {
    const mats: THREE.ShaderMaterial[] = []
    const meshesList: { geom: THREE.BoxGeometry; pos: [number, number, number] }[] = []
    const pMeshes: { geom: THREE.BoxGeometry; pos: [number, number, number] }[] = []
    const pMats: THREE.MeshBasicMaterial[] = []

    const spread = 8 * scale
    const barWidth = Math.max(0.02, (spread / barCount) * 0.85)
    const barGeom = new THREE.BoxGeometry(barWidth, 1, barWidth)
    const peakGeom = new THREE.BoxGeometry(barWidth * 1.1, 0.06, barWidth * 1.1)

    for (let i = 0; i < barCount; i++) {
      const x = (i / barCount - 0.5) * spread
      const mat = new THREE.ShaderMaterial({
        vertexShader: barVertShader,
        fragmentShader: barFragShader,
        uniforms: {
          uFrequency: { value: 0 },
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color('#ffffff') },
          uColor2: { value: new THREE.Color('#888888') },
        },
        transparent: true,
      })
      mats.push(mat)
      meshesList.push({ geom: barGeom, pos: [x, 0.5, 0] })

      const peakMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
      pMats.push(peakMat)
      pMeshes.push({ geom: peakGeom, pos: [x, 0, 0] })
    }

    peaksRef.current = Array.from({ length: barCount }, () => ({ value: 0, time: 0 }))

    return { meshes: meshesList, materials: mats, peakMeshes: pMeshes, peakMaterials: pMats }
  }, [barCount, scale]) // eslint-disable-line

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = frameDataRef.current.frequencyData
    if (!data || !materials.length) return

    const step = Math.max(1, Math.floor(data.length / barCount))
    const peaks = peaksRef.current

    for (let i = 0; i < barCount; i++) {
      const freqRatio = i / barCount
      let gain = 1.0
      if (freqRatio < 0.05) gain = tuning.subBassGain / 100
      else if (freqRatio < 0.15) gain = tuning.bassGain / 100
      else if (freqRatio < 0.5) gain = tuning.midGain / 100
      else gain = tuning.trebleGain / 100

      const start = i * step
      const end = Math.min(start + step, data.length)
      let sum = 0
      let count = 0
      for (let j = start; j < end; j++) {
        sum += data[j]
        count++
      }
      const rawVal = count > 0 ? (sum / count) / 255 : 0
      const val = Math.min(1, rawVal * settings.sensitivity.overall * gain)

      const mat = materials[i]
      const smoothness = tuning.smoothness / 100
      const lerpFactor = 0.1 + (1 - smoothness) * 0.5
      mat.uniforms.uFrequency.value = THREE.MathUtils.lerp(
        mat.uniforms.uFrequency.value,
        val * scale * heightMultiplier,
        lerpFactor,
      )
      mat.uniforms.uTime.value = t
      mat.uniforms.uColor1.value.set(settings.colors.primary)
      mat.uniforms.uColor2.value.set(settings.colors.secondary)

      // Peak hold
      if (peakHold.enabled && peaks[i]) {
        const currentHeight = mat.uniforms.uFrequency.value
        if (currentHeight > peaks[i].value) {
          peaks[i].value = currentHeight
          peaks[i].time = t
        } else {
          const elapsed = t - peaks[i].time
          if (elapsed > peakHold.falloffTime) {
            peaks[i].value = THREE.MathUtils.lerp(peaks[i].value, 0, 0.05)
          }
        }
      }
    }

    // Update peak markers
    if (peakGroupRef.current) {
      peakGroupRef.current.visible = peakHold.enabled
      if (peakHold.enabled) {
        peakGroupRef.current.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh
          if (peaks[i]) {
            mesh.position.y = peaks[i].value * 3 + 0.5
            mesh.scale.set(peakHold.scaleX, peakHold.scaleY, 1)
            peakMaterials[i]?.color.set(settings.colors.accent)
          }
        })
      }
    }
  })

  return (
    <group position={[0, -1.5, 0]}>
      <group ref={groupRef}>
        {meshes.map((m, i) => (
          <mesh key={i} geometry={m.geom} material={materials[i]} position={m.pos} />
        ))}
      </group>
      <group ref={peakGroupRef}>
        {peakMeshes.map((m, i) => (
          <mesh key={i} geometry={m.geom} material={peakMaterials[i]} position={m.pos} />
        ))}
      </group>
    </group>
  )
}
