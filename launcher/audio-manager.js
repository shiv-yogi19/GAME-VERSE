/**
 * GAMEVERSE - Audio Manager
 * Created By Shiv Yogi | Console-Grade Web Audio Synthesizer & Sound System
 */

class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.uiGain = null;
    this.gameGain = null;
    this.isUnlocked = false;
    this.initSettings();
    this.bindUnlock();
  }

  initSettings() {
    const settings = window.storageManager ? window.storageManager.getSettings() : {};
    this.masterVolume = settings.masterVolume ?? 0.8;
    this.uiSoundsEnabled = settings.uiSounds ?? true;
    this.gameSoundsEnabled = settings.gameSounds ?? true;
    this.isMuted = settings.muted ?? false;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        
        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // UI Sounds Gain
        this.uiGain = this.ctx.createGain();
        this.uiGain.gain.setValueAtTime(this.uiSoundsEnabled ? 1 : 0, this.ctx.currentTime);
        this.uiGain.connect(this.masterGain);

        // Game Sounds Gain
        this.gameGain = this.ctx.createGain();
        this.gameGain.gain.setValueAtTime(this.gameSoundsEnabled ? 1 : 0, this.ctx.currentTime);
        this.gameGain.connect(this.masterGain);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  bindUnlock() {
    const unlockHandler = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'running') {
        this.isUnlocked = true;
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      }
    };
    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  // Volume & Channel Controls
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  setUiSounds(enabled) {
    this.uiSoundsEnabled = Boolean(enabled);
    if (this.uiGain && this.ctx) {
      this.uiGain.gain.setTargetAtTime(this.uiSoundsEnabled ? 1 : 0, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  setGameSounds(enabled) {
    this.gameSoundsEnabled = Boolean(enabled);
    if (this.gameGain && this.ctx) {
      this.gameGain.gain.setTargetAtTime(this.gameSoundsEnabled ? 1 : 0, this.ctx.currentTime, 0.05);
    }
    this.saveSettings();
  }

  saveSettings() {
    if (window.storageManager) {
      window.storageManager.saveSettings({
        masterVolume: this.masterVolume,
        muted: this.isMuted,
        uiSounds: this.uiSoundsEnabled,
        gameSounds: this.gameSoundsEnabled
      });
    }
  }

  // Sound Synthesizers (100% Asset-Free, Low Latency, Cinematic Console Sounds)
  
  /**
   * Selection click sound (when focusing or hovering items)
   */
  playSelect() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  /**
   * Navigation sound (when moving coverflow carousel left or right)
   */
  playNav() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.uiGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Menu Open sound
   */
  playMenuOpen() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.14);

    osc2.frequency.setValueAtTime(660, now);
    osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.14);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.uiGain);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }

  /**
   * Menu Close sound
   */
  playMenuClose() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start();
    osc.stop(now + 0.13);
  }

  /**
   * Button Press click
   */
  playButtonPress() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start();
    osc.stop(now + 0.04);
  }

  /**
   * Cinematic Game Launch Sound
   */
  playLaunch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    // Futuristic Ascending Warp Sweep
    const warpOsc = this.ctx.createOscillator();
    const warpGain = this.ctx.createGain();
    warpOsc.type = 'sawtooth';
    warpOsc.frequency.setValueAtTime(220, now + 0.1);
    warpOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(4000, now + 0.7);

    warpGain.gain.setValueAtTime(0.001, now);
    warpGain.gain.linearRampToValueAtTime(0.2, now + 0.3);
    warpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    warpOsc.connect(filter);
    filter.connect(warpGain);
    warpGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + 0.9);
    warpOsc.start(now);
    warpOsc.stop(now + 0.9);
  }

  /**
   * Game Exit Reverse Portal Sound
   */
  playExit() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.5);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.52);
  }

  /**
   * Error Sound
   */
  playError() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(110, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.uiGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Success Chime
   */
  playSuccess() {
    if (!this.uiSoundsEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = this.ctx.currentTime + (idx * 0.07);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

      osc.connect(gain);
      gain.connect(this.uiGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.18);
    });
  }
}

// Export singleton
window.audioManager = new AudioManager();
