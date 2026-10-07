# Valorant Flash Dodge Trainer

Phase 1: a browser-based first-person training room built with HTML, CSS,
JavaScript, and Three.js. Geometry is original and procedural. There are no
flash abilities, reaction timers, or statistics yet.

## Run

Use Node.js 22.12+ (Node 24 is verified).

```sh
npm ci --cache /workspace/.npm-cache
npm run dev
```

Open the address printed by Vite in a modern desktop browser. Pointer Lock
requires a secure context (HTTPS or localhost) and a user click. Embedded pages
may need permission for Pointer Lock; use a direct browser tab if capture fails.

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

## Verification

Production build and JavaScript syntax checks passed. A headless Chromium smoke
check rendered the room, captured the pointer, changed the view with mouse
movement, released/reacquired the pointer through the browser API, and resized
without JavaScript errors. Physical Escape behavior and mouse feel still need
the desktop manual test above before Phase 2.
