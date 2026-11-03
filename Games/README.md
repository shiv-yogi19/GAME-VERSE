# GAMEVERSE Games Directory

This directory is where new games are installed. 

## Structure
```
Games/
├── Racing/         <-- Place HTML5/WebGL Racing games here
├── Action/         <-- Place Action & Adventure games here
├── Shooting/       <-- Place FPS & Railgun games here
├── Puzzle/         <-- Place Quantum Logic & Puzzle games here
├── Arcade/         <-- Place Retro & Synthwave Arcade games here
└── TestGame/       <-- Built-in neon speedway test game for validation
```

## Adding a New Game
1. Create a subfolder, e.g. `Games/Racing/turbo-overdrive/`.
2. Place the game entry file `index.html` inside it.
3. Add an entry to `data/games.json` with the path `Games/Racing/turbo-overdrive/index.html`.
4. Connect the GameVerse postMessage input API if on-screen touch controls are desired.
