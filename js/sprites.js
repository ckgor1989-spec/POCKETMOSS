/**
 * 像素精灵 v4 —— 48×48 参数化像素绘制
 * 风格目标：宝可梦 GBA 精灵 —— 彩色描边 + 4 阶明暗 + 眼白高光 + 干净剪影
 *
 * 绘制流程：
 *   1. 每只精灵用几何基元（椭圆/三角/胶囊/矩形）铺出"色块蒙版"
 *   2. 自动生成描边（蒙版外 1px，取阴影色压暗）
 *   3. 按左上打光生成 4 阶明暗（高光 / 本体 / 阴影 / 深阴影）
 *   4. 眼睛内部自动点白高光
 */

const G = 48;
const EMPTY = '.';

const inB = (x, y) => x >= 0 && y >= 0 && x < G && y < G;
const idx = (x, y) => y * G + x;

// ===== 颜色工具 =====
function hexRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(hex, target, t) {
  const [r, g, b] = hexRgb(hex);
  const [tr, tg, tb] = hexRgb(target);
  const f = v => Math.round(v);
  return `rgb(${f(r + (tr - r) * t)},${f(g + (tg - g) * t)},${f(b + (tb - b) * t)})`;
}
const lighten = (hex, t) => mix(hex, '#ffffff', t);
const darken = (hex, t) => mix(hex, '#000000', t);

// ===== 基元填充 =====
function fillEllipse(g, cx, cy, rx, ry, ch) {
  const x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(G - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(G - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const nx = (x + 0.5 - cx) / rx;
      const ny = (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) g[idx(x, y)] = ch;
    }
  }
}

function fillRect(g, x, y, w, h, ch) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (inB(xx, yy)) g[idx(xx, yy)] = ch;
    }
  }
}

function fillTri(g, ax, ay, bx, by, cx, cy, ch) {
  const minX = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
  const maxX = Math.min(G - 1, Math.ceil(Math.max(ax, bx, cx)));
  const minY = Math.max(0, Math.floor(Math.min(ay, by, cy)));
  const maxY = Math.min(G - 1, Math.ceil(Math.max(ay, by, cy)));
  const sign = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5, py = y + 0.5;
      const d1 = sign(px, py, ax, ay, bx, by);
      const d2 = sign(px, py, bx, by, cx, cy);
      const d3 = sign(px, py, cx, cy, ax, ay);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) g[idx(x, y)] = ch;
    }
  }
}

function fillCapsule(g, x1, y1, x2, y2, r, ch) {
  const minX = Math.max(0, Math.floor(Math.min(x1, x2) - r));
  const maxX = Math.min(G - 1, Math.ceil(Math.max(x1, x2) + r));
  const minY = Math.max(0, Math.floor(Math.min(y1, y2) - r));
  const maxY = Math.min(G - 1, Math.ceil(Math.max(y1, y2) + r));
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5 - x1, py = y + 0.5 - y1;
      let t = (px * dx + py * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const ex = px - dx * t, ey = py - dy * t;
      if (ex * ex + ey * ey <= r * r) g[idx(x, y)] = ch;
    }
  }
}

// ===== 画笔 =====
function makePainter(g) {
  return {
    ellipse: (cx, cy, rx, ry, ch = 'b') => fillEllipse(g, cx, cy, rx, ry, ch),
    rect: (x, y, w, h, ch = 'b') => fillRect(g, x, y, w, h, ch),
    tri: (ax, ay, bx, by, cx, cy, ch = 'b') => fillTri(g, ax, ay, bx, by, cx, cy, ch),
    capsule: (x1, y1, x2, y2, r, ch = 'b') => fillCapsule(g, x1, y1, x2, y2, r, ch),
    px: (x, y, ch = 'b') => { if (inB(x, y)) g[idx(x, y)] = ch; },
    /** 眼睛：黑瞳 + 左上角 2px 白高光 */
    eye(x, y, rx, ry = rx) {
      fillEllipse(g, x, y, rx, ry, 'e');
      const gx = Math.round(x - rx * 0.5), gy = Math.round(y - ry * 0.5);
      if (inB(gx, gy)) g[idx(gx, gy)] = 'w';
      if (inB(gx + 1, gy)) g[idx(gx + 1, gy)] = 'w';
    },
    /** 眼下的 3px 腮红 */
    blush(x, y) {
      for (let i = -1; i <= 1; i++) {
        if (inB(x + i, y)) g[idx(x + i, y)] = 'k';
      }
    },
    /** 弧线（w 正数向下微笑，负数向上眯眼） */
    arc(cx, cy, half, depth, ch = 'e') {
      for (let i = -half; i <= half; i++) {
        const x = Math.round(cx + i);
        const y = Math.round(cy + depth * (1 - (i / half) ** 2));
        if (inB(x, y)) g[idx(x, y)] = ch;
      }
    },
  };
}

// ===== 15 只精灵的造型定义 =====
const SPECIES = {
  // 苔藓兽：圆胖苔藓团，头顶双嫩芽
  blob(p) {
    p.ellipse(15, 42, 6, 4);
    p.ellipse(33, 42, 6, 4);
    p.ellipse(24, 29, 16, 15);
    p.rect(23, 10, 2, 5, 'A');
    p.tri(23, 13, 12, 3, 17, 15, 'A');
    p.tri(25, 13, 36, 3, 31, 15, 'A');
    p.ellipse(24, 38, 9, 5.5, 'A');
    p.eye(18, 27, 3.2, 3.8);
    p.eye(30, 27, 3.2, 3.8);
    p.blush(14, 32);
    p.blush(34, 32);
    p.arc(24, 34, 4, 1.6);
  },
  // 蘑菇灵：宽菌盖白斑 + 圆菌柄
  mushroom(p) {
    p.ellipse(13, 35, 4, 3);
    p.ellipse(35, 35, 4, 3);
    p.ellipse(24, 33, 9, 10);
    p.ellipse(24, 17, 18, 12);
    p.ellipse(13, 13, 3.5, 2.5, 'w');
    p.ellipse(25, 10, 4, 2.5, 'w');
    p.ellipse(34, 17, 2.6, 2, 'w');
    p.ellipse(19, 20, 2.4, 1.8, 'w');
    p.eye(20, 32, 3, 3.4);
    p.eye(28, 32, 3, 3.4);
    p.blush(15, 37);
    p.blush(33, 37);
    p.arc(24, 38, 3, 1.2);
  },
  // 藤叶精：方身 + 两片斜出的叶子
  leafy(p) {
    p.ellipse(16, 43, 5, 3);
    p.ellipse(32, 43, 5, 3);
    p.ellipse(24, 31, 12, 13);
    p.tri(25, 17, 9, 4, 14, 19, 'A');
    p.tri(23, 17, 39, 4, 34, 19, 'A');
    p.rect(23, 14, 2, 5, 'A');
    p.eye(19, 29, 2.8, 3.4);
    p.eye(29, 29, 2.8, 3.4);
    p.blush(15, 33);
    p.blush(33, 33);
    p.arc(24, 35, 3, 1.4);
  },
  // 炎狐：尖耳 + 白口鼻 + 蓬松尾巴
  fox(p) {
    p.capsule(36, 35, 44, 23, 4);
    p.ellipse(44, 22, 2.6, 2.6, 'w');
    p.ellipse(15, 42, 5, 3);
    p.ellipse(33, 42, 5, 3);
    p.ellipse(24, 32, 12, 11);
    p.tri(13, 13, 16, 1, 25, 12);
    p.tri(35, 13, 32, 1, 23, 12);
    p.tri(16.5, 12, 17.8, 5, 22.5, 12, 'A');
    p.tri(31.5, 12, 30.2, 5, 25.5, 12, 'A');
    p.ellipse(24, 20, 11, 10);
    p.ellipse(24, 26, 5.5, 4.5, 'w');
    p.px(23, 23, 'e');
    p.px(24, 23, 'e');
    p.eye(19, 18, 2.6, 3);
    p.eye(29, 18, 2.6, 3);
    p.blush(14, 22);
    p.blush(34, 22);
    p.ellipse(24, 36, 6, 4.5, 'A');
  },
  // 熔岩精：大团熔岩 + 发光裂纹
  lavablob(p) {
    p.ellipse(15, 42, 6, 4);
    p.ellipse(33, 42, 6, 4);
    p.ellipse(24, 30, 16, 14);
    p.capsule(17, 24, 14, 33, 0.9, 'A');
    p.capsule(31, 22, 34, 31, 0.9, 'A');
    p.capsule(21, 38, 29, 39, 0.9, 'A');
    p.eye(18, 28, 3, 3.6);
    p.eye(30, 28, 3, 3.6);
    p.arc(24, 35, 4, 1.8);
  },
  // 火星种：小圆身 + 头顶火花 + 四散火星
  spark(p) {
    p.capsule(24, 14, 24, 21, 1.1, 'A');
    p.px(24, 11, 'w'); p.px(23, 12, 'w'); p.px(25, 12, 'w');
    p.capsule(10, 18, 14, 21, 1.4, 'A');
    p.capsule(38, 18, 34, 21, 1.4, 'A');
    p.capsule(9, 37, 13, 34, 1.4, 'A');
    p.capsule(39, 37, 35, 34, 1.4, 'A');
    p.ellipse(15, 43, 4, 3);
    p.ellipse(33, 43, 4, 3);
    p.ellipse(24, 31, 11, 11);
    p.eye(20, 29, 2.6, 3.2);
    p.eye(28, 29, 2.6, 3.2);
    p.blush(16, 33);
    p.blush(32, 33);
    p.arc(24, 35, 3, 1.4);
  },
  // 水滴蛙：宽身 + 顶部大眼泡
  frog(p) {
    p.ellipse(9, 43, 6, 3.5);
    p.ellipse(39, 43, 6, 3.5);
    p.ellipse(24, 33, 16, 11);
    p.ellipse(14, 22, 7, 7);
    p.ellipse(34, 22, 7, 7);
    p.ellipse(24, 38, 9, 4.5, 'A');
    p.eye(14, 21, 2.8, 3.2);
    p.eye(34, 21, 2.8, 3.2);
    p.blush(10, 28);
    p.blush(38, 28);
    p.arc(24, 32, 8, 2);
  },
  // 水母灵：伞盖 + 四条波浪飘带
  jelly(p) {
    p.capsule(16, 30, 14, 36, 1.6);
    p.capsule(14, 36, 17, 41, 1.6);
    p.capsule(17, 41, 15, 45, 1.4);
    p.capsule(21, 31, 22, 37, 1.6);
    p.capsule(22, 37, 20, 42, 1.6);
    p.capsule(20, 42, 21, 46, 1.4);
    p.capsule(27, 31, 26, 37, 1.6);
    p.capsule(26, 37, 28, 42, 1.6);
    p.capsule(28, 42, 27, 46, 1.4);
    p.capsule(32, 30, 34, 36, 1.6);
    p.capsule(34, 36, 31, 41, 1.6);
    p.capsule(31, 41, 33, 45, 1.4);
    p.ellipse(24, 23, 14, 12);
    p.ellipse(24, 31, 14, 3.5);
    p.ellipse(16, 27, 2.2, 1.6, 'A');
    p.ellipse(32, 27, 2.2, 1.6, 'A');
    p.eye(19, 22, 2.6, 3.2);
    p.eye(29, 22, 2.6, 3.2);
  },
  // 泡泡龙：圆身侧鳍 + 头顶泡泡
  dragon(p) {
    p.capsule(35, 35, 44, 28, 3);
    p.ellipse(14, 42, 5, 3);
    p.ellipse(34, 42, 5, 3);
    p.ellipse(24, 31, 13, 12);
    p.ellipse(14, 30, 3.5, 5, 'A');
    p.ellipse(34, 30, 3.5, 5, 'A');
    p.tri(11, 27, 2, 19, 10, 37, 'A');
    p.tri(37, 27, 46, 19, 38, 37, 'A');
    p.ellipse(24, 37, 7, 4.5, 'A');
    p.tri(22, 20, 24, 13, 26, 20, 'A');
    p.eye(19, 27, 2.6, 3.2);
    p.eye(29, 27, 2.6, 3.2);
    p.arc(24, 33, 3, 1.2);
    p.ellipse(38, 11, 3, 3, 'w');
    p.ellipse(43, 5, 2, 2, 'w');
  },
  // 雷电鼠：大圆耳 + 腮红 + 卷尾
  mouse(p) {
    p.capsule(34, 37, 42, 41, 1.5);
    p.ellipse(14, 42, 4, 3);
    p.ellipse(32, 42, 4, 3);
    p.ellipse(24, 32, 12, 10);
    p.ellipse(13, 13, 6.5, 6.5);
    p.ellipse(35, 13, 6.5, 6.5);
    p.ellipse(24, 21, 12, 10);
    p.ellipse(13, 13, 3, 3, 'A');
    p.ellipse(35, 13, 3, 3, 'A');
    p.ellipse(16, 26, 2.6, 2, 'A');
    p.ellipse(32, 26, 2.6, 2, 'A');
    p.px(23, 25, 'e');
    p.px(24, 25, 'e');
    p.eye(19, 20, 2.6, 3.2);
    p.eye(29, 20, 2.6, 3.2);
    p.blush(15, 24);
    p.blush(33, 24);
    p.arc(24, 28, 2, 1);
  },
  // 云朵灵：三团云 + 飘浮
  cloud(p) {
    p.ellipse(14, 27, 9, 9);
    p.ellipse(24, 21, 11, 11);
    p.ellipse(34, 27, 9, 9);
    p.rect(9, 26, 32, 8);
    p.ellipse(10, 31, 3, 3);
    p.ellipse(38, 31, 3, 3);
    p.px(10, 19, 'w');
    p.px(11, 18, 'w');
    p.eye(20, 27, 2.6, 3.2);
    p.eye(28, 27, 2.6, 3.2);
    p.blush(16, 31);
    p.blush(32, 31);
    p.arc(24, 32, 3, 1.2);
  },
  // 闪电鸟：双翼 + 尖喙 + 冠羽
  bird(p) {
    p.capsule(24, 12, 26, 5, 2, 'A');
    p.tri(22, 41, 26, 41, 24, 46, 'A');
    p.ellipse(15, 42, 4, 3);
    p.ellipse(33, 42, 4, 3);
    p.ellipse(24, 31, 11, 10);
    p.ellipse(15, 30, 3, 5, 'A');
    p.ellipse(33, 30, 3, 5, 'A');
    p.tri(14, 28, 2, 19, 13, 37, 'A');
    p.tri(34, 28, 46, 19, 35, 37, 'A');
    p.ellipse(24, 20, 9, 8);
    p.tri(24, 21, 24, 27, 30, 24, 'A');
    p.eye(21, 18, 2.4, 3);
    p.eye(27, 18, 2.4, 3);
  },
  // 暗影蝠：展开双翼 + 尖耳 + 獠牙
  bat(p) {
    p.tri(14, 26, 2, 13, 3, 32);
    p.tri(14, 26, 3, 32, 12, 37);
    p.tri(34, 26, 46, 13, 45, 32);
    p.tri(34, 26, 45, 32, 36, 37);
    p.ellipse(15, 28, 3.5, 6);
    p.ellipse(33, 28, 3.5, 6);
    p.ellipse(24, 31, 10, 11);
    p.ellipse(16, 42, 3, 2);
    p.ellipse(32, 42, 3, 2);
    p.tri(17, 18, 16, 6, 24, 17);
    p.tri(31, 18, 32, 6, 24, 17);
    p.ellipse(24, 23, 10, 8);
    p.eye(20, 22, 2.4, 2.8);
    p.eye(28, 22, 2.4, 2.8);
    p.px(22, 27, 'w');
    p.px(26, 27, 'w');
  },
  // 梦灵：光球 + 星芒 + 眯眼
  dream(p) {
    p.ellipse(24, 27, 13, 13);
    p.ellipse(17, 39, 4, 3);
    p.ellipse(31, 39, 4, 3);
    p.px(37, 14, 'w');
    p.px(38, 13, 'w');
    p.px(11, 17, 'w');
    p.arc(20, 26, 2.5, -1.4);
    p.arc(28, 26, 2.5, -1.4);
    p.blush(17, 31);
    p.blush(31, 31);
    p.arc(24, 31, 2, 1);
  },
  // 幽灵种：圆头 + 波浪下摆
  ghost(p) {
    p.ellipse(8, 32, 4, 5);
    p.ellipse(40, 32, 4, 5);
    p.ellipse(24, 26, 13, 13);
    p.rect(11, 26, 26, 12);
    // 下摆缺口
    for (let x = 11; x <= 36; x++) {
      if ((x - 11) % 5 < 2) {
        for (let y = 34; y <= 41; y++) p.px(x, y, EMPTY);
      }
    }
    p.eye(20, 25, 3, 3.4);
    p.eye(28, 25, 3, 3.4);
    p.ellipse(24, 31, 2, 1.4, 'e');
  },
};

// 每只精灵的点缀色
const ACCENTS = {
  blob: '#86efac', mushroom: '#dc2626', leafy: '#6ee7b7',
  fox: '#fbbf24', lavablob: '#fef08a', spark: '#fef9c3',
  frog: '#dbeafe', jelly: '#e0f2fe', dragon: '#38bdf8',
  mouse: '#facc15', cloud: '#e0e7ff', bird: '#fbbf24',
  bat: '#c084fc', dream: '#c4b5fd', ghost: '#f5f3ff',
};

/** 生成色块蒙版 */
function buildMask(pet) {
  const g = new Array(G * G).fill(EMPTY);
  const fn = SPECIES[pet.shape] ?? SPECIES.blob;
  fn(makePainter(g));
  return g;
}

/** 蒙版 → 带描边与明暗的 canvas */
function renderPixelArt(pet) {
  const mask = buildMask(pet);
  const cv = document.createElement('canvas');
  cv.width = G;
  cv.height = G;
  const ctx = cv.getContext('2d');

  const body = pet.bodyColor;
  const shade = pet.shadowColor;
  const accent = ACCENTS[pet.shape] ?? lighten(body, 0.3);
  // 藏青描边：更接近宝可梦卡通的彩色墨线
  const outline = mix(darken(shade, 0.6), '#2f2b4a', 0.6);

  // 包围盒（用于左上来光的方向渐变）
  let minX = G, maxX = 0, minY = G, maxY = 0;
  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      if (mask[idx(x, y)] !== EMPTY) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  const isEdge = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (!inB(nx, ny) || mask[idx(nx, ny)] === EMPTY) return true;
      }
    }
    return false;
  };

  // 每列最顶端的实体像素（用于顶部轮廓光）
  const topY = new Array(G).fill(-1);
  for (let x = 0; x < G; x++) {
    for (let y = 0; y < G; y++) {
      if (mask[idx(x, y)] !== EMPTY) { topY[x] = y; break; }
    }
  }

  for (let y = 0; y < G; y++) {
    for (let x = 0; x < G; x++) {
      const ch = mask[idx(x, y)];
      if (ch === EMPTY) {
        // 描边：蒙版外紧贴实体的像素
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (inB(nx, ny) && mask[idx(nx, ny)] !== EMPTY) { near = true; break; }
          }
        }
        if (near) {
          ctx.fillStyle = outline;
          ctx.fillRect(x, y, 1, 1);
        }
        continue;
      }

      // 光照坐标：0 = 左上，1 = 右下
      const u = ((x - minX) / spanX + (y - minY) / spanY) / 2;
      let color;
      if (ch === 'e') {
        color = '#171423';
      } else if (ch === 'w') {
        color = u > 0.82 ? '#e9e5d6' : '#fffdf5';
      } else if (ch === 'a') {
        color = accent;
      } else if (ch === 'k') {
        color = '#ff9ab2'; // 腮红
      } else {
        const base = ch === 'A' ? accent : body;
        const dark = ch === 'A' ? darken(accent, 0.18) : shade;
        // 4 阶明暗，交界处用棋盘格抖动，贴近 GBA 像素画
        const cols = [lighten(base, 0.34), base, dark, darken(dark, 0.32)];
        const bands = [0.18, 0.56, 0.84];
        let bi = 0;
        while (bi < 3 && u >= bands[bi]) bi++;
        color = cols[bi];
        const even = ((x + y) & 1) === 0;
        if (bi < 3 && bands[bi] - u < 0.05 && even) color = cols[bi + 1];
        if (bi > 0 && u - bands[bi - 1] < 0.05 && !even) color = cols[bi - 1];
        if (y === topY[x]) color = lighten(base, 0.55);              // 顶部轮廓光
        // 轮廓内缘压暗，强化剪影
        if (y !== topY[x] && isEdge(x, y)) color = mix(color, outline, 0.5);
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

/** 场景内的大号精灵 DOM */
export function createSpriteEl(pet) {
  const root = document.createElement('div');
  root.className = 'sprite-unit';
  root.dataset.petId = pet.id;
  root.style.cssText = `
    position: absolute; width: 120px; height: 144px;
    transform: translate(-50%, -50%);
    image-rendering: pixelated;
    pointer-events: auto; cursor: pointer;
    z-index: 10;
  `;
  root.style.animationDelay = -(Math.random() * 3).toFixed(2) + 's';

  // 地板投影
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:6px;left:50%;transform:translateX(-50%);
    width:72px;height:12px;background:#2f2b4a;border-radius:50%;opacity:0.2;`;
  root.appendChild(shadow);

  // 待机浮动
  const bob = document.createElement('div');
  bob.className = 'sprite-bob';
  bob.style.cssText = 'position:absolute;bottom:16px;left:50%;transform:translateX(-50%);';
  bob.style.animationDelay = -(Math.random() * 2.6).toFixed(2) + 's';
  const cv = renderPixelArt(pet);
  cv.style.cssText = `display:block;height:120px;width:auto;image-rendering:pixelated;
    filter:drop-shadow(0 3px 0 rgba(47,43,74,0.28));`;
  bob.appendChild(cv);
  root.appendChild(bob);

  if (pet.evolved) {
    const star = document.createElement('div');
    star.style.cssText = `position:absolute;top:2px;right:8px;font-size:12px;color:#fde047;
      text-shadow:0 0 6px #f59e0b;z-index:12;`;
    star.textContent = '✦';
    root.appendChild(star);
  }

  return root;
}

/** 小尺寸复用（HUD 头像 / 孵化卡 / 图鉴格） */
export function createPetCanvas(pet) {
  return renderPixelArt(pet);
}
