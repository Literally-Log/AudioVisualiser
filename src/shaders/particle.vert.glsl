attribute float aScale;
attribute float aFreq;

uniform float uTime;
uniform float uBass;
uniform float uSize;

varying float vFreq;
varying float vDist;

void main() {
  vFreq = aFreq;

  vec3 pos = position;
  float dist = length(pos.xy);
  vDist = dist;

  pos += normal * aFreq * 2.0;
  pos.x += sin(uTime * 0.5 + pos.y * 2.0) * aFreq * 0.3;
  pos.y += cos(uTime * 0.3 + pos.x * 2.0) * aFreq * 0.3;
  pos *= 1.0 + uBass * 0.3;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = uSize * aScale * (1.0 + aFreq * 2.0) * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
