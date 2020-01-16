(window.webpackJsonp=window.webpackJsonp||[]).push([[84],{579:function(n,e,t){"use strict";t.r(e),e.default="const {Scene} = spritejs;\nconst {Camera, Mesh3d, Plane, shaders} = spritejs.ext3d;\nconst container = document.getElementById('container');\nconst scene = new Scene({\n  container,\n  displayRatio: 2,\n});\n\nconst layer = scene.layer3d('fglayer', {\n  camera: {\n    fov: 35,\n  },\n});\n\nlayer.camera.attributes.pos = [5, 4, 10];\nlayer.setOrbit();\n\nconst light = new Camera(layer.gl, {\n  left: -3,\n  right: 3,\n  bottom: -3,\n  top: 3,\n  near: 1,\n  far: 20,\n});\nlight.attributes.pos = [3, 10, 3];\nlight.lookAt([0, 0, 0]);\n\nconst shadow = layer.createShadow({light});\n\nconst texture = layer.createTexture('https://p2.ssl.qhimg.com/t01155feb9a795bdd05.jpg');\nconst model = layer.loadModel('https://s0.ssl.qhres.com/static/0baccc5ad3cd5b8c.json');\nconst program = layer.createProgram({\n  ...shaders.TEXTURE_WITH_SHADOW,\n  cullFace: null,\n  texture,\n});\nconst plane = new Mesh3d(program, {model});\nwindow.plane = plane;\nlayer.append(plane);\n\nconst waterTexture = layer.createTexture('https://p0.ssl.qhimg.com/t01db936e50ab52f10a.jpg');\nconst program2 = layer.createProgram({\n  ...shaders.TEXTURE_WITH_SHADOW,\n  cullFace: null,\n  texture: waterTexture,\n});\nconst ground = new Plane(program2, {\n  rotateX: 90,\n  scale: 6,\n  y: -3,\n});\nlayer.append(ground);\n\nshadow.add(plane);\nshadow.add(ground);\nlayer.setShadow(shadow);\n\nlayer.tick((t) => {\n  // A bit of plane animation\n  if(plane) {\n    plane.attributes.z = Math.sin(t * 0.001);\n    plane.attributes.rotateX = Math.sin(t * 0.001 + 2) * 18;\n    plane.attributes.rotateY = Math.sin(t * 0.001 - 4) * -18;\n  }\n});"}}]);