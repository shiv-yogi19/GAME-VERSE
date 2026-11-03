/**
 * GAMEVERSE - Apple-Inspired 3D Cover Flow Engine
 * Created By Shiv Yogi | True Perspective 3D Carousel & Smooth Switching
 */

class CoverFlow {
  constructor(viewportEl, stageEl) {
    this.viewport = viewportEl || document.querySelector('.coverflow-viewport');
    this.stage = stageEl || document.querySelector('.coverflow-stage');
    this.games = [];
    this.currentIndex = 0;
    this.cardElements = [];
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragDeltaX = 0;
    this.wheelDebounce = null;
    this.listeners = new Set();
    this.activeVideoEl = null;

    this.bindInteractions();
  }

  setGames(gameList) {
    // Prevent duplicate entries
    const seen = new Set();
    this.games = (gameList || []).filter(g => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });

    // Clamp index
    if (this.currentIndex >= this.games.length) {
      this.currentIndex = Math.max(0, this.games.length - 1);
    }

    this.render();
  }

  render() {
    if (!this.stage) return;
    this.stage.innerHTML = '';
    this.cardElements = [];
    this.unloadCurrentVideo();

    if (this.games.length === 0) {
      this.renderEmptyState();
      this.notifySelection();
      return;
    }

    this.games.forEach((game, index) => {
      const card = document.createElement('div');
      card.className = 'coverflow-card';
      card.dataset.index = index;
      card.dataset.id = game.id;

      const posterWrap = document.createElement('div');
      posterWrap.className = 'coverflow-poster-wrap';

      const img = document.createElement('img');
      img.className = 'coverflow-poster-img';
      img.src = game.thumbnail;
      img.alt = game.name;
      img.loading = 'lazy';

      // Fallback on missing image
      img.onerror = () => {
        img.src = 'assets/posters/default-game.svg';
      };

      posterWrap.appendChild(img);
      card.appendChild(posterWrap);

      // Click side cards to center
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.currentIndex !== index) {
          this.selectIndex(index);
        } else {
          // If clicked center card, launch game
          if (window.gameLoader) {
            window.gameLoader.launchGame(this.getSelectedGame());
          }
        }
      });

      this.stage.appendChild(card);
      this.cardElements.push(card);
    });

    this.update3DPositions();
    this.notifySelection();
  }

  renderEmptyState() {
    const empty = document.createElement('div');
    empty.className = 'coverflow-empty-state';
    empty.innerHTML = `
      <svg class="coverflow-empty-icon gv-icon" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
      <div class="coverflow-empty-title">NO GAMES FOUND</div>
      <div class="coverflow-empty-desc">Install games into the Games/ directory or adjust your category and search filters.</div>
    `;
    this.stage.appendChild(empty);
  }

  update3DPositions() {
    if (this.games.length === 0 || this.cardElements.length === 0) return;

    const isMobile = window.innerWidth <= 1024;
    const spacing = isMobile ? 65 : 125;
    const centerOffset = isMobile ? 120 : 190;
    const depthSpacing = isMobile ? 85 : 130;
    const rotateAngle = 54;

    this.cardElements.forEach((card, idx) => {
      const offset = idx - this.currentIndex;
      const absOffset = Math.abs(offset);

      // Reset classes
      card.classList.remove('active', 'floating', 'stack-left', 'stack-right', 'hidden-stack');

      if (offset === 0) {
        // Selected Center Card
        card.classList.add('active', 'floating');
        card.style.transform = `translateX(0px) translateZ(0px) rotateY(0deg) scale(1)`;
        card.style.zIndex = 100;
        card.style.opacity = '1';
        card.style.filter = 'blur(0px) brightness(1.05)';
        this.mountVideoPreview(card, this.games[idx]);
      } else if (offset < 0) {
        // Left Stack
        card.classList.add('stack-left');
        const tx = offset * spacing - centerOffset;
        const tz = -absOffset * depthSpacing;
        card.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${rotateAngle}deg) scale(0.82)`;
        card.style.zIndex = 100 - absOffset;
        card.style.opacity = Math.max(0.2, 0.88 - absOffset * 0.18).toString();
        card.style.filter = 'blur(1.5px) brightness(0.65)';
        this.unmountVideoPreview(card);
      } else {
        // Right Stack
        card.classList.add('stack-right');
        const tx = offset * spacing + centerOffset;
        const tz = -absOffset * depthSpacing;
        card.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(-${rotateAngle}deg) scale(0.82)`;
        card.style.zIndex = 100 - absOffset;
        card.style.opacity = Math.max(0.2, 0.88 - absOffset * 0.18).toString();
        card.style.filter = 'blur(1.5px) brightness(0.65)';
        this.unmountVideoPreview(card);
      }

      // Hide distant cards completely for performance
      if (absOffset > 5) {
        card.classList.add('hidden-stack');
        card.style.opacity = '0';
        card.style.pointerEvents = 'none';
      } else {
        card.style.pointerEvents = 'auto';
      }
    });

    // Update Nav buttons state
    const prevBtn = document.getElementById('coverflow-prev-btn');
    const nextBtn = document.getElementById('coverflow-next-btn');
    if (prevBtn) prevBtn.disabled = this.currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = this.currentIndex >= this.games.length - 1;
  }

  selectIndex(index, playAudio = true) {
    if (this.games.length === 0) return;
    const target = Math.max(0, Math.min(this.games.length - 1, index));
    if (target === this.currentIndex) return;

    this.currentIndex = target;
    this.update3DPositions();

    if (playAudio && window.audioManager) {
      window.audioManager.playNav();
    }

    this.notifySelection();
  }

  selectGameById(gameId) {
    const idx = this.games.findIndex(g => g.id === gameId);
    if (idx !== -1) {
      this.selectIndex(idx);
    }
  }

  next() {
    if (this.currentIndex < this.games.length - 1) {
      this.selectIndex(this.currentIndex + 1);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.selectIndex(this.currentIndex - 1);
    }
  }

  getSelectedGame() {
    return this.games[this.currentIndex] || null;
  }

  /**
   * Video Preview Handling
   */
  mountVideoPreview(cardEl, game) {
    if (!game || !game.previewVideo) {
      this.unloadCurrentVideo();
      return;
    }

    // Check if video element already exists in card
    let video = cardEl.querySelector('.coverflow-video-preview');
    if (!video) {
      video = document.createElement('video');
      video.className = 'coverflow-video-preview';
      video.src = game.previewVideo;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.autoplay = true;

      const wrap = cardEl.querySelector('.coverflow-poster-wrap');
      if (wrap) wrap.appendChild(video);
    }

    video.play().then(() => {
      video.classList.add('playing');
    }).catch(() => {});

    this.activeVideoEl = video;
  }

  unmountVideoPreview(cardEl) {
    const video = cardEl.querySelector('.coverflow-video-preview');
    if (video) {
      video.pause();
      video.classList.remove('playing');
      video.remove();
    }
  }

  unloadCurrentVideo() {
    if (this.activeVideoEl) {
      this.activeVideoEl.pause();
      this.activeVideoEl.classList.remove('playing');
      this.activeVideoEl.remove();
      this.activeVideoEl = null;
    }
  }

  /**
   * Gestures & Inputs
   */
  bindInteractions() {
    if (!this.viewport) return;

    // Pointer Drag / Swipe
    this.viewport.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragDeltaX = 0;
      this.viewport.setPointerCapture(e.pointerId);
    });

    this.viewport.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.dragDeltaX = e.clientX - this.dragStartX;
    });

    const endDrag = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const threshold = 45;
      if (this.dragDeltaX < -threshold) {
        this.next();
      } else if (this.dragDeltaX > threshold) {
        this.prev();
      }
    };

    this.viewport.addEventListener('pointerup', endDrag);
    this.viewport.addEventListener('pointercancel', endDrag);

    // Mouse Wheel
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      clearTimeout(this.wheelDebounce);
      this.wheelDebounce = setTimeout(() => {
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta > 20) {
          this.next();
        } else if (delta < -20) {
          this.prev();
        }
      }, 40);
    }, { passive: false });

    // Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      // Ignore if user is typing in an input
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      // Ignore if in game
      if (window.gameLoader && window.gameLoader.isPlaying) return;

      if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === 'ArrowRight') {
        this.next();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const selected = this.getSelectedGame();
        if (selected && window.gameLoader) {
          window.gameLoader.launchGame(selected);
        }
      }
    });

    // Prev / Next button binds
    const prevBtn = document.getElementById('coverflow-prev-btn');
    const nextBtn = document.getElementById('coverflow-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.prev());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifySelection() {
    const selected = this.getSelectedGame();
    for (const cb of this.listeners) {
      try {
        cb(selected, this.currentIndex, this.games.length);
      } catch (e) {
        console.error('[GameVerse CoverFlow] Listener error', e);
      }
    }
  }
}

window.CoverFlow = CoverFlow;
