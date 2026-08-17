// Storybook Sunbeam scene factory: a clean orthographic stage delegates all play to GameWorld.

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { GameWorld } from "@/game/GameWorld";

export type GameHandle = {
  scene: Scene;
  dispose: () => void;
};

export async function createGameScene(engine: Engine, canvas: HTMLCanvasElement): Promise<GameHandle> {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.70, 0.84, 0.91, 1);

  const camera = new FreeCamera("storybook-camera", new Vector3(0, 0, -10), scene);
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
  camera.orthoLeft = -8;
  camera.orthoRight = 8;
  camera.orthoTop = 5;
  camera.orthoBottom = -5;
  camera.setTarget(Vector3.Zero());

  const world = new GameWorld(scene, canvas);
  let animationFrame = 0;
  let previousTime = performance.now();

  const update = (currentTime: number) => {
    const deltaSeconds = Math.min((currentTime - previousTime) / 1000, 0.034);
    previousTime = currentTime;
    world.update(deltaSeconds);
    animationFrame = window.requestAnimationFrame(update);
  };
  animationFrame = window.requestAnimationFrame(update);

  return {
    scene,
    dispose: () => {
      window.cancelAnimationFrame(animationFrame);
      world.dispose();
      scene.dispose();
    },
  };
}
