# Orbital Drift

A neon arcade game of orbits and comets — pilot your ship around a living star, harvest comets for combo score, and dodge debris and solar flares. Built for [make.fun · best-game-01](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01).

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/maharanilestarinugraha7-ui/orbital-drift/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/maharanilestarinugraha7-ui/orbital-drift/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

## Play

```bash
node serve.ts        # then open http://localhost:8080
```

Static files under `game/` — no network request, no build step, desktop Chrome + keyboard/mouse.

## Controls

Arrows/WASD: altitude + thrust · Space: boost · P: pause · M: mute

## Hand-in

`node main.ts` copies `game/` and `screenshots/` to `/output` (or `MAKEFUN_OUTPUT_DIR`) and writes the judge's dossier via `vendor/makefun-game.ts`.
