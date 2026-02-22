import{r as g,a as U,j as p}from"./r3f-g1wBN0as.js";import{u as z}from"./index-BbBGfACN.js";import{a3 as k,z as B,e as w,a4 as E,a2 as C}from"./three-Bh83E8IK.js";import"./postprocessing-DfBAEU_l.js";const H=`uniform float uFrequency;
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
`,V=`uniform vec3 uColor1;
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
`;function W(){const{frameDataRef:R,settings:r}=z(),T=g.useRef(null),v=g.useRef(null),i=r.visualization.resolution,d=r.visualization.scale,l=r.peakHold,f=r.frequencyTuning,q=g.useRef([]),{meshes:j,materials:F,peakMeshes:G,peakMaterials:M}=g.useMemo(()=>{const s=[],o=[],c=[],h=[],n=8*d,e=Math.max(.02,n/i*.85),t=new k(e,1,e),a=new k(e*1.1,.06,e*1.1);for(let m=0;m<i;m++){const y=(m/i-.5)*n,u=new B({vertexShader:H,fragmentShader:V,uniforms:{uFrequency:{value:0},uTime:{value:0},uColor1:{value:new w("#ffffff")},uColor2:{value:new w("#888888")}},transparent:!0});s.push(u),o.push({geom:t,pos:[y,.5,0]});const x=new E({color:"#ffffff",transparent:!0,opacity:.9});h.push(x),c.push({geom:a,pos:[y,0,0]})}return q.current=Array.from({length:i},()=>({value:0,time:0})),{meshes:o,materials:s,peakMeshes:c,peakMaterials:h}},[i,d]);return U(s=>{const o=s.clock.elapsedTime,c=R.current.frequencyData;if(!c||!F.length)return;const h=Math.floor(c.length/i),n=q.current;for(let e=0;e<i;e++){const t=e/i;let a=1;t<.05?a=f.subBassGain/100:t<.15?a=f.bassGain/100:t<.5?a=f.midGain/100:a=f.trebleGain/100;const m=c[e*h]/255,y=Math.min(1,m*r.sensitivity.overall*a),u=F[e],S=.1+(1-f.smoothness/100)*.5;if(u.uniforms.uFrequency.value=C.lerp(u.uniforms.uFrequency.value,y*d*r.visualization.heightMultiplier,S),u.uniforms.uTime.value=o,u.uniforms.uColor1.value.set(r.colors.primary),u.uniforms.uColor2.value.set(r.colors.secondary),l.enabled&&n[e]){const b=u.uniforms.uFrequency.value;b>n[e].value?(n[e].value=b,n[e].time=o):o-n[e].time>l.falloffTime&&(n[e].value=C.lerp(n[e].value,0,.05))}}v.current&&(v.current.visible=l.enabled,l.enabled&&v.current.children.forEach((e,t)=>{const a=e;n[t]&&(a.position.y=n[t].value*3+.5,a.scale.set(l.scaleX,l.scaleY,1),M[t]?.color.set(r.colors.accent))}))}),p.jsxs("group",{position:[0,-1.5,0],children:[p.jsx("group",{ref:T,children:j.map((s,o)=>p.jsx("mesh",{geometry:s.geom,material:F[o],position:s.pos},o))}),p.jsx("group",{ref:v,children:G.map((s,o)=>p.jsx("mesh",{geometry:s.geom,material:M[o],position:s.pos},o))})]})}export{W as default};
