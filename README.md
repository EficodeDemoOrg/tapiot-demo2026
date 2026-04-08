# ⚔️ Barbarian Arena

A brutal 2-player local fighting game built with HTML5 Canvas and Web Audio API. Conan-style barbarian warriors battle to the death with swords, featuring decapitation fatalities and synthesized gore sound effects.

## How to Play

```bash
cd games/barbarian
npm install
npm start
# Open http://localhost:3005
```

## Controls

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move | W A S D | Arrow Keys |
| Slash | F | J |
| Overhead | G | K |
| Special | H | L |
| Block | R | U |

## Features

- **2-player local combat** on shared keyboard
- **3 attack types**: slash (fast), overhead (heavy), special (devastating)
- **Blocking** with stamina drain and metal clang sparks
- **Decapitation fatalities** — kill with Special or win the final round for a flying head finish
- **Blood particle system** with ground stains
- **Screen shake** on heavy impacts
- **Synthesized sound effects** via Web Audio API — no external audio files
  - Sword slashes, meaty flesh hits, bone crunches
  - Death screams, decapitation gore, crowd roar
  - War drums, victory gongs, footsteps
- **Round system** — first to 2 wins, 60-second timer
- **Stamina management** — attacks and blocking cost stamina
- **Dark arena** with torches, skulls, moonlit mountains

## Tech Stack

- Node.js + Express (static server)
- HTML5 Canvas (rendering)
- Web Audio API (all sounds synthesized in real-time)
