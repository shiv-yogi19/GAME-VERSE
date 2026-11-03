/**
 * GAMEVERSE - Storage Manager
 * Created By Shiv Yogi | Robust LocalStorage & Preference State Management
 */

const STORAGE_KEYS = {
  PROFILE: 'gameverse_player_profile',
  SETTINGS: 'gameverse_system_settings',
  CONTROLS: 'gameverse_controls_config',
  FAVORITES: 'gameverse_favorites_list',
  RECENT: 'gameverse_recent_played',
  STATS: 'gameverse_player_stats'
};

const DEFAULT_PROFILE = {
  playerName: '',
  avatarId: 'cyber-ronin',
  avatarMood: 'idle',
  joinDate: new Date().toISOString(),
  isRegistered: false
};

const DEFAULT_SETTINGS = {
  masterVolume: 0.8,
  uiSounds: true,
  gameSounds: true,
  muted: false,
  quality: 'ultra', // ultra, balanced, low
  showFps: false,
  reducedMotion: false,
  liquidBlur: true,
  glowIntensity: 1.0,
  controls: {
    buttonSize: 64,
    buttonOpacity: 0.85,
    joystickSensitivity: 1.0,
    joystickDeadzone: 0.12,
    haptics: true,
    dynamicJoystick: false
  }
};

const DEFAULT_STATS = {
  totalGamesPlayed: 0,
  totalLaunches: 0,
  totalPlayMinutes: 0,
  favoriteGenre: 'Arcade',
  lastPlayedId: null
};

class StorageManager {
  constructor() {
    this.isSupported = this.checkSupport();
    this.memoryFallback = new Map();
  }

  checkSupport() {
    try {
      const test = '__gv_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[GameVerse Storage] LocalStorage not available, using in-memory store', e);
      return false;
    }
  }

  getItem(key, defaultValue = null) {
    if (!this.isSupported) {
      return this.memoryFallback.has(key) ? this.memoryFallback.get(key) : defaultValue;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      console.error(`[GameVerse Storage] Failed to parse key ${key}`, e);
      return defaultValue;
    }
  }

  setItem(key, value) {
    if (!this.isSupported) {
      this.memoryFallback.set(key, value);
      return true;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`[GameVerse Storage] Failed to set key ${key}`, e);
      return false;
    }
  }

  removeItem(key) {
    if (!this.isSupported) {
      this.memoryFallback.delete(key);
      return true;
    }
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Profile Specific Helpers
  getProfile() {
    return { ...DEFAULT_PROFILE, ...(this.getItem(STORAGE_KEYS.PROFILE, {}) || {}) };
  }

  saveProfile(profileData) {
    const current = this.getProfile();
    const updated = { ...current, ...profileData, isRegistered: true };
    this.setItem(STORAGE_KEYS.PROFILE, updated);
    return updated;
  }

  hasRegisteredPlayer() {
    const profile = this.getProfile();
    return Boolean(profile.isRegistered && profile.playerName && profile.playerName.trim().length > 0);
  }

  // Settings Specific Helpers
  getSettings() {
    const saved = this.getItem(STORAGE_KEYS.SETTINGS, {}) || {};
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      controls: { ...DEFAULT_SETTINGS.controls, ...(saved.controls || {}) }
    };
  }

  saveSettings(newSettings) {
    const current = this.getSettings();
    const merged = {
      ...current,
      ...newSettings,
      controls: { ...current.controls, ...(newSettings.controls || {}) }
    };
    this.setItem(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  }

  // Favorites Helpers
  getFavorites() {
    return this.getItem(STORAGE_KEYS.FAVORITES, []) || [];
  }

  toggleFavorite(gameId) {
    const favs = new Set(this.getFavorites());
    let isFav = false;
    if (favs.has(gameId)) {
      favs.delete(gameId);
      isFav = false;
    } else {
      favs.add(gameId);
      isFav = true;
    }
    this.setItem(STORAGE_KEYS.FAVORITES, Array.from(favs));
    return isFav;
  }

  isFavorite(gameId) {
    const favs = this.getFavorites();
    return favs.includes(gameId);
  }

  // Recently Played Helpers
  getRecentlyPlayed() {
    return this.getItem(STORAGE_KEYS.RECENT, []) || [];
  }

  addRecentlyPlayed(gameId) {
    if (!gameId) return;
    const current = this.getRecentlyPlayed().filter(id => id !== gameId);
    current.unshift(gameId);
    // Keep top 12
    const trimmed = current.slice(0, 12);
    this.setItem(STORAGE_KEYS.RECENT, trimmed);

    // Update stats
    const stats = this.getStats();
    stats.totalLaunches += 1;
    stats.lastPlayedId = gameId;
    this.saveStats(stats);
  }

  // Stats Helpers
  getStats() {
    return { ...DEFAULT_STATS, ...(this.getItem(STORAGE_KEYS.STATS, {}) || {}) };
  }

  saveStats(statsData) {
    const current = this.getStats();
    const updated = { ...current, ...statsData };
    this.setItem(STORAGE_KEYS.STATS, updated);
    return updated;
  }
}

// Export singleton
window.storageManager = new StorageManager();
