import { useState } from "react";
import { BookOpen, ChartColumn, Check, Play, Share2, Target, Volume2, VolumeX } from "lucide-react";
import { CardFan } from "@/components/cards/PlayingCard";
import { Button } from "@/components/ui/button";
import { formatMoney, pct } from "@/lib/blackjack/format";
import { useGame } from "@/lib/blackjack/store";
import type { Card } from "@/lib/blackjack/types";

const DEALER: Card[] = [
  { rank: "10", suit: "diamonds", id: "menu-d1" },
  { rank: "6", suit: "clubs", id: "menu-d2" },
];

const PLAYER: Card[] = [
  { rank: "A", suit: "spades", id: "menu-p1" },
  { rank: "K", suit: "hearts", id: "menu-p2" },
];

const COACH = [
  { id: "after" as const, label: "Review after" },
  { id: "hint" as const, label: "Hint first" },
  { id: "strict" as const, label: "Strict" },
];

const SHARE = {
  title: "The Felt",
  text: "Blackjack trainer. Sit across from the dealer and learn basic strategy.",
};

export function MenuView() {
  const sitDown = useGame((s) => s.sitDown);
  const startDrill = useGame((s) => s.startDrill);
  const setView = useGame((s) => s.setView);
  const coachMode = useGame((s) => s.coachMode);
  const setCoachMode = useGame((s) => s.setCoachMode);
  const sound = useGame((s) => s.sound);
  const setSound = useGame((s) => s.setSound);
  const hitSoft17 = useGame((s) => s.rules.hitSoft17);
  const lateSurrender = useGame((s) => s.rules.lateSurrender);
  const setHitSoft17 = useGame((s) => s.setHitSoft17);
  const setLateSurrender = useGame((s) => s.setLateSurrender);
  const decisions = useGame((s) => s.decisions);
  const correct = useGame((s) => s.correct);
  const bankroll = useGame((s) => s.bankroll);
  const [shareLabel, setShareLabel] = useState<"Share" | "Copied">("Share");

  async function shareApp() {
    const url = window.location.origin;
    const payload = { ...SHARE, url };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
        return;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(`${payload.title} — ${payload.url}`);
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div
        className="felt-rail rise-in relative overflow-hidden rounded-2xl bg-felt-deep/80 px-3 pb-4 pt-3 sm:px-5"
        aria-label="Blackjack table. Dealer showing ten, hole card down. You have Ace King, blackjack."
      >
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-subtle">Dealer</p>
        <div className="mt-1.5">
          <CardFan cards={DEALER} hideHole size="sm" />
        </div>

        <div className="bj-arc mt-2">
          <span>Insurance pays 2 to 1</span>
        </div>

        <p className="rise-in stagger-1 text-center text-xs font-medium uppercase tracking-[0.38em] text-muted">
          The Felt
        </p>
        <h1 className="rise-in stagger-2 text-center font-display text-4xl font-medium tracking-tight sm:text-5xl">
          Blackjack
        </h1>
        <p className="rise-in stagger-3 text-center text-xs font-medium uppercase tracking-[0.28em] text-subtle">
          Pays 3 to 2
        </p>

        <div className="mt-3">
          <CardFan cards={PLAYER} size="sm" startDelay={180} />
        </div>
        <p className="mt-1.5 text-center font-display text-lg tabular-nums">21</p>
        <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-subtle">You</p>
      </div>

      <p className="rise-in stagger-3 mx-auto mt-4 max-w-sm text-center text-muted">
        Sit across from the dealer. Every hit, stand, double, and split is graded against basic strategy.
      </p>

      <div className="rise-in stagger-4 mt-5 flex flex-col gap-3">
        <Button size="xl" className="w-full justify-between pl-5 pr-4" onClick={sitDown}>
          <span className="flex items-center gap-2">
            <Play className="size-4" />
            Sit down
          </span>
          <span className="text-sm font-normal opacity-70">{formatMoney(bankroll)}</span>
        </Button>
        <Button variant="secondary" size="lg" className="w-full justify-start pl-5" onClick={() => startDrill("mixed")}>
          <Target className="size-4" />
          Spot trainer
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" size="lg" onClick={() => setView("chart")}>
            <BookOpen className="size-4" />
            Chart
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setView("stats")}>
            <ChartColumn className="size-4" />
            Record
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-subtle">Coach</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {COACH.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCoachMode(c.id)}
              className={
                coachMode === c.id
                  ? "h-11 rounded-md bg-accent px-2 text-sm font-medium text-accent-fg"
                  : "h-11 rounded-md bg-surface-2 px-2 text-sm text-muted"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {coachMode === "after" && "Play freely. The book play is shown after each decision."}
          {coachMode === "hint" && "The correct action is shown before you act."}
          {coachMode === "strict" && "Wrong actions are blocked. You take the book play."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <Toggle on={hitSoft17} onClick={() => setHitSoft17(!hitSoft17)} label={hitSoft17 ? "H17" : "S17"} />
        <Toggle on={lateSurrender} onClick={() => setLateSurrender(!lateSurrender)} label="Late surrender" />
        <button
          type="button"
          onClick={() => setSound(!sound)}
          className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label={sound ? "Mute" : "Unmute"}
        >
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          Sound
        </button>
        <button
          type="button"
          onClick={() => void shareApp()}
          className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Share The Felt"
        >
          {shareLabel === "Copied" ? <Check className="size-4" /> : <Share2 className="size-4" />}
          {shareLabel}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-subtle">
        6-deck · DAS · {hitSoft17 ? "dealer hits soft 17" : "dealer stands soft 17"}
        {decisions > 0 ? ` · ${pct(correct / decisions)} book` : ""}
      </p>
    </div>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        on
          ? "h-11 rounded-md bg-surface-2 px-3 font-medium text-fg shadow-[var(--shadow-border)]"
          : "h-11 rounded-md px-3 text-muted hover:bg-surface-2"
      }
    >
      {label}
    </button>
  );
}
