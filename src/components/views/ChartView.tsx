import { TopBar } from "@/components/layout/TopBar";
import { chartHard, chartPairs, chartSoft } from "@/lib/blackjack/strategy";
import { useGame } from "@/lib/blackjack/store";
import type { Rank } from "@/lib/blackjack/types";
import type { Code } from "@/lib/blackjack/strategy";
import type { Spot } from "@/lib/blackjack/drills";

const UPS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

function letter(code: Code): string {
  if (code.startsWith("D")) return "D";
  if (code.startsWith("R")) return "R";
  return code;
}

export function ChartView() {
  const rules = useGame((s) => s.rules);
  const setView = useGame((s) => s.setView);
  const startDrill = useGame((s) => s.startDrill);
  const hard = chartHard(rules).slice(0, -1);
  const soft = chartSoft(rules).slice(0, -1);
  const pairs = chartPairs(rules);

  const drill = (spot: Spot) => startDrill("mixed", spot);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
      <TopBar title="Strategy chart" onBack={() => setView("menu")} />
      <div className="flex-1 space-y-8 overflow-y-auto px-4 pb-10">
        <p className="text-sm text-muted">
          4–8 decks, DAS, {rules.hitSoft17 ? "H17" : "S17"}
          {rules.lateSurrender ? ", late surrender" : ""}. Tap a cell to drill that spot.
        </p>
        <ChartBlock
          title="Hard totals"
          rows={hard.map((row, i) => ({ label: String(i + 5), row, total: i + 5, kind: "hard" as const }))}
          onCell={drill}
        />
        <ChartBlock
          title="Soft totals"
          rows={soft.map((row, i) => ({
            label: `A,${i + 2 === 10 ? "T" : i + 2}`,
            row,
            total: i + 13,
            kind: "soft" as const,
          }))}
          onCell={drill}
        />
        <ChartBlock
          title="Pairs"
          rows={pairs.map((p) => ({
            label: p.rank === 11 ? "A,A" : p.rank === 10 ? "T,T" : `${p.rank},${p.rank}`,
            row: p.row,
            total: p.rank,
            kind: "pair" as const,
          }))}
          onCell={drill}
        />
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <li><b className="text-fg">H</b> hit</li>
          <li><b className="text-fg">S</b> stand</li>
          <li><b className="text-fg">D</b> double</li>
          <li><b className="text-fg">P</b> split</li>
          <li><b className="text-fg">R</b> surrender</li>
        </ul>
      </div>
    </div>
  );
}

function ChartBlock({
  title,
  rows,
  onCell,
}: {
  title: string;
  rows: { label: string; row: Code[]; total: number; kind: Spot["kind"] }[];
  onCell: (spot: Spot) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-medium">{title}</h2>
      <div className="w-full overflow-x-auto rounded-lg bg-surface p-2">
        <table className="w-full border-separate border-spacing-0.5 text-center text-sm">
          <thead>
            <tr>
              <th className="w-10 text-xs font-medium text-subtle"> </th>
              {UPS.map((u) => (
                <th key={u} className="text-xs font-medium text-subtle">
                  {u}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th className="pr-1 text-left text-xs font-medium text-muted">{r.label}</th>
                {r.row.map((code, i) => (
                  <td key={UPS[i]}>
                    <button
                      type="button"
                      className={`chart-cell w-full rounded-sm font-medium ${cellClass(code)}`}
                      onClick={() => onCell({ kind: r.kind, total: r.total, dealer: UPS[i]! })}
                      aria-label={`${r.label} vs ${UPS[i]} ${letter(code)}`}
                    >
                      {letter(code)}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function cellClass(code: Code): string {
  if (code === "H") return "cell-H";
  if (code === "S") return "cell-S";
  if (code === "P") return "cell-P";
  if (code.startsWith("D")) return "cell-Dh";
  return "cell-Rh";
}
