import { DECAY, INITIAL_STATE, SCENES, SPRITES } from './config.js';

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
    this.lastUpdate = Date.now();
  }

  applyChange(delta) {
    if (delta.hunger !== undefined) this.hunger = clamp(this.hunger + delta.hunger, 0, 100);
    if (delta.mood !== undefined)   this.mood   = clamp(this.mood   + delta.mood,   0, 100);
    if (delta.clean !== undefined)  this.clean  = clamp(this.clean  + delta.clean,  0, 100);
    this.lastUpdate = Date.now();
  }

  get statusKey() {
    if (this.mood < 30) return 'lonely';
    if (this.clean < 30) return 'dirty';
    if (this.hunger < 30) return 'hungry';
    if (this.mood > 70 && this.hunger > 50) return 'happy';
    return 'idle';
  }

  toJSON() {
    return {
      id: this.id, hunger: this.hunger, mood: this.mood, clean: this.clean,
      affection: this.affection, lastUpdate: this.lastUpdate,
    };
  }
}

/** 全局游戏状态 — 单例 */
export class GameState {
  constructor() {
    this.pets = {};
    this.scenes = {};
    this.currentScene = 'forest';
    this.createdAt = Date.now();
    this.lastSaved = Date.now();
  }

  addPet(pet) { this.pets[pet.id] = pet; }

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
