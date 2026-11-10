/**
 * Canvas 2.5D 场景渲染
 * - 天空渐变
 * - 等腰梯形地板 + 水平透视网格线
 * - 远景装饰（太阳/月亮 + 云斑）
 * 精灵 DOM 由 sprites.js + 绝对定位负责，renderer 只画背景
 */

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function linspace(a, b, n) {
  if (n === 1) return [(a + b) / 2];
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(a + (b - a) * (i / (n - 1)));
  return arr;
}

export class SceneRenderer {
  constructor(canvas, petLayer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.petLayer = petLayer;
    this.resize();
    window.addEventListener('resize', () => this.resize());
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

  drawScene(scene, timeOfDay = 'day') {
    const { W, H } = this;
    const c = scene.colors;

    // 1. 天空渐变
    const sky = this.ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, c.skyTop);
    sky.addColorStop(1, c.skyBot);
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, W, H * 0.55);

    // 2. 远景装饰
    this.drawDecor(scene, timeOfDay);

    // 3. 地平线
    this.ctx.fillStyle = scene.key === 'forest' ? '#0a3a2a' : c.groundDark;
    this.ctx.fillRect(0, H * 0.55, W, 2);

    // 4. 等腰梯形 2.5D 地板
    this.drawGround(scene);
  }

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

    // 水平透视网格线
    this.ctx.strokeStyle = 'rgba(0,0,0,0.18)';
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
  }

  drawDecor(scene, timeOfDay) {
    const { W, H } = this;
    const c = scene.colors;
    const key = scene.key;

    if (key === 'cavern') {
      // 洞穴：无太阳，顶部垂下钟乳石 + 发光水晶
      this.ctx.fillStyle = c.groundDark;
      for (let i = 0; i < 5; i++) {
        const x = W * (0.1 + i * 0.2);
        const len = 14 + (i % 3) * 8;
        this.ctx.beginPath();
        this.ctx.moveTo(x - 6, 0); this.ctx.lineTo(x + 6, 0); this.ctx.lineTo(x, len);
        this.ctx.closePath(); this.ctx.fill();
      }
      this.ctx.fillStyle = c.accent;
      [[0.2, 0.4], [0.7, 0.35], [0.45, 0.48]].forEach(([fx, fy]) => {
        this.ctx.beginPath();
        this.ctx.moveTo(W * fx, H * fy - 6);
        this.ctx.lineTo(W * fx + 4, H * fy);
        this.ctx.lineTo(W * fx, H * fy + 6);
        this.ctx.lineTo(W * fx - 4, H * fy);
        this.ctx.closePath(); this.ctx.fill();
      });
      return;
    }

    // 太阳 / 月亮
    this.ctx.fillStyle = timeOfDay === 'night' ? '#e5e7eb' : c.accent;
    this.ctx.beginPath();
    this.ctx.arc(W * 0.85, H * 0.12, 10, 0, Math.PI * 2);
    this.ctx.fill();

    if (key === 'volcano') {
      // 火山：远处火山剪影 + 漂浮火星
      this.ctx.fillStyle = c.groundDark;
      this.ctx.beginPath();
      this.ctx.moveTo(W * 0.05, H * 0.55);
      this.ctx.lineTo(W * 0.3, H * 0.3);
      this.ctx.lineTo(W * 0.55, H * 0.55);
      this.ctx.closePath(); this.ctx.fill();
      this.ctx.fillStyle = '#fb923c';
      [[0.25, 0.4], [0.5, 0.3], [0.65, 0.45], [0.15, 0.25]].forEach(([fx, fy]) => {
        this.ctx.fillRect(W * fx, H * fy, 3, 3);
      });
      return;
    }

    if (key === 'lake') {
      // 湖泊：太阳倒影 + 云朵
      this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
      this.ctx.beginPath();
      this.ctx.ellipse(W * 0.85, H * 0.53, 14, 3, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (key === 'peak') {
      // 雷峰：闪电符号
      this.ctx.fillStyle = '#fde047';
      this.ctx.beginPath();
      this.ctx.moveTo(W * 0.2, H * 0.06);
      this.ctx.lineTo(W * 0.23, H * 0.14);
      this.ctx.lineTo(W * 0.2, H * 0.13);
      this.ctx.lineTo(W * 0.24, H * 0.22);
      this.ctx.lineTo(W * 0.22, H * 0.14);
      this.ctx.lineTo(W * 0.25, H * 0.13);
      this.ctx.closePath(); this.ctx.fill();
    }

    // 通用云 / 雾
    this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
    this.ctx.beginPath();
    this.ctx.ellipse(W * 0.15, H * 0.18, 30, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(W * 0.55, H * 0.1, 22, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();
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
