uniform float uFrequency;
uniform float uTime;

varying vec2 vUv;
varying float vFrequency;

void main() {
  vUv = uv;
  vFrequency = uFrequency;

  vec3 pos = position;
  pos.y *= uFrequency;
  pos.y += sin(uTime * 2.0 + position.x * 0.5) * 0.02 * uFrequency;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
