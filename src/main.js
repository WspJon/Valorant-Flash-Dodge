import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createRoom } from './room.js';
import { PhoenixFlash } from './phoenix-flash.js';
import './style.css';

const game = document.querySelector('#game');
const menu = document.querySelector('#menu');
const button = document.querySelector('#enter');
const status = document.querySelector('#status');
const state = document.querySelector('#state');

function initialize() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  game.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.7, 4);
  createRoom(scene);

  const flash = new PhoenixFlash(scene, (phase, side) => {
    const direction = side === -1 ? 'LEFT' : 'RIGHT';
    state.textContent = phase === 'flying' ? `CURVEBALL / ${direction}`
      : phase === 'burst' ? 'FLASH ACTIVATED' : 'READY / SPACE TO THROW';
  });
  function showFlashState() {
    state.textContent = flash.phase === 'ready' ? 'READY / SPACE TO THROW'
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
    menu.hidden = true;
    showFlashState();
  });
  controls.addEventListener('unlock', () => {
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
    if (!event.repeat) flash.launch();
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
  let previousTime = performance.now();
  renderer.setAnimationLoop((time) => {
    // Discard paused time and long stalls so resuming never skips the projectile.
    const delta = Math.min(Math.max((time - previousTime) / 1000, 0), 0.05);
    previousTime = time;
    if (controls.isLocked) flash.update(delta);
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
