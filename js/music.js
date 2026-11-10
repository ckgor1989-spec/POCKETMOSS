// POCKETMOSS — 像素 BGM：WebAudio 方波 chiptune，无外部音频文件
// 记谱法："音高:步数"，步=16分音符，0=休止。例："72:2 76:2" = C5 八分 + E5 八分

const MUTE_KEY = 'pocketmoss_bgm_muted';

function seq(str) {
  return str.trim().split(/\s+/).map(tok => {
    const [n, d] = tok.split(':');
    return [parseInt(n, 10), parseInt(d, 10)];
  });
}

// ===== 5 场景 × 5 段循环（不同调式/节拍/速度） =====
const TRACKS = {
  // 森林：C 五声，96bpm，4/4，8 小节 —— 悠闲
  forest: {
    bpm: 96,
    lead: seq(`
      72:2 76:2 79:2 81:2 79:2 76:2 72:4
      74:2 76:2 74:2 72:2 69:4 67:4
      72:2 76:2 79:2 84:2 81:2 79:2 76:4
      79:2 76:2 74:2 72:2 74:8
      72:2 76:2 79:2 81:2 79:2 76:2 72:4
      74:2 76:2 74:2 72:2 69:4 67:4
      72:2 76:2 79:2 84:2 81:2 79:2 76:4
      72:4 69:4 67:4 72:4
    `),
    bass: seq(`
      48:8 48:8  53:8 53:8  45:8 45:8  55:8 53:8
      48:8 48:8  53:8 53:8  45:8 45:8  55:8 48:8
    `),
  },
  // 火山：E 弗里几亚，128bpm，4/4，8 小节 —— 压迫驱动
  volcano: {
    bpm: 128,
    lead: seq(`
      64:2 64:2 72:2 64:2 65:2 64:2 62:2 60:2
      64:2 64:2 76:2 74:2 72:2 71:2 72:4
      64:2 64:2 72:2 64:2 65:2 64:2 62:2 60:2
      64:2 64:2 76:2 77:2 76:2 74:2 72:4
      65:2 65:2 77:2 76:2 74:2 72:2 74:4
      64:2 64:2 72:2 74:2 76:2 74:2 72:4
      64:2 62:2 64:2 65:2 64:2 62:2 60:4
      64:4 62:4 60:4 64:4
    `),
    bass: seq(`
      40:4 40:4 40:4 40:4  40:4 40:4 40:4 40:4
      40:4 40:4 41:4 40:4  40:4 40:4 40:4 40:4
      40:4 40:4 43:4 41:4  40:4 40:4 40:4 40:4
      40:4 40:4 41:4 40:4  40:8 35:8
    `),
  },
  // 湖泊：A 小调五声，84bpm，3/4（每小节 12 步），8 小节 —— 流动感
  lake: {
    bpm: 84,
    lead: seq(`
      69:3 72:3 74:3 76:3
      81:3 76:3 74:3 72:3
      74:3 76:3 79:3 76:3
      72:6 69:6
      69:3 72:3 76:3 81:3
      79:3 76:3 74:3 72:3
      74:3 72:3 74:3 76:3
      69:12
    `),
    bass: seq(`
      45:6 48:6  45:6 52:6  48:6 52:6  45:6 43:6
      45:6 48:6  52:6 48:6  45:6 43:6  45:12
    `),
  },
  // 山巅：D 多利亚，132bpm，4/4，8 小节 —— 分解和弦闪烁
  peak: {
    bpm: 132,
    lead: seq(`
      74:1 77:1 81:1 86:1 81:1 77:1 74:1 77:1 74:1 77:1 81:1 86:1 88:1 86:1 81:1 77:1
      74:1 77:1 81:1 86:1 81:1 77:1 74:1 77:1 74:1 77:1 81:1 86:1 88:1 86:1 81:1 77:1
      72:1 76:1 79:1 84:1 79:1 76:1 72:1 76:1 72:1 76:1 79:1 84:1 86:1 84:1 79:1 76:1
      72:1 76:1 79:1 84:1 79:1 76:1 72:1 76:1 72:1 76:1 79:1 84:1 86:1 84:1 79:1 76:1
      74:1 77:1 81:1 86:1 81:1 77:1 74:1 77:1 74:1 77:1 81:1 86:1 88:1 86:1 81:1 77:1
      74:1 77:1 81:1 86:1 81:1 77:1 74:1 77:1 74:1 77:1 81:1 86:1 88:1 86:1 81:1 77:1
      67:1 71:1 74:1 79:1 74:1 71:1 67:1 71:1 67:1 71:1 74:1 79:1 81:1 79:1 74:1 71:1
      69:1 72:1 76:1 81:1 76:1 72:1 69:1 72:1 69:1 72:1 76:1 81:1 84:1 81:1 76:1 72:1
    `),
    bass: seq(`
      50:8 50:8  50:8 50:8  48:8 48:8  48:8 48:8
      50:8 50:8  50:8 50:8  55:8 55:8  57:8 55:8
    `),
  },
  // 洞窟：B 小调，72bpm，4/4，8 小节 —— 空旷稀疏带休止
  cavern: {
    bpm: 72,
    lead: seq(`
      59:6 0:2 61:6 0:2
      66:6 0:2 64:6 0:2
      64:6 0:2 62:6 0:2
      59:8 0:8
      59:6 0:2 61:6 0:2
      66:6 0:2 64:6 0:2
      67:6 0:2 66:6 0:2
      59:16
    `),
    bass: seq(`
      35:16  35:16  35:16  40:16
      35:16  35:16  43:16  35:16
    `),
  },
};

function midiFreq(n) { return 440 * Math.pow(2, (n - 69) / 12); }

/** 把 [音高,步数] 序列编译成 步→{midi,dur} 的查表 */
function compile(pattern) {
  const events = new Map();
  let s = 0;
  for (const [midi, dur] of pattern) {
    if (midi > 0) events.set(s, { midi, dur });
    s += dur;
  }
  return { events, total: s };
}

// ===== 播放器状态 =====
let ctx = null;
let masterGain = null;
let timer = null;
let compiled = null;   // { lead, bass, stepDur }
let step = 0;
let nextTime = 0;
let currentScene = null;
let started = false;

export function isMusicMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

function applyMute() {
  if (masterGain) masterGain.gain.value = isMusicMuted() ? 0 : 1;
}

export function toggleMusicMute() {
  localStorage.setItem(MUTE_KEY, isMusicMuted() ? '0' : '1');
  applyMute();
  return isMusicMuted();
}

/** 首次用户手势后调用：创建 AudioContext 并开始当前场景 BGM（浏览器自动播放策略） */
export function initMusic(sceneKey) {
  if (started) return;
  started = true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch { return; }
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  applyMute();
  if (ctx.state === 'suspended') ctx.resume();
  if (sceneKey) setMusicScene(sceneKey);
}

/** 切换场景 BGM；未初始化时只记录场景，等 initMusic 后生效 */
export function setMusicScene(sceneKey) {
  currentScene = sceneKey;
  if (!ctx || !TRACKS[sceneKey]) return;
  stopTimer();
  const t = TRACKS[sceneKey];
  compiled = {
    lead: compile(t.lead),
    bass: compile(t.bass),
    stepDur: 60 / t.bpm / 4, // 每步 = 16 分音符
  };
  step = 0;
  nextTime = ctx.currentTime + 0.08;
  timer = setInterval(pump, 30);
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}

/** 前瞻调度：保持未来 120ms 内的音符已排入 AudioContext */
function pump() {
  if (!ctx || !compiled) return;
  while (nextTime < ctx.currentTime + 0.12) {
    playAt(compiled.lead, step % compiled.lead.total, nextTime, 'square', 0.12);
    playAt(compiled.bass, step % compiled.bass.total, nextTime, 'triangle', 0.18);
    nextTime += compiled.stepDur;
    step++;
  }
}

function playAt(track, s, t, wave, vol) {
  const ev = track.events.get(s);
  if (!ev) return;
  const dur = ev.dur * compiled.stepDur;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.value = midiFreq(ev.midi);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.1, dur * 0.92));
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// 调试句柄：控制台可检查播放状态
window.__music = {
  get state() { return ctx?.state ?? 'uninit'; },
  get scene() { return currentScene; },
  get step() { return step; },
};
