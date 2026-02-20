import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

import particleVertShader from '../../shaders/particle.vert.glsl'
import particleFragShader from '../../shaders/particle.frag.glsl'

export default function ParticleSystem() {
  const { frameDataRef, settings } = useApp()
  const pointsRef = useRef<THREE.Points>(null)

  const count = settings.effects.particleDensity
  const scale = settings.visualization.scale

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const freqs = new Float32Array(count)
    const normals = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = (1 + Math.random() * 3) * scale

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      normals[i * 3] = Math.sin(phi) * Math.cos(theta)
      normals[i * 3 + 1] = Math.sin(phi) * Math.sin(theta)
      normals[i * 3 + 2] = Math.cos(phi)

      scales[i] = 0.5 + Math.random() * 1.5
      freqs[i] = 0
    }

    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
    geom.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
    geom.setAttribute('aFreq', new THREE.BufferAttribute(freqs, 1))

    const mat = new THREE.ShaderMaterial({
      vertexShader: particleVertShader,
      fragmentShader: particleFragShader,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uSize: { value: 4.0 * scale },
        uColor1: { value: new THREE.Color('#ffffff') },
        uColor2: { value: new THREE.Color('#888888') },
        uAccent: { value: new THREE.Color('#ff0088') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: geom, material: mat }
  }, [count, scale]) // eslint-disable-line

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const data = frameDataRef.current.frequencyData
    if (!data) return

    material.uniforms.uTime.value = t
    material.uniforms.uBass.value = frameDataRef.current.frequencyBands.bass
    material.uniforms.uColor1.value.set(settings.colors.primary)
    material.uniforms.uColor2.value.set(settings.colors.secondary)
    material.uniforms.uAccent.value.set(settings.colors.accent)

    const freqAttr = geometry.attributes.aFreq as THREE.BufferAttribute
    const step = Math.max(1, Math.floor(data.length / count))
    for (let i = 0; i < count; i++) {
      const idx = (i * step) % data.length
      const target = (data[idx] / 255) * settings.sensitivity.overall
      freqAttr.array[i] = THREE.MathUtils.lerp(freqAttr.array[i] as number, target, 0.15)
    }
    freqAttr.needsUpdate = true
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
