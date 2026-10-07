import * as THREE from 'three';

// Trainer defaults, not claims about the exact rules of any commercial game.
export const DETECTION_SETTINGS = Object.freeze({ fullAngle: 45, dodgeAngle: 100 });
export const EFFECT_SETTINGS = Object.freeze({
  'FULL FLASH': { opacity: 1, hold: 0.35, fade: 1.15 },
  'PARTIALLY FLASHED': { opacity: 0.55, hold: 0.1, fade: 0.5 },
  DODGED: { opacity: 0, hold: 0, fade: 0 },
});

export function classifyAngle(angle, settings = DETECTION_SETTINGS) {
  if (angle >= settings.dodgeAngle) return 'DODGED';
  if (angle <= settings.fullAngle) return 'FULL FLASH';
  return 'PARTIALLY FLASHED';
}

export function inspectFlash(camera, position, obstacles) {
  camera.updateMatrixWorld(true);
  const origin = camera.getWorldPosition(new THREE.Vector3());
  const towardFlash = position.clone().sub(origin);
  const distance = towardFlash.length();
  towardFlash.normalize();
  const forward = camera.getWorldDirection(new THREE.Vector3());
  const angle = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(forward.dot(towardFlash), -1, 1)));
  const ray = new THREE.Raycaster(origin, towardFlash, 0, Math.max(0, distance - 0.01));
  const blocked = ray.intersectObjects(obstacles, false).length > 0;
  const projected = position.clone().project(camera);
  const visible = !blocked && projected.z >= -1 && projected.z <= 1
    && Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1;
  return { angle, blocked, visible };
}

export class ReactionTracker {
  constructor(settings = DETECTION_SETTINGS) {
    this.settings = settings;
    this.reset();
  }

  reset() {
    this.cueTime = null;
    this.reactionMs = null;
    this.invalidReason = null;
  }

  sample(time, { visible, angle }) {
    if (this.cueTime === null && visible) this.cueTime = time;
    if (this.cueTime !== null && this.reactionMs === null && angle >= this.settings.dodgeAngle) {
      this.reactionMs = Math.max(0, (time - this.cueTime) * 1000);
    }
  }

  describe() {
    if (this.invalidReason) return `Reaction: — (${this.invalidReason})`;
    if (this.cueTime === null) return 'Reaction: — (no visible cue)';
    if (this.reactionMs === null) return 'Reaction: — (turn threshold not reached)';
    return `Reaction: ${Math.round(this.reactionMs)} ms`;
  }
}

export function effectOpacity(result, elapsed) {
  const effect = EFFECT_SETTINGS[result];
  if (!effect || effect.opacity === 0) return 0;
  if (elapsed <= effect.hold) return effect.opacity;
  return effect.opacity * Math.max(0, 1 - (elapsed - effect.hold) / effect.fade);
}
