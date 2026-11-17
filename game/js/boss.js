/**
 * Orbital Drift - Boss: Solar Wraith
 */

import { randomRange, polarToCartesian } from './utils.js';

export class SolarWraith {
  constructor(cx, cy, radius) {
    this.cx = cx;
    this.cy = cy;
    this.r = radius + 90; // Orbit just outside the play band, on-screen
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
    if (ship) {
      const ddx = ship.x - this.x, ddy = ship.y - this.y;
      const dl = Math.hypot(ddx, ddy) || 1;
      this.shipDirX = ddx / dl;
      this.shipDirY = ddy / dl;
    }

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
    const radius = 38 + roil;

    // Outer fire glow (radial gradient aura)
    const aura = ctx.createRadialGradient(0, 0, radius * 0.5, 0, 0, radius * 2.6);
    aura.addColorStop(0, 'rgba(255,120,0,0.55)');
    aura.addColorStop(0.5, 'rgba(255,60,0,0.25)');
    aura.addColorStop(1, 'rgba(255,30,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Body - Deep red / jagged flame spikes
    ctx.fillStyle = '#ff2200';
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const flame = (i % 2 === 0 ? 14 : 2) + Math.sin(this.time * 8 + i * 1.7) * 6;
      const r = radius + flame;
      ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath();
    ctx.fill();

    // Mid glow - Orange
    ctx.fillStyle = '#ff9900';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.72, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing cracks
    ctx.strokeStyle = 'rgba(255,220,120,' + (0.5 + 0.4 * Math.sin(this.time * 9)) + ')';
    ctx.lineWidth = 2;
    for (let c = 0; c < 4; c++) {
      const a = c * Math.PI / 2 + this.time * 0.7;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * radius * 0.2, Math.sin(a) * radius * 0.2);
      ctx.lineTo(Math.cos(a + 0.4) * radius * 0.65, Math.sin(a + 0.4) * radius * 0.65);
      ctx.stroke();
    }

    // Core - White-hot
    const core = ctx.createRadialGradient(0, 0, 2, 0, 0, radius * 0.45);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.6, '#ffe9b0');
    core.addColorStop(1, 'rgba(255,153,0,0.0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Ember eyes that track the ship
    const ex = this.shipDirX || 0, ey = this.shipDirY || -1;
    ctx.fillStyle = '#fff6c0';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-9 + ex * 3, -11 + ey * 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(9 + ex * 3, -11 + ey * 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

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
