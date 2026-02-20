uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uFrequency;
uniform float uTime;

varying vec2 vUv;
varying float vFrequency;

void main() {
  vec3 color = mix(uColor1, uColor2, vUv.y);
  float glow = pow(vFrequency, 2.0) * 0.5;
  float pulse = sin(uTime * 3.0) * 0.05 + 1.0;

  color *= (1.0 + glow) * pulse;

  float alpha = 0.8 + vFrequency * 0.2;
  gl_FragColor = vec4(color, alpha);
}
