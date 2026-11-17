/**
 * Orbital Drift - Entities: Central Star, Comets, Debris, Flares, Particles & Popups
 */

import { randomRange, randomInt, randomChoice, polarToCartesian, circleCollide, normalizeAngle } from './utils.js';
import { sound } from './audio.js';

// ==========================================
// 1. Central Star & Solar Flares
// ==========================================
export class Star {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;
    this.radius = 55;
    this.hotZoneRadius = this.radius * 1.8;
    this.time = 0;

    // Solar flare state
    this.flareState = 'IDLE'; // IDLE, CHARGING, ERUPTING
    this.flareAngle = 0;
    this.flareWidth = Math.PI / 4; // Angle spread (~45 deg)
    this.flareReach = 480;         // Radial distance flare extends
    this.flareTimer = 0;
    this.flareChargeTime = 2.0;
    this.flareActiveTime = 1.8;
  }

  updateCenter(cx, cy) {
    this.cx = cx;
    this.cy = cy;
  }

  triggerFlare(angleOverride = null) {
    if (this.flareState !== 'IDLE') return;
    this.flareState = 'CHARGING';
    this.flareTimer = this.flareChargeTime;
    this.flareAngle = angleOverride !== null ? angleOverride : randomRange(-Math.PI, Math.PI);
    sound.playFlare();
  }

  update(dt, ship, particleManager, floatingTextManager, scoreCallback) {
    this.time += dt;

    // Hot zone check
    if (ship && ship.r < this.hotZoneRadius) {
        if (ship.isBoosting) {
            // Trigger Corona Dive if not already triggered (needs a cooldown/state)
            if (ship.heatDamageTimer <= 0) { // Using this as a cooldown for now
               if (scoreCallback) scoreCallback(500);
               if (floatingTextManager) floatingTextManager.addText('CORONA DIVE +500', ship.x, ship.y, '#ffd700');
               
               // Golden particles
               if (particleManager) {
                   for (let i = 0; i < 30; i++) {
                       const ang = Math.random() * Math.PI * 2;
                       particleManager.addParticle({
                           x: ship.x, y: ship.y,
                           vx: Math.cos(ang) * 200, vy: Math.sin(ang) * 200,
                           color: '#ffd700', life: 0.5, maxLife: 0.5, size: 4, glow: true
                       });
                   }
               }
               ship.heatDamageTimer = 2.0; // Cooldown
            }
        } else {
            // Damage shields slowly
            if (ship.heatDamageTimer <= 0) {
                ship.takeDamage(1);
                ship.heatDamageTimer = 1.0; // Damage interval
                // TODO: Trigger vignette
            }
        }
    }
    
    // Flare State Machine
    if (this.flareState === 'CHARGING') {
      this.flareTimer -= dt;

      // Spawn charging ember particles along flare sector
      if (Math.random() < 0.6 && particleManager) {
        const dist = randomRange(this.radius, this.flareReach * 0.5);
        const ang = this.flareAngle + randomRange(-this.flareWidth / 2, this.flareWidth / 2);
        const pos = polarToCartesian(this.cx, this.cy, dist, ang);

        particleManager.addParticle({
          x: pos.x,
          y: pos.y,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() - 0.5) * 30,
          color: '#ff6600',
          life: 0.3,
          maxLife: 0.3,
          size: randomRange(2, 5),
          glow: true
        });
      }

      if (this.flareTimer <= 0) {
        this.flareState = 'ERUPTING';
        this.flareTimer = this.flareActiveTime;
      }
    } else if (this.flareState === 'ERUPTING') {
      this.flareTimer -= dt;

      // Flare Collision Check with Ship
      if (ship) {
        const dAngle = Math.abs(normalizeAngle(ship.theta - this.flareAngle));
        if (dAngle <= this.flareWidth / 2 + 0.1 && ship.r <= this.flareReach) {
          ship.takeDamage(1);
        }
      }

      // Erupting plasma particles
      if (particleManager) {
        for (let i = 0; i < 3; i++) {
          const dist = randomRange(this.radius, this.flareReach);
          const ang = this.flareAngle + randomRange(-this.flareWidth / 2, this.flareWidth / 2);
          const pos = polarToCartesian(this.cx, this.cy, dist, ang);

          particleManager.addParticle({
            x: pos.x,
            y: pos.y,
            vx: Math.cos(ang) * randomRange(100, 300),
            vy: Math.sin(ang) * randomRange(100, 300),
            color: randomChoice(['#ffffff', '#ffee00', '#ff5500', '#ff0033']),
            life: randomRange(0.2, 0.5),
            maxLife: 0.5,
            size: randomRange(3, 8),
            glow: true
          });
        }
      }

      if (this.flareTimer <= 0) {
        this.flareState = 'IDLE';
      }
    }
  }

  render(ctx, renderFlare = true) {
    ctx.save();

    // Hot Zone Ring (Heat Shimmer)
    const shimmer = Math.sin(this.time * 5) * 5 + 5;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 100, 0, ${0.2 + Math.sin(this.time * 10) * 0.1})`;
    ctx.lineWidth = 4 + shimmer * 0.5;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, this.hotZoneRadius + shimmer, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 1. Solar Flare Render
    if (renderFlare && (this.flareState === 'CHARGING' || this.flareState === 'ERUPTING')) {
      if (this.flareState === 'CHARGING') {
        // Telegraphed warning sector arc
        const chargeRatio = 1 - (this.flareTimer / this.flareChargeTime);
        ctx.save();
        ctx.fillStyle = `rgba(255, 80, 0, ${0.1 + chargeRatio * 0.25})`;
        ctx.strokeStyle = `rgba(255, 120, 0, ${0.4 + Math.sin(this.time * 20) * 0.3})`;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.arc(this.cx, this.cy, this.flareReach, this.flareAngle - this.flareWidth / 2, this.flareAngle + this.flareWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (this.flareState === 'ERUPTING') {
        // Full erupting plasma beam
        const activeRatio = this.flareTimer / this.flareActiveTime;
        const alpha = Math.sin(activeRatio * Math.PI);

        ctx.save();
        ctx.fillStyle = `rgba(255, 100, 0, ${0.4 * alpha})`;
        ctx.strokeStyle = `rgba(255, 220, 100, ${0.8 * alpha})`;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 30;

        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.arc(this.cx, this.cy, this.flareReach, this.flareAngle - this.flareWidth / 2, this.flareAngle + this.flareWidth / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 2. Multi-layered Central Star Surface & Corona
    const pulse = Math.sin(this.time * 1.5) * 5;
    const currentRadius = this.radius + pulse;

    // Outer Corona Glow (Layered)
    for (let i = 1; i <= 3; i++) {
      const grad = ctx.createRadialGradient(this.cx, this.cy, currentRadius, this.cx, this.cy, currentRadius * (1.5 + i * 0.5));
      grad.addColorStop(0, `rgba(255, ${200 - i * 30}, 50, ${0.2 / i})`);
      grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, currentRadius * (1.5 + i * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }

    // Hot Core
    ctx.shadowColor = '#ffe259';
    ctx.shadowBlur = 35;
    const coreGrad = ctx.createRadialGradient(this.cx - 10, this.cy - 10, 5, this.cx, this.cy, currentRadius);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#fff2a1');
    coreGrad.addColorStop(0.8, '#ff8c00');
    coreGrad.addColorStop(1, '#e63900');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================
// 2. Comets (Energy, Multiplier, Shield)
// ==========================================
export class Comet {
  constructor(cx, cy, type = 'STANDARD', preferredR = null) {
    this.cx = cx;
    this.cy = cy;
    this.type = type; // STANDARD (Magenta), MULTIPLIER (Gold), SHIELD (Cyan)

    // Orbital / Trajectory parameters
    this.r = preferredR ? preferredR + randomRange(-50, 50) : randomRange(110, 480);
    this.theta = randomRange(-Math.PI, Math.PI);
    this.omega = randomRange(0.6, 1.8) * (Math.random() < 0.5 ? 1 : -1);
    this.radialSpeed = randomRange(-20, 20);

    this.radius = type === 'MULTIPLIER' ? 12 : (type === 'SHIELD' ? 14 : 11);
    if (Math.random() < 0.2) { // Large comet
        this.radius *= 1.5;
        this.isLarge = true;
    } else {
        this.isLarge = false;
    }
    this.harvestRadius = this.radius + 28; // Distance ship needs to get close

    this.alive = true;
    this.time = 0;
    this.tail = [];
    this.lastHarvestScore = 0;

    // Visual attributes
    if (type === 'MULTIPLIER') {
      this.color = '#ffd700';
      this.glowColor = '#ffaa00';
      this.scoreValue = 300;
    } else if (type === 'SHIELD') {
      this.color = '#00ffff';
      this.glowColor = '#00aaff';
      this.scoreValue = 200;
    } else {
      this.color = '#ff00a0';
      this.glowColor = '#ff0055';
      this.scoreValue = 100;
    }

    this.x = cx + this.r * Math.cos(this.theta);
    this.y = cy + this.r * Math.sin(this.theta);
  }

  update(dt, ship, particleManager, floatingTextManager, comboMultiplier) {
    if (!this.alive) return;

    this.time += dt;
    this.theta += this.omega * dt;
    this.r += this.radialSpeed * dt;

    // Keep within valid altitude bounds or bounce
    if (this.r < 100 || this.r > 520) {
      this.radialSpeed *= -1;
    }

    this.x = this.cx + this.r * Math.cos(this.theta);
    this.y = this.cy + this.r * Math.sin(this.theta);

    // Trail creation
    this.tail.unshift({ x: this.x, y: this.y, age: 0 });
    if (this.tail.length > 18) this.tail.pop();
    for (let p of this.tail) p.age += dt;

    // Tiny ice particles
    if (particleManager && Math.random() < 0.2) {
      particleManager.addParticle({
        x: this.x,
        y: this.y,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        color: '#ffffff',
        life: 0.2,
        maxLife: 0.2,
        size: 1,
        glow: true
      });
    }

    // Check Harvest Collision with Ship
    const magnetRadius = ship.isBoosting ? this.harvestRadius + 35 : this.harvestRadius;
    const dToShip = Math.hypot(ship.x - this.x, ship.y - this.y);

    if (dToShip <= magnetRadius + ship.radius) {
      this.harvest(ship, particleManager, floatingTextManager, comboMultiplier);
    }
  }

  harvest(ship, particleManager, floatingTextManager, comboMultiplier) {
    if (!this.isLarge && ship.isBoosting) {
      // SHATTER
      this.alive = false;
      this.lastHarvestScore = 150 * comboMultiplier;
      sound.playHarvest(comboMultiplier);

      if (particleManager) {
        for (let i = 0; i < 30; i++) {
          const ang = Math.random() * Math.PI * 2;
          particleManager.addParticle({
            x: this.x, y: this.y,
            vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300,
            color: '#ffffff', life: 0.4, maxLife: 0.4, size: 2, glow: true
          });
        }
      }
      
      if (floatingTextManager) {
        floatingTextManager.addText(`SHATTER +${this.lastHarvestScore}`, this.x, this.y, '#ffffff');
      }
      return;
    }

    // Normal harvest
    this.alive = false;
    this.lastHarvestScore = this.scoreValue * comboMultiplier;

    // Audio chime
    sound.playHarvest(comboMultiplier);

    // Particle Shatter explosion
    if (particleManager) {
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = randomRange(80, 260);
        particleManager.addParticle({
          x: this.x,
          y: this.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: this.color,
          life: randomRange(0.3, 0.7),
          maxLife: 0.7,
          size: randomRange(2, 6),
          glow: true
        });
      }
    }

    // Floating Score Text
    if (floatingTextManager) {
      let msg = `+${this.lastHarvestScore}`;
      if (this.type === 'MULTIPLIER') msg += ' COMBO UP!';
      if (this.type === 'SHIELD') {
        const repaired = ship.repairShield();
        if (repaired) msg += ' SHIELD REPAIRED!';
      }
      floatingTextManager.addText(msg, this.x, this.y, this.color);
    }
  }

  render(ctx) {
    if (!this.alive) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.time * 3); // Rotating

    // Faceted Crystal Polygon
    ctx.strokeStyle = this.color;
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    // Simplified faceted shape
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius, 0);
    ctx.lineTo(0, this.radius);
    ctx.lineTo(-this.radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shimmering highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -this.radius);
    ctx.lineTo(this.radius * 0.5, 0);
    ctx.lineTo(0, this.radius * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Comet Tail (Gradient Fade)
    if (this.tail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.tail.length - 1; i++) {
        const p1 = this.tail[i];
        const p2 = this.tail[i + 1];
        const ratio = 1 - i / this.tail.length;
        
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = ratio * 0.5;
        ctx.lineWidth = this.radius * 0.5 * ratio;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

// ==========================================
// 3. Debris Fields (Hazards)
// ==========================================
export class Debris {
  constructor(cx, cy, rRing = 300) {
    this.cx = cx;
    this.cy = cy;
    this.r = rRing + randomRange(-25, 25);
    this.theta = randomRange(-Math.PI, Math.PI);
    this.omega = randomRange(0.3, 0.9) * (Math.random() < 0.5 ? 1 : -1);

    this.radius = randomRange(12, 22);
    this.rot = Math.random() * Math.PI * 2;
    this.rotSpeed = randomRange(-2, 2);

    // Jagged polygon vertices
    this.numVertices = randomInt(5, 8);
    this.vertices = [];
    for (let i = 0; i < this.numVertices; i++) {
      const a = (i / this.numVertices) * Math.PI * 2;
      const dist = this.radius * randomRange(0.65, 1.15);
      this.vertices.push({ x: Math.cos(a) * dist, y: Math.sin(a) * dist });
    }

    this.x = cx + this.r * Math.cos(this.theta);
    this.y = cy + this.r * Math.sin(this.theta);
  }

  update(dt, ship, particleManager) {
    this.theta += this.omega * dt;
    this.rot += this.rotSpeed * dt;

    this.x = this.cx + this.r * Math.cos(this.theta);
    this.y = this.cy + this.r * Math.sin(this.theta);

    // Collision check with ship
    if (ship && circleCollide(this.x, this.y, this.radius, ship.x, ship.y, ship.radius)) {
      if (ship.takeDamage(1)) {
        // Red impact explosion particles
        if (particleManager) {
          for (let i = 0; i < 15; i++) {
            const ang = Math.random() * Math.PI * 2;
            particleManager.addParticle({
              x: this.x,
              y: this.y,
              vx: Math.cos(ang) * randomRange(60, 200),
              vy: Math.sin(ang) * randomRange(60, 200),
              color: '#ff2200',
              life: 0.4,
              maxLife: 0.4,
              size: randomRange(2, 5),
              glow: true
            });
          }
        }
      }
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    ctx.strokeStyle = '#ff4422';
    ctx.fillStyle = '#14080a';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff2200';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

// ==========================================
// 4. Particle System Manager
// ==========================================
export class ParticleManager {
  constructor() {
    this.particles = [];
  }

  addParticle(p) {
    this.particles.push(p);
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx) {
    ctx.save();
    for (let p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8 * alpha;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ==========================================
// 5. Floating Text Popups Manager
// ==========================================
export class FloatingTextManager {
  constructor() {
    this.texts = [];
  }

  addText(str, x, y, color = '#00ffff') {
    this.texts.push({
      str: str,
      x: x,
      y: y,
      color: color,
      life: 1.1,
      maxLife: 1.1
    });
  }

  update(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y -= 35 * dt; // Drift upward
    }
  }

  render(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "Segoe UI", system-ui, sans-serif'; // Larger font

    for (let t of this.texts) {
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 20; // More glow
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(t.str, t.x, t.y);
    }
    ctx.restore();
  }
}
