# GAMEVERSE
### Premium Installable Gaming Launcher | Created By Shiv Yogi

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen.svg)](#-github-pages-hosting-guide)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-cyan.svg)](#-progressive-web-app-pwa)
[![Author](https://img.shields.io/badge/Creator-Shiv%20Yogi-ff007f.svg)](#)

---

**GAMEVERSE** is an elite, futuristic gaming launcher website designed with a dark Liquid Glass aesthetic, an Apple-inspired 3D Cover Flow carousel, low-latency console sound effects, custom player profile persistence, on-screen touch controls, and an expandable modular architecture built for zero-dependency GitHub Pages static hosting.

---

## 🌟 Key Highlights

1. **Cinematic Opening Experience**:
   - Crystal-particle canvas animation revealing **Shiv Yogi** and **GAMEVERSE** with smooth blur and zoom transitions.
2. **First-Time Player Registration**:
   - Glassmorphism registration screen verifying and persisting commander names in `LocalStorage`. Returning visitors proceed directly into the console.
3. **iPhone-Style 3D Cover Flow Carousel**:
   - Hardware-accelerated 3D stacked cover carousel with realistic depth, tilt perspectives, reflections, neon selection glow, touch swipe gestures, and keyboard navigation.
4. **Universal Touch Controls Engine & postMessage API**:
   - Reusable on-screen touch gamepad supporting 4 presets: **Racing**, **Action**, **Platformer**, and **Puzzle** with a virtual analog joystick, multi-touch buttons, haptics, and custom layout adjustments.
5. **Mobile Landscape Console Mode**:
   - Dedicated landscape layout with orientation detection and automatic rotation reminders.
6. **Desktop Command Center**:
   - Left navigation sidebar, large central 3D stage, right-hand live game telemetry panel, and bottom quick-catalog bar.
7. **Zero-Latency Web Audio API Synthesizer**:
   - Console-grade audio synthesized in real time (select clicks, navigation swooshes, warp-drive launch booms, reverse portal exit whooshes).
8. **Installable PWA**:
   - Installable via Chrome on Android & Desktop with standalone display mode and offline shell caching via Service Worker.

---

## 📁 Repository Structure

```
GAME-VERSE/
├── index.html                  # Master entry point
├── README.md                   # Documentation & hosting guide
├── manifest.json               # Progressive Web App manifest
├── service-worker.js           # Offline caching service worker
│
├── launcher/
│   ├── launcher.js             # Master launcher orchestrator
│   ├── game-loader.js          # Sandboxed iframe session manager
│   ├── game-registry.js        # Catalog query, validation & deduplication
│   ├── game-controls.js        # Universal touch controls & postMessage API
│   ├── audio-manager.js        # Web Audio API console sound effects
│   ├── profile-manager.js      # Player stats, avatar reactions & saves
│   ├── storage-manager.js      # LocalStorage persistence wrapper
│   │
│   ├── css/
│   │   ├── main.css            # Design tokens & CSS reset
│   │   ├── glass-ui.css        # Liquid glassmorphism components
│   │   ├── animations.css      # 50+ GPU-accelerated keyframe animations
│   │   ├── carousel.css        # 3D Cover Flow perspective & reflections
│   │   ├── mobile.css          # Mobile landscape layout & orientation
│   │   └── desktop.css         # Desktop command center layout
│   │
│   └── components/
│       ├── intro/              # Crystal-particle opening engine
│       ├── welcome/            # First-time registration modal
│       ├── carousel/           # 3D carousel logic
│       ├── profile/            # Profile modal & reactions
│       ├── controls/           # Three-dot menu & controls HUD
│       └── player/             # In-game HUD & error handler
│
├── Games/                      # Game storage directory (expandable)
│   ├── Racing/
│   ├── Action/
│   ├── Shooting/
│   ├── Puzzle/
│   ├── Arcade/
│   └── TestGame/               # Verified playable cyber neon demo game
│
├── assets/
│   ├── logo/                   # SVG logo and symbol emblems
│   ├── icons/                  # UI icons
│   ├── posters/                # Vertical 2:3 cyberpunk game posters
│   ├── previews/               # Game preview clips
│   ├── gifs/                   # Animated avatar vector loops
│   ├── sounds/                 # Audio assets
│   └── fonts/                  # Typography rules
│
└── data/
    ├── games.json              # Central game catalog
    ├── categories.json         # Category classifications
    └── controls.json           # Gamepad schemas & mappings
```

---

## 🚀 GitHub Pages Hosting Guide

GAMEVERSE is built with vanilla web standards and requires **zero build steps or compilation**.

### Steps to Host on GitHub Pages:

1. **Create a GitHub Repository**:
   - Push this `GAME-VERSE` project to your GitHub account (e.g., `https://github.com/your-username/gameverse`).
2. **Open Repository Settings**:
   - Navigate to the **Settings** tab in your GitHub repository.
3. **Configure Pages**:
   - On the left sidebar, click **Pages** (under the "Code and automation" section).
   - Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
   - Select the branch (e.g., `main`) and the folder `/ (root)`.
   - Click **Save**.
4. **Launch**:
   - GitHub will generate your live URL within 1–2 minutes:
     `https://your-username.github.io/gameverse/`

---

## 🎮 How to Add Future Games

Adding games requires **no modifications to the launcher codebase**:

### Step 1: Put Your Game Files in `Games/`
Create a folder inside the appropriate category directory:
```
Games/Racing/cyber-kart/
  ├── index.html
  ├── game.js
  └── assets/
```

### Step 2: Register the Game in `data/games.json`
Add an entry to `data/games.json`:
```json
{
  "id": "cyber-kart-2099",
  "name": "Cyber Kart 2099",
  "description": "High-octane neon kart racer through holographic speedways.",
  "category": "racing",
  "thumbnail": "assets/posters/cyber-kart.svg",
  "entryUrl": "Games/Racing/cyber-kart/index.html",
  "previewVideo": "",
  "version": "1.0.0",
  "size": "5.2 MB",
  "controlType": "racing",
  "rating": 4.9,
  "players": "1-2 Players",
  "featured": true,
  "enabled": true
}
```

The launcher will dynamically generate the 3D Cover Flow card, thumbnail, categories, and controls!

---

## 📡 Universal Game Controls postMessage Protocol

When a game is launched, GAMEVERSE mounts it inside a sandboxed `<iframe>`. The launcher streams input events to the game frame via `window.postMessage`:

### Message Schema:
```typescript
interface GameVerseInputEvent {
  type: 'GAMEVERSE_INPUT';
  action: 'PRESS' | 'RELEASE' | 'JOYSTICK' | 'PAUSE' | 'RESTART';
  code: string;       // e.g. 'ArrowLeft', 'ArrowRight', 'Space', 'ANALOG'
  payload?: {
    x?: number;       // Normalized -1.0 to 1.0 (for JOYSTICK)
    y?: number;       // Normalized -1.0 to 1.0 (for JOYSTICK)
    key?: string;     // Key representation
  };
  timestamp: number;
}
```

### Example Implementation in Your Game:
```javascript
window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'GAMEVERSE_INPUT') return;

  const { action, code, payload } = data;

  if (action === 'PRESS') {
    if (code === 'ArrowLeft') moveLeft();
    if (code === 'ArrowRight') moveRight();
    if (code === 'Space') jumpOrNitro();
  } else if (action === 'RELEASE') {
    if (code === 'ArrowLeft' || code === 'ArrowRight') stopMoving();
  } else if (action === 'JOYSTICK' && payload) {
    applyAnalogVector(payload.x, payload.y);
  }
});
```

---

## 🛡️ Security & Performance

- **Sandboxed Execution**: Game frames run with `sandbox="allow-scripts allow-same-origin allow-pointer-lock"`.
- **Storage Isolation**: The launcher never exposes its `localStorage` keys to game frames.
- **Resource Cleanup**: When a player exits a game, the iframe is completely detached and media playback is cleanly terminated.
- **Missing File Protection**: The launcher verifies file paths with `HEAD` checks before launching and displays a helpful installation prompt if files have not yet been copied over.

---

## 👨‍💻 Creator & Credits

- **Architect & Developer**: Shiv Yogi
- **Project**: GAMEVERSE
- **Platform**: Web, Android Chrome, Handheld Landscape Console & Desktop
- **License**: MIT Open Source
