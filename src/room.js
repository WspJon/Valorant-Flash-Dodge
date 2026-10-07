import * as THREE from 'three';

// All geometry is procedural; no game assets are used.
export function createRoom(scene) {
  const obstacles = [];
  scene.background = new THREE.Color(0x17232d);
  scene.fog = new THREE.Fog(0x17232d, 18, 42);
  scene.add(new THREE.HemisphereLight(0xc8e4ff, 0x46505a, 2.2));
  const sunlight = new THREE.DirectionalLight(0xffe3c2, 2.5);
  sunlight.position.set(4, 10, 5);
  scene.add(sunlight);

  const materials = {
    floor: new THREE.MeshStandardMaterial({ color: 0x34414a, roughness: 0.95 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x637781, roughness: 0.9 }),
    crate: new THREE.MeshStandardMaterial({ color: 0x7a6650, roughness: 0.85 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x24333d }),
    accent: new THREE.MeshStandardMaterial({ color: 0xff6570, emissive: 0x6b1922 }),
  };
  function box(width, height, depth, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    obstacles.push(mesh);
    return mesh;
  }

  box(24, 0.2, 30, 0, -0.1, -5, materials.floor);
  const grid = new THREE.GridHelper(24, 24, 0x81939b, 0x485963);
  grid.position.set(0, 0.01, -5);
  scene.add(grid);
  box(24, 5, 0.4, 0, 2.5, -20, materials.wall);
  box(0.4, 5, 30, -12, 2.5, -5, materials.wall);
  box(0.4, 5, 30, 12, 2.5, -5, materials.wall);
  box(24, 5, 0.4, 0, 2.5, 10, materials.wall);

  // Side partitions create recognizable corners for future flash tests.
  box(4, 3.3, 0.4, -8, 1.65, -7, materials.wall);
  box(4, 3.3, 0.4, 8, 1.65, -7, materials.wall);
  box(2.4, 2.4, 2.4, -6, 1.2, -12, materials.crate);
  box(2, 1.5, 2, 6, 0.75, -10, materials.crate);
  box(1.7, 1.7, 1.7, 6, 2.35, -10, materials.crate);
  for (const x of [-5, 0, 5]) {
    box(2.5, 3, 0.15, x, 2, -19.7, materials.dark);
    const target = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.43, 40), materials.accent);
    target.position.set(x, 2.1, -19.59);
    scene.add(target);
    box(0.08, 0.08, 0.05, x, 2.1, -19.56, materials.accent);
  }
  for (const x of [-11.7, 11.7]) {
    box(0.08, 0.12, 27, x, 0.2, -5, materials.accent);
  }
  scene.updateMatrixWorld(true);
  return obstacles;
}
