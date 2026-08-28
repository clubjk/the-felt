import { dealerCol } from "./cards";
import { handTotals, isPair } from "./hand";
import type { Action, Card, CoachAction, Rules } from "./types";

/**
 * Total-dependent basic strategy for 4–8 decks, DAS.
 * Cells: H hit, S stand, Dh double-else-hit, Ds double-else-stand,
 * P split, Rh surrender-else-hit, Rs surrender-else-stand,
 * Rp surrender-else-split.
 *
 * Columns are dealer upcards 2 3 4 5 6 7 8 9 T A.
 * H17 is the base chart; S17 applies a small patch set.
 */

type Code = "H" | "S" | "Dh" | "Ds" | "P" | "Rh" | "Rs" | "Rp";

const COLS = 10;

function row(s: string): Code[] {
  const parts = s.trim().split(/\s+/) as Code[];
  if (parts.length !== COLS) throw new Error(`Bad strategy row: ${s}`);
  return parts;
}

const HARD: Record<number, Code[]> = {
  4: row("H  H  H  H  H  H  H  H  H  H"),
  5: row("H  H  H  H  H  H  H  H  H  H"),
  6: row("H  H  H  H  H  H  H  H  H  H"),
  7: row("H  H  H  H  H  H  H  H  H  H"),
  8: row("H  H  H  H  H  H  H  H  H  H"),
  9: row("H  Dh Dh Dh Dh H  H  H  H  H"),
  10: row("Dh Dh Dh Dh Dh Dh Dh Dh H  H"),
  11: row("Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh"),
  12: row("H  H  S  S  S  H  H  H  H  H"),
  13: row("S  S  S  S  S  H  H  H  H  H"),
  14: row("S  S  S  S  S  H  H  H  H  H"),
  15: row("S  S  S  S  S  H  H  H  Rh Rh"),
  16: row("S  S  S  S  S  H  H  Rh Rh Rh"),
  17: row("S  S  S  S  S  S  S  S  S  Rs"),
  18: row("S  S  S  S  S  S  S  S  S  S"),
  19: row("S  S  S  S  S  S  S  S  S  S"),
  20: row("S  S  S  S  S  S  S  S  S  S"),
  21: row("S  S  S  S  S  S  S  S  S  S"),
};

// Soft totals keyed by best total (13 = A,2 … 20 = A,9). A,A is a pair.
const SOFT: Record<number, Code[]> = {
  12: row("H  H  H  H  H  H  H  H  H  H"),
  13: row("H  H  H  Dh Dh H  H  H  H  H"),
  14: row("H  H  H  Dh Dh H  H  H  H  H"),
  15: row("H  H  Dh Dh Dh H  H  H  H  H"),
  16: row("H  H  Dh Dh Dh H  H  H  H  H"),
  17: row("H  Dh Dh Dh Dh H  H  H  H  H"),
  18: row("Ds Ds Ds Ds Ds S  S  H  H  H"),
  19: row("S  S  S  S  Ds S  S  S  S  S"),
  20: row("S  S  S  S  S  S  S  S  S  S"),
  21: row("S  S  S  S  S  S  S  S  S  S"),
};

// Pairs keyed by rank value (11 = aces, 10 = tens).
const PAIR: Record<number, Code[]> = {
  11: row("P  P  P  P  P  P  P  P  P  P"),
  10: row("S  S  S  S  S  S  S  S  S  S"),
  9: row("P  P  P  P  P  S  P  P  S  S"),
  8: row("P  P  P  P  P  P  P  P  P  Rp"),
  7: row("P  P  P  P  P  P  H  H  H  H"),
  6: row("P  P  P  P  P  H  H  H  H  H"),
  5: row("Dh Dh Dh Dh Dh Dh Dh Dh H  H"),
  4: row("H  H  H  P  P  H  H  H  H  H"),
  3: row("P  P  P  P  P  P  H  H  H  H"),
  2: row("P  P  P  P  P  P  H  H  H  H"),
};

function patchS17(code: Code, kind: "hard" | "soft" | "pair", total: number, col: number): Code {
  // Six H17→S17 differences for 4–8 decks, DAS, late surrender.
  if (kind === "hard" && total === 11 && col === 9) return "H";
  if (kind === "hard" && total === 15 && col === 9) return "H";
  if (kind === "hard" && total === 17 && col === 9) return "S";
  if (kind === "soft" && total === 18 && col === 9) return "S";
  if (kind === "soft" && total === 19 && col === 4) return "S";
  if (kind === "pair" && total === 8 && col === 9) return "P";
  return code;
}

const CODE_CHAIN: Record<Code, Action[]> = {
  H: ["hit"],
  S: ["stand"],
  Dh: ["double", "hit"],
  Ds: ["double", "stand"],
  P: ["split"],
  Rh: ["surrender", "hit"],
  Rs: ["surrender", "stand"],
  Rp: ["surrender", "split"],
};

export interface LegalSet {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
  surrender: boolean;
}

export function legalActions(opts: {
  cards: Card[];
  fromSplit: boolean;
  fromAceSplit: boolean;
  handsCount: number;
  firstAction: boolean;
  rules: Rules;
}): LegalSet {
  const t = handTotals(opts.cards);
  const two = opts.cards.length === 2;
  const canAct = !t.busted && t.best < 21 && !opts.fromAceSplit;
  return {
    hit: canAct,
    stand: canAct || t.best === 21,
    double: canAct && two && (!opts.fromSplit || opts.rules.das),
    split:
      canAct &&
      two &&
      isPair(opts.cards) &&
      opts.handsCount < opts.rules.maxSplitHands &&
      !(opts.fromAceSplit && !opts.rules.resplitAces) &&
      !(opts.cards[0]!.rank === "A" && opts.fromSplit && !opts.rules.resplitAces),
    surrender: canAct && two && opts.firstAction && !opts.fromSplit && opts.rules.lateSurrender,
  };
}

export function resolveCode(code: Code, legal: LegalSet): Action {
  const chain = CODE_CHAIN[code];
  for (const a of chain) {
    if (legal[a]) return a;
  }
  if (legal.stand) return "stand";
  if (legal.hit) return "hit";
  return "stand";
}

export function lookupCode(
  cards: Card[],
  dealerUp: Card,
  rules: Rules,
  canSplit: boolean,
): { code: Code; kind: "hard" | "soft" | "pair"; total: number } {
  const col = dealerCol(dealerUp.rank);
  const t = handTotals(cards);
  if (canSplit && isPair(cards)) {
    const v = cards[0]!.rank === "A" ? 11 : cards[0]!.rank === "K" || cards[0]!.rank === "Q" || cards[0]!.rank === "J" || cards[0]!.rank === "10" ? 10 : Number(cards[0]!.rank);
    let code = PAIR[v]![col]!;
    if (!rules.hitSoft17) code = patchS17(code, "pair", v, col);
    return { code, kind: "pair", total: v };
  }
  if (t.isSoft) {
    const total = t.best;
    let code = (SOFT[total] ?? SOFT[21])![col]!;
    if (!rules.hitSoft17) code = patchS17(code, "soft", total, col);
    return { code, kind: "soft", total };
  }
  const total = Math.min(21, Math.max(4, t.best));
  let code = (HARD[total] ?? HARD[8])![col]!;
  if (!rules.hitSoft17) code = patchS17(code, "hard", total, col);
  return { code, kind: "hard", total };
}

export function optimalAction(
  cards: Card[],
  dealerUp: Card,
  rules: Rules,
  legal: LegalSet,
): { action: Action; kind: "hard" | "soft" | "pair"; total: number; code: Code } {
  const found = lookupCode(cards, dealerUp, rules, legal.split);
  return { action: resolveCode(found.code, legal), kind: found.kind, total: found.total, code: found.code };
}

export function situationKey(
  kind: "hard" | "soft" | "pair" | "insurance",
  totalOrRank: number | string,
  dealerRank: string,
): string {
  return `${kind}-${totalOrRank}-vs-${dealerRank}`;
}

export function dealerRankLabel(rank: string): string {
  if (rank === "J" || rank === "Q" || rank === "K") return "10";
  return rank;
}

export function describeSituation(kind: "hard" | "soft" | "pair" | "insurance", total: number, dealer: string): string {
  const up = dealerRankLabel(dealer);
  if (kind === "insurance") return "Insurance vs Ace";
  if (kind === "pair") {
    const name = total === 11 ? "Aces" : total === 10 ? "Tens" : `${total}s`;
    return `Pair of ${name} vs ${up}`;
  }
  if (kind === "soft") return `Soft ${total} vs ${up}`;
  return `Hard ${total} vs ${up}`;
}

export function actionLabel(action: CoachAction): string {
  switch (action) {
    case "hit":
      return "Hit";
    case "stand":
      return "Stand";
    case "double":
      return "Double";
    case "split":
      return "Split";
    case "surrender":
      return "Surrender";
    case "insurance":
      return "Take insurance";
    case "noInsurance":
      return "Pass on insurance";
  }
}

export function chartHard(rules: Rules): Code[][] {
  const out: Code[][] = [];
  for (let t = 5; t <= 21; t += 1) {
    const r = (HARD[t] ?? HARD[8])!.slice();
    if (!rules.hitSoft17) {
      for (let c = 0; c < COLS; c += 1) r[c] = patchS17(r[c]!, "hard", t, c);
    }
    out.push(r);
  }
  return out;
}

export function chartSoft(rules: Rules): Code[][] {
  const out: Code[][] = [];
  for (let t = 13; t <= 21; t += 1) {
    const r = (SOFT[t] ?? SOFT[21])!.slice();
    if (!rules.hitSoft17) {
      for (let c = 0; c < COLS; c += 1) r[c] = patchS17(r[c]!, "soft", t, c);
    }
    out.push(r);
  }
  return out;
}

export function chartPairs(rules: Rules): { rank: number; row: Code[] }[] {
  const ranks = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  return ranks.map((v) => {
    const r = PAIR[v]!.slice();
    if (!rules.hitSoft17) {
      for (let c = 0; c < COLS; c += 1) r[c] = patchS17(r[c]!, "pair", v, c);
    }
    return { rank: v, row: r };
  });
}

export type { Code };
