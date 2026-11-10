/**
 * 像素精灵 —— 每只精灵由 16×16 字符点阵绘制到 canvas
 * 记号：. 透明 / o 描边 / b 本体 / s 阴影 / h 高光 / w 白 / e 眼 / a 点缀色
 * 每行字符串长度不必一致，渲染时统一右补 '.' 居中
 */

// ===== 调色辅助 =====
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

// 每只精灵的点缀色（'a'）
const ACCENTS = {
  blob: '#86efac', mushroom: '#dc2626', leafy: '#6ee7b7',
  fox: '#fbbf24', lavablob: '#fef08a', spark: '#fef9c3',
  frog: '#dbeafe', jelly: '#e0f2fe', dragon: '#38bdf8',
  mouse: '#facc15', cloud: '#e0e7ff', bird: '#fbbf24',
  bat: '#c084fc', dream: '#c4b5fd', ghost: '#f5f3ff',
};

// ===== 15 只精灵点阵 =====
const PIXEL_MAPS = {
  // 苔藓兽：圆润苔藓团 + 头顶嫩芽
  blob: [
    '................',
    '.......oo.......',
    '......oaao......',
    '.....oaaaao.....',
    '......oooo......',
    '...oooooooooo...',
    '..obhhhhhhhhbo..',
    '.obhhhhhhhhhhbo.',
    '.obhhbeebeebhbo.',
    '.obhbbbbbbbbhbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbboobbbbbo.',
    '..obbbssssbbbo..',
    '...oooooooooo...',
    '................',
    '................',
  ],
  // 蘑菇灵：红斑白点菌盖 + 菌柄脸
  mushroom: [
    '................',
    '.....oooooo.....',
    '...oowwwwaaoo...',
    '..owwaawwwwwoo..',
    '.owwaaaawwwwwoo.',
    '.owaaaaaaawwwoo.',
    '.owaaaaaaaaawwo.',
    '..owaaaaaaawwo..',
    '...oowwaawwoo...',
    '.....obbbbo.....',
    '.....obeebo.....',
    '.....obbbbo.....',
    '.....obbbbo.....',
    '....oobbbboo....',
    '....oobbbboo....',
    '.....oooooo.....',
  ],
  // 藤叶精：两侧叶片 + 方形身体
  leafy: [
    '................',
    '....o......o....',
    '...oao....oao...',
    '...oao....oao...',
    '....oo....oo....',
    '...oooooooooo...',
    '..obhhhhhhhhbo..',
    '.obhhhbbbbhhhbo.',
    '.obhhbeebeebhbo.',
    '.obhbbbbbbbbhbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '....o.o..o.o....',
    '................',
  ],
  // 炎狐：尖耳 + 白色口鼻 + 尾巴
  fox: [
    '..oo........oo..',
    '..oao......oao..',
    '..oaao....oaao..',
    '..oaaooooooaao..',
    '..obhhhhhhhhbo..',
    '.obhhhbbbbhhhbo.',
    '.obhhbeebeebhbo.',
    '.obhbbbbbbbbhbo.',
    '.obbbbwwwwbbbbo.',
    '.obbbbweebbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...oooooooooo...',
    '.......sssss....',
    '......sssss.....',
    '.....ooo........',
  ],
  // 熔岩精：躯体带发光裂纹
  lavablob: [
    '................',
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '.obbbabbbabbbbo.',
    '.obbbbaaaabbbbo.',
    '.obbbeebeebbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbaaabbbbbo.',
    '..obbbbbbbbbbo..',
    '...oobbbbbboo...',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
  // 火星种：圆球 + 四散火星
  spark: [
    '................',
    '................',
    '......a...a.....',
    '...a..oo..a.....',
    '......oo........',
    '....oooooo......',
    '...obhhhhbo.....',
    '..obbeebbbbo....',
    '..obbeeebbo.....',
    '..obbbbbbbbo....',
    '...obbbbbbo.....',
    '....oooooo......',
    '..a....a....a...',
    '................',
    '................',
    '................',
  ],
  // 水滴蛙：宽扁身体 + 顶部大眼泡
  frog: [
    '................',
    '..oooo....oooo..',
    '.obbbbo..obbbbo.',
    '.obebbo..obbebo.',
    '.obbbbboobbbbbo.',
    '..ooobbbbbbooo..',
    '..obbbbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...oooooooooo...',
    '..oo........oo..',
    '.oo..........oo.',
    '................',
    '................',
  ],
  // 水母灵：伞盖 + 飘动触须
  jelly: [
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obhhhhhhhboo..',
    '.obhhhbbbbhhhbo.',
    '.obhbbeebeebhbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..oobbbbbbbboo..',
    '...osso..osso...',
    '...o..o..o..o...',
    '...o..o..o..o...',
    '...oo....o..o...',
    '................',
    '................',
    '................',
  ],
  // 泡泡龙：圆身 + 侧鳍 + 头顶泡泡
  dragon: [
    '.....ww.........',
    '....woow........',
    '.....ww.........',
    '...oooooooooo...',
    '..obhhhhhhhhbo..',
    '.obhhbbbbbbhhbo.',
    '.obbeebbbeebbo..',
    '.obhbbbbbbbbhbo.',
    '.obbbbbwwbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...oooooooooo...',
    '..ss........ss..',
    '.ss..........ss.',
    '................',
    '................',
  ],
  // 雷电鼠：大圆耳 + 尾巴
  mouse: [
    '..oooo....oooo..',
    '.obbbbo..obbbbo.',
    '.obbbbo..obbbbo.',
    '..oooo....oooo..',
    '....oooooooo....',
    '...obhhhhhhbo...',
    '..obhbeebeebbo..',
    '..obbbbbbbbbbo..',
    '..obbbbwwbbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '.......ss.......',
    '......ssss......',
    '.....ss.........',
    '................',
    '................',
  ],
  // 云朵灵：三团云 + 眼睛
  cloud: [
    '................',
    '.......oooo.....',
    '....oooooooo....',
    '...obbbbbbbbo...',
    '..obbbbbbbbbbo..',
    '.obbbbbbbbbbbbo.',
    '.obbeebbbeebboo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '..obbbbbbbbbbo..',
    '...oooooooooo...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 闪电鸟：双翼 + 喙 + 尾羽
  bird: [
    '................',
    '.ss..........ss.',
    '.osso..oo..osso.',
    '..ossoooooosso..',
    '...obhhhhhhbo...',
    '..obhhbbbbhhbo..',
    '..obbeebbeebbo..',
    '..obbbbbbbbbbo..',
    '..obbbbaabbbbo..',
    '...obbbbbbbbo...',
    '....oooooooo....',
    '......aaaa......',
    '.......aa.......',
    '................',
    '................',
    '................',
  ],
  // 暗影蝠：展开的翼 + 尖耳 + 獠牙
  bat: [
    '.o............o.',
    '.oo..........oo.',
    '.osso......osso.',
    '.osssso..osssso.',
    '.osssssoossssso.',
    '..osssbbbssso...',
    '...obbbbbbbbo...',
    '...obbeebeebo...',
    '...obbbbbbbbo...',
    '...obwbwbwbbo...',
    '....oooooooo....',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  // 梦灵：半透明光球 + 星芒
  dream: [
    '................',
    '.......w........',
    '......www.......',
    '.....w...w......',
    '....ooooooo.....',
    '...obbbbbbbo....',
    '..obhbbbbbhbo...',
    '..obbeebeebbo...',
    '..obbbeebeebo...',
    '..obbbbbbbbbo...',
    '...obbbbbbbo....',
    '....ooooooo.....',
    '................',
    '................',
    '................',
    '................',
  ],
  // 幽灵种：波浪下摆 + 圆眼
  ghost: [
    '................',
    '.....oooooo.....',
    '...oobbbbbboo...',
    '..obbbbbbbbbbo..',
    '.obhhbbbbbbhbo..',
    '.obbeebbbeebbo..',
    '.obbeebbbeebbo..',
    '.obbbbbbbbbbbbo.',
    '.obbbboooobbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbbbbbbbbo.',
    '.obboobboobbbbo.',
    '.o.o.oo.oo.o.o..',
    '................',
    '................',
    '................',
  ],
};

/** 构建该精灵的调色板 */
function buildPalette(pet) {
  const body = pet.bodyColor;
  const shade = pet.shadowColor;
  return {
    o: darken(shade, 0.55),
    b: body,
    s: shade,
    h: lighten(body, 0.45),
    w: '#fffdf5',
    e: '#0b0b12',
    a: ACCENTS[pet.shape] ?? lighten(body, 0.3),
  };
}

/** 点阵 → canvas（1 点 = 1 像素，靠 CSS 放大并保持硬边） */
function renderPixelArt(pet) {
  const rows = PIXEL_MAPS[pet.shape] ?? PIXEL_MAPS.blob;
  const height = rows.length;
  const width = Math.max(...rows.map(r => r.length));
  const cv = document.createElement('canvas');
  cv.width = width;
  cv.height = height;
  const g = cv.getContext('2d');
  const pal = buildPalette(pet);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const color = pal[row[x]];
      if (!color) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
  });
  return cv;
}

/** 为 PetState 生成像素精灵 DOM */
export function createSpriteEl(pet) {
  const root = document.createElement('div');
  root.className = 'sprite-unit';
  root.dataset.petId = pet.id;
  root.style.cssText = `
    position: absolute; width: 60px; height: 70px;
    transform: translate(-50%, -50%);
    image-rendering: pixelated;
    pointer-events: auto; cursor: pointer;
    z-index: 10;
  `;
  // 呼吸动画随机相位（须在 cssText 之后设置，否则被覆盖）
  root.style.animationDelay = -(Math.random() * 3).toFixed(2) + 's';

  // 地板投影
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:1px;left:50%;transform:translateX(-50%);
    width:34px;height:6px;background:#000;border-radius:50%;opacity:0.28;`;
  root.appendChild(shadow);

  // 像素本体（内层单独做待机浮动，避免与定位 transform 冲突）
  const bob = document.createElement('div');
  bob.className = 'sprite-bob';
  bob.style.animationDelay = -(Math.random() * 2.6).toFixed(2) + 's';
  const cv = renderPixelArt(pet);
  cv.style.cssText = `display:block;height:52px;width:auto;image-rendering:pixelated;
    filter:drop-shadow(0 2px 0 rgba(0,0,0,0.35));`;
  bob.appendChild(cv);
  root.appendChild(bob);

  // 进阶形态标记
  if (pet.evolved) {
    const star = document.createElement('div');
    star.style.cssText = `position:absolute;top:-4px;right:4px;font-size:10px;color:#fde047;
      text-shadow:0 0 5px #f59e0b;z-index:12;`;
    star.textContent = '✦';
    root.appendChild(star);
  }

  return root;
}

/** 图鉴/头像用的小尺寸像素图（返回 canvas，由调用方设尺寸） */
export function createPetCanvas(pet) {
  return renderPixelArt(pet);
}
