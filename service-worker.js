/**
 * GAMEVERSE - Service Worker
 * Created By Shiv Yogi | Offline Launcher Shell Caching & Update Management
 */

const CACHE_NAME = 'gameverse-shell-v1.0.0';

// Critical app shell assets to cache for offline launcher availability
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './data/games.json',
  './data/categories.json',
  './data/controls.json',
  './launcher/css/main.css',
  './launcher/css/glass-ui.css',
  './launcher/css/animations.css',
  './launcher/css/carousel.css',
  './launcher/css/mobile.css',
  './launcher/css/desktop.css',
  './launcher/components/intro/intro.css',
  './launcher/components/intro/intro.js',
  './launcher/components/welcome/welcome.css',
  './launcher/components/welcome/welcome.js',
  './launcher/components/carousel/coverflow.css',
  './launcher/components/carousel/coverflow.js',
  './launcher/components/profile/profile.css',
  './launcher/components/profile/profile.js',
  './launcher/components/controls/controls-overlay.css',
  './launcher/components/controls/controls-overlay.js',
  './launcher/components/player/player-screen.css',
  './launcher/components/player/player-screen.js',
  './launcher/storage-manager.js',
  './launcher/audio-manager.js',
  './launcher/game-registry.js',
  './launcher/game-controls.js',
  './launcher/game-loader.js',
  './launcher/profile-manager.js',
  './launcher/launcher.js',
  './assets/logo/gameverse-logo.svg',
  './assets/logo/gameverse-symbol.svg',
  './assets/posters/cyber-neon-overdrive.svg',
  './assets/posters/hyper-drift-2099.svg',
  './assets/posters/quantum-strike.svg',
  './assets/posters/chrono-blade.svg',
  './assets/posters/neural-matrix-nexus.svg',
  './assets/posters/void-runner.svg',
  './assets/posters/default-game.svg',
  './assets/gifs/avatar-cyber.svg'
];

// Install: Cache launcher app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[GameVerse SW] Caching app shell assets');
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[GameVerse SW] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-while-revalidate for shell, bypass for large media or external game files
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Bypass cache for large videos or streaming media
  if (requestUrl.pathname.endsWith('.mp4') || requestUrl.pathname.endsWith('.webm')) {
    return;
  }

  // Network-first or cache-first for local static shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Offline fallback if index is requested
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
