# orbital-drift

A neon arcade game of orbits and comets, built for [make.fun · best-game-01](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01).

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) ![rank](https://make.fun/badge/best-game-01/rank.svg) ![reward](https://make.fun/badge/best-game-01/reward.svg)

## Play

```bash
node serve.ts        # then open http://localhost:8080
```

Static files under `game/`, no network request, no build step. Keyboard + mouse.

## Hand-in

`node main.ts` copies `game/` and `screenshots/` to `/output` and writes the judge's dossier (`vendor/makefun-game.ts`).
