/**
 * Orbital Drift - Powerups
 */

export class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // MAGNET, SHIELD, TIME_SLOW
    this.alive = true;
    this.timer = 10; // Lifetime
    this.angle = 0;
  }

  update(dt, ship, particles, floatingText) {
    this.timer -= dt;
    if (this.timer <= 0) this.alive = false;
    this.angle += dt * 5;

    const dx = ship.x - this.x;
    const dy = ship.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 50) {
      this.applyEffect(ship, floatingText);
      this.alive = false;
    } else if (dist < 150) {
      // Fly towards ship
      const speed = 200 * dt;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
    }
  }

  applyEffect(ship, floatingText) {
    switch (this.type) {
      case 'MAGNET':
        ship.activateMagnet(8);
        floatingText.add('MAGNET!', this.x, this.y, '#00FFFF');
        break;
      case 'SHIELD':
        ship.restoreShield();
        floatingText.add('SHIELD +1', this.x, this.y, '#00FF00');
        break;
      case 'TIME_SLOW':
        ship.activateTimeSlow(6);
        floatingText.add('TIME-SLOW!', this.x, this.y, '#FF00FF');
        break;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.shadowBlur = 10;
    
    ctx.strokeStyle = this.type === 'MAGNET' ? '#00FFFF' : (this.type === 'SHIELD' ? '#00FF00' : '#FF00FF');
    ctx.shadowColor = ctx.strokeStyle;
    ctx.lineWidth = 2;

    ctx.beginPath();
    if (this.type === 'MAGNET') {
      ctx.arc(0, 0, 8, 0, Math.PI);
    } else if (this.type === 'SHIELD') {
      ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
      ctx.moveTo(0, -6); ctx.lineTo(0, 6);
    } else {
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.moveTo(0, 0); ctx.lineTo(0, -5);
    }
    ctx.stroke();
    ctx.restore();
  }
}
