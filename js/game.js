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

  initHud() {
    document.getElementById('scene-name').textContent =
      `▲ ${this.game.scenes[this.game.currentScene].name.toUpperCase()}`;
    document.getElementById('battery').textContent = 'BATT●●●●';
    document.getElementById('clock').textContent = '--:--';
    this.renderScene();
  }

  renderScene() {
    const scene = this.game.scenes[this.game.currentScene];
    this.renderer.drawScene(scene);
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
        this.selectedPetId = pet.id;
        this.renderHudChips();
        this.onQuickAction('talk');
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
        <div class="name">${pet.name}</div>
        <div class="bar"><div style="background:#ef4444;width:${pet.hunger.toFixed(0)}%;"></div></div>
        <div class="bar"><div style="background:#fbbf24;width:${pet.mood.toFixed(0)}%;"></div></div>
        <div class="bar"><div style="background:#60a5fa;width:${pet.clean.toFixed(0)}%;"></div></div>
      `;
      chip.addEventListener('click', () => {
        this.selectedPetId = pet.id;
        this.renderHudChips();
        this.onQuickAction('talk'); // HUD chip 点击 = 主动对话
      });
      row.appendChild(chip);
    });
  }

  bindEvents() {
    document.querySelectorAll('.qb-btn').forEach(btn => {
      const action = btn.dataset.action;
      btn.addEventListener('click', () => this.onQuickAction(action));
    });
    document.getElementById('scene-wrap').addEventListener('click', () => {
      this.selectedPetId = null;
      this.clearBubble();
      this.renderHudChips();
    });
  }

  async onQuickAction(action) {
    const petId = this.selectedPetId ?? pickRandomActivePet(this.game)?.id;
    if (!petId) return this.showToast('这里没有精灵');

    // 散步事件 —— Phase 2 扩展
    if (action === 'walk') {
      const pet = this.game.pets[petId];
      pet.applyChange({ hunger: -15, mood: +15 });
      // 随机触发"遇到一件事" —— MVP 版本只是换个上下文
      const events = ['找到了小果子！', '遇到了一只蝴蝶~', '看到了漂亮的花', '发现了一个神秘的洞...'];
      const eventText = events[Math.floor(Math.random() * events.length)];
      const { routeDialog } = await import('./ai.js');
      const petText = await routeDialog('auto', pet, 'walk_event');
      saveGame(this.game);
      this.showBubble(pet, `${eventText} ${petText}`);
      this.spawnParticles(pet);
      this.renderScene();
      return;
    }

    const result = await doInteraction(this.game, petId, action);
    if (result) {
      this.showBubble(result.pet, result.text);
      this.spawnParticles(result.pet);
      this.renderScene();
      this.showToast(actionToast(action, result.pet));
    }
  }

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
