import { actionLabel, describeSituation } from "./strategy";
import type { Action, CoachAction } from "./types";

function mnemonic(kind: "hard" | "soft" | "pair" | "insurance", total: number, dealer: string): string {
  const up = dealer === "J" || dealer === "Q" || dealer === "K" ? "10" : dealer;
  if (kind === "insurance") {
    return "Insurance is a side bet that the dealer has blackjack. It pays 2:1, but the dealer only has a ten in the hole about 31% of the time — never enough. Always decline.";
  }
  if (kind === "pair") {
    if (total === 11) return "Always split aces. Two chances at 21 beat playing a soft 12.";
    if (total === 10) return "Never split tens. Twenty is a winning hand — don't break it.";
    if (total === 9) {
      if (up === "7" || up === "10" || up === "A") return "Stand on 18 against a 7, 10, or ace. Split 9s into two 9s only when the dealer is weak, or vs 8/9.";
      return "Split 9s against 2–6, 8, and 9. Standing on 18 is worse than two chances at 19 when the dealer may bust.";
    }
    if (total === 8) {
      if (up === "A") return "Always split eights — a 16 is the worst total. Against an ace, surrender if the house allows it; otherwise still split.";
      return "Always split eights. Sixteen is the worst total in the game; two eights give you a fighting chance.";
    }
    if (total === 7) return "Split 7s against 2–7. Against 8 or better the dealer is too strong — hit the 14 instead.";
    if (total === 6) return "Split 6s against 2–6 (a dealer bust card). Hit against 7 or higher.";
    if (total === 5) return "Never split fives — treat them as a 10 and double against 2–9.";
    if (total === 4) return "With double-after-split allowed, split 4s only vs 5 and 6. Otherwise hit the 8.";
    return "Split small pairs (2s and 3s) against 2–7. Hit against 8 or better.";
  }
  if (kind === "soft") {
    if (total >= 20) return "Soft 20 (and 21) always stands. You are already in great shape.";
    if (total === 19) return "Soft 19 stands except you double vs a 6 when the dealer hits soft 17.";
    if (total === 18) {
      if (up === "9" || up === "10" || up === "A") return "Soft 18 is a losing total against a 9, 10, or ace. Hit and try to improve.";
      if (up === "7" || up === "8") return "Soft 18 stands against 7 and 8 — you figure to push or win.";
      return "Double soft 18 against 2–6. If you can't double, stand.";
    }
    if (total === 17) return "Soft 17 is a weak total. Double vs 3–6; otherwise hit. Never stand on a soft 17.";
    return "Double a small soft hand against a dealer 4–6 (5–6 for A,2 / A,3). Otherwise hit — you cannot bust.";
  }
  // hard
  if (total >= 18) return "Hard 18 or better always stands.";
  if (total === 17) {
    if (up === "A") return "Hard 17 vs ace: surrender if the dealer hits soft 17 (the dealer improves often). Otherwise stand.";
    return "Always stand on hard 17 except the rare H17 surrender vs ace.";
  }
  if (total === 16) {
    if (up === "9" || up === "10" || up === "A") return "Hard 16 vs 9–ace is the worst spot in the game. Surrender if you can; otherwise hit.";
    if (["2", "3", "4", "5", "6"].includes(up)) return "Stand on a stiff (12–16) when the dealer shows a bust card (2–6).";
    return "Hit 16 against 7 or 8. Standing loses too often when the dealer is likely to make a 17–21.";
  }
  if (total === 15) {
    if (up === "10" || up === "A") return "Surrender 15 vs 10 (and vs ace in H17). If surrender isn't offered, hit.";
    if (["2", "3", "4", "5", "6"].includes(up)) return "Stand on a stiff when the dealer shows 2–6.";
    return "Hit 15 against 7–9. You need to catch up.";
  }
  if (total === 13 || total === 14) {
    if (["2", "3", "4", "5", "6"].includes(up)) return "Stand on 13–14 vs 2–6. Let the dealer bust.";
    return "Hit 13–14 against 7 or higher. Standing is a slow leak.";
  }
  if (total === 12) {
    if (["4", "5", "6"].includes(up)) return "Stand on 12 only vs 4–6. Against 2 or 3 the dealer busts less often than it feels — hit.";
    return "Hit 12 against 2, 3, and 7–ace. Twelve vs 2/3 is the most commonly missed stand/hit.";
  }
  if (total === 11) return "Always double 11. Against an ace this is H17-only; if the dealer stands on soft 17, hit instead.";
  if (total === 10) return "Double 10 against 2–9. Hit against a 10 or ace — the dealer is too likely to have a made hand.";
  if (total === 9) return "Double 9 against 3–6. Hit against 2 and against 7 or better.";
  return "Hard 8 or less always hits. You cannot improve by standing.";
}

export function explainDecision(opts: {
  kind: "hard" | "soft" | "pair" | "insurance";
  total: number;
  dealerRank: string;
  taken: CoachAction;
  optimal: CoachAction;
  correct: boolean;
}): { label: string; why: string } {
  const spot = describeSituation(opts.kind, opts.total, opts.dealerRank);
  const why = mnemonic(opts.kind, opts.total, opts.dealerRank);
  if (opts.correct) {
    return { label: `${actionLabel(opts.taken)}. ${spot}`, why };
  }
  return {
    label: `${actionLabel(opts.taken)} is wrong. ${spot} → ${actionLabel(opts.optimal)}`,
    why,
  };
}

export function hintLine(optimal: Action | CoachAction, kind: "hard" | "soft" | "pair" | "insurance", total: number, dealerRank: string): string {
  return `${describeSituation(kind, total, dealerRank)} — ${actionLabel(optimal)}`;
}
