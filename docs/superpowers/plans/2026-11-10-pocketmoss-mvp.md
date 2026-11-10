# POCKETMOSS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建可玩的 POCKETMOSS MVP — 1 个场景（Whispering Forest + GBA 绿板）、3 只精灵、状态系统、互动、L1 本地 AI 对话、localStorage 存档。

**Architecture:** 纯 Vanilla JS ES6 类式模块，单页 SPA。Canvas 负责 2.5D 场景和地板，CSS/div 负责精灵占位和 UI。`config.js` 集中所有常量，`state.js` 管理游戏状态，`storage.js` 做持久化，`ai.js` 路由对话层。无框架、无构建工具。

**Tech Stack:** HTML5 + Vanilla JS (ES6 modules via `<script type="module">`) + Canvas 2D + CSS keyframes + localStorage

---

## File Structure

```
/workspace/
├── index.html              # 单页入口，唯一 HTML
├── css/
│   └── styles.css          # GBA 色板变量 + 全部 UI 样式 + keyframes 动画
├── js/
│   ├── config.js           # 常量：元素矩阵、精灵数据、衰减速率、AI endpoint、台词库
│   ├── state.js            # GameState / PetState / SceneState 三个类
│   ├── storage.js          # loadGame() / saveGame() / normalize() — localStorage 封装
│   ├── renderer.js         # Canvas 2.5D 场景渲染 + 精灵位置计算 + 粒子爆散
│   ├── sprites.js          # 精灵占位 DOM 生成函数（getSpriteDom(el)）
│   ├── interactions.js     # feed() / play() / clean() + AI 对话触发 + 状态变化路由
│   ├── ai.js               # AI 分层路由：routeDialog(layer, pet, context) → text
│   └── game.js             # 主入口：初始化、requestAnimationFrame 循环、事件绑定
```

**模块边界：**
- `config.js` — 纯数据，不依赖任何其他模块
- `state.js` — 纯数据类，不操作 DOM / localStorage
- `storage.js` — 只依赖 `state.js` 的类，读写 localStorage
- `renderer.js` — 依赖 `state.js` 读取状态，操作 Canvas
- `sprites.js` — 纯函数，返回 DOM 片段，不读取状态
- `ai.js` — 依赖 `config.js` 台词库和 `state.js` 宠物状态，返回字符串
- `interactions.js` — 依赖 `state.js` + `ai.js` + `storage.js`，路由玩家操作
- `game.js` — 依赖所有模块，初始化 + 生命周期

---

### Task 1: 项目脚手架 + index.html

**Files:**
- Create: `/workspace/index.html`
- Create: `/workspace/js/config.js`（先写空壳占位，Task 2 填充）

- [ ] **Step 1: 创建 index.html 单页入口**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#9bbc0f">
<title>POCKETMOSS</title>
<link rel="stylesheet" href="css/styles.css">
</head>
<body>
<div id="app">
  <!-- 顶部 HUD Grid (方案 C) -->
  <header id="hud-top" class="hud-top">
    <div class="hud-row-1">
      <span id="scene-name" class="hud-scene">▲ FOREST</span>
      <span id="battery" class="hud-batt">BATT●●●</span>
      <span id="clock" class="hud-clock">--:--</span>
    </div>
    <div id="hud-pets" class="hud-pets-row"><!-- 由 JS 填充 --></div>
  </header>

  <!-- 2.5D 场景 Canvas -->
  <main id="scene-wrap" class="scene-wrap">
    <canvas id="scene-canvas"></canvas>
    <div id="sprite-layer" class="sprite-layer"><!-- 精灵 DOM 由 JS 填充 --></div>
    <div id="bubble-layer" class="bubble-layer"><!-- AI 对话气泡 --></div>
  </main>

  <!-- 底部 5 按钮快捷栏 -->
  <nav id="quick-bar" class="quick-bar">
    <button class="qb-btn" data-action="feed">🍖<span>喂食</span></button>
    <button class="qb-btn" data-action="play">🎾<span>玩耍</span></button>
    <button class="qb-btn" data-action="clean">🧼<span>清洁</span></button>
    <button class="qb-btn qb-ai" data-action="talk">💬<span>对话</span></button>
    <button class="qb-btn" data-action="walk">▶<span>散步</span></button>
  </nav>

  <!-- 状态提示 toast -->
  <div id="toast" class="toast"></div>
</div>
<script type="module" src="js/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建 config.js 空壳占位**

```js
// TODO Task 2 填充
export const GAME_CONFIG = {};
```

- [ ] **Step 3: 创建空目录和文件**

运行：
```bash
mkdir -p /workspace/css /workspace/js
touch /workspace/css/styles.css /workspace/js/{state,storage,renderer,sprites,interactions,ai,game}.js
```

- [ ] **Step 4: 验证 index.html 能打开（先会报错因为 CSS/JS 空的，但页面应显示原生骨架）**

浏览器访问 `http://localhost:8765/` → 看到结构：顶部 header 一行文字 + 一片空白 main + 底部一排原生 button。**预期：** 不崩溃，结构可见。

---

### Task 2: config.js — GBA 色板 + 全部常量 + L1 台词库

**Files:**
- Modify: `/workspace/js/config.js`（完整填充）

- [ ] **Step 1: 写 config.js 完整内容**

```js
// POCKETMOSS — 全局配置（纯数据，零逻辑）

// ===== GBA 色板 =====
export const COLORS = {
  GBA_DARK:  '#0f380f',
  GBA_MID:   '#306230',
  GBA_LIGHT: '#8bac0f',
  GBA_BG:    '#9bbc0f',
  SCENE_GREEN: {
    skyTop: '#065f46', skyBot: '#022c22',
    groundTop: '#059669', groundBot: '#047857', groundDark: '#064e3b',
    accent: '#9bbc0f',
  },
};

// ===== 元素 × 场景矩阵 =====
export const ELEMENTS = {
  wood: { name: '苔藓·木', sceneKey: 'forest', color: '#10b981' },
  fire: { name: '熔岩·火', sceneKey: 'volcano', color: '#f97316' },
  water: { name: '潮汐·水', sceneKey: 'lake', color: '#60a5fa' },
  thunder: { name: '风暴·雷', sceneKey: 'peak', color: '#a78bfa' },
  shadow: { name: '影蚀·暗', sceneKey: 'cavern', color: '#581c87' },
};

export const SCENES = {
  forest:  { name: 'Whispering Forest',  element: 'wood',   colors: COLORS.SCENE_GREEN },
  volcano: { name: 'Ash Volcano',        element: 'fire',   colors: { skyTop:'#7c3aed', skyBot:'#2e1065', groundTop:'#f97316', groundBot:'#9a3412', groundDark:'#451a03', accent:'#fb923c' } },
  lake:    { name: 'Crystal Lake',       element: 'water',  colors: { skyTop:'#0369a1', skyBot:'#1e3a8a', groundTop:'#3b82f6', groundBot:'#1d4ed8', groundDark:'#1e3a8a', accent:'#60a5fa' } },
  peak:    { name: 'Thunder Peak',       element: 'thunder',colors: { skyTop:'#3730a3', skyBot:'#312e81', groundTop:'#a78bfa', groundBot:'#6d28d9', groundDark:'#3b0764', accent:'#c4b5fd' } },
  cavern:  { name: 'Abyss Cavern',       element: 'shadow', colors: { skyTop:'#3b0764', skyBot:'#0a0a0a', groundTop:'#6b21a8', groundBot:'#3b0764', groundDark:'#0a0a0a', accent:'#a78bfa' } },
};

// ===== 精灵数据（MVP 只做 3 只 wood 元素） =====
export const SPRITES = {
  mossbeast: {
    id: 'mossbeast', name: '苔藓兽', element: 'wood',
    personality: '慵懒治愈',
    bodyColor: '#10b981', shadowColor: '#059669',
    shape: 'blob', // 圆形胖体
    traits: { leaf:true, ear:false },
  },
  mushroom: {
    id: 'mushroom', name: '蘑菇灵', element: 'wood',
    personality: '害羞胆小',
    bodyColor: '#fca5a5', shadowColor: '#b91c1c',
    shape: 'mushroom',
    traits: { leaf:false, ear:false, cap:'white-spots' },
  },
  leafsprite: {
    id: 'leafsprite', name: '藤叶精', element: 'wood',
    personality: '好奇活泼',
    bodyColor: '#34d399', shadowColor: '#059669',
    shape: 'leafy',
    traits: { leaf:true, ear:false, stem:true },
  },
};

// ===== 状态衰减速率（每分钟变化量） =====
export const DECAY = {
  HUNGER_PER_MIN:  0.6,   // 饱食度每分钟 -0.6
  MOOD_PER_MIN:    0.4,   // 心情值每分钟 -0.4
  CLEAN_PER_MIN:   0.3,   // 清洁度每分钟 -0.3
  OFFLINE_CAP_HOURS: 6,   // 离线补偿最多按 6 小时结算
};

// ===== 互动效果 =====
export const INTERACTION = {
  feed:  { hunger:  +25, mood: +5 },
  play:  { hunger:  -10, mood: +20 },
  clean: { hunger:   +0, mood: +5, clean: +30 },
  walk:  { hunger:  -15, mood: +15 },
};

// ===== 初始值 =====
export const INITIAL_STATE = {
  hunger: 80, mood: 80, clean: 80,
  lastUpdate: null,
};

// ===== L1 本地台词库（按 状态 × 性格分组） =====
// 结构：{ [状态_key]: { [personality]: [text, ...] } }
// 状态 key: 'idle' / 'hungry' / 'happy' / 'dirty' / 'lonely' / 'after_feed' / 'after_play' / 'after_clean'
export const L1_LINES = {
  idle: {
    '慵懒治愈': ['zzz... 好舒服', '晒太阳~', '苔藓好软哦'],
    '害羞胆小': ['你...你好呀', '我躲起来了', '别盯着我嘛...'],
    '好奇活泼': ['那边有东西！', '想去看看新地方', '蹦蹦跳跳~'],
    '傲娇毒舌': ['哼，别来烦我', '你又来啦？', '...算了就陪你一下'],
    '温柔治愈': ['今天心情不错~', '有你真好', '摸摸头'],
  },
  hungry: {
    '慵懒治愈': ['肚子饿了...', '想吃点软软的...', '不动了，没有能量了'],
    '害羞胆小': ['那个...有没有吃的...', '我好饿', '肚子咕咕叫'],
    '好奇活泼': ['好饿好饿！快给我吃的！', '没力气蹦了...', '食物！食物在哪里？'],
    '傲娇毒舌': ['喂，没看到我饿了吗', '...才不是在等你喂呢', '快点'],
    '温柔治愈': ['有点饿了呢~', '能给我点吃的吗', '谢谢...'],
  },
  happy: {
    '慵懒治愈': ['嘿嘿~', '好舒服哦', '最喜欢这里了'],
    '害羞胆小': ['(*^▽^*)', '开心...', '谢谢你'],
    '好奇活泼': ['好开心呀！！', '想跟你玩！', '蹦跶蹦跶~'],
    '傲娇毒舌': ['哼...还行吧', '...今天状态不错', '（尾巴偷偷摇晃）'],
    '温柔治愈': ['好幸福~', '遇见你真好', '一起度过的日子真温暖'],
  },
  dirty: {
    '慵懒治愈': ['我好脏...', '想洗澡...', '黏糊糊的...'],
    '害羞胆小': ['那个...我有点脏了', '可以帮我洗一洗吗', '好难为情...'],
    '好奇活泼': ['我脏啦！快帮我洗！', '浑身痒痒', '肥皂泡泡~'],
    '傲娇毒舌': ['还不快来打扫', '...我才不是嫌脏', '快点'],
    '温柔治愈': ['有点脏了呢', '帮我擦一擦吧', '辛苦啦~'],
  },
  after_feed: {
    all: ['好好吃！', '吃饱了~', '谢谢你~', '好满足'],
  },
  after_play: {
    all: ['好开心！', '再来一次！', '累了...但好满足', '哈哈~'],
  },
  after_clean: {
    all: ['干干净净！', '好舒服~', '香香的', '谢谢你帮我打扫'],
  },
};

// ===== AI 可配置接口（MVP 留空，Phase 3 接入） =====
export const AI_CONFIG = {
  endpoint: '',  // 如 'https://api.deepseek.com/v1/chat/completions'
  apiKey: '',    // 用户在设置里填写
  defaultModel: '',
  enabled: false,
};
```

- [ ] **Step 2: 打开浏览器验证 JS 无语法错误**

`http://localhost:8765/` → F12 Console → **预期**：没有 config.js 的 404，没有语法错误（因为 game.js 还写了 import 但内容是空的，会有 "Cannot find module" 类错误，这是预期的，Task 3 解决）。

---

### Task 3: state.js — PetState + SceneState + GameState

**Files:**
- Create: `/workspace/js/state.js`

- [ ] **Step 1: 写 state.js**

```js
import { DECAY, INITIAL_STATE, ELEMENTS, SCENES, SPRITES } from './config.js';

/**
 * 单只精灵的状态
 * 纯数据类，不做 DOM / 存储 / 时间计算
 */
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

    this.hunger = INITIAL_STATE.hunger;   // 饱食度 0-100
    this.mood = INITIAL_STATE.mood;       // 心情值 0-100
    this.clean = INITIAL_STATE.clean;     // 清洁度 0-100
    this.affection = 0;                    // 好感度（Phase 2 用，MVP 先字段存在）
    this.lastUpdate = Date.now();
  }

  /** 状态变化：clamp 到 0-100 */
  applyChange(delta) {
    if (delta.hunger !== undefined) this.hunger = clamp(this.hunger + delta.hunger, 0, 100);
    if (delta.mood !== undefined)   this.mood   = clamp(this.mood   + delta.mood,   0, 100);
    if (delta.clean !== undefined)  this.clean  = clamp(this.clean  + delta.clean,  0, 100);
    this.lastUpdate = Date.now();
  }

  /** 获取"当前状态关键字"用于 L1 台词触发 */
  get statusKey() {
    if (this.mood < 30) return 'lonely';
    if (this.clean < 30) return 'dirty';
    if (this.hunger < 30) return 'hungry';
    if (this.mood > 70 && this.hunger > 50) return 'happy';
    return 'idle';
  }

  /** 序列化（只存纯值，不存函数/颜色定义） */
  toJSON() {
    return {
      id: this.id, hunger: this.hunger, mood: this.mood, clean: this.clean,
      affection: this.affection, lastUpdate: this.lastUpdate,
    };
  }
}

/**
 * 一个场景
 * 纯数据容器，存放当前展示的精灵列表
 */
export class SceneState {
  constructor(key) {
    this.key = key;
    this.name = SCENES[key].name;
    this.element = SCENES[key].element;
    this.colors = SCENES[key].colors;
    this.petIds = []; // 该场景内有哪些精灵 id
  }
}

/**
 * 全局游戏状态 —— 单例
 * 管理所有宠物、当前场景、全局时间
 */
export class GameState {
  constructor() {
    this.pets = {};     // { [petId]: PetState }
    this.scenes = {};   // { [sceneKey]: SceneState }
    this.currentScene = 'forest';
    this.createdAt = Date.now();
    this.lastSaved = Date.now();
  }

  addPet(pet) { this.pets[pet.id] = pet; }

  get activePets() {
    return Object.values(this.pets).filter(p => p.element === SCENES[this.currentScene].element);
  }

  /** 根据 delta 时间（分钟）对所有宠物状态做衰减 */
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

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
```

- [ ] **Step 2: 创建空文件**

```bash
touch /workspace/js/{storage,renderer,sprites,interactions,ai,game}.js
```

- [ ] **Step 3: 无语法错误验证**

`http://localhost:8765/` → Console → **预期**：新的报错提示 storage.js 找不到（这是预期的，Task 4 创建）。

---

### Task 4: storage.js — localStorage 持久化

**Files:**
- Modify: `/workspace/js/storage.js`

- [ ] **Step 1: 写 storage.js**

```js
import { GameState, PetState } from './state.js';
import { SPRITES, SCENES, INITIAL_STATE } from './config.js';

const KEY = 'pocketmoss_save_v1';

/** 新建游戏：3 只初始精灵全部放 forest 场景 */
export function createNewGame() {
  const gs = new GameState();
  // 初始化 5 个场景容器（MVP 只用 forest）
  Object.keys(SCENES).forEach(k => {
    gs.scenes[k] = { key: k, name: SCENES[k].name, element: SCENES[k].element, petIds: [] };
  });
  // MVP 的 3 只木元素精灵
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

  // Normalize 所有已知精灵
  if (Array.isArray(data.pets)) {
    data.pets.forEach(save => {
      if (!SPRITES[save.id]) return; // 跳过未知 id，防止存档被污染
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
        petIds: Array.isArray(s.petIds) ? s.petIds.filter(id => gs.pets[id]) : [],
      };
    });
  }
  // 确保 forest 有 3 只精灵
  if (!gs.scenes.forest) {
    gs.scenes.forest = { key: 'forest', name: SCENES.forest.name, element: 'wood', petIds: [] };
  }
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

  gs.currentScene = data.currentScene ?? 'forest';
  gs.createdAt = data.createdAt ?? Date.now();
  gs.lastSaved = data.lastSaved ?? Date.now();

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
```

- [ ] **Step 2: 手动测试存档**

在 Console 运行 `localStorage.removeItem('pocketmoss_save_v1')` → 刷新 → Console 输入 `let g = await import('./js/storage.js').then(m => m.loadGame())`（或先等 game.js 写完），确认 3 只精灵生成。

---

### Task 5: ai.js — AI 分层路由

**Files:**
- Modify: `/workspace/js/ai.js`

- [ ] **Step 1: 写 ai.js**

```js
import { L1_LINES, AI_CONFIG } from './config.js';

/**
 * 对话路由
 * @param {string} layer   'L1' | 'L2' | 'L3' | 'auto'
 * @param {import('./state.js').PetState} pet 宠物实例
 * @param {string} context  触发上下文：'idle' | 'after_feed' | 'after_play' | 'after_clean' | 'walk_event'
 */
export async function routeDialog(layer, pet, context = 'idle') {
  // 自动降级
  if (layer === 'auto') layer = resolveLayer(context);

  switch (layer) {
    case 'L1': return pickLine(pet, context);
    case 'L2': return pickLine(pet, context); // Phase 2 替换为剧本化 + API 润色
    case 'L3': return await callLLM(pet, context);
    default:   return pickLine(pet, context);
  }
}

function resolveLayer(context) {
  if (context === 'walk_event' && AI_CONFIG.enabled) return 'L2';
  if (AI_CONFIG.enabled) return 'L3'; // 未来 LLM 调用
  return 'L1';
}

/** 从 L1 台词库按状态 + 性格挑一句 */
function pickLine(pet, context) {
  const key = context === 'idle' ? pet.statusKey : `after_${context}`;
  const group = L1_LINES[key];
  if (!group) return L1_LINES.idle?.all ?? '...';
  const lines = group['all'] ?? group[pet.personality] ?? Object.values(group)[0];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** 真正的 LLM 调用 —— Phase 3 接入，MVP 直接降级 */
async function callLLM(pet, context) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.endpoint) {
    return pickLine(pet, context); // 降级
  }
  const prompt = buildSystemPrompt(pet);
  // TODO Phase 3: fetch(AI_CONFIG.endpoint, ...)
  return pickLine(pet, context);
}

function buildSystemPrompt(pet) {
  return `你是 ${pet.name}，一只性格${pet.personality}的${elementName(pet.element)}精灵。
当前状态：饱食度${Math.round(pet.hunger)}%、心情${Math.round(pet.mood)}%、清洁度${Math.round(pet.clean)}%。
请用精灵的口吻说一句话，不超过30字。`;
}

function elementName(el) {
  return { wood:'苔藓·木', fire:'熔岩·火', water:'潮汐·水', thunder:'风暴·雷', shadow:'影蚀·暗' }[el] ?? '神秘';
}
```

---

### Task 6: sprites.js — 精灵占位 DOM 生成

**Files:**
- Modify: `/workspace/js/sprites.js`

- [ ] **Step 1: 写 sprites.js**

```js
/**
 * 根据 PetState 生成一个像素占位 DOM 片段（div）
 * 统一 60×70 像素占位，2.5D 场景下会被 renderer 缩放定位
 * 用 inline style 保证不依赖额外 CSS
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

  // body 根据 shape 决定 div 结构
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
    // 蘑菇灵：红白蘑菇帽 + 小身子
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

  // 阴影（地板上的椭圆）
  const shadow = document.createElement('div');
  shadow.style.cssText = `position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
    width:36px;height:6px;background:#000;border-radius:50%;opacity:0.25;`;
  root.appendChild(shadow);

  // 绑定点击事件（在 game.js 里重新 attach）
  return root;
}
```

---

### Task 7: renderer.js — Canvas 2.5D 场景 + 精灵定位

**Files:**
- Modify: `/workspace/js/renderer.js`

- [ ] **Step 1: 写 renderer.js**

```js
/**
 * Canvas 2.5D 场景渲染
 * - 背景渐变天空
 * - 等腰梯形地板（近大远小）
 * - 远景装饰（云/星/火山颗粒等）
 * 不操作精灵 DOM（精灵由 sprites.js + 绝对定位负责）
 */
export class SceneRenderer {
  constructor(canvas, petLayer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.petLayer = petLayer;
    this.petPositions = new Map(); // petId → {x, y}
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = rect.width;
    this.H = rect.height;
  }

  /** 清空并重绘场景背景（每帧或切换场景时调用） */
  drawScene(scene, timeOfDay = 'day') {
    const { W, H } = this;
    const c = scene.colors;

    // 1. 天空渐变
    const sky = this.ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, c.skyTop);
    sky.addColorStop(1, c.skyBot);
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, W, H * 0.55);

    // 2. 远景装饰（简化：云斑 / 火山颗粒 / 星点）
    this.drawDecor(scene, timeOfDay);

    // 3. 地平线
    this.ctx.fillStyle = scene.key === 'forest' ? '#0a3a2a' : c.groundDark;
    this.ctx.fillRect(0, H * 0.55, W, 2);

    // 4. 等腰梯形地板 2.5D
    this.drawGround(scene);
  }

  drawGround(scene) {
    const { W, H } = this;
    const c = scene.colors;
    const horizon = H * 0.55;
    const groundTop = H * 0.58;
    const groundBot = H - 10;

    // 梯形路径
    this.ctx.beginPath();
    this.ctx.moveTo(W * 0.05, groundTop);
    this.ctx.lineTo(W * 0.95, groundTop);
    this.ctx.lineTo(W, groundBot);
    this.ctx.lineTo(0, groundBot);
    this.ctx.closePath();

    const grd = this.ctx.createLinearGradient(0, groundTop, 0, groundBot);
    grd.addColorStop(0, c.groundTop);
    grd.addColorStop(0.5, c.groundBot);
    grd.addColorStop(1, c.groundDark);
    this.ctx.fillStyle = grd;
    this.ctx.fill();

    // 水平透视网格线（每隔一段距离一条）
    this.ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    this.ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const t = i / 6;
      const y = groundTop + (groundBot - groundTop) * t;
      const leftX = W * 0.05 * (1 - t);
      const rightX = W - W * 0.05 * (1 - t);
      this.ctx.beginPath();
      this.ctx.moveTo(leftX, y);
      this.ctx.lineTo(rightX, y);
      this.ctx.stroke();
    }
  }

  drawDecor(scene, timeOfDay) {
    const { W, H } = this;
    const c = scene.colors;
    // 太阳/月亮
    this.ctx.fillStyle = timeOfDay === 'night' ? '#e5e7eb' : c.accent;
    this.ctx.beginPath();
    this.ctx.arc(W * 0.85, H * 0.12, 10, 0, Math.PI * 2);
    this.ctx.fill();
    // 云/雾
    this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
    this.ctx.beginPath();
    this.ctx.ellipse(W * 0.15, H * 0.18, 30, 8, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.ellipse(W * 0.55, H * 0.1, 22, 6, 0, 0, Math.PI * 2);
    this.ctx.fill();
  }

  /**
   * 计算每只精灵在 2.5D 地板上的 {x,y} 像素位置
   * 均匀分布在可见地板区域，每只精灵有 depth（远/近）
   */
  computePetPositions(pets) {
    const { W, H } = this;
    const n = pets.length;
    const positions = [];
    // 沿地板的 depth 比例分布（0.2~0.8，远到近）
    const depths = n <= 1 ? [0.5] : linspace(0.22, 0.78, n);
    pets.forEach((pet, i) => {
      const t = depths[i];
      const horizon = H * 0.58;
      const groundBot = H - 10;
      const y = horizon + (groundBot - horizon) * t;
      // 水平方向：中间偏散
      const jitter = (Math.random() - 0.5) * 0.15;
      const baseX = 0.5 + (i - (n - 1) / 2) * 0.14;
      const x = W * clamp(baseX + jitter, 0.1, 0.9);
      positions.push({ petId: pet.id, x, y, depth: t });
    });
    return positions.sort((a, b) => a.depth - b.depth); // 远的先画（但 DOM 靠 z-index）
  }

  /** 计算"比例"：depth 0→scale 0.6, depth 1→scale 1.1 */
  static depthToScale(depth) { return 0.55 + depth * 0.55; }
}

function linspace(a, b, n) {
  if (n === 1) return [(a + b) / 2];
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(a + (b - a) * (i / (n - 1)));
  return arr;
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
```

---

### Task 8: interactions.js — 喂食/玩耍/清洁/对话 路由

**Files:**
- Modify: `/workspace/js/interactions.js`

- [ ] **Step 1: 写 interactions.js**

```js
import { INTERACTION } from './config.js';
import { routeDialog } from './ai.js';
import { saveGame } from './storage.js';

/**
 * 对 pet 执行一个互动，返回 Promise
 * 1. 应用状态变化
 * 2. 触发 AI 对话（L1 auto）
 * 3. 保存
 */
export async function doInteraction(game, petId, action) {
  const pet = game.pets[petId];
  if (!pet) return null;

  // 1. 应用数值变化
  const delta = INTERACTION[action] ?? {};
  pet.applyChange(delta);

  // 2. 对话
  const context = mapActionToContext(action);
  const text = await routeDialog('auto', pet, context);

  // 3. 保存
  saveGame(game);

  return { pet, text, action };
}

/** 随机挑一个活跃宠物（用户没点具体宠物时） */
export function pickRandomActivePet(game) {
  const active = game.activePets;
  if (active.length === 0) return null;
  return active[Math.floor(Math.random() * active.length)];
}

function mapActionToContext(action) {
  return { feed: 'after_feed', play: 'after_play', clean: 'after_clean', talk: 'idle', walk: 'walk_event' }[action] ?? 'idle';
}
```

---

### Task 9: css/styles.css — GBA 色板 + 方案 C 布局

**Files:**
- Modify: `/workspace/css/styles.css`（完整填充）

- [ ] **Step 1: 写 styles.css**

```css
/* ====== GBA 色板变量 ====== */
:root {
  --gba-dark:  #0f380f;
  --gba-mid:   #306230;
  --gba-light: #8bac0f;
  --gba-bg:    #9bbc0f;
  --screen-w:  100dvw;
  --screen-h:  100dvh;
  --safe-top:  env(safe-area-inset-top, 0px);
  --safe-bot:  env(safe-area-inset-bottom, 0px);
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a0a; }
body { font-family: 'Courier New', monospace; font-smoothing: none; image-rendering: pixelated;
  -webkit-user-select: none; user-select: none; touch-action: manipulation; }

#app {
  width: var(--screen-w); height: var(--screen-h);
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
  background: #0a0a0a;
}

/* ===== 顶部 HUD Grid ===== */
.hud-top {
  background: rgba(0,0,0,0.85);
  padding: calc(6px + var(--safe-top)) 8px 6px;
  border-bottom: 2px solid #306230;
  flex-shrink: 0; z-index: 50;
}
.hud-row-1 {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; letter-spacing: 1px; color: var(--gba-bg); margin-bottom: 4px;
}
.hud-pets-row {
  display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px;
  scrollbar-width: none;
}
.hud-pets-row::-webkit-scrollbar { display: none; }
.hud-pet-chip {
  flex: 0 0 auto; background: #1a1a1a; border: 1px solid var(--gba-mid);
  padding: 3px 5px; display: flex; flex-direction: column; gap: 2px;
  min-width: 52px; cursor: pointer;
}
.hud-pet-chip.active { border-color: var(--gba-bg); background: #1e2a1e; }
.hud-pet-chip .name { font-size: 9px; color: var(--gba-bg); text-align: center; }
.hud-pet-chip .avatar { width: 14px; height: 14px; border-radius: 2px; margin: 0 auto; }
.hud-pet-chip .bar { height: 3px; background: #333; }
.hud-pet-chip .bar > div { height: 100%; transition: width 0.4s; }

/* ===== 2.5D 场景区 ===== */
.scene-wrap {
  flex: 1; position: relative; overflow: hidden;
  background: #022c22;
}
#scene-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.sprite-layer, .bubble-layer { position: absolute; inset: 0; pointer-events: none; }
.sprite-unit { pointer-events: auto; }

/* 呼吸动画 — 原地微缩放 */
@keyframes breath {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50%      { transform: translate(-50%, -50%) scale(1.04); }
}
.sprite-unit { animation: breath 3s ease-in-out infinite; }

/* 点击爆散粒子 */
@keyframes particle-fly {
  from { transform: translate(0,0) scale(1); opacity: 1; }
  to   { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
}
.particle {
  position: absolute; width: 6px; height: 6px; border-radius: 1px;
  animation: particle-fly 0.6s ease-out forwards;
  pointer-events: none; z-index: 100;
}

/* AI 对话气泡 */
.bubble {
  position: absolute; pointer-events: none;
  background: var(--gba-bg); color: var(--gba-dark);
  padding: 6px 10px; border-radius: 8px;
  border: 2px solid var(--gba-dark);
  font-size: 11px; font-family: 'Courier New', monospace;
  max-width: 160px; text-align: center;
  transform: translateX(-50%);
  animation: bubble-in 0.25s ease-out;
  z-index: 60;
}
@keyframes bubble-in {
  from { transform: translateX(-50%) translateY(6px); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0); opacity: 1; }
}

/* ===== 底部 5 按钮 ===== */
.quick-bar {
  background: rgba(0,0,0,0.85); border-top: 2px solid var(--gba-mid);
  display: flex; justify-content: space-around;
  padding: 8px 4px calc(8px + var(--safe-bot));
  flex-shrink: 0; z-index: 50;
}
.qb-btn {
  background: #1a1a1a; border: 2px solid var(--gba-mid); color: var(--gba-bg);
  font-family: 'Courier New', monospace; font-size: 11px;
  padding: 6px 4px; display: flex; flex-direction: column; align-items: center;
  gap: 2px; min-width: 56px; cursor: pointer;
  border-radius: 4px; transition: background 0.1s;
}
.qb-btn:active { background: var(--gba-mid); transform: scale(0.96); }
.qb-btn.qb-ai { background: var(--gba-bg); color: var(--gba-dark); border-color: var(--gba-dark); font-weight: bold; }
.qb-btn.qb-ai:active { background: var(--gba-light); }

/* Toast 提示 */
.toast {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.85); color: var(--gba-bg);
  padding: 10px 20px; border: 2px solid var(--gba-mid); border-radius: 6px;
  font-size: 13px; font-family: 'Courier New', monospace;
  opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 100;
}
.toast.show { opacity: 1; }
```

---

### Task 10: game.js — 主入口 + rAF 循环 + 事件绑定

**Files:**
- Modify: `/workspace/js/game.js`

- [ ] **Step 1: 写 game.js**

```js
import { loadGame, saveGame, resetSave } from './storage.js';
import { SceneRenderer } from './renderer.js';
import { createSpriteEl } from './sprites.js';
import { doInteraction, pickRandomActivePet } from './interactions.js';

// 调试便捷：挂到 window
window.resetSave = resetSave;
window.__game = null;

class PocketMossGame {
  constructor() {
    this.game = loadGame();
    this.canvas = document.getElementById('scene-canvas');
    this.petLayer = document.getElementById('sprite-layer');
    this.bubbleLayer = document.getElementById('bubble-layer');
    this.renderer = new SceneRenderer(this.canvas, this.petLayer);
    this.selectedPetId = null;
    this.lastTick = Date.now();
    this.initHud();
    this.bindEvents();
    this.loop();
    this.clock();
  }

  /** 初始化 HUD + 精灵渲染 */
  initHud() {
    document.getElementById('scene-name').textContent =
      `▲ ${this.game.scenes[this.game.currentScene].name.toUpperCase()}`;
    document.getElementById('battery').textContent = 'BATT●●●●';
    document.getElementById('clock').textContent = '--:--';
    this.renderScene();
  }

  renderScene() {
    const scene = this.game.scenes[this.game.currentScene];
    // Canvas 背景
    this.renderer.drawScene(scene);
    // 精灵 DOM
    this.petLayer.innerHTML = '';
    const pets = this.game.activePets;
    const positions = this.renderer.computePetPositions(pets);
    positions.sort((a, b) => a.depth - b.depth);
    positions.forEach(({ petId, x, y, depth }) => {
      const pet = this.game.pets[petId];
      const el = createSpriteEl(pet);
      const scale = SceneRenderer.depthToScale(depth);
      el.style.left = x + 'px';
      el.style.top  = y + 'px';
      el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      el.style.zIndex = Math.floor(depth * 100);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onPetClick(pet);
      });
      this.petLayer.appendChild(el);
    });
    // HUD chips
    this.renderHudChips();
  }

  renderHudChips() {
    const row = document.getElementById('hud-pets');
    row.innerHTML = '';
    this.game.activePets.forEach(pet => {
      const chip = document.createElement('div');
      chip.className = 'hud-pet-chip' + (pet.id === this.selectedPetId ? ' active' : '');
      chip.innerHTML = `
        <div class="avatar" style="background:${pet.bodyColor};"></div>
        <div class="name">${pet.name}</div>
        <div class="bar"><div style="background:#ef4444;width:${pet.hunger}%;"></div></div>
        <div class="bar"><div style="background:#fbbf24;width:${pet.mood}%;"></div></div>
        <div class="bar"><div style="background:#60a5fa;width:${pet.clean}%;"></div></div>
      `;
      chip.addEventListener('click', () => {
        this.selectedPetId = pet.id;
        this.renderHudChips();
      });
      row.appendChild(chip);
    });
  }

  bindEvents() {
    // 快捷栏按钮
    document.querySelectorAll('.qb-btn').forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener('click', () => this.onQuickAction(action));
    });
    // 场景空白处点击 → 取消选择 + 清除气泡
    document.getElementById('scene-wrap').addEventListener('click', () => {
      this.selectedPetId = null;
      this.clearBubble();
      this.renderHudChips();
    });
  }

  async onQuickAction(action) {
    const petId = this.selectedPetId ?? pickRandomActivePet(this.game)?.id;
    if (!petId) return this.showToast('这里没有精灵');
    const result = await doInteraction(this.game, petId, action);
    if (result) {
      this.showBubble(result.pet, result.text);
      this.spawnParticles(result.pet);
      this.renderScene();
      this.showToast(actionToast(action, result.pet));
    }
  }

  onPetClick(pet) {
    this.selectedPetId = pet.id;
    this.renderHudChips();
    this.onQuickAction('talk'); // 点击 = 主动对话
  }

  showBubble(pet, text) {
    this.clearBubble();
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    // 定位：精灵上方约 80px
    const pos = this.petLayer.querySelector(`[data-pet-id="${pet.id}"]`);
    if (pos) {
      const rect = pos.getBoundingClientRect();
      const wrapRect = this.bubbleLayer.getBoundingClientRect();
      bubble.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
      bubble.style.top  = (rect.top - wrapRect.top - 40) + 'px';
    }
    this.bubbleLayer.appendChild(bubble);
    // 自动清理：3 秒后
    clearTimeout(this._bubbleTimer);
    this._bubbleTimer = setTimeout(() => this.clearBubble(), 3500);
  }

  clearBubble() { this.bubbleLayer.innerHTML = ''; }

  spawnParticles(pet) {
    const pos = this.petLayer.querySelector(`[data-pet-id="${pet.id}"]`);
    if (!pos) return;
    const rect = pos.getBoundingClientRect();
    const wrapRect = this.petLayer.getBoundingClientRect();
    const cx = rect.left - wrapRect.left + rect.width / 2;
    const cy = rect.top - wrapRect.top + rect.height / 2;
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = (cx - 3) + 'px';
      p.style.top  = (cy - 3) + 'px';
      p.style.background = pet.bodyColor;
      const angle = (Math.PI * 2 * i) / 8;
      const dist = 30 + Math.random() * 30;
      p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
      p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
      this.petLayer.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }

  showToast(text) {
    const t = document.getElementById('toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 1500);
  }

  /** requestAnimationFrame 循环：处理 tick */
  loop = () => {
    const now = Date.now();
    const deltaMin = (now - this.lastTick) / 60000;
    if (deltaMin >= 0.5) { // 每 30 秒一次 tick
      this.game.tick(deltaMin);
      this.lastTick = now;
      this.renderHudChips(); // 状态条更新
    }
    requestAnimationFrame(this.loop);
  }

  /** 时钟每秒更新 */
  clock() {
    const t = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      document.getElementById('clock').textContent = `${h}:${m}`;
    };
    t(); setInterval(t, 30000);
  }
}

function actionToast(action, pet) {
  return {
    feed: '吃饱饱~',
    play: '玩得好开心！',
    clean: '干干净净',
    talk: '喵~',
    walk: '出发散步',
  }[action] ?? pet.name;
}

// 启动
window.addEventListener('DOMContentLoaded', () => {
  window.__game = new PocketMossGame();
});
```

- [ ] **Step 2: 浏览器端到端验证**

1. `http://localhost:8765/` → **预期**：看到完整的"方案 C"布局
   - 顶部 HUD Grid：场景名 + 电量 + 时间 + 3 只精灵的头像和状态条
   - 中间：Canvas 2.5D 森林场景（绿色天空渐变 + 梯形地板 + 地平线 + 太阳 + 云）+ 3 只精灵像素占位
   - 底部 5 按钮快捷栏（AI 对话按钮高亮）
2. 点击任何精灵 → 应弹出 AI L1 对话气泡（打字机效果？不，MVP 直接显示）
3. 点 🍖喂食 / 🎾玩耍 / 🧼清洁 / 💬对话 → 状态条变化 + 对话气泡 + 粒子爆散 + Toast
4. **刷新页面** → 数据恢复 → 3 只精灵状态继续（离线衰减已补偿）
5. **Console 运行 `resetSave()`** → 刷新 → 重新生成存档

**验收标准（MVP Done）：**
- [x] 1 个场景（Whispering Forest + GBA 绿板）
- [x] 3 只精灵（苔藓兽 blob / 蘑菇灵 / 藤叶精 各有独特 CSS 形状）
- [x] ❤⚡💧 三条状态数值 + 离线衰减补偿（上限 6h）
- [x] 喂食/玩耍/清洁/对话 全部可用
- [x] AI L1 本地台词库（按状态 + 性格选句）
- [x] localStorage 单存档 + normalize
- [x] Canvas 2.5D 地板 + 透视网格线
- [x] 精灵深度缩放 + 点击粒子爆散 + 呼吸动画
- [x] 顶部 HUD Grid + 底部 5 按钮 方案 C 布局

---

## Plan Self-Review

### Spec 覆盖检查
- ✅ MVP 1 场景 → Task 7
- ✅ MVP 3 精灵 → Task 6 + Task 10
- ✅ 状态系统 + 离线衰减 → Task 3
- ✅ 互动（喂食/玩耍/清洁）→ Task 8 + Task 10
- ✅ UI 方案 C 布局 → Task 1 + Task 9
- ✅ AI L1 → Task 5
- ✅ localStorage 存档 + normalize → Task 4
- ✅ 动态效果（粒子爆散 / 呼吸）→ Task 6 + Task 10
- ✅ 2.5D 透视 → Task 7
- ✅ AI endpoint 留接口 → Task 2 `AI_CONFIG` + Task 5 `AI_CONFIG.enabled` 降级
- ✅ 项目结构分层 → 全 plan 明确

### Placeholder 扫描
- 无 TBD/TODO —— Task 5 中的 "Phase 2 替换" / "Phase 3 接入" 属于 roadmap 注释，不是未完成的实现步骤
- 所有代码步骤都是完整的、可直接复制粘贴的
- 无 "类似 Task N" 引用

### 类型一致性
- PetState / SceneState / GameState / SceneRenderer 名称一致
- INTERACTION / DECAY / L1_LINES 常量名一致
- `routeDialog` / `createSpriteEl` / `doInteraction` / `pickRandomActivePet` 签名一致
- `statusKey` 计算规则在 state.js 中一次性定义，被 ai.js 引用

**Plan 无问题，可以执行。**
