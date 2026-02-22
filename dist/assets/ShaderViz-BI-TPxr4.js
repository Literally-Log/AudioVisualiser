import{r as t,u as c,a as v,j as a}from"./r3f-g1wBN0as.js";import{u as f}from"./index-BbBGfACN.js";import{z as m,h as d,e as u}from"./three-Bh83E8IK.js";import"./postprocessing-DfBAEU_l.js";const p=`uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAccent;
uniform vec2 uResolution;

varying vec2 vUv;

#define PI 3.14159265

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * smoothNoise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv - 0.5;
  float aspect = uResolution.x / uResolution.y;
  uv.x *= aspect;

  float t = uTime * 0.2;

  vec2 q = vec2(0.0);
  q.x = fbm(uv + t * 0.1);
  q.y = fbm(uv + vec2(1.0));

  vec2 r = vec2(0.0);
  r.x = fbm(uv + q * (1.0 + uBass) + vec2(1.7, 9.2) + t * 0.15);
  r.y = fbm(uv + q * (1.0 + uMid) + vec2(8.3, 2.8) + t * 0.126);

  float f = fbm(uv + r * (2.0 + uTreble));

  vec3 col = mix(uColor1, uColor2, clamp(f * f * 4.0, 0.0, 1.0));
  col = mix(col, uAccent, clamp(length(q) * 0.5, 0.0, 1.0));
  col = mix(col, uColor1 * 1.5, clamp(length(r) * 0.3, 0.0, 1.0));

  col *= (f * 1.5 + 0.3);
  col += uBass * 0.1 * uAccent;

  float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 1.5;
  col *= vignette;

  gl_FragColor = vec4(col, 1.0);
}
`,h=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;function C(){const{frameDataRef:s,settings:e}=f(),i=t.useRef(null),{size:r}=c(),n=t.useMemo(()=>new m({vertexShader:h,fragmentShader:p,uniforms:{uTime:{value:0},uBass:{value:0},uMid:{value:0},uTreble:{value:0},uColor1:{value:new u(e.colors.primary)},uColor2:{value:new u(e.colors.secondary)},uAccent:{value:new u(e.colors.accent)},uResolution:{value:new d(r.width,r.height)}}}),[]);return v(l=>{const o=s.current.frequencyBands;n.uniforms.uTime.value=l.clock.elapsedTime,n.uniforms.uBass.value=o.bass+o.subBass,n.uniforms.uMid.value=o.mid+o.lowMid,n.uniforms.uTreble.value=o.treble+o.highMid,n.uniforms.uColor1.value.set(e.colors.primary),n.uniforms.uColor2.value.set(e.colors.secondary),n.uniforms.uAccent.value.set(e.colors.accent),n.uniforms.uResolution.value.set(r.width,r.height)}),a.jsx("mesh",{ref:i,material:n,children:a.jsx("planeGeometry",{args:[2,2]})})}export{C as default};
