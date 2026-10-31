import * as THREE from 'three';

const TAU = Math.PI * 2;
const DURATION = 120;
const canvas = document.querySelector('#space');
const context = canvas.getContext('2d', { alpha: true });
const portal = document.querySelector('#portal');
const planetCanvas = document.querySelector('#planet-system');
const cursor = document.querySelector('#cursor');
const gravityTrigger = document.querySelector('#gravity-trigger');
const gravityNote = document.querySelector('#gravity-note');
const exploreView = document.querySelector('#explore-view');
const resetView = document.querySelector('#reset-view');
const titleLines = [...document.querySelectorAll('.title-line')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const captureMode = new URLSearchParams(window.location.search).has('capture');
if (captureMode) document.documentElement.classList.add('capture-mode');

let seed = 73921;
function random() {
  seed |= 0;
  seed = (seed + 0x6D2B79F5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

let width = 0;
let height = 0;
let stars = [];
let frame = 0;
let frozen = false;
let startTime = 0;
let pointerX = 0;
let pointerY = 0;
let cursorX = 0;
let cursorY = 0;
let currentX = 0;
let currentY = 0;
let gravityDirection = 1;
let gravitySpeed = 1;
let orbitalPhase = 0;
let lastAnimationTime = 0;
let gravityTransition = null;
let gravityClicks = 0;
let gravityClickTimer = 0;
let exploring = false;
let viewYaw = 0;
let viewPitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let cameraDistance = 7.4;
let targetDistance = 7.4;
let dragDistance = 0;
const activePointers = new Map();
let pinchDistance = 0;

function scrambleTitles() {
  if (reducedMotion.matches || captureMode) return;
  const glyphs = '∆ØΛΞ§/\\01_';
  titleLines.forEach((line, lineIndex) => {
    const original = line.dataset.text;
    line.innerHTML = [...original].map((character) => `<span class="glyph">${character}</span>`).join('');
    const letters = [...line.querySelectorAll('.glyph')];
    letters.forEach((letter, index) => {
      window.setTimeout(() => {
        letter.textContent = glyphs[(index * 3 + lineIndex) % glyphs.length];
      }, 100 + index * 42);
      window.setTimeout(() => {
        letter.textContent = original[index];
      }, 410 + index * 64);
    });
    window.setTimeout(() => line.classList.add('is-glitching'), 260 + lineIndex * 100);
    window.setTimeout(() => line.classList.remove('is-glitching'), 850 + lineIndex * 100);
  });
}

function pulseGlitch() {
  if (reducedMotion.matches || captureMode) return;
  titleLines.forEach((line, index) => {
    window.setTimeout(() => line.classList.add('is-glitching'), index * 70);
    window.setTimeout(() => line.classList.remove('is-glitching'), 330 + index * 70);
  });
}

function activateGravity() {
  window.clearTimeout(gravityClickTimer);
  gravityClicks += 1;
  gravityNote.textContent = gravityClicks < 3 ? `GRAVITY / SIGNAL 0${gravityClicks}` : 'GRAVITY / REVERSED';
  if (gravityClicks === 3) {
    gravityClicks = 0;
    const now = performance.now();
    gravityTransition = {
      start: now,
      from: gravitySpeed,
      to: gravityDirection * -1,
      progress: 0,
    };
    gravityNote.textContent = 'GRAVITY / DECAYING';
  }
  gravityClickTimer = window.setTimeout(() => {
    gravityClicks = 0;
    gravityNote.textContent = gravityDirection === -1 ? 'GRAVITY / REVERSED' : 'GRAVITY / NOMINAL';
  }, 1300);
}

function updateExploreUI() {
  document.body.classList.toggle('is-exploring', exploring);
  exploreView.setAttribute('aria-pressed', String(exploring));
  exploreView.textContent = exploring ? 'EXIT VIEW / 退出环视' : 'ORBIT VIEW / 环视星系';
  gravityTrigger.setAttribute('aria-label', exploring
    ? '拖动环视星系，滚轮或双指缩放，方向键旋转，加减键缩放'
    : '星团：连续激活三次可反转引力');
  gravityNote.textContent = exploring
    ? (finePointer.matches ? 'DRAG TO ORBIT / SCROLL TO ZOOM' : 'DRAG TO ORBIT / PINCH TO ZOOM')
    : 'GRAVITY / NOMINAL';
}

function setExploring(value) {
  exploring = value;
  activePointers.clear();
  gravityTrigger.classList.remove('is-dragging');
  updateExploreUI();
}

function resetObservation() {
  targetYaw = 0;
  targetPitch = 0;
  targetDistance = 7.4;
  gravityNote.textContent = exploring ? 'VIEW / RECENTERING' : 'GRAVITY / NOMINAL';
}

exploreView.addEventListener('click', () => setExploring(!exploring));
resetView.addEventListener('click', resetObservation);

gravityTrigger.addEventListener('click', () => {
  if (!exploring && dragDistance < 6) activateGravity();
});
gravityTrigger.addEventListener('keydown', (event) => {
  if (!exploring && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    activateGravity();
    return;
  }
  if (!exploring) return;
  const rotations = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
  if (rotations[event.key]) {
    event.preventDefault();
    targetYaw += rotations[event.key][0];
    targetPitch = THREE.MathUtils.clamp(targetPitch + rotations[event.key][1], -1.35, 1.35);
  } else if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    targetDistance = Math.max(4.6, targetDistance - 0.45);
  } else if (event.key === '-') {
    event.preventDefault();
    targetDistance = Math.min(11, targetDistance + 0.45);
  } else if (event.key === 'Escape') {
    setExploring(false);
  }
});

gravityTrigger.addEventListener('pointerdown', (event) => {
  if (!exploring) return;
  event.preventDefault();
  gravityTrigger.setPointerCapture(event.pointerId);
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  dragDistance = 0;
  gravityTrigger.classList.add('is-dragging');
  if (activePointers.size === 2) {
    const [a, b] = [...activePointers.values()];
    pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
  }
});

gravityTrigger.addEventListener('pointermove', (event) => {
  if (!exploring || !activePointers.has(event.pointerId)) return;
  const previous = activePointers.get(event.pointerId);
  const dx = event.clientX - previous.x;
  const dy = event.clientY - previous.y;
  dragDistance += Math.abs(dx) + Math.abs(dy);
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (activePointers.size === 2) {
    const [a, b] = [...activePointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDistance > 0) targetDistance = THREE.MathUtils.clamp(targetDistance * (pinchDistance / distance), 4.6, 11);
    pinchDistance = distance;
  } else {
    targetYaw += dx * 0.008;
    targetPitch = THREE.MathUtils.clamp(targetPitch + dy * 0.006, -1.35, 1.35);
  }
});

function releasePointer(event) {
  activePointers.delete(event.pointerId);
  pinchDistance = 0;
  if (activePointers.size === 0) gravityTrigger.classList.remove('is-dragging');
}
gravityTrigger.addEventListener('pointerup', releasePointer);
gravityTrigger.addEventListener('pointercancel', releasePointer);

gravityTrigger.addEventListener('wheel', (event) => {
  if (!exploring) return;
  event.preventDefault();
  targetDistance = THREE.MathUtils.clamp(targetDistance + event.deltaY * 0.004, 4.6, 11);
}, { passive: false });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && exploring) setExploring(false);
});

function createStarSprite(stops) {
  const size = 64;
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach((stop, index) => gradient.addColorStop(index / (stops.length - 1), stop));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

// Cached halos keep the twinkling stars cheap: one drawImage instead of a per-frame gradient.
const starHalos = {
  cool: createStarSprite([
    'rgba(255,255,255,1)',
    'rgba(249,250,250,0.72)',
    'rgba(206,220,242,0.16)',
    'rgba(206,220,242,0.05)',
    'rgba(206,220,242,0)',
  ]),
  warm: createStarSprite([
    'rgba(255,222,180,1)',
    'rgba(238,152,51,0.7)',
    'rgba(238,152,51,0.16)',
    'rgba(238,152,51,0.04)',
    'rgba(238,152,51,0)',
  ]),
};

function createStars() {
  seed = 73921;
  const count = Math.min(240, Math.round((width * height) / 5200));
  const haloCount = Math.max(6, Math.round(count / 9));
  stars = Array.from({ length: count }, (_, index) => {
    // depth drives both size and parallax, so the sky reads as layered
    const depth = random();
    const bright = index < haloCount;
    const dust = !bright && depth < 0.34;
    const warm = index % 19 === 0;
    return {
      x: random() * width,
      y: random() * height,
      radius: bright ? 1.15 + random() * 0.85 : dust ? 0.3 + random() * 0.28 : 0.55 + random() * 0.75,
      alpha: bright ? 0.86 + random() * 0.14 : dust ? 0.24 + random() * 0.26 : 0.44 + random() * 0.42,
      phase: random() * TAU,
      speed: 0.34 + random() * 1.5,
      // how far this star sinks on its dim half of the cycle: bigger = closer to going out
      flicker: 0.36 + random() * 0.54,
      depth,
      warm,
      halo: bright,
    };
  });
}

function drawStars(time) {
  context.clearRect(0, 0, width, height);
  for (const star of stars) {
    // Two detuned sines keep the cycle from looking like a metronome.
    const wave =
      Math.sin(time * star.speed + star.phase) * 0.74 +
      Math.sin(time * star.speed * 2.41 + star.phase * 1.73) * 0.26;
    const bright = Math.pow((wave + 1) * 0.5, 1.55);
    const shimmer = 1 - star.flicker + star.flicker * bright;
    const alpha = Math.min(1, star.alpha * shimmer + (star.halo ? 0.14 * bright : 0));
    const drift = 0.6 + star.depth * 2.4;
    const x = star.x + pointerX * drift;
    const y = star.y + pointerY * drift;

    if (star.halo) {
      const halo = star.radius * 11 * (0.55 + 0.8 * shimmer);
      context.globalAlpha = Math.min(0.9, alpha * 0.9);
      context.drawImage(star.warm ? starHalos.warm : starHalos.cool, x - halo / 2, y - halo / 2, halo, halo);
      context.globalAlpha = 1;
    }

    context.beginPath();
    context.arc(x, y, star.radius * (star.halo ? 1.3 : 1), 0, TAU);
    context.fillStyle = star.warm
      ? `rgba(238, 152, 51, ${alpha})`
      : `rgba(249, 250, 250, ${alpha})`;
    context.fill();
  }
}

function hash3(x, y, z) {
  const value = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return value - Math.floor(value);
}

function noise3(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const lerp = THREE.MathUtils.lerp;
  const a = lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux);
  const b = lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux);
  const c = lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux);
  const d = lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux);
  return lerp(lerp(a, b, uy), lerp(c, d, uy), uz);
}

function fbm3(x, y, z, octaves = 6) {
  let value = 0;
  let amplitude = 0.53;
  let frequency = 1;
  for (let i = 0; i < octaves; i += 1) {
    value += noise3(x * frequency, y * frequency, z * frequency) * amplitude;
    frequency *= 2.07;
    amplitude *= 0.48;
  }
  return value;
}

const dreamNoiseGLSL = `
  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3d(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z
    );
  }
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.53;
    for (int i = 0; i < 5; i++) {
      value += noise3d(p) * amplitude;
      p = p * 2.03 + vec3(7.1, 3.8, 5.4);
      amplitude *= 0.48;
    }
    return value;
  }
`;

function makeDreamPlanetMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vLocal = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      ${dreamNoiseGLSL}
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 p = normalize(vLocal);
        float warp = fbm(p * 2.15 + vec3(2.7, 8.1, 1.4));
        vec3 q = p * 3.6 + vec3(warp * 1.7, warp * 0.7, -warp * 1.2);
        float mist = fbm(q);
        float veil = fbm(p * 8.0 + warp * 2.4);
        float density = smoothstep(0.19, 0.86, mist * 0.78 + veil * 0.22);
        vec3 deep = vec3(0.115, 0.205, 0.265);
        vec3 blue = vec3(0.285, 0.445, 0.505);
        vec3 pearl = vec3(0.62, 0.68, 0.675);
        vec3 lilac = vec3(0.48, 0.455, 0.555);
        vec3 color = mix(deep, blue, smoothstep(0.12, 0.65, density));
        color = mix(color, pearl, smoothstep(0.53, 0.91, density) * 0.74);
        color = mix(color, lilac, smoothstep(0.55, 0.85, warp) * 0.26);
        float diffuse = max(dot(normalize(vNormal), normalize(vec3(-0.55, 0.38, 0.82))), 0.0);
        float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
        color *= 0.55 + diffuse * 0.52;
        color += vec3(0.10, 0.16, 0.19) * pow(1.0 - facing, 3.0) * 0.42;
        color += (veil - 0.5) * 0.035;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

function makeDreamCloudMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vLocal = position;
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      ${dreamNoiseGLSL}
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 p = normalize(vLocal);
        float curl = fbm(p * 2.8 + vec3(9.0, 2.0, 5.0));
        float cloud = fbm(p * 5.5 + curl * 2.8);
        float facing = max(dot(normalize(vNormal), normalize(vView)), 0.0);
        float rim = pow(1.0 - facing, 2.5);
        float alpha = smoothstep(0.47, 0.77, cloud) * 0.16 + rim * 0.055;
        vec3 color = mix(vec3(0.56, 0.72, 0.75), vec3(0.72, 0.66, 0.77), curl);
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });
}

const renderer = new THREE.WebGLRenderer({ canvas: planetCanvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setClearColor(0x000000, 0);

const world = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
camera.position.set(0, 0.25, 7.4);
camera.lookAt(0, 0, 0);

const system = new THREE.Group();
system.rotation.z = -0.16;
world.add(system);

const keyLight = new THREE.DirectionalLight(0xfff1d8, 2.45);
keyLight.position.set(-3.5, 2.5, 4.5);
world.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x91b9cf, 0.85);
rimLight.position.set(3, -1, -2);
world.add(rimLight);
world.add(new THREE.AmbientLight(0x71808a, 0.65));

function makeClusterStars({ count, spread, seedOffset, opacity }) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const strengths = new Float32Array(count);
  const palette = [
    new THREE.Color(0x9fc8d4),
    new THREE.Color(0xd9e2df),
    new THREE.Color(0xb9accb),
    new THREE.Color(0x6f9eb3),
  ];
  for (let index = 0; index < count; index += 1) {
    const angle = random() * TAU;
    const cosine = random() * 2 - 1;
    const radial = Math.pow(random(), 1.18);
    const planar = Math.sqrt(1 - cosine * cosine);
    const arm = Math.sin(angle * 3 + radial * 5.5) * 0.09 * radial;
    const x = Math.cos(angle + arm) * planar * radial;
    const y = cosine * radial;
    const z = Math.sin(angle + arm) * planar * radial;
    const knot = 1 + Math.sin(angle * 4 + seedOffset) * 0.12;
    positions[index * 3] = x * spread.x * knot;
    positions[index * 3 + 1] = y * spread.y + Math.sin(x * 5 + seedOffset) * 0.055;
    positions[index * 3 + 2] = z * spread.z;
    const color = palette[Math.floor(random() * palette.length)];
    const luminosity = 0.62 + random() * 0.38;
    colors[index * 3] = color.r * luminosity;
    colors[index * 3 + 1] = color.g * luminosity;
    colors[index * 3 + 2] = color.b * luminosity;
    const bright = random() > 0.996;
    sizes[index] = bright ? 4.8 + random() * 1.8 : 1.35 + Math.pow(random(), 2.2) * 3.1;
    strengths[index] = (bright ? 0.68 : 0.24 + random() * 0.5) * opacity * (1 - Math.exp(-radial * 5) * 0.5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aStrength', new THREE.BufferAttribute(strengths, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.5) } },
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute float aStrength;
      varying vec3 vColor;
      varying float vStrength;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vStrength = aStrength;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * uPixelRatio * (6.4 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vStrength;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float glow = exp(-d * d * 6.5);
        float core = exp(-d * d * 55.0) * 0.35;
        float edge = smoothstep(1.0, 0.72, d);
        gl_FragColor = vec4(vColor, (glow + core) * edge * vStrength);
      }
    `,
  });
  return new THREE.Points(geometry, material);
}

const planet = new THREE.Group();
planet.rotation.z = -0.19;
const clusterHaloTexture = makeHaloTexture();
const clusterHaze = [
  { position: [-0.42, 0.18, -0.3], scale: 3.1, color: 0x587f94, opacity: 0.15 },
  { position: [0.48, -0.22, -0.42], scale: 2.65, color: 0x8c7e9f, opacity: 0.11 },
  { position: [0.08, 0.5, -0.55], scale: 2.1, color: 0xa8c5c9, opacity: 0.075 },
  { position: [0.18, -0.1, -0.65], scale: 3.5, color: 0x416477, opacity: 0.075 },
  { position: [-0.08, 0.04, -0.72], scale: 1.75, color: 0x769cac, opacity: 0.1 },
];
for (const haze of clusterHaze) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: clusterHaloTexture,
    color: haze.color,
    transparent: true,
    opacity: haze.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  sprite.position.set(...haze.position);
  sprite.scale.setScalar(haze.scale);
  planet.add(sprite);
}
planet.add(makeClusterStars({
  count: 2800,
  spread: new THREE.Vector3(1.34, 1.08, 0.94),
  seedOffset: 2.7,
  opacity: 0.86,
}));
system.add(planet);

const cloudVeil = new THREE.Group();
cloudVeil.rotation.z = 0.12;
cloudVeil.add(makeClusterStars({
  count: 360,
  spread: new THREE.Vector3(1.52, 1.2, 1.02),
  seedOffset: 7.4,
  opacity: 0.3,
}));
system.add(cloudVeil);

function createOrbit(radius, tiltX, tiltZ) {
  const group = new THREE.Group();
  group.rotation.x = tiltX;
  group.rotation.z = tiltZ;
  const points = Array.from({ length: 181 }, (_, index) => {
    const angle = (index / 180) * TAU;
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  });
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: 0xa9c3df, transparent: true, opacity: 0.17 }),
  );
  group.add(line);
  system.add(group);
  return group;
}

function makeHaloTexture() {
  const haloCanvas = document.createElement('canvas');
  haloCanvas.width = haloCanvas.height = 128;
  const ctx = haloCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,0.72)');
  gradient.addColorStop(0.12, 'rgba(255,255,255,0.42)');
  gradient.addColorStop(0.38, 'rgba(255,255,255,0.13)');
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.035)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(haloCanvas);
}

const haloTexture = makeHaloTexture();

function addHalo(group, color, size, opacity) {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTexture,
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }));
  halo.scale.setScalar(size);
  group.add(halo);
  return halo;
}

function makeVeilMaterial(color, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vLocal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vLocal = position;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vPosition = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vLocal;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(-vPosition)));
        float rim = pow(1.0 - facing, 2.7);
        float gauze = 0.72 + 0.28 * sin(vLocal.y * 43.0 + sin(vLocal.x * 31.0) * 1.8);
        float alpha = (rim * 0.62 + pow(facing, 3.0) * 0.075) * gauze * uOpacity;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
  });
}

function makeGauzeMaterial(color, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - 0.5) * 2.0;
        float r = length(p);
        float angle = atan(p.y, p.x);
        float band = exp(-pow((r - 0.58) / 0.115, 2.0));
        float threads = 0.42 + 0.30 * sin(angle * 7.0 + r * 19.0) + 0.18 * sin(angle * 13.0 - r * 27.0);
        float feather = smoothstep(1.0, 0.68, r);
        gl_FragColor = vec4(uColor, band * threads * feather * uOpacity);
      }
    `,
  });
}

function makeLightTrail(color, length) {
  const count = 44;
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const alphas = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    const progress = index / (count - 1);
    positions[index * 3] = -progress * length;
    positions[index * 3 + 1] = (random() - 0.5) * 0.075 * progress;
    positions[index * 3 + 2] = (random() - 0.5) * 0.09 * progress;
    scales[index] = 0.25 + random() * 0.75;
    alphas[index] = (1 - progress) * (0.35 + random() * 0.65);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aScale;
      attribute float aAlpha;
      varying float vAlpha;
      void main() {
        vAlpha = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (4.0 + aScale * 9.0) * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float soft = exp(-d * d * 3.8) * smoothstep(1.0, 0.55, d);
        gl_FragColor = vec4(uColor, soft * vAlpha * 0.38);
      }
    `,
  });
  return new THREE.Points(geometry, material);
}

const moonSpecs = [
  { kind: 'mist', radius: 1.9, size: 0.13, cycles: 3, spin: 1, phase: 0.08, tiltX: 0.3, tiltZ: 0.15, color: 0xa9d7df },
  { kind: 'veil', radius: 2.18, size: 0.15, cycles: 4, spin: 1, phase: 0.42, tiltX: -0.48, tiltZ: -0.32, color: 0xc4b9d5 },
  { kind: 'gauze', radius: 2.45, size: 0.12, cycles: 5, spin: 1, phase: 0.68, tiltX: 0.72, tiltZ: 0.45, color: 0xe0d4bd },
  { kind: 'drift', radius: 2.66, size: 0.105, cycles: 7, spin: 1, phase: 0.86, tiltX: -0.2, tiltZ: 0.7, color: 0x9fc8d7 },
];
const moons = moonSpecs.map((spec, moonIndex) => {
  const orbit = createOrbit(spec.radius, spec.tiltX, spec.tiltZ);
  const vessel = new THREE.Group();
  const moon = new THREE.Group();
  const halo = addHalo(moon, spec.color, spec.size * 5.2, spec.kind === 'gauze' ? 0.3 : 0.44);
  addHalo(moon, 0xf1eee5, spec.size * 1.25, 0.26);

  if (spec.kind === 'mist' || spec.kind === 'veil') {
    const veil = new THREE.Mesh(
      new THREE.SphereGeometry(spec.size, 40, 28),
      makeVeilMaterial(spec.color, spec.kind === 'mist' ? 0.68 : 0.82),
    );
    moon.add(veil);
    if (spec.kind === 'veil') {
      veil.scale.set(0.86, 1.14, 0.92);
      const innerVeil = new THREE.Mesh(
        new THREE.SphereGeometry(spec.size * 0.73, 32, 24),
        makeVeilMaterial(0xe5dce9, 0.42),
      );
      innerVeil.rotation.set(0.4, 0.7, -0.3);
      moon.add(innerVeil);
    }
  }

  if (spec.kind === 'gauze' || spec.kind === 'veil') {
    const ribbonCount = spec.kind === 'gauze' ? 3 : 1;
    for (let index = 0; index < ribbonCount; index += 1) {
      const ribbon = new THREE.Mesh(
        new THREE.PlaneGeometry(spec.size * (4.7 - index * 0.45), spec.size * (4.7 - index * 0.45)),
        makeGauzeMaterial(spec.color, 0.34 - index * 0.055),
      );
      ribbon.rotation.set(0.68 + index * 0.31, 0.2 + index * 0.44, moonIndex * 0.4 + index * 0.7);
      moon.add(ribbon);
    }
  }

  if (spec.kind === 'drift') {
    moon.add(makeLightTrail(spec.color, 0.82));
    addHalo(moon, 0xe5f1f1, spec.size * 1.7, 0.42);
  }

  vessel.add(moon);
  orbit.add(vessel);
  return { ...spec, vessel, moon, halo };
});

function resizePlanet() {
  const size = Math.max(1, Math.round(portal.getBoundingClientRect().width));
  renderer.setSize(size, size, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}

function renderScene(time) {
  const t = ((time % DURATION) + DURATION) % DURATION;
  const phase = t / DURATION;
  const loopPhase = ((orbitalPhase % 1) + 1) % 1;
  planet.rotation.y = loopPhase * TAU * 2;
  cloudVeil.rotation.y = loopPhase * TAU;
  viewYaw += (targetYaw - viewYaw) * 0.14;
  viewPitch += (targetPitch - viewPitch) * 0.14;
  cameraDistance += (targetDistance - cameraDistance) * 0.12;
  camera.position.z = cameraDistance;
  system.rotation.y = viewYaw + (exploring ? 0 : pointerX * 0.065);
  system.rotation.x = viewPitch + (exploring ? 0 : pointerY * 0.035);
  for (const [index, spec] of moons.entries()) {
    const angle = (loopPhase * spec.cycles + spec.phase) * TAU;
    const drift = Math.sin(phase * TAU * (index + 2) + spec.phase * TAU);
    spec.vessel.position.set(
      Math.cos(angle) * spec.radius,
      drift * (0.045 + index * 0.009),
      Math.sin(angle) * spec.radius,
    );
    const breath = 1 + Math.sin(phase * TAU * (index + 3) + spec.phase * TAU) * 0.075;
    spec.moon.scale.setScalar(breath);
    spec.moon.rotation.y = spec.kind === 'drift'
      ? -angle - Math.PI / 2
      : loopPhase * TAU * spec.spin;
    spec.moon.rotation.x = Math.sin(phase * TAU * 2 + index) * 0.12;
    spec.moon.rotation.z = Math.cos(phase * TAU * (index + 1) + spec.phase * TAU) * 0.09;
    spec.halo.material.opacity = (spec.kind === 'gauze' ? 0.3 : 0.44) * (0.88 + drift * 0.12);
  }
  renderer.render(world, camera);
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  createStars();
  resizePlanet();
  drawStars(0);
  renderScene(0);
}

function updateGravity(now, delta) {
  if (gravityTransition) {
    const transition = gravityTransition;
    const duration = transition.to < 0 ? 1800 : 1500;
    const raw = Math.min(1, (now - transition.start) / duration);
    const eased = raw * raw * (3 - 2 * raw);
    gravitySpeed = THREE.MathUtils.lerp(transition.from, transition.to, eased);
    transition.progress = raw;
    if (gravitySpeed * transition.to < 0.12 && gravityNote.textContent !== 'GRAVITY / INVERTING') {
      gravityNote.textContent = 'GRAVITY / INVERTING';
    }
    if (raw >= 1) {
      gravityDirection = Math.sign(transition.to);
      gravitySpeed = gravityDirection;
      gravityTransition = null;
      document.body.classList.toggle('gravity-reversed', gravityDirection === -1);
      gravityNote.textContent = gravityDirection === -1 ? 'GRAVITY / REVERSED' : 'GRAVITY / RESTORED';
      pulseGlitch();
    }
  }
  orbitalPhase += (delta / DURATION) * gravitySpeed;
}

function animate(timestamp) {
  if (frozen) return;
  const delta = lastAnimationTime ? Math.min(0.06, (timestamp - lastAnimationTime) / 1000) : 0;
  lastAnimationTime = timestamp;
  updateGravity(timestamp, delta);
  const time = (timestamp - startTime) / 1000;
  drawStars(time);
  renderScene(time);
  if (finePointer.matches) {
    currentX += (cursorX - currentX) * 0.2;
    currentY += (cursorY - currentY) * 0.2;
    cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
  frame = requestAnimationFrame(animate);
}

function syncMotion() {
  cancelAnimationFrame(frame);
  frozen = reducedMotion.matches || captureMode;
  if (frozen) {
    drawStars(0);
    renderScene(0);
  } else {
    startTime = performance.now();
    lastAnimationTime = 0;
    frame = requestAnimationFrame(animate);
  }
}

window.addEventListener('pointermove', (event) => {
  pointerX = (event.clientX / width - 0.5) * 2;
  pointerY = (event.clientY / height - 0.5) * 2;
  cursorX = event.clientX;
  cursorY = event.clientY;
  if (finePointer.matches && !reducedMotion.matches) {
    cursor.classList.add('is-visible');
    portal.style.setProperty('--portal-x', `${pointerX * 7}px`);
    portal.style.setProperty('--portal-y', `${pointerY * 7}px`);
  }
}, { passive: true });

document.documentElement.addEventListener('mouseleave', () => {
  cursor.classList.remove('is-visible');
  pointerX = 0;
  pointerY = 0;
  portal.style.setProperty('--portal-x', '0px');
  portal.style.setProperty('--portal-y', '0px');
});

function getBlogTheme() {
  try {
    const saved = window.sessionStorage.getItem('Argon_Enable_Dark_Mode');
    if (saved === 'true') return 'dark';
    if (saved === 'false') return 'light';
  } catch {}
  const hour = new Date().getHours();
  return hour < 7 || hour >= 22 ? 'dark' : 'light';
}

// The quiz site switches theme on 06:00–18:59 = day, matching theme-init.js there.
function getQuizTheme() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 19 ? 'light' : 'dark';
}

const entryLinks = [...document.querySelectorAll('.enter')];
const entryLabels = new Map(entryLinks.map((link) => [link, link.getAttribute('aria-label')]));
const warmEntries = new Set();

function entryTheme(link) {
  return link.dataset.entry === 'quiz' ? getQuizTheme() : getBlogTheme();
}

function entryDestination(link) {
  const destination = new URL(link.href, window.location.href);
  destination.searchParams.set('from', 'portal');
  destination.searchParams.set('theme', entryTheme(link));
  return destination;
}

function warmEntry(link) {
  if (warmEntries.has(link)) return;
  warmEntries.add(link);
  const destination = entryDestination(link);
  const dns = document.createElement('link');
  dns.rel = 'dns-prefetch';
  dns.href = destination.origin;
  const preconnect = document.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = destination.origin;
  document.head.append(dns, preconnect);
  // Prerendering is only reliable for same-document navigations on our own origin.
  if (link.dataset.entry === 'blog') {
    const prerender = document.createElement('link');
    prerender.id = 'blog-prerender';
    prerender.rel = 'prerender';
    prerender.href = destination.href;
    document.head.appendChild(prerender);
  }
}

entryLinks.forEach((link) => {
  link.addEventListener('pointerenter', () => warmEntry(link), { once: true });
  link.addEventListener('focus', () => warmEntry(link), { once: true });
  link.addEventListener('touchstart', () => warmEntry(link), { once: true, passive: true });

  link.addEventListener('click', (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (document.body.classList.contains('is-leaving')) return;
    const theme = entryTheme(link);
    const destination = entryDestination(link);
    document.body.dataset.theme = theme;
    document.body.classList.add('is-leaving');
    link.setAttribute('aria-label', link.dataset.entry === 'quiz' ? '正在进入刷题站' : '正在进入 Still Floating 博客');
    window.setTimeout(() => {
      window.location.href = destination.href;
    }, reducedMotion.matches ? 30 : 1150);
  });
});

window.addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  document.body.classList.remove('is-leaving');
  delete document.body.dataset.theme;
  entryLinks.forEach((link) => link.setAttribute('aria-label', entryLabels.get(link)));
});

window.__seek = (time) => {
  frozen = true;
  cancelAnimationFrame(frame);
  orbitalPhase = time / DURATION;
  drawStars(time);
  renderScene(time);
  renderer.getContext().finish();
};
window.__SCENE_READY__ = true;
window.__PLANET_STATS__ = () => ({
  moons: moons.length,
  gravityDirection,
  gravitySpeed,
  orbitalPhase,
  transitionProgress: gravityTransition?.progress ?? null,
  rotation: planet.rotation.y,
  moonKinds: moons.map(({ kind }) => kind),
  moonPositions: moons.map(({ vessel }) => vessel.position.toArray()),
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  exploring,
  viewYaw,
  viewPitch,
  cameraDistance,
  targetYaw,
  targetPitch,
  targetDistance,
});

window.addEventListener('resize', resize, { passive: true });
reducedMotion.addEventListener('change', syncMotion);
resize();
scrambleTitles();
if (!reducedMotion.matches && !captureMode) {
  window.setInterval(pulseGlitch, 7600);
}
const requestedTime = Number(new URLSearchParams(window.location.search).get('t'));
if (captureMode && Number.isFinite(requestedTime)) window.__seek(requestedTime);
syncMotion();
