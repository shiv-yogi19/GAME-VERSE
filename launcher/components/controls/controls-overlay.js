/**
 * GAMEVERSE - Controls Overlay & Three-Dot Menu System
 * Created By Shiv Yogi | Bridges Game Controls Engine & Interactive Settings Modals
 */

class ControlsOverlayComponent {
  constructor() {
    this.menuDrawer = document.getElementById('three-dot-menu-drawer');
    this.settingsModal = document.getElementById('control-settings-modal');
    this.bindThreeDotMenu();
    this.bindControlSettings();
  }

  bindThreeDotMenu() {
    // Buttons that open three-dot menu
    const menuButtons = document.querySelectorAll('.open-control-menu-btn, #three-dot-menu-btn, #mobile-three-dot-btn');
    menuButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.menuDrawer && this.menuDrawer.classList.contains('open')) {
        if (!this.menuDrawer.contains(e.target)) {
          this.closeMenu();
        }
      }
    });

    // Bind individual items in three-dot menu
    const items = [
      { id: 'menu-item-joystick', action: () => this.openSettingsTab('joystick') },
      { id: 'menu-item-racing', action: () => this.openSettingsTab('racing') },
      { id: 'menu-item-action', action: () => this.openSettingsTab('action') },
      { id: 'menu-item-sensitivity', action: () => this.openSettingsTab('sensitivity') },
      { id: 'menu-item-buttons', action: () => this.openSettingsTab('buttons') },
      { id: 'menu-item-sound', action: () => this.openSettingsTab('sound') },
      { id: 'menu-item-ui', action: () => this.openSettingsTab('ui') },
      { id: 'menu-item-reset', action: () => this.triggerResetControls() },
      { id: 'menu-item-about', action: () => this.openAboutModal() }
    ];

    items.forEach(({ id, action }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          this.closeMenu();
          action();
        });
      }
    });
  }

  toggleMenu() {
    if (!this.menuDrawer) return;
    const isOpen = this.menuDrawer.classList.contains('open');
    if (isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    if (!this.menuDrawer) return;
    this.menuDrawer.classList.add('open');
    if (window.audioManager) window.audioManager.playMenuOpen();
  }

  closeMenu() {
    if (!this.menuDrawer) return;
    this.menuDrawer.classList.remove('open');
    if (window.audioManager) window.audioManager.playMenuClose();
  }

  openSettingsTab(tabName) {
    if (!this.settingsModal) return;
    if (window.audioManager) window.audioManager.playSelect();

    // Show modal
    this.settingsModal.classList.add('open');

    // Switch tab buttons & panes
    const tabBtns = this.settingsModal.querySelectorAll('.settings-tab-btn');
    const tabPanes = this.settingsModal.querySelectorAll('.settings-tab-pane');

    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    tabPanes.forEach(p => p.classList.toggle('active', p.dataset.tab === tabName));

    // Update current slider values from gameControls
    this.syncSlidersFromState();
  }

  syncSlidersFromState() {
    if (!window.gameControls) return;
    const settings = window.gameControls.settings;

    const sizeSlider = document.getElementById('slider-btn-size');
    const sizeVal = document.getElementById('val-btn-size');
    if (sizeSlider && sizeVal) {
      sizeSlider.value = settings.buttonSize;
      sizeVal.textContent = `${settings.buttonSize}px`;
    }

    const opSlider = document.getElementById('slider-btn-opacity');
    const opVal = document.getElementById('val-btn-opacity');
    if (opSlider && opVal) {
      opSlider.value = Math.round(settings.buttonOpacity * 100);
      opVal.textContent = `${Math.round(settings.buttonOpacity * 100)}%`;
    }

    const sensSlider = document.getElementById('slider-joystick-sens');
    const sensVal = document.getElementById('val-joystick-sens');
    if (sensSlider && sensVal) {
      sensSlider.value = Math.round(settings.joystickSensitivity * 100);
      sensVal.textContent = `${Math.round(settings.joystickSensitivity * 100)}%`;
    }

    const deadSlider = document.getElementById('slider-joystick-deadzone');
    const deadVal = document.getElementById('val-joystick-deadzone');
    if (deadSlider && deadVal) {
      deadSlider.value = Math.round(settings.joystickDeadzone * 100);
      deadVal.textContent = `${Math.round(settings.joystickDeadzone * 100)}%`;
    }
  }

  bindControlSettings() {
    if (!this.settingsModal) return;

    // Close button
    const closeBtn = document.getElementById('control-settings-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.settingsModal.classList.remove('open');
        if (window.audioManager) window.audioManager.playMenuClose();
      });
    }

    // Modal tabs click
    const tabBtns = this.settingsModal.querySelectorAll('.settings-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openSettingsTab(btn.dataset.tab);
      });
    });

    // Button size slider
    const sizeSlider = document.getElementById('slider-btn-size');
    const sizeVal = document.getElementById('val-btn-size');
    if (sizeSlider) {
      sizeSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (sizeVal) sizeVal.textContent = `${val}px`;
        if (window.gameControls) window.gameControls.updateSettings({ buttonSize: val });
      });
    }

    // Button opacity slider
    const opSlider = document.getElementById('slider-btn-opacity');
    const opVal = document.getElementById('val-btn-opacity');
    if (opSlider) {
      opSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        if (opVal) opVal.textContent = `${Math.round(val * 100)}%`;
        if (window.gameControls) window.gameControls.updateSettings({ buttonOpacity: val });
      });
    }

    // Joystick sensitivity slider
    const sensSlider = document.getElementById('slider-joystick-sens');
    const sensVal = document.getElementById('val-joystick-sens');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        if (sensVal) sensVal.textContent = `${Math.round(val * 100)}%`;
        if (window.gameControls) window.gameControls.updateSettings({ joystickSensitivity: val });
      });
    }

    // Sound sliders in Settings
    const masterVolSlider = document.getElementById('slider-master-volume');
    const masterVolVal = document.getElementById('val-master-volume');
    if (masterVolSlider && window.audioManager) {
      masterVolSlider.value = Math.round(window.audioManager.masterVolume * 100);
      if (masterVolVal) masterVolVal.textContent = `${masterVolSlider.value}%`;
      masterVolSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        if (masterVolVal) masterVolVal.textContent = `${Math.round(val * 100)}%`;
        window.audioManager.setMasterVolume(val);
      });
    }

    // UI Sounds checkbox toggle
    const uiSoundToggle = document.getElementById('toggle-ui-sound');
    if (uiSoundToggle && window.audioManager) {
      uiSoundToggle.checked = window.audioManager.uiSoundsEnabled;
      uiSoundToggle.addEventListener('change', (e) => {
        window.audioManager.setUiSounds(e.target.checked);
      });
    }

    // UI Glass Blur toggle
    const blurToggle = document.getElementById('toggle-liquid-blur');
    if (blurToggle) {
      blurToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('disable-liquid-blur', !e.target.checked);
      });
    }
  }

  triggerResetControls() {
    if (window.gameControls) {
      window.gameControls.resetLayout();
      this.syncSlidersFromState();
    }
    const toast = document.getElementById('gv-toast');
    if (toast) {
      toast.textContent = 'Controls layout & sensitivity reset to defaults';
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2800);
    }
  }

  openAboutModal() {
    const aboutModal = document.getElementById('about-gameverse-modal');
    if (aboutModal) {
      aboutModal.classList.add('open');
      if (window.audioManager) window.audioManager.playMenuOpen();
    }
  }
}

window.ControlsOverlayComponent = ControlsOverlayComponent;
