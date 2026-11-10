import { L1_LINES, AI_CONFIG } from './config.js';

/**
 * 对话路由 —— 分层降级
 * @param {'L1'|'L2'|'L3'|'auto'} layer
 * @param {import('./state.js').PetState} pet
 * @param {string} context  idle / after_feed / after_play / after_clean / walk_event
 */
export async function routeDialog(layer, pet, context = 'idle') {
  if (layer === 'auto') layer = resolveLayer(context);

  switch (layer) {
    case 'L1': return pickLine(pet, context);
    case 'L2': return pickLine(pet, context); // Phase 2 剧本化 + API 润色
    case 'L3': return await callLLM(pet, context);
    default:   return pickLine(pet, context);
  }
}

function resolveLayer(context) {
  if (AI_CONFIG.enabled) return 'L3'; // 有 API 配置就自动走 L3
  return 'L1'; // MVP 默认 L1
}

/** 从 L1 台词库按 状态+性格 挑一句 */
function pickLine(pet, context) {
  const key = context === 'idle' ? pet.statusKey : `after_${context}`;
  const group = L1_LINES[key];
  if (!group) return '...';
  const lines = group.all ?? group[pet.personality] ?? Object.values(group)[0];
  return lines[Math.floor(Math.random() * lines.length)];
}

/** LLM 调用 —— Phase 3 接入，MVP 自动降级 */
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
