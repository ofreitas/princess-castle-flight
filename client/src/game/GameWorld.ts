// Storybook Sunbeam gameplay: a one-touch fairytale flight with clear arcade rules and tactile UI.

import type { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { assets, type PrincessKey } from "@/game/assets";
import { copy, gameLanguage } from "@/game/i18n";
import { SoundManager } from "@/game/SoundManager";

type GameMode = "menu" | "playing" | "paused" | "gameover";

type TowerPair = {
  x: number;
  gapY: number;
  gapSize: number;
  scored: boolean;
  meshes: Mesh[];
  element: HTMLDivElement;
};

type Spark = { mesh: Mesh; life: number; velocity: Vector3 };

const WORLD_WIDTH = 16;
const WORLD_HEIGHT = 10;
const PLAYER_X = -4.2;
const TOWER_WIDTH = 1.28;
const PLAYER_HALF_W = 0.45;
const PLAYER_HALF_H = 0.72;

export class GameWorld {
  private readonly ui: HTMLDivElement;
  private readonly towerMaterial: StandardMaterial;
  private readonly roofMaterial: StandardMaterial;
  private readonly goldMaterial: StandardMaterial;
  private readonly cloudMaterials: StandardMaterial[];
  private readonly backgroundClouds: Mesh[] = [];
  private readonly hillMeshes: Mesh[] = [];
  private readonly vineMeshes: Mesh[] = [];
  private readonly castleMeshes: Mesh[] = [];
  private readonly towers: TowerPair[] = [];
  private readonly sparks: Spark[] = [];
  private readonly sounds = new SoundManager();
  private player: Mesh | null = null;
  private playerMaterials: StandardMaterial[] = [];
  private stage: HTMLDivElement | null = null;
  private playerDoll: HTMLDivElement | null = null;
  private domPlayerY = 50;
  private domPlayerRotation = 0;
  private mode: GameMode = "menu";
  private selected: PrincessKey = "helena";
  private velocity = 0;
  private score = 0;
  private bestScore = 0;
  private spawnTimer = 0;
  private elapsed = 0;
  private demoTimer = 0;
  private readonly isDemo = new URLSearchParams(window.location.search).has("demo");

  private readonly onGameplayPointer = (event: PointerEvent) => {
    if (this.mode !== "playing") return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) return;
    event.preventDefault();
    void this.sounds.unlock();
    this.flap();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      if (this.mode === "playing") {
        void this.sounds.unlock();
        this.flap();
      }
    }
    if (event.code === "Escape" && this.mode === "playing") this.pauseGame();
  };

  constructor(private readonly scene: Scene, private readonly canvas: HTMLCanvasElement) {
    this.ui = document.getElementById("game-ui") as HTMLDivElement;
    document.documentElement.lang = gameLanguage;
    this.bestScore = this.readBestScore();
    this.towerMaterial = this.createMaterial("tower-stone", "#F5E6C9");
    this.roofMaterial = this.createMaterial("tower-roof", "#397C80");
    this.goldMaterial = this.createMaterial("sunbeam-gold", "#F7B84B");
    this.cloudMaterials = ["#FFFFFF", "#F9F4E8", "#E3F0EE"].map((color, index) => {
      const material = this.createMaterial(`cloud-${index}`, color);
      return material;
    });

    window.addEventListener("pointerdown", this.onGameplayPointer, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    this.renderMenu();

    if (this.isDemo) {
      window.setTimeout(() => this.startGame(), 260);
    }
  }

  update(delta: number) {
    this.elapsed += delta;
    this.animateCloudStage(delta);
    this.animateCastle();
    this.updateSparks(delta);

    if (this.mode !== "playing" || !this.player) return;

    if (this.isDemo) {
      this.demoTimer += delta;
      if (this.demoTimer > 0.54) {
        this.flap();
        this.demoTimer = 0;
      }
    }

    this.velocity -= 16.4 * delta;
    this.player.position.y += this.velocity * delta;
    this.player.rotation.z = Math.max(-0.65, Math.min(0.72, -this.velocity * 0.052));
    this.player.position.x = PLAYER_X;
    this.updateDomPlayer();

    this.spawnTimer += delta;
    if (this.spawnTimer > 1.65) {
      this.spawnTowerPair();
      this.spawnTimer = 0;
    }

    const speed = 4.05 + Math.min(this.score * 0.032, 1.1);
    this.towers.forEach((tower) => {
      tower.x -= speed * delta;
      tower.meshes.forEach((mesh) => (mesh.position.x = tower.x));
      tower.element.style.left = `${this.worldXToPercent(tower.x)}%`;
      if (!tower.scored && tower.x + TOWER_WIDTH / 2 < PLAYER_X) {
        tower.scored = true;
        this.score += 1;
        this.sounds.score();
        this.emitSparks(new Vector3(PLAYER_X + 0.5, this.player?.position.y ?? 0, 0), 9);
        this.updatePlayHud();
      }
    });

    while (this.towers.length && this.towers[0].x < -10) {
      const expired = this.towers.shift();
      expired?.meshes.forEach((mesh) => mesh.dispose());
      expired?.element.remove();
    }

    if (!this.isDemo && this.hasCollision()) this.endGame();
  }

  dispose() {
    window.removeEventListener("pointerdown", this.onGameplayPointer);
    window.removeEventListener("keydown", this.onKeyDown);
    this.clearRun();
    this.backgroundClouds.forEach((mesh) => mesh.dispose());
    this.hillMeshes.forEach((mesh) => mesh.dispose());
    this.vineMeshes.forEach((mesh) => mesh.dispose());
    this.castleMeshes.forEach((mesh) => mesh.dispose());
    this.sparks.forEach((spark) => spark.mesh.dispose());
    this.towerMaterial.dispose();
    this.roofMaterial.dispose();
    this.goldMaterial.dispose();
    this.cloudMaterials.forEach((material) => material.dispose());
    this.ui.replaceChildren();
  }

  private createMaterial(name: string, color: string) {
    const material = new StandardMaterial(name, this.scene);
    const parsed = Color3.FromHexString(color);
    material.diffuseColor = parsed;
    material.emissiveColor = parsed;
    material.specularColor = Color3.Black();
    material.disableLighting = true;
    material.backFaceCulling = false;
    return material;
  }

  private createCloudStage() {
    const positions = [
      [-7.6, 3.8, 1.45, 0], [-5.4, -3.65, 1.1, 1], [-1.4, 4.3, 1.65, 2], [2.3, -3.45, 1.25, 0], [5.2, 3.65, 1.45, 1], [7.5, -1.9, 0.72, 2],
    ] as const;
    positions.forEach(([x, y, scale, materialIndex], index) => {
      const cloud = MeshBuilder.CreateDisc(`cloud-${index}`, { radius: scale, tessellation: 32 }, this.scene);
      cloud.position = new Vector3(x, y, 3.2 + materialIndex * 0.1);
      cloud.scaling.y = 0.43;
      cloud.material = this.cloudMaterials[materialIndex];
      this.backgroundClouds.push(cloud);
    });
  }

  private createLandscapeLayers() {
    const farHillMaterial = this.createMaterial("far-sage-hills", "#AFC7AB");
    const nearHillMaterial = this.createMaterial("near-sage-hills", "#7FA391");
    const vineMaterial = this.createMaterial("foreground-vines", "#4F7868");

    [[-5.7, -4.34, 3.9, 1.08], [-0.3, -4.43, 4.6, 1.28], [5.5, -4.3, 3.6, 1.04]].forEach(([x, y, width, height], index) => {
      const hill = MeshBuilder.CreateDisc(`far-hill-${index}`, { radius: 1, tessellation: 48 }, this.scene);
      hill.position = new Vector3(x, y, 4.9);
      hill.scaling = new Vector3(width, height, 1);
      hill.material = farHillMaterial;
      this.hillMeshes.push(hill);
    });
    [[-3.5, -4.72, 4.0, .9], [4.2, -4.75, 4.7, .96]].forEach(([x, y, width, height], index) => {
      const hill = MeshBuilder.CreateDisc(`near-hill-${index}`, { radius: 1, tessellation: 48 }, this.scene);
      hill.position = new Vector3(x, y, 4.5);
      hill.scaling = new Vector3(width, height, 1);
      hill.material = nearHillMaterial;
      this.hillMeshes.push(hill);
    });
    [[-7.66, -3.72, .38], [-7.18, -4.05, .29], [7.45, -3.8, .36], [7.74, -4.2, .28]].forEach(([x, y, size], index) => {
      const leaf = MeshBuilder.CreateDisc(`vine-leaf-${index}`, { radius: size, tessellation: 16 }, this.scene);
      leaf.position = new Vector3(x, y, -0.15);
      leaf.scaling.y = 1.65;
      leaf.rotation.z = index % 2 ? .6 : -.55;
      leaf.material = vineMaterial;
      this.vineMeshes.push(leaf);
    });
  }

  private createDistantCastle() {
    const ivory = this.createMaterial("castle-ivory", "#FFF6DD");
    const teal = this.createMaterial("castle-teal", "#3D7D7C");
    const gold = this.goldMaterial;
    const rootX = 5.55;
    const keep = MeshBuilder.CreateBox("castle-keep", { width: 1.22, height: 1.18, depth: 0.1 }, this.scene);
    keep.position = new Vector3(rootX, 2.62, 2.3);
    keep.material = ivory;
    this.castleMeshes.push(keep);

    [-0.72, 0.72].forEach((offset, index) => {
      const tower = MeshBuilder.CreateBox(`castle-tower-${index}`, { width: 0.42, height: 1.6, depth: 0.1 }, this.scene);
      tower.position = new Vector3(rootX + offset, 2.78, 2.3);
      tower.material = ivory;
      const roof = MeshBuilder.CreateCylinder(`castle-roof-${index}`, { diameterTop: 0, diameterBottom: 0.66, height: 0.64, tessellation: 20 }, this.scene);
      roof.position = new Vector3(rootX + offset, 3.9, 2.25);
      roof.material = teal;
      this.castleMeshes.push(tower, roof);
    });
    const flag = MeshBuilder.CreateDisc("castle-flag", { radius: 0.15, tessellation: 3 }, this.scene);
    flag.position = new Vector3(rootX, 3.88, 2.14);
    flag.rotation.z = Math.PI / 2;
    flag.material = gold;
    this.castleMeshes.push(flag);
  }

  private animateCloudStage(delta: number) {
    this.backgroundClouds.forEach((cloud, index) => {
      cloud.position.x -= delta * (0.1 + (index % 3) * 0.035);
      if (cloud.position.x < -9.5) cloud.position.x = 9.4;
    });
  }

  private animateCastle() {
    const bob = Math.sin(this.elapsed * 0.9) * 0.07;
    this.castleMeshes.forEach((mesh) => (mesh.position.y += (mesh.metadata?.castleBob ?? 0) * 0));
    this.castleMeshes.forEach((mesh) => {
      if (!mesh.metadata) mesh.metadata = { baseY: mesh.position.y };
      mesh.position.y = mesh.metadata.baseY + bob;
    });
  }

  private startGame() {
    this.clearRun();
    this.mode = "playing";
    this.score = 0;
    this.velocity = 1.1;
    this.spawnTimer = 0.48;
    this.demoTimer = 0;
    this.player = this.createPlayer();
    this.renderPlayHud();
    void this.sounds.unlock().then(() => this.sounds.launch());
    this.emitSparks(new Vector3(PLAYER_X - 0.5, 0, 0), 7);
  }

  private pauseGame() {
    if (this.mode !== "playing") return;
    this.sounds.menu();
    this.mode = "paused";
    this.ui.innerHTML = `
      <div class="pause-screen">
        <section class="pause-parchment" aria-label="${copy.pause.aria}">
          <p class="eyebrow">${copy.pause.eyebrow}</p>
          <h2>${copy.pause.heading}</h2>
          <p>${copy.pause.message}</p>
          <button class="wax-button" data-action="resume">${copy.pause.resume}</button>
          <button class="text-button" data-action="menu">${copy.pause.menu}</button>
        </section>
      </div>`;
    this.bindCommonActions();
  }

  private resumeGame() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    this.renderPlayHud();
  }

  private endGame() {
    if (this.mode !== "playing") return;
    this.mode = "gameover";
    this.sounds.crash();
    const isBest = this.score > this.bestScore;
    if (isBest) {
      this.bestScore = this.score;
      this.writeBestScore();
    }
    this.ui.innerHTML = `
      <div class="gameover-screen">
        <section class="result-parchment" aria-label="${copy.gameOver.aria}">
          <p class="eyebrow">${copy.gameOver.eyebrow}</p>
          <h2>${this.score === 0 ? copy.gameOver.zeroHeading : copy.gameOver.heading}</h2>
          <div class="result-scores">
            <div><span>${copy.gameOver.distance}</span><strong>${this.score}</strong></div>
            <div><span>${copy.gameOver.best}</span><strong>${this.bestScore}</strong></div>
          </div>
          <p class="result-copy">${isBest ? copy.gameOver.newBest : copy.menu.castleCalling}</p>
          <button class="wax-button" data-action="retry">${copy.gameOver.retry}</button>
          <button class="text-button" data-action="menu">${copy.gameOver.menu}</button>
        </section>
      </div>`;
    this.bindCommonActions();
  }

  private renderMenu() {
    this.mode = "menu";
    const characterCards = (Object.entries(assets.princesses) as [PrincessKey, (typeof assets.princesses)[PrincessKey]][])
      .map(([key, princess]) => `
        <button class="royal-card ${this.selected === key ? "is-selected" : ""}" data-princess="${key}" aria-pressed="${this.selected === key}">
          <span class="card-sun" style="--character-color:${princess.softColor}"></span>
          <span class="paper-princess ${key}" aria-hidden="true"><span class="princess-crown"></span><span class="princess-hair"></span><span class="princess-face"></span><span class="princess-cape"></span><span class="princess-dress"></span></span>
          <span class="character-copy"><strong>${princess.name}</strong><em>${copy.princesses[key].title}</em></span>
          <span class="selection-ring" aria-hidden="true">Selected</span>
        </button>`)
      .join("");

    const active = assets.princesses[this.selected];
    this.ui.innerHTML = `
      <main class="menu-screen">
        <header class="menu-header">
          <div class="brand-lockup"><span class="brand-crown" aria-hidden="true"></span><span>Princess<br/>Castle Flight</span></div>
          <div class="best-badge"><span>${copy.royalRecord}</span><strong>${this.bestScore}</strong></div>
        </header>
        <section class="menu-hero">
          <div class="story-title"><p class="eyebrow">${copy.menu.eyebrow}</p><h1>${copy.menu.titleFirst}<br/><i>${copy.menu.titleAccent}</i></h1><p class="subtitle">${copy.menu.subtitle}</p></div>
          <div class="scene-window" aria-hidden="true"><img src="${assets.reference}" alt="" /><span class="scene-ribbon">${copy.menu.castleCalling}</span></div>
        </section>
        <section class="choice-section" aria-label="Choose a princess">
          <div class="choice-heading"><p class="eyebrow">${copy.menu.chooseFlyer}</p><p>${copy.princesses[this.selected].description}</p></div>
          <div class="royal-cards">${characterCards}</div>
        </section>
        <div class="menu-actions"><button class="wax-button launch-button" data-action="play">${copy.menu.flyAs(active.name)}</button><p class="control-note">${copy.menu.controls}</p></div>
      </main>`;

    this.ui.querySelectorAll<HTMLButtonElement>("[data-princess]").forEach((card) => {
      card.addEventListener("click", () => {
        void this.sounds.unlock().then(() => this.sounds.menu());
        this.selected = card.dataset.princess as PrincessKey;
        this.renderMenu();
      });
    });
    this.bindCommonActions();
  }

  private renderPlayHud() {
    this.domPlayerY = 50;
    this.domPlayerRotation = 0;
    this.ui.innerHTML = `
      <div id="flight-stage" class="flight-stage" aria-hidden="true">
        <div class="sky-ribbon ribbon-one"></div><div class="sky-ribbon ribbon-two"></div>
        <div class="stage-hills stage-hills-far"></div><div class="stage-hills stage-hills-near"></div>
        <div class="stage-castle"><span class="castle-tower left"></span><span class="castle-keep"></span><span class="castle-tower right"></span><i></i></div>
        <div class="stage-vine vine-left"></div><div class="stage-vine vine-right"></div>
        <div id="flight-princess" class="flight-princess ${this.selected}" style="left:24%;top:${this.domPlayerY}%"><span class="flight-crown"></span><span class="flight-hair"></span><span class="flight-face"></span><span class="flight-cape"></span><span class="flight-dress"></span><span class="flight-arm"></span></div>
      </div>
      <div class="play-hud">
        <div class="hud-topline"><div class="mini-brand"><span class="mini-crown" aria-hidden="true"></span><span>${assets.princesses[this.selected].name}</span></div><div class="hud-actions"><button id="sound-button" class="sound-button" aria-label="${this.sounds.isEnabled ? copy.hud.mute : copy.hud.enable}" aria-pressed="${this.sounds.isEnabled}">${this.sounds.isEnabled ? copy.hud.soundOn : copy.hud.soundOff}</button><button id="pause-button" class="pause-button" aria-label="${copy.hud.pause}"><i></i><i></i></button></div></div>
        <div class="score-plaque"><span>${copy.hud.distance}</span><strong id="score-value">0</strong></div>
        <button id="flap-button" class="flap-button" aria-label="${copy.hud.flyHigher}">${copy.hud.flutter}</button>
        <p class="flight-hint">${copy.hud.hint}</p>
      </div>`;
    this.stage = this.ui.querySelector<HTMLDivElement>("#flight-stage");
    this.ui.querySelector<HTMLButtonElement>("#pause-button")?.addEventListener("click", () => this.pauseGame());
    this.ui.querySelector<HTMLButtonElement>("#sound-button")?.addEventListener("click", (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const enabled = this.sounds.toggle();
      button.textContent = enabled ? copy.hud.soundOn : copy.hud.soundOff;
      button.setAttribute("aria-label", enabled ? copy.hud.mute : copy.hud.enable);
      button.setAttribute("aria-pressed", String(enabled));
    });
    this.ui.querySelector<HTMLButtonElement>("#flap-button")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void this.sounds.unlock();
      this.flap();
    });
  }

  private updatePlayHud() {
    const score = this.ui.querySelector("#score-value");
    if (score) {
      score.textContent = String(this.score);
      score.classList.remove("score-pop");
      window.requestAnimationFrame(() => score.classList.add("score-pop"));
    }
  }

  private bindCommonActions() {
    this.ui.querySelector<HTMLButtonElement>("[data-action='play']")?.addEventListener("click", () => this.startGame());
    this.ui.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", () => this.startGame());
    this.ui.querySelector<HTMLButtonElement>("[data-action='resume']")?.addEventListener("click", () => this.resumeGame());
    this.ui.querySelector<HTMLButtonElement>("[data-action='menu']")?.addEventListener("click", () => {
      this.clearRun();
      this.renderMenu();
    });
  }

  private createPlayer() {
    const sprite = new Mesh("royal-flyer", this.scene);
    sprite.position = new Vector3(PLAYER_X, 0, 0.25);
    this.createDomPlayer();
    return sprite;
  }

  private flap() {
    this.velocity = 6.45;
    const currentWorldY = this.player ? this.player.position.y : WORLD_HEIGHT / 2 - (this.domPlayerY / 100) * WORLD_HEIGHT;
    const nextWorldY = Math.min(3.7, currentWorldY + 0.72);
    this.domPlayerY = this.worldYToPercent(nextWorldY);
    this.domPlayerRotation = -0.42;
    if (this.player) {
      this.player.position.y = nextWorldY;
      this.player.rotation.z = this.domPlayerRotation;
    }
    this.updateDomPlayer();
    this.sounds.flap();
    this.emitSparks(new Vector3(PLAYER_X - 0.35, nextWorldY - 0.05, 0), 4);
  }

  private spawnTowerPair() {
    const phase = this.score * 1.73 + this.elapsed * 0.38;
    const gapY = Math.sin(phase) * 1.65 + Math.cos(phase * 0.47) * 0.28;
    const gapSize = Math.max(2.82, 3.45 - this.score * 0.016);
    const x = 9.5;
    const meshes: Mesh[] = [];
    const topHeight = 5 - (gapY + gapSize / 2);
    const bottomHeight = 5 + (gapY - gapSize / 2);

    const element = this.createDomTower(x, topHeight, bottomHeight);
    this.towers.push({ x, gapY, gapSize, scored: false, meshes, element });
  }

  private createDomPlayer() {
    if (!this.stage) return;
    const existing = this.stage.querySelector<HTMLDivElement>("#flight-princess");
    if (existing) {
      this.playerDoll = existing;
      return;
    }
    const doll = document.createElement("div");
    doll.id = "flight-princess";
    doll.className = `flight-princess ${this.selected}`;
    doll.innerHTML = "<span class=\"flight-crown\"></span><span class=\"flight-hair\"></span><span class=\"flight-face\"></span><span class=\"flight-cape\"></span><span class=\"flight-dress\"></span><span class=\"flight-arm\"></span>";
    this.stage.append(doll);
    this.playerDoll = doll;
    this.updateDomPlayer();
  }

  private updateDomPlayer() {
    if (!this.playerDoll) return;
    if (this.player) {
      this.domPlayerY = this.worldYToPercent(this.player.position.y);
      this.domPlayerRotation = this.player.rotation.z;
    }
    this.playerDoll.style.left = `${this.worldXToPercent(this.player?.position.x ?? PLAYER_X)}%`;
    this.playerDoll.style.top = `${this.domPlayerY}%`;
    this.playerDoll.style.transform = `translate(-50%, -50%) rotate(${this.domPlayerRotation}rad)`;
  }

  private createDomTower(x: number, topHeight: number, bottomHeight: number) {
    const gate = document.createElement("div");
    gate.className = "tower-gate";
    gate.style.left = `${this.worldXToPercent(x)}%`;
    gate.innerHTML = `<span class="gate-top" style="height:${(topHeight / WORLD_HEIGHT) * 100}%"><i></i><b></b></span><span class="gate-bottom" style="height:${(bottomHeight / WORLD_HEIGHT) * 100}%"><i></i><b></b></span>`;
    this.stage?.append(gate);
    return gate;
  }

  private worldXToPercent(x: number) {
    return ((x + WORLD_WIDTH / 2) / WORLD_WIDTH) * 100;
  }

  private worldYToPercent(y: number) {
    return ((WORLD_HEIGHT / 2 - y) / WORLD_HEIGHT) * 100;
  }

  private createTower(name: string, x: number, y: number, height: number) {
    const body = MeshBuilder.CreateBox(`tower-${name}`, { width: TOWER_WIDTH, height, depth: 0.18 }, this.scene);
    body.position = new Vector3(x, y, 1.3);
    body.material = this.towerMaterial;
    const edgeY = name === "top" ? y - height / 2 + 0.18 : y + height / 2 - 0.18;
    const roof = MeshBuilder.CreateCylinder(`roof-${name}`, { diameterTop: 0, diameterBottom: 1.68, height: 0.86, tessellation: 4 }, this.scene);
    roof.position = new Vector3(x, edgeY, 1.24);
    roof.rotation.x = 0;
    roof.rotation.z = name === "top" ? Math.PI : 0;
    roof.material = this.roofMaterial;
    const bell = MeshBuilder.CreateDisc(`bell-${name}`, { radius: 0.14, tessellation: 16 }, this.scene);
    bell.position = new Vector3(x, edgeY + (name === "top" ? -0.47 : 0.47), 1.18);
    bell.material = this.goldMaterial;
    return [body, roof, bell];
  }

  private hasCollision() {
    if (!this.player) return false;
    const y = this.player.position.y;
    if (y + PLAYER_HALF_H > 5.05 || y - PLAYER_HALF_H < -5.05) return true;
    return this.towers.some((tower) => {
      const horizontallyOverlapping = Math.abs(tower.x - PLAYER_X) < TOWER_WIDTH / 2 + PLAYER_HALF_W;
      const inTowerBody = y + PLAYER_HALF_H > tower.gapY + tower.gapSize / 2 || y - PLAYER_HALF_H < tower.gapY - tower.gapSize / 2;
      return horizontallyOverlapping && inTowerBody;
    });
  }

  private emitSparks(origin: Vector3, quantity: number) {
    void origin;
    void quantity;
    this.playerDoll?.classList.remove("flutter-pop");
    window.requestAnimationFrame(() => this.playerDoll?.classList.add("flutter-pop"));
  }

  private updateSparks(delta: number) {
    for (let index = this.sparks.length - 1; index >= 0; index -= 1) {
      const spark = this.sparks[index];
      spark.life -= delta;
      spark.mesh.position.addInPlace(spark.velocity.scale(delta));
      spark.velocity.y -= delta * 0.9;
      spark.mesh.visibility = Math.max(0, spark.life / 0.65);
      if (spark.life <= 0) {
        spark.mesh.dispose();
        this.sparks.splice(index, 1);
      }
    }
  }

  private clearRun() {
    this.player?.dispose();
    this.player = null;
    this.playerDoll?.remove();
    this.playerDoll = null;
    this.playerMaterials.forEach((material) => material.dispose());
    this.playerMaterials = [];
    this.towers.splice(0).forEach((tower) => {
      tower.meshes.forEach((mesh) => mesh.dispose());
      tower.element.remove();
    });
    this.sparks.splice(0).forEach((spark) => spark.mesh.dispose());
  }

  private readBestScore() {
    try {
      return Number(window.localStorage.getItem("princess-castle-flight-best") ?? 0);
    } catch {
      return 0;
    }
  }

  private writeBestScore() {
    try {
      window.localStorage.setItem("princess-castle-flight-best", String(this.bestScore));
    } catch {
      // The game remains playable when storage is unavailable.
    }
  }
}
