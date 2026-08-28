import { rankValue } from "./cards";
import type { Card, Hand } from "./types";

export interface Totals {
  hard: number;
  soft: number;
  best: number;
  isSoft: boolean;
  busted: boolean;
  blackjack: boolean;
}

export function handTotals(cards: Card[]): Totals {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += rankValue(c.rank);
    if (c.rank === "A") aces += 1;
  }
  let hard = total;
  let usedSoftAce = false;
  while (hard > 21 && aces > 0) {
    hard -= 10;
    aces -= 1;
  }
  // A remaining ace counted as 11 means the hand is soft (if it still fits).
  const isSoft = aces > 0 && hard <= 21;
  const best = hard;
  const blackjack = cards.length === 2 && best === 21;
  return {
    hard,
    soft: isSoft ? hard : hard,
    best,
    isSoft,
    busted: best > 21,
    blackjack,
  };
}

export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0]!.rank === cards[1]!.rank;
}

export function isBusted(hand: Hand): boolean {
  return handTotals(hand.cards).busted;
}

export function isFinished(hand: Hand): boolean {
  if (hand.stood || hand.surrendered || hand.doubled) return true;
  if (isBusted(hand)) return true;
  if (handTotals(hand.cards).best === 21) return true;
  if (hand.fromAceSplit) return true;
  return false;
}

export function naturalBlackjack(hand: Hand): boolean {
  return !hand.fromSplit && handTotals(hand.cards).blackjack;
}

export function formatTotal(cards: Card[]): string {
  const t = handTotals(cards);
  if (t.busted) return "bust";
  if (t.blackjack && cards.length === 2) return "blackjack";
  if (t.isSoft) return `soft ${t.best}`;
  return String(t.best);
}
