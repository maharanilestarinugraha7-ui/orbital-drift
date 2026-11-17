# BRIEF — Orbital Drift (entry for make.fun best-game-01)

Build a complete, original, polished browser game called **Orbital Drift**. Everything you write must be your own authorship: write every file completely with the Write tool, in full-file writes, one file per message.

## Concept
Neon-vector arcade game on a 2D canvas (no external libraries, no network requests, ES modules):
- You pilot a small ship locked in orbit around a central star. The ship drifts along its orbit; you control thrust and altitude with keyboard.
- Fly close to comets that streak past to harvest them (collect energy/score). Comets glow and shatter into particles when harvested.
- Hazards: rotating debris fields and solar flares from the star. Touching them costs a shield/life.
- Score with combo multiplier: harvesting comets in quick succession raises the multiplier; taking damage or waiting too long resets it.
- Difficulty ramps: more debris, faster comets, longer flares each wave.

## Required completeness (the judge checks every one)
- Title/start screen with the game name, one-line how-to-play, and a pulsing "Press Enter to launch"
- Responsive controls (arrows/WASD: altitude + thrust; Space: boost with cooldown)
- HUD: score, combo multiplier, shields/lives (icons), wave number, energy bar
- Clear win/lose: game over screen with final score and best score (localStorage), press Enter to restart
- Pause (P/Esc) with overlay
- Juicy feedback: glow (shadowBlur), particle bursts, screen shake on damage, floating score popups, smooth easing — the game must look STUNNING in static screenshots
- Sound: WebAudio-synthesized effects (harvest chime, hit thud, flare rumble), a mute toggle (M); no audio files, synthesize everything
- Original art/names: no borrowed characters or assets; all visuals are drawn in code

## Aesthetic direction
Deep space background (near-black navy with subtle parallax starfield), neon cyan ship trail, magenta/orange comets, hot white-yellow star with corona glow. Big chunky readable HUD font. UI panels as translucent dark glass with neon borders.

## File layout under game/
- index.html — loads css/style.css and js/main.js as module; canvas + minimal DOM overlay
- css/style.css
- js/main.js — bootstrap, game loop, state machine (title/playing/paused/gameover)
- js/starfield.js — parallax background stars
- js/ship.js — player ship, orbit physics, thrust, trail
- js/entities.js — comets, debris, flares, particles
- js/hud.js — HUD rendering and overlays
- js/audio.js — WebAudio synth engine
- js/utils.js — math helpers, RNG, easing

## Hard rules
- No external libraries, no fetch/XHR, no images — everything drawn programmatically
- Runs by opening a static server: `node serve.ts` from the repo root serves game/ at :8080
- Keep every file self-contained and clearly commented (comments count and help the judge's source outline)
- After writing all files, verify: `node serve.ts &` briefly, curl http://localhost:8080/ returns 200, then kill it. Also run `node --check` on each js file? (they are browser modules; skip node --check if imports break it, but keep syntax valid)
- Do NOT touch main.ts, serve.ts, vendor/, LICENSE, .makefun/, README.md
- Commit everything with git at the end
