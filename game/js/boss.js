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
    this.time = 0;
  }

  update(dt, ship, particles, floatingText) {
    this.timer -= dt;
    this.time += dt;
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

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Roiling animation
    const roil = Math.sin(this.time * 5) * 5;
    const radius = 35 + roil;
    
    // Core - White-hot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Mid glow - Orange
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    
    // Body - Deep red / jagged
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    for (let i = 0; i < 32; i++) {
        const ang = (i / 32) * Math.PI * 2;
        const r = radius + (Math.sin(this.time * 10 + i) * 5); // Jagged edge
        ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, -10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    for (let p of this.projectiles) {
      // Trail
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.2, p.y - p.vy * 0.2);
      ctx.stroke();

      // Projectile
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
