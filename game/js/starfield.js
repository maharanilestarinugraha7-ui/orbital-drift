/**
 * Orbital Drift - Parallax Starfield & Space Nebulae Background
 */

import { randomRange, randomChoice } from './utils.js';

export class Starfield {
  constructor(count = 250) {
    this.stars = [];
    this.count = count;
    this.time = 0;
    this.initStars();
  }

  initStars() {
    this.stars = [];
    const colors = ['#ffffff', '#aee9ff', '#ffb6e9', '#c4f6ff', '#ffe2a8'];

    for (let i = 0; i < this.count; i++) {
      // Create stars in polar-like distribution around center
      const layer = Math.random() < 0.5 ? 1 : (Math.random() < 0.8 ? 2 : 3);
      this.stars.push({
        layer: layer, // 1: far (slow), 2: mid, 3: near (fast)
        radius: randomRange(30, 1400),
        theta: randomRange(0, Math.PI * 2),
        size: layer * 0.7 + Math.random() * 0.8,
        alpha: randomRange(0.2, 0.95),
        color: randomChoice(colors),
        pulseSpeed: randomRange(0.5, 2.5),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt, shipAngularVel = 0) {
    this.time += dt;

    // Rotate starfield subtly based on player orbital velocity (parallax effect)
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const speedMult = 0.05 * (4 - star.layer); // Farther stars rotate slower relative to ship
      star.theta += shipAngularVel * speedMult * dt;
    }
  }

  render(ctx, width, height, cx, cy) {
    // Background gradient: Deep space navy to dark violet edge
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, Math.max(width, height) * 0.85);
    bgGrad.addColorStop(0, '#0a0d24');
    bgGrad.addColorStop(0.5, '#050716');
    bgGrad.addColorStop(1, '#020309');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle cosmic nebulae glow
    this.renderNebulae(ctx, width, height, cx, cy);

    // Render stars
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];

      const x = cx + star.radius * Math.cos(star.theta);
      const y = cy + star.radius * Math.sin(star.theta);

      // Skip stars outside view bounds
      if (x < -10 || x > width + 10 || y < -10 || y > height + 10) continue;

      // Twinkle calculation
      const twinkle = Math.sin(this.time * star.pulseSpeed + star.pulsePhase) * 0.25 + 0.75;
      const currentAlpha = Math.min(1, star.alpha * twinkle);

      ctx.save();
      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = star.color;

      if (star.layer === 3) {
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 4;
      }

      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderNebulae(ctx, width, height, cx, cy) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Cyan cosmic dust cloud
    const neb1 = ctx.createRadialGradient(cx - width * 0.25, cy - height * 0.25, 20, cx - width * 0.25, cy - height * 0.25, width * 0.45);
    neb1.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    neb1.addColorStop(0.5, 'rgba(0, 150, 220, 0.02)');
    neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, width, height);

    // Magenta stellar dust cloud
    const neb2 = ctx.createRadialGradient(cx + width * 0.3, cy + height * 0.3, 30, cx + width * 0.3, cy + height * 0.3, width * 0.5);
    neb2.addColorStop(0, 'rgba(255, 0, 180, 0.04)');
    neb2.addColorStop(0.5, 'rgba(180, 0, 150, 0.015)');
    neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
