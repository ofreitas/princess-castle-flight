# Princess Castle Flight — Structure

## Runtime boundary

React acts only as the **picture frame**. `GameCanvas.tsx` owns the canvas lifecycle and provides the DOM overlay mount point. Babylon owns the scene, render loop, orthographic camera, meshes, and textures. Plain TypeScript owns rules, input, score, state, spawning, and cleanup.

## Modules

| Module | Responsibility |
|---|---|
| `client/src/components/GameCanvas.tsx` | React-safe engine initialization, resize lifecycle, full-screen canvas and UI mount. |
| `client/src/game/assets.ts` | Canonical generated asset URLs and character metadata. |
| `client/src/game/GameWorld.ts` | Game state machine, input, princess player, tower spawning, scoring, collisions, DOM HUD, and disposal. |
| `client/src/game/scene.ts` | Babylon scene factory, camera/light setup, world creation, and scene lifecycle contract. |
| `client/src/index.css` | Storybook Sunbeam visual system and responsive menu/HUD styling. |

## State model

`menu → playing ↔ paused → gameover → menu`

The selected princess persists for the current session. Best distance is stored locally in the browser. Gameplay code never depends on React state; UI actions call explicit `GameWorld` methods.

## Asset hints

The wide generated flight reference supplies the menu's scenic art direction. Princess PNGs render in DOM selection cards and as alpha-enabled Babylon plane textures during gameplay. The crown-comet PNG is the header brand mark. Stone towers, cloud layers, particles, and the destination castle are procedural meshes so they stay crisp at any viewport size.

