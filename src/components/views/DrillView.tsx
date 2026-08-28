import { CardFan, PlayingCard } from "@/components/cards/PlayingCard";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { hintLine } from "@/lib/blackjack/explain";
import { actionLabel, describeSituation, optimalAction } from "@/lib/blackjack/strategy";
import { useGame } from "@/lib/blackjack/store";
import { cn } from "@/lib/utils";
import type { DrillFocus } from "@/lib/blackjack/drills";
import type { CoachAction } from "@/lib/blackjack/types";

const FOCI: { id: DrillFocus; label: string }[] = [
  { id: "mixed", label: "Mixed" },
  { id: "hard", label: "Hard" },
  { id: "soft", label: "Soft" },
  { id: "pairs", label: "Pairs" },
  { id: "weak", label: "Weak spots" },
];

export function DrillView() {
  const drill = useGame((s) => s.drill);
  const rules = useGame((s) => s.rules);
  const lastCoach = useGame((s) => s.lastCoach);
  const streak = useGame((s) => s.streak);
  const decisions = useGame((s) => s.decisions);
  const correct = useGame((s) => s.correct);
  const setView = useGame((s) => s.setView);
  const startDrill = useGame((s) => s.startDrill);
  const drillAct = useGame((s) => s.drillAct);
  const drillNext = useGame((s) => s.drillNext);

  if (!drill) return null;

  const resolved = drill.resolved;
  const insurance = drill.spot.kind === "insurance";
  const book = insurance
    ? null
    : optimalAction(drill.player, drill.dealer, rules, drill.legal);
  const bookAction: CoachAction | null = resolved
    ? null
    : insurance
      ? "noInsurance"
      : book?.action ?? null;
  const hint = insurance
    ? "Insurance vs Ace — Pass on insurance"
    : book
      ? hintLine(book.action, book.kind, book.total, drill.dealer.rank)
      : null;

  const acc = decisions === 0 ? null : Math.round((correct / decisions) * 100);
  const title = describeSituation(drill.spot.kind, drill.spot.total, drill.dealer.rank);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <TopBar
        title="Spot trainer"
        onBack={() => setView("menu")}
        right={
          <div className="flex items-center gap-3 text-sm tabular-nums text-muted">
            {acc !== null && <span className="text-fg">{acc}%</span>}
            {streak > 1 && <span>{streak}</span>}
          </div>
        }
      />

      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        {FOCI.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => startDrill(f.id)}
            className={
              drill.focus === f.id
                ? "h-10 shrink-0 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg"
                : "h-10 shrink-0 rounded-md bg-surface-2 px-3 text-sm text-muted"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="felt-rail flex flex-1 flex-col rounded-2xl bg-felt-deep/80 px-3 py-6">
          <p className="text-center text-xs font-medium uppercase tracking-[0.22em] text-subtle">Dealer</p>
          <div className="mt-3 flex justify-center">
            <PlayingCard card={drill.dealer} />
          </div>
          <p className="mt-8 text-center text-xs font-medium uppercase tracking-[0.22em] text-subtle">You</p>
          <div className="mt-3 flex justify-center">
            <CardFan cards={drill.player} />
          </div>
          <p className="mt-4 text-center font-display text-lg">{title}</p>
        </div>

        <div className="mt-4 min-h-24">
          {resolved ? (
            <div
              className={
                resolved.correct
                  ? "rounded-lg bg-good/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-good)_35%,transparent)]"
                  : "rounded-lg bg-bad/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-bad)_35%,transparent)]"
              }
            >
              <p className="font-medium">{resolved.label}</p>
              <p className="mt-1 text-sm text-muted">{resolved.why}</p>
            </div>
          ) : lastCoach && !hint ? (
            <div className="rounded-lg bg-bad/10 px-4 py-3">
              <p className="font-medium">{lastCoach.label}</p>
              <p className="mt-1 text-sm text-muted">{lastCoach.why}</p>
            </div>
          ) : hint ? (
            <div className="rounded-lg bg-good/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-good)_35%,transparent)]">
              <p className="font-medium">Book play: {bookAction ? actionLabel(bookAction) : ""}</p>
              <p className="mt-1 text-sm text-muted">{hint}</p>
            </div>
          ) : (
            <p className="px-1 text-center text-sm text-subtle">What does the book say?</p>
          )}
        </div>

        {resolved ? (
          <Button size="lg" className="mt-3 w-full" onClick={drillNext}>
            Next spot
          </Button>
        ) : insurance ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <DrillBtn label="Pass" book={bookAction === "noInsurance"} on={() => drillAct("pass")} on_ />
            <DrillBtn label="Take insurance" on={() => drillAct("take")} on_ />
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <DrillBtn label="Hit" book={bookAction === "hit"} on={() => drillAct("hit")} on_={drill.legal.hit} />
            <DrillBtn label="Stand" book={bookAction === "stand"} on={() => drillAct("stand")} on_={drill.legal.stand} />
            <DrillBtn label="Double" book={bookAction === "double"} on={() => drillAct("double")} on_={drill.legal.double} />
            <DrillBtn label="Split" book={bookAction === "split"} on={() => drillAct("split")} on_={drill.legal.split} />
            <DrillBtn
              label="Surrender"
              className="col-span-2 sm:col-span-1"
              book={bookAction === "surrender"}
              on={() => drillAct("surrender")}
              on_={drill.legal.surrender}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DrillBtn({
  label,
  on,
  on_,
  book,
  className,
}: {
  label: string;
  on: () => void;
  on_: boolean;
  book?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant={book ? "book" : "secondary"}
      size="lg"
      disabled={!on_}
      onClick={on}
      className={cn(className, book && "book-play")}
      aria-current={book ? "true" : undefined}
      aria-label={book ? `${label}, book play` : label}
    >
      <span>{label}</span>
      {book && <span className="text-[0.65rem] font-medium uppercase tracking-wide opacity-70">Book</span>}
    </Button>
  );
}