import { INTERACTION, WALK_EVENTS, HATCH, SPRITES, ELEMENTS, SCENES } from './config.js';
import { PetState } from './state.js';
import { routeDialog, generateWalkEvent } from './ai.js';
import { saveGame } from './storage.js';

/** 对 pet 执行互动：应用数值 → 好感度 → 进化判定 → 触发对话 → 保存 */
export async function doInteraction(game, petId, action) {
  const pet = game.pets[petId];
  if (!pet) return null;

  const delta = INTERACTION[action] ?? {};
  pet.applyChange(delta);
  const evolved = pet.tryEvolve();

  const context = { feed: 'after_feed', play: 'after_play', clean: 'after_clean', talk: 'idle' }[action] ?? 'idle';
  const text = await routeDialog('auto', pet, context);

  saveGame(game);
  return { pet, text, action, evolved };
}

/** 散步：优先 AI 动态生成事件；失败降级到本地事件表 + L2 性格反应。发现类事件概率掉蛋 */
export async function doWalk(game, petId) {
  const pet = game.pets[petId];
  if (!pet) return null;

  pet.applyChange(INTERACTION.walk);
  const evolved = pet.tryEvolve();

  const sceneName = SCENES[game.currentScene]?.name ?? game.currentScene;
  const aiResult = await generateWalkEvent(pet, sceneName);
  let event, reaction;
  if (aiResult) {
    ({ event, reaction } = aiResult);
  } else {
    const table = WALK_EVENTS[game.currentScene] ?? WALK_EVENTS.forest;
    event = table[Math.floor(Math.random() * table.length)];
    reaction = await routeDialog('L2', pet, 'walk_event', { tag: event.tag });
  }

  // 发现类事件概率掉蛋
  let gotEgg = false;
  if (event.tag === 'find' && Math.random() < HATCH.EGG_CHANCE_ON_FIND) {
    game.eggs += 1;
    gotEgg = true;
  }

  saveGame(game);
  return { pet, event, reaction, gotEgg, evolved };
}

/** 孵化：随机挑一个"还有未拥有精灵"的元素，返回该元素下可选的精灵 id 列表（最多 3） */
export function rollHatchChoices(game) {
  if (game.eggs <= 0) return null;
  // 每个元素下未拥有的精灵
  const candidatesByElement = {};
  Object.keys(ELEMENTS).forEach(el => {
    const unowned = Object.values(SPRITES)
      .filter(s => s.element === el && !game.pets[s.id])
      .map(s => s.id);
    if (unowned.length > 0) candidatesByElement[el] = unowned;
  });
  const elements = Object.keys(candidatesByElement);
  if (elements.length === 0) return null; // 全图鉴了
  const element = elements[Math.floor(Math.random() * elements.length)];
  return { element, choices: candidatesByElement[element] };
}

/** 确认孵化：消耗一颗蛋，新精灵加入对应场景 */
export function hatchPet(game, spriteId) {
  if (game.eggs <= 0 || game.pets[spriteId] || !SPRITES[spriteId]) return null;
  const pet = new PetState(spriteId);
  game.addPet(pet);
  const sceneKey = ELEMENTS[pet.element].sceneKey;
  if (game.scenes[sceneKey] && !game.scenes[sceneKey].petIds.includes(spriteId)) {
    game.scenes[sceneKey].petIds.push(spriteId);
  }
  game.eggs -= 1;
  saveGame(game);
  return pet;
}

/** 随机挑一个活跃场景里的宠物 */
export function pickRandomActivePet(game) {
  const active = game.activePets;
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}
