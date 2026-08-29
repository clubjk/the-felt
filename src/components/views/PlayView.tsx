import { useEffect } from "react";
import { CardFan } from "@/components/cards/PlayingCard";
import { Chip } from "@/components/cards/Chip";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { dealerDisplay, legalForActive, cardsAheadOfCut } from "@/lib/blackjack/engine";
import { formatMoney, signedMoney } from "@/lib/blackjack/format";
import { formatTotal } from "@/lib/blackjack/hand";
import { hintLine } from "@/lib/blackjack/explain";
import { actionLabel, optimalAction } from "@/lib/blackjack/strategy";
import { useGame } from "@/lib/blackjack/store";
import { cn } from "@/lib/utils";
import { CHIP_VALUES, MIN_BET, STARTING_BANKROLL, type Action } from "@/lib/blackjack/types";

export function PlayView() {
  const table = useGame((s) => s.table);
  const rules = useGame((s) => s.rules);
  const busy = useGame((s) => s.busy);
  const lastCoach = useGame((s) => s.lastCoach);
  const bankroll = useGame((s) => s.bankroll);
  const streak = useGame((s) => s.streak);
  const decisions = useGame((s) => s.decisions);
  const correct = useGame((s) => s.correct);
  const setView = useGame((s) => s.setView);
  const addChip = useGame((s) => s.addChip);
  const clearBet = useGame((s) => s.clearBet);
  const deal = useGame((s) => s.deal);
  const act = useGame((s) => s.act);
  const insure = useGame((s) => s.insure);
  const nextHand = useGame((s) => s.nextHand);
  const rebuy = useGame((s) => s.rebuy);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = useGame.getState().table;
      if (!t) return;
      if (e.key === "Escape") {
        useGame.getState().setView("menu");
        return;
      }
      if (t.phase === "betting") {
        if (e.key === "1") useGame.getState().addChip(5);
        if (e.key === "2") useGame.getState().addChip(25);
        if (e.key === "3") useGame.getState().addChip(100);
        if (e.key === "4") useGame.getState().addChip(500);
        if (e.key === "Backspace") useGame.getState().clearBet();
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          void useGame.getState().deal();
        }
      }
      if (t.phase === "insurance") {
        if (e.key === "n" || e.key === "N") useGame.getState().insure("pass");
        if (e.key === "y" || e.key === "Y") useGame.getState().insure("take");
      }
      if (t.phase === "player") {
        const map: Record<string, Action> = {
          h: "hit",
          H: "hit",
          s: "stand",
          S: "stand",
          d: "double",
          D: "double",
          p: "split",
          P: "split",
          r: "surrender",
          R: "surrender",
        };
        const a = map[e.key];
        if (a) useGame.getState().act(a);
      }
      if (t.phase === "settle" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        useGame.getState().nextHand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!table) return null;

  const hand = table.playerHands[table.active];
  const legal = legalForActive(table, rules);
  const acc = decisions === 0 ? null : Math.round((correct / decisions) * 100);
  const book =
    table.phase === "player" && hand && table.dealer[0]
      ? optimalAction(hand.cards, table.dealer[0], rules, legal)
      : null;
  const bookAction = table.phase === "insurance" ? "noInsurance" : book?.action ?? null;
  const hint = book
    ? hintLine(book.action, book.kind, book.total, table.dealer[0]!.rank)
    : table.phase === "insurance"
      ? "Insurance vs Ace — Pass on insurance"
      : null;

  const broke = table.phase === "betting" && bankroll < MIN_BET;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col">
      <TopBar
        title="The Felt"
        onBack={() => setView("menu")}
        right={
          <div className="flex items-center gap-3 text-sm tabular-nums text-muted">
            {acc !== null && <span className="text-fg">{acc}%</span>}
            {streak > 1 && <span>{streak} streak</span>}
            <span className="font-medium text-fg">{formatMoney(bankroll)}</span>
          </div>
        }
      />

      <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="felt-rail flex flex-1 flex-col rounded-2xl bg-felt-deep/80 px-3 py-5 sm:px-6">
          <section className="flex flex-col items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-subtle">Dealer</p>
            {table.dealer.length > 0 && table.phase !== "betting" ? (
              <>
                <CardFan cards={table.dealer} hideHole={!table.holeRevealed} />
                <p className="font-display text-lg tabular-nums text-fg">
                  {dealerDisplay(table.dealer, table.holeRevealed)}
                </p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-subtle">
                {table.phase === "shuffle" ? "Shuffling and cutting the chute" : "Place a bet"}
              </p>
            )}
          </section>

          <section className="mt-auto flex flex-col items-center gap-2 pt-8">
            {table.playerHands.length > 1 && (
              <div className="flex gap-1.5">
                {table.playerHands.map((_, i) => (
                  <span
                    key={i}
                    className={
                      i === table.active
                        ? "size-1.5 rounded-full bg-accent"
                        : "size-1.5 rounded-full bg-fg/25"
                    }
                  />
                ))}
              </div>
            )}
            {hand && table.phase !== "betting" && table.phase !== "shuffle" ? (
              <>
                <CardFan cards={hand.cards} />
                <div className="flex items-baseline gap-3">
                  <p className="font-display text-lg tabular-nums">{formatTotal(hand.cards)}</p>
                  <p className="text-sm text-muted">{formatMoney(hand.bet)}</p>
                </div>
              </>
            ) : (
              <>
                <p className="font-display text-3xl tabular-nums">{formatMoney(table.bet)}</p>
                <p className="text-xs text-subtle">
                  {table.phase === "shuffle"
                    ? "Shuffling and cutting a 4-deck chute"
                    : `${cardsAheadOfCut(table)} cards ahead of the cut`}
                </p>
              </>
            )}
          </section>
        </div>

        <CoachBanner
          phase={table.phase}
          hint={hint}
          bookLabel={bookAction ? actionLabel(bookAction) : null}
          lastCoach={lastCoach}
          net={table.netDelta}
          outcomes={table.lastSettled.map((s) => s.outcome)}
        />

        <div className="mt-3">
          {table.phase === "betting" && (
            <div className="flex flex-col gap-3">
              {broke ? (
                <Button size="lg" className="w-full" onClick={rebuy}>
                  Rebuy {formatMoney(STARTING_BANKROLL)}
                </Button>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3">
                    {CHIP_VALUES.map((v) => (
                      <Chip
                        key={v}
                        value={v}
                        disabled={busy || v > bankroll}
                        onClick={() => addChip(v)}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-2">
                    <Button variant="secondary" size="lg" onClick={clearBet} disabled={busy}>
                      Clear
                    </Button>
                    <Button size="lg" onClick={() => void deal()} disabled={busy || table.bet < MIN_BET}>
                      Deal
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {table.phase === "insurance" && (
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn
                label="Pass"
                k="N"
                book={bookAction === "noInsurance"}
                disabled={busy}
                onClick={() => insure("pass")}
              />
              <ActionBtn
                label="Take insurance"
                k="Y"
                disabled={busy}
                onClick={() => insure("take")}
              />
            </div>
          )}

          {table.phase === "player" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <ActionBtn label="Hit" k="H" book={bookAction === "hit"} disabled={busy || !legal.hit} onClick={() => act("hit")} />
              <ActionBtn label="Stand" k="S" book={bookAction === "stand"} disabled={busy || !legal.stand} onClick={() => act("stand")} />
              <ActionBtn label="Double" k="D" book={bookAction === "double"} disabled={busy || !legal.double} onClick={() => act("double")} />
              <ActionBtn label="Split" k="P" book={bookAction === "split"} disabled={busy || !legal.split} onClick={() => act("split")} />
              <ActionBtn
                label="Surrender"
                k="R"
                book={bookAction === "surrender"}
                className="col-span-2 sm:col-span-1"
                disabled={busy || !legal.surrender}
                onClick={() => act("surrender")}
              />
            </div>
          )}

          {(table.phase === "dealer" || table.phase === "shuffle") && (
            <p className="h-14 text-center text-sm text-muted">
              {table.phase === "shuffle" ? "Shuffling and cutting…" : "Dealer is playing"}
            </p>
          )}

          {table.phase === "settle" && (
            <Button size="lg" className="w-full" onClick={nextHand}>
              Next hand
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  label,
  k,
  onClick,
  disabled,
  book,
  className,
}: {
  label: string;
  k: string;
  onClick: () => void;
  disabled?: boolean;
  book?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant={book ? "book" : "secondary"}
      size="lg"
      disabled={disabled}
      onClick={onClick}
      className={cn(className, book && "book-play")}
      aria-current={book ? "true" : undefined}
      aria-label={book ? `${label}, book play` : label}
    >
      <span>{label}</span>
      {book ? (
        <span className="text-[0.65rem] font-medium uppercase tracking-wide opacity-70">Book</span>
      ) : (
        <kbd className="hidden text-[0.65rem] font-normal opacity-50 sm:inline">{k}</kbd>
      )}
    </Button>
  );
}

function CoachBanner({
  phase,
  hint,
  bookLabel,
  lastCoach,
  net,
  outcomes,
}: {
  phase: string;
  hint: string | null;
  bookLabel: string | null;
  lastCoach: ReturnType<typeof useGame.getState>["lastCoach"];
  net: number;
  outcomes: string[];
}) {
  if (phase === "settle") {
    const label = outcomes.length === 1 ? outcomes[0] : "Round over";
    return (
      <div className="mx-auto mt-4 w-full max-w-md rounded-lg bg-surface px-4 py-3 text-center shadow-[var(--shadow-border)]">
        <p className="font-display text-xl capitalize">{label}</p>
        <p className={net >= 0 ? "text-good tabular-nums" : "text-bad tabular-nums"}>{signedMoney(net)}</p>
        {lastCoach && <p className="mt-1 text-sm text-muted">{lastCoach.label}</p>}
      </div>
    );
  }
  if (phase === "betting" && !lastCoach) return null;
  if ((phase === "player" || phase === "insurance") && hint) {
    return (
      <div className="mx-auto mt-4 w-full max-w-md rounded-lg bg-good/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-good)_35%,transparent)]">
        <p className="font-medium">
          Book play: {bookLabel}
        </p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
      </div>
    );
  }
  if (lastCoach) {
    return (
      <div
        className={
          lastCoach.correct
            ? "mx-auto mt-4 w-full max-w-md rounded-lg bg-good/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-good)_35%,transparent)]"
            : "mx-auto mt-4 w-full max-w-md rounded-lg bg-bad/10 px-4 py-3 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-bad)_35%,transparent)]"
        }
      >
        <p className="font-medium">{lastCoach.label}</p>
        <p className="mt-1 text-sm text-muted">{lastCoach.why}</p>
      </div>
    );
  }
  return (
    <div className="mx-auto mt-4 min-h-14 w-full max-w-md px-4 py-3 text-center text-sm text-subtle">
      {phase === "player" ? "Your move." : phase === "insurance" ? "Insurance?" : "\u00a0"}
    </div>
  );
}