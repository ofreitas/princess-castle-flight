// Storybook Sunbeam app shell: the full-screen game canvas is the complete home route.

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import GameCanvas from "@/components/GameCanvas";
import { ThemeProvider } from "@/contexts/ThemeContext";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <GameCanvas />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

