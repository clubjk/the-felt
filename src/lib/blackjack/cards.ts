import { RANKS, SUITS, type Card, type Rank, type Suit } from "./types";

export function rankValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J" || rank === "10") return 10;
  return Number(rank);
}

export function isTenValue(rank: Rank): boolean {
  return rankValue(rank) === 10;
}

export function suitColor(suit: Suit): "red" | "black" {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

let seq = 0;
export function makeCard(rank: Rank, suit: Suit): Card {
  seq += 1;
  return { rank, suit, id: `${rank}-${suit}-${seq}` };
}

export function buildShoe(decks: number): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < decks; d += 1) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        cards.push(makeCard(rank, suit));
      }
    }
  }
  return fisherYates(cards);
}

export function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

export function draw(shoe: Card[]): { card: Card; shoe: Card[] } {
  const next = shoe.slice();
  const card = next.pop();
  if (!card) throw new Error("Empty shoe");
  return { card, shoe: next };
}

export function randomSuit(): Suit {
  return SUITS[Math.floor(Math.random() * SUITS.length)]!;
}

export function randomRank(): Rank {
  return RANKS[Math.floor(Math.random() * RANKS.length)]!;
}

export function cardOf(rank: Rank, avoidSuit?: Suit): Card {
  let suit = randomSuit();
  if (avoidSuit && SUITS.length > 1) {
    let guard = 0;
    while (suit === avoidSuit && guard < 8) {
      suit = randomSuit();
      guard += 1;
    }
  }
  return makeCard(rank, suit);
}

export const DEALER_UP_RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"];

export function dealerCol(rank: Rank): number {
  if (rank === "A") return 9;
  if (isTenValue(rank)) return 8;
  return Number(rank) - 2;
}
