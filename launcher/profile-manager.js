/**
 * GAMEVERSE - Profile Manager
 * Created By Shiv Yogi | Player Profile, Animated Avatar Reactions & Gaming Stats
 */

class ProfileManager {
  constructor() {
    this.profile = null;
    this.stats = null;
    this.currentReaction = 'idle';
    this.reactionTimeout = null;
  }

  init() {
    this.refresh();
    this.bindEvents();
  }

  refresh() {
    if (!window.storageManager) return;
    this.profile = window.storageManager.getProfile();
    this.stats = window.storageManager.getStats();
    this.updateDom();
  }

  bindEvents() {
    const editBtn = document.getElementById('profile-edit-name-btn');
    const saveBtn = document.getElementById('profile-save-name-btn');
    const nameInput = document.getElementById('profile-name-input');

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const wrap = document.getElementById('profile-edit-wrap');
        if (wrap) wrap.classList.toggle('active');
        if (nameInput) {
          nameInput.value = this.profile.playerName || '';
          nameInput.focus();
        }
      });
    }

    if (saveBtn && nameInput) {
      saveBtn.addEventListener('click', () => {
        const newName = nameInput.value.trim();
        if (newName.length >= 2) {
          this.setPlayerName(newName);
          const wrap = document.getElementById('profile-edit-wrap');
          if (wrap) wrap.classList.remove('active');
          if (window.audioManager) window.audioManager.playSuccess();
        } else {
          nameInput.classList.add('anim-error-shake');
          setTimeout(() => nameInput.classList.remove('anim-error-shake'), 400);
          if (window.audioManager) window.audioManager.playError();
        }
      });
    }
  }

  setPlayerName(name) {
    if (!window.storageManager) return;
    const clean = name.trim();
    if (!clean) return;
    this.profile = window.storageManager.saveProfile({ playerName: clean });
    this.updateDom();
    this.triggerReaction('happy');
  }

  triggerReaction(reactionType) {
    // reactionType: 'idle', 'happy', 'excited', 'victory'
    this.currentReaction = reactionType;
    const avatarImgs = document.querySelectorAll('.player-avatar-img, .profile-avatar-large');

    avatarImgs.forEach(img => {
      img.classList.remove('reaction-happy', 'reaction-excited', 'reaction-victory');
      if (reactionType !== 'idle') {
        img.classList.add(`reaction-${reactionType}`);
      }
    });

    clearTimeout(this.reactionTimeout);
    if (reactionType !== 'idle') {
      this.reactionTimeout = setTimeout(() => {
        this.triggerReaction('idle');
      }, 3500);
    }
  }

  updateDom() {
    const nameEls = document.querySelectorAll('.player-name-display');
    const countEls = document.querySelectorAll('.player-games-count');
    const timeEls = document.querySelectorAll('.player-playtime-display');
    const launchesEls = document.querySelectorAll('.player-launches-display');

    const name = this.profile ? (this.profile.playerName || 'Commander') : 'Commander';
    nameEls.forEach(el => el.textContent = name);

    if (this.stats) {
      countEls.forEach(el => el.textContent = this.stats.totalGamesPlayed || '0');
      timeEls.forEach(el => el.textContent = `${this.stats.totalPlayMinutes || 0}m`);
      launchesEls.forEach(el => el.textContent = this.stats.totalLaunches || '0');
    }

    // Render favorites & recents list inside profile modal
    this.renderProfileHistory();
  }

  renderProfileHistory() {
    const favsContainer = document.getElementById('profile-favorites-list');
    const recentContainer = document.getElementById('profile-recent-list');
    if (!favsContainer || !recentContainer || !window.gameRegistry) return;

    const favIds = window.storageManager ? window.storageManager.getFavorites() : [];
    const recentIds = window.storageManager ? window.storageManager.getRecentlyPlayed() : [];

    favsContainer.innerHTML = favIds.length === 0 
      ? '<div class="profile-empty-item">No favorite games saved yet.</div>'
      : '';

    recentContainer.innerHTML = recentIds.length === 0
      ? '<div class="profile-empty-item">No game history yet.</div>'
      : '';

    favIds.slice(0, 4).forEach(id => {
      const game = window.gameRegistry.getGameById(id);
      if (game) {
        const item = document.createElement('div');
        item.className = 'profile-history-card';
        item.innerHTML = `
          <img src="${game.thumbnail}" alt="${game.name}" />
          <span>${game.name}</span>
        `;
        item.addEventListener('click', () => {
          document.getElementById('profile-modal').classList.remove('open');
          if (window.coverflow) window.coverflow.selectGameById(game.id);
        });
        favsContainer.appendChild(item);
      }
    });

    recentIds.slice(0, 4).forEach(id => {
      const game = window.gameRegistry.getGameById(id);
      if (game) {
        const item = document.createElement('div');
        item.className = 'profile-history-card';
        item.innerHTML = `
          <img src="${game.thumbnail}" alt="${game.name}" />
          <span>${game.name}</span>
        `;
        item.addEventListener('click', () => {
          document.getElementById('profile-modal').classList.remove('open');
          if (window.coverflow) window.coverflow.selectGameById(game.id);
        });
        recentContainer.appendChild(item);
      }
    });
  }
}

// Export singleton
window.profileManager = new ProfileManager();
