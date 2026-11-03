/**
 * GAMEVERSE - Universal Game Control Engine
 * Created By Shiv Yogi | Virtual Touch HUD, Multi-Touch Analog Stick & postMessage API
 */

class GameControls {
  constructor() {
    this.targetIframe = null;
    this.schemes = {};
    this.activeScheme = 'action';
    this.settings = {
      buttonSize: 64,
      buttonOpacity: 0.85,
      joystickSensitivity: 1.0,
      joystickDeadzone: 0.12,
      haptics: true,
      visible: true
    };
    this.customOffsets = {}; // id -> { x, y }
    this.activeTouches = new Map(); // pointerId -> controlId
    this.joystickState = { active: false, pointerId: null, startX: 0, startY: 0, curX: 0, curY: 0, normX: 0, normY: 0 };
    this.isCustomizing = false;
    this.init();
  }

  async init() {
    try {
      const res = await fetch('data/controls.json').then(r => r.json()).catch(() => null);
      if (res && res.schemes) {
        this.schemes = res.schemes;
      }
    } catch (e) {
      console.warn('[GameVerse Controls] Could not fetch controls.json', e);
    }

    // Load saved settings
    if (window.storageManager) {
      const saved = window.storageManager.getSettings();
      if (saved && saved.controls) {
        this.settings = { ...this.settings, ...saved.controls };
      }
      this.customOffsets = window.storageManager.getItem('gameverse_control_offsets', {}) || {};
    }

    this.bindKeyboardListener();
  }

  attachFrame(iframeElement) {
    this.targetIframe = iframeElement;
  }

  detachFrame() {
    this.targetIframe = null;
  }

  setScheme(schemeType) {
    const key = (schemeType || 'action').toLowerCase();
    this.activeScheme = this.schemes[key] ? key : 'action';
    this.renderHud();
  }

  /**
   * Secure postMessage Dispatcher
   */
  sendInput(action, code, payload = null) {
    if (!this.targetIframe || !this.targetIframe.contentWindow) return;
    try {
      const message = {
        type: 'GAMEVERSE_INPUT',
        action: action, // 'PRESS', 'RELEASE', 'JOYSTICK', 'DRAG', 'RESET', 'PAUSE'
        code: code,
        payload: payload,
        timestamp: performance.now()
      };
      this.targetIframe.contentWindow.postMessage(message, '*');
    } catch (e) {
      console.error('[GameVerse Controls] postMessage send failed', e);
    }
  }

  triggerHaptic() {
    if (this.settings.haptics && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch (e) {}
    }
  }

  /**
   * Translates PC Keyboard events into postMessage inputs
   */
  bindKeyboardListener() {
    window.addEventListener('keydown', (e) => {
      if (!this.targetIframe || e.repeat) return;
      this.sendInput('PRESS', e.code, { key: e.key });
    });

    window.addEventListener('keyup', (e) => {
      if (!this.targetIframe) return;
      this.sendInput('RELEASE', e.code, { key: e.key });
    });
  }

  /**
   * Render On-Screen Gamepad HUD
   */
  renderHud(containerEl = document.getElementById('touch-controls-hud')) {
    if (!containerEl) return;
    containerEl.innerHTML = '';
    
    if (!this.settings.visible) {
      containerEl.style.display = 'none';
      return;
    }
    containerEl.style.display = 'block';

    const scheme = this.schemes[this.activeScheme];
    if (!scheme || !scheme.controls) return;

    // Apply root opacity
    containerEl.style.opacity = this.settings.buttonOpacity;

    // Left cluster & Right cluster
    const leftCluster = document.createElement('div');
    leftCluster.className = 'gv-control-cluster left-cluster';
    const rightCluster = document.createElement('div');
    rightCluster.className = 'gv-control-cluster right-cluster';

    containerEl.appendChild(leftCluster);
    containerEl.appendChild(rightCluster);

    scheme.controls.forEach(ctrl => {
      if (ctrl.type === 'joystick') {
        const joyEl = this.createJoystickElement(ctrl);
        leftCluster.appendChild(joyEl);
      } else {
        const btnEl = this.createButtonElement(ctrl);
        if (ctrl.area && ctrl.area.startsWith('left')) {
          leftCluster.appendChild(btnEl);
        } else {
          rightCluster.appendChild(btnEl);
        }
      }
    });
  }

  createButtonElement(ctrl) {
    const btn = document.createElement('button');
    btn.className = `gv-touch-button btn-${ctrl.id}`;
    btn.dataset.code = ctrl.code;
    btn.dataset.id = ctrl.id;
    btn.innerHTML = `<span>${ctrl.label}</span>`;
    
    // Sizing
    const size = this.settings.buttonSize;
    btn.style.width = `${size}px`;
    btn.style.height = `${size}px`;

    if (ctrl.color) {
      btn.style.borderColor = ctrl.color;
      btn.style.boxShadow = `0 0 15px ${ctrl.color}40`;
    }

    // Touch events
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      this.triggerHaptic();
      if (window.audioManager) window.audioManager.playButtonPress();
      this.sendInput('PRESS', ctrl.code, { id: ctrl.id });
    });

    const releaseHandler = (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      this.sendInput('RELEASE', ctrl.code, { id: ctrl.id });
    };

    btn.addEventListener('pointerup', releaseHandler);
    btn.addEventListener('pointercancel', releaseHandler);
    btn.addEventListener('pointerleave', releaseHandler);

    return btn;
  }

  createJoystickElement(ctrl) {
    const base = document.createElement('div');
    base.className = 'gv-joystick-base';
    base.dataset.id = ctrl.id;

    const stick = document.createElement('div');
    stick.className = 'gv-joystick-stick';
    base.appendChild(stick);

    const radius = 55;

    base.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = base.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this.joystickState.active = true;
      this.joystickState.pointerId = e.pointerId;
      this.joystickState.startX = centerX;
      this.joystickState.startY = centerY;
      base.setPointerCapture(e.pointerId);
      this.triggerHaptic();
    });

    base.addEventListener('pointermove', (e) => {
      if (!this.joystickState.active || e.pointerId !== this.joystickState.pointerId) return;
      e.preventDefault();

      let dx = e.clientX - this.joystickState.startX;
      let dy = e.clientY - this.joystickState.startY;
      const distance = Math.hypot(dx, dy);

      if (distance > radius) {
        dx = (dx / distance) * radius;
        dy = (dy / distance) * radius;
      }

      stick.style.transform = `translate(${dx}px, ${dy}px)`;

      // Normalized output with sensitivity and deadzone
      const rawNormX = dx / radius;
      const rawNormY = dy / radius;
      const mag = Math.hypot(rawNormX, rawNormY);

      if (mag < this.settings.joystickDeadzone) {
        this.sendInput('JOYSTICK', 'ANALOG', { x: 0, y: 0 });
      } else {
        const scaledX = rawNormX * this.settings.joystickSensitivity;
        const scaledY = rawNormY * this.settings.joystickSensitivity;
        this.sendInput('JOYSTICK', 'ANALOG', {
          x: Math.max(-1, Math.min(1, scaledX)),
          y: Math.max(-1, Math.min(1, scaledY))
        });
      }
    });

    const resetJoystick = (e) => {
      if (this.joystickState.pointerId === e.pointerId) {
        this.joystickState.active = false;
        this.joystickState.pointerId = null;
        stick.style.transform = 'translate(0px, 0px)';
        this.sendInput('JOYSTICK', 'ANALOG', { x: 0, y: 0 });
      }
    };

    base.addEventListener('pointerup', resetJoystick);
    base.addEventListener('pointercancel', resetJoystick);

    return base;
  }

  // Customization methods
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (window.storageManager) {
      window.storageManager.saveSettings({ controls: this.settings });
    }
    this.renderHud();
  }

  resetLayout() {
    this.customOffsets = {};
    if (window.storageManager) {
      window.storageManager.removeItem('gameverse_control_offsets');
    }
    this.settings = {
      buttonSize: 64,
      buttonOpacity: 0.85,
      joystickSensitivity: 1.0,
      joystickDeadzone: 0.12,
      haptics: true,
      visible: true
    };
    if (window.storageManager) {
      window.storageManager.saveSettings({ controls: this.settings });
    }
    this.renderHud();
    if (window.audioManager) window.audioManager.playSuccess();
  }
}

// Export singleton
window.gameControls = new GameControls();
