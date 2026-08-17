// Storybook Sunbeam gameplay: a direct DOM animation loop built for reliable mobile interaction.

import { assets, type PrincessKey } from "@/game/assets";
import { copy, gameLanguage } from "@/game/i18n";
import { SoundManager } from "@/game/SoundManager";

type Mode = "menu" | "playing" | "paused" | "gameover";
type Tower = { x: number; gapY: number; gapSize: number; scored: boolean; element: HTMLDivElement };

const PLAYER_X = 24;

export class DomFlightGame {
  private mode: Mode = "menu";
  private selected: PrincessKey = "helena";
  private bestScore = this.readBestScore();
  private score = 0;
  private playerY = 50;
  private velocity = 0;
  private lastFrame = 0;
  private spawnElapsed = 0;
  private demoElapsed = 0;
  private frameId = 0;
  private towers: Tower[] = [];
  private princess: HTMLDivElement | null = null;
  private towerLayer: HTMLDivElement | null = null;
  private readonly sounds = new SoundManager();
  private readonly isDemo = new URLSearchParams(window.location.search).has("demo");

  private readonly onStagePointer = (event: PointerEvent) => {
    if (this.mode !== "playing") return;
    if ((event.target as HTMLElement | null)?.closest("button")) return;
    event.preventDefault();
    this.flutter();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if ((event.code === "Space" || event.code === "ArrowUp") && this.mode === "playing") {
      event.preventDefault();
      this.flutter();
    }
    if (event.code === "Escape" && this.mode === "playing") this.pause();
  };

  constructor(private readonly root: HTMLDivElement) {
    document.documentElement.lang = gameLanguage;
    this.root.addEventListener("pointerdown", this.onStagePointer, { passive: false });
    window.addEventListener("keydown", this.onKeyDown);
    this.renderMenu();
    if (this.isDemo) window.setTimeout(() => this.start(), 240);
  }

  dispose() {
    window.cancelAnimationFrame(this.frameId);
    this.root.removeEventListener("pointerdown", this.onStagePointer);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private start() {
    this.stopLoop();
    this.mode = "playing";
    this.score = 0;
    this.playerY = 50;
    this.velocity = 0;
    this.spawnElapsed = 0;
    this.demoElapsed = 0;
    this.towers = [];
    this.renderPlay();
    void this.sounds.unlock().then(() => this.sounds.launch());
    this.lastFrame = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number) => {
    if (this.mode !== "playing") return;
    const delta = Math.min((now - this.lastFrame) / 1000, 0.034);
    this.lastFrame = now;

    if (this.isDemo) {
      this.demoElapsed += delta;
      if (this.demoElapsed > 0.56) {
        this.flutter();
        this.demoElapsed = 0;
      }
    }

    this.velocity += 66 * delta;
    this.playerY += this.velocity * delta;
    this.spawnElapsed += delta;
    if (this.spawnElapsed >= 1.55) {
      this.spawnElapsed = 0;
      this.spawnTower();
    }

    const speed = 29 + Math.min(this.score * 0.22, 6);
    this.towers.forEach((tower) => {
      tower.x -= speed * delta;
      tower.element.style.left = `${tower.x}%`;
      if (!tower.scored && tower.x + 5 < PLAYER_X) {
        tower.scored = true;
        this.score += 1;
        this.sounds.score();
        this.updateScore();
      }
    });
    this.towers = this.towers.filter((tower) => {
      if (tower.x < -16) {
        tower.element.remove();
        return false;
      }
      return true;
    });

    this.updatePrincess();
    if (!this.isDemo && this.hasCollision()) {
      this.gameOver();
      return;
    }
    this.frameId = requestAnimationFrame(this.tick);
  };

  private flutter() {
    if (this.mode !== "playing") return;
    void this.sounds.unlock();
    this.velocity = -42;
    this.playerY = Math.max(7, this.playerY - 1.8);
    this.updatePrincess(true);
    this.sounds.flap();
  }

  private spawnTower() {
    if (!this.towerLayer) return;
    const gapSize = Math.max(27, 35 - this.score * 0.08);
    const gapY = 32 + ((this.score * 17 + this.towers.length * 23) % 32);
    const topHeight = Math.max(11, gapY - gapSize / 2);
    const bottomHeight = Math.max(11, 100 - (gapY + gapSize / 2));
    const element = document.createElement("div");
    element.className = "tower-gate";
    element.style.left = "112%";
    element.innerHTML = `<span class="gate-top" style="height:${topHeight}%"><i></i><b></b></span><span class="gate-bottom" style="height:${bottomHeight}%"><i></i><b></b></span>`;
    this.towerLayer.append(element);
    this.towers.push({ x: 112, gapY, gapSize, scored: false, element });
  }

  private hasCollision() {
    if (this.playerY < 7 || this.playerY > 93) return true;
    return this.towers.some((tower) => {
      const overlapping = tower.x - 5 < PLAYER_X + 4 && tower.x + 5 > PLAYER_X - 4;
      const outsideGap = this.playerY - 5 < tower.gapY - tower.gapSize / 2 || this.playerY + 5 > tower.gapY + tower.gapSize / 2;
      return overlapping && outsideGap;
    });
  }

  private updatePrincess(pop = false) {
    if (!this.princess) return;
    this.princess.style.top = `${this.playerY}%`;
    this.princess.style.transform = `translate(-50%, -50%) rotate(${Math.max(-0.45, Math.min(0.48, this.velocity * 0.012))}rad)`;
    if (pop) {
      this.princess.classList.remove("flutter-pop");
      requestAnimationFrame(() => this.princess?.classList.add("flutter-pop"));
    }
  }

  private pause() {
    if (this.mode !== "playing") return;
    this.mode = "paused";
    this.stopLoop();
    this.sounds.menu();
    this.root.innerHTML = `<div class="pause-screen"><section class="pause-parchment" aria-label="${copy.pause.aria}"><p class="eyebrow">${copy.pause.eyebrow}</p><h2>${copy.pause.heading}</h2><p>${copy.pause.message}</p><button class="wax-button" data-action="resume">${copy.pause.resume}</button><button class="text-button" data-action="menu">${copy.pause.menu}</button></section></div>`;
    this.bindActions();
  }

  private resume() {
    if (this.mode !== "paused") return;
    this.mode = "playing";
    this.renderPlay();
    this.lastFrame = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  private gameOver() {
    this.mode = "gameover";
    this.stopLoop();
    this.sounds.crash();
    const isBest = this.score > this.bestScore;
    if (isBest) {
      this.bestScore = this.score;
      this.writeBestScore();
    }
    this.root.innerHTML = `<div class="gameover-screen"><section class="result-parchment" aria-label="${copy.gameOver.aria}"><p class="eyebrow">${copy.gameOver.eyebrow}</p><h2>${this.score === 0 ? copy.gameOver.zeroHeading : copy.gameOver.heading}</h2><div class="result-scores"><div><span>${copy.gameOver.distance}</span><strong>${this.score}</strong></div><div><span>${copy.gameOver.best}</span><strong>${this.bestScore}</strong></div></div><p class="result-copy">${isBest ? copy.gameOver.newBest : copy.menu.castleCalling}</p><button class="wax-button" data-action="retry">${copy.gameOver.retry}</button><button class="text-button" data-action="menu">${copy.gameOver.menu}</button></section></div>`;
    this.bindActions();
  }

  private renderMenu() {
    this.stopLoop();
    this.mode = "menu";
    const cards = (Object.entries(assets.princesses) as [PrincessKey, (typeof assets.princesses)[PrincessKey]][])
      .map(([key, princess]) => `<button class="royal-card ${this.selected === key ? "is-selected" : ""}" data-princess="${key}" aria-pressed="${this.selected === key}"><span class="card-sun" style="--character-color:${princess.softColor}"></span><span class="paper-princess ${key}" aria-hidden="true"><span class="princess-crown"></span><span class="princess-hair"></span><span class="princess-face"></span><span class="princess-cape"></span><span class="princess-dress"></span></span><span class="character-copy"><strong>${princess.name}</strong><em>${copy.princesses[key].title}</em></span><span class="selection-ring" aria-hidden="true">Selected</span></button>`)
      .join("");
    const active = assets.princesses[this.selected];
    this.root.innerHTML = `<main class="menu-screen"><header class="menu-header"><div class="brand-lockup"><span class="brand-crown" aria-hidden="true"></span><span>Princess<br/>Castle Flight</span></div><div class="best-badge"><span>${copy.royalRecord}</span><strong>${this.bestScore}</strong></div></header><section class="menu-hero"><div class="story-title"><p class="eyebrow">${copy.menu.eyebrow}</p><h1>${copy.menu.titleFirst}<br/><i>${copy.menu.titleAccent}</i></h1><p class="subtitle">${copy.menu.subtitle}</p></div><div class="scene-window" aria-hidden="true"><img src="${assets.reference}" alt=""/><span class="scene-ribbon">${copy.menu.castleCalling}</span></div></section><section class="choice-section" aria-label="${copy.menu.chooseFlyer}"><div class="choice-heading"><p class="eyebrow">${copy.menu.chooseFlyer}</p><p>${copy.princesses[this.selected].description}</p></div><div class="royal-cards">${cards}</div></section><div class="menu-actions"><button class="wax-button launch-button" data-action="play">${copy.menu.flyAs(active.name)}</button><p class="control-note">${copy.menu.controls}</p></div></main>`;
    this.root.querySelectorAll<HTMLButtonElement>("[data-princess]").forEach((card) => {
      card.addEventListener("click", () => {
        this.selected = card.dataset.princess as PrincessKey;
        void this.sounds.unlock().then(() => this.sounds.menu());
        this.renderMenu();
      });
    });
    this.bindActions();
  }

  private renderPlay() {
    const gates = this.towers.map((tower) => `<div class="tower-gate" style="left:${tower.x}%"><span class="gate-top" style="height:${tower.gapY - tower.gapSize / 2}%"><i></i><b></b></span><span class="gate-bottom" style="height:${100 - (tower.gapY + tower.gapSize / 2)}%"><i></i><b></b></span></div>`).join("");
    this.root.innerHTML = `<div class="flight-stage"><div class="sky-ribbon ribbon-one"></div><div class="sky-ribbon ribbon-two"></div><div class="stage-hills stage-hills-far"></div><div class="stage-hills stage-hills-near"></div><div class="stage-castle"><span class="castle-tower left"></span><span class="castle-keep"></span><span class="castle-tower right"></span><i></i></div><div class="stage-vine vine-left"></div><div class="stage-vine vine-right"></div><div id="dom-towers">${gates}</div><div id="flight-princess" class="flight-princess ${this.selected}" style="left:${PLAYER_X}%;top:${this.playerY}%"><span class="flight-crown"></span><span class="flight-hair"></span><span class="flight-face"></span><span class="flight-cape"></span><span class="flight-dress"></span><span class="flight-arm"></span></div></div><div class="play-hud"><div class="hud-topline"><div class="mini-brand"><span class="mini-crown" aria-hidden="true"></span><span>${assets.princesses[this.selected].name}</span></div><div class="hud-actions"><button id="sound-button" class="volume-button" data-sound-state="${this.sounds.isEnabled ? "on" : "off"}" aria-label="${this.sounds.isEnabled ? copy.hud.mute : copy.hud.enable}" aria-pressed="${this.sounds.isEnabled}"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="speaker" d="M4 10h4l5-4v12l-5-4H4z"/><path class="volume-wave wave-one" d="M16 9.5c1.2 1.4 1.2 3.6 0 5"/><path class="volume-wave wave-two" d="M19 7c2.5 2.8 2.5 7.2 0 10"/><path class="volume-mute" d="m16 9 5 6m0-6-5 6"/></svg></button><button id="pause-button" class="pause-button" aria-label="${copy.hud.pause}"><i></i><i></i></button></div></div><div class="score-plaque"><span>${copy.hud.distance}</span><strong id="score-value">${this.score}</strong></div><button id="flap-button" class="flap-button" aria-label="${copy.hud.flyHigher}">${copy.hud.flutter}</button><p class="flight-hint">${copy.hud.hint}</p></div>`;
    this.princess = this.root.querySelector<HTMLDivElement>("#flight-princess");
    this.towerLayer = this.root.querySelector<HTMLDivElement>("#dom-towers");
    this.towers.forEach((tower, index) => {
      tower.element = this.towerLayer?.children[index] as HTMLDivElement;
    });
    this.root.querySelector<HTMLButtonElement>("#flap-button")?.addEventListener("click", () => this.flutter());
    this.root.querySelector<HTMLButtonElement>("#pause-button")?.addEventListener("click", () => this.pause());
    this.root.querySelector<HTMLButtonElement>("#sound-button")?.addEventListener("click", (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const enabled = this.sounds.toggle();
      button.dataset.soundState = enabled ? "on" : "off";
      button.setAttribute("aria-label", enabled ? copy.hud.mute : copy.hud.enable);
      button.setAttribute("aria-pressed", String(enabled));
    });
  }

  private bindActions() {
    this.root.querySelector<HTMLButtonElement>("[data-action='play']")?.addEventListener("click", () => this.start());
    this.root.querySelector<HTMLButtonElement>("[data-action='retry']")?.addEventListener("click", () => this.start());
    this.root.querySelector<HTMLButtonElement>("[data-action='resume']")?.addEventListener("click", () => this.resume());
    this.root.querySelector<HTMLButtonElement>("[data-action='menu']")?.addEventListener("click", () => this.renderMenu());
  }

  private updateScore() {
    const score = this.root.querySelector("#score-value");
    if (!score) return;
    score.textContent = String(this.score);
    score.classList.remove("score-pop");
    requestAnimationFrame(() => score.classList.add("score-pop"));
  }

  private stopLoop() {
    window.cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  private readBestScore() {
    try { return Number.parseInt(window.localStorage.getItem("princess-castle-flight-best") ?? "0", 10) || 0; } catch { return 0; }
  }

  private writeBestScore() {
    try { window.localStorage.setItem("princess-castle-flight-best", String(this.bestScore)); } catch { /* Storage is optional. */ }
  }
}
