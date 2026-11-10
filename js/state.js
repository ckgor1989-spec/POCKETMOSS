import { DECAY, INITIAL_STATE, SCENES, SPRITES, EVOLVE_AT, IMPRESSION } from './config.js';

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/** 单只精灵的状态 — 纯数据类 */
export class PetState {
  constructor(spriteId) {
    const def = SPRITES[spriteId];
    this.id = spriteId;
    this.name = def.name;
    this.element = def.element;
    this.personality = def.personality;
    this.bodyColor = def.bodyColor;
    this.shadowColor = def.shadowColor;
    this.shape = def.shape;
    this.traits = def.traits;

    this.hunger = INITIAL_STATE.hunger;
    this.mood = INITIAL_STATE.mood;
    this.clean = INITIAL_STATE.clean;
    this.affection = 0;
    this.impression = 0;       // 对玩家的印象（-100~100），区别于好感度：反映长期陪伴
    this.evolved = false;      // 进阶形态（好感度达标后换色）
    this.hatchedAt = Date.now();
    this.lastUpdate = Date.now();
  }

  applyChange(delta) {
    if (delta.hunger !== undefined)    this.hunger    = clamp(this.hunger + delta.hunger, 0, 100);
    if (delta.mood !== undefined)      this.mood      = clamp(this.mood   + delta.mood,   0, 100);
    if (delta.clean !== undefined)     this.clean     = clamp(this.clean  + delta.clean,  0, 100);
    if (delta.affection !== undefined) this.affection = clamp(this.affection + delta.affection, 0, 100);
    if (delta.impression !== undefined) this.impression = clamp(this.impression + delta.impression, IMPRESSION.MIN, IMPRESSION.MAX);
    this.lastUpdate = Date.now();
  }

  /** 好感度达标 → 切换进阶色板；返回 true 表示本次发生了进化 */
  tryEvolve() {
    if (this.evolved || this.affection < EVOLVE_AT) return false;
    this.evolved = true;
    const evo = SPRITES[this.id].evolved;
    if (evo) { this.bodyColor = evo.bodyColor; this.shadowColor = evo.shadowColor; }
    return true;
  }

  get statusKey() {
    if (this.mood < 30) return 'lonely';
    if (this.clean < 30) return 'dirty';
    if (this.hunger < 30) return 'hungry';
    if (this.mood > 70 && this.hunger > 50) return 'happy';
    return 'idle';
  }

  /** 印象等级：亲密 / 熟悉 / 普通 / 疏远 */
  get impressionLevel() {
    if (this.impression >= 60) return '亲密';
    if (this.impression >= 20) return '熟悉';
    if (this.impression <= -20) return '疏远';
    return '普通';
  }

  toJSON() {
    return {
      id: this.id, hunger: this.hunger, mood: this.mood, clean: this.clean,
      affection: this.affection, impression: this.impression, evolved: this.evolved,
      hatchedAt: this.hatchedAt, lastUpdate: this.lastUpdate,
    };
  }
}

/** 全局游戏状态 — 单例 */
export class GameState {
  constructor() {
    this.pets = {};
    this.scenes = {};
    this.currentScene = 'forest';
    this.eggs = 0;             // 待孵化的蛋库存
    this.createdAt = Date.now();
    this.lastSaved = Date.now();
  }

  addPet(pet) { this.pets[pet.id] = pet; }

  /** 是否拥有某元素的精灵（决定场景解锁） */
  ownsElement(el) {
    return Object.values(this.pets).some(p => p.element === el);
  }

  sceneUnlocked(key) {
    const el = SCENES[key]?.element;
    if (!el) return false;
    return key === 'forest' || this.ownsElement(el);
  }

  get activePets() {
    const el = SCENES[this.currentScene]?.element;
    if (!el) return [];
    return Object.values(this.pets).filter(p => p.element === el);
  }

  tick(deltaMinutes) {
    const cap = DECAY.OFFLINE_CAP_HOURS * 60;
    const t = Math.min(deltaMinutes, cap);
    Object.values(this.pets).forEach(p => {
      p.hunger = clamp(p.hunger - DECAY.HUNGER_PER_MIN * t, 0, 100);
      p.mood   = clamp(p.mood   - DECAY.MOOD_PER_MIN   * t, 0, 100);
      p.clean  = clamp(p.clean  - DECAY.CLEAN_PER_MIN  * t, 0, 100);
      p.lastUpdate = Date.now();
    });
  }
}
