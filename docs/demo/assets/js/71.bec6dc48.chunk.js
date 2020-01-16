(window.webpackJsonp=window.webpackJsonp||[]).push([[71],{566:function(n,e,t){"use strict";t.r(e),e.default="const vertex = /* glsl */ `\n    precision highp float;\n\n    attribute vec2 coords;\n    attribute vec4 random;\n\n    uniform float uTime;\n    uniform sampler2D tPosition;\n    uniform sampler2D tVelocity;\n\n    varying vec4 vRandom;\n    varying vec4 vVelocity;\n\n    void main() {\n        vRandom = random;\n\n        // Get position from texture, rather than attribute\n        vec4 position = texture2D(tPosition, coords);\n        vVelocity = texture2D(tVelocity, coords);\n        \n        // Add some subtle random oscillating so it never fully stops\n        position.xy += sin(vec2(uTime) * vRandom.wy + vRandom.xz * 6.28) * vRandom.zy * 0.1;\n\n        gl_Position = vec4(position.xy, 0, 1);\n        gl_PointSize = mix(2.0, 15.0, vRandom.x);\n\n        // Make bigger while moving\n        gl_PointSize *= 1.0 + min(1.0, length(vVelocity.xy));\n\n    }\n`;\n\nconst fragment = /* glsl */ `\n    precision highp float;\n\n    varying vec4 vRandom;\n    varying vec4 vVelocity;\n\n    void main() {\n\n        // Circle shape\n        if (step(0.5, length(gl_PointCoord.xy - 0.5)) > 0.0) discard;\n\n        // Random colour\n        vec3 color = vec3(vRandom.zy, 1.0) * mix(0.7, 2.0, vRandom.w);\n\n        // Fade to white when not moving, with an ease off curve\n        gl_FragColor.rgb = mix(vec3(1), color, 1.0 - pow(1.0 - smoothstep(0.0, 0.7, length(vVelocity.xy)), 2.0));\n\n        gl_FragColor.a = 1.0;\n    }\n`;\n\nconst positionFragment = /* glsl */ `\n    precision highp float;\n\n    uniform float uTime;\n    uniform sampler2D tVelocity;\n\n    // Default texture uniform for GPGPU pass is 'tMap'.\n    // Can use the textureUniform parameter to update.\n    uniform sampler2D tMap;\n\n    varying vec2 vUv;\n\n    void main() {\n        vec4 position = texture2D(tMap, vUv);\n        vec4 velocity = texture2D(tVelocity, vUv);\n\n        position.xy += velocity.xy * 0.01;\n                        \n        // Keep in bounds\n        vec2 limits = vec2(1);\n        position.xy += (1.0 - step(-limits.xy, position.xy)) * limits.xy * 2.0;\n        position.xy -= step(limits.xy, position.xy) * limits.xy * 2.0;\n\n        gl_FragColor = position;\n    }\n`;\n\nconst velocityFragment = /* glsl */ `\n    precision highp float;\n\n    uniform float uTime;\n    uniform sampler2D tPosition;\n    uniform sampler2D tMap;\n    uniform vec2 uMouse;\n\n    varying vec2 vUv;\n\n    void main() {\n        vec4 position = texture2D(tPosition, vUv);\n        vec4 velocity = texture2D(tMap, vUv);\n\n        // Repulsion from mouse\n        vec2 toMouse = position.xy - uMouse;\n        float strength = smoothstep(0.3, 0.0, length(toMouse));\n        velocity.xy += strength * normalize(toMouse) * 0.5;\n\n        // Friction\n        velocity.xy *= 0.98;\n\n        gl_FragColor = velocity;\n    }\n`;\n\nconst {Scene} = spritejs;\nconst {Vec2, GPGPU, Geometry, Mesh3d} = spritejs.ext3d;\nconst container = document.getElementById('container');\nconst scene = new Scene({\n  container,\n  displayRatio: 2,\n});\nconst layer = scene.layer3d('fglayer', {\n  camera: {\n    fov: 35,\n  },\n  ambientColor: 'white',\n});\n\nlayer.camera.attributes.pos = [0, 0, 5];\n\n// Common uniforms\nconst time = {value: 0};\nconst mouse = {value: new Vec2()};\n\n// The number of particles will determine how large the GPGPU textures are,\n// and therefore how expensive the GPU calculations will be.\n// Below I'm using 65536 to use every pixel of a 256x256 texture. If I used one more (65537),\n// it would need to use a 512x512 texture - the GPU would then perform calculations for each pixel,\n// meaning that nearly 3/4 of the texture (196607 pixels) would be redundant.\nconst numParticles = 65536;\n\n// Create the initial data arrays for position and velocity. 4 values for RGBA channels in texture.\nconst initialPositionData = new Float32Array(numParticles * 4);\nconst initialVelocityData = new Float32Array(numParticles * 4);\n\n// Random to be used as regular static attribute\nconst random = new Float32Array(numParticles * 4);\nfor(let i = 0; i < numParticles; i++) {\n  initialPositionData.set([\n    (Math.random() - 0.5) * 2.0,\n    (Math.random() - 0.5) * 2.0,\n    0, // the Green and Alpha channels go unused in this example, however I set\n    1, // unused Alpha to 1 so that texture is visible in WebGL debuggers\n  ], i * 4);\n  initialVelocityData.set([0, 0, 0, 1], i * 4);\n  random.set([\n    Math.random(),\n    Math.random(),\n    Math.random(),\n    Math.random(),\n  ], i * 4);\n}\n\nconst gl = layer.gl;\n\n// Initialise the GPGPU classes, creating the FBOs and corresponding texture coordinates\nconst position = new GPGPU(gl, {data: initialPositionData});\nconst velocity = new GPGPU(gl, {data: initialVelocityData});\n\n// Add the simulation shaders as passes to each GPGPU class\nposition.addPass({\n  fragment: positionFragment,\n  uniforms: {\n    uTime: time,\n    tVelocity: velocity.uniform,\n  },\n});\nvelocity.addPass({\n  fragment: velocityFragment,\n  uniforms: {\n    uTime: time,\n    uMouse: mouse,\n    tPosition: position.uniform,\n  },\n});\n\n// Now we can create our geometry, using the coordinates from above.\n// We don't use the velocity or position data as attributes,\n// instead we will get this from the FBO textures in the shader.\nconst model = new Geometry(gl, {\n  random: {size: 4, data: random},\n\n  // Could use either position or velocity coords, as they are the same\n  coords: {size: 2, data: position.coords},\n});\n\nconst program = layer.createProgram({\n  vertex,\n  fragment,\n  uniforms: {\n    uTime: time,\n    tPosition: position.uniform,\n    tVelocity: velocity.uniform,\n  },\n});\n\nconst points = new Mesh3d(program, {model, mode: gl.POINTS});\n\n// Add handlers to get mouse position\nconst isTouchCapable = 'ontouchstart' in window;\nif(isTouchCapable) {\n  window.addEventListener('touchstart', updateMouse, false);\n  window.addEventListener('touchmove', updateMouse, false);\n} else {\n  window.addEventListener('mousemove', updateMouse, false);\n}\n\nfunction updateMouse(e) {\n  if(e.changedTouches && e.changedTouches.length) {\n    e.x = e.changedTouches[0].pageX;\n    e.y = e.changedTouches[0].pageY;\n  }\n  if(e.x === undefined) {\n    e.x = e.pageX;\n    e.y = e.pageY;\n  }\n\n  // Get mouse value in -1 to 1 range, with y flipped\n  mouse.value.set(\n    (e.x / gl.renderer.width) * 2 - 1,\n    (1.0 - e.y / gl.renderer.height) * 2 - 1\n  );\n}\n\nlayer.append(points);\n\nlayer.tick((t) => {\n  time.value = t * 0.001;\n\n  // Update the GPGPU classes\n  velocity.render();\n  position.render();\n});\n"}}]);