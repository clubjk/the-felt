import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChartView } from "@/components/views/ChartView";
import { DrillView } from "@/components/views/DrillView";
import { MenuView } from "@/components/views/MenuView";
import { PlayView } from "@/components/views/PlayView";
import { StatsView } from "@/components/views/StatsView";
import { attachUnlock } from "@/lib/blackjack/audio";
import { useGame } from "@/lib/blackjack/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
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
