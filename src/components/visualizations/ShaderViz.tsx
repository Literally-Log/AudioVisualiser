import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useApp } from '../../context/AppContext.tsx'

import shaderVizFrag from '../../shaders/shader-viz.frag.glsl'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`

export default function ShaderViz() {
  const { frameDataRef, settings } = useApp()
  const meshRef = useRef<THREE.Mesh>(null)
  const { size } = useThree()

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: shaderVizFrag,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color(settings.colors.primary) },
        uColor2: { value: new THREE.Color(settings.colors.secondary) },
        uAccent: { value: new THREE.Color(settings.colors.accent) },
        uResolution: { value: new THREE.Vector2(size.width, size.height) },
      },
    })
  }, []) // eslint-disable-line

  useFrame((state) => {
    const bands = frameDataRef.current.frequencyBands
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uBass.value = bands.bass + bands.subBass
    material.uniforms.uMid.value = bands.mid + bands.lowMid
    material.uniforms.uTreble.value = bands.treble + bands.highMid
    material.uniforms.uColor1.value.set(settings.colors.primary)
    material.uniforms.uColor2.value.set(settings.colors.secondary)
    material.uniforms.uAccent.value.set(settings.colors.accent)
    material.uniforms.uResolution.value.set(size.width, size.height)
  })

  return (
    <mesh ref={meshRef} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  )
}
