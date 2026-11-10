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

// ===== 全部 15 只精灵（5 元素 × 3） =====
// evolved: 好感度满后切换的进阶色板
export const SPRITES = {
  // --- 木 · Whispering Forest ---
  mossbeast: {
    id: 'mossbeast', name: '苔藓兽', element: 'wood',
    personality: '慵懒治愈',
    bodyColor: '#10b981', shadowColor: '#059669',
    evolved: { bodyColor: '#34d399', shadowColor: '#047857' },
    shape: 'blob', traits: { leaf: true },
  },
  mushroom: {
    id: 'mushroom', name: '蘑菇灵', element: 'wood',
    personality: '害羞胆小',
    bodyColor: '#fca5a5', shadowColor: '#b91c1c',
    evolved: { bodyColor: '#fecaca', shadowColor: '#dc2626' },
    shape: 'mushroom', traits: { cap: 'white-spots' },
  },
  leafsprite: {
    id: 'leafsprite', name: '藤叶精', element: 'wood',
    personality: '好奇活泼',
    bodyColor: '#34d399', shadowColor: '#059669',
    evolved: { bodyColor: '#6ee7b7', shadowColor: '#10b981' },
    shape: 'leafy', traits: { leaf: true, stem: true },
  },

  // --- 火 · Ash Volcano ---
  flamefox: {
    id: 'flamefox', name: '炎狐', element: 'fire',
    personality: '傲娇毒舌',
    bodyColor: '#f97316', shadowColor: '#c2410c',
    evolved: { bodyColor: '#fbbf24', shadowColor: '#b45309' },
    shape: 'fox', traits: {},
  },
  lavaspirit: {
    id: 'lavaspirit', name: '熔岩精', element: 'fire',
    personality: '慵懒治愈',
    bodyColor: '#ea580c', shadowColor: '#7c2d12',
    evolved: { bodyColor: '#f43f5e', shadowColor: '#9f1239' },
    shape: 'lavablob', traits: {},
  },
  sparkseed: {
    id: 'sparkseed', name: '火星种', element: 'fire',
    personality: '好奇活泼',
    bodyColor: '#fbbf24', shadowColor: '#d97706',
    evolved: { bodyColor: '#fde047', shadowColor: '#ca8a04' },
    shape: 'spark', traits: {},
  },

  // --- 水 · Crystal Lake ---
  dropfrog: {
    id: 'dropfrog', name: '水滴蛙', element: 'water',
    personality: '温柔治愈',
    bodyColor: '#60a5fa', shadowColor: '#2563eb',
    evolved: { bodyColor: '#34d399', shadowColor: '#059669' },
    shape: 'frog', traits: {},
  },
  jellyspirit: {
    id: 'jellyspirit', name: '水母灵', element: 'water',
    personality: '害羞胆小',
    bodyColor: '#93c5fd', shadowColor: '#3b82f6',
    evolved: { bodyColor: '#e0e7ff', shadowColor: '#818cf8' },
    shape: 'jelly', traits: {},
  },
  bubbledragon: {
    id: 'bubbledragon', name: '泡泡龙', element: 'water',
    personality: '好奇活泼',
    bodyColor: '#38bdf8', shadowColor: '#0369a1',
    evolved: { bodyColor: '#818cf8', shadowColor: '#4f46e5' },
    shape: 'dragon', traits: {},
  },

  // --- 雷 · Thunder Peak ---
  thundermouse: {
    id: 'thundermouse', name: '雷电鼠', element: 'thunder',
    personality: '好奇活泼',
    bodyColor: '#facc15', shadowColor: '#a16207',
    evolved: { bodyColor: '#fde047', shadowColor: '#ca8a04' },
    shape: 'mouse', traits: {},
  },
  cloudspirit: {
    id: 'cloudspirit', name: '云朵灵', element: 'thunder',
    personality: '慵懒治愈',
    bodyColor: '#e0e7ff', shadowColor: '#818cf8',
    evolved: { bodyColor: '#ffffff', shadowColor: '#a5b4fc' },
    shape: 'cloud', traits: {},
  },
  lightningbird: {
    id: 'lightningbird', name: '闪电鸟', element: 'thunder',
    personality: '傲娇毒舌',
    bodyColor: '#a78bfa', shadowColor: '#6d28d9',
    evolved: { bodyColor: '#c4b5fd', shadowColor: '#7c3aed' },
    shape: 'bird', traits: {},
  },

  // --- 暗 · Abyss Cavern ---
  shadowbat: {
    id: 'shadowbat', name: '暗影蝠', element: 'shadow',
    personality: '孤僻少言',
    bodyColor: '#7e22ce', shadowColor: '#3b0764',
    evolved: { bodyColor: '#a855f7', shadowColor: '#581c87' },
    shape: 'bat', traits: {},
  },
  dreamspirit: {
    id: 'dreamspirit', name: '梦灵', element: 'shadow',
    personality: '温柔治愈',
    bodyColor: '#c4b5fd', shadowColor: '#7c3aed',
    evolved: { bodyColor: '#ddd6fe', shadowColor: '#8b5cf6' },
    shape: 'dream', traits: {},
  },
  ghostseed: {
    id: 'ghostseed', name: '幽灵种', element: 'shadow',
    personality: '害羞胆小',
    bodyColor: '#e9d5ff', shadowColor: '#9333ea',
    evolved: { bodyColor: '#f5f3ff', shadowColor: '#a855f7' },
    shape: 'ghost', traits: {},
  },
};

// ===== 状态衰减速率（每分钟变化量） =====
export const DECAY = {
  HUNGER_PER_MIN:  0.6,
  MOOD_PER_MIN:    0.4,
  CLEAN_PER_MIN:   0.3,
  OFFLINE_CAP_HOURS: 6,
};

// ===== 互动效果（含好感度增量） =====
export const INTERACTION = {
  feed:  { hunger:  +25, mood: +5,  affection: +2 },
  play:  { hunger:  -10, mood: +20, affection: +3 },
  clean: { hunger:    0, mood: +5,  clean: +30, affection: +2 },
  talk:  { hunger:    0, mood: +2,  affection: +2 },
  walk:  { hunger:  -15, mood: +15, affection: +4 },
};

// ===== 好感度进化阈值 =====
export const EVOLVE_AT = 60;

// ===== 孵化 =====
export const HATCH = {
  START_EGGS: 1,
  EGG_CHANCE_ON_FIND: 0.25, // 散步"发现"类事件掉蛋概率
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
    '孤僻少言': ['...', '（看了你一眼）', '别靠太近'],
  },
  hungry: {
    '慵懒治愈': ['肚子饿了...', '想吃点软软的...', '不动了，没有能量了'],
    '害羞胆小': ['那个...有没有吃的...', '我好饿', '肚子咕咕叫'],
    '好奇活泼': ['好饿好饿！快给我吃的！', '没力气蹦了...', '食物！食物在哪里？'],
    '傲娇毒舌': ['喂，没看到我饿了吗', '...才不是在等你喂呢', '快点'],
    '温柔治愈': ['有点饿了呢~', '能给我点吃的吗', '谢谢...'],
    '孤僻少言': ['饿了', '...有吃的吗', '（肚子在叫）'],
  },
  happy: {
    '慵懒治愈': ['嘿嘿~', '好舒服哦', '最喜欢这里了'],
    '害羞胆小': ['(*^▽^*)', '开心...', '谢谢你'],
    '好奇活泼': ['好开心呀！！', '想跟你玩！', '蹦跶蹦跶~'],
    '傲娇毒舌': ['哼...还行吧', '...今天状态不错', '（尾巴偷偷摇晃）'],
    '温柔治愈': ['好幸福~', '遇见你真好', '一起度过的日子真温暖'],
    '孤僻少言': ['嗯', '...还不错', '（嘴角微微上扬）'],
  },
  dirty: {
    '慵懒治愈': ['我好脏...', '想洗澡...', '黏糊糊的...'],
    '害羞胆小': ['那个...我有点脏了', '可以帮我洗一洗吗', '好难为情...'],
    '好奇活泼': ['我脏啦！快帮我洗！', '浑身痒痒', '肥皂泡泡~'],
    '傲娇毒舌': ['还不快来打扫', '...我才不是嫌脏', '快点'],
    '温柔治愈': ['有点脏了呢', '帮我擦一擦吧', '辛苦啦~'],
    '孤僻少言': ['脏了', '...帮我洗一下', '（嫌弃地看了看自己）'],
  },
  after_feed: { all: ['好好吃！', '吃饱了~', '谢谢你~', '好满足'] },
  after_play: { all: ['好开心！', '再来一次！', '累了...但好满足', '哈哈~'] },
  after_clean:{ all: ['干干净净！', '好舒服~', '香香的', '谢谢你帮我打扫'] },
};

// ===== 散步事件表（每场景 8 个；tag 决定精灵的 L2 反应） =====
// tag: find(发现) / scare(惊吓) / mystery(神秘) / friend(友谊)
export const WALK_EVENTS = {
  forest: [
    { text: '发现了一朵发光的蘑菇', tag: 'find' },
    { text: '蝴蝶停在了鼻尖上', tag: 'friend' },
    { text: '听到树洞里有奇怪的声音', tag: 'mystery' },
    { text: '被藤蔓绊了一跤', tag: 'scare' },
    { text: '找到了一颗闪闪的露珠', tag: 'find' },
    { text: '和松鼠分享了果子', tag: 'friend' },
    { text: '看到了古老的树精灵影子', tag: 'mystery' },
    { text: '突然下起了小雨', tag: 'scare' },
  ],
  volcano: [
    { text: '踩到了温热的岩浆石', tag: 'scare' },
    { text: '发现了发光的火山晶', tag: 'find' },
    { text: '火山口冒出了奇怪的烟圈', tag: 'mystery' },
    { text: '和火蜥蜴赛跑了一程', tag: 'friend' },
    { text: '差点被火星溅到', tag: 'scare' },
    { text: '找到了一块温暖的黑曜石', tag: 'find' },
    { text: '听到地下传来低沉的轰鸣', tag: 'mystery' },
    { text: '岩浆里跳出一朵小火苗打招呼', tag: 'friend' },
  ],
  lake: [
    { text: '捡到了圆润的鹅卵石', tag: 'find' },
    { text: '水面升起了一道彩虹', tag: 'mystery' },
    { text: '被调皮的鱼溅了一身水', tag: 'scare' },
    { text: '和小乌龟一起晒太阳', tag: 'friend' },
    { text: '发现了湖底的一闪一闪', tag: 'find' },
    { text: '听到远处传来歌声', tag: 'mystery' },
    { text: '泡泡从湖底咕嘟咕嘟冒上来', tag: 'friend' },
    { text: '水蛇突然从脚边游过', tag: 'scare' },
  ],
  peak: [
    { text: '被静电炸毛了', tag: 'scare' },
    { text: '捡到了一根带电的雷羽', tag: 'find' },
    { text: '云层里闪过巨大的影子', tag: 'mystery' },
    { text: '和一朵雷云赛跑了', tag: 'friend' },
    { text: '发现了风化的古老石碑', tag: 'mystery' },
    { text: '找到了亮晶晶的电气石', tag: 'find' },
    { text: '被强风吹得转了个圈', tag: 'scare' },
    { text: '一只小鸟落在了肩膀上', tag: 'friend' },
  ],
  cavern: [
    { text: '听到了自己的回声', tag: 'mystery' },
    { text: '发现了发光的苔藓壁画', tag: 'find' },
    { text: '黑暗中有什么擦过了翅膀', tag: 'scare' },
    { text: '和小蝙蝠交换了眼神', tag: 'friend' },
    { text: '捡到了千年不化的水晶', tag: 'find' },
    { text: '地下河传来低语声', tag: 'mystery' },
    { text: '影子突然自己动了一下', tag: 'scare' },
    { text: '遇到了提着灯笼的老鼠', tag: 'friend' },
  ],
};

// ===== L2 剧本化反应（散步事件：tag × 性格） =====
export const L2_REACTIONS = {
  find: {
    '慵懒治愈': ['哦...亮晶晶的', '可以当枕头...'],
    '害羞胆小': ['这...这个可以给我吗', '好漂亮...'],
    '好奇活泼': ['哇！是宝藏吗！', '我要我要！'],
    '傲娇毒舌': ['哼，算你运气好', '...勉强收下吧'],
    '温柔治愈': ['好漂亮呀~', '送给你一半'],
    '孤僻少言': ['...收下了', '哦'],
  },
  scare: {
    '慵懒治愈': ['呜哇...吓醒了', '想回家睡觉...'],
    '害羞胆小': ['呜...好可怕', '我们快走吧...'],
    '好奇活泼': ['哇刺激！再来一次！', '哈哈哈吓我一跳！'],
    '傲娇毒舌': ['哼，才没吓到', '无聊...'],
    '温柔治愈': ['哎呀，吓到了呢', '没事没事~'],
    '孤僻少言': ['...！', '（假装镇定）'],
  },
  mystery: {
    '慵懒治愈': ['好神秘哦...zZ', '嗯...是什么呢'],
    '害羞胆小': ['那...那是什么呀', '我有点害怕...'],
    '好奇活泼': ['去看看！快去看看！', '有秘密！一定有秘密！'],
    '傲娇毒舌': ['切，装神弄鬼', '...有点意思'],
    '温柔治愈': ['好奇妙的感觉~', '像是梦里的场景'],
    '孤僻少言': ['...有意思', '（盯着看）'],
  },
  friend: {
    '慵懒治愈': ['新朋友...好耶', '一起玩...然后一起睡觉'],
    '害羞胆小': ['可...可以做朋友吗', '好开心...'],
    '好奇活泼': ['新朋友！耶！', '一起玩一起玩！'],
    '傲娇毒舌': ['哼，勉强陪你玩', '...还不错的家伙'],
    '温柔治愈': ['好温暖呀~', '朋友真好'],
    '孤僻少言': ['...嗯', '（稍微靠近了一点）'],
  },
};

// ===== AI 接口（DeepSeek，OpenAI 兼容格式） =====
export const AI_CONFIG = {
  endpoint: 'https://api.deepseek.com/chat/completions',
  apiKey: '',           // ← 填入你的 DeepSeek API Key
  defaultModel: 'deepseek-chat',
  enabled: false,       // 填入 Key 后改为 true 即启用 L3 深度对话
};
