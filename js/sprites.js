/**
 * 为 PetState 生成一个像素占位 DOM（div）
 * 统一 60×70 占位，由 renderer 根据 depth 缩放定位
 */
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

  const body = document.createElement('div');
  body.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);';

  if (pet.shape === 'blob') {
    // 苔藓兽：圆胖 blob + 苔藓帽子
    body.innerHTML = `
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        width:44px;height:40px;background:${pet.bodyColor};
        border-radius:50% 50% 40% 40%;
        box-shadow: inset -4px 0 0 ${pet.shadowColor}, 0 3px 0 rgba(0,0,0,0.2);">
        <div style="position:absolute;top:14px;left:10px;width:6px;height:7px;background:#0a0a0a;border-radius:50%;"></div>
        <div style="position:absolute;top:14px;right:10px;width:6px;height:7px;background:#0a0a0a;border-radius:50%;"></div>
        <div style="position:absolute;top:28px;left:50%;transform:translateX(-50%);
          width:12px;height:4px;background:#0a0a0a;border-radius:0 0 6px 6px;"></div>
      </div>
      ${pet.traits.leaf ? `<div style="position:absolute;top:-4px;left:50%;transform:translateX(-50%);
        width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
        border-bottom:14px solid #86efac;"></div>` : ''}
    `;
  } else if (pet.shape === 'mushroom') {
    // 蘑菇灵：红白蘑菇帽 + 米白小身子
    body.innerHTML = `
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
        box-shadow: -10px 0 0 #0a0a0a, 10px 0 0 #0a0a0a;"></div>
    `;
  } else {
    // leafsprite / 默认：绿叶小妖精
    body.innerHTML = `
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
        border-bottom:14px solid #6ee7b7;"></div>
    `;
  }

  root.appendChild(body);

  // 地板阴影（椭圆）
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
    width:36px;height:6px;background:#000;border-radius:50%;opacity:0.25;`;
  root.appendChild(shadow);

  return root;
}
