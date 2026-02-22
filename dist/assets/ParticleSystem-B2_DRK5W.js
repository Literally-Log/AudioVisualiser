import{r as y,a as F,j as q}from"./r3f-g1wBN0as.js";import{u as w}from"./index-BbBGfACN.js";import{Z as A,_ as m,z as x,a8 as S,e as h,a2 as C}from"./three-Bh83E8IK.js";import"./postprocessing-DfBAEU_l.js";const b=`attribute float aScale;
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
`,B=`uniform vec3 uColor1;
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
`;function _(){const{frameDataRef:d,settings:s}=w(),M=y.useRef(null),e=s.effects.particleDensity,v=s.visualization.scale,{geometry:g,material:i}=y.useMemo(()=>{const l=new Float32Array(e*3),f=new Float32Array(e),n=new Float32Array(e),o=new Float32Array(e*3);for(let t=0;t<e;t++){const c=Math.random()*Math.PI*2,u=Math.acos(2*Math.random()-1),p=(1+Math.random()*3)*v;l[t*3]=p*Math.sin(u)*Math.cos(c),l[t*3+1]=p*Math.sin(u)*Math.sin(c),l[t*3+2]=p*Math.cos(u),o[t*3]=Math.sin(u)*Math.cos(c),o[t*3+1]=Math.sin(u)*Math.sin(c),o[t*3+2]=Math.cos(u),f[t]=.5+Math.random()*1.5,n[t]=0}const a=new A;a.setAttribute("position",new m(l,3)),a.setAttribute("normal",new m(o,3)),a.setAttribute("aScale",new m(f,1)),a.setAttribute("aFreq",new m(n,1));const r=new x({vertexShader:b,fragmentShader:B,uniforms:{uTime:{value:0},uBass:{value:0},uSize:{value:4*v},uColor1:{value:new h("#ffffff")},uColor2:{value:new h("#888888")},uAccent:{value:new h("#ff0088")}},transparent:!0,depthWrite:!1,blending:S});return{geometry:a,material:r}},[e,v]);return F(l=>{const f=l.clock.elapsedTime,n=d.current.frequencyData;if(!n)return;i.uniforms.uTime.value=f,i.uniforms.uBass.value=d.current.frequencyBands.bass,i.uniforms.uColor1.value.set(s.colors.primary),i.uniforms.uColor2.value.set(s.colors.secondary),i.uniforms.uAccent.value.set(s.colors.accent);const o=g.attributes.aFreq,a=Math.max(1,Math.floor(n.length/e));for(let r=0;r<e;r++){const t=r*a%n.length,c=n[t]/255*s.sensitivity.overall;o.array[r]=C.lerp(o.array[r],c,.15)}o.needsUpdate=!0}),q.jsx("points",{ref:M,geometry:g,material:i})}export{_ as default};
