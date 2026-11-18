import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = t => t * t * (3 - 2 * t);

export function createScene(canvas, { works, onHover, onOpen, onLabels, onReady, onFrame } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (err) {
    canvas.style.background = 'url("./assets/images/garden-full.webp") center/cover';
    onReady && onReady(false);
    return { ready: Promise.resolve(), setProgress() {}, focus() {}, release() {}, get hovered() { return -1; }, camera: null, fallback: true };
  }

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x02030a, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02030a);
  scene.fog = new THREE.FogExp2(0x03040a, 0.0115);
  const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 260);
  camera.position.set(0, 1.72, 10);
  const currentLook = new THREE.Vector3(0, 1.8, -10);

  scene.add(new THREE.AmbientLight(0x77718a, 1.65));
  const hemi = new THREE.HemisphereLight(0xb9c7e8, 0x100c16, 1.45);
  scene.add(hemi);

  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();
  let loaded = 0;
  const total = works.length + 4; // architecture + 7 works + panorama + noise + door
  const bump = () => {
    loaded++;
    const status = document.querySelector('#status');
    if (status) status.textContent = `${loaded} / ${total}`;
  };

  const texture = path => textureLoader.loadAsync(path).then(tex => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    bump();
    return tex;
  });

  const architecture = gltfLoader.loadAsync('./assets/gallery.gltf').then(gltf => {
    const material = new THREE.MeshStandardMaterial({
      color: 0x17151f, roughness: 0.83, metalness: 0.06,
      emissive: 0x05050b, emissiveIntensity: 0.7, side: THREE.DoubleSide
    });
    gltf.scene.traverse(o => { if (o.isMesh) { o.material = material; o.receiveShadow = false; } });
    scene.add(gltf.scene);
    bump();
    return gltf.scene;
  }).catch(err => {
    console.warn('Architecture fallback:', err);
    bump();
    return null;
  });

  const workTextures = Promise.all(works.map((_, i) => texture(`./assets/images/work-${String(i + 1).padStart(2, '0')}.webp`)));
  const panoramaTexture = texture('./assets/images/panorama.webp');
  const noiseTexture = texture('./assets/images/noise.webp');
  const doorTexture = texture('./assets/images/garden-full.webp');

  const paintings = [];
  const paintingMeshes = [];
  const lightPools = [];
  let doorPlane = null;

  const ready = Promise.all([architecture, workTextures, panoramaTexture, noiseTexture, doorTexture]).then(([arch, maps, pano, noise, doorMap]) => {
    // A lit doorway gives the first gallery frame a subject before the camera reaches the works.
    doorPlane = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({
      map: doorMap, transparent: true, opacity: .96, side: THREE.DoubleSide,
      depthWrite: false, fog: false, toneMapped: false
    }));
    doorPlane.position.set(0, 2.48, 2.2);
    scene.add(doorPlane);

    // Main works alternate down the two walls, just like a long exhibition route.
    works.forEach((work, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const z = -8 - i * 11.2;
      const group = new THREE.Group();
      group.position.set(side * 5.92, 2.35, z);
      group.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      group.userData = { index: i, side, z, title: work.title };

      const frameMat = new THREE.MeshStandardMaterial({ color: 0x211b16, roughness: 0.68, metalness: 0.18, emissive: 0x2a2012, emissiveIntensity: 0.22 });
      const frame = new THREE.Mesh(new THREE.BoxGeometry(3.75, 2.62, 0.13), frameMat);
      group.add(frame);
      const mat = new THREE.MeshBasicMaterial({ map: maps[i], side: THREE.DoubleSide, toneMapped: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.42, 2.29), mat);
      plane.position.z = 0.075;
      plane.userData = { index: i, work };
      group.add(plane);
      const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.55, 2.42)), new THREE.LineBasicMaterial({ color: 0xe8d8b4, transparent: true, opacity: 0.38 }));
      edge.position.z = 0.083;
      group.add(edge);
      scene.add(group);
      paintings.push(group); paintingMeshes.push(plane);

      const lamp = new THREE.PointLight(i % 3 === 0 ? 0xffd8a0 : 0xc3c8ee, 3.1, 14, 1.8);
      lamp.position.set(side * 3.8, 4.2, z + 0.5);
      scene.add(lamp); lightPools.push(lamp);
    });

    // Smaller studies between the principal works give the corridor its depth.
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const z = -3 - i * 6.5;
      const m = maps[(i * 3 + 2) % maps.length].clone();
      m.needsUpdate = true;
      const small = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.05), new THREE.MeshBasicMaterial({ map: m, color: 0x8c8a91, side: THREE.DoubleSide, toneMapped: false }));
      small.position.set(side * 5.88, 2.2 + (i % 3) * 0.55, z);
      small.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      small.position.z += side < 0 ? 0.03 : -0.03;
      scene.add(small);
    }

    // Reflective, slowly moving black water across the whole route.
    const water = new THREE.Mesh(new THREE.PlaneGeometry(11.8, 120, 48, 128), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uNoise: { value: noise }, uTint: { value: new THREE.Color(0x0c1424) } },
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying float vWave; uniform float uTime;
        void main(){ vUv=uv; vec3 p=position; float w=sin(p.x*1.5+uTime*.7)*.026+sin(p.y*.42-uTime*.55)*.045+sin((p.x+p.y)*.22+uTime*.3)*.018; p.z+=w; vWave=w; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
      fragmentShader: `varying vec2 vUv; varying float vWave; uniform float uTime; uniform sampler2D uNoise; uniform vec3 uTint;
        void main(){ float n=texture2D(uNoise,vUv*3.0+vec2(uTime*.006,-uTime*.011)).r; float band=sin(vUv.y*112.0+uTime*.7+vWave*22.0+n*2.0)*.5+.5; float shine=pow(band,16.0)*.38; float moon=pow(max(0.0,1.0-abs(vUv.x-.5)*3.2),3.0)*.06; vec3 col=mix(uTint,vec3(.88,.82,.70),shine+moon); gl_FragColor=vec4(col,.68); }`
    }));
    water.rotation.x = -Math.PI / 2; water.position.set(0, -0.015, -45);
    scene.add(water);

    // Floating dust and pale petals.
    const count = 520;
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - .5) * 10.5;
      pos[i * 3 + 1] = .35 + Math.random() * 4.8;
      pos[i * 3 + 2] = 10 - Math.random() * 118;
      seed[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xfbf4e6, size: .035, transparent: true, opacity: .48, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(dust);

    // Oval afterimage room at the end of the route.
    pano.mapping = THREE.UVMapping;
    const room = new THREE.Mesh(new THREE.SphereGeometry(13.5, 48, 24), new THREE.MeshBasicMaterial({ map: pano, side: THREE.BackSide, toneMapped: false }));
    room.position.set(0, 1.5, -101);
    room.scale.set(1.12, .72, 1.12);
    scene.add(room);
    const roomLight = new THREE.PointLight(0xffe0ad, 3.5, 22, 1.6);
    roomLight.position.set(0, 3.6, -101); scene.add(roomLight);

    scene.userData.water = water;
    scene.userData.dust = dust;
    scene.userData.room = room;
    onReady && onReady(true);
    return true;
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let hovered = -1;
  let focusIndex = null;
  let progress = 0, progressTarget = 0;
  const clock = new THREE.Clock();
  const keyframes = [
    { z: 10, y: 1.72, x: 0, lz: -10, ly: 1.8, lx: 0 },
    { z: -12, y: 1.7, x: 0, lz: -25, ly: 1.82, lx: 0 },
    { z: -34, y: 1.64, x: .2, lz: -48, ly: 1.86, lx: 0 },
    { z: -56, y: 1.74, x: -.2, lz: -70, ly: 1.8, lx: 0 },
    { z: -78, y: 1.8, x: .15, lz: -94, ly: 1.88, lx: 0 },
    { z: -93, y: 1.82, x: 0, lz: -101, ly: 1.75, lx: 0 },
    { z: -101, y: 1.76, x: 0, lz: -114, ly: 1.7, lx: 1.6 }
  ];
  const posA = new THREE.Vector3(), posB = new THREE.Vector3(), lookA = new THREE.Vector3(), lookB = new THREE.Vector3(), goal = new THREE.Vector3(), lookGoal = new THREE.Vector3();

  function pathAt(t) {
    const scaled = clamp(t) * (keyframes.length - 1);
    const i = Math.min(keyframes.length - 2, Math.floor(scaled));
    const f = smooth(scaled - i);
    const a = keyframes[i], b = keyframes[i + 1];
    posA.set(a.x, a.y, a.z); posB.set(b.x, b.y, b.z);
    lookA.set(a.lx, a.ly, a.lz); lookB.set(b.lx, b.ly, b.lz);
    goal.lerpVectors(posA, posB, f);
    lookGoal.lerpVectors(lookA, lookB, f);
  }

  function setHover(index) {
    if (index === hovered) return;
    hovered = index;
    document.body.dataset.hovered = index >= 0 ? works[index].title : 'none';
    onHover && onHover(index);
  }

  addEventListener('pointermove', e => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    pointer.x = mouse.x; pointer.y = mouse.y;
    if (document.body.dataset.end === '1' || document.body.classList.contains('interlude-active') || document.body.dataset.view === 'painting') { setHover(-1); return; }
    if (e.target !== canvas) { setHover(-1); return; }
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(paintingMeshes, false)[0];
    setHover(hit ? hit.object.userData.index : -1);
  }, { passive: true });

  canvas.addEventListener('click', () => {
    if (hovered >= 0 && document.body.dataset.view !== 'painting') {
      focus(hovered); onOpen && onOpen(hovered);
    }
  });

  function focus(index) {
    focusIndex = clamp(index, 0, works.length - 1) | 0;
    setHover(-1);
  }
  function release() { focusIndex = null; }

  function render() {
    const dt = Math.min(.05, clock.getDelta());
    const time = clock.elapsedTime;
    progress += (progressTarget - progress) * (1 - Math.exp(-dt * 5.4));
    if (doorPlane) {
      const fade = 1 - smooth(clamp(progress / .16));
      doorPlane.material.opacity = .96 * fade;
      doorPlane.visible = fade > .01;
    }
    mouse.sx += (mouse.x - mouse.sx) * .06;
    mouse.sy += (mouse.y - mouse.sy) * .06;

    if (scene.userData.water) scene.userData.water.material.uniforms.uTime.value = time;
    if (scene.userData.dust) {
      const p = scene.userData.dust.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 3) {
        p.array[i * 3 + 1] += Math.sin(time * .4 + i) * .0007;
        p.array[i * 3] += Math.cos(time * .25 + i * .7) * .0005;
      }
      p.needsUpdate = true;
      scene.userData.dust.rotation.y = Math.sin(time * .07) * .008;
    }
    if (scene.userData.room) scene.userData.room.rotation.y = Math.sin(time * .055) * .045;

    pathAt(progress);
    goal.x += mouse.sx * .26; goal.y += mouse.sy * .11 + Math.sin(time * .45) * .018;
    lookGoal.x += mouse.sx * .16; lookGoal.y += mouse.sy * .07;

    if (focusIndex !== null && paintings[focusIndex]) {
      const p = paintings[focusIndex];
      const side = p.userData.side;
      const fp = new THREE.Vector3(side * 2.75, 2.26, p.userData.z + 2.7);
      const fl = new THREE.Vector3(side * 5.92, 2.32, p.userData.z);
      camera.position.lerp(fp, 1 - Math.exp(-dt * 4.2));
      currentLook.lerp(fl, 1 - Math.exp(-dt * 4.2));
    } else {
      camera.position.lerp(goal, 1 - Math.exp(-dt * (focusIndex === null ? 3.2 : 5)));
      currentLook.lerp(lookGoal, 1 - Math.exp(-dt * 3.6));
    }
    camera.lookAt(currentLook);

    if (onLabels && paintingMeshes.length) {
      const labels = paintingMeshes.map((mesh, i) => {
        const world = new THREE.Vector3(); mesh.getWorldPosition(world);
        const dist = camera.position.distanceTo(world);
        const proj = world.clone().project(camera);
        let opacity = 0;
        if (proj.z < 1 && dist > 6 && dist < 18 && progress < .87 && document.body.dataset.view !== 'painting') {
          opacity = clamp((18 - dist) / 7) * clamp((dist - 6) / 2.5);
        }
        return { index: i, x: (proj.x * .5 + .5) * innerWidth, y: (-proj.y * .5 + .5) * innerHeight, opacity, side: paintings[i].userData.side };
      });
      onLabels(labels);
    }

    renderer.render(scene, camera);
    onFrame && onFrame({ progress, cameraZ: camera.position.z, hovered });
  }
  renderer.setAnimationLoop(render);

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
    renderer.setSize(innerWidth, innerHeight, false);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clock.stop(); else clock.start();
  });

  window.__noorScene = { camera, scene, renderer, release, focus, get progress() { return progress; } };
  return {
    ready,
    setProgress(t) { progressTarget = clamp(t); },
    focus,
    release,
    get hovered() { return hovered; },
    camera,
    fallback: false
  };
}
