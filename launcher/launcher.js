/**
 * GAMEVERSE - Master Launcher Orchestrator
 * Created By Shiv Yogi | Pair Programming Next-Gen Console Architecture
 */

class GameVerseLauncher {
  constructor() {
    this.coverflow = null;
    this.selectedGame = null;
    this.deferredInstallPrompt = null;
    this.ambientCanvas = null;
    this.ambientCtx = null;
    this.ambientAnimFrame = null;
  }

  async init() {
    console.log('%c★ GAMEVERSE CONSOLE INITIALIZING ★\nCreated By Shiv Yogi', 'color: #00f0ff; font-weight: bold; font-size: 14px;');

    // 1. Initialize Subsystems
    if (window.gameLoader) window.gameLoader.init();
    if (window.profileManager) window.profileManager.init();

    // 2. Initialize UI Components
    new window.ProfileComponent();
    new window.ControlsOverlayComponent();
    new window.PlayerScreenComponent();

    // 3. Initialize Ambient Nebula Lighting Canvas
    this.initAmbientLighting();

    // 4. Load Catalog Registry
    await window.gameRegistry.init();

    // 5. Initialize Cover Flow
    const viewport = document.querySelector('.coverflow-viewport');
    const stage = document.querySelector('.coverflow-stage');
    this.coverflow = new window.CoverFlow(viewport, stage);
    window.coverflow = this.coverflow;

    // Listen for Cover Flow game selection changes
    this.coverflow.subscribe((game) => this.onGameSelected(game));

    // Listen for catalog filters/search changes
    window.gameRegistry.subscribe((filteredGames) => {
      this.coverflow.setGames(filteredGames);
      this.renderBottomLibrary(filteredGames);
    });

    // Populate initial games list
    const initialGames = window.gameRegistry.getFilteredGames();
    this.coverflow.setGames(initialGames);
    this.renderCategories(window.gameRegistry.getCategories());
    this.renderBottomLibrary(initialGames);

    // 6. Bind Global Actions & Event Handlers
    this.bindSearch();
    this.bindActionButtons();
    this.bindPwaInstall();
    this.bindOrientationHandler();

    // 7. Start Opening Experience (Intro Animation)
    this.startOpeningExperience();
  }

  /**
   * Cinematic Intro Sequence & Welcome Registration Flow
   */
  startOpeningExperience() {
    const hasPlayer = window.storageManager.hasRegisteredPlayer();

    const intro = new window.IntroEngine(() => {
      // Intro finished naturally
      if (!hasPlayer) {
        // First-time player: Show Registration Screen
        const welcome = new window.WelcomeRegistration((name) => {
          this.revealMainLauncher();
          if (window.profileManager) window.profileManager.refresh();
        });
        welcome.show();
      } else {
        // Returning visitor: Go straight to launcher
        this.revealMainLauncher();
      }
    });

    intro.start();
  }

  revealMainLauncher() {
    const launcherScreen = document.getElementById('main-launcher-screen');
    if (launcherScreen) {
      launcherScreen.classList.remove('sr-only');
      launcherScreen.classList.add('cinematic-revealed');
    }
    // Set initial game
    const selected = this.coverflow.getSelectedGame();
    if (selected) {
      this.onGameSelected(selected);
    }
  }

  /**
   * Handle Game Selection in Carousel
   */
  onGameSelected(game) {
    this.selectedGame = game;
    if (!game) {
      this.renderEmptySelection();
      return;
    }

    // Update central coverflow display below cards
    const titleEl = document.getElementById('coverflow-title-display');
    const categoryEl = document.getElementById('coverflow-category-badge');
    const ratingEl = document.getElementById('coverflow-rating-badge');

    if (titleEl) titleEl.textContent = game.name;
    if (categoryEl) categoryEl.textContent = game.category.toUpperCase();
    if (ratingEl) ratingEl.textContent = `★ ${game.rating}`;

    // Update desktop right info panel
    const dtHero = document.getElementById('desktop-info-hero-img');
    const dtTitle = document.getElementById('desktop-info-title');
    const dtDesc = document.getElementById('desktop-info-desc');
    const dtCategory = document.getElementById('desktop-info-category');
    const dtRating = document.getElementById('desktop-info-rating');
    const dtPlayers = document.getElementById('desktop-info-players');
    const dtSize = document.getElementById('desktop-info-size');
    const dtVersion = document.getElementById('desktop-info-version');
    const dtControl = document.getElementById('desktop-info-control');

    if (dtHero) dtHero.src = game.thumbnail;
    if (dtTitle) dtTitle.textContent = game.name;
    if (dtDesc) dtDesc.textContent = game.description;
    if (dtCategory) dtCategory.textContent = game.category.toUpperCase();
    if (dtRating) dtRating.textContent = `★ ${game.rating}`;
    if (dtPlayers) dtPlayers.textContent = game.players;
    if (dtSize) dtSize.textContent = game.size;
    if (dtVersion) dtVersion.textContent = game.version;
    if (dtControl) dtControl.textContent = game.controlType.toUpperCase();

    // Update Favorite button state
    this.updateFavoriteButtonState(game.id);

    // Update active highlight in bottom drawer
    const thumbCards = document.querySelectorAll('.desktop-thumb-card');
    thumbCards.forEach(card => {
      card.classList.toggle('active', card.dataset.id === game.id);
    });
  }

  renderEmptySelection() {
    const titleEl = document.getElementById('coverflow-title-display');
    const categoryEl = document.getElementById('coverflow-category-badge');
    const ratingEl = document.getElementById('coverflow-rating-badge');
    if (titleEl) titleEl.textContent = 'No Game Selected';
    if (categoryEl) categoryEl.textContent = 'GAMEVERSE';
    if (ratingEl) ratingEl.textContent = '';
  }

  updateFavoriteButtonState(gameId) {
    const isFav = window.storageManager.isFavorite(gameId);
    const favButtons = document.querySelectorAll('.gv-btn-favorite, #coverflow-fav-btn, #desktop-fav-btn');
    favButtons.forEach(btn => {
      btn.classList.toggle('active', isFav);
      btn.innerHTML = isFav 
        ? `<svg class="gv-icon" viewBox="0 0 24 24" style="stroke: #ff007f; fill: #ff007f;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
        : `<svg class="gv-icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    });
  }

  /**
   * Play Now & Global Action Buttons
   */
  bindActionButtons() {
    // Play Now buttons (center coverflow action + desktop right panel play)
    const playButtons = document.querySelectorAll('.gv-btn-play-game, #coverflow-play-btn, #desktop-play-btn');
    playButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selectedGame && window.gameLoader) {
          window.gameLoader.launchGame(this.selectedGame);
        }
      });
    });

    // Favorite buttons
    const favButtons = document.querySelectorAll('.gv-btn-favorite, #coverflow-fav-btn, #desktop-fav-btn');
    favButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.selectedGame) return;
        const nowFav = window.storageManager.toggleFavorite(this.selectedGame.id);
        this.updateFavoriteButtonState(this.selectedGame.id);
        if (window.audioManager) window.audioManager.playButtonPress();
        if (window.profileManager) window.profileManager.refresh();
      });
    });

    // Sound toggle buttons in topbars
    const soundToggleBtns = document.querySelectorAll('.gv-sound-toggle-btn');
    soundToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!window.audioManager) return;
        const newMuted = !window.audioManager.isMuted;
        window.audioManager.setMuted(newMuted);
        soundToggleBtns.forEach(b => b.classList.toggle('muted', newMuted));
      });
    });

    // Sidebar Navigation Links
    const navLinks = document.querySelectorAll('.desktop-nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const filter = link.dataset.filter || 'all';

        if (filter === 'profile') {
          if (window.profileManager) {
            document.getElementById('profile-modal').classList.add('open');
          }
          return;
        }

        if (window.gameRegistry) {
          window.gameRegistry.setFilterMode(filter);
        }
        if (window.audioManager) window.audioManager.playSelect();
      });
    });
  }

  /**
   * Render Category Filter Pills
   */
  renderCategories(categories) {
    const containers = [
      document.getElementById('mobile-categories-row'),
      document.getElementById('desktop-categories-row')
    ];

    containers.forEach(container => {
      if (!container) return;
      container.innerHTML = '';

      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `gv-category-btn ${cat.id === 'all' ? 'active' : ''}`;
        btn.dataset.category = cat.id;
        btn.textContent = cat.name;

        btn.addEventListener('click', () => {
          container.querySelectorAll('.gv-category-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (window.gameRegistry) {
            window.gameRegistry.setCategory(cat.id);
          }
          if (window.audioManager) window.audioManager.playSelect();
        });

        container.appendChild(btn);
      });
    });
  }

  /**
   * Render Bottom Game Library Bar (Desktop)
   */
  renderBottomLibrary(games) {
    const row = document.getElementById('desktop-bottom-thumbs');
    if (!row) return;

    row.innerHTML = '';
    games.forEach(game => {
      const card = document.createElement('div');
      card.className = `desktop-thumb-card ${this.selectedGame && this.selectedGame.id === game.id ? 'active' : ''}`;
      card.dataset.id = game.id;
      card.innerHTML = `<img src="${game.thumbnail}" alt="${game.name}" loading="lazy" />`;

      card.addEventListener('click', () => {
        if (this.coverflow) {
          this.coverflow.selectGameById(game.id);
        }
      });

      row.appendChild(card);
    });
  }

  /**
   * Search Input Filtering
   */
  bindSearch() {
    const searchInputs = document.querySelectorAll('.gv-search-input, #desktop-search-input');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const query = e.target.value;
        if (window.gameRegistry) {
          window.gameRegistry.setSearchQuery(query);
        }
      });
    });
  }

  /**
   * Mobile Orientation Checking & Prompt
   */
  bindOrientationHandler() {
    const prompt = document.getElementById('orientation-prompt');
    const overrideBtn = document.getElementById('orientation-override-btn');

    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 900;
      const isPortrait = window.innerHeight > window.innerWidth;

      if (isMobile && isPortrait) {
        if (prompt) prompt.classList.add('visible');
      } else {
        if (prompt) prompt.classList.remove('visible');
      }
    };

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    checkOrientation();

    if (overrideBtn && prompt) {
      overrideBtn.addEventListener('click', () => {
        prompt.classList.remove('visible');
      });
    }
  }

  /**
   * Progressive Web App (PWA) Install Handling
   */
  bindPwaInstall() {
    const installBtns = document.querySelectorAll('.gv-pwa-install-btn, #topbar-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      installBtns.forEach(btn => btn.style.display = 'inline-flex');
    });

    installBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.deferredInstallPrompt) return;
        this.deferredInstallPrompt.prompt();
        const { outcome } = await this.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('[GameVerse PWA] User accepted installation');
          installBtns.forEach(b => b.style.display = 'none');
        }
        this.deferredInstallPrompt = null;
      });
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('[GameVerse SW] Registered successfully', reg.scope))
          .catch(err => console.warn('[GameVerse SW] Registration failed', err));
      });
    }
  }

  /**
   * Ambient Dynamic Lighting Canvas
   */
  initAmbientLighting() {
    this.ambientCanvas = document.getElementById('ambient-glow-canvas');
    if (!this.ambientCanvas) return;
    this.ambientCtx = this.ambientCanvas.getContext('2d');

    const resize = () => {
      if (!this.ambientCanvas) return;
      this.ambientCanvas.width = window.innerWidth;
      this.ambientCanvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    const animate = () => {
      t += 0.006;
      if (this.ambientCtx && this.ambientCanvas) {
        const w = this.ambientCanvas.width;
        const h = this.ambientCanvas.height;
        this.ambientCtx.clearRect(0, 0, w, h);

        const x1 = w * 0.35 + Math.sin(t) * 90;
        const y1 = h * 0.3 + Math.cos(t * 0.8) * 60;
        const grad1 = this.ambientCtx.createRadialGradient(x1, y1, 10, x1, y1, w * 0.45);
        grad1.addColorStop(0, 'rgba(0, 240, 255, 0.08)');
        grad1.addColorStop(1, 'rgba(0, 240, 255, 0)');
        this.ambientCtx.fillStyle = grad1;
        this.ambientCtx.fillRect(0, 0, w, h);

        const x2 = w * 0.65 + Math.cos(t * 1.1) * 80;
        const y2 = h * 0.4 + Math.sin(t * 0.9) * 70;
        const grad2 = this.ambientCtx.createRadialGradient(x2, y2, 10, x2, y2, w * 0.5);
        grad2.addColorStop(0, 'rgba(112, 0, 255, 0.07)');
        grad2.addColorStop(1, 'rgba(112, 0, 255, 0)');
        this.ambientCtx.fillStyle = grad2;
        this.ambientCtx.fillRect(0, 0, w, h);
      }
      this.ambientAnimFrame = requestAnimationFrame(animate);
    };
    animate();
  }
}

// Bootstrap on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.gameVerseLauncher = new GameVerseLauncher();
  window.gameVerseLauncher.init();
});
