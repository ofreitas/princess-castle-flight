// Storybook Sunbeam game host: React provides the frame; the DOM game owns reliable mobile animation.

import { useEffect, useRef } from "react";
import { DomFlightGame } from "@/game/DomFlightGame";

export default function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || startedRef.current) return;
    startedRef.current = true;
    const game = new DomFlightGame(host);

    return () => {
      game.dispose();
      startedRef.current = false;
    };
  }, []);

  return <div ref={hostRef} className="game-shell" aria-live="polite" />;
}
