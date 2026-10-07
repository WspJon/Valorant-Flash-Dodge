import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { classifyAngle, inspectFlash, ReactionTracker, effectOpacity } from './flash-detection.js';

test('angle boundaries and configurable thresholds', () => {
  assert.equal(classifyAngle(0), 'FULL FLASH');
  assert.equal(classifyAngle(45), 'FULL FLASH');
  assert.equal(classifyAngle(45.01), 'PARTIALLY FLASHED');
  assert.equal(classifyAngle(99.99), 'PARTIALLY FLASHED');
  assert.equal(classifyAngle(100), 'DODGED');
  assert.equal(classifyAngle(180), 'DODGED');
  assert.equal(classifyAngle(70, { fullAngle: 20, dodgeAngle: 60 }), 'DODGED');
});

test('camera angle, frustum, and wall occlusion use world geometry', () => {
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 0, -5);
  assert.deepEqual(inspectFlash(camera, target, []), { angle: 0, visible: true, blocked: false });
  assert.equal(inspectFlash(camera, new THREE.Vector3(5, 0, 0), []).angle, 90);
  assert.equal(inspectFlash(camera, new THREE.Vector3(0, 0, 5), []).visible, false);
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 0.2), new THREE.MeshBasicMaterial());
  wall.position.z = -2;
  wall.updateMatrixWorld();
  assert.deepEqual(inspectFlash(camera, target, [wall]), { angle: 0, visible: false, blocked: true });
  wall.position.z = -8;
  wall.updateMatrixWorld();
  assert.equal(inspectFlash(camera, target, [wall]).blocked, false);
});

test('reaction begins at visible cue and freezes on first sufficient turn', () => {
  const reaction = new ReactionTracker();
  reaction.sample(0.1, { visible: false, angle: 120 });
  assert.equal(reaction.cueTime, null);
  reaction.sample(0.3, { visible: true, angle: 20 });
  reaction.sample(0.484, { visible: false, angle: 110 });
  assert.equal(Math.round(reaction.reactionMs), 184);
  reaction.sample(0.8, { visible: true, angle: 0 });
  assert.equal(Math.round(reaction.reactionMs), 184);
  assert.equal(classifyAngle(0), 'FULL FLASH'); // Turning back still fails at activation.
});

test('unseen, failed, paused, and reset attempts never invent reaction times', () => {
  const reaction = new ReactionTracker();
  assert.match(reaction.describe(), /no visible cue/);
  reaction.sample(0.2, { visible: true, angle: 20 });
  assert.match(reaction.describe(), /threshold not reached/);
  reaction.invalidReason = 'attempt paused';
  assert.match(reaction.describe(), /attempt paused/);
  reaction.reset();
  assert.equal(reaction.reactionMs, null);
  assert.equal(reaction.invalidReason, null);
});

test('effects vary by severity and fully recover', () => {
  assert.equal(effectOpacity('FULL FLASH', 0), 1);
  assert.equal(effectOpacity('PARTIALLY FLASHED', 0), 0.55);
  assert.equal(effectOpacity('DODGED', 0), 0);
  assert.equal(effectOpacity('FULL FLASH', 2), 0);
  assert.equal(effectOpacity('PARTIALLY FLASHED', 0.7), 0);
});
