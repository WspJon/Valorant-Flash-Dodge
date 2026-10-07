# Valorant Flash Dodge Trainer

Phase 4: a browser-based first-person training room with a Phoenix-style
curveball, angle-based dodge detection, screen effects, reaction timing,
automatic attempts, and session statistics.
Built with HTML, CSS, JavaScript, and Three.js. All geometry and effects are
original and procedural.

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
2. Move the mouse left/right: the camera turns smoothly. Move up/down: the
   camera stays level at eye height. The crosshair stays centered.
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
- `src/flash-detection.js`: visibility, angle classification, reaction tracking,
  and configurable detection/effect settings. Run `npm test` for its tests.
- `src/training-session.js`: random wait scheduling and session statistics.
- `src/phoenix-flash.js`: configurable timings, curved trajectory, glowing
  projectile, and activation burst. The exported class keeps flash behavior
  separate from camera controls.

## Phase 2 manual test

1. Enter and face the target boards. Press Space: a glowing orange projectile
   rounds either side partition and curves into the lane.
2. It bursts after 0.5 seconds of active simulation time, fades, and returns
   to READY after any screen effect recovers.
3. Press Space again several times after READY. Both left and right directions
   should eventually appear; selection is random and can repeat.
4. Hold Space or press it during flight: only one projectile should be active.
5. Press Escape during flight, wait, then Resume: flight continues from where
   it paused. Space while paused must not launch a projectile.
6. Check mouse look, Escape/resume, and resize still work as in Phase 1.

Projectile timings are in `PHOENIX_SETTINGS`.

## Phase 3 manual test

1. Face the targets and throw. Keep looking forward: expect FULL FLASH and a
   bright overlay that fades before another throw is allowed.
2. Throw again and turn sideways: expect PARTIALLY FLASHED with a shorter,
   lighter effect when the displayed angle falls between 45 and 100 degrees.
3. See the projectile, then turn fully around before it bursts: expect DODGED,
   no overlay, and a reaction time in milliseconds.
4. Turn away, then back before activation: the final angle determines the
   result, even if an earlier successful turn produced a reaction time.
5. Face away before throwing: expect DODGED with no reaction score if no cue
   was visible. Pausing mid-flight also excludes the reaction score.
6. Repeat throws and check Escape/resume, mouse look, and browser resizing.

Default thresholds: up to 45 degrees is full, between 45 and 100 is partial,
and 100 or more is dodged. Edit `DETECTION_SETTINGS` to tune these trainer rules.
Walls block flashes. Reaction timing begins on the first frame where the
projectile center is on-screen and unobstructed, and stops on the first frame
at or beyond the dodge threshold. This is a frame-sampled estimate, not a
measurement of initial mouse movement. Paused attempts and frame stalls above
100 ms are excluded from reaction scoring. Screen effects pause with gameplay.

## Verification

Production build and JavaScript syntax checks passed. A headless Chromium smoke
check rendered the room, captured the pointer, changed the view with mouse
movement, released/reacquired the pointer through the browser API, and resized
without JavaScript errors. The user confirmed Phase 1 manual checks passed.
Phase 2 Chromium checks passed for mirrored paths, activation timing, a single
active projectile, launch, paused simulation, resume, burst cleanup, and relaunch
without browser errors. The user confirmed Phase 2 manual checks passed.
Phase 3 automated tests cover angle boundaries, custom thresholds, camera and
wall geometry, cue timing, reaction reset, and effect recovery.
Chromium integration checks passed for full/partial/dodged outcomes, turning
back before activation, effect recovery, and paused score exclusion, without
JavaScript errors. Software rendering can trigger the frame-delay exclusion;
test reaction responsiveness on your desktop before proceeding to Phase 4.

Phase 4: all eight automated tests and the production build passed. A Chromium
check with controlled frame timing verified automatic repetition, stats,
pause/reset, manual skip, successful reaction aggregates, and continuous camera orientation
without JavaScript errors. Manual desktop validation is still required below.

## Phase 4 manual test

1. Enter and wait: attempts launch automatically after a random 1.5–3.5 second
   delay, from randomly selected left/right corners.
2. Do nothing for two attempts: attempts increase once per activation and
   success stays at 0%. Partial flashes count as failures too.
3. See the cue and turn fully away: dodges and success increase, and a valid
   reaction updates best/average. These averages include only valid successful
   dodges; the HUD shows their sample count. Dodges with no cue have no sample.
4. After the burst/effect finishes, the next random wait begins. Your camera
   keeps its orientation through activation, recovery, and subsequent attempts.
   Space skips the wait, without creating duplicate attempts.
5. Escape freezes the loop and effects. Resume continues. Pausing during flight
   makes that attempt practice only: neither its outcome nor timing affects stats.
6. In the pause menu, Reset session stats clears the attempt, screen effect,
   counters, and camera direction. Click Resume to begin a fresh random wait.

Stats are session-only and reset on page reload. Frame-stalled attempts are
practice only. Wait bounds are configurable in `TRAINING_SETTINGS`.
