uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAccent;

varying float vFreq;
varying float vDist;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;

  float alpha = 1.0 - smoothstep(0.3, 0.5, d);
  alpha *= 0.6 + vFreq * 0.4;

  vec3 color = mix(uColor1, uColor2, vDist * 0.3);
  color = mix(color, uAccent, vFreq * 0.5);

  float glow = pow(vFreq, 3.0);
  color += glow * 0.3;

  gl_FragColor = vec4(color, alpha);
}
