import { GameState, PetState } from './state.js';
import { SPRITES, SCENES, INITIAL_STATE, HATCH } from './config.js';

const KEY_V2 = 'pocketmoss_save_v2';
const KEY_V1 = 'pocketmoss_save_v1';

/** 新建游戏：3 只初始木系精灵 + 1 颗蛋 */
export function createNewGame() {
  const gs = new GameState();
  Object.keys(SCENES).forEach(k => {
    gs.scenes[k] = { key: k, name: SCENES[k].name, element: SCENES[k].element, colors: SCENES[k].colors, petIds: [] };
  });
  ['mossbeast', 'mushroom', 'leafsprite'].forEach(id => {
    const pet = new PetState(id);
    gs.addPet(pet);
    gs.scenes.forest.petIds.push(id);
  });
  gs.eggs = HATCH.START_EGGS;
  return gs;
}

/** 读取存档：v2 优先，缺失时尝试迁移 v1 */
export function loadGame() {
  const rawV2 = localStorage.getItem(KEY_V2);
  if (rawV2) {
    const gs = normalize(rawV2);
    if (gs) return applyOffline(gs);
  }
  const rawV1 = localStorage.getItem(KEY_V1);
  if (rawV1) {
    const gs = migrateV1(rawV1);
    if (gs) { saveGame(gs); return applyOffline(gs); }
  }
  return createNewGame();
}

function migrateV1(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.pets)) return null;
    // v1 没有 eggs/evolved/hatchedAt 字段，normalize 会补默认值
    return normalize(JSON.stringify(data));
  } catch { return null; }
}

function normalize(raw) {
  let data;
  try { data = JSON.parse(raw); } catch { return null; }
  if (!data || typeof data !== 'object') return null;

  const gs = new GameState();

  // Normalize pets（支持 v1 无 evolved/hatchedAt 的旧档）
  if (Array.isArray(data.pets)) {
    data.pets.forEach(save => {
      if (!SPRITES[save.id]) return;
      const pet = new PetState(save.id);
      pet.hunger = save.hunger ?? INITIAL_STATE.hunger;
      pet.mood   = save.mood   ?? INITIAL_STATE.mood;
      pet.clean  = save.clean  ?? INITIAL_STATE.clean;
      pet.affection = save.affection ?? 0;
      pet.evolved = save.evolved === true;
      pet.hatchedAt = save.hatchedAt ?? Date.now();
      pet.lastUpdate = save.lastUpdate ?? Date.now();
      if (pet.evolved) { // 恢复进阶色板
        const evo = SPRITES[save.id].evolved;
        if (evo) { pet.bodyColor = evo.bodyColor; pet.shadowColor = evo.shadowColor; }
      }
      gs.pets[pet.id] = pet;
    });
  }

  // 场景容器
  if (Array.isArray(data.scenes)) {
    data.scenes.forEach(s => {
      if (!SCENES[s.key]) return;
      gs.scenes[s.key] = {
        key: s.key, name: SCENES[s.key].name,
        element: SCENES[s.key].element,
        colors: SCENES[s.key].colors,
        petIds: Array.isArray(s.petIds) ? s.petIds.filter(id => gs.pets[id]) : [],
      };
    });
  }
  // 补齐缺失场景容器
  Object.keys(SCENES).forEach(k => {
    if (!gs.scenes[k]) {
      gs.scenes[k] = { key: k, name: SCENES[k].name, element: SCENES[k].element, colors: SCENES[k].colors, petIds: [] };
    }
  });
  // 老存档兜底：确保至少有初始 3 只木系精灵
  const forestIds = gs.scenes.forest.petIds;
  ['mossbeast','mushroom','leafsprite'].forEach(id => {
    if (!gs.pets[id]) {
      gs.pets[id] = new PetState(id);
      if (!forestIds.includes(id)) forestIds.push(id);
    } else if (!forestIds.includes(id)) {
      forestIds.push(id);
    }
  });

  gs.currentScene = (typeof data.currentScene === 'string' && SCENES[data.currentScene])
    ? data.currentScene : 'forest';
  // 当前场景必须已解锁，否则回退 forest
  if (!gs.sceneUnlocked(gs.currentScene)) gs.currentScene = 'forest';
  gs.eggs = (typeof data.eggs === 'number' && data.eggs >= 0) ? Math.floor(data.eggs) : HATCH.START_EGGS;
  gs.createdAt = (typeof data.createdAt === 'number') ? data.createdAt : Date.now();
  gs.lastSaved = (typeof data.lastSaved === 'number') ? data.lastSaved : Date.now();

  return gs;
}

function applyOffline(gs) {
  const now = Date.now();
  const lastUpdate = Object.values(gs.pets).reduce((latest, p) => Math.max(latest, p.lastUpdate), now);
  const deltaMin = Math.max(0, (now - lastUpdate) / 60000);
  gs.tick(deltaMin);
  gs.lastSaved = now;
  return gs;
}

/** 保存游戏（v2 key） */
export function saveGame(gs) {
  const data = {
    version: 2,
    pets: Object.values(gs.pets).map(p => p.toJSON()),
    scenes: Object.values(gs.scenes).map(s => ({ key: s.key, petIds: s.petIds })),
    currentScene: gs.currentScene,
    eggs: gs.eggs,
    createdAt: gs.createdAt,
    lastSaved: Date.now(),
  };
  try { localStorage.setItem(KEY_V2, JSON.stringify(data)); }
  catch (e) { console.warn('Save failed:', e); }
}

/** 清档（测试用） */
export function resetSave() {
  localStorage.removeItem(KEY_V2);
  localStorage.removeItem(KEY_V1);
}
