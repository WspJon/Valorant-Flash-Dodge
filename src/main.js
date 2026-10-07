import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createRoom } from './room.js';
import { PhoenixFlash, PHOENIX_SETTINGS } from './phoenix-flash.js';
import { classifyAngle, inspectFlash, ReactionTracker, effectOpacity } from './flash-detection.js';
import { SessionStats, AttemptScheduler } from './training-session.js';
import './style.css';

const game = document.querySelector('#game');
const menu = document.querySelector('#menu');
const button = document.querySelector('#enter');
const status = document.querySelector('#status');
const state = document.querySelector('#state');
const resultLabel = document.querySelector('#result');
const reactionLabel = document.querySelector('#reaction');
const screenFlash = document.querySelector('#screen-flash');

function initialize() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  game.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.7, 4);
  const obstacles = createRoom(scene);
  const reaction = new ReactionTracker();
  const stats = new SessionStats();
  const scheduler = new AttemptScheduler();
  function renderStats() {
    document.querySelector('#attempts').textContent = stats.attempts;
    document.querySelector('#dodges').textContent = stats.dodges;
    document.querySelector('#success').textContent = `${stats.successRate.toFixed(0)}%`;
    document.querySelector('#best').textContent = stats.best === null ? '—' : `${Math.round(stats.best)} ms`;
    document.querySelector('#average').textContent = stats.average === null ? '—' : `${Math.round(stats.average)} ms`;
    document.querySelector('#samples').textContent = stats.reactionCount;
  }
  let effectResult = null;
  let effectTime = 0;
  let previousTime = performance.now();

  const flash = new PhoenixFlash(scene, (phase, side) => {
    const direction = side === -1 ? 'LEFT' : 'RIGHT';
    state.textContent = phase === 'flying' ? `CURVEBALL / ${direction}`
      : phase === 'burst' ? 'FLASH ACTIVATED' : 'READY / SPACE TO THROW';
    if (phase === 'flying') {
      scheduler.launchNow();
      reaction.reset();
      resultLabel.textContent = 'Watch for the projectile';
      reactionLabel.textContent = 'Reaction: waiting for visible cue';
    }
    if (phase === 'burst') {
      const observation = inspectFlash(camera, flash.group.position, obstacles);
      // A projectile first seen on activation offers no pre-activation reaction cue.
      if (reaction.cueTime !== null) reaction.sample(PHOENIX_SETTINGS.activationDelay, observation);
      effectResult = observation.blocked ? 'DODGED' : classifyAngle(observation.angle);
      effectTime = 0;
      resultLabel.textContent = `${effectResult} · ${observation.angle.toFixed(1)}°${observation.blocked ? ' · blocked by wall' : ''}`;
      reactionLabel.textContent = reaction.describe();
      const counted = stats.record(effectResult, reaction);
      if (!counted) resultLabel.textContent += ' · practice only';
      renderStats();
      screenFlash.style.opacity = effectOpacity(effectResult, effectTime);
    }
  });
  function showFlashState() {
    state.textContent = flash.phase === 'ready' ? scheduler.waiting ? 'GET READY / FACE THE TARGETS' : 'RECOVERING'
      : flash.phase === 'flying' ? `CURVEBALL / ${flash.side === -1 ? 'LEFT' : 'RIGHT'}`
      : 'FLASH ACTIVATED';
  }

  // PointerLockControls handles yaw/pitch and clamps the vertical look angle.
  // The player stays at a fixed position; mouse look is independent of flashes.
  const controls = new PointerLockControls(camera, renderer.domElement);
  controls.pointerSpeed = 0.8;

  function enterRoom() {
    if (controls.isLocked) return;
    status.textContent = 'Requesting mouse capture…';
    try {
      controls.lock();
    } catch (error) {
      showLockError();
    }
  }
  function showLockError() {
    status.textContent = 'Mouse capture was denied. Click again, or open the page directly in a desktop browser.';
  }
  button.addEventListener('click', enterRoom);
  menu.addEventListener('click', (event) => {
    if (event.target === menu) enterRoom();
  });
  renderer.domElement.addEventListener('click', enterRoom);
  controls.addEventListener('lock', () => {
    previousTime = performance.now();
    menu.hidden = true;
    showFlashState();
  });
  controls.addEventListener('unlock', () => {
    if (flash.phase === 'flying') reaction.invalidReason = 'attempt paused';
    menu.hidden = false;
    button.innerHTML = 'Resume training room <span>→</span>';
    status.textContent = 'Mouse released. Click to resume.';
    state.textContent = 'PAUSED';
    button.focus();
  });
  document.addEventListener('pointerlockerror', showLockError);
  document.addEventListener('keydown', (event) => {
    if (event.code !== 'Space' || !controls.isLocked) return;
    event.preventDefault();
    if (!event.repeat && effectOpacity(effectResult, effectTime) === 0) flash.launch();
  });
  document.querySelector('#reset').addEventListener('click', () => {
    flash.reset();
    reaction.reset();
    stats.reset();
    scheduler.schedule();
    camera.rotation.set(0, 0, 0);
    effectResult = null;
    effectTime = 0;
    screenFlash.style.opacity = 0;
    resultLabel.textContent = 'Session reset';
    reactionLabel.textContent = 'Reaction: —';
    renderStats();
    status.textContent = 'Session reset. Click to start.';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && controls.isLocked) controls.unlock();
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    controls.unlock();
    status.textContent = 'Graphics context lost. Reload the page to restart the room.';
  });
  renderer.setAnimationLoop((time) => {
    // Real active time keeps reaction measurements independent of frame rate.
    const delta = Math.max((time - previousTime) / 1000, 0);
    previousTime = time;
    if (controls.isLocked) {
      effectTime += delta;
      screenFlash.style.opacity = effectOpacity(effectResult, effectTime);
      if (delta > 0.1 && flash.phase === 'flying' && reaction.cueTime !== null) {
        reaction.invalidReason ??= 'frame delay';
      }
      flash.update(delta);
      if (flash.phase === 'flying') {
        reaction.sample(flash.elapsed, inspectFlash(camera, flash.group.position, obstacles));
        reactionLabel.textContent = reaction.cueTime === null ? 'Reaction: waiting for visible cue'
          : reaction.reactionMs === null ? 'Reaction: turn away now' : reaction.describe();
      }
      if (flash.phase === 'ready' && effectOpacity(effectResult, effectTime) > 0) state.textContent = 'RECOVERING';
      else if (flash.phase === 'ready') {
        if (!scheduler.waiting) {
          // Recenter after recovery so every new attempt has a fair starting view.
          camera.rotation.set(0, 0, 0);
          scheduler.schedule();
        } else if (scheduler.update(delta)) flash.launch();
        if (flash.phase === 'ready') showFlashState();
      }
    }
    renderer.render(scene, camera);
  });
}

if (!('pointerLockElement' in document)) {
  button.disabled = true;
  status.textContent = 'This trainer requires a desktop browser with Pointer Lock support.';
} else {
  try {
    initialize();
  } catch (error) {
    console.error('Could not initialize training room:', error);
    button.disabled = true;
    status.textContent = 'Could not start WebGL. Enable hardware acceleration and reload in a modern desktop browser.';
  }
}
