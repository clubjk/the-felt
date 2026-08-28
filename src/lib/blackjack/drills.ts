import { cardOf, DEALER_UP_RANKS } from "./cards";
import { legalActions, optimalAction } from "./strategy";
import type { Card, DecisionStat, Rank, Rules } from "./types";

export type DrillFocus = "mixed" | "hard" | "soft" | "pairs" | "weak";

export interface Spot {
  kind: "hard" | "soft" | "pair" | "insurance";
  total: number;
  dealer: Rank;
}

export function allSpots(): Spot[] {
  const spots: Spot[] = [];
  for (let t = 5; t <= 20; t += 1) {
    for (const d of DEALER_UP_RANKS) spots.push({ kind: "hard", total: t, dealer: d });
  }
  for (let t = 13; t <= 20; t += 1) {
    for (const d of DEALER_UP_RANKS) spots.push({ kind: "soft", total: t, dealer: d });
  }
  for (const p of [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) {
    for (const d of DEALER_UP_RANKS) spots.push({ kind: "pair", total: p, dealer: d });
  }
  spots.push({ kind: "insurance", total: 0, dealer: "A" });
  return spots;
}

export const TOTAL_SPOTS = allSpots().length;

function pairRank(v: number): Rank {
  if (v === 11) return "A";
  if (v === 10) return "10";
  return String(v) as Rank;
}

function twoCardHard(total: number): [Rank, Rank] {
  switch (total) {
    case 20:
      return ["K", "Q"];
    case 19:
      return ["K", "9"];
    case 18:
      return ["K", "8"];
    case 17:
      return ["K", "7"];
    case 16:
      return ["K", "6"];
    case 15:
      return ["K", "5"];
    case 14:
      return ["K", "4"];
    case 13:
      return ["K", "3"];
    case 12:
      return ["K", "2"];
    case 11:
      return ["9", "2"];
    case 10:
      return ["8", "2"];
    case 9:
      return ["7", "2"];
    case 8:
      return ["5", "3"];
    case 7:
      return ["5", "2"];
    case 6:
      return ["4", "2"];
    default:
      return ["3", "2"];
  }
}

export function cardsForSpot(spot: Spot): { player: Card[]; dealer: Card } {
  if (spot.kind === "insurance") {
    return { player: [cardOf("10"), cardOf("9")], dealer: cardOf("A") };
  }
  const dealer = cardOf(spot.dealer);
  if (spot.kind === "pair") {
    const r = pairRank(spot.total);
    const a = cardOf(r);
    const b = cardOf(r, a.suit);
    return { player: [a, b], dealer };
  }
  if (spot.kind === "soft") {
    const x = spot.total - 11;
    const r: Rank = x === 10 ? "10" : (String(x) as Rank);
    return { player: [cardOf("A"), cardOf(r)], dealer };
  }
  const [r1, r2] = twoCardHard(spot.total);
  return { player: [cardOf(r1), cardOf(r2)], dealer };
}

export function spotKey(spot: Spot): string {
  if (spot.kind === "insurance") return "insurance-0-vs-A";
  return `${spot.kind}-${spot.total}-vs-${spot.dealer}`;
}

function matchesFocus(spot: Spot, focus: DrillFocus): boolean {
  if (focus === "mixed" || focus === "weak") return true;
  if (focus === "hard") return spot.kind === "hard";
  if (focus === "soft") return spot.kind === "soft";
  return spot.kind === "pair" || spot.kind === "insurance";
}

export function pickSpot(focus: DrillFocus, byKey: Record<string, DecisionStat>): Spot {
  const pool = allSpots().filter((s) => matchesFocus(s, focus));
  if (focus === "weak") {
    const ranked = pool
      .map((s) => {
        const st = byKey[spotKey(s)];
        const n = st?.n ?? 0;
        const acc = n === 0 ? 0 : st!.correct / n;
        return { s, n, acc };
      })
      .filter((x) => x.n >= 2)
      .sort((a, b) => a.acc - b.acc || b.n - a.n);
    if (ranked.length > 0) {
      const top = ranked.slice(0, Math.min(8, ranked.length));
      return top[Math.floor(Math.random() * top.length)]!.s;
    }
  }

  const unseen = pool.filter((s) => !byKey[spotKey(s)] || byKey[spotKey(s)]!.n === 0);
  const source = unseen.length > 0 ? unseen : pool;
  return source[Math.floor(Math.random() * source.length)]!;
}

export function drillLegal(player: Card[], rules: Rules) {
  return legalActions({
    cards: player,
    fromSplit: false,
    fromAceSplit: false,
    handsCount: 1,
    firstAction: true,
    rules,
  });
}

export function drillOptimal(player: Card[], dealer: Card, rules: Rules) {
  return optimalAction(player, dealer, rules, drillLegal(player, rules));
}
