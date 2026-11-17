/**
 * Orbital Drift - Main Game Loop & State Manager
 */

import { Starfield } from './starfield.js';
import { Ship } from './ship.js';
import { Star, Comet, Debris, ParticleManager, FloatingTextManager } from './entities.js';
import { HUD } from './hud.js';
import { sound } from './audio.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const srStatus = document.getElementById('sr-status');

// Game State
let state = 'TITLE'; // TITLE, PLAYING, PAUSED, GAMEOVER
let score = 0;
let combo = 1;
let wave = 1;
let keys = {};

// Managers & Entities
const starfield = new Starfield();
const particles = new ParticleManager();
const floatingText = new FloatingTextManager();
let ship = null, star = null, comets = [], debris = [];
let hud = new HUD(canvas);

// Input Setup
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'Enter') {
    if (state === 'TITLE' || state === 'GAMEOVER') startGame();
  }
  if (e.key === 'p' || e.key === 'P') {
    if (state === 'PLAYING') state = 'PAUSED';
    else if (state === 'PAUSED') state = 'PLAYING';
  }
  if (e.key === ' ') {
    if (state === 'PLAYING') ship.triggerBoost();
  }
});
window.addEventListener('keyup', e => keys[e.key] = false);

// Initialization
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (ship) ship.updateCenter(canvas.width / 2, canvas.height / 2);
  if (star) star.updateCenter(canvas.width / 2, canvas.height / 2);
}
window.addEventListener('resize', resize);
resize();

function startGame() {
  score = 0;
  combo = 1;
  wave = 1;
  ship = new Ship(canvas.width / 2, canvas.height / 2);
  star = new Star(canvas.width / 2, canvas.height / 2);
  comets = [];
  debris = [];
  state = 'PLAYING';
  srStatus.textContent = 'Game started. Use WASD/Arrows to move, Space to boost.';
}

// Spawning Logic
function spawnWave() {
  const spawnR = ship ? ship.r : canvas.width / 4;
  for (let i = 0; i < 8 + wave * 3; i++) {
    // 50% spawn near ship
    const r = (Math.random() < 0.5) ? spawnR : null;
    comets.push(new Comet(canvas.width / 2, canvas.height / 2, Math.random() < 0.1 ? 'SHIELD' : (Math.random() < 0.2 ? 'MULTIPLIER' : 'STANDARD'), r));
  }
  for (let i = 0; i < 3 + wave; i++) {
    debris.push(new Debris(canvas.width / 2, canvas.height / 2, 200 + wave * 30));
  }
  if (!star) star = new Star(canvas.width / 2, canvas.height / 2);
  star.triggerFlare();
  sound.playWaveStart();
}

// Game Loop
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === 'PLAYING') {
    // Updates
    starfield.update(dt, ship.omega);
    ship.update(dt, keys, particles);
    star.update(dt, ship, particles, floatingText, (points) => { score += points; });

    for (let i = comets.length - 1; i >= 0; i--) {
      comets[i].update(dt, ship, particles, floatingText, combo);
      if (!comets[i].alive) {
        score += comets[i].lastHarvestScore;
        comets.splice(i, 1);
      }
    }

    for (let d of debris) d.update(dt, ship, particles);
    particles.update(dt);
    floatingText.update(dt);

    if (comets.length === 0) {
      wave++;
      spawnWave();
    }

    if (ship.shields <= 0) {
      state = 'GAMEOVER';
      sound.playGameOver();
      const best = parseInt(localStorage.getItem('bestScore') || '0');
      if (score > best) {
        localStorage.setItem('bestScore', score);
      }
    }
  }

  // Render
  starfield.render(ctx, canvas.width, canvas.height, canvas.width / 2, canvas.height / 2);
  star.render(ctx, state === 'PLAYING');
  if (state === 'PLAYING') {
    for (let d of debris) d.render(ctx);
    for (let c of comets) c.render(ctx);
  }
  if (ship) ship.render(ctx);
  particles.render(ctx);
  floatingText.render(ctx);
  const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
  hud.render(state, ship, score, combo, wave, now, bestScore);

  requestAnimationFrame(loop);
}

// Start
spawnWave();
requestAnimationFrame(loop);
