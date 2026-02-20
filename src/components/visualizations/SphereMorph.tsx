import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

export default function SphereMorph() {
  const { frameDataRef, settings } = useApp()
  const meshRef = useRef<THREE.Mesh>(null)

  const scale = settings.visualization.scale

  const { geometry, material, originalPositions } = useMemo(() => {
    // Reduced from 64x64 (8192 verts) to 32x32 (2048 verts) — 4x less work per frame
    const geom = new THREE.SphereGeometry(2 * scale, 32, 32)
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
  }, [scale])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = frameDataRef.current.frequencyData
    const mesh = meshRef.current
    if (!data || !mesh) return

    mesh.rotation.y = t * (settings.effects.rotationSpeed * 0.3 || 0.2)
    mesh.rotation.x = Math.sin(t * 0.1) * 0.2

    const pos = geometry.attributes.position as THREE.BufferAttribute
    const vertCount = pos.count
    const step = Math.max(1, Math.floor(data.length / vertCount))
    const invScale2 = 1 / (2 * scale)

    for (let i = 0; i < vertCount; i++) {
      const i3 = i * 3
      const ox = originalPositions[i3]
      const oy = originalPositions[i3 + 1]
      const oz = originalPositions[i3 + 2]

      const idx = (i * step) % data.length
      const freq = (data[idx] / 255) * settings.sensitivity.overall
      const displacement = freq * 0.8 * scale

      const nx = ox * invScale2
      const ny = oy * invScale2
      const nz = oz * invScale2
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      const invLen = 1 / len

      pos.array[i3] = ox + nx * invLen * displacement + Math.sin(t * 2 + i * 0.1) * freq * 0.1
      pos.array[i3 + 1] = oy + ny * invLen * displacement + Math.cos(t * 1.5 + i * 0.1) * freq * 0.1
      pos.array[i3 + 2] = oz + nz * invLen * displacement
    }

    pos.needsUpdate = true
    // Removed computeVertexNormals() — wireframe doesn't need normals, saves massive CPU

    material.color.set(settings.colors.primary)
    material.emissive.set(settings.colors.secondary)
    material.emissiveIntensity = 0.2 + frameDataRef.current.frequencyBands.bass * 0.5
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
