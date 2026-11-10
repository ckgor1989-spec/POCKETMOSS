/**
 * 像素场景渲染 —— 参考「奶油纸 + 藏青描边 + 高饱和点缀」的明亮像素画
 *
 * 实现要点：
 *   1. 所有场景先画在 1/2 分辨率的低像素画布上（1 逻辑像素 = 2 CSS 像素）
 *   2. 再用最近邻放大铺满场景，得到硬边像素块
 *   3. 天空/云/旗帜/地砖/棕榈/冲浪板/招牌/盆栽/水晶全部程序化绘制
 */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function linspace(a, b, n) {
  if (n === 1) return [(a + b) / 2];
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(a + (b - a) * (i / (n - 1)));
  return arr;
}
// 稳定伪随机（同一 seed 每次布局一致）
function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function hexRgb(h) {
  h = h.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(hex, t) {
  const [r, g, b] = hexRgb(hex);
  return `rgb(${Math.round(r * t)},${Math.round(g * t)},${Math.round(b * t)})`;
}
function mixHex(a, b, t) {
  const [r1, g1, b1] = hexRgb(a), [r2, g2, b2] = hexRgb(b);
  const f = v => Math.round(v).toString(16).padStart(2, '0');
  return `#${f(r1 + (r2 - r1) * t)}${f(g1 + (g2 - g1) * t)}${f(b1 + (b2 - b1) * t)}`;
}

const INK = '#2f2b4a';

// ===== 像素绘制基元 =====
function R(c, x, y, w, h, col) {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
function disc(c, cx, cy, r, col) {
  const rr = Math.max(0, Math.round(r));
  for (let dy = -rr; dy <= rr; dy++) {
    const w = Math.round(Math.sqrt(Math.max(0, rr * rr - dy * dy)));
    R(c, Math.round(cx) - w, Math.round(cy) + dy, w * 2 + 1, 1, col);
  }
}
function discO(c, cx, cy, r, fill, ink) {
  disc(c, cx, cy, r, ink);
  disc(c, cx, cy, r - 1, fill);
}
function oval(c, cx, cy, rx, ry, col) {
  const rr = Math.max(1, Math.round(ry));
  for (let dy = -rr; dy <= rr; dy++) {
    const p = dy / rr;
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - p * p)));
    R(c, cx - w, cy + dy, w * 2 + 1, 1, col);
  }
}
function line(c, x0, y0, x1, y1, col) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    R(c, x0, y0, 1, 1, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

// ===== 像素道具模板（字符画，scale 2 贴图） =====
const ART = {
  surf: [
    '....oooo....',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oWWWWo...',
    '...oWWWWo...',
    '...oCCCCo...',
    '...oSSSSo...',
    '...oSSSSo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oSSSSo...',
    '...oSSSSo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oSSSSo...',
    '...oSSSSo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '...oCCCCo...',
    '....oooo....',
  ],
  sign: [
    '..oooooooooo..',
    '.oPPPPPPPPPPo.',
    '.oPWWWWWWWWPo.',
    '.oPWWoCCoWWPo.',
    '.oPWoCCCCoWPo.',
    '.oPWWoCCoWWPo.',
    '.oPWWWWWWWWPo.',
    '.oPPPPPPPPPPo.',
    '..oooooooooo..',
    '......oo......',
    '......oo......',
    '......oo......',
    '......oo......',
    '......oo......',
    '......oo......',
    '......oo......',
    '......oo......',
    '.....oooo.....',
  ],
  pot: [
    '....o..o....',
    '...oLoLo....',
    '..oLLLLLo...',
    '..oLLlLLLo..',
    '...oLLLLo...',
    '....oooo....',
    '....otto....',
    '...otttto...',
    '...otttto...',
    '...otttto...',
    '...otttto...',
    '...oddddo...',
    '....oooo....',
  ],
  lantern: [
    '..oooo..',
    '.oWWWWo.',
    '.oWLLWo.',
    '.oWLLWo.',
    '.oWWWWo.',
    '.oPPPPo.',
    '.oPPPPo.',
    '..oooo..',
    '...oo...',
    '...oo...',
    '...oo...',
    '...oo...',
    '..oooo..',
  ],
  rock: [
    '....oooooo....',
    '..ooSSSSSSoo..',
    '.oSSSSLSSSSSo.',
    'oSSSSSSSSSSSSo',
    'oSSSSSSSSSSSSo',
    '.oooooooooooo.',
  ],
  flower: [
    '..o.o..',
    '.oCoCo.',
    'oCCWCCo',
    '.oCCCo.',
    '..ooo..',
  ],
  star: [
    '....o....',
    '...oPo...',
    'ooooPoooo',
    '.oPPPPPo.',
    '..oPPPo..',
    '.oPPoPPo.',
    '.oPo.oPo.',
    '..o...o..',
  ],
  shell: [
    '..oooo..',
    '.oPPPPo.',
    'oPWPWPWo',
    'oPWPWPWo',
    '.oPPPPo.',
    '..oooo..',
  ],
};

function stamp(c, art, x, y, pal, scale = 2) {
  const w = art[0].length * scale;
  const h = art.length * scale;
  // 接地投影
  oval(c, x + w / 2, y + h - 1, Math.max(4, w * 0.34), 3, 'rgba(47,43,74,0.16)');
  for (let j = 0; j < art.length; j++) {
    const row = art[j];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.') continue;
      const col = pal[ch];
      if (!col) continue;
      R(c, x + i * scale, y + j * scale, scale, scale, col);
    }
  }
}

export class SceneRenderer {
  constructor(canvas, petLayer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.petLayer = petLayer;
    this.scene = null;
    this.t = 0;
    this.particles = [];
    this.flash = 0;
    this.nextFlash = 3 + Math.random() * 4;
    this.started = false;
    this._last = 0;

    this.low = document.createElement('canvas');
    this.lctx = this.low.getContext('2d');
    this.lctx.imageSmoothingEnabled = false;

    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      if (this.scene) this.initParticles(this.scene.key);
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.W = rect.width;
    this.H = rect.height;
    // 逻辑像素：1 逻辑像素 = 2 CSS 像素，与精灵像素尺寸一致
    this.PX = 2;
    this.LW = Math.max(120, Math.round(this.W / this.PX));
    this.LH = Math.max(120, Math.round(this.H / this.PX));
    this.low.width = this.LW;
    this.low.height = this.LH;
    this.lctx = this.low.getContext('2d');
    this.lctx.imageSmoothingEnabled = false;
  }

  start() {
    if (this.started) return;
    this.started = true;
    requestAnimationFrame(this._loop);
  }

  _loop = (now) => {
    const dt = this._last ? Math.min((now - this._last) / 1000, 0.1) : 0.016;
    this._last = now;
    if (this.scene) {
      this.t += dt;
      this.updateParticles(dt);
      this.drawScene(this.scene);
    }
    requestAnimationFrame(this._loop);
  };

  drawScene(scene, timeOfDay = 'day') {
    if (!this.scene || this.scene.key !== scene.key) {
      this.scene = scene;
      this.initParticles(scene.key);
    } else {
      this.scene = scene;
    }
    const c = scene.colors;
    const ctx = this.lctx;
    ctx.clearRect(0, 0, this.LW, this.LH);
    this.drawSky(c, scene.key);
    if (scene.key !== 'cavern') this.drawBanner(c, scene.key);
    this.drawBackdrop(c, scene.key);
    this.drawGround(c, scene.key);
    this.drawProps(c, scene.key);
    this.drawParticles();
    this.blit();
  }

  blit() {
    const m = this.ctx;
    m.imageSmoothingEnabled = false;
    m.clearRect(0, 0, this.W, this.H);
    m.drawImage(this.low, 0, 0, this.W, this.H);
  }

  // ================= 天空 =================
  drawSky(c, key) {
    const { LW, LH } = this;
    const ctx = this.lctx;
    const horizon = Math.floor(LH * 0.60);
    const steps = 12;
    for (let i = 0; i < steps; i++) {
      const p = i / (steps - 1);
      const col = p < 0.5
        ? mixHex(c.skyTop, c.skyMid, p * 2)
        : mixHex(c.skyMid, c.skyBot, (p - 0.5) * 2);
      R(ctx, 0, Math.floor(horizon * i / steps), LW, Math.ceil(horizon / steps) + 1, col);
    }

    // 洞窟：换成洞顶岩层 + 星点
    if (key === 'cavern') {
      for (let i = 0; i < 26; i++) {
        const x = (i * 97) % LW;
        const y = (i * 53) % Math.floor(LH * 0.28);
        R(ctx, x, y, 1, 1, i % 3 === 0 ? '#e8e0ff' : '#c9b8ff');
      }
      R(ctx, 0, 0, LW, 6, shade(c.midDark, 0.8));
      for (let x = 0; x < LW; x += 16) {
        const h = 6 + ((x * 31) % 14);
        for (let r = 0; r < h; r++) {
          const w = Math.max(1, Math.round((1 - r / h) * 8));
          R(ctx, x + 8 - w / 2, 6 + r, w, 1, shade(c.midDark, 0.85));
        }
      }
      return;
    }

    // 太阳
    const sx = Math.round(LW * 0.84), sy = Math.round(LH * 0.12);
    disc(ctx, sx, sy, 10, shade(c.sun, 1.0));
    disc(ctx, sx, sy, 8, c.sun);
    R(ctx, sx - 2, sy - 3, 2, 2, '#fffbe6');

    // 云
    const cloudSeeds = [[0.08, 0.20, 0.7], [0.36, 0.13, 0.55], [0.62, 0.24, 0.8], [0.88, 0.16, 0.6]];
    cloudSeeds.forEach(([fx, fy, s], i) => {
      const drift = (this.t * (2 + i)) % (LW + 80) - 40;
      this.cloud((LW * fx + drift) % (LW + 80) - 40, LH * fy, s, c);
    });
  }

  cloud(x, y, s, c) {
    const ctx = this.lctx;
    const k = Math.max(1, Math.round(s * 10));
    disc(ctx, x, y, k, c.cloud);
    disc(ctx, x + k * 1.2, y - k * 0.5, k * 0.9, c.cloud);
    disc(ctx, x - k * 1.1, y + 1, k * 0.7, c.cloud);
    R(ctx, x - k * 1.4, y + k * 0.55, k * 3.2, Math.max(2, k * 0.35), c.cloudShade);
  }

  // ================= 三角彩旗 =================
  drawBanner(c, key) {
    const { LW, LH } = this;
    const ctx = this.lctx;
    const y0 = Math.round(LH * 0.055);
    const sag = Math.round(LH * 0.02);
    const cols = ['#ff8fab', '#ffd166', '#7ed6a0', '#8fd8ff'];
    for (let x = 0; x < LW; x++) {
      const p = x / LW;
      const y = y0 + Math.round(Math.sin(Math.PI * p) * sag);
      R(ctx, x, y, 1, 1, INK);
    }
    let idx = 0;
    for (let x = 10; x < LW - 6; x += 18) {
      const p = x / LW;
      const y = y0 + Math.round(Math.sin(Math.PI * p) * sag) + 1;
      const col = cols[idx++ % cols.length];
      for (let r = 0; r < 7; r++) {
        const w = Math.max(1, Math.round(7 - r));
        R(ctx, x - w / 2, y + r, w, 1, col);
      }
      R(ctx, x - 3, y, 7, 1, shade(col, 0.9));
    }
  }

  // ================= 远景 / 中景 =================
  drawBackdrop(c, key) {
    const { LW, LH } = this;
    const ctx = this.lctx;
    const hy = Math.round(LH * 0.60);

    if (key === 'forest') {
      // 更远的丘陵（填充天空，制造纵深）
      discO(ctx, LW * 0.22, hy + 2, LH * 0.17,
        mixHex(c.far, '#ffffff', 0.36), mixHex(c.farDark, INK, 0.35));
      discO(ctx, LW * 0.70, hy + 2, LH * 0.21,
        mixHex(c.far, '#ffffff', 0.26), mixHex(c.farDark, INK, 0.35));
      // 远山丘陵
      for (let i = 0; i < 5; i++) {
        const x = LW * (0.1 + i * 0.22);
        discO(ctx, x, hy, LH * 0.10, c.far, mixHex(c.far, INK, 0.25));
      }
      for (let i = 0; i < 6; i++) {
        const x = LW * (0.05 + i * 0.19);
        discO(ctx, x, hy + 4, LH * 0.075, mixHex(c.far, c.mid, 0.5), mixHex(c.farDark, INK, 0.3));
      }
      // 远处小松树
      for (let i = 0; i < 9; i++) {
        const x = Math.round(LW * (0.04 + i * 0.115));
        const h = 12 + (i % 3) * 4;
        this.conifer(x, hy + 2, h, c.mid, c.midDark);
      }
      return;
    }

    if (key === 'lake') {
      // 海面：天空下缘 46% → 地平线
      const seaTop = Math.round(LH * 0.46);
      for (let i = 0; i < 6; i++) {
        const p = i / 6;
        R(ctx, 0, seaTop + Math.floor((hy - seaTop) * p), LW, Math.ceil((hy - seaTop) / 6) + 1,
          mixHex(c.seaTop, c.seaBot, p));
      }
      // 浪线
      for (let i = 0; i < 5; i++) {
        const y = seaTop + 4 + i * Math.floor((hy - seaTop) / 6);
        const off = Math.round((this.t * (6 + i * 3)) % (LW + 40)) - 20;
        for (let x = -20; x < LW + 20; x += 34) {
          R(ctx, x + off, y, 12, 1, 'rgba(255,255,255,0.55)');
        }
      }
      // 浪花线
      R(ctx, 0, hy - 2, LW, 2, c.foam);
      return;
    }

    if (key === 'volcano') {
      // 火山
      const peakX = Math.round(LW * 0.34);
      const peakY = Math.round(LH * 0.26);
      const maxHalf = Math.round(LW * 0.32);
      for (let r = 0; r < hy - peakY; r++) {
        const p = r / (hy - peakY);
        const half = Math.round(6 + p * maxHalf);
        R(ctx, peakX - half, peakY + r, half * 2, 1, c.far);
        // 右侧受光面
        R(ctx, peakX, peakY + r, half, 1, mixHex(c.far, '#ffe0b0', 0.20));
        // 山体墨线
        R(ctx, peakX - half, peakY + r, 1, 1, c.midDark);
        R(ctx, peakX + half - 1, peakY + r, 1, 1, c.midDark);
      }
      // 火山口
      R(ctx, peakX - 8, peakY - 1, 17, 3, c.midDark);
      R(ctx, peakX - 6, peakY, 13, 2, c.lava);
      R(ctx, peakX - 4, peakY, 9, 1, c.lavaLight);
      // 熔岩流
      for (let s = 0; s < 2; s++) {
        for (let r = 0; r < hy - peakY; r++) {
          const p = r / (hy - peakY);
          const x = peakX + (s ? 6 : -4) + Math.sin(p * 7 + s * 2) * 3;
          R(ctx, x, peakY + 3 + r, 2, 1, p < 0.35 ? c.lavaLight : c.lava);
        }
      }
      // 烟柱
      for (let i = 0; i < 4; i++) {
        const p = (this.t * 0.25 + i * 0.25) % 1;
        const r = 3 + p * 10;
        ctx.globalAlpha = 0.5 * (1 - p);
        disc(ctx, peakX + Math.sin(p * 5 + i) * 6, peakY - 4 - p * LH * 0.22, r, c.cloud);
        ctx.globalAlpha = 1;
      }
      return;
    }

    if (key === 'peak') {
      // 两层山脊
      this.ridge(LW * 0.6, hy + 2, LH * 0.24, c.farDark, 11);
      this.ridge(LW * 0.34, hy + 2, LH * 0.18, c.mid, 29);
      this.ridge(LW * 0.85, hy + 2, LH * 0.20, c.mid, 47);
      // 雪顶
      R(ctx, Math.round(LW * 0.6) - 4, Math.round(hy - LH * 0.24) + 2, 9, 3, '#ffffff');
      R(ctx, Math.round(LW * 0.34) - 3, Math.round(hy - LH * 0.18) + 2, 7, 2, '#ffffff');
      // 云海
      for (let i = 0; i < 4; i++) {
        const x = ((this.t * 4 + i * LW * 0.3) % (LW + 60)) - 30;
        R(ctx, x, hy - 3, 40, 3, 'rgba(255,255,255,0.7)');
      }
      return;
    }

    if (key === 'cavern') {
      // 洞窟深处拱门：三层岩环 + 深色洞口 + 岩层纹理
      const cx = LW * 0.5, cy = hy + 4, R0 = LH * 0.27;
      const rimInk = mixHex(c.midDark, INK, 0.35);
      discO(ctx, cx, cy, R0, shade(c.mid, 0.92), rimInk);
      // 岩层：每 4 行一条暗纹
      for (let r = -R0 + 2; r <= 0; r += 4) {
        const w = Math.round(Math.sqrt(Math.max(0, R0 * R0 - r * r)));
        R(ctx, cx - w + 1, cy + r, w * 2 - 2, 1, mixHex(c.mid, INK, 0.14));
      }
      discO(ctx, cx, cy, R0 * 0.78, shade(c.mid, 0.84), rimInk);
      discO(ctx, cx, cy, R0 * 0.56, shade(c.midDark, 0.95), mixHex(c.midDark, INK, 0.45));
      disc(ctx, cx, cy, R0 * 0.40, mixHex(c.skyTop, INK, 0.5));
      // 洞口幽光
      for (let i = 3; i >= 1; i--) {
        ctx.globalAlpha = 0.12;
        disc(ctx, cx, cy, R0 * 0.12 * i, c.crystal);
      }
      ctx.globalAlpha = 1;
      disc(ctx, cx, cy, Math.max(2, R0 * 0.09), mixHex(c.crystal, '#ffffff', 0.35));
      // 拱顶受光（沿外圈左上缘）
      for (let r = -R0 + 3; r < -R0 * 0.45; r++) {
        const w = Math.round(Math.sqrt(Math.max(0, R0 * R0 - r * r)));
        R(ctx, cx - w + 2, cy + r, 3, 1, mixHex(c.mid, '#ffffff', 0.35));
      }
      // 水晶簇
      this.crystalCluster(LW * 0.12, hy + 2, 1.15, c.crystal);
      this.crystalCluster(LW * 0.84, hy + 2, 0.85, c.crystal);
      return;
    }
  }

  ridge(cx, baseY, h, col, seed) {
    const ctx = this.lctx;
    const rnd = seeded(seed);
    let x = Math.round(cx);
    let w = Math.round(h * 0.9);
    const peakY = Math.round(baseY - h);
    for (let r = 0; r < h; r++) {
      const p = r / h;
      const half = Math.round(w * p * (0.5 + rnd() * 0.25));
      R(ctx, x - half, peakY + r, half * 2, 1, col);
    }
    // 侧峰
    const sx = Math.round(cx + w * 0.55);
    const sh = Math.round(h * 0.62);
    const sy = Math.round(baseY - sh);
    for (let r = 0; r < sh; r++) {
      const p = r / sh;
      const half = Math.round(w * 0.5 * p);
      R(ctx, sx - half, sy + r, half * 2, 1, col);
    }
  }

  conifer(x, baseY, h, fill, ink) {
    const ctx = this.lctx;
    for (let r = 0; r < h; r++) {
      const w = Math.max(1, Math.round((r / h) * h * 0.55));
      R(ctx, x - w / 2, baseY - h + r, w, 1, fill);
    }
    R(ctx, x - 1, baseY - 2, 2, 3, ink);
  }

  // ================= 地面 =================
  drawGround(c, key) {
    const { LW, LH } = this;
    const ctx = this.lctx;
    const hy = Math.round(LH * 0.60);
    const bot = LH;

    // 透视地砖：带棋盘格明暗，越靠前砖越大
    const rows = 9;
    let y = hy;
    const baseSeam = Math.max(14, Math.round(LW * 0.15));
    for (let i = 0; i < rows; i++) {
      const p = i / rows;
      const y2 = hy + Math.round((bot - hy) * Math.pow((i + 1) / rows, 0.9));
      const seam = Math.max(12, Math.round(baseSeam * (0.45 + p * 2.1)));
      const off = (i % 2) * Math.round(seam / 2);
      const rowCol = mixHex(c.groundTop, c.groundBot, p * 0.9);
      R(ctx, 0, y, LW, y2 - y, rowCol);
      // 棋盘明暗
      let col = 0;
      for (let x = -off; x < LW + seam; x += seam) {
        if ((i + col) % 2 === 0) {
          const sx = Math.round(x + (LW / 2 - x) * 0.05 * p);
          R(ctx, sx, y, seam, y2 - y, mixHex(rowCol, c.groundDark, 0.08));
        }
        col++;
      }
      // 纵向砖缝（向中心汇聚）
      for (let x = -off; x < LW + seam; x += seam) {
        const sx = Math.round(x + (LW / 2 - x) * 0.05 * p);
        R(ctx, sx, y, 1, y2 - y, c.groundLine);
      }
      // 横向砖缝
      R(ctx, 0, y2, LW, 1, c.groundLine);
      y = y2;
    }

    // 地平线草叶 / 边缘过渡（洞窟与火山不长草，沙滩用浪花代替）
    if (key === 'forest' || key === 'peak') {
      for (let x = 0; x < LW; x += 5) {
        const h = 2 + ((x * 7) % 4);
        R(ctx, x, hy - h + 1, 1, h, c.leafDark);
        R(ctx, x + 1, hy - h, 1, h, c.leaf);
      }
    } else if (key === 'lake') {
      for (let x = 0; x < LW; x += 9) {
        R(ctx, x, hy - 2, 5, 1, '#ffffff');
      }
    } else if (key === 'volcano') {
      for (let x = 0; x < LW; x += 7) {
        const h = 2 + ((x * 5) % 5);
        R(ctx, x, hy - h + 1, 1, h, c.midDark);
      }
    } else if (key === 'cavern') {
      for (let x = 0; x < LW; x += 9) {
        const h = 2 + ((x * 3) % 6);
        R(ctx, x, hy - h + 1, 1, h, mixHex(c.crystal, c.groundDark, 0.4));
      }
    }

    // 底部木栈道
    const deck = Math.round(LH * 0.055);
    R(ctx, 0, bot - deck, LW, deck, '#8a5a3b');
    R(ctx, 0, bot - deck, LW, 3, '#b5794f');
    for (let x = 0; x < LW; x += 14) {
      R(ctx, x, bot - deck + 3, 1, deck - 3, '#6f452c');
    }

    // 场景地面细节
    const rnd = seeded(97);
    if (key === 'forest') {
      for (let i = 0; i < 22; i++) {
        const x = Math.round(rnd() * LW);
        const yy = hy + Math.round(rnd() * (bot - hy - deck));
        R(ctx, x, yy, 3, 1, c.leafDark);
        R(ctx, x + 1, yy - 2, 1, 2, c.leaf);
      }
    } else if (key === 'volcano') {
      for (let i = 0; i < 5; i++) {
        const x0 = Math.round(LW * (0.12 + i * 0.18));
        const yy = hy + Math.round((bot - hy) * (0.25 + i * 0.11));
        line(ctx, x0, yy, x0 + 16, yy + 5, c.lava);
        line(ctx, x0 + 16, yy + 5, x0 + 26, yy + 3, c.lavaLight);
      }
    } else if (key === 'lake') {
      for (let i = 0; i < 14; i++) {
        const x = Math.round(rnd() * LW);
        const yy = hy + Math.round(rnd() * (bot - hy - deck));
        R(ctx, x, yy, 1, 1, shade(c.groundLine, 0.9));
      }
      stamp(ctx, ART.flower, LW * 0.42, LH * 0.86, { o: INK, C: c.accent, W: '#fff6dc' }, 1);
      stamp(ctx, ART.flower, LW * 0.70, LH * 0.74, { o: INK, C: c.accent, W: '#fff6dc' }, 1);
    } else if (key === 'peak') {
      for (let i = 0; i < 18; i++) {
        const x = Math.round(rnd() * LW);
        const yy = hy + Math.round(rnd() * (bot - hy - deck));
        R(ctx, x, yy, 2, 1, c.leafDark);
      }
    } else if (key === 'cavern') {
      for (let i = 0; i < 20; i++) {
        const x = Math.round(rnd() * LW);
        const yy = hy + Math.round(rnd() * (bot - hy - deck));
        R(ctx, x, yy, 1, 1, i % 2 ? c.accent : '#ffffff');
      }
    }
  }

  // ================= 场景道具 =================
  drawProps(c, key) {
    const { LW, LH } = this;
    const ctx = this.lctx;
    const hy = Math.round(LH * 0.60);

    if (key === 'forest') {
      this.tree(Math.round(LW * 0.10), Math.round(LH * 0.80), Math.round(LH * 0.34), c);
      this.tree(Math.round(LW * 0.93), Math.round(LH * 0.76), Math.round(LH * 0.28), c);
      stamp(ctx, ART.sign, Math.round(LW * 0.30), Math.round(LH * 0.66),
        { o: INK, P: '#ff8fab', W: '#fff6dc', C: '#2f9e8f' }, 2);
      stamp(ctx, ART.pot, Math.round(LW * 0.56), Math.round(LH * 0.86),
        { o: INK, L: c.leaf, l: c.leafDark, t: '#ff9f68', d: '#d97a4a' }, 2);
      stamp(ctx, ART.pot, Math.round(LW * 0.87), Math.round(LH * 0.90),
        { o: INK, L: c.leaf, l: c.leafDark, t: '#ffd166', d: '#d9a93f' }, 2);
      stamp(ctx, ART.rock, Math.round(LW * 0.72), Math.round(LH * 0.72),
        { o: INK, S: '#b8a888', L: '#d6c8a8' }, 2);
      this.bush(Math.round(LW * 0.20), Math.round(LH * 0.605), 5, c);
      this.bush(Math.round(LW * 0.44), Math.round(LH * 0.605), 7, c);
      this.bush(Math.round(LW * 0.66), Math.round(LH * 0.605), 5, c);
      this.bush(Math.round(LW * 0.83), Math.round(LH * 0.605), 6, c);
      stamp(ctx, ART.flower, Math.round(LW * 0.47), Math.round(LH * 0.80),
        { o: INK, C: '#ff8fab', W: '#fff6dc' }, 2);
      stamp(ctx, ART.flower, Math.round(LW * 0.75), Math.round(LH * 0.87),
        { o: INK, C: '#ffd166', W: '#fff6dc' }, 2);
      return;
    }

    if (key === 'lake') {
      this.palm(Math.round(LW * 0.045), Math.round(LH * 0.82), Math.round(LH * 0.34), c, 1);
      this.palm(Math.round(LW * 0.955), Math.round(LH * 0.78), Math.round(LH * 0.30), c, -1);
      stamp(ctx, ART.surf, Math.round(LW * 0.79), Math.round(LH * 0.70),
        { o: INK, C: '#ff8fab', S: '#fff6dc', W: '#2f9e8f' }, 2);
      stamp(ctx, ART.surf, Math.round(LW * 0.86), Math.round(LH * 0.68),
        { o: INK, C: '#7ed6a0', S: '#fff6dc', W: '#ffd166' }, 2);
      stamp(ctx, ART.surf, Math.round(LW * 0.93), Math.round(LH * 0.72),
        { o: INK, C: '#ffd166', S: '#ff8fab', W: '#fff6dc' }, 2);
      stamp(ctx, ART.sign, Math.round(LW * 0.16), Math.round(LH * 0.64),
        { o: INK, P: '#ffe9b8', W: '#fffdf2', C: '#ff8fab' }, 2);
      this.umbrella(Math.round(LW * 0.62), Math.round(LH * 0.92), Math.round(LW * 0.20), Math.round(LH * 0.22), c);
      stamp(ctx, ART.pot, Math.round(LW * 0.38), Math.round(LH * 0.94),
        { o: INK, L: c.leaf, l: c.leafDark, t: '#ff9f68', d: '#d97a4a' }, 2);
      stamp(ctx, ART.star, Math.round(LW * 0.30), Math.round(LH * 0.82),
        { o: INK, P: '#ff8fab' }, 3);
      stamp(ctx, ART.shell, Math.round(LW * 0.66), Math.round(LH * 0.78),
        { o: INK, P: '#ffd166', W: '#fff6dc' }, 3);
      stamp(ctx, ART.star, Math.round(LW * 0.46), Math.round(LH * 0.90),
        { o: INK, P: '#ffd166' }, 2);
      return;
    }

    if (key === 'volcano') {
      stamp(ctx, ART.rock, Math.round(LW * 0.06), Math.round(LH * 0.76),
        { o: INK, S: '#b98a63', L: '#d8ab80' }, 3);
      stamp(ctx, ART.rock, Math.round(LW * 0.84), Math.round(LH * 0.72),
        { o: INK, S: '#a9795a', L: '#c99a74' }, 3);
      stamp(ctx, ART.lantern, Math.round(LW * 0.24), Math.round(LH * 0.72),
        { o: INK, W: '#fff6dc', L: c.lavaLight, P: c.propDark }, 2);
      stamp(ctx, ART.lantern, Math.round(LW * 0.72), Math.round(LH * 0.68),
        { o: INK, W: '#fff6dc', L: c.lavaLight, P: c.propDark }, 2);
      stamp(ctx, ART.pot, Math.round(LW * 0.44), Math.round(LH * 0.92),
        { o: INK, L: c.leaf, l: c.leafDark, t: '#ff9f68', d: '#d97a4a' }, 2);
      // 温泉蒸汽
      for (let i = 0; i < 3; i++) {
        const p = (this.t * 0.2 + i * 0.33) % 1;
        ctx.globalAlpha = 0.35 * (1 - p);
        disc(ctx, LW * 0.55 + Math.sin(p * 4 + i) * 8, LH * 0.70 - p * LH * 0.16, 3 + p * 5, '#ffffff');
        ctx.globalAlpha = 1;
      }
      return;
    }

    if (key === 'peak') {
      this.flagpole(Math.round(LW * 0.13), Math.round(LH * 0.78), Math.round(LH * 0.30), c);
      stamp(ctx, ART.rock, Math.round(LW * 0.80), Math.round(LH * 0.74),
        { o: INK, S: '#a9b3c9', L: '#c9d2e2' }, 3);
      stamp(ctx, ART.pot, Math.round(LW * 0.64), Math.round(LH * 0.94),
        { o: INK, L: c.leaf, l: c.leafDark, t: '#ffd166', d: '#d9a93f' }, 2);
      // 风向线
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 4; i++) {
        const y = LH * (0.14 + i * 0.07);
        const x = ((this.t * 26 + i * 70) % (LW + 60)) - 30;
        R(ctx, x, y, 18, 1, 'rgba(255,255,255,0.55)');
      }
      return;
    }

    if (key === 'cavern') {
      this.crystalCluster(Math.round(LW * 0.075), Math.round(LH * 0.93), 1.5, c.crystal);
      this.crystalCluster(Math.round(LW * 0.92), Math.round(LH * 0.90), 1.15, '#b18cff');
      this.crystalCluster(Math.round(LW * 0.64), Math.round(LH * 0.97), 0.8, c.crystal);
      stamp(ctx, ART.lantern, Math.round(LW * 0.30), Math.round(LH * 0.82),
        { o: INK, W: '#e8e0ff', L: c.accent, P: c.propDark }, 2);
      stamp(ctx, ART.rock, Math.round(LW * 0.78), Math.round(LH * 0.82),
        { o: INK, S: '#8f7ed8', L: '#a99ae8' }, 2);
      return;
    }
  }

  // 单根水晶：底部宽 w，向上收成尖，左暗右亮 + 墨线轮廓
  crystalShard(x, baseY, h, w, col, light = '#ffffff') {
    const ctx = this.lctx;
    const ww = Math.max(2, Math.round(w));
    for (let r = 0; r < h; r++) {
      const p = r / h;                                    // 0 底 → 1 尖
      const half = Math.max(1, Math.round((ww / 2) * (1 - p * 0.92)));
      const yy = Math.round(baseY) - r;
      R(ctx, x - half, yy, half * 2, 1, col);
      R(ctx, x - half, yy, Math.max(1, Math.round(half * 0.55)), 1, shade(col, 0.84));
      const lw = Math.max(1, Math.round(half * 0.45));
      R(ctx, x + half - lw, yy, lw, 1, light);
      R(ctx, x - half - 1, yy, 1, 1, INK);
      R(ctx, x + half, yy, 1, 1, INK);
    }
    R(ctx, x - Math.round(ww / 2) - 1, Math.round(baseY), ww + 2, 1, INK);
    // 高光棱
    R(ctx, x - Math.round(ww * 0.10), Math.round(baseY - h * 0.70), 1,
      Math.max(1, Math.round(h * 0.18)), '#ffffff');
  }

  // 三根高低错落的水晶簇
  crystalCluster(x, baseY, s, col, light = '#ffffff') {
    this.pshadow(x, baseY, Math.round(10 * s), Math.max(2, Math.round(2.4 * s)));
    this.crystalShard(x - Math.round(5 * s), baseY, Math.round(14 * s), 6 * s, shade(col, 0.9), light);
    this.crystalShard(x + Math.round(5 * s), baseY, Math.round(10 * s), 5 * s, col, light);
    this.crystalShard(x, baseY, Math.round(21 * s), 8 * s, col, light);
  }

  // 棕榈树
  palm(x, baseY, h, c, dir = 1) {
    const ctx = this.lctx;
    this.pshadow(x, baseY, 15, 4);
    const bend = dir * Math.round(h * 0.14);
    for (let i = 0; i < h; i++) {
      const p = i / h;
      const xx = Math.round(x + Math.sin(p * 1.35) * bend);
      const yy = baseY - i;
      R(ctx, xx - 2, yy, 5, 1, INK);
      R(ctx, xx - 1, yy, 3, 1, i % 6 === 5 ? '#7a4a33' : '#a9714a');
    }
    const topX = Math.round(x + Math.sin(1.35) * bend);
    const topY = baseY - h;
    const angles = [-2.55, -2.05, -1.62, -1.18, -0.72, -0.24];
    for (const a of angles) {
      for (let i = 0; i < 17; i++) {
        const px = topX + Math.cos(a) * i * dir;
        const py = topY + Math.sin(a) * i * 0.5 + i * i * 0.10;
        R(ctx, px - 1, py - 1, 5, 4, INK);
        R(ctx, px, py, 3, 2, c.leaf);
        R(ctx, px, py + 2, 3, 1, c.leafDark);
      }
    }
    R(ctx, topX - 3, topY - 2, 7, 4, c.leafDark);
    R(ctx, topX - 2, topY - 1, 4, 2, c.leaf);
    // 椰子
    R(ctx, topX + 2, topY + 2, 2, 2, '#7a4a33');
    R(ctx, topX - 4, topY + 3, 2, 2, '#a9714a');
  }

  // 阔叶树
  tree(x, baseY, h, c) {
    const ctx = this.lctx;
    const cw = Math.round(h * 0.30);
    const cy = Math.round(baseY - h + cw);
    const ink = mixHex(c.leafDark, INK, 0.35);
    this.pshadow(x, baseY - 1, Math.round(cw * 1.15), 4);
    // 树干（先画，树冠盖住顶部）
    const th = Math.round(h * 0.46);
    for (let i = 0; i < th; i++) {
      const yy = baseY - i;
      const w = Math.round(5 + (i / th) * 4);
      R(ctx, x - w / 2, yy, w, 1, ink);
      R(ctx, x - w / 2 + 1, yy, w - 2, 1, i % 4 === 0 ? c.propDark : c.prop);
    }
    // 树冠
    discO(ctx, x, cy, cw, c.leaf, ink);
    discO(ctx, x - cw * 0.75, cy + cw * 0.34, Math.round(cw * 0.66), c.leaf, ink);
    discO(ctx, x + cw * 0.75, cy + cw * 0.30, Math.round(cw * 0.68), c.leaf, ink);
    // 顶部受光
    disc(ctx, x - Math.round(cw * 0.28), cy - Math.round(cw * 0.30), Math.round(cw * 0.40),
      mixHex(c.leaf, '#ffffff', 0.32));
    // 叶片暗点，增加体积
    for (let i = 0; i < 6; i++) {
      const px = x + Math.round(Math.sin(i * 2.1) * cw * 0.6);
      const py = cy + Math.round(Math.cos(i * 1.7) * cw * 0.45);
      R(ctx, px, py, 2, 1, c.leafDark);
    }
  }

  pshadow(x, y, rx, ry) {
    const ctx = this.lctx;
    oval(ctx, x, y, rx, ry, 'rgba(47,43,74,0.16)');
  }

  bush(x, y, s, c) {
    const ctx = this.lctx;
    const ink = mixHex(c.leafDark, INK, 0.35);
    discO(ctx, x, y, s, c.leaf, ink);
    discO(ctx, x + s, y + 1, Math.round(s * 0.72), c.leaf, ink);
    discO(ctx, x - s, y + 2, Math.round(s * 0.66), c.leaf, ink);
    R(ctx, x - Math.round(s * 0.3), y - Math.round(s * 0.4), 2, 1, mixHex(c.leaf, '#ffffff', 0.35));
  }

  umbrella(x, baseY, w, h, c) {
    const ctx = this.lctx;
    R(ctx, x - 1, baseY - h, 3, h, INK);
    R(ctx, x, baseY - h, 1, h, c.propDark);
    const top = baseY - h;
    const rows = Math.round(h * 0.42);
    for (let r = 0; r < rows; r++) {
      const p = r / rows;
      const half = Math.round((w / 2) * Math.cos(p * Math.PI / 2));
      for (let sx = -half; sx <= half; sx += 5) {
        const stripe = Math.floor((sx + half) / 5) % 2;
        R(ctx, x + sx, top + r, Math.min(5, half - sx + 1), 1, stripe ? c.accent : '#fff6dc');
      }
    }
    R(ctx, x - w / 2, top, w, 1, INK);
  }

  flagpole(x, baseY, h, c) {
    const ctx = this.lctx;
    R(ctx, x - 1, baseY - h, 3, h, INK);
    R(ctx, x, baseY - h, 1, h, c.prop);
    // 三角旗
    const wave = Math.round(Math.sin(this.t * 3) * 2);
    for (let r = 0; r < 12; r++) {
      const w = Math.max(1, Math.round(16 - r * 1.2));
      R(ctx, x + 2 + wave, baseY - h + 2 + r, w, 1, r % 4 < 2 ? '#ffd166' : '#ff8fab');
    }
    disc(ctx, x, baseY - h - 1, 2, c.accent);
  }

  // ================= 粒子（逻辑像素坐标） =================
  initParticles(key) {
    const counts = { forest: 18, volcano: 22, lake: 16, peak: 16, cavern: 22 };
    const n = counts[key] ?? 14;
    this.particles = [];
    for (let i = 0; i < n; i++) this.particles.push(this.makeParticle(key, true));
  }

  makeParticle(key, initial) {
    const { LW, LH } = this;
    const p = {
      x: Math.random() * LW,
      y: Math.random() * LH,
      ph: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 0.7,
      size: 1 + Math.round(Math.random()),
      col: '#ffffff',
    };
    if (key === 'forest') {
      p.y = initial ? LH * (0.18 + Math.random() * 0.5) : LH * (0.2 + Math.random() * 0.45);
      p.col = Math.random() < 0.5 ? '#fff6b0' : '#ffffff';
    } else if (key === 'volcano') {
      p.y = initial ? Math.random() * LH * 0.7 : LH * 0.62 + Math.random() * LH * 0.32;
      p.col = Math.random() < 0.5 ? '#ffd166' : '#ff8a3d';
      p.sp = 0.15 + Math.random() * 0.35;
    } else if (key === 'lake') {
      p.y = initial ? LH * 0.12 + Math.random() * LH * 0.46 : LH * 0.62;
      p.col = 'rgba(255,255,255,0.85)';
      p.sp = 0.1 + Math.random() * 0.22;
    } else if (key === 'peak') {
      p.y = Math.random() * LH * 0.52;
      p.col = Math.random() < 0.5 ? '#ffffff' : '#ffe9a8';
      p.sp = 0.2 + Math.random() * 0.6;
    } else if (key === 'cavern') {
      p.y = Math.random() * LH * 0.6;
      p.col = Math.random() < 0.5 ? '#7ef9d6' : '#e8e0ff';
      p.sp = 0.05 + Math.random() * 0.12;
    }
    return p;
  }

  updateParticles(dt) {
    const { LW, LH } = this;
    const key = this.scene?.key;
    for (const p of this.particles) {
      p.ph += dt * 2;
      if (key === 'volcano') {
        p.y -= p.sp * 24 * dt;
        p.x += Math.sin(p.ph * 0.6) * 4 * dt;
        if (p.y < LH * 0.16) { p.y = LH * 0.95; p.x = Math.random() * LW; }
      } else if (key === 'lake') {
        p.y -= p.sp * 16 * dt;
        if (p.y < LH * 0.52) { p.y = LH * 0.95; p.x = Math.random() * LW; }
      } else if (key === 'forest') {
        p.x += Math.sin(p.ph * 0.5) * 5 * dt;
        p.y += Math.cos(p.ph * 0.4) * 4 * dt;
      } else if (key === 'cavern') {
        p.x += Math.sin(p.ph * 0.3) * 3 * dt;
        p.y += Math.cos(p.ph * 0.25) * 2 * dt;
      } else if (key === 'peak') {
        p.x += p.sp * 8 * dt;
        if (p.x > LW + 2) p.x = -2;
      }
      p.x = clamp(p.x, -4, LW + 4);
      p.y = clamp(p.y, 0, LH);
    }

    if (key === 'peak') {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) { this.flash = 1; this.nextFlash = 3 + Math.random() * 5; }
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
    }
  }

  drawParticles() {
    const key = this.scene?.key;
    const ctx = this.lctx;
    const { LW, LH } = this;
    for (const p of this.particles) {
      const a = 0.5 + Math.sin(p.ph) * 0.4;
      ctx.globalAlpha = clamp(a, 0.15, 0.95);
      R(ctx, p.x, p.y, p.size, p.size, p.col);
    }
    ctx.globalAlpha = 1;

    if (key === 'peak' && this.flash > 0) {
      ctx.fillStyle = `rgba(255,241,168,${this.flash * 0.35})`;
      ctx.fillRect(0, 0, LW, LH * 0.6);
      R(ctx, LW * 0.3, LH * 0.06, 2, 8, `rgba(255,255,255,${this.flash})`);
      R(ctx, LW * 0.3 + 2, LH * 0.14, 4, 2, `rgba(255,255,255,${this.flash})`);
    }
  }

  /** 每只精灵在 2.5D 地板上的像素位置 */
  computePetPositions(pets) {
    const { W, H } = this;
    const n = pets.length;
    const positions = [];
    const depths = n <= 1 ? [0.5] : linspace(0.30, 0.80, n);
    pets.forEach((pet, i) => {
      const t = depths[i];
      const horizon = H * 0.62;
      const groundBot = H - 18;
      const scale = 0.66 + t * 0.60;
      const halfH = 71 * scale;
      const y = Math.min(horizon + (groundBot - horizon) * t, H - halfH - 8);
      const jitter = (Math.random() - 0.5) * 0.10;
      const baseX = 0.5 + (i - (n - 1) / 2) * 0.165;
      const x = W * clamp(baseX + jitter, 0.15, 0.85);
      positions.push({ petId: pet.id, x, y, depth: t });
    });
    return positions.sort((a, b) => a.depth - b.depth);
  }

  /** depth 0 → 0.66 倍, depth 1 → 1.26 倍 */
  static depthToScale(depth) { return 0.66 + depth * 0.60; }
}
