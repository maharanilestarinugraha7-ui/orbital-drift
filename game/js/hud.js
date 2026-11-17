/**
 * Orbital Drift - HUD & UI Rendering
 */

import { formatScore } from './utils.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render(gameState, ship, score, combo, wave) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.save();

    // 1. Top HUD: Score & Wave
    ctx.fillStyle = '#e2f1ff';
    ctx.font = '20px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${formatScore(score)}`, 20, 35);
    ctx.textAlign = 'right';
    ctx.fillText(`WAVE: ${wave}`, width - 20, 35);

    if (combo > 1) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`${combo}x COMBO!`, width / 2, 40);
    }

    // 2. Bottom Left: Shield Indicator
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00ffff';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('SHIELDS', 20, height - 40);

    for (let i = 0; i < ship.maxShields; i++) {
      ctx.strokeStyle = '#00ffff';
      ctx.fillStyle = i < ship.shields ? '#00ffff' : 'transparent';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(20 + i * 20, height - 30, 15, 10);
      ctx.stroke();
      if (i < ship.shields) ctx.fill();
    }

    // 3. Bottom Right: Energy Bar
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff9900';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText('ENERGY', width - 20, height - 40);
    
    ctx.strokeStyle = '#ff9900';
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 120, height - 30, 100, 10);
    ctx.fillStyle = '#ff9900';
    ctx.fillRect(width - 120, height - 30, (ship.energy / ship.maxEnergy) * 100, 10);

    // 4. State Overlays
    if (gameState === 'TITLE') {
      this.renderOverlay(ctx, width, height, 'ORBITAL DRIFT', 'Press ENTER to Launch');
    } else if (gameState === 'GAMEOVER') {
      this.renderOverlay(ctx, width, height, 'MISSION FAILED', 'Press ENTER to Restart');
    } else if (gameState === 'PAUSED') {
      this.renderOverlay(ctx, width, height, 'PAUSED', 'Press P to Resume');
    }

    ctx.restore();
  }

  renderOverlay(ctx, width, height, title, subtitle) {
    ctx.fillStyle = 'rgba(3, 5, 13, 0.7)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2f1ff';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillText(title, width / 2, height / 2 - 20);

    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aee9ff';
    ctx.fillText(subtitle, width / 2, height / 2 + 20);
  }
}
