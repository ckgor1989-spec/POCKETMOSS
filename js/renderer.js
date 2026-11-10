/**
 * Canvas 场景渲染 —— 分层视差 + 氛围粒子
 * 每帧重绘：天空 → 远景 → 中景 → 地平线 → 地面 → 前景 → 粒子
 * 精灵 DOM 由 sprites.js 负责，renderer 只画背景与氛围
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
function shade(hex, t) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * t); g = Math.round(g * t); b = Math.round(b * t);
  return `rgb(${r},${g},${b})`;
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
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      if (this.scene) { this.initParticles(this.scene.key); this.layout = null; }
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = rect.width;
    this.H = rect.height;
  }

  /** 启动常驻动画循环（场景 + 粒子） */
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
      this.drawScene(this.scene);
      this.updateParticles(dt);
      this.drawParticles();
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
    const { W, H } = this;
    const c = scene.colors;

    // 1. 天空
    const sky = this.ctx.createLinearGradient(0, 0, 0, H * 0.58);
    sky.addColorStop(0, c.skyTop);
    sky.addColorStop(1, c.skyBot);
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, W, H * 0.58);

    // 2. 远景（最慢）/ 中景 / 地面 / 近景
    this.drawFar(scene, timeOfDay);
    this.drawMid(scene, timeOfDay);
    this.ctx.fillStyle = shade(c.groundDark, 0.9);
    this.ctx.fillRect(0, H * 0.55, W, 2);
    this.drawGround(scene);
    this.drawNear(scene);
  }

  // ================= 远景 =================
  drawFar(scene, tod) {
    const { W, H } = this;
    const c = scene.colors;
    const key = scene.key;

    if (key === 'cavern') {
      // 洞顶岩层 + 钟乳石
      this.ctx.fillStyle = shade(c.groundDark, 1.4);
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(0, H * 0.16);
      for (let x = 0; x <= W; x += 26) {
        const h = H * 0.1 + ((x * 37) % 40);
        this.ctx.lineTo(x + 13, h);
        this.ctx.lineTo(x + 26, H * 0.12);
      }
      this.ctx.lineTo(W, 0);
      this.ctx.closePath();
      this.ctx.fill();
      return;
    }

    // 天空光源（太阳/月）
    this.ctx.fillStyle = tod === 'night' ? '#e5e7eb' : c.accent;
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillRect(Math.round(W * 0.84), Math.round(H * 0.1), 14, 14);
    this.ctx.globalAlpha = 0.25;
    this.ctx.fillRect(Math.round(W * 0.84) - 4, Math.round(H * 0.1) - 4, 22, 22);
    this.ctx.globalAlpha = 1;

    if (key === 'forest') {
      // 三层松树剪影，越远越暗越小
      const bands = [
        { y: H * 0.56, h: 34, color: shade(c.groundDark, 2.2), step: 30, seed: 7 },
        { y: H * 0.58, h: 46, color: shade(c.groundDark, 1.5), step: 46, seed: 23 },
      ];
      bands.forEach(b => {
        const rnd = seeded(b.seed);
        for (let x = -20; x < W + 20; x += b.step) {
          const hh = b.h * (0.7 + rnd() * 0.6);
          const xx = x + rnd() * 10;
          this.ctx.fillStyle = b.color;
          this.ctx.beginPath();
          this.ctx.moveTo(xx, b.y);
          this.ctx.lineTo(xx - hh * 0.26, b.y);
          this.ctx.lineTo(xx, b.y - hh);
          this.ctx.lineTo(xx + hh * 0.26, b.y);
          this.ctx.closePath();
          this.ctx.fill();
        }
      });
      return;
    }

    if (key === 'volcano') {
      // 远山火山口 + 上升烟柱
      this.ctx.fillStyle = shade(c.groundDark, 2.0);
      this.ctx.beginPath();
      this.ctx.moveTo(W * 0.08, H * 0.56);
      this.ctx.lineTo(W * 0.3, H * 0.28);
      this.ctx.lineTo(W * 0.42, H * 0.36);
      this.ctx.lineTo(W * 0.5, H * 0.3);
      this.ctx.lineTo(W * 0.7, H * 0.56);
      this.ctx.closePath();
      this.ctx.fill();
      // 岩浆口
      this.ctx.fillStyle = '#f97316';
      this.ctx.globalAlpha = 0.8 + Math.sin(this.t * 2) * 0.2;
      this.ctx.fillRect(Math.round(W * 0.29), Math.round(H * 0.29), 10, 3);
      this.ctx.globalAlpha = 1;
      // 烟柱
      for (let i = 0; i < 5; i++) {
        const p = (this.t * 0.12 + i * 0.2) % 1;
        this.ctx.fillStyle = `rgba(120,113,108,${0.28 * (1 - p)})`;
        const r = 6 + p * 16;
        this.ctx.beginPath();
        this.ctx.arc(W * 0.32 + Math.sin(p * 6 + i) * 10, H * 0.3 - p * H * 0.26, r, 0, Math.PI * 2);
        this.ctx.fill();
      }
      return;
    }

    if (key === 'lake') {
      // 两层远山
      const ridges = [
        { y: H * 0.55, color: shade(c.groundDark, 1.8), amp: 26, seed: 11, step: 34 },
        { y: H * 0.56, color: shade(c.groundDark, 2.6), amp: 16, seed: 41, step: 22 },
      ];
      ridges.forEach(r => {
        const rnd = seeded(r.seed);
        this.ctx.fillStyle = r.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, r.y);
        for (let x = 0; x <= W; x += r.step) {
          this.ctx.lineTo(x, r.y - rnd() * r.amp);
        }
        this.ctx.lineTo(W, r.y);
        this.ctx.closePath();
        this.ctx.fill();
      });
      return;
    }

    if (key === 'peak') {
      // 三层紫色山脊 + 云带
      const ridges = [
        { y: H * 0.56, color: shade(c.groundDark, 1.5), amp: 40, seed: 3, step: 44 },
        { y: H * 0.57, color: shade(c.groundDark, 2.2), amp: 26, seed: 19, step: 30 },
        { y: H * 0.58, color: shade(c.groundDark, 3.0), amp: 14, seed: 53, step: 20 },
      ];
      ridges.forEach(r => {
        const rnd = seeded(r.seed);
        this.ctx.fillStyle = r.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, r.y);
        for (let x = 0; x <= W; x += r.step) {
          this.ctx.lineTo(x, r.y - rnd() * r.amp);
        }
        this.ctx.lineTo(W, r.y);
        this.ctx.closePath();
        this.ctx.fill();
      });
      // 云带
      this.ctx.fillStyle = 'rgba(199,210,254,0.22)';
      const cx = (this.t * 8) % (W + 120) - 60;
      this.ctx.fillRect(cx, H * 0.2, 70, 5);
      this.ctx.fillRect(cx + 24, H * 0.235, 46, 4);
      return;
    }
  }

  // ================= 中景 =================
  drawMid(scene, tod) {
    const { W, H } = this;
    const c = scene.colors;
    const key = scene.key;

    if (key === 'cavern') {
      // 发光水晶簇（呼吸脉动）
      const pulse = 0.55 + Math.sin(this.t * 1.6) * 0.35;
      const crystals = [[0.18, 0.42, 8], [0.76, 0.38, 10], [0.5, 0.5, 6], [0.34, 0.34, 5]];
      crystals.forEach(([fx, fy, s]) => {
        this.ctx.globalAlpha = pulse;
        this.ctx.fillStyle = c.accent;
        this.ctx.beginPath();
        this.ctx.moveTo(W * fx, H * fy - s * 1.6);
        this.ctx.lineTo(W * fx + s * 0.6, H * fy);
        this.ctx.lineTo(W * fx, H * fy + s * 0.7);
        this.ctx.lineTo(W * fx - s * 0.6, H * fy);
        this.ctx.closePath();
        this.ctx.fill();
      });
      this.ctx.globalAlpha = 1;
      return;
    }

    if (key === 'lake') {
      // 地平线水光带 + 波光横线
      const horizon = H * 0.56;
      const g = this.ctx.createLinearGradient(0, horizon, 0, horizon + 26);
      g.addColorStop(0, 'rgba(191,219,254,0.55)');
      g.addColorStop(1, 'rgba(59,130,246,0)');
      this.ctx.fillStyle = g;
      this.ctx.fillRect(0, horizon, W, 26);
      this.ctx.fillStyle = 'rgba(224,242,254,0.7)';
      for (let i = 0; i < 6; i++) {
        const y = horizon + 6 + i * 4;
        const w = 16 + ((i * 37) % 40);
        const x = ((this.t * 14 + i * 60) % (W + 80)) - 40;
        this.ctx.globalAlpha = 0.35 - i * 0.04;
        this.ctx.fillRect(x, y, w, 1);
      }
      this.ctx.globalAlpha = 1;
      return;
    }

    if (key === 'volcano') {
      // 地平线熔岩辉光
      const g = this.ctx.createLinearGradient(0, H * 0.44, 0, H * 0.57);
      g.addColorStop(0, 'rgba(249,115,22,0)');
      g.addColorStop(1, 'rgba(249,115,22,0.4)');
      this.ctx.fillStyle = g;
      this.ctx.fillRect(0, H * 0.44, W, H * 0.13);
      return;
    }

    if (key === 'forest') {
      // 林间雾带
      this.ctx.fillStyle = 'rgba(209,250,229,0.10)';
      for (let i = 0; i < 3; i++) {
        const y = H * (0.42 + i * 0.045);
        const x = Math.sin(this.t * 0.3 + i) * 20;
        this.ctx.fillRect(x + i * W * 0.3 - 40, y, W * 0.6, 6);
      }
      return;
    }

    if (key === 'peak') {
      // 风中气流线
      this.ctx.strokeStyle = 'rgba(196,181,253,0.28)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = H * (0.16 + i * 0.09);
        const x = ((this.t * 40 + i * 90) % (W + 60)) - 30;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + 26, y - 3);
        this.ctx.stroke();
      }
    }
  }

  // ================= 地面 =================
  drawGround(scene) {
    const { W, H } = this;
    const c = scene.colors;
    const horizon = H * 0.58;
    const groundBot = H - 10;

    this.ctx.beginPath();
    this.ctx.moveTo(W * 0.05, horizon);
    this.ctx.lineTo(W * 0.95, horizon);
    this.ctx.lineTo(W, groundBot);
    this.ctx.lineTo(0, groundBot);
    this.ctx.closePath();

    const grd = this.ctx.createLinearGradient(0, horizon, 0, groundBot);
    grd.addColorStop(0, c.groundTop);
    grd.addColorStop(0.5, c.groundBot);
    grd.addColorStop(1, c.groundDark);
    this.ctx.fillStyle = grd;
    this.ctx.fill();

    // 透视网格
    this.ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    this.ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const y = horizon + (groundBot - horizon) * t;
      const leftX = W * 0.05 * (1 - t);
      const rightX = W - W * 0.05 * (1 - t);
      this.ctx.beginPath();
      this.ctx.moveTo(leftX, y);
      this.ctx.lineTo(rightX, y);
      this.ctx.stroke();
    }

    // 场景专属地面细节
    if (scene.key === 'forest') {
      this.ctx.fillStyle = shade(c.groundDark, 0.7);
      for (let i = 0; i < 9; i++) {
        const x = W * (0.08 + i * 0.1);
        const y = horizon + (groundBot - horizon) * (0.3 + (i % 3) * 0.25);
        this.ctx.fillRect(x, y, 6, 1);
        this.ctx.fillRect(x + 2, y - 3, 1, 3);
      }
    } else if (scene.key === 'volcano') {
      this.ctx.strokeStyle = 'rgba(251,146,60,0.55)';
      this.ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = horizon + (groundBot - horizon) * (0.3 + i * 0.18);
        this.ctx.beginPath();
        this.ctx.moveTo(W * (0.1 + i * 0.2), y);
        this.ctx.lineTo(W * (0.24 + i * 0.2), y + 4);
        this.ctx.lineTo(W * (0.34 + i * 0.2), y + 2);
        this.ctx.stroke();
      }
    } else if (scene.key === 'peak') {
      this.ctx.fillStyle = 'rgba(255,255,255,0.14)';
      for (let i = 0; i < 6; i++) {
        const x = W * (0.12 + i * 0.15);
        const y = horizon + (groundBot - horizon) * 0.55;
        this.ctx.fillRect(x, y, 10, 2);
      }
    }
  }

  // ================= 近景 =================
  drawNear(scene) {
    const { W, H } = this;
    const c = scene.colors;
    if (scene.key === 'forest') {
      this.ctx.fillStyle = shade(c.groundDark, 0.5);
      this.ctx.fillRect(0, H - 26, 30, 26);
      this.ctx.fillRect(W - 30, H - 22, 30, 22);
      this.ctx.fillStyle = shade(c.groundDark, 0.7);
      for (let i = 0; i < 5; i++) {
        this.ctx.fillRect(4 + i * 6, H - 34 - (i % 3) * 5, 2, 10);
        this.ctx.fillRect(W - 8 - i * 6, H - 30 - (i % 2) * 6, 2, 10);
      }
    } else if (scene.key === 'cavern') {
      this.ctx.fillStyle = shade(c.groundDark, 0.6);
      for (let i = 0; i < 4; i++) {
        const x = i * (W / 4) + 6;
        this.ctx.fillRect(x, H - 16 - (i % 2) * 8, 10, 16 + (i % 2) * 8);
      }
    }
  }

  // ================= 粒子 =================
  initParticles(key) {
    const { W, H } = this;
    const counts = { forest: 18, volcano: 24, lake: 16, peak: 18, cavern: 22 };
    const n = counts[key] ?? 14;
    this.particles = [];
    for (let i = 0; i < n; i++) this.particles.push(this.makeParticle(key, true));
  }

  makeParticle(key, initial) {
    const { W, H } = this;
    const p = {
      x: Math.random() * W,
      y: Math.random() * H,
      ph: Math.random() * Math.PI * 2,
      sp: 0.3 + Math.random() * 0.7,
      size: 1 + Math.round(Math.random() * 2),
      col: '#ffffff',
    };
    if (key === 'forest') {
      p.y = initial ? H * (0.18 + Math.random() * 0.5) : H * (0.2 + Math.random() * 0.45);
      p.col = Math.random() < 0.5 ? '#d9f99d' : '#fef08a';
    } else if (key === 'volcano') {
      p.y = initial ? Math.random() * H * 0.7 : H * 0.62 + Math.random() * H * 0.32;
      p.col = Math.random() < 0.5 ? '#fb923c' : '#fde047';
      p.sp = 0.15 + Math.random() * 0.35;
    } else if (key === 'lake') {
      p.y = initial ? H * 0.12 + Math.random() * H * 0.5 : H * 0.62;
      p.col = 'rgba(224,242,254,0.85)';
      p.sp = 0.1 + Math.random() * 0.22;
    } else if (key === 'peak') {
      p.y = Math.random() * H * 0.52;
      p.col = Math.random() < 0.5 ? '#fde047' : '#c4b5fd';
      p.sp = 0.2 + Math.random() * 0.6;
    } else if (key === 'cavern') {
      p.y = Math.random() * H * 0.6;
      p.col = Math.random() < 0.5 ? '#c4b5fd' : '#a78bfa';
      p.sp = 0.05 + Math.random() * 0.12;
    }
    return p;
  }

  updateParticles(dt) {
    const { W, H } = this;
    const key = this.scene?.key;
    for (const p of this.particles) {
      p.ph += dt * 2;
      if (key === 'volcano') {
        p.y -= p.sp * 46 * dt;
        p.x += Math.sin(p.ph * 0.6) * 8 * dt;
        if (p.y < H * 0.16) { p.y = H * 0.95; p.x = Math.random() * W; }
      } else if (key === 'lake') {
        p.y -= p.sp * 30 * dt;
        if (p.y < H * 0.52) { p.y = H * 0.95; p.x = Math.random() * W; }
      } else if (key === 'forest') {
        p.x += Math.sin(p.ph * 0.5) * 10 * dt;
        p.y += Math.cos(p.ph * 0.4) * 8 * dt;
      } else if (key === 'cavern') {
        p.x += Math.sin(p.ph * 0.3) * 6 * dt;
        p.y += Math.cos(p.ph * 0.25) * 4 * dt;
      } else if (key === 'peak') {
        p.x += p.sp * 12 * dt;
        if (p.x > W + 4) p.x = -4;
      }
      p.x = clamp(p.x, -8, W + 8);
      p.y = clamp(p.y, 0, H);
    }

    // 雷峰：随机闪电
    if (key === 'peak') {
      this.nextFlash -= dt;
      if (this.nextFlash <= 0) { this.flash = 1; this.nextFlash = 3 + Math.random() * 5; }
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
    }
  }

  drawParticles() {
    const key = this.scene?.key;
    const { W, H } = this;
    for (const p of this.particles) {
      const a = 0.5 + Math.sin(p.ph) * 0.4;
      this.ctx.globalAlpha = clamp(a, 0.12, 0.95);
      this.ctx.fillStyle = p.col;
      this.ctx.fillRect(Math.round(p.x), Math.round(p.y), key === 'peak' ? 2 : p.size, key === 'peak' ? 1 : p.size);
    }
    this.ctx.globalAlpha = 1;

    if (key === 'peak' && this.flash > 0) {
      this.ctx.fillStyle = `rgba(253,224,71,${this.flash * 0.35})`;
      this.ctx.fillRect(0, 0, W, H * 0.58);
      this.ctx.strokeStyle = `rgba(255,255,255,${this.flash})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      const x = W * 0.3;
      this.ctx.moveTo(x, H * 0.05);
      this.ctx.lineTo(x + 10, H * 0.14);
      this.ctx.lineTo(x + 2, H * 0.15);
      this.ctx.lineTo(x + 14, H * 0.26);
      this.ctx.stroke();
    }
  }

  /** 每只精灵在 2.5D 地板上的像素位置 */
  computePetPositions(pets) {
    const { W, H } = this;
    const n = pets.length;
    const positions = [];
    const depths = n <= 1 ? [0.5] : linspace(0.22, 0.78, n);
    pets.forEach((pet, i) => {
      const t = depths[i];
      const horizon = H * 0.58;
      const groundBot = H - 10;
      const y = horizon + (groundBot - horizon) * t;
      const jitter = (Math.random() - 0.5) * 0.15;
      const baseX = 0.5 + (i - (n - 1) / 2) * 0.14;
      const x = W * clamp(baseX + jitter, 0.1, 0.9);
      positions.push({ petId: pet.id, x, y, depth: t });
    });
    return positions.sort((a, b) => a.depth - b.depth);
  }

  /** depth 0 → 0.55 倍, depth 1 → 1.1 倍 */
  static depthToScale(depth) { return 0.55 + depth * 0.55; }
}
