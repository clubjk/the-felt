export const SUITS = ["spades", "hearts", "diamonds", "clubs"] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  rank: Rank;
  suit: Suit;
  id: string;
}

export type Action = "hit" | "stand" | "double" | "split" | "surrender";
export type InsuranceChoice = "take" | "pass";

export type CoachAction = Action | "insurance" | "noInsurance";

export type View = "menu" | "play" | "drill" | "chart" | "stats";

export type Phase =
  | "betting"
  | "insurance"
  | "player"
  | "dealer"
  | "settle"
  | "shuffle";

export type CoachMode = "after" | "hint" | "strict";

export interface Rules {
  decks: number;
  hitSoft17: boolean;
  lateSurrender: boolean;
  das: boolean;
  blackjackPays: 1.5;
  maxSplitHands: number;
  resplitAces: boolean;
  hitSplitAces: boolean;
}

export const DEFAULT_RULES: Rules = {
  decks: 6,
  hitSoft17: true,
  lateSurrender: true,
  das: true,
  blackjackPays: 1.5,
  maxSplitHands: 4,
  resplitAces: false,
  hitSplitAces: false,
};

export interface Hand {
  cards: Card[];
  bet: number;
  doubled: boolean;
  surrendered: boolean;
  fromSplit: boolean;
  fromAceSplit: boolean;
  stood: boolean;
}

export type Outcome = "win" | "lose" | "push" | "blackjack" | "surrender" | "bust";

export interface SettledHand {
  outcome: Outcome;
  delta: number;
  playerTotal: number;
  dealerTotal: number;
}

export interface CoachEvent {
  key: string;
  category: "hard" | "soft" | "pair" | "insurance";
  taken: CoachAction;
  optimal: CoachAction;
  correct: boolean;
  label: string;
  why: string;
}

export interface DecisionStat {
  n: number;
  correct: number;
}

export interface PersistedStats {
  version: number;
  bankroll: number;
  decisions: number;
  correct: number;
  streak: number;
  bestStreak: number;
  handsPlayed: number;
  byKey: Record<string, DecisionStat>;
  settings: {
    hitSoft17: boolean;
    lateSurrender: boolean;
    coachMode: CoachMode;
    sound: boolean;
  };
}

export const SAVE_VERSION = 2;
export const STARTING_BANKROLL = 100;
export const MIN_BET = 5;
export const CHIP_VALUES = [5, 25, 100, 500] as const;
