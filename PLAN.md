# Game Plan: Princess Castle Flight

## Risk Tasks

### 1. Responsive one-touch flight loop
- **Why isolated:** Continuous gravity, a single input action, moving obstacle pairs, and collision checks must remain stable across touch and keyboard input.
- **Approach:** Use a fixed-step-feeling delta-time update with a clamped frame delta. Keep the princess at a fixed horizontal position, apply vertical velocity for each flutter, move procedural tower pairs from right to left, and use explicit AABB checks against each gap.
- **Verify:** Tap/click/space gives an immediate upward response; releasing input allows a controlled fall; clearing a tower pair adds exactly one point; a collision cleanly stops movement and shows a restart state.

### 2. Babylon lifecycle and DOM-controlled HUD
- **Why isolated:** React 19 development mounts effects more than once, while the game uses a native canvas plus DOM menus.
- **Approach:** Guard engine creation in the React host; construct a new scene through `createGameScene`; keep gameplay in plain TypeScript; attach and remove canvas/window listeners explicitly; rebuild HUD screens through a dedicated world UI method.
- **Verify:** Reloading the page does not create duplicate engines or duplicate input listeners; the menu, play HUD, pause state, and game-over state exchange without console errors.

## Main Build

Create a mobile-first fairytale arcade game where the player selects Helena, Eliza, or Aurora before starting an endless flight toward a distant castle. The game uses a 2D orthographic Babylon scene with a parchment sky, layered cloud scenery, a moving princess sprite, procedural stone tower gates, score tracking, a local best score, keyboard/touch controls, pause/restart paths, and a deterministic `?demo` mode for visual proof.

- **Assets:**
  - Storybook flight visual target (`/manus-storage/princess-castle-flight-reference_2c735e7c.png`) — menu atmosphere, wide scene inset.
  - Helena sprite (`/manus-storage/princess-helena_4c5e2b69.png`) — 170×250 px in the selection card; 118×184 px as the player.
  - Eliza sprite (`/manus-storage/princess-eliza_8497b349.png`) — 170×250 px in the selection card; 118×184 px as the player.
  - Aurora sprite (`/manus-storage/princess-aurora_cebd3236.png`) — 170×250 px in the selection card; 118×184 px as the player.
  - Crown-comet mark (`/manus-storage/princess-castle-flight-logo_fdef5d90.png`) — 80×80 px header brand mark and favicon source.
- **Verify:**
  - All three named princesses can be selected from the main menu.
  - Tap/click/space/arrow-up produces a flutter; obstacle avoidance drives score growth.
  - The distance score, best score, pause action, and restart action are readable on a narrow mobile viewport.
  - The distant castle, storybook colors, layered clouds, and generated princess images are visible in the game experience.
  - The `?demo` path visibly advances real gameplay without manual input.
  - No browser console errors occur during a run; no visual placeholders, clipping, or inaccessible actions remain.

