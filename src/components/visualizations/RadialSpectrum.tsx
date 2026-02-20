import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

export default function RadialSpectrum() {
  const { frameDataRef, settings } = useApp()
  const groupRef = useRef<THREE.Group>(null)
  const peakGroupRef = useRef<THREE.Group>(null)

  const barCount = settings.visualization.resolution
  const scale = settings.visualization.scale
  const peakHold = settings.peakHold
  const tuning = settings.frequencyTuning

  const peaksRef = useRef<{ value: number; time: number }[]>([])

  // Pre-allocate Color objects for lerping — reused every frame
  const tmpColor1 = useMemo(() => new THREE.Color(), [])
  const tmpColor2 = useMemo(() => new THREE.Color(), [])
  const tmpLerp = useMemo(() => new THREE.Color(), [])

  const { bars, peakDots } = useMemo(() => {
    const barWidth = Math.max(0.02, (Math.PI * 2 * 1.5) / barCount * 0.7)
    const geom = new THREE.BoxGeometry(barWidth, 1, barWidth)
    const items: { geom: THREE.BoxGeometry; mat: THREE.MeshBasicMaterial; angle: number }[] = []
    const pDots: { geom: THREE.SphereGeometry; mat: THREE.MeshBasicMaterial; angle: number }[] = []

    const dotGeom = new THREE.SphereGeometry(barWidth * 0.8, 6, 6)

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
      items.push({ geom, mat, angle })

      const pMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
      pDots.push({ geom: dotGeom, mat: pMat, angle })
    }

    peaksRef.current = Array.from({ length: barCount }, () => ({ value: 0, time: 0 }))

    return { bars: items, peakDots: pDots }
  }, [barCount, scale]) // eslint-disable-line

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = frameDataRef.current.frequencyData
    const group = groupRef.current
    if (!data || !group) return

    group.rotation.z = t * (settings.effects.rotationSpeed * 0.2 || 0.1)

    const step = Math.floor(data.length / barCount)
    const peaks = peaksRef.current

    // Set tmp colors once per frame
    tmpColor1.set(settings.colors.primary)
    tmpColor2.set(settings.colors.secondary)

    group.children.forEach((child, i) => {
      const mesh = child as THREE.Mesh
      const bar = bars[i]

      const freqRatio = i / barCount
      let gain = 1.0
      if (freqRatio < 0.05) gain = tuning.subBassGain / 100
      else if (freqRatio < 0.15) gain = tuning.bassGain / 100
      else if (freqRatio < 0.5) gain = tuning.midGain / 100
      else gain = tuning.trebleGain / 100

      const rawVal = data[i * step] / 255 * settings.sensitivity.overall * gain
      const val = Math.min(1, rawVal)
      const smoothness = tuning.smoothness / 100
      const lerpFactor = 0.1 + (1 - smoothness) * 0.4

      const radius = 1.5 * scale
      const height = THREE.MathUtils.lerp(mesh.scale.y, val * 3 * scale + 0.1, lerpFactor)

      mesh.scale.y = height
      mesh.position.x = Math.cos(bar.angle) * (radius + height * 0.5)
      mesh.position.y = Math.sin(bar.angle) * (radius + height * 0.5)
      mesh.rotation.z = bar.angle - Math.PI / 2

      // Reuse pre-allocated color
      tmpLerp.copy(tmpColor1).lerp(tmpColor2, val)
      bar.mat.color.copy(tmpLerp)

      // Peak hold
      if (peakHold.enabled && peaks[i]) {
        const currentVal = height
        if (currentVal > peaks[i].value) {
          peaks[i].value = currentVal
          peaks[i].time = t
        } else {
          const elapsed = t - peaks[i].time
          if (elapsed > peakHold.falloffTime) {
            peaks[i].value = THREE.MathUtils.lerp(peaks[i].value, 0, 0.05)
          }
        }
      }
    })

    // Update peak markers
    if (peakGroupRef.current) {
      peakGroupRef.current.visible = peakHold.enabled
      peakGroupRef.current.rotation.z = group.rotation.z
      if (peakHold.enabled) {
        peakGroupRef.current.children.forEach((child, i) => {
          const mesh = child as THREE.Mesh
          const bar = bars[i]
          if (peaks[i] && bar) {
            const radius = 1.5 * scale
            const peakR = radius + peaks[i].value + 0.2
            mesh.position.x = Math.cos(bar.angle) * peakR
            mesh.position.y = Math.sin(bar.angle) * peakR
            mesh.scale.set(peakHold.scaleX, peakHold.scaleY, 1)
            peakDots[i]?.mat.color.set(settings.colors.accent)
          }
        })
      }
    }
  })

  return (
    <group>
      <group ref={groupRef}>
        {bars.map((bar, i) => (
          <mesh key={i} geometry={bar.geom} material={bar.mat} />
        ))}
      </group>
      <group ref={peakGroupRef}>
        {peakDots.map((dot, i) => (
          <mesh key={i} geometry={dot.geom} material={dot.mat} />
        ))}
      </group>
    </group>
  )
}
