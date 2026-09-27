/* Draws the 3D camp in the same hand as the adventure map. The scene is rendered once
   to a texture, then redrawn as an illustration: ink lines where depth or tone jump
   (with the uneven pressure of a pen), the colours quietened and warmed toward
   watercolour, and the grain of the paper over everything. One extra full-screen pass;
   low power skips it and draws the plain scene. */
export function createInk(THREE, renderer) {
  const fragmentShader = `
    precision highp float;
    uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 texel; uniform float strength; uniform float night;
    varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    vec3 toSRGB(vec3 c){c=max(c,0.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
    float D(vec2 o){return texture2D(tDepth,vUv+o*texel).x;}
    float L(vec2 o){return dot(toSRGB(texture2D(tColor,vUv+o*texel).rgb),vec3(.3,.59,.11));}
    void main(){
      vec2 px=gl_FragCoord.xy;
      // Ink: silhouettes from depth, and inner lines where the tone changes sharply.
      float dd=abs(D(vec2(1.,0.))-D(vec2(-1.,0.)))+abs(D(vec2(0.,1.))-D(vec2(0.,-1.)));
      float de=smoothstep(.0009,.0034,dd);
      float ld=abs(L(vec2(1.,0.))-L(vec2(-1.,0.)))+abs(L(vec2(0.,1.))-L(vec2(0.,-1.)));
      float ce=smoothstep(.10,.26,ld);
      float press=.62+.6*n(px*.33);
      float edge=clamp(max(de,ce*.5)*press,0.,1.);
      // Watercolour: quieter, warmer colour with lifted darks.
      vec3 s=toSRGB(texture2D(tColor,vUv).rgb);
      float l=dot(s,vec3(.3,.59,.11));
      s=mix(vec3(l),s,.82);
      s=s*vec3(1.02,1.,.93)+vec3(.035,.028,.012);
      // Pigment pools a little darker in blotches, and the paper's tooth shows through.
      float bloom=n(px*.012+3.1);
      s*=.955+.07*bloom;
      float tooth=n(px*.9)*.5+n(px*.27)*.5;
      s*=.93+.1*tooth;
      vec3 ink=night>.5?vec3(.13,.14,.19):vec3(.25,.18,.12);
      s=mix(s,ink,edge*strength);
      gl_FragColor=vec4(s,1.);
    }`;
  const material = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: null }, tDepth: { value: null }, texel: { value: new THREE.Vector2(1, 1) }, strength: { value: .82 }, night: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader, depthTest: false, depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material), post = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false; post.add(quad);
  const gl2 = renderer.capabilities.isWebGL2, half = gl2 && (renderer.extensions.has('EXT_color_buffer_half_float') || renderer.extensions.has('EXT_color_buffer_float'));
  const size = new THREE.Vector2();
  let target = null;
  function ensure() {
    renderer.getDrawingBufferSize(size);
    if (target && target.width === size.x && target.height === size.y) return;
    target?.dispose();
    target = new THREE.WebGLRenderTarget(size.x, size.y, { samples: gl2 ? 4 : 0, type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, depthTexture: new THREE.DepthTexture(size.x, size.y) });
    material.uniforms.texel.value.set(1 / size.x, 1 / size.y);
  }
  function render(scene, camera, { night = false } = {}) {
    ensure();
    const old = renderer.getRenderTarget();
    renderer.setRenderTarget(target); renderer.render(scene, camera);
    renderer.setRenderTarget(old);
    material.uniforms.tColor.value = target.texture; material.uniforms.tDepth.value = target.depthTexture; material.uniforms.night.value = night ? 1 : 0;
    renderer.render(post, cam);
  }
  function dispose() { target?.depthTexture?.dispose(); target?.dispose(); material.dispose(); quad.geometry.dispose(); }
  return { render, dispose };
}
