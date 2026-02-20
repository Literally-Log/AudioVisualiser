import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

export default function Tunnel() {
  const { audio, settings } = useApp()
  const groupRef = useRef<THREE.Group>(null)

  const ringCount = 30
  const segmentCount = settings.visualization.resolution / 2 || 32
  const scale = settings.visualization.scale

  const rings = useMemo(() => {
    const items: { lineObj: THREE.Line; mat: THREE.LineBasicMaterial; z: number }[] = []

    for (let r = 0; r < ringCount; r++) {
      const points: THREE.Vector3[] = []
      for (let s = 0; s <= segmentCount; s++) {
        const angle = (s / segmentCount) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(angle) * 3 * scale, Math.sin(angle) * 3 * scale, 0))
      }
      const geom = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.6,
      })
      const lineObj = new THREE.Line(geom, mat)
      lineObj.position.z = -r * 2
      items.push({ lineObj, mat, z: -r * 2 })
    }

    return items
  }, [ringCount, segmentCount, scale])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = audio.frequencyData
    if (!data) return

    rings.forEach((ring, i) => {
      const pos = ring.lineObj.geometry.attributes.position as THREE.BufferAttribute

      const freqIdx = Math.floor((i / ringCount) * data.length * 0.5)
      const freq = ((data[freqIdx] || 0) / 255) * settings.sensitivity.overall

      for (let s = 0; s <= segmentCount; s++) {
        const angle = (s / segmentCount) * Math.PI * 2
        const radius = (3 + freq * 2 + Math.sin(t * 2 + angle * 3 + i * 0.5) * freq * 0.5) * scale
        pos.array[s * 3] = Math.cos(angle) * radius
        pos.array[s * 3 + 1] = Math.sin(angle) * radius
      }
      pos.needsUpdate = true

      const z = ((ring.z + t * 3) % (ringCount * 2)) - ringCount * 2
      ring.lineObj.position.z = z

      const distFactor = 1 - Math.abs(z) / (ringCount * 2)
      ring.mat.opacity = distFactor * 0.8
      ring.mat.color.lerpColors(
        new THREE.Color(settings.colors.primary),
        new THREE.Color(settings.colors.secondary),
        distFactor,
      )
    })
  })

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <primitive key={i} object={ring.lineObj} />
      ))}
    </group>
  )
}
