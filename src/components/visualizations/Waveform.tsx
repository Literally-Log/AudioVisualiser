import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

export default function Waveform() {
  const { audio, settings } = useApp()
  const groupRef = useRef<THREE.Group>(null)

  const pointCount = Math.min(settings.visualization.resolution * 4, 1024)
  const scale = settings.visualization.scale

  const { geom, geom2, mat, mat2, line1, line2 } = useMemo(() => {
    const spread = 10 * scale
    const positions = new Float32Array(pointCount * 3)
    const positions2 = new Float32Array(pointCount * 3)
    for (let i = 0; i < pointCount; i++) {
      const x = (i / pointCount - 0.5) * spread
      positions[i * 3] = x
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      positions2[i * 3] = x
      positions2[i * 3 + 1] = 0
      positions2[i * 3 + 2] = 0.3
    }

    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const g2 = new THREE.BufferGeometry()
    g2.setAttribute('position', new THREE.BufferAttribute(positions2, 3))

    const m = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2, transparent: true, opacity: 0.9 })
    const m2 = new THREE.LineBasicMaterial({ color: '#888888', linewidth: 1, transparent: true, opacity: 0.4 })

    const l1 = new THREE.Line(g, m)
    const l2 = new THREE.Line(g2, m2)

    return { geom: g, geom2: g2, mat: m, mat2: m2, line1: l1, line2: l2 }
  }, [pointCount, scale])

  useFrame(() => {
    const timeData = audio.timeDomainData
    const freqData = audio.frequencyData
    if (!timeData) return

    const pos = geom.attributes.position as THREE.BufferAttribute
    const pos2 = geom2.attributes.position as THREE.BufferAttribute
    const step = Math.max(1, Math.floor(timeData.length / pointCount))
    const ampScale = scale * 2

    for (let i = 0; i < pointCount; i++) {
      const timeVal = ((timeData[i * step] || 128) / 128 - 1) * ampScale * settings.sensitivity.overall
      pos.array[i * 3 + 1] = timeVal

      if (freqData) {
        const freqVal = ((freqData[i * step] || 0) / 255) * settings.sensitivity.overall * scale
        pos2.array[i * 3 + 1] = freqVal * 2 - 1
      }
    }

    pos.needsUpdate = true
    pos2.needsUpdate = true

    mat.color.set(settings.colors.primary)
    mat2.color.set(settings.colors.secondary)
  })

  return (
    <group ref={groupRef}>
      <primitive object={line1} />
      <primitive object={line2} />
    </group>
  )
}
