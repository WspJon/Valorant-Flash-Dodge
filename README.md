# Valorant Flash Dodge Trainer

Phase 2: a browser-based first-person training room with a Phoenix-style
curveball prototype, built with HTML, CSS, JavaScript, and Three.js. All geometry
and effects are original and procedural. Dodge detection, reaction timers, and
statistics are planned for later phases.

## Run

Use Node.js 22.12+ (Node 24 is verified).

```sh
npm ci
npm run dev
```

Open the address printed by Vite in a modern desktop browser. Pointer Lock
requires a secure context (HTTPS or localhost) and a user click. Embedded pages
may need permission for Pointer Lock; use a direct browser tab if capture fails.

On Windows Command Prompt, switch drives using
`cd /d "D:\Downloads\Valorant-Flash-Dodge\Valorant-Flash-Dodge"`
(adjust to your checkout). In PowerShell, use `npm.cmd ci` and `npm.cmd run dev`
if execution policy blocks the npm PowerShell wrapper. In the cloud environment,
use `npm ci --cache /workspace/.npm-cache` to use a writable cache.

```sh
npm run build
npm run preview
```

## Phase 1 manual test

1. Enter the room: the menu disappears and the mouse is captured.
2. Move the mouse left/right and up/down: the camera rotates smoothly, without
   rolling or flipping past straight up/down. The crosshair stays centered.
3. Look around the room: walls, corners, crates, and target boards render.
   Your position stays fixed; walking and shooting are outside Phase 1.
4. Press Escape: the cursor is released and the pause menu appears. Moving the
   mouse while paused must not rotate the camera.
5. Click Resume or the backdrop: capture resumes from the same camera direction.
   Repeat Escape/resume several times.
6. Resize the browser: the room fills the window without stretching and the
   crosshair stays centered.
7. Check the browser console for errors. If mouse capture fails, check the
   displayed message and retry in a direct desktop browser tab.

## Files

- `index.html`: HUD, crosshair, and pause menu.
- `src/style.css`: full-screen layout and HUD styling.
- `src/main.js`: renderer, camera, pointer lock, pause/resume, and resize handling.
- `src/room.js`: procedural room geometry and lighting.
- `src/phoenix-flash.js`: configurable timings, curved trajectory, glowing
  projectile, and activation burst. The exported class keeps flash behavior
  separate from camera controls.

## Phase 2 manual test

1. Enter and face the target boards. Press Space: a glowing orange projectile
   rounds either side partition and curves into the lane.
2. It bursts after 1.1 seconds of active simulation time, fades, and returns
   to READY. The burst is a world effect; screen blindness depends on detection
   planned for Phase 3.
3. Press Space again several times after READY. Both left and right directions
   should eventually appear; selection is random and can repeat.
4. Hold Space or press it during flight: only one projectile should be active.
5. Press Escape during flight, wait, then Resume: flight continues from where
   it paused. Space while paused must not launch a projectile.
6. Check mouse look, Escape/resume, and resize still work as in Phase 1.

There is no automatic launch loop yet. Timings are in `PHOENIX_SETTINGS`.

## Verification

Production build and JavaScript syntax checks passed. A headless Chromium smoke
check rendered the room, captured the pointer, changed the view with mouse
movement, released/reacquired the pointer through the browser API, and resized
without JavaScript errors. The user confirmed Phase 1 manual checks passed.
Phase 2 Chromium checks passed for mirrored paths, activation timing, a single
active projectile, launch, paused simulation, resume, burst cleanup, and relaunch
without browser errors. Phase 2 still needs the desktop manual checks above.
