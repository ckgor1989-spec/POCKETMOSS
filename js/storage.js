import { GameState, PetState } from './state.js';
import { SPRITES, SCENES, INITIAL_STATE } from './config.js';

const KEY = 'pocketmoss_save_v1';

/** 新建游戏：3 只初始精灵全部放 forest 场景 */
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
  return gs;
}

/** 读取存档 + 离线补偿 + normalize */
export function loadGame() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return createNewGame();

  let data;
  try { data = JSON.parse(raw); } catch { return createNewGame(); }

  const gs = new GameState();

  // Normalize pets
  if (Array.isArray(data.pets)) {
    data.pets.forEach(save => {
      if (!SPRITES[save.id]) return;
      const pet = new PetState(save.id);
      pet.hunger = save.hunger ?? INITIAL_STATE.hunger;
      pet.mood   = save.mood   ?? INITIAL_STATE.mood;
      pet.clean  = save.clean  ?? INITIAL_STATE.clean;
      pet.affection = save.affection ?? 0;
      pet.lastUpdate = save.lastUpdate ?? Date.now();
      gs.pets[pet.id] = pet;
    });
  }

  // 场景容器
  if (Array.isArray(data.scenes)) {
    data.scenes.forEach(s => {
      gs.scenes[s.key] = {
        key: s.key, name: SCENES[s.key]?.name ?? s.key,
        element: SCENES[s.key]?.element ?? null,
        colors: SCENES[s.key]?.colors ?? null,
        petIds: Array.isArray(s.petIds) ? s.petIds.filter(id => gs.pets[id]) : [],
      };
    });
  }
  if (!gs.scenes.forest) {
    gs.scenes.forest = { key: 'forest', name: SCENES.forest.name, element: 'wood', colors: SCENES.forest.colors, petIds: [] };
  }
  // 确保 forest 有 3 只精灵
  const forestIds = gs.scenes.forest.petIds;
  ['mossbeast','mushroom','leafsprite'].forEach(id => {
    if (!forestIds.includes(id) && !gs.pets[id]) {
      const pet = new PetState(id);
      gs.pets[id] = pet;
      forestIds.push(id);
    } else if (!forestIds.includes(id) && gs.pets[id]) {
      forestIds.push(id);
    }
  });

  gs.currentScene = (typeof data.currentScene === 'string' && SCENES[data.currentScene])
    ? data.currentScene : 'forest';
  gs.createdAt = (typeof data.createdAt === 'number') ? data.createdAt : Date.now();
  gs.lastSaved = (typeof data.lastSaved === 'number') ? data.lastSaved : Date.now();

  // 离线时间补偿
  const now = Date.now();
  const lastUpdate = Object.values(gs.pets).reduce((latest, p) => Math.max(latest, p.lastUpdate), now);
  const deltaMin = Math.max(0, (now - lastUpdate) / 60000);
  gs.tick(deltaMin);
  gs.lastSaved = now;

  return gs;
}

/** 保存游戏 */
export function saveGame(gs) {
  const data = {
    pets: Object.values(gs.pets).map(p => ({
      id: p.id, hunger: p.hunger, mood: p.mood, clean: p.clean,
      affection: p.affection, lastUpdate: Date.now(),
    })),
    scenes: Object.values(gs.scenes).map(s => ({ key: s.key, petIds: s.petIds })),
    currentScene: gs.currentScene,
    createdAt: gs.createdAt,
    lastSaved: Date.now(),
  };
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { console.warn('Save failed:', e); }
}

/** 清档（测试用） */
export function resetSave() { localStorage.removeItem(KEY); }
