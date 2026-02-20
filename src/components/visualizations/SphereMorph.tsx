import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

export default function SphereMorph() {
  const { audio, settings } = useApp()
  const meshRef = useRef<THREE.Mesh>(null)

  const scale = settings.visualization.scale

  const { geometry, material, originalPositions } = useMemo(() => {
    const geom = new THREE.SphereGeometry(2 * scale, 64, 64)
    const origPos = new Float32Array(geom.attributes.position.array)

    const mat = new THREE.MeshPhongMaterial({
      color: '#ffffff',
      emissive: '#888888',
      emissiveIntensity: 0.3,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    })

    return { geometry: geom, material: mat, originalPositions: origPos }
  }, [scale]) // eslint-disable-line

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = audio.frequencyData
    const mesh = meshRef.current
    if (!data || !mesh) return

    mesh.rotation.y = t * (settings.effects.rotationSpeed * 0.3 || 0.2)
    mesh.rotation.x = Math.sin(t * 0.1) * 0.2

    const pos = geometry.attributes.position as THREE.BufferAttribute
    const vertCount = pos.count
    const step = Math.max(1, Math.floor(data.length / vertCount))

    for (let i = 0; i < vertCount; i++) {
      const ox = originalPositions[i * 3]
      const oy = originalPositions[i * 3 + 1]
      const oz = originalPositions[i * 3 + 2]

      const idx = (i * step) % data.length
      const freq = (data[idx] / 255) * settings.sensitivity.overall
      const displacement = freq * 0.8 * scale

      const nx = ox / (2 * scale)
      const ny = oy / (2 * scale)
      const nz = oz / (2 * scale)
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

      pos.array[i * 3] = ox + (nx / len) * displacement + Math.sin(t * 2 + i * 0.1) * freq * 0.1
      pos.array[i * 3 + 1] = oy + (ny / len) * displacement + Math.cos(t * 1.5 + i * 0.1) * freq * 0.1
      pos.array[i * 3 + 2] = oz + (nz / len) * displacement
    }

    pos.needsUpdate = true
    geometry.computeVertexNormals()

    material.color.set(settings.colors.primary)
    material.emissive.set(settings.colors.secondary)
    material.emissiveIntensity = 0.2 + audio.frequencyBands.bass * 0.5
  })

  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color={settings.colors.accent} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color={settings.colors.secondary} />
      <mesh ref={meshRef} geometry={geometry} material={material} />
    </group>
  )
}
