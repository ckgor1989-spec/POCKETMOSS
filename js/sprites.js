/**
 * 像素精灵生成 —— 每个 shape 返回一段 innerHTML（纯 div/CSS 像素块）
 * 统一 60×70 占位，由 renderer 根据 depth 缩放定位
 * pet.bodyColor / pet.shadowColor 在进化后已被切换为进阶色板
 */

const eye = (t, l, s = 6) =>
  `<div style="position:absolute;top:${t}px;left:${l}px;width:${s}px;height:${s + 1}px;background:#0a0a0a;border-radius:50%;"></div>`;

const SHAPES = {
  // ===== 木系 =====
  blob: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:44px;height:40px;background:${pet.bodyColor};
      border-radius:50% 50% 40% 40%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(14, 10)}${eye(14, 28)}
      <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);
        width:12px;height:4px;background:#0a0a0a;border-radius:0 0 6px 6px;"></div>
    </div>
    <div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);
      width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
      border-bottom:14px solid #86efac;"></div>`,

  mushroom: () => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:30px;height:28px;background:#fef3c7;border-radius:4px 4px 0 0;"></div>
    <div style="position:absolute;top:-2px;left:50%;transform:translateX(-50%);
      width:46px;height:28px;background:#dc2626;border-radius:50% 50% 30% 30%;
      box-shadow: inset -4px 0 0 #991b1b;">
      <div style="position:absolute;top:6px;left:8px;width:6px;height:6px;background:#fff;border-radius:50%;"></div>
      <div style="position:absolute;top:10px;right:10px;width:5px;height:5px;background:#fff;border-radius:50%;"></div>
      <div style="position:absolute;top:14px;left:50%;transform:translateX(-50%);width:4px;height:4px;background:#fff;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;top:12px;left:50%;transform:translateX(-50%);
      width:6px;height:4px;background:#0a0a0a;border-radius:50%;
      box-shadow: -10px 0 0 #0a0a0a, 10px 0 0 #0a0a0a;"></div>`,

  leafy: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:36px;height:38px;background:${pet.bodyColor};
      border-radius:6px 6px 8px 8px;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      <div style="position:absolute;top:10px;left:6px;width:5px;height:6px;background:#fff;border-radius:50%;">
        <div style="width:3px;height:3px;background:#0a0a0a;margin-left:1px;margin-top:2px;border-radius:50%;"></div>
      </div>
      <div style="position:absolute;top:10px;right:6px;width:5px;height:6px;background:#fff;border-radius:50%;">
        <div style="width:3px;height:3px;background:#0a0a0a;margin-left:1px;margin-top:2px;border-radius:50%;"></div>
      </div>
    </div>
    <div style="position:absolute;top:-5px;left:50%;transform:translateX(-50%);
      width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;
      border-bottom:14px solid #6ee7b7;"></div>`,

  // ===== 火系 =====
  fox: (pet) => `
    <div style="position:absolute;top:0;left:8px;width:0;height:0;
      border-left:6px solid transparent;border-right:6px solid transparent;
      border-bottom:12px solid ${pet.bodyColor};"></div>
    <div style="position:absolute;top:0;right:8px;width:0;height:0;
      border-left:6px solid transparent;border-right:6px solid transparent;
      border-bottom:12px solid ${pet.bodyColor};"></div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:40px;height:36px;background:${pet.bodyColor};
      border-radius:45% 45% 35% 35%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(12, 8)}${eye(12, 26)}
      <div style="position:absolute;top:22px;left:50%;transform:translateX(-50%);
        width:14px;height:9px;background:#fff7ed;border-radius:40% 40% 50% 50%;"></div>
      <div style="position:absolute;top:23px;left:50%;transform:translateX(-50%);
        width:4px;height:3px;background:#0a0a0a;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;bottom:4px;right:0;width:12px;height:18px;
      background:${pet.shadowColor};border-radius:50% 50% 50% 50%;
      transform:rotate(30deg);"></div>`,

  lavablob: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:44px;height:36px;background:${pet.bodyColor};
      border-radius:50% 50% 35% 35%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, inset 0 -6px 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      <div style="position:absolute;top:6px;left:8px;width:8px;height:3px;background:#fef08a;"></div>
      <div style="position:absolute;top:16px;right:7px;width:6px;height:3px;background:#fef08a;"></div>
      <div style="position:absolute;bottom:5px;left:14px;width:9px;height:3px;background:#fef08a;"></div>
      ${eye(12, 12)}${eye(12, 28)}
    </div>`,

  spark: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:26px;height:26px;background:${pet.bodyColor};border-radius:50%;
      box-shadow: inset -3px -2px 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(8, 5, 5)}${eye(8, 16, 5)}
    </div>
    <div style="position:absolute;top:0;left:14px;width:5px;height:5px;background:${pet.bodyColor};"></div>
    <div style="position:absolute;top:6px;right:10px;width:4px;height:4px;background:${pet.bodyColor};"></div>
    <div style="position:absolute;top:2px;right:22px;width:3px;height:3px;background:#fef9c3;"></div>`,

  // ===== 水系 =====
  frog: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:46px;height:32px;background:${pet.bodyColor};
      border-radius:50% 50% 40% 40%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);"></div>
    <div style="position:absolute;top:2px;left:10px;width:14px;height:14px;background:${pet.bodyColor};border-radius:50%;">
      <div style="position:absolute;top:3px;left:4px;width:6px;height:7px;background:#0a0a0a;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;top:2px;right:10px;width:14px;height:14px;background:${pet.bodyColor};border-radius:50%;">
      <div style="position:absolute;top:3px;left:4px;width:6px;height:7px;background:#0a0a0a;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
      width:16px;height:5px;background:#0a0a0a;border-radius:0 0 8px 8px;"></div>`,

  jelly: (pet) => `
    <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:38px;height:26px;background:${pet.bodyColor};opacity:0.85;
      border-radius:50% 50% 20% 20%;
      box-shadow: inset -3px 0 0 ${pet.shadowColor};">
      ${eye(12, 10, 5)}${eye(12, 23, 5)}
    </div>
    <div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);width:34px;height:20px;">
      <div style="position:absolute;left:2px;top:0;width:5px;height:18px;background:${pet.bodyColor};border-radius:0 0 4px 4px;opacity:0.7;"></div>
      <div style="position:absolute;left:14px;top:0;width:5px;height:22px;background:${pet.bodyColor};border-radius:0 0 4px 4px;opacity:0.7;"></div>
      <div style="position:absolute;right:2px;top:0;width:5px;height:18px;background:${pet.bodyColor};border-radius:0 0 4px 4px;opacity:0.7;"></div>
    </div>`,

  dragon: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:38px;height:32px;background:${pet.bodyColor};
      border-radius:45% 45% 40% 40%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(10, 8, 5)}${eye(10, 24, 5)}
      <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);
        width:10px;height:4px;background:#0a0a0a;border-radius:0 0 5px 5px;"></div>
    </div>
    <div style="position:absolute;top:6px;left:-2px;width:12px;height:14px;
      background:${pet.shadowColor};border-radius:60% 20% 40% 60%;opacity:0.9;"></div>
    <div style="position:absolute;top:6px;right:-2px;width:12px;height:14px;
      background:${pet.shadowColor};border-radius:20% 60% 60% 40%;opacity:0.9;"></div>
    <div style="position:absolute;top:-8px;right:6px;width:10px;height:10px;
      background:rgba(255,255,255,0.6);border:1px solid ${pet.bodyColor};border-radius:50%;"></div>`,

  // ===== 雷系 =====
  mouse: (pet) => `
    <div style="position:absolute;top:0;left:8px;width:16px;height:16px;background:${pet.bodyColor};border-radius:50%;
      box-shadow: inset 0 0 0 4px ${pet.shadowColor};"></div>
    <div style="position:absolute;top:0;right:8px;width:16px;height:16px;background:${pet.bodyColor};border-radius:50%;
      box-shadow: inset 0 0 0 4px ${pet.shadowColor};"></div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:34px;height:32px;background:${pet.bodyColor};border-radius:50% 50% 40% 40%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(10, 7, 5)}${eye(10, 22, 5)}
      <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);
        width:5px;height:4px;background:#be123c;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;bottom:2px;right:0;width:14px;height:8px;
      border-right:4px solid ${pet.shadowColor};border-bottom:4px solid ${pet.shadowColor};
      transform:skewX(-30deg);"></div>`,

  cloud: (pet) => `
    <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:44px;height:24px;">
      <div style="position:absolute;bottom:0;left:0;width:20px;height:20px;background:${pet.bodyColor};border-radius:50%;"></div>
      <div style="position:absolute;bottom:0;left:12px;width:24px;height:24px;background:${pet.bodyColor};border-radius:50%;"></div>
      <div style="position:absolute;bottom:0;right:0;width:18px;height:18px;background:${pet.bodyColor};border-radius:50%;"></div>
      <div style="position:absolute;bottom:0;left:4px;width:36px;height:12px;background:${pet.bodyColor};border-radius:8px;
        box-shadow: inset -3px -2px 0 ${pet.shadowColor};"></div>
    </div>
    ${eye(26, 22, 5)}${eye(26, 33, 5)}
    <div style="position:absolute;top:38px;left:50%;transform:translateX(-50%);
      width:8px;height:3px;background:#0a0a0a;border-radius:0 0 4px 4px;"></div>`,

  bird: (pet) => `
    <div style="position:absolute;top:4px;left:0;width:16px;height:10px;
      background:${pet.shadowColor};border-radius:60% 10% 40% 60%;transform:rotate(-25deg);"></div>
    <div style="position:absolute;top:4px;right:0;width:16px;height:10px;
      background:${pet.shadowColor};border-radius:10% 60% 60% 40%;transform:rotate(25deg);"></div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:30px;height:34px;background:${pet.bodyColor};border-radius:50% 50% 40% 40%;
      box-shadow: inset -3px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
      ${eye(8, 6, 5)}${eye(8, 19, 5)}
      <div style="position:absolute;top:16px;left:50%;transform:translateX(-50%);
        width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:7px solid #fbbf24;"></div>
    </div>
    <div style="position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
      width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;
      border-bottom:10px solid #fde047;"></div>`,

  // ===== 暗系 =====
  bat: (pet) => `
    <div style="position:absolute;top:8px;left:-2px;width:0;height:0;
      border-top:16px solid ${pet.shadowColor};border-right:18px solid transparent;"></div>
    <div style="position:absolute;top:8px;right:-2px;width:0;height:0;
      border-top:16px solid ${pet.shadowColor};border-left:18px solid transparent;"></div>
    <div style="position:absolute;top:0;left:14px;width:0;height:0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-bottom:9px solid ${pet.bodyColor};"></div>
    <div style="position:absolute;top:0;right:14px;width:0;height:0;
      border-left:5px solid transparent;border-right:5px solid transparent;
      border-bottom:9px solid ${pet.bodyColor};"></div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:32px;height:30px;background:${pet.bodyColor};border-radius:45% 45% 40% 40%;
      box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.3);">
      ${eye(10, 7, 5)}${eye(10, 20, 5)}
      <div style="position:absolute;top:20px;left:12px;width:3px;height:5px;background:#fff;"></div>
      <div style="position:absolute;top:20px;left:17px;width:3px;height:5px;background:#fff;"></div>
    </div>`,

  dream: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:38px;height:38px;background:${pet.bodyColor};opacity:0.55;border-radius:50%;
      box-shadow: inset -4px -4px 0 ${pet.shadowColor}, 0 0 10px ${pet.bodyColor};">
      ${eye(14, 9, 5)}${eye(14, 24, 5)}
      <div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);
        width:10px;height:3px;background:#0a0a0a;border-radius:0 0 5px 5px;opacity:0.6;"></div>
    </div>
    <div style="position:absolute;top:-6px;right:4px;width:8px;height:8px;
      background:rgba(255,255,255,0.4);border-radius:50%;"></div>`,

  ghost: (pet) => `
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      width:36px;height:40px;background:${pet.bodyColor};
      border-radius:50% 50% 0 0;
      box-shadow: inset -4px 0 0 ${pet.shadowColor};">
      ${eye(12, 8)}${eye(12, 23)}
      <div style="position:absolute;top:24px;left:50%;transform:translateX(-50%);
        width:7px;height:8px;background:#0a0a0a;border-radius:50%;"></div>
    </div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:36px;height:8px;">
      <div style="position:absolute;left:0;bottom:0;width:12px;height:8px;background:${pet.bodyColor};border-radius:0 0 50% 50%;"></div>
      <div style="position:absolute;left:12px;bottom:0;width:12px;height:8px;background:${pet.bodyColor};border-radius:0 0 50% 50%;"></div>
      <div style="position:absolute;right:0;bottom:0;width:12px;height:8px;background:${pet.bodyColor};border-radius:0 0 50% 50%;"></div>
    </div>`,
};

/** 为 PetState 生成一个像素占位 DOM（div） */
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
  // 呼吸动画随机相位（须在 cssText 之后设置，否则被覆盖），同场景精灵不再同步起伏
  root.style.animationDelay = -(Math.random() * 3).toFixed(2) + 's';

  const body = document.createElement('div');
  body.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:60px;height:60px;';
  const builder = SHAPES[pet.shape] ?? SHAPES.blob;
  body.innerHTML = builder(pet);
  root.appendChild(body);

  // 进阶形态标记
  if (pet.evolved) {
    const star = document.createElement('div');
    star.style.cssText = `position:absolute;top:-2px;right:6px;font-size:10px;color:#fde047;
      text-shadow:0 0 4px #f59e0b;z-index:12;`;
    star.textContent = '✦';
    root.appendChild(star);
  }

  // 地板阴影（椭圆）
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
    width:36px;height:6px;background:#000;border-radius:50%;opacity:0.25;`;
  root.appendChild(shadow);

  return root;
}
