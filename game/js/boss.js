/**
 * Orbital Drift - Boss: Solar Wraith
 */

import { randomRange, polarToCartesian } from './utils.js';

export class SolarWraith {
  constructor(cx, cy, radius) {
    this.cx = cx;
    this.cy = cy;
    this.r = radius + 200; // Orbit outside ship
    this.theta = 0;
    this.omega = 0.5;
    this.health = 50;
    this.maxHealth = 50;
    this.timer = 25; // 25s retreat timer
    this.alive = true;
    this.projectiles = [];
  }

  update(dt, ship, particles, floatingText) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.alive = false;
      return;
    }

    this.theta += this.omega * dt;
    this.x = this.cx + this.r * Math.cos(this.theta);
    this.y = this.cy + this.r * Math.sin(this.theta);

    // Projectile launching
    if (Math.random() < 0.02) {
      this.launchProjectile(ship);
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      let p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Homing
      const dx = ship.x - p.x;
      const dy = ship.y - p.y;
      const dist = Math.hypot(dx, dy);
      p.vx += (dx / dist) * 50 * dt;
      p.vy += (dy / dist) * 50 * dt;

      // Hit ship
      if (dist < 20) {
        ship.takeDamage(1);
        this.projectiles.splice(i, 1);
        continue;
      }
      
      // Lifetime
      p.life -= dt;
      if (p.life <= 0) this.projectiles.splice(i, 1);
    }
  }

  launchProjectile(ship) {
    this.projectiles.push({
      x: this.x,
      y: this.y,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50,
      life: 5
    });
  }

  takeDamage(amount, particleManager) {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
      // Large explosion
      if (particleManager) {
        for (let i = 0; i < 100; i++) {
          const ang = Math.random() * Math.PI * 2;
          particleManager.addParticle({
            x: this.x, y: this.y,
            vx: Math.cos(ang) * 500, vy: Math.sin(ang) * 500,
            color: '#ffaa00', life: 1.0, maxLife: 1.0, size: 8, glow: true
          });
        }
      }
    }
  }

  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Molten entity visuals
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    for (let p of this.projectiles) {
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
