/**
 * GAMEVERSE - Game Loader & Session Manager
 * Created By Shiv Yogi | Cinematic Launch Zoom, Sandboxed Iframe, and Gaming HUD
 */

class GameLoader {
  constructor() {
    this.currentGame = null;
    this.gameStartTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.container = null;
    this.iframe = null;
    this.hud = null;
  }

  init() {
    this.container = document.getElementById('game-player-container');
    this.hud = document.getElementById('game-player-hud');
    this.bindHudButtons();
  }

  bindHudButtons() {
    const exitBtn = document.getElementById('hud-exit-btn');
    const restartBtn = document.getElementById('hud-restart-btn');
    const pauseBtn = document.getElementById('hud-pause-btn');
    const fullscreenBtn = document.getElementById('hud-fullscreen-btn');
    const soundToggleBtn = document.getElementById('hud-sound-btn');
    const controlsToggleBtn = document.getElementById('hud-controls-btn');

    if (exitBtn) exitBtn.addEventListener('click', () => this.exitGame());
    if (restartBtn) restartBtn.addEventListener('click', () => this.restartGame());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    if (soundToggleBtn) {
      soundToggleBtn.addEventListener('click', () => {
        if (window.audioManager) {
          const isMuted = !window.audioManager.isMuted;
          window.audioManager.setMuted(isMuted);
          soundToggleBtn.classList.toggle('muted', isMuted);
        }
      });
    }

    if (controlsToggleBtn) {
      controlsToggleBtn.addEventListener('click', () => {
        if (window.gameControls) {
          const visible = !window.gameControls.settings.visible;
          window.gameControls.updateSettings({ visible });
          controlsToggleBtn.classList.toggle('disabled', !visible);
        }
      });
    }
  }

  /**
   * Launch Game Sequence
   */
  async launchGame(game) {
    if (!game) return;

    // Check if game entryUrl actually exists
    const isAvailable = await window.gameRegistry.verifyGameAvailability(game);
    if (!isAvailable) {
      this.showMissingGameModal(game);
      if (window.audioManager) window.audioManager.playError();
      return;
    }

    this.currentGame = game;
    this.gameStartTime = Date.now();
    this.isPlaying = true;

    // Audio cue
    if (window.audioManager) {
      window.audioManager.playLaunch();
    }

    // Launch Zoom Animation on Launcher Root
    const appRoot = document.getElementById('app-root');
    const launcherScreen = document.getElementById('main-launcher-screen');
    const loaderOverlay = document.getElementById('game-launch-loader');

    if (launcherScreen) launcherScreen.classList.add('launching');
    if (loaderOverlay) {
      loaderOverlay.classList.add('active');
      document.getElementById('loader-game-title').textContent = game.name;
    }

    // Prepare Sandboxed Frame
    setTimeout(() => {
      this.mountGameFrame(game);

      // Transition to game viewport
      setTimeout(() => {
        if (loaderOverlay) loaderOverlay.classList.remove('active');
        if (launcherScreen) launcherScreen.classList.remove('launching');
        if (this.container) this.container.classList.add('active');

        // Request Fullscreen & Landscape if mobile
        this.requestGameOrientation();

        // Update player statistics
        if (window.storageManager) {
          window.storageManager.addRecentlyPlayed(game.id);
          const stats = window.storageManager.getStats();
          stats.totalGamesPlayed += 1;
          window.storageManager.saveStats(stats);
        }

        // Trigger profile reaction
        if (window.profileManager) {
          window.profileManager.triggerReaction('excited');
        }
      }, 700);
    }, 600);
  }

  mountGameFrame(game) {
    const frameWrap = document.getElementById('game-iframe-wrapper');
    if (!frameWrap) return;

    frameWrap.innerHTML = '';

    // Create sandboxed iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'active-game-frame';
    iframe.src = game.entryUrl;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock');
    iframe.setAttribute('allow', 'autoplay; fullscreen; gamepad');
    iframe.className = 'game-sandboxed-frame';

    frameWrap.appendChild(iframe);
    this.iframe = iframe;

    // Connect game controls
    if (window.gameControls) {
      window.gameControls.attachFrame(iframe);
      window.gameControls.setScheme(game.controlType);
    }
  }

  /**
   * Reverse Zoom Exit Game Sequence
   */
  exitGame() {
    if (!this.isPlaying) return;

    // Play exit sound
    if (window.audioManager) {
      window.audioManager.playExit();
    }

    // Calculate played minutes
    const playedMinutes = Math.max(1, Math.round((Date.now() - this.gameStartTime) / 60000));
    if (window.storageManager) {
      const stats = window.storageManager.getStats();
      stats.totalPlayMinutes += playedMinutes;
      window.storageManager.saveStats(stats);
    }

    // Trigger profile reaction
    if (window.profileManager) {
      window.profileManager.triggerReaction('victory');
    }

    // Exit Fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Reverse Zoom Exit Animation
    if (this.container) {
      this.container.classList.remove('active');
      this.container.classList.add('exiting');
    }

    const launcherScreen = document.getElementById('main-launcher-screen');
    if (launcherScreen) launcherScreen.classList.add('recovering');

    setTimeout(() => {
      // Release iframe resources & postMessage listeners
      if (window.gameControls) {
        window.gameControls.detachFrame();
      }

      if (this.iframe) {
        this.iframe.src = 'about:blank';
        this.iframe.remove();
        this.iframe = null;
      }

      if (this.container) {
        this.container.classList.remove('exiting');
      }
      if (launcherScreen) {
        launcherScreen.classList.remove('recovering');
      }

      this.isPlaying = false;
      this.currentGame = null;
    }, 550);
  }

  restartGame() {
    if (!this.iframe || !this.currentGame) return;
    if (window.audioManager) window.audioManager.playButtonPress();
    
    // Send postMessage restart first
    if (window.gameControls) {
      window.gameControls.sendInput('RESTART', 'REBOOT');
    }

    // Also reload iframe smoothly
    this.iframe.src = this.currentGame.entryUrl;
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (window.audioManager) window.audioManager.playButtonPress();
    
    if (window.gameControls) {
      window.gameControls.sendInput('PAUSE', 'STATE', { isPaused: this.isPaused });
    }

    const pauseBtn = document.getElementById('hud-pause-btn');
    if (pauseBtn) {
      pauseBtn.classList.toggle('active', this.isPaused);
      pauseBtn.title = this.isPaused ? 'Resume Game' : 'Pause Game';
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  requestGameOrientation() {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  }

  showMissingGameModal(game) {
    const modal = document.getElementById('missing-game-modal');
    if (!modal) return;

    document.getElementById('missing-game-name').textContent = game.name;
    document.getElementById('missing-game-path').textContent = game.entryUrl;
    modal.classList.add('open');
  }
}

// Export singleton
window.gameLoader = new GameLoader();
