import { L1_LINES, L2_REACTIONS, AI_CONFIG } from './config.js';

/**
 * 对话路由 —— 分层降级
 * @param {'L1'|'L2'|'L3'|'auto'} layer
 * @param {import('./state.js').PetState} pet
 * @param {string} context  idle / after_feed / after_play / after_clean / walk_event
 * @param {object} extra    L2 散步事件时传 { tag }
 */
export async function routeDialog(layer, pet, context = 'idle', extra = {}) {
  if (layer === 'auto') layer = resolveLayer(context);

  switch (layer) {
    case 'L2': return pickWalkReaction(pet, extra.tag);
    case 'L3': return await callLLM(pet, context);
    default:   return pickLine(pet, context);
  }
}

function resolveLayer(context) {
  if (context === 'walk_event') return 'L2'; // 散步事件 → 本地剧本化反应
  if (AI_CONFIG.enabled) return 'L3';        // 配置了 API 才走 LLM
  return 'L1';
}

/** 从 L1 台词库按 状态+性格 挑一句 */
function pickLine(pet, context) {
  // context 直接命中台词库分组（after_feed 等）；idle/talk 用状态值
  const key = (context === 'idle' || context === 'talk') ? pet.statusKey : context;
  const group = L1_LINES[key];
  if (!group) return '...';
  const lines = group.all ?? group[pet.personality] ?? Object.values(group)[0];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** L2 散步事件反应：按 事件tag × 性格 挑一句；缺数据降级到 L1 */
function pickWalkReaction(pet, tag) {
  const group = L2_REACTIONS[tag];
  if (!group) return pickLine(pet, 'idle');
  const lines = group[pet.personality] ?? Object.values(group)[0];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** LLM 调用 —— 接口已留好，未配置时自动降级 */
async function callLLM(pet, context) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.endpoint) return pickLine(pet, context);
  const prompt = buildSystemPrompt(pet);
  try {
    const resp = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.defaultModel || 'deepseek-chat',
        messages: [{ role: 'system', content: prompt }, { role: 'user', content: '说一句话吧' }],
        max_tokens: 80, temperature: 0.9,
      }),
    });
    if (!resp.ok) return pickLine(pet, context);
    const json = await resp.json();
    return json?.choices?.[0]?.message?.content?.trim() || pickLine(pet, context);
  } catch {
    return pickLine(pet, context);
  }
}

function buildSystemPrompt(pet) {
  const el = { wood:'苔藓·木', fire:'熔岩·火', water:'潮汐·水', thunder:'风暴·雷', shadow:'影蚀·暗' }[pet.element] ?? '神秘';
  return `你是${pet.name}，一只性格${pet.personality}的${el}精灵。当前饱食度${Math.round(pet.hunger)}%、心情${Math.round(pet.mood)}%、清洁度${Math.round(pet.clean)}%。请用精灵的口吻说一句话，不超过30字。`;
}

/** 多轮对话系统提示（L3 聊天用，允许两三轮的连贯回复） */
function buildChatSystemPrompt(pet) {
  const el = { wood:'苔藓·木', fire:'熔岩·火', water:'潮汐·水', thunder:'风暴·雷', shadow:'影蚀·暗' }[pet.element] ?? '神秘';
  return `你是${pet.name}，一只性格【${pet.personality}】的${el}精灵，住在玩家的口袋里。
当前状态：饱食${Math.round(pet.hunger)}%、心情${Math.round(pet.mood)}%、清洁${Math.round(pet.clean)}%。
对玩家的印象：【${pet.impressionLevel}】（${pet.impression} 分，范围 -100~100）。
规则：
- 始终保持【${pet.personality}】的说话风格，第一人称
- 印象为【亲密】或【熟悉】时：语气更亲昵主动，会分享小秘密、表达想念
- 印象为【疏远】时：语气冷淡敷衍，话少，刻意保持距离
- 每次回复不超过 40 字，口语化，可带拟声词和动作描写（括号包裹）
- 记得之前对话内容，会回应玩家提到的事
- 状态差（数值低于30）时要在语气里体现出来
- 绝对不要承认自己是 AI 或程序`;
}

/** AI 动态散步事件：一次调用产出 `tag｜事件｜反应`；失败返回 null 由调用方降级到本地事件表 */
export async function generateWalkEvent(pet, sceneName) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.endpoint) return null;
  const prompt = `你是文字冒险游戏的编剧。玩家带着一只性格【${pet.personality}】的精灵「${pet.name}」在【${sceneName}】散步。
请生成一个散步小事件，严格按以下格式输出，只输出一行，不要任何其他内容：
tag｜事件描述｜精灵反应
要求：
- tag 必须是这四个之一：find(发现) / scare(惊吓) / mystery(神秘) / friend(友谊)
- 事件描述：不超过20字，符合场景氛围，每次都要不一样
- 精灵反应：不超过15字，必须符合【${pet.personality}】的性格，第一人称口语`;
  try {
    const resp = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.defaultModel || 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80, temperature: 1.0,
      }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const raw = json?.choices?.[0]?.message?.content?.trim();
    if (!raw) return null;
    return parseWalkEvent(raw);
  } catch {
    return null;
  }
}

/** 解析 `tag｜事件｜反应`，兼容全角/半角分隔符；格式不合法返回 null */
function parseWalkEvent(raw) {
  const parts = raw.split(/[｜|]/).map(s => s.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const tag = parts[0].toLowerCase();
  if (!['find', 'scare', 'mystery', 'friend'].includes(tag)) return null;
  return { event: { text: parts[1], tag }, reaction: parts.slice(2).join('，') };
}

/** L3 多轮对话：带记忆发送整条历史，返回回复文本；失败返回 null 由调用方降级 */
export async function chatWithPet(pet, history, userText) {
  if (!AI_CONFIG.enabled || !AI_CONFIG.endpoint) return null;
  const messages = [
    { role: 'system', content: buildChatSystemPrompt(pet) },
    ...history.slice(-8), // 最多带 8 条历史，控制 token 成本
    { role: 'user', content: userText },
  ];
  try {
    const resp = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.defaultModel || 'deepseek-chat',
        messages, max_tokens: 100, temperature: 0.9,
      }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    return json?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}
