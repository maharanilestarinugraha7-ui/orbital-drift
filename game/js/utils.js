/**
 * Orbital Drift - Math & Helper Utilities
 */

// Clamp value between min and max
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Random float between min and max
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// Random integer between min and max (inclusive)
export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Random choice from array
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Distance between two points
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

// Angle from (x1, y1) to (x2, y2)
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

// Normalize angle to [-PI, PI]
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

// Shortest angular difference between two angles
export function angleDiff(a, b) {
  return normalizeAngle(a - b);
}

// Convert Polar coordinates (cx, cy, radius, theta) to Cartesian (x, y)
export function polarToCartesian(cx, cy, radius, theta) {
  return {
    x: cx + radius * Math.cos(theta),
    y: cy + radius * Math.sin(theta)
  };
}

// Convert Cartesian (x, y) relative to (cx, cy) to Polar { radius, theta }
export function cartesianToPolar(cx, cy, x, y) {
  const dx = x - cx;
  const dy = y - cy;
  return {
    radius: Math.hypot(dx, dy),
    theta: Math.atan2(dy, dx)
  };
}

// Quadratic Easing Out
export function easeOutQuad(t) {
  return t * (2 - t);
}

// Cubic Easing In-Out
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Circle to circle collision check
export function circleCollide(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const minDist = r1 + r2;
  return (dx * dx + dy * dy) <= (minDist * minDist);
}

// Format number with commas
export function formatScore(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
