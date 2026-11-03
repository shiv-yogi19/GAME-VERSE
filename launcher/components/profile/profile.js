/**
 * GAMEVERSE - Profile Component UI Logic
 * Created By Shiv Yogi | Bridges Profile Manager with Profile Modal UI
 */

class ProfileComponent {
  constructor() {
    this.modal = document.getElementById('profile-modal');
    this.bindTriggers();
  }

  bindTriggers() {
    // Buttons that open profile modal (topbar avatar button, desktop sidebar profile link)
    const openBtns = document.querySelectorAll('.open-profile-btn, #topbar-profile-btn, #sidebar-profile-link');
    openBtns.forEach(btn => {
      btn.addEventListener('click', () => this.open());
    });

    const closeBtn = document.getElementById('profile-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close();
        }
      });
    }
  }

  open() {
    if (!this.modal) return;
    if (window.profileManager) {
      window.profileManager.refresh();
      window.profileManager.triggerReaction('happy');
    }
    if (window.audioManager) {
      window.audioManager.playMenuOpen();
    }
    this.modal.classList.add('open');
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('open');
    if (window.audioManager) {
      window.audioManager.playMenuClose();
    }
  }
}

window.ProfileComponent = ProfileComponent;
