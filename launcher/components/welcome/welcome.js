/**
 * GAMEVERSE - First-Time Player Registration Engine
 * Created By Shiv Yogi | Validates & Persists Player Profile
 */

class WelcomeRegistration {
  constructor(onCompleted) {
    this.onCompleted = onCompleted;
    this.screenEl = document.getElementById('welcome-registration-screen');
    this.nameInput = document.getElementById('welcome-player-name-input');
    this.continueBtn = document.getElementById('welcome-continue-btn');
    this.errorMsg = document.getElementById('welcome-error-msg');
  }

  show() {
    if (!this.screenEl) return;
    this.screenEl.classList.add('active');
    this.bindEvents();
    if (this.nameInput) {
      setTimeout(() => this.nameInput.focus(), 300);
    }
  }

  bindEvents() {
    if (this.continueBtn) {
      this.continueBtn.addEventListener('click', () => this.handleContinue());
    }

    if (this.nameInput) {
      this.nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleContinue();
        }
      });

      this.nameInput.addEventListener('input', () => {
        if (this.errorMsg) this.errorMsg.classList.remove('visible');
      });
    }
  }

  handleContinue() {
    const rawName = this.nameInput ? this.nameInput.value.trim() : '';

    // Validation: 2 to 18 characters, alphanumeric + underscores + hyphens
    if (rawName.length < 2) {
      this.showError('Player name must be at least 2 characters');
      return;
    }
    if (rawName.length > 20) {
      this.showError('Player name must not exceed 20 characters');
      return;
    }

    // Save profile to LocalStorage
    if (window.storageManager) {
      window.storageManager.saveProfile({
        playerName: rawName,
        isRegistered: true,
        joinDate: new Date().toISOString()
      });
    }

    // Sound effect
    if (window.audioManager) {
      window.audioManager.playSuccess();
    }

    // Smooth transition
    if (this.screenEl) {
      this.screenEl.classList.add('dismiss');
      setTimeout(() => {
        this.screenEl.classList.remove('active', 'dismiss');
        this.screenEl.remove();
        if (this.onCompleted) this.onCompleted(rawName);
      }, 600);
    } else {
      if (this.onCompleted) this.onCompleted(rawName);
    }
  }

  showError(msg) {
    if (this.errorMsg) {
      this.errorMsg.textContent = msg;
      this.errorMsg.classList.add('visible');
    }
    if (this.nameInput) {
      this.nameInput.classList.add('anim-error-shake');
      setTimeout(() => this.nameInput.classList.remove('anim-error-shake'), 400);
    }
    if (window.audioManager) {
      window.audioManager.playError();
    }
  }
}

window.WelcomeRegistration = WelcomeRegistration;
