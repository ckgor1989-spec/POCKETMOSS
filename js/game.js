import { loadGame, saveGame, resetSave } from './storage.js';
import { SceneRenderer } from './renderer.js';
import { createSpriteEl } from './sprites.js';
import { doInteraction, doWalk, rollHatchChoices, hatchPet, pickRandomActivePet } from './interactions.js';
import { chatWithPet, routeDialog } from './ai.js';
import { SCENES, SPRITES, ELEMENTS } from './config.js';

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
    this.pendingHatch = null; // { element, choices }
    this.chatPetId = null;    // 当前聊天对象
    this.chatHistories = {};  // petId -> [{role, content}]（内存态，不进存档）
    this.lastTick = Date.now();
    this.initHud();
    this.bindEvents();
    this.loop();
    this.clock();
  }

  initHud() {
    this.updateSceneName();
    document.getElementById('battery').textContent = 'BATT●●●●';
    document.getElementById('clock').textContent = '--:--';
    this.renderSceneTabs();
    this.renderScene();
  }

  updateSceneName() {
    document.getElementById('scene-name').textContent =
      `▲ ${this.game.scenes[this.game.currentScene].name.toUpperCase()}`;
  }

  updateEggCount() {
    document.getElementById('egg-count').textContent = String(this.game.eggs);
  }

  // ===== 场景 Tab =====
  renderSceneTabs() {
    const bar = document.getElementById('scene-tabs');
    bar.innerHTML = '';
    Object.keys(SCENES).forEach(key => {
      const unlocked = this.game.sceneUnlocked(key);
      const tab = document.createElement('button');
      tab.className = 'scene-tab'
        + (key === this.game.currentScene ? ' active' : '')
        + (!unlocked ? ' locked' : '');
      const el = SCENES[key].element;
      const icons = { wood: '🌱', fire: '🔥', water: '💧', thunder: '⚡', shadow: '🌑' };
      tab.textContent = unlocked ? `${icons[el]}${ELEMENTS[el].name.slice(0, 2)}` : '🔒???';
      tab.addEventListener('click', () => {
        if (!unlocked) return this.showToast('孵化对应元素的精灵后解锁');
        this.switchScene(key);
      });
      bar.appendChild(tab);
    });
  }

  switchScene(key) {
    this.game.currentScene = key;
    this.selectedPetId = null;
    saveGame(this.game);
    this.updateSceneName();
    this.renderSceneTabs();
    this.renderScene();
  }

  // ===== 场景渲染 =====
  renderScene() {
    const scene = this.game.scenes[this.game.currentScene];
    this.renderer.drawScene(scene);
    this.petLayer.innerHTML = '';
    this.updateEggCount();

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
        this.selectedPetId = pet.id;
        this.renderHudChips();
        this.quickTalk(pet); // 点精灵 = 快速一句
      });
      this.petLayer.appendChild(el);
    });
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
        <div class="name">${pet.name}${pet.evolved ? '✦' : ''}</div>
        <div class="bar"><div style="background:#ef4444;width:${pet.hunger.toFixed(0)}%;"></div></div>
        <div class="bar"><div style="background:#fbbf24;width:${pet.mood.toFixed(0)}%;"></div></div>
        <div class="bar"><div style="background:#60a5fa;width:${pet.clean.toFixed(0)}%;"></div></div>
        <div class="bar"><div style="background:#f472b6;width:${pet.affection.toFixed(0)}%;"></div></div>
      `;
      chip.addEventListener('click', () => {
        this.selectedPetId = pet.id;
        this.renderHudChips();
        this.quickTalk(pet);
      });
      row.appendChild(chip);
    });
  }

  bindEvents() {
    document.querySelectorAll('.qb-btn').forEach(btn => {
      btn.addEventListener('click', () => this.onQuickAction(btn.dataset.action));
    });
    document.getElementById('scene-wrap').addEventListener('click', () => {
      this.selectedPetId = null;
      this.clearBubble();
      this.renderHudChips();
    });
    // 孵化
    document.getElementById('btn-hatch').addEventListener('click', () => this.openHatch());
    document.getElementById('hatch-close').addEventListener('click', () => this.closeHatch());
    document.getElementById('hatch-egg').addEventListener('click', () => this.crackEgg());
    // 图鉴
    document.getElementById('btn-codex').addEventListener('click', () => this.openCodex());
    document.getElementById('codex-close').addEventListener('click', () => {
      document.getElementById('codex-modal').classList.add('hidden');
    });
    // 对话面板
    document.getElementById('chat-close').addEventListener('click', () => this.closeChat());
    document.getElementById('chat-send').addEventListener('click', () => this.sendChat());
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendChat();
    });
  }

  async onQuickAction(action) {
    const petId = this.selectedPetId ?? pickRandomActivePet(this.game)?.id;
    if (!petId) return this.showToast('这里没有精灵');
    const pet = this.game.pets[petId];
    if (!pet) return;

    if (action === 'walk') {
      const result = await doWalk(this.game, petId);
      this.showBubble(result.pet, `${result.event.text}！${result.reaction}`);
      this.spawnParticles(result.pet);
      if (result.gotEgg) this.showToast('捡到了一颗蛋！🥚');
      if (result.evolved) this.announceEvolve(result.pet);
      this.renderScene();
      return;
    }

    // 💬 对话按钮 = 打开多轮聊天面板
    if (action === 'talk') {
      this.openChat(pet);
      return;
    }

    const result = await doInteraction(this.game, petId, action);
    if (result) {
      this.showBubble(result.pet, result.text);
      this.spawnParticles(result.pet);
      if (result.evolved) this.announceEvolve(result.pet);
      this.renderScene();
      this.showToast(actionToast(action, result.pet));
    }
  }

  /** 点精灵/头像：快速一句（不进聊天面板） */
  async quickTalk(pet) {
    const result = await doInteraction(this.game, pet.id, 'talk');
    if (result) {
      this.showBubble(result.pet, result.text);
      if (result.evolved) this.announceEvolve(result.pet);
      this.renderHudChips();
    }
  }

  // ===== 多轮对话面板 =====
  openChat(pet) {
    this.chatPetId = pet.id;
    document.getElementById('chat-title').textContent =
      `💬 ${pet.name} · ${pet.personality}`;
    this.renderChatLog();
    document.getElementById('chat-modal').classList.remove('hidden');
    const input = document.getElementById('chat-input');
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }

  closeChat() {
    document.getElementById('chat-modal').classList.add('hidden');
    this.chatPetId = null;
  }

  renderChatLog() {
    const log = document.getElementById('chat-log');
    log.innerHTML = '';
    const history = this.chatHistories[this.chatPetId] ?? [];
    if (history.length === 0) {
      const sys = document.createElement('div');
      sys.className = 'chat-msg sys';
      sys.textContent = '和它说点什么吧';
      log.appendChild(sys);
    }
    history.forEach(m => {
      const div = document.createElement('div');
      div.className = 'chat-msg ' + (m.role === 'user' ? 'me' : 'pet');
      div.textContent = m.content;
      log.appendChild(div);
    });
    log.scrollTop = log.scrollHeight;
  }

  async sendChat() {
    const pet = this.game.pets[this.chatPetId];
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const text = input.value.trim();
    if (!pet || !text) return;

    const history = this.chatHistories[pet.id] ?? (this.chatHistories[pet.id] = []);
    history.push({ role: 'user', content: text });
    input.value = '';
    sendBtn.disabled = true;
    this.renderChatLog();

    // L3 多轮对话；API 失败时降级 L1 本地台词，保证有回应
    let reply = await chatWithPet(pet, history.slice(0, -1), text);
    if (!reply) reply = await routeDialog('L1', pet, 'idle');
    history.push({ role: 'assistant', content: reply });

    // 聊天也算互动：小幅涨心情和好感
    pet.applyChange({ mood: +2, affection: +2 });
    if (pet.tryEvolve()) this.announceEvolve(pet);
    saveGame(this.game);

    sendBtn.disabled = false;
    this.renderChatLog();
    this.renderHudChips();
    input.focus();
  }

  announceEvolve(pet) {
    setTimeout(() => this.showToast(`✦ ${pet.name} 进化了！好感度 MAX`), 600);
  }

  // ===== 孵化 =====
  openHatch() {
    const modal = document.getElementById('hatch-modal');
    const egg = document.getElementById('hatch-egg');
    const stage = document.getElementById('hatch-stage');
    const choices = document.getElementById('hatch-choices');
    choices.classList.add('hidden');
    choices.innerHTML = '';
    stage.classList.remove('hidden');
    egg.className = 'hatch-egg';
    this.pendingHatch = null;
    if (this.game.eggs <= 0) {
      stage.querySelector('.modal-hint').textContent = '没有蛋了，散步时可能捡到';
      egg.style.pointerEvents = 'none';
    } else {
      stage.querySelector('.modal-hint').textContent = `点击蛋孵化（剩 ${this.game.eggs} 颗）`;
      egg.style.pointerEvents = 'auto';
    }
    modal.classList.remove('hidden');
  }

  crackEgg() {
    if (this.pendingHatch) return; // 已经摇过
    const result = rollHatchChoices(this.game);
    if (!result) return this.showToast('没有可孵化的蛋');
    this.pendingHatch = result;

    const egg = document.getElementById('hatch-egg');
    egg.classList.add('shaking');
    setTimeout(() => {
      egg.classList.remove('shaking');
      egg.classList.add('hatched');
      setTimeout(() => this.showHatchChoices(result), 400);
    }, 1200);
  }

  showHatchChoices({ element, choices }) {
    document.getElementById('hatch-stage').classList.add('hidden');
    const box = document.getElementById('hatch-choices');
    box.innerHTML = '';
    box.classList.remove('hidden');
    const elColor = ELEMENTS[element].color;
    choices.forEach(spriteId => {
      const def = SPRITES[spriteId];
      const card = document.createElement('div');
      card.className = 'hatch-card';
      card.style.borderColor = elColor;
      card.innerHTML = `
        <div class="hc-avatar" style="background:${def.bodyColor};"></div>
        <div class="hc-name">${def.name}</div>
        <div class="hc-pers">${def.personality}</div>
      `;
      card.addEventListener('click', () => {
        const pet = hatchPet(this.game, spriteId);
        document.getElementById('hatch-modal').classList.add('hidden');
        if (pet) {
          const sceneKey = ELEMENTS[pet.element].sceneKey;
          this.showToast(`${pet.name} 诞生了！`);
          this.switchScene(sceneKey);
          this.selectedPetId = pet.id;
          setTimeout(() => this.showBubble(pet, '你好呀，新世界！'), 400);
        }
      });
      box.appendChild(card);
    });
  }

  closeHatch() {
    document.getElementById('hatch-modal').classList.add('hidden');
    this.pendingHatch = null;
  }

  // ===== 图鉴 =====
  openCodex() {
    const grid = document.getElementById('codex-grid');
    grid.innerHTML = '';
    Object.values(SPRITES).forEach(def => {
      const owned = !!this.game.pets[def.id];
      const pet = this.game.pets[def.id];
      const cell = document.createElement('div');
      cell.className = 'codex-cell ' + (owned ? 'owned' : 'locked');
      const elColor = ELEMENTS[def.element].color;
      cell.innerHTML = `
        <div class="cc-avatar" style="background:${owned ? (pet.evolved ? SPRITES[def.id].evolved.bodyColor : def.bodyColor) : '#333'};border:1px solid ${elColor};"></div>
        <div>${owned ? def.name : '???'}</div>
        <div class="cc-aff">${owned ? `${def.personality} · 好感 ${Math.round(pet.affection)}` : ELEMENTS[def.element].name}</div>
      `;
      grid.appendChild(cell);
    });
    document.getElementById('codex-modal').classList.remove('hidden');
  }

  // ===== 气泡 / 粒子 / Toast =====
  showBubble(pet, text) {
    this.clearBubble();
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text || '...';
    const pos = this.petLayer.querySelector(`[data-pet-id="${pet.id}"]`);
    if (pos) {
      const rect = pos.getBoundingClientRect();
      const wrapRect = this.bubbleLayer.getBoundingClientRect();
      bubble.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
      bubble.style.top  = (rect.top - wrapRect.top - 40) + 'px';
    }
    this.bubbleLayer.appendChild(bubble);
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

  loop = () => {
    const now = Date.now();
    const deltaMin = (now - this.lastTick) / 60000;
    if (deltaMin >= 0.5) {
      this.game.tick(deltaMin);
      this.lastTick = now;
      this.renderHudChips();
    }
    requestAnimationFrame(this.loop);
  }

  clock() {
    const tick = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      document.getElementById('clock').textContent = `${h}:${m}`;
    };
    tick();
    setInterval(tick, 30000);
  }
}

function actionToast(action, pet) {
  return { feed: `${pet.name}吃饱饱~`, play: `${pet.name}玩得好开心！`,
           clean: `${pet.name}干干净净`, talk: `${pet.name}想说话`,
           walk: '出发散步' }[action] ?? pet.name;
}

// 启动
window.addEventListener('DOMContentLoaded', () => {
  window.__game = new PocketMossGame();
});
