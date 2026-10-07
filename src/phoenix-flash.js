import * as THREE from 'three';

// Prototype timings in seconds; these can be tuned without changing the camera.
export const PHOENIX_SETTINGS = Object.freeze({ activationDelay: 1.1, burstDuration: 0.3 });

export function createPhoenixPath(side) {
  // Start behind a side partition, round its inner corner, then enter the lane.
  return new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(side * 6.6, 1.8, -7.5),
    new THREE.Vector3(side * 4.4, 2.1, -5.1),
    new THREE.Vector3(side * 2.4, 1.9, -3.3),
  );
}

export class PhoenixFlash {
  constructor(scene, onStateChange) {
    this.onStateChange = onStateChange;
    this.phase = 'ready';
    this.elapsed = 0;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);

    this.core = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xffe7a0 }),
    );
    this.group.add(this.core);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, '#fff5cd');
    gradient.addColorStop(0.25, '#ffb347');
    gradient.addColorStop(1, 'rgba(255, 100, 20, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas), blending: THREE.AdditiveBlending,
      transparent: true, depthWrite: false,
    }));
    this.group.add(this.glow);
    this.light = new THREE.PointLight(0xffaa44, 5, 4);
    this.group.add(this.light);
  }

  launch() {
    if (this.phase !== 'ready') return;
    this.side = Math.random() < 0.5 ? -1 : 1;
    this.path = createPhoenixPath(this.side);
    this.elapsed = 0;
    this.phase = 'flying';
    this.group.position.copy(this.path.getPoint(0));
    this.group.visible = true;
    this.core.visible = true;
    this.glow.scale.setScalar(0.8);
    this.glow.material.opacity = 1;
    this.light.intensity = 5;
    this.onStateChange('flying', this.side);
  }

  update(delta) {
    if (this.phase === 'ready') return;
    this.elapsed += delta;
    const { activationDelay, burstDuration } = PHOENIX_SETTINGS;
    if (this.phase === 'flying') {
      const progress = Math.min(this.elapsed / activationDelay, 1);
      this.group.position.copy(this.path.getPoint(progress));
      this.glow.scale.setScalar(0.8 + 0.08 * Math.sin(this.elapsed * 35));
      if (progress === 1) {
        this.phase = 'burst';
        this.core.visible = false;
        this.onStateChange('burst', this.side);
      }
    }
    if (this.phase === 'burst') {
      const progress = Math.min((this.elapsed - activationDelay) / burstDuration, 1);
      this.glow.scale.setScalar(1 + progress * 4);
      this.glow.material.opacity = 1 - progress;
      this.light.intensity = 12 * (1 - progress);
      if (progress === 1) {
        this.group.visible = false;
        this.phase = 'ready';
        this.onStateChange('ready', this.side);
      }
    }
  }
}
