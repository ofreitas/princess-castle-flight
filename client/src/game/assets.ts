// Storybook Sunbeam asset manifest: generated art drives character identity and menu atmosphere.

export const assets = {
  reference: "./assets/flight-reference.svg",
  logo: "./assets/logo.svg",
  princesses: {
    helena: {
      name: "Helena",
      title: "The Brave",
      color: "#D96B67",
      softColor: "#F9D9C4",
      image: "./assets/princess-helena.svg",
      description: "A warm-hearted flyer with a fearless flutter.",
    },
    eliza: {
      name: "Eliza",
      title: "The Wise",
      color: "#247B7B",
      softColor: "#C8E6E1",
      image: "./assets/princess-eliza.svg",
      description: "A calm thinker who rides the cloud currents.",
    },
    aurora: {
      name: "Aurora",
      title: "The Bright",
      color: "#8B68B1",
      softColor: "#E8D7F0",
      image: "./assets/princess-aurora.svg",
      description: "A curious adventurer with an eye for every opening.",
    },
  },
} as const;

export type PrincessKey = keyof typeof assets.princesses;

