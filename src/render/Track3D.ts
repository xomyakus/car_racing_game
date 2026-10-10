import * as THREE from 'three';
import { HW, W, H } from '../sim/constants';
import type { Track } from '../sim/track';
import { BEND_LATER, BEND_SOON } from '../sim/sensors';
import type { SceneState } from '../sim/lab';

export type CamMode = 'top' | 'chase';

const RED = '#e2412a', PAPER = '#fffdf6', SKY = 0xbfe3f2;
const MAX_RAYS = 12;

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CarMesh extends THREE.Group {
  userData: { mats: THREE.MeshLambertMaterial[]; lights: THREE.Mesh[]; col: string | null };
}

/**
 * The 3D race track. The simulation is 2D (x, y); here x stays x, y becomes z, and height is y.
 * Scenery is built per track (and rebuilt when the track changes); cars, sensor rays and markers
 * are updated every frame from a SceneState.
 */
export class Track3D {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(40, W / H, 5, 12000);
  private world: THREE.Group | null = null;
  private track: Track | null = null;
  private overview = { pos: new THREE.Vector3(500, 840, 960), look: new THREE.Vector3(500, 0, 350) };
  private pool: CarMesh[] = [];
  private rays: { m: THREE.Mesh; d: THREE.Mesh }[] = [];
  private ring: THREE.Mesh;
  private lookDots: THREE.Mesh[] = [];
  private camPos = new THREE.Vector3();
  private camLook = new THREE.Vector3();
  private camInit = false;
  private w = 0;
  private h = 0;
  private carGeo: Record<string, THREE.BufferGeometry>;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.background = new THREE.Color(SKY);
    this.scene.fog = new THREE.Fog(SKY, 1700, 3400);
    this.carGeo = {
      body: new THREE.BoxGeometry(24, 5, 12), cab: new THREE.BoxGeometry(10, 4.5, 10), wing: new THREE.BoxGeometry(3, 1.5, 14),
      wheel: new THREE.CylinderGeometry(3.6, 3.6, 3, 12), light: new THREE.BoxGeometry(1, 2, 3),
    };
    const ray = new THREE.MeshBasicMaterial({ color: 0xf4c21c });
    const rayGeo = new THREE.BoxGeometry(1, 0.8, 1.8), dotGeo = new THREE.SphereGeometry(2.8, 10, 8);
    for (let i = 0; i < MAX_RAYS; i++) {
      const m = new THREE.Mesh(rayGeo, ray), d = new THREE.Mesh(dotGeo, ray);
      this.scene.add(m, d);
      this.rays.push({ m, d });
    }
    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(18, 22, 40).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    this.scene.add(this.ring);
    // corner look-ahead: amber dots for "bend soon", violet for "bend later"
    const soon = new THREE.MeshBasicMaterial({ color: 0xf4a21c }), later = new THREE.MeshBasicMaterial({ color: 0x8a5cf0 });
    const lookGeo = new THREE.CylinderGeometry(4, 4, 1, 16);
    for (let s = BEND_SOON[0] + 2; s <= BEND_LATER[1]; s += 3) {
      const m = new THREE.Mesh(lookGeo, s <= BEND_SOON[1] ? soon : later);
      m.userData.s = s;
      this.lookDots.push(m);
      this.scene.add(m);
    }
  }

  /** Throw away the old scenery and build the scenery for `track`. */
  private setTrack(track: Track) {
    if (this.world) { this.scene.remove(this.world); disposeTree(this.world); }
    this.track = track;
    this.world = buildWorld(track, this.renderer.capabilities.getMaxAnisotropy());
    this.scene.add(this.world);
    // frame the whole track; the numbers were tuned on the 930 × 570 home track
    const b = track.bounds, cx = (b.x0 + b.x1) / 2, cz = (b.y0 + b.y1) / 2;
    const k = Math.max((b.x1 - b.x0) / 950, (b.y1 - b.y0) / 580, 0.75);
    this.overview.look.set(cx, 0, cz + 20 * k);
    this.overview.pos.set(cx, 840 * k, cz + 20 * k + 610 * k);
    const fog = this.scene.fog as THREE.Fog;
    fog.near = 1700 * k; fog.far = 3400 * k;
  }

  private makeCar(): CarMesh {
    const T = THREE, CG = this.carGeo;
    const g = new T.Group() as CarMesh;
    g.rotation.order = 'YXZ';
    const bm = new T.MeshLambertMaterial({ color: 0xffffff, transparent: true });
    const cm = new T.MeshLambertMaterial({ color: 0x1d2b36, transparent: true });
    const wm = new T.MeshLambertMaterial({ color: 0x151515, transparent: true });
    const body = new T.Mesh(CG.body, bm); body.position.y = 6.2; body.castShadow = true;
    const cab = new T.Mesh(CG.cab, cm); cab.position.set(-2, 11, 0); cab.castShadow = true;
    const wing = new T.Mesh(CG.wing, bm); wing.position.set(-11, 10.5, 0); wing.castShadow = true;
    g.add(body, cab, wing);
    for (const [x, z] of [[7.5, 7], [7.5, -7], [-7.5, 7], [-7.5, -7]]) {
      const w = new T.Mesh(CG.wheel, wm); w.rotation.x = Math.PI / 2; w.position.set(x, 3.6, z); g.add(w);
    }
    const lightMat = new T.MeshBasicMaterial({ color: 0xfff6c8 });
    const lights = [4, -4].map(z => { const l = new T.Mesh(CG.light, lightMat); l.position.set(12.2, 6.5, z); g.add(l); return l; });
    g.userData = { mats: [bm, cm, wm], lights, col: null };
    this.scene.add(g);
    return g;
  }

  render(st: SceneState, cam: CamMode, el: number) {
    const cv = this.canvas, w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (w !== this.w || h !== this.h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.w = w; this.h = h;
    }
    if (st.track !== this.track) this.setTrack(st.track);
    const Z = st.track.Z;
    while (this.pool.length < st.items.length) this.pool.push(this.makeCar());
    this.pool.forEach((g, k) => {
      const it = st.items[k];
      g.visible = !!it;
      if (!it) return;
      const c = it.car, u = g.userData;
      if (u.col !== c.color) { u.mats[0].color.set(c.color); u.col = c.color; }
      for (const m of u.mats) m.opacity = it.alpha;
      for (const l of u.lights) l.visible = it.alpha > 0.9;
      g.position.set(c.x, c.track.Z[c.idx], c.y);
      g.rotation.y = -c.h;
      g.rotation.x = it.wreck ? 0.45 : 0;
    });
    const rc = st.rays;
    this.rays.forEach((r, i) => {
      const ray = rc?.spec.rays[i];
      r.m.visible = r.d.visible = !!ray;
      if (!rc || !ray) return;
      const a = rc.h + ray.angle, len = Math.max(0.1, rc.rays[i]), ca = Math.cos(a), sa = Math.sin(a), y = Z[rc.idx] + 3.5;
      r.m.scale.x = len; r.m.rotation.y = -a; r.m.position.set(rc.x + (ca * len) / 2, y, rc.y + (sa * len) / 2);
      r.d.visible = len < ray.len - 0.01; r.d.position.set(rc.x + ca * len, y, rc.y + sa * len);
    });
    this.ring.visible = !!st.ring;
    if (st.ring) this.ring.position.set(st.ring.x, Z[st.ring.idx] + 1.2, st.ring.y);
    const lk = st.look, { N, CX, CY } = st.track;
    for (const d of this.lookDots) {
      d.visible = !!lk;
      if (lk) { const i = (lk.idx + d.userData.s) % N; d.position.set(CX[i], Z[i] + 1.4, CY[i]); }
    }
    // camera: fixed overview, or chase behind the focus car; glide between targets
    const f = st.focus;
    let p: THREE.Vector3, l: THREE.Vector3;
    if (cam === 'chase' && f) {
      const ca = Math.cos(f.h), sa = Math.sin(f.h), fz = f.track.Z[f.idx];
      p = new THREE.Vector3(f.x - ca * 80, fz + 32, f.y - sa * 80);
      l = new THREE.Vector3(f.x + ca * 70, fz + 4, f.y + sa * 70);
    } else { p = this.overview.pos; l = this.overview.look; }
    if (!this.camInit) { this.camPos.copy(p); this.camLook.copy(l); this.camInit = true; }
    const k = 1 - Math.pow(0.00002, Math.min(0.1, el));
    this.camPos.lerp(p, k);
    this.camLook.lerp(l, k);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    disposeTree(this.scene);
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

function disposeTree(root: THREE.Object3D) {
  root.traverse(o => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    const mats = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const x of mats) {
      (x as THREE.MeshLambertMaterial).map?.dispose();
      x.dispose();
    }
  });
}

/** Ground, road, curbs, start gantry, bridge pillars, trees and a grandstand for one track. */
function buildWorld(track: Track, aniso: number): THREE.Group {
  const T = THREE, world = new T.Group(), { N, L, S, CX, CY, Z, TX, TY, NX, NY, LX, LY, RX, RY, bounds } = track;
  const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.y0 + bounds.y1) / 2;
  const span = Math.max(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0);
  const lambert = (o: THREE.MeshLambertMaterialParameters) => new T.MeshLambertMaterial(o);
  const tex = (w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = aniso;
    return t;
  };

  world.add(new T.HemisphereLight(0xffffff, 0x58804a, 0.78));
  const sun = new T.DirectionalLight(0xfff2dc, 0.82);
  sun.position.set(cx - 350, 900 + span * 0.3, cz - 480); sun.target.position.set(cx, 0, cz); world.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008;
  const half = span * 0.62 + 150;
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 100, far: 3000 + span });
  sun.shadow.camera.updateProjectionMatrix();
  world.add(sun);

  const gw = bounds.x1 - bounds.x0 + 1800, gd = bounds.y1 - bounds.y0 + 1600;
  const grass = tex(64, 64, (g, w, h) => { g.fillStyle = '#86bf62'; g.fillRect(0, 0, w, h); g.fillStyle = '#7db659'; g.fillRect(0, 0, w, h / 2); });
  grass.repeat.set(1, gd / 64);
  const ground = new T.Mesh(new T.PlaneGeometry(gw, gd), lambert({ map: grass }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(cx, 0, cz); ground.receiveShadow = true; world.add(ground);

  // a ribbon that follows the centerline; profile(i) gives [x, height, z, u] points across the track
  const ribbon = (profile: (i: number) => number[][], vScale: number, mat: THREE.Material) => {
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    let P = 0;
    for (let k = 0; k <= N; k++) {
      const i = k % N, prof = profile(i), v = (k === N ? L : S[i]) / vScale;
      P = prof.length;
      for (const [x, y, z, u] of prof) { pos.push(x, y + Z[i], z); uv.push(u, v); }
    }
    for (let k = 0; k < N; k++) for (let p = 0; p < P - 1; p++) {
      const a = k * P + p, b = a + 1, c = a + P, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, mat); m.receiveShadow = true; world.add(m);
    return m;
  };
  const G2 = HW + 14;
  ribbon(i => [[CX[i] + NX[i] * G2, 0.3, CY[i] + NY[i] * G2, 0], [CX[i] - NX[i] * G2, 0.3, CY[i] - NY[i] * G2, 1]], 40, lambert({ color: 0xd8cda6, side: T.DoubleSide }));
  const asphalt = tex(64, 64, (g, w, h) => {
    g.fillStyle = '#4c5359'; g.fillRect(0, 0, w, h);
    const rnd = mulberry32(3);
    for (let i = 0; i < 260; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.1)'; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
    g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(w / 2 - 1.5, 0, 3, h * 0.45);
  });
  ribbon(i => [[LX[i], 0.7, LY[i], 0], [RX[i], 0.7, RY[i], 1]], 40, lambert({ map: asphalt, side: T.DoubleSide }));
  const curb = tex(8, 64, (g, w, h) => { g.fillStyle = RED; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#ffffff'; g.fillRect(0, h / 2, w, h / 2); });
  const curbMat = lambert({ map: curb, side: T.DoubleSide });
  for (const o of [1, -1]) {
    const bx = o > 0 ? LX : RX, bz = o > 0 ? LY : RY;
    ribbon(i => {
      const ex = bx[i] + NX[i] * o * 7, ez = bz[i] + NY[i] * o * 7;
      return [[bx[i], 0.7, bz[i], 0], [bx[i], 3.2, bz[i], 0.3], [ex, 3.2, ez, 0.7], [ex, 0.3, ez, 1]];
    }, 20, curbMat);
  }

  // bridge pillars wherever the road is raised
  const pillarMat = lambert({ color: 0x9aa5a0 });
  for (let i = 0; i < N; i += 5) {
    if (Z[i] < 6) continue;
    for (const s of [-1, 1]) {
      const p = new T.Mesh(new T.BoxGeometry(5, Z[i], 5), pillarMat);
      p.position.set(CX[i] + NX[i] * s * (HW + 10), Z[i] / 2, CY[i] + NY[i] * s * (HW + 10));
      p.castShadow = true; world.add(p);
    }
  }

  // checkered start line
  const check = tex(64, 16, g => { for (let r = 0; r < 2; r++) for (let q = 0; q < 8; q++) { g.fillStyle = (r + q) % 2 ? '#111' : '#fff'; g.fillRect(q * 8, r * 8, 8, 8); } });
  check.magFilter = T.NearestFilter;
  {
    const pos: number[] = [], uv: number[] = [];
    for (const [a, b] of [[-5, -HW], [-5, HW], [5, -HW], [5, HW]]) {
      pos.push(CX[0] + TX[0] * a + NX[0] * b, Z[0] + 0.85, CY[0] + TY[0] * a + NY[0] * b);
      uv.push((b + HW) / (2 * HW), (a + 5) / 10);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex([0, 1, 2, 1, 3, 2]); g.computeVertexNormals();
    const m = new T.Mesh(g, lambert({ map: check, side: T.DoubleSide })); m.receiveShadow = true; world.add(m);
  }
  // start gantry: local x = track direction, local z = across the track
  const gantry = new T.Group();
  gantry.position.set(CX[0], Z[0], CY[0]); gantry.rotation.y = -Math.atan2(TY[0], TX[0]);
  const dark = lambert({ color: 0x1e2a24 });
  for (const s of [-1, 1]) {
    const p = new T.Mesh(new T.BoxGeometry(4, 66, 4), dark);
    p.position.set(0, 33, s * (HW + 16)); p.castShadow = true; gantry.add(p);
  }
  const drawBanner = (g: CanvasRenderingContext2D, w: number, h: number) => {
    g.fillStyle = RED; g.fillRect(0, 0, w, h);
    for (let q = 0; q < 8; q++) for (let r = 0; r < 4; r++) {
      g.fillStyle = (q + r) % 2 ? '#111' : '#fff';
      g.fillRect(q * 8, r * 16, 8, 16); g.fillRect(w - 64 + q * 8, r * 16, 8, 16);
    }
    g.fillStyle = PAPER; g.font = '400 36px Bungee, "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(track.name.toUpperCase().slice(0, 18), w / 2, h / 2 + 2);
  };
  const banner = tex(512, 64, drawBanner);
  banner.wrapS = banner.wrapT = T.ClampToEdgeWrapping;
  document.fonts?.ready.then(() => {
    const g = (banner.image as HTMLCanvasElement).getContext('2d');
    if (g) { drawBanner(g, 512, 64); banner.needsUpdate = true; }
  });
  const bannerMat = lambert({ map: banner });
  const bannerBox = new T.Mesh(new T.BoxGeometry(3, 13, 2 * (HW + 16) + 4), [bannerMat, bannerMat, dark, dark, dark, dark]);
  bannerBox.position.y = 60; bannerBox.castShadow = true; gantry.add(bannerBox);
  world.add(gantry);

  const nearTrack = (x: number, z: number) => {
    let near = Infinity;
    for (let i = 0; i < N; i += 2) { const d = Math.hypot(x - CX[i], z - CY[i]); if (d < near) near = d; }
    return near;
  };
  // grandstand beside the start straight, on whichever side has room
  for (const side of [-1, 1]) {
    const sx = CX[N - 6] + NX[N - 6] * side * (HW + 75), sz = CY[N - 6] + NY[N - 6] * side * (HW + 75);
    if (nearTrack(sx, sz) < HW + 60) continue;
    const stand = new T.Group();
    stand.position.set(sx, 0, sz);
    stand.rotation.y = Math.atan2(NY[N - 6] * side, -NX[N - 6] * side);
    const seatMat = lambert({ color: 0xdfe6e0 });
    const crowdMats = [0xe2412a, 0x2a66d9, 0xf4c21c, 0xfffdf6, 0x8a5cf0, 0x1d9a52].map(c => lambert({ color: c }));
    const headGeo = new T.BoxGeometry(5, 7, 5), rnd = mulberry32(5);
    for (let k = 0; k < 3; k++) {
      const step = new T.Mesh(new T.BoxGeometry(12, 6 + k * 7, 160), seatMat);
      step.position.set(12 - k * 12, (6 + k * 7) / 2, 0); step.castShadow = step.receiveShadow = true; stand.add(step);
      for (let p = 0; p < 13; p++) {
        if (rnd() < 0.2) continue;
        const head = new T.Mesh(headGeo, crowdMats[Math.floor(rnd() * crowdMats.length)]);
        head.position.set(12 - k * 12, 6 + k * 7 + 3.5, -72 + p * 12); head.castShadow = true; stand.add(head);
      }
    }
    world.add(stand);
    break;
  }

  // trees, kept away from the track
  const rnd = mulberry32(11), trunkGeo = new T.CylinderGeometry(2, 3, 14, 6), crownGeo = new T.IcosahedronGeometry(13, 0);
  const trunkMat = lambert({ color: 0x8a5a33 });
  const crownMats = [0x3f8f3a, 0x4fa043, 0x2f7a3a].map(c => lambert({ color: c, flatShading: true }));
  const area = (bounds.x1 - bounds.x0 + 500) * (bounds.y1 - bounds.y0 + 500);
  const want = Math.min(220, Math.round((90 * area) / (1430 * 1070)));
  for (let tries = 0, placed = 0; tries < want * 40 && placed < want; tries++) {
    const x = bounds.x0 - 250 + rnd() * (bounds.x1 - bounds.x0 + 500), z = bounds.y0 - 250 + rnd() * (bounds.y1 - bounds.y0 + 500);
    if (nearTrack(x, z) < HW + 44) continue;
    const tr = new T.Group(), trunk = new T.Mesh(trunkGeo, trunkMat), crown = new T.Mesh(crownGeo, crownMats[Math.floor(rnd() * 3)]);
    trunk.position.y = 7; crown.position.y = 22; crown.rotation.y = rnd() * 3;
    trunk.castShadow = crown.castShadow = true;
    tr.add(trunk, crown); tr.position.set(x, 0, z); tr.scale.setScalar(0.7 + rnd() * 0.7); world.add(tr); placed++;
  }
  return world;
}

