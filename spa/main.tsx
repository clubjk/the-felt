import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ChartView } from "@/components/views/ChartView";
import { DrillView } from "@/components/views/DrillView";
import { MenuView } from "@/components/views/MenuView";
import { PlayView } from "@/components/views/PlayView";
import { StatsView } from "@/components/views/StatsView";
import { attachUnlock } from "@/lib/blackjack/audio";
import { useGame } from "@/lib/blackjack/store";
import "../src/styles.css";

function App() {
  const hydrated = useGame((s) => s.hydrated);
  const view = useGame((s) => s.view);
  const hydrate = useGame((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    return attachUnlock();
  }, [hydrate]);

  return (
    <main className="felt-page">
      {!hydrated || view === "menu" ? <MenuView /> : null}
      {hydrated && view === "play" ? <PlayView /> : null}
      {hydrated && view === "drill" ? <DrillView /> : null}
      {hydrated && view === "chart" ? <ChartView /> : null}
      {hydrated && view === "stats" ? <StatsView /> : null}
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
