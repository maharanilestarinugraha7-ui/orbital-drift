/**
 * Orbital Drift - Player Ship & Orbital Physics
 */

import { clamp, polarToCartesian, normalizeAngle, randomRange } from './utils.js';
import { sound } from './audio.js';

export class Ship {
  constructor(cx, cy) {
    this.cx = cx;
    this.cy = cy;

    // Radius / Altitude boundaries
    this.minRadius = 85;   // Danger zone near star surface
    this.maxRadius = 550;  // Outer space limit

    this.reset();
  }

  reset() {
    this.r = 220;                    // Orbital altitude
    this.theta = -Math.PI / 2;       // Start at top of orbit
    this.vr = 0;                     // Radial velocity (inward/outward speed)
    this.omega = 1.0;                // Angular velocity (radians/sec)

    this.radius = 14;                // Collision radius
    this.shields = 3;                // Lives / Shields
    this.maxShields = 3;
    this.energy = 100;               // Energy bar
    this.maxEnergy = 100;

    // Boost & Invulnerability status
    this.boostCooldown = 0;          // Seconds until boost ready
    this.maxBoostCooldown = 2.5;
    this.boostTimer = 0;             // Active boost duration
    this.isBoosting = false;

    this.invulnerableTimer = 0;      // Invincible after hit or during boost
    this.hitFlashTimer = 0;          // Screen/ship flash on damage
    this.heatDamageTimer = 0;        // Damage over time in heat zone

    // Trail particles / ribbon points
    this.trail = [];
    this.maxTrailLength = 35;

    // Computed Cartesian coordinates
    this.x = this.cx + this.r * Math.cos(this.theta);
    this.y = this.cy + this.r * Math.sin(this.theta);
    this.heading = this.theta + Math.PI / 2; // Direction ship is facing (tangent to orbit)
  }

  updateCenter(cx, cy) {
    this.cx = cx;
    this.cy = cy;
  }

  triggerBoost() {
    if (this.boostCooldown <= 0 && this.energy >= 20) {
      this.isBoosting = true;
      this.boostTimer = 0.45;
      this.boostCooldown = this.maxBoostCooldown;
      this.energy = Math.max(0, this.energy - 20);
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.5);
      sound.playBoost();
      return true;
    }
    return false;
  }

  takeDamage(amount = 1) {
    if (this.invulnerableTimer > 0) return false;

    this.shields -= amount;
    this.invulnerableTimer = 1.5; // 1.5s invincibility frames
    this.hitFlashTimer = 0.3;
    sound.playHit();
    return true;
  }

  repairShield() {
    if (this.shields < this.maxShields) {
      this.shields++;
      return true;
    }
    return false;
  }

  update(dt, keys, particleManager) {
    // 1. Boost timers update
    if (this.boostCooldown > 0) {
      this.boostCooldown = Math.max(0, this.boostCooldown - dt);
    }

    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer = Math.max(0, this.hitFlashTimer - dt);
    }
    
    if (this.heatDamageTimer > 0) {
      this.heatDamageTimer = Math.max(0, this.heatDamageTimer - dt);
    }

    // Energy slow auto-recharge
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 8 * dt);
    }

    // 2. Physics & Controls
    const boostMult = this.isBoosting ? 2.4 : 1.0;

    // Radial Thrust (W/S or Up/Down)
    let radialAccel = 0;
    if (keys.ArrowUp || keys.w || keys.W) {
      radialAccel -= 450 * boostMult; // Pull inward
    }
    if (keys.ArrowDown || keys.s || keys.S) {
      radialAccel += 450 * boostMult; // Push outward
    }

    // Apply Radial Friction & Integration
    this.vr += radialAccel * dt;
    this.vr *= Math.pow(0.04, dt); // Damping / Drag
    this.r += this.vr * dt;

    // Clamp altitude boundaries
    if (this.r < this.minRadius) {
      this.r = this.minRadius;
      this.vr = Math.max(0, this.vr); // bounce out slightly
    } else if (this.r > this.maxRadius) {
      this.r = this.maxRadius;
      this.vr = Math.min(0, this.vr); // bounce in
    }

    // Angular Acceleration (A/D or Left/Right)
    // Keplerian-inspired base orbital speed: closer to star = naturally faster orbit
    const baseKeplerOmega = 150 / Math.sqrt(this.r);
    let angularAccel = 0;

    if (keys.ArrowLeft || keys.a || keys.A) {
      angularAccel -= 4.0 * boostMult; // Counter-clockwise boost
    }
    if (keys.ArrowRight || keys.d || keys.D) {
      angularAccel += 4.0 * boostMult; // Clockwise boost
    }

    // Apply natural orbital drift + user angular control
    const targetOmega = baseKeplerOmega * (this.omega >= 0 ? 1 : -1) + angularAccel;
    this.omega = clamp(this.omega + (targetOmega - this.omega) * dt * 4.5, -4.5, 4.5);

    // Apply angular position update
    this.theta += this.omega * dt;
    this.theta = normalizeAngle(this.theta);

    // Calculate Cartesian coordinates
    const pos = polarToCartesian(this.cx, this.cy, this.r, this.theta);
    this.x = pos.x;
    this.y = pos.y;

    // Ship heading direction (combination of orbital tangent + radial motion)
    const tangentAngle = this.theta + (this.omega >= 0 ? Math.PI / 2 : -Math.PI / 2);
    const radialAngle = Math.atan2(this.vr, this.r * this.omega);
    this.heading = tangentAngle + radialAngle * 0.35;

    // 3. Update Trail ribbon & spawn particles
    this.trail.unshift({
      x: this.x,
      y: this.y,
      age: 0,
      size: this.isBoosting ? 16 : 10
    });

    if (this.trail.length > (this.isBoosting ? 50 : this.maxTrailLength)) {
      this.trail.pop();
    }

    // Age existing trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].age += dt;
    }

    // Spawn thruster particle effects
    if (particleManager && (radialAccel !== 0 || angularAccel !== 0 || this.isBoosting)) {
      const exhaustAngle = this.heading + Math.PI + (Math.random() - 0.5) * 0.4;
      const speed = this.isBoosting ? 260 : 120;
      particleManager.addParticle({
        x: this.x - Math.cos(this.heading) * 12,
        y: this.y - Math.sin(this.heading) * 12,
        vx: Math.cos(exhaustAngle) * speed + (Math.random() - 0.5) * 30,
        vy: Math.sin(exhaustAngle) * speed + (Math.random() - 0.5) * 30,
        color: this.isBoosting ? '#00ffff' : '#00e5ff',
        life: this.isBoosting ? 0.35 : 0.2,
        maxLife: this.isBoosting ? 0.35 : 0.2,
        size: this.isBoosting ? randomRange(3, 7) : randomRange(2, 4),
        glow: true
      });
    }
  }

  render(ctx) {
    ctx.save();

    // 1. Boost flame plume
    if (this.isBoosting) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.heading);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-60, 5);
      ctx.lineTo(-60, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Draw glowing neon cyan trail ribbon
    // ... existing trail code
    if (this.trail.length > 1) {
      ctx.save();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const p1 = this.trail[i];
        const p2 = this.trail[i + 1];
        const ratio = 1 - i / this.trail.length;

        ctx.strokeStyle = `rgba(0, 240, 255, ${ratio * 0.75})`;
        ctx.lineWidth = p1.size * ratio;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = this.isBoosting ? 15 * ratio : 8 * ratio;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Position context at ship
    ctx.translate(this.x, this.y);
    ctx.rotate(this.heading);

    // Damage flash tint
    if (this.hitFlashTimer > 0) {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 20;
    } else {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
    }

    // 4. Draw futuristic neon vector ship
    ctx.strokeStyle = this.hitFlashTimer > 0 ? '#ff4477' : '#00ffff';
    ctx.fillStyle = '#061a29';
    ctx.lineWidth = 2.5;

    // Hull
    ctx.beginPath();
    ctx.moveTo(16, 0);                 // Ship Nose
    ctx.lineTo(-12, -11);              // Left Wingtip
    ctx.lineTo(-7, 0);                 // Rear engine notch
    ctx.lineTo(-12, 11);               // Right Wingtip
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cockpit glint
    ctx.fillStyle = this.isBoosting ? '#ffffff' : '#99f3ff';
    ctx.beginPath();
    ctx.ellipse(2, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine glow (brightens with thrust/boost)
    const glow = 2.5 + (this.isBoosting ? 4 : 0);
    ctx.fillStyle = this.isBoosting ? '#00ffff' : '#ff9900';
    ctx.beginPath();
    ctx.arc(-7, 0, glow, 0, Math.PI * 2);
    ctx.fill();

    // 5. Hexagonal shield ring flash when hit
    if (this.hitFlashTimer > 0) {
      ctx.strokeStyle = '#ff0055';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const x = Math.cos(ang) * (this.radius + 6);
        const y = Math.sin(ang) * (this.radius + 6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (this.invulnerableTimer > 0 || this.isBoosting) {
        // ... existing shield code
        const shieldAlpha = this.isBoosting ? 0.6 : (Math.sin(Date.now() * 0.02) * 0.2 + 0.4);
        ctx.strokeStyle = this.isBoosting ? 'rgba(0, 255, 255, ' + shieldAlpha + ')' : 'rgba(0, 180, 255, ' + shieldAlpha + ')';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
  }
}
