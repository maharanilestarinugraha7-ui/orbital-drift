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
      const layer = Math.random() < 0.3 ? 1 : (Math.random() < 0.7 ? 2 : 3);
      this.stars.push({
        layer: layer, // 1: far, 2: mid, 3: near
        radius: randomRange(30, 1400),
        theta: randomRange(0, Math.PI * 2),
        // Distinct sizes and brightness per layer
        size: layer * 0.5 + Math.random() * 0.5,
        alpha: layer * 0.25 + Math.random() * 0.2,
        color: randomChoice(colors),
        pulseSpeed: randomRange(0.5, 2.5),
        pulsePhase: Math.random() * Math.PI * 2,
        twinkle: Math.random() < 0.2 // 20% chance to twinkle
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
      let currentAlpha = star.alpha;
      if (star.twinkle) {
        const twinkle = Math.sin(this.time * star.pulseSpeed + star.pulsePhase) * 0.5 + 0.5;
        currentAlpha *= twinkle;
      }
      currentAlpha = Math.min(1, currentAlpha);

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

    // 2-3 soft radial gradients drifting slowly
    const time = this.time * 0.1;
    const colors = [
      {r: 80, g: 0, b: 150},  // Deep Purple
      {r: 0, g: 150, b: 150}, // Teal
      {r: 50, g: 0, b: 200}   // Indigo
    ];

    colors.forEach((c, i) => {
      const angle = time + i * (Math.PI * 2 / 3);
      const x = cx + Math.cos(angle) * width * 0.2;
      const y = cy + Math.sin(angle) * height * 0.2;
      const radius = width * (0.6 + Math.sin(time) * 0.1);
      
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, 0.15)`);
      grad.addColorStop(0.5, `rgba(${c.r}, ${c.g}, ${c.b}, 0.05)`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    });

    ctx.restore();
  }
}
