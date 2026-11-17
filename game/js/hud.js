/**
 * Orbital Drift - HUD & UI Rendering
 */

import { formatScore } from './utils.js';

export class HUD {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.lastWave = 1;
    this.waveFlashTimer = 0;
  }

  render(gameState, ship, score, combo, wave, time, bestScore) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    if (!ship) ship = { maxShields: 3, shields: 0, energy: 0, maxEnergy: 100 };

    ctx.save();

    if (gameState === 'PLAYING' || gameState === 'PAUSED') {
      // 1. Top HUD: Score & Wave
      ctx.fillStyle = '#e2f1ff';
      ctx.font = '20px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${formatScore(score)}`, 20, 35);
      ctx.textAlign = 'right';
      ctx.fillText(`WAVE: ${wave}`, width - 20, 35);

        const pulse = 1 + Math.sin(time / 100) * 0.1;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold ${24 * pulse}px "Segoe UI", sans-serif`;
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 10;
        ctx.fillText(`${combo}x COMBO`, width / 2, 40);
        ctx.shadowBlur = 0;

      // Wave Flash
      if (wave > this.lastWave) {
        this.waveFlashTimer = 1.0;
        this.lastWave = wave;
      }
      if (this.waveFlashTimer > 0) {
        this.waveFlashTimer -= 0.01;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(0, 255, 255, ${this.waveFlashTimer})`;
        ctx.font = 'bold 40px "Segoe UI", sans-serif';
        ctx.fillText(`WAVE ${wave}`, width / 2, height / 2);
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
    }

    // 4. State Overlays
    if (gameState === 'TITLE') {
      this.renderTitle(ctx, width, height, time);
    } else if (gameState === 'GAMEOVER') {
      this.renderGameOver(ctx, width, height, time, score, bestScore, wave);
    } else if (gameState === 'PAUSED') {
      this.renderOverlay(ctx, width, height, 'PAUSED', 'Press P to Resume');
    }

    ctx.restore();
  }

  renderTitle(ctx, width, height, time) {
    ctx.fillStyle = 'rgba(3, 5, 13, 0.8)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    
    // Glowing Title
    const grad = ctx.createLinearGradient(0, height / 2 - 100, 0, height / 2 + 100);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#ff00ff');
    
    ctx.fillStyle = grad;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.font = 'bold 80px "Segoe UI", sans-serif';
    ctx.fillText('ORBITAL DRIFT', width / 2, height / 2 - 50);

    // Controls Hint
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aee9ff';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText('Arrows/WASD: altitude + thrust · Space: boost · P: pause', width / 2, height / 2 + 20);

    // Pulsing Enter
    const pulse = Math.sin(time / 300) * 0.5 + 0.5;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('Press ENTER to Launch', width / 2, height / 2 + 80);
  }

  renderGameOver(ctx, width, height, time, score, bestScore, wave) {
    ctx.save();
    
    // Glass panel
    ctx.fillStyle = 'rgba(10, 10, 20, 0.8)';
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    
    const panelWidth = 500;
    const panelHeight = 350;
    const x = (width - panelWidth) / 2;
    const y = (height - panelHeight) / 2;
    
    ctx.fillRect(x, y, panelWidth, panelHeight);
    ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    ctx.textAlign = 'center';

    // MISSION FAILED - Red neon glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.fillText('MISSION FAILED', width / 2, y + 60);
    ctx.shadowBlur = 0;

    // Final Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(`SCORE: ${formatScore(score)}`, width / 2, y + 130);

    // Best Score
    ctx.fillStyle = '#ffd700';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText(`BEST: ${formatScore(bestScore)}`, width / 2, y + 170);

    // Waves
    ctx.fillStyle = '#aee9ff';
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.fillText(`Waves survived: ${wave - 1}`, width / 2, y + 200);

    // Pulsing Enter
    const pulse = Math.sin(time / 300) * 0.5 + 0.5;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('Press ENTER to Restart', width / 2, y + 280);
    
    ctx.restore();
  }

  renderOverlay(ctx, width, height, title, subtitle) {
    ctx.save();
    
    // Glass panel
    ctx.fillStyle = 'rgba(10, 10, 20, 0.6)';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    
    const panelWidth = 400;
    const panelHeight = 200;
    const x = (width - panelWidth) / 2;
    const y = (height - panelHeight) / 2;
    
    ctx.fillRect(x, y, panelWidth, panelHeight);
    ctx.strokeRect(x, y, panelWidth, panelHeight);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2f1ff';
    ctx.font = 'bold 48px "Segoe UI", sans-serif';
    ctx.fillText(title, width / 2, height / 2 - 20);
    
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aee9ff';
    ctx.fillText(subtitle, width / 2, height / 2 + 20);
    
    ctx.restore();
  }
}
