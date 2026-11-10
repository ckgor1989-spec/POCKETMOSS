/**
 * 像素精灵 v5 —— 48×48 参数化像素绘制
 * 风格目标：明亮像素宠物 —— 大头短身、大眼高光、三阶平涂、统一藏青墨线
 *
 * 绘制流程：
 *   1. 几何基元（椭圆/三角/胶囊/矩形）铺出"色块蒙版"
 *   2. 蒙版外 1px 自动描边，全部统一 #2f2b4a
 *   3. 左上打光三阶平涂（亮 / 本体 / 暗），不做全画布抖动
 *   4. 眼睛内置 3px 高光 + 小反光，腮红统一 #ffb3c7
 */

const G = 48;
const EMPTY = '.';
const INK = '#2f2b4a';

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
    /** 大眼：深色椭圆 + 左上 3px 高光 + 右下 1px 反光 */
    eye(x, y, rx, ry = rx) {
      fillEllipse(g, x, y, rx, ry, 'e');
      const gx = Math.round(x - rx * 0.42), gy = Math.round(y - ry * 0.42);
      if (inB(gx, gy)) g[idx(gx, gy)] = 'w';
      if (inB(gx + 1, gy)) g[idx(gx + 1, gy)] = 'w';
      if (inB(gx, gy + 1)) g[idx(gx, gy + 1)] = 'w';
      const hx = Math.round(x + rx * 0.34), hy = Math.round(y + ry * 0.34);
      if (inB(hx, hy)) g[idx(hx, hy)] = 'w';
    },
    /** 眼下 3px 腮红 */
    blush(x, y) {
      for (let i = -1; i <= 1; i++) {
        if (inB(x + i, y)) g[idx(x + i, y)] = 'k';
      }
    },
    /** 微笑弧线（w 正数向下，负数向上眯眼） */
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
// 统一比例：头身一体化圆体，眼位于 y=20~32，脚落在 y=43，四周留 4px 安全边
const SPECIES = {
  // 苔藓兽：圆苔藓团 + 两片嫩芽
  blob(p) {
    p.ellipse(16, 43, 5, 3);
    p.ellipse(32, 43, 5, 3);
    p.rect(23, 11, 2, 7, 'A');
    p.ellipse(19, 10, 4.2, 3.2, 'A');
    p.ellipse(29, 10, 4.2, 3.2, 'A');
    p.ellipse(24, 28, 14, 14);
    p.eye(19, 26, 3.2, 3.8);
    p.eye(29, 26, 3.2, 3.8);
    p.blush(14, 32);
    p.blush(34, 32);
    p.arc(24, 33, 3, 1.2);
  },
  // 蘑菇灵：宽菌盖白斑 + 圆菌柄
  mushroom(p) {
    p.ellipse(16, 43, 4, 3);
    p.ellipse(32, 43, 4, 3);
    p.ellipse(24, 34, 10, 10);
    p.ellipse(24, 27, 10, 8);
    p.eye(20, 32, 3, 3.4);
    p.eye(28, 32, 3, 3.4);
    p.blush(16, 36);
    p.blush(32, 36);
    p.arc(24, 37, 2.5, 1);
    p.ellipse(24, 19, 17, 12);
    p.ellipse(13, 14, 3.2, 2.4, 'w');
    p.ellipse(25, 11, 3.6, 2.4, 'w');
    p.ellipse(33, 18, 2.6, 1.8, 'w');
    p.ellipse(17, 21, 2.2, 1.6, 'w');
  },
  // 藤叶精：圆身 + 两片斜出的叶子
  leafy(p) {
    p.ellipse(16, 43, 5, 3);
    p.ellipse(32, 43, 5, 3);
    p.tri(24, 16, 9, 4, 16, 20, 'A');
    p.tri(24, 16, 39, 4, 32, 20, 'A');
    p.rect(23, 13, 2, 7, 'A');
    p.ellipse(24, 29, 13, 13);
    p.eye(19, 27, 3, 3.6);
    p.eye(29, 27, 3, 3.6);
    p.blush(15, 33);
    p.blush(33, 33);
    p.arc(24, 34, 3, 1.2);
  },
  // 炎狐：尖耳 + 白口鼻 + 蓬松尾巴
  fox(p) {
    p.capsule(34, 37, 43, 27, 3.4);
    p.ellipse(44, 25, 2.4, 2.4, 'w');
    p.ellipse(16, 43, 5, 3);
    p.ellipse(32, 43, 5, 3);
    p.ellipse(24, 35, 10, 8);
    p.ellipse(24, 22, 13, 12);
    p.tri(13, 17, 10, 4, 24, 15);
    p.tri(35, 17, 38, 4, 24, 15);
    p.tri(15, 15, 14, 7, 21, 15, 'A');
    p.tri(33, 15, 34, 7, 27, 15, 'A');
    p.ellipse(24, 28, 5.4, 3.8, 'w');
    p.px(23, 26, 'e');
    p.px(24, 26, 'e');
    p.eye(19, 21, 2.8, 3.2);
    p.eye(29, 21, 2.8, 3.2);
    p.blush(14, 25);
    p.blush(34, 25);
  },
  // 熔岩精：大团熔岩 + 头顶小火苗
  lavablob(p) {
    p.ellipse(15, 43, 6, 4);
    p.ellipse(33, 43, 6, 4);
    p.tri(24, 8, 20, 17, 28, 17, 'A');
    p.ellipse(24, 29, 15, 14);
    p.capsule(16, 25, 13, 33, 0.9, 'A');
    p.capsule(32, 24, 34, 32, 0.9, 'A');
    p.eye(18, 28, 3, 3.6);
    p.eye(30, 28, 3, 3.6);
    p.blush(14, 34);
    p.blush(34, 34);
    p.arc(24, 35, 3.5, 1.4);
  },
  // 火星种：小圆身 + 头顶火花
  spark(p) {
    p.ellipse(16, 43, 4, 3);
    p.ellipse(32, 43, 4, 3);
    p.capsule(24, 15, 24, 20, 1.2, 'A');
    p.px(24, 10, 'w');
    p.px(23, 11, 'w');
    p.px(25, 11, 'w');
    p.px(24, 12, 'w');
    p.px(24, 13, 'w');
    p.ellipse(24, 30, 11, 11);
    p.eye(20, 29, 2.8, 3.4);
    p.eye(28, 29, 2.8, 3.4);
    p.blush(16, 34);
    p.blush(32, 34);
    p.arc(24, 35, 2.5, 1);
    p.px(9, 21, 'w');
    p.px(39, 23, 'w');
    p.px(11, 38, 'w');
    p.px(37, 37, 'w');
  },
  // 水滴蛙：宽身 + 顶部大眼泡
  frog(p) {
    p.ellipse(7, 43, 5, 3);
    p.ellipse(41, 43, 5, 3);
    p.ellipse(24, 33, 16, 11);
    p.ellipse(14, 22, 7.5, 7.5);
    p.ellipse(34, 22, 7.5, 7.5);
    p.ellipse(24, 38, 8, 3.5, 'A');
    p.eye(14, 21, 3, 3.4);
    p.eye(34, 21, 3, 3.4);
    p.blush(8, 28);
    p.blush(40, 28);
    p.arc(24, 32, 5, 1.8);
  },
  // 水母灵：伞盖 + 四条波浪飘带
  jelly(p) {
    p.capsule(17, 31, 15, 38, 1.5);
    p.capsule(15, 38, 17, 44, 1.5);
    p.capsule(22, 31, 21, 38, 1.5);
    p.capsule(21, 38, 22, 44, 1.5);
    p.capsule(27, 31, 28, 38, 1.5);
    p.capsule(28, 38, 26, 44, 1.5);
    p.capsule(32, 31, 34, 38, 1.5);
    p.capsule(34, 38, 32, 44, 1.5);
    p.ellipse(24, 23, 14, 12);
    p.ellipse(24, 31, 14, 3);
    p.ellipse(17, 26, 2.4, 1.6, 'A');
    p.ellipse(31, 26, 2.4, 1.6, 'A');
    p.eye(19, 22, 2.8, 3.4);
    p.eye(29, 22, 2.8, 3.4);
    p.arc(24, 28, 2, 0.8);
  },
  // 泡泡龙：圆身侧鳍 + 头顶泡泡
  dragon(p) {
    p.capsule(36, 36, 44, 30, 3);
    p.ellipse(14, 43, 5, 3);
    p.ellipse(34, 43, 5, 3);
    p.tri(12, 28, 2, 20, 10, 38, 'A');
    p.tri(36, 28, 46, 20, 38, 38, 'A');
    p.tri(24, 17, 21, 9, 27, 17, 'A');
    p.ellipse(24, 33, 13, 11);
    p.ellipse(24, 38, 7, 4, 'A');
    p.eye(19, 30, 2.8, 3.4);
    p.eye(29, 30, 2.8, 3.4);
    p.arc(24, 35, 2.5, 1);
    p.ellipse(40, 12, 3, 3, 'w');
    p.ellipse(44, 6, 2, 2, 'w');
  },
  // 雷电鼠：大圆耳 + 腮红 + 卷尾
  mouse(p) {
    p.ellipse(14, 43, 4, 3);
    p.ellipse(32, 43, 4, 3);
    p.capsule(33, 38, 41, 42, 1.4);
    p.ellipse(24, 34, 10, 8);
    p.ellipse(13, 12, 6.5, 6.5);
    p.ellipse(35, 12, 6.5, 6.5);
    p.ellipse(24, 21, 12, 11);
    p.ellipse(13, 12, 3, 3, 'A');
    p.ellipse(35, 12, 3, 3, 'A');
    p.eye(19, 20, 2.8, 3.2);
    p.eye(29, 20, 2.8, 3.2);
    p.blush(15, 25);
    p.blush(33, 25);
    p.px(23, 26, 'e');
    p.px(24, 26, 'e');
    p.arc(24, 29, 2, 1);
  },
  // 云朵灵：三团云 + 飘浮
  cloud(p) {
    p.ellipse(12, 29, 9, 8);
    p.ellipse(36, 29, 9, 8);
    p.ellipse(24, 25, 11, 10);
    p.rect(9, 28, 30, 7);
    p.ellipse(24, 36, 12, 3);
    p.px(38, 15, 'w');
    p.px(39, 14, 'w');
    p.eye(20, 29, 2.8, 3.2);
    p.eye(28, 29, 2.8, 3.2);
    p.blush(16, 33);
    p.blush(32, 33);
    p.arc(24, 34, 2.5, 1);
  },
  // 闪电鸟：双翼 + 尖喙 + 冠羽
  bird(p) {
    p.ellipse(16, 43, 4, 3);
    p.ellipse(32, 43, 4, 3);
    p.tri(13, 30, 3, 22, 12, 38, 'A');
    p.tri(35, 30, 45, 22, 36, 38, 'A');
    p.ellipse(24, 34, 10, 9);
    p.ellipse(24, 22, 10, 9);
    p.capsule(24, 14, 25, 7, 1.8, 'A');
    p.tri(24, 22, 24, 27, 31, 25, 'A');
    p.eye(20, 21, 2.6, 3);
    p.eye(28, 21, 2.6, 3);
    p.blush(17, 26);
    p.blush(31, 26);
  },
  // 暗影蝠：展开双翼 + 尖耳 + 獠牙
  bat(p) {
    p.tri(16, 27, 1, 12, 4, 34);
    p.tri(4, 34, 16, 27, 11, 38);
    p.tri(32, 27, 47, 12, 44, 34);
    p.tri(44, 34, 32, 27, 37, 38);
    p.ellipse(16, 43, 4, 3);
    p.ellipse(32, 43, 4, 3);
    p.tri(16, 19, 15, 6, 24, 17);
    p.tri(32, 19, 33, 6, 24, 17);
    p.ellipse(24, 31, 11, 12);
    p.ellipse(24, 23, 10, 8);
    p.eye(20, 22, 2.6, 3);
    p.eye(28, 22, 2.6, 3);
    p.px(22, 28, 'w');
    p.px(26, 28, 'w');
    p.arc(24, 27, 1.5, 0.6);
  },
  // 梦灵：光球 + 星芒 + 眯眼
  dream(p) {
    p.ellipse(13, 40, 4, 3);
    p.ellipse(35, 40, 4, 3);
    p.ellipse(24, 27, 13, 13);
    p.arc(19, 26, 3, -1.6);
    p.arc(29, 26, 3, -1.6);
    p.blush(16, 31);
    p.blush(32, 31);
    p.arc(24, 33, 3, 1);
    p.px(38, 13, 'w');
    p.px(39, 12, 'w');
    p.px(10, 17, 'w');
  },
  // 幽灵种：圆头 + 波浪下摆
  ghost(p) {
    p.ellipse(8, 31, 4, 5);
    p.ellipse(40, 31, 4, 5);
    p.ellipse(24, 26, 14, 13);
    p.rect(10, 27, 28, 10);
    // 下摆缺口
    for (let x = 10; x <= 37; x++) {
      if ((x - 10) % 6 < 2) {
        for (let y = 36; y <= 41; y++) p.px(x, y, EMPTY);
      }
    }
    p.eye(19, 25, 3, 3.6);
    p.eye(29, 25, 3, 3.6);
    p.blush(15, 30);
    p.blush(33, 30);
    p.ellipse(24, 31, 1.6, 1.2, 'e');
  },
};

// 每只精灵的点缀色
const ACCENTS = {
  blob: '#86efac', mushroom: '#e35d5d', leafy: '#6ee7b7',
  fox: '#fbbf24', lavablob: '#ffd166', spark: '#fff3b0',
  frog: '#bfe3ff', jelly: '#dcefff', dragon: '#4cc9f0',
  mouse: '#facc15', cloud: '#e6ecff', bird: '#ffd166',
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
          ctx.fillStyle = INK;
          ctx.fillRect(x, y, 1, 1);
        }
        continue;
      }

      // 光照坐标：0 = 左上，1 = 右下
      const u = ((x - minX) / spanX + (y - minY) / spanY) / 2;
      let color;
      if (ch === 'e') {
        color = '#201c33';
      } else if (ch === 'w') {
        color = '#fffdf8';
      } else if (ch === 'a') {
        color = accent;
      } else if (ch === 'k') {
        color = '#ffb3c7';
      } else {
        const base = ch === 'A' ? accent : body;
        const dark = ch === 'A' ? darken(accent, 0.18) : shade;
        const hi = lighten(base, 0.30);
        const lo = darken(dark, 0.10);
        // 三阶平涂：亮 / 本体 / 暗
        color = u < 0.32 ? hi : (u > 0.70 ? lo : base);
        // 顶部 2px 轮廓光
        if (y - topY[x] < 2) color = lighten(base, 0.46);
        // 内缘压暗，强化剪影
        if (y - topY[x] >= 2 && isEdge(x, y)) color = mix(color, INK, 0.32);
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
    position: absolute; width: 104px; height: 118px;
    transform: translate(-50%, -50%);
    image-rendering: pixelated;
    pointer-events: auto; cursor: pointer;
    z-index: 10;
  `;
  root.style.animationDelay = -(Math.random() * 3).toFixed(2) + 's';

  // 地板投影：与精灵同宽 52%，不随浮动位移
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
    width:54px;height:9px;background:#2f2b4a;border-radius:50%;opacity:0.16;`;
  root.appendChild(shadow);

  // 待机浮动（内层，避免覆盖定位 transform）
  const bob = document.createElement('div');
  bob.className = 'sprite-bob';
  bob.style.cssText = 'position:absolute;bottom:9px;left:50%;transform:translateX(-50%);';
  bob.style.animationDelay = -(Math.random() * 2.6).toFixed(2) + 's';
  const cv = renderPixelArt(pet);
  cv.style.cssText = `display:block;height:104px;width:auto;image-rendering:pixelated;`;
  bob.appendChild(cv);
  root.appendChild(bob);

  if (pet.evolved) {
    const star = document.createElement('div');
    star.style.cssText = `position:absolute;top:0;right:10px;font-size:11px;color:#f5a524;
      text-shadow:0 0 0 #2f2b4a;z-index:12;`;
    star.textContent = '✦';
    root.appendChild(star);
  }

  return root;
}

/** 小尺寸复用（HUD 头像 / 孵化卡 / 图鉴格） */
export function createPetCanvas(pet) {
  return renderPixelArt(pet);
}
