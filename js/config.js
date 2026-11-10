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
  wood:   { name: '苔藓·木', sceneKey: 'forest',  color: '#10b981' },
  fire:   { name: '熔岩·火', sceneKey: 'volcano', color: '#f97316' },
  water:  { name: '潮汐·水', sceneKey: 'lake',    color: '#60a5fa' },
  thunder:{ name: '风暴·雷', sceneKey: 'peak',    color: '#a78bfa' },
  shadow: { name: '影蚀·暗', sceneKey: 'cavern',  color: '#581c87' },
};

export const SCENES = {
  forest:  { name: 'Whispering Forest', element: 'wood',   colors: COLORS.SCENE_GREEN },
  volcano: { name: 'Ash Volcano',       element: 'fire',   colors: { skyTop:'#7c3aed', skyBot:'#2e1065', groundTop:'#f97316', groundBot:'#9a3412', groundDark:'#451a03', accent:'#fb923c' } },
  lake:    { name: 'Crystal Lake',      element: 'water',  colors: { skyTop:'#0369a1', skyBot:'#1e3a8a', groundTop:'#3b82f6', groundBot:'#1d4ed8', groundDark:'#1e3a8a', accent:'#60a5fa' } },
  peak:    { name: 'Thunder Peak',      element: 'thunder',colors: { skyTop:'#3730a3', skyBot:'#312e81', groundTop:'#a78bfa', groundBot:'#6d28d9', groundDark:'#3b0764', accent:'#c4b5fd' } },
  cavern:  { name: 'Abyss Cavern',      element: 'shadow', colors: { skyTop:'#3b0764', skyBot:'#0a0a0a', groundTop:'#6b21a8', groundBot:'#3b0764', groundDark:'#0a0a0a', accent:'#a78bfa' } },
};

// ===== 精灵数据（MVP 只做 3 只 wood 元素） =====
export const SPRITES = {
  mossbeast: {
    id: 'mossbeast', name: '苔藓兽', element: 'wood',
    personality: '慵懒治愈',
    bodyColor: '#10b981', shadowColor: '#059669',
    shape: 'blob',
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
  HUNGER_PER_MIN:  0.6,
  MOOD_PER_MIN:    0.4,
  CLEAN_PER_MIN:   0.3,
  OFFLINE_CAP_HOURS: 6,
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
  after_feed: { all: ['好好吃！', '吃饱了~', '谢谢你~', '好满足'] },
  after_play: { all: ['好开心！', '再来一次！', '累了...但好满足', '哈哈~'] },
  after_clean:{ all: ['干干净净！', '好舒服~', '香香的', '谢谢你帮我打扫'] },
};

// ===== AI 可配置接口（MVP 留空，Phase 3 接入） =====
export const AI_CONFIG = {
  endpoint: '',
  apiKey: '',
  defaultModel: '',
  enabled: false,
};
