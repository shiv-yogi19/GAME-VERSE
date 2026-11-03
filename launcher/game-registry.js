/**
 * GAMEVERSE - Game Registry
 * Created By Shiv Yogi | Central Catalog, File Validation & Query Engine
 */

class GameRegistry {
  constructor() {
    this.games = [];
    this.categories = [];
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.filterMode = 'all'; // 'all', 'favorites', 'recent', 'featured'
    this.isLoaded = false;
    this.listeners = new Set();
  }

  async init() {
    try {
      const [gamesRes, catsRes] = await Promise.all([
        fetch('data/games.json').then(r => r.json()).catch(() => []),
        fetch('data/categories.json').then(r => r.json()).catch(() => [])
      ]);

      this.categories = Array.isArray(catsRes) ? catsRes : [];
      this.games = this.validateAndDeduplicate(Array.isArray(gamesRes) ? gamesRes : []);
      this.isLoaded = true;
      this.notifyListeners();
      return this.games;
    } catch (e) {
      console.error('[GameVerse Registry] Failed to load catalog data', e);
      this.games = [];
      this.categories = [];
      this.isLoaded = true;
      this.notifyListeners();
      return [];
    }
  }

  validateAndDeduplicate(rawList) {
    const seenIds = new Set();
    const validated = [];

    for (const item of rawList) {
      if (!item || !item.id || !item.name) continue;

      // Duplicate prevention
      if (seenIds.has(item.id)) {
        console.warn(`[GameVerse Registry] Duplicate game ID detected and skipped: ${item.id}`);
        continue;
      }
      seenIds.add(item.id);

      // Sanitize fields & defaults
      const game = {
        id: String(item.id).trim(),
        name: String(item.name).trim(),
        description: item.description || 'No description provided.',
        category: (item.category || 'casual').toLowerCase(),
        thumbnail: item.thumbnail || 'assets/posters/default-game.svg',
        entryUrl: item.entryUrl || '',
        previewVideo: item.previewVideo || '',
        version: item.version || '1.0.0',
        size: item.size || 'Unknown',
        controlType: (item.controlType || 'action').toLowerCase(),
        rating: typeof item.rating === 'number' ? item.rating : 4.5,
        players: item.players || '1 Player',
        featured: Boolean(item.featured),
        enabled: item.enabled !== false,
        isInstalled: false // Checked when validating files
      };

      validated.push(game);
    }

    return validated;
  }

  /**
   * Check whether a game's entryUrl actually exists on server
   * Prevents pretending a game is playable if missing
   */
  async verifyGameAvailability(game) {
    if (!game || !game.entryUrl) return false;
    try {
      const response = await fetch(game.entryUrl, { method: 'HEAD' });
      const ok = response.ok;
      game.isInstalled = ok;
      return ok;
    } catch (e) {
      game.isInstalled = false;
      return false;
    }
  }

  getGameById(id) {
    return this.games.find(g => g.id === id) || null;
  }

  getAllGames() {
    return this.games;
  }

  getCategories() {
    return this.categories;
  }

  setCategory(categoryId) {
    this.activeCategory = categoryId;
    this.notifyListeners();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.notifyListeners();
  }

  setFilterMode(mode) {
    this.filterMode = mode; // 'all', 'favorites', 'recent', 'featured'
    this.notifyListeners();
  }

  getFilteredGames() {
    let result = [...this.games];

    // Filter Mode
    if (this.filterMode === 'favorites') {
      const favs = window.storageManager ? window.storageManager.getFavorites() : [];
      result = result.filter(g => favs.includes(g.id));
    } else if (this.filterMode === 'recent') {
      const recents = window.storageManager ? window.storageManager.getRecentlyPlayed() : [];
      // Keep recent order
      result = recents.map(id => this.getGameById(id)).filter(Boolean);
    } else if (this.filterMode === 'featured') {
      result = result.filter(g => g.featured);
    }

    // Category Filter
    if (this.activeCategory && this.activeCategory !== 'all' && this.filterMode !== 'recent') {
      result = result.filter(g => g.category === this.activeCategory.toLowerCase());
    }

    // Search Query
    if (this.searchQuery) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(this.searchQuery) ||
        g.description.toLowerCase().includes(this.searchQuery) ||
        g.category.toLowerCase().includes(this.searchQuery)
      );
    }

    return result;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const list = this.getFilteredGames();
    for (const cb of this.listeners) {
      try {
        cb(list);
      } catch (e) {
        console.error('[GameVerse Registry] Listener error', e);
      }
    }
  }
}

// Export singleton
window.gameRegistry = new GameRegistry();
