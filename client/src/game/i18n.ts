// Storybook Sunbeam copy: Brazilian browsers receive Portuguese; all other locales keep English.

import type { PrincessKey } from "@/game/assets";

export type GameLanguage = "en" | "pt-BR";

type GameCopy = {
  documentLanguage: GameLanguage;
  royalRecord: string;
  menu: {
    eyebrow: string;
    titleFirst: string;
    titleAccent: string;
    subtitle: string;
    castleCalling: string;
    chooseFlyer: string;
    flyAs: (name: string) => string;
    controls: string;
  };
  princesses: Record<PrincessKey, { title: string; description: string }>;
  pause: { eyebrow: string; heading: string; message: string; resume: string; menu: string; aria: string };
  gameOver: { eyebrow: string; zeroHeading: string; heading: string; distance: string; best: string; newBest: string; retry: string; menu: string; aria: string };
  hud: { distance: string; soundOn: string; soundOff: string; mute: string; enable: string; pause: string; flutter: string; flyHigher: string; hint: string };
};

const english: GameCopy = {
  documentLanguage: "en",
  royalRecord: "Royal record",
  menu: {
    eyebrow: "A one-touch fairytale arcade",
    titleFirst: "Fly for the",
    titleAccent: "faraway castle.",
    subtitle: "Guide your princess through the tower gates. Every clear opening adds to her royal distance.",
    castleCalling: "The castle is calling",
    chooseFlyer: "Choose your royal flyer",
    flyAs: (name) => `Fly as ${name}`,
    controls: "Tap to rise · Avoid the towers · Reach for the castle",
  },
  princesses: {
    helena: { title: "The Brave", description: "A warm-hearted flyer with a fearless flutter." },
    eliza: { title: "The Wise", description: "A calm thinker who rides the cloud currents." },
    aurora: { title: "The Bright", description: "A curious adventurer with an eye for every opening." },
  },
  pause: { eyebrow: "A royal breath", heading: "Flight paused", message: "The castle waits in the clouds.", resume: "Resume flight", menu: "Return to the story", aria: "Game paused" },
  gameOver: { eyebrow: "The clouds closed in", zeroHeading: "One more flutter", heading: "A royal flight", distance: "Distance", best: "Best", newBest: "A new tale for the royal record.", retry: "Fly again", menu: "Choose another princess", aria: "Flight results" },
  hud: { distance: "Distance", soundOn: "Sound on", soundOff: "Sound off", mute: "Mute sounds", enable: "Enable sounds", pause: "Pause game", flutter: "Flutter up", flyHigher: "Fly higher", hint: "Tap anywhere, press Space, or use Flutter up" },
};

const brazilianPortuguese: GameCopy = {
  documentLanguage: "pt-BR",
  royalRecord: "Recorde real",
  menu: {
    eyebrow: "Um conto de fadas de um toque",
    titleFirst: "Voe até o",
    titleAccent: "castelo distante.",
    subtitle: "Guie sua princesa pelas torres. Cada passagem livre aumenta sua distância real.",
    castleCalling: "O castelo chama",
    chooseFlyer: "Escolha sua princesa voadora",
    flyAs: (name) => `Voar como ${name}`,
    controls: "Toque para subir · Desvie das torres · Alcance o castelo",
  },
  princesses: {
    helena: { title: "A Corajosa", description: "Uma voadora de coração quente e asas destemidas." },
    eliza: { title: "A Sábia", description: "Uma pensadora serena que segue as correntes das nuvens." },
    aurora: { title: "A Radiante", description: "Uma aventureira curiosa que encontra cada passagem." },
  },
  pause: { eyebrow: "Um respiro real", heading: "Voo pausado", message: "O castelo espera nas nuvens.", resume: "Continuar o voo", menu: "Voltar à história", aria: "Jogo pausado" },
  gameOver: { eyebrow: "As nuvens se fecharam", zeroHeading: "Mais uma tentativa", heading: "Um voo real", distance: "Distância", best: "Recorde", newBest: "Um novo capítulo para o recorde real.", retry: "Voar novamente", menu: "Escolher outra princesa", aria: "Resultado do voo" },
  hud: { distance: "Distância", soundOn: "Som ligado", soundOff: "Som desligado", mute: "Silenciar sons", enable: "Ativar sons", pause: "Pausar jogo", flutter: "Subir", flyHigher: "Subir", hint: "Toque em qualquer lugar, aperte Espaço ou use Subir" },
};

function detectLanguage(): GameLanguage {
  const override = new URLSearchParams(window.location.search).get("locale")?.toLowerCase();
  const locales = override ? [override] : [navigator.language, ...(navigator.languages ?? [])].map((locale) => locale.toLowerCase());
  return locales.some((locale) => locale === "pt-br") ? "pt-BR" : "en";
}

export const gameLanguage = detectLanguage();
export const copy = gameLanguage === "pt-BR" ? brazilianPortuguese : english;
