# Build Memory

## Chosen direction

The game commits to **Storybook Sunbeam**: a warm, tactile fairytale arcade flight through sunlit cloud stages. The interactive focus is fast, one-touch play; visual language is scalloped parchment, crown sparks, theatrical layers, and a visible distant castle.

## Runtime decisions

- Babylon runs in an orthographic 2D composition inside a React lifecycle-safe canvas host.
- Princess textures come from the generated transparent PNGs. Towers, clouds, castle, and particles are procedural so their game dimensions match collisions and responsive viewports.
- The root route contains only `GameCanvas`; game UI is a DOM overlay controlled by `GameWorld` so gameplay stays framework-agnostic.
- `?demo` enables deterministic auto-flutter and collision immunity exclusively for visual verification.

