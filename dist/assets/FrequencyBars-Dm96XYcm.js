import{r as g,a as U,j as p}from"./r3f-CAPphJur.js";import{u as B}from"./index-Davg_Qsd.js";import{a2 as k,z,e as w,a3 as E,a4 as C}from"./three-DPks-rhs.js";import"./postprocessing-CdYowpSz.js";const H=`uniform float uFrequency;
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
`;function W(){const{frameDataRef:R,settings:t}=B(),T=g.useRef(null),v=g.useRef(null),u=t.visualization.resolution,d=t.visualization.scale,l=t.peakHold,f=t.frequencyTuning,q=g.useRef([]),{meshes:j,materials:F,peakMeshes:G,peakMaterials:x}=g.useMemo(()=>{const s=[],o=[],c=[],h=[],n=8*d,e=Math.max(.02,n/u*.85),r=new k(e,1,e),a=new k(e*1.1,.06,e*1.1);for(let m=0;m<u;m++){const y=(m/u-.5)*n,i=new z({vertexShader:H,fragmentShader:V,uniforms:{uFrequency:{value:0},uTime:{value:0},uColor1:{value:new w("#ffffff")},uColor2:{value:new w("#888888")}},transparent:!0});s.push(i),o.push({geom:r,pos:[y,.5,0]});const M=new E({color:"#ffffff",transparent:!0,opacity:.9});h.push(M),c.push({geom:a,pos:[y,0,0]})}return q.current=Array.from({length:u},()=>({value:0,time:0})),{meshes:o,materials:s,peakMeshes:c,peakMaterials:h}},[u,d]);return U(s=>{const o=s.clock.elapsedTime,c=R.current.frequencyData;if(!c||!F.length)return;const h=Math.floor(c.length/u),n=q.current;for(let e=0;e<u;e++){const r=e/u;let a=1;r<.05?a=f.subBassGain/100:r<.15?a=f.bassGain/100:r<.5?a=f.midGain/100:a=f.trebleGain/100;const m=c[e*h]/255,y=Math.min(1,m*t.sensitivity.overall*a),i=F[e],S=.1+(1-f.smoothness/100)*.5;if(i.uniforms.uFrequency.value=C.lerp(i.uniforms.uFrequency.value,y*d,S),i.uniforms.uTime.value=o,i.uniforms.uColor1.value.set(t.colors.primary),i.uniforms.uColor2.value.set(t.colors.secondary),l.enabled&&n[e]){const b=i.uniforms.uFrequency.value;b>n[e].value?(n[e].value=b,n[e].time=o):o-n[e].time>l.falloffTime&&(n[e].value=C.lerp(n[e].value,0,.05))}}v.current&&(v.current.visible=l.enabled,l.enabled&&v.current.children.forEach((e,r)=>{const a=e;n[r]&&(a.position.y=n[r].value*3+.5,a.scale.set(l.scaleX,l.scaleY,1),x[r]?.color.set(t.colors.accent))}))}),p.jsxs("group",{position:[0,-1.5,0],children:[p.jsx("group",{ref:T,children:j.map((s,o)=>p.jsx("mesh",{geometry:s.geom,material:F[o],position:s.pos},o))}),p.jsx("group",{ref:v,children:G.map((s,o)=>p.jsx("mesh",{geometry:s.geom,material:x[o],position:s.pos},o))})]})}export{W as default};
