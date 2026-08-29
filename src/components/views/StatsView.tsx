import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { TOTAL_SPOTS } from "@/lib/blackjack/drills";
import { formatMoney, pct } from "@/lib/blackjack/format";
import { describeSituation } from "@/lib/blackjack/strategy";
import { useGame } from "@/lib/blackjack/store";

export function StatsView() {
  const setView = useGame((s) => s.setView);
  const startDrill = useGame((s) => s.startDrill);
  const resetRecord = useGame((s) => s.resetRecord);
  const rebuy = useGame((s) => s.rebuy);
  const decisions = useGame((s) => s.decisions);
  const correct = useGame((s) => s.correct);
  const streak = useGame((s) => s.streak);
  const bestStreak = useGame((s) => s.bestStreak);
  const handsPlayed = useGame((s) => s.handsPlayed);
  const bankroll = useGame((s) => s.bankroll);
  const byKey = useGame((s) => s.byKey);

  const seen = Object.keys(byKey).length;
  const weak = Object.entries(byKey)
    .map(([key, st]) => {
      const acc = st.n === 0 ? 1 : st.correct / st.n;
      return { key, ...st, acc };
    })
    .filter((x) => x.n >= 2)
    .sort((a, b) => a.acc - b.acc || b.n - a.n)
    .slice(0, 8);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <TopBar title="Your record" onBack={() => setView("menu")} />
      <div className="flex-1 space-y-6 px-4 pb-10">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Book play" value={decisions ? pct(correct / decisions) : "—"} />
          <Stat label="Decisions" value={String(decisions)} />
          <Stat label="Hands" value={String(handsPlayed)} />
          <Stat label="Best streak" value={String(bestStreak)} />
          <Stat label="Coverage" value={`${seen}/${TOTAL_SPOTS}`} />
          <Stat label="Bankroll" value={formatMoney(bankroll)} />
        </div>

        {streak > 1 && (
          <p className="text-sm text-muted">
            Live streak: <span className="tabular-nums text-fg">{streak}</span>
          </p>
        )}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-medium">Weak spots</h2>
            {weak.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => startDrill("weak")}>
                Drill these
              </Button>
            )}
          </div>
          {weak.length === 0 ? (
            <p className="rounded-lg bg-surface px-4 py-6 text-sm text-muted shadow-[var(--shadow-border)]">
              Play a few dozen decisions and your leaks will show up here.
            </p>
          ) : (
            <ul className="space-y-2">
              {weak.map((w) => (
                <li
                  key={w.key}
                  className="flex items-center justify-between rounded-md bg-surface px-3 py-3 text-sm shadow-[var(--shadow-border)]"
                >
                  <span>{prettyKey(w.key)}</span>
                  <span className="tabular-nums text-muted">
                    {w.correct}/{w.n} · {pct(w.acc)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-2 pt-4">
          <Button variant="secondary" onClick={rebuy}>
            Reset bankroll to $100
          </Button>
          <Button variant="ghost" onClick={resetRecord}>
            Clear record
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface px-4 py-4 shadow-[var(--shadow-border)]">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function prettyKey(key: string): string {
  const m = key.match(/^(hard|soft|pair|insurance)-(.+)-vs-(.+)$/);
  if (!m) return key;
  const kind = m[1] as "hard" | "soft" | "pair" | "insurance";
  const total = kind === "insurance" ? 0 : Number(m[2]);
  return describeSituation(kind, total, m[3]!);
}
