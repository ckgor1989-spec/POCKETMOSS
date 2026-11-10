import { INTERACTION } from './config.js';
import { routeDialog } from './ai.js';
import { saveGame } from './storage.js';

/** 对 pet 执行互动：应用数值 → 触发 AI 对话 → 保存 */
export async function doInteraction(game, petId, action) {
  const pet = game.pets[petId];
  if (!pet) return null;

  const delta = INTERACTION[action] ?? {};
  pet.applyChange(delta);

  const context = { feed: 'after_feed', play: 'after_play', clean: 'after_clean', talk: 'idle', walk: 'walk_event' }[action] ?? 'idle';
  const text = await routeDialog('auto', pet, context);

  saveGame(game);
  return { pet, text, action };
}

/** 随机挑一个活跃场景里的宠物 */
export function pickRandomActivePet(game) {
  const active = game.activePets;
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}
