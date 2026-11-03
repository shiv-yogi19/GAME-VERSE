/**
 * GAMEVERSE - In-Game Player Screen Controller
 * Created By Shiv Yogi | Bridges Game Loader with DOM HUD Toolbar
 */

class PlayerScreenComponent {
  constructor() {
    this.initMissingGameModal();
  }

  initMissingGameModal() {
    const modal = document.getElementById('missing-game-modal');
    const closeBtn = document.getElementById('missing-game-close');
    const actionBtn = document.getElementById('missing-game-action');

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('open');
      });
    }

    if (actionBtn && modal) {
      actionBtn.addEventListener('click', () => {
        modal.classList.remove('open');
        // If user wants to try the verified demo game instead
        if (window.coverflow) {
          window.coverflow.selectGameById('cyber-neon-overdrive');
        }
      });
    }
  }
}

window.PlayerScreenComponent = PlayerScreenComponent;
