/**
 * Orbital Drift - Main Game Loop & State Manager
 */

import { Starfield } from './starfield.js';
import { Ship } from './ship.js';
import { Star, Comet, Debris, ParticleManager, FloatingTextManager } from './entities.js';
import { Powerup } from './powerups.js';
import { SolarWraith } from './boss.js';
import { HUD } from './hud.js';
import { sound } from './audio.js';
import { randomRange } from './utils.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const srStatus = document.getElementById('sr-status');

// Game State
let state = 'TITLE'; // TITLE, PLAYING, PAUSED, GAMEOVER
let score = 0;
let bestScore = parseInt(localStorage.getItem('bestScore') || '0');
let combo = 1;
let lastHarvestTime = 0;
let shake = 0;
let wave = 1;
let cometSpawnTimer = 0;
let keys = {};

// Managers & Entities
const starfield = new Starfield();
const particles = new ParticleManager();
const floatingText = new FloatingTextManager();
let ship = null, star = null, comets = [], debris = [], powerups = [], shockwaves = [], boss = null;
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
  ship.invulnerableTimer = 3.0;
  star = new Star(canvas.width / 2, canvas.height / 2);
  comets = [];
  debris = [];
  powerups = [];
  shockwaves = [];
  boss = null;
  state = 'PLAYING';
  srStatus.textContent = 'Game started. Use WASD/Arrows to move, Space to boost.';
}

// Spawning Logic
function spawnWave() {
  const debrisCount = wave <= 3 ? 5 : 3 + wave;
  for (let i = 0; i < debrisCount; i++) {
    let d;
    // Ensure debris spawns at least 70px from ship orbit radius
    let attempts = 0;
    do {
      // randomize the debris orbit radius around the wave's base radius
      d = new Debris(canvas.width / 2, canvas.height / 2, 120 + Math.random() * 260);
      attempts++;
    } while (ship && Math.abs(d.r - ship.r) < 70 && attempts < 20);
    debris.push(d);
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
    let oldShields = ship.shields;
    ship.update(dt, keys, particles);
    if (ship.shields < oldShields) shake = 15;
    star.update(dt, ship, particles, floatingText, (points) => { score += points; });


      // Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
        powerups[i].update(dt, ship, particles, floatingText);
        if (!powerups[i].alive) powerups.splice(i, 1);
      }

      // Boss
      if (wave % 5 === 0 && !boss) {
        boss = new SolarWraith(canvas.width / 2, canvas.height / 2, 250);
      }
      if (boss) {
        boss.update(dt, ship, particles, floatingText);
        if (ship.isBoosting && Math.hypot(ship.x - boss.x, ship.y - boss.y) < 50) {
            boss.takeDamage(10);
            shake = 20;
        }
        if (!boss.alive) {
          boss = null;
          score += 2000;
          floatingText.add('WRAITH DOWN +2000', canvas.width / 2, 100, '#FF0000');
          for(let i=0; i<2; i++) powerups.push(new Powerup(ship.x + Math.random()*100-50, ship.y + Math.random()*100-50, 'MAGNET'));
        }
      }

      for (let i = comets.length - 1; i >= 0; i--) {
        comets[i].update(dt, ship, particles, floatingText, combo);
        if (!comets[i].alive) {
          let c = comets[i];
          score += c.lastHarvestScore;
          combo = Math.min(combo + 1, 5);
          lastHarvestTime = now;
          comets.splice(i, 1);
          shockwaves.push({x: c.x, y: c.y, r: 0, life: 0.5});
        }
      }

      // Update shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        shockwaves[i].r += 400 * dt;
        shockwaves[i].life -= dt;
        if (shockwaves[i].life <= 0) shockwaves.splice(i, 1);
      }


    if (now - lastHarvestTime > 3500 && combo > 1) {
      combo = 1;
    }

    if (comets.length < 7) {
      cometSpawnTimer -= dt;
      if (cometSpawnTimer <= 0) {
        comets.push(new Comet(canvas.width / 2, canvas.height / 2, Math.random() < 0.1 ? 'SHIELD' : (Math.random() < 0.2 ? 'MULTIPLIER' : 'STANDARD'), ship.r));
        cometSpawnTimer = randomRange(1.2, 1.8);
      }
    }

    if (debris.length === 0) {
      wave++;
      spawnWave();
    }

    for (let d of debris) d.update(dt, ship, particles);
    particles.update(dt);
    floatingText.update(dt);

    if (ship.shields <= 0) {
      state = 'GAMEOVER';
      sound.playGameOver();
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
      }
    }
  }

  // Render
  starfield.render(ctx, canvas.width, canvas.height, canvas.width / 2, canvas.height / 2);
  
  ctx.save();
  ctx.translate(Math.random()*shake-shake/2, Math.random()*shake-shake/2);
  
  star.render(ctx, state === 'PLAYING');
  if (state === 'PLAYING') {
    for (let d of debris) d.render(ctx);
    for (let c of comets) c.render(ctx);
    for (let p of powerups) p.render(ctx);
    for (let s of shockwaves) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${s.life * 2})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.stroke();
    }
    if (boss) boss.render(ctx);
  }
  if (ship) ship.render(ctx);
  particles.render(ctx);
  floatingText.render(ctx);
  
  ctx.restore();
  
  hud.render(state, ship, score, combo, wave, now, bestScore);
  
  shake *= 0.9;
  requestAnimationFrame(loop);
}

// Start
spawnWave();
requestAnimationFrame(loop);
