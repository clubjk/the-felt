import { draw, isTenValue, newChute } from "./cards";
import { explainDecision } from "./explain";
import { handTotals, isFinished, naturalBlackjack } from "./hand";
import { legalActions, optimalAction, situationKey } from "./strategy";
import type {
  Action,
  Card,
  CoachAction,
  CoachEvent,
  Hand,
  InsuranceChoice,
  Phase,
  Rules,
  SettledHand,
} from "./types";
import { MIN_BET } from "./types";

export interface TableState {
  shoe: Card[];
  cutRemaining: number;
  cutOut: boolean;
  playerHands: Hand[];
  active: number;
  dealer: Card[];
  holeRevealed: boolean;
  phase: Phase;
  bet: number;
  bankroll: number;
  insuranceBet: number;
  firstAction: boolean;
  lastSettled: SettledHand[];
  netDelta: number;
  roundId: number;
}

export function emptyHand(bet: number, extras: Partial<Hand> = {}): Hand {
  return {
    cards: [],
    bet,
    doubled: false,
    surrendered: false,
    fromSplit: false,
    fromAceSplit: false,
    stood: false,
    ...extras,
  };
}

function loadChute(rules: Rules) {
  const chute = newChute(rules.decks);
  return { shoe: chute.shoe, cutRemaining: chute.cutRemaining, cutOut: false };
}

export function freshTable(bankroll: number, rules: Rules, bet = MIN_BET): TableState {
  const capped = Math.min(Math.max(0, bet), bankroll);
  return {
    ...loadChute(rules),
    playerHands: [],
    active: 0,
    dealer: [],
    holeRevealed: false,
    phase: "betting",
    bet: capped < MIN_BET && bankroll >= MIN_BET ? Math.min(MIN_BET, bankroll) : capped,
    bankroll,
    insuranceBet: 0,
    firstAction: true,
    lastSettled: [],
    netDelta: 0,
    roundId: 0,
  };
}

function take(state: TableState): { card: Card; state: TableState } {
  if (state.shoe.length === 0) {
    throw new Error("Chute empty mid-round");
  }
  const drawn = draw(state.shoe);
  const cutOut = state.cutOut || drawn.shoe.length <= state.cutRemaining;
  return { card: drawn.card, state: { ...state, shoe: drawn.shoe, cutOut } };
}

export function needsShuffle(state: TableState): boolean {
  return state.cutOut || state.shoe.length <= state.cutRemaining;
}

export function cardsAheadOfCut(state: TableState): number {
  return Math.max(0, state.shoe.length - state.cutRemaining);
}

export function addChip(state: TableState, chip: number): TableState {
  if (state.phase !== "betting") return state;
  return { ...state, bet: Math.min(state.bankroll, state.bet + chip) };
}

export function clearBet(state: TableState): TableState {
  if (state.phase !== "betting") return state;
  return { ...state, bet: 0 };
}

export function legalForActive(state: TableState, rules: Rules) {
  const hand = state.playerHands[state.active];
  if (!hand) {
    return { hit: false, stand: false, double: false, split: false, surrender: false };
  }
  const legal = legalActions({
    cards: hand.cards,
    fromSplit: hand.fromSplit,
    fromAceSplit: hand.fromAceSplit,
    handsCount: state.playerHands.length,
    firstAction: state.firstAction,
    rules,
  });
  if (state.bankroll < hand.bet) {
    legal.double = false;
    legal.split = false;
  }
  return legal;
}

function grade(
  dealerRank: string,
  taken: CoachAction,
  kind: "hard" | "soft" | "pair" | "insurance",
  total: number,
  optimal: CoachAction,
): CoachEvent {
  const correct = taken === optimal;
  const exp = explainDecision({ kind, total, dealerRank, taken, optimal, correct });
  return {
    key: situationKey(kind, kind === "insurance" ? 0 : total, dealerRank),
    category: kind,
    taken,
    optimal,
    correct,
    label: exp.label,
    why: exp.why,
  };
}

export function coachForAction(state: TableState, rules: Rules, taken: Action): CoachEvent | null {
  const hand = state.playerHands[state.active];
  const up = state.dealer[0];
  if (!hand || !up) return null;
  const legal = legalForActive(state, rules);
  const opt = optimalAction(hand.cards, up, rules, legal);
  return grade(up.rank, taken, opt.kind, opt.total, opt.action);
}

export function coachForInsurance(state: TableState, taken: InsuranceChoice): CoachEvent {
  const up = state.dealer[0]?.rank ?? "A";
  const takenA: CoachAction = taken === "take" ? "insurance" : "noInsurance";
  return grade(up, takenA, "insurance", 0, "noInsurance");
}

export function hintForActive(state: TableState, rules: Rules): CoachEvent | null {
  if (state.phase === "insurance") {
    return coachForInsurance(state, "pass");
  }
  const hand = state.playerHands[state.active];
  const up = state.dealer[0];
  if (!hand || !up || state.phase !== "player") return null;
  const legal = legalForActive(state, rules);
  const opt = optimalAction(hand.cards, up, rules, legal);
  return grade(up.rank, opt.action, opt.kind, opt.total, opt.action);
}

export function dealerDisplay(cards: Card[], revealed: boolean): string {
  if (cards.length === 0) return "";
  if (!revealed) {
    const up = handTotals([cards[0]!]);
    return up.isSoft ? `soft ${up.best}` : String(up.best);
  }
  const t = handTotals(cards);
  if (t.busted) return "bust";
  if (t.blackjack && cards.length === 2) return "blackjack";
  if (t.isSoft) return `soft ${t.best}`;
  return String(t.best);
}

export function evaluateHand(player: Hand, dealerCards: Card[], rules: Rules): SettledHand {
  const pt = handTotals(player.cards);
  const dt = handTotals(dealerCards);
  const pBJ = naturalBlackjack(player);
  const dBJ = dealerCards.length === 2 && dt.blackjack;
  const totals = { playerTotal: pt.best, dealerTotal: dt.best };

  if (player.surrendered) {
    return { outcome: "surrender", delta: -player.bet / 2, ...totals };
  }
  if (pt.busted) {
    return { outcome: "bust", delta: -player.bet, ...totals };
  }
  if (pBJ && dBJ) return { outcome: "push", delta: 0, ...totals };
  if (pBJ) return { outcome: "blackjack", delta: player.bet * rules.blackjackPays, ...totals };
  if (dBJ) return { outcome: "lose", delta: -player.bet, ...totals };
  if (dt.busted) return { outcome: "win", delta: player.bet, ...totals };
  if (pt.best > dt.best) return { outcome: "win", delta: player.bet, ...totals };
  if (pt.best < dt.best) return { outcome: "lose", delta: -player.bet, ...totals };
  return { outcome: "push", delta: 0, ...totals };
}

export function dealerShouldHit(cards: Card[], rules: Rules): boolean {
  const t = handTotals(cards);
  if (t.best < 17) return true;
  if (t.best > 17) return false;
  return t.isSoft && rules.hitSoft17;
}

export function shouldDealerPlay(state: TableState): boolean {
  return state.playerHands.some((h) => {
    if (h.surrendered) return false;
    const t = handTotals(h.cards);
    if (t.busted) return false;
    if (naturalBlackjack(h)) return false;
    return true;
  });
}

export function settleRound(state: TableState, rules: Rules): TableState {
  const revealed: TableState = { ...state, holeRevealed: true };
  const dBJ = revealed.dealer.length === 2 && handTotals(revealed.dealer).blackjack;
  let bankroll = revealed.bankroll;
  let insuranceDelta = 0;
  if (revealed.insuranceBet > 0) {
    if (dBJ) {
      bankroll += revealed.insuranceBet * 3;
      insuranceDelta = revealed.insuranceBet * 2;
    } else {
      insuranceDelta = -revealed.insuranceBet;
    }
  }

  const lastSettled = revealed.playerHands.map((h) => evaluateHand(h, revealed.dealer, rules));
  let net = insuranceDelta;
  for (let i = 0; i < revealed.playerHands.length; i += 1) {
    const h = revealed.playerHands[i]!;
    const s = lastSettled[i]!;
    net += s.delta;
    bankroll += h.bet + s.delta;
  }

  return {
    ...revealed,
    bankroll,
    lastSettled,
    netDelta: net,
    phase: "settle",
  };
}

export function dealRound(state: TableState, rules: Rules): TableState {
  if (state.bankroll < MIN_BET) return state;
  const bet = Math.min(Math.max(MIN_BET, state.bet), state.bankroll);

  let next: TableState = state;
  if (needsShuffle(next)) {
    next = { ...next, ...loadChute(rules) };
  }

  next = {
    ...next,
    bankroll: next.bankroll - bet,
    insuranceBet: 0,
    lastSettled: [],
    netDelta: 0,
    holeRevealed: false,
    roundId: next.roundId + 1,
    bet,
  };

  let player = emptyHand(bet);
  let dealer: Card[] = [];
  const order = ["p", "d", "p", "d"] as const;
  for (const dest of order) {
    const t = take(next);
    next = t.state;
    if (dest === "p") player = { ...player, cards: [...player.cards, t.card] };
    else dealer = [...dealer, t.card];
  }

  next = { ...next, playerHands: [player], dealer, active: 0, firstAction: true };

  const up = dealer[0]!;
  if (up.rank === "A") {
    return { ...next, phase: "insurance" };
  }

  const dBJ = dealer.length === 2 && handTotals(dealer).blackjack;
  if (isTenValue(up.rank) && dBJ) {
    return settleRound({ ...next, holeRevealed: true }, rules);
  }
  if (naturalBlackjack(player)) {
    return settleRound({ ...next, holeRevealed: true }, rules);
  }
  return { ...next, phase: "player" };
}

export function canTakeInsurance(state: TableState): boolean {
  return state.phase === "insurance" && state.bankroll >= state.bet / 2 && state.bet >= MIN_BET;
}

export function applyInsurance(state: TableState, rules: Rules, choice: InsuranceChoice): TableState {
  if (state.phase !== "insurance") return state;
  let next = state;
  if (choice === "take") {
    const side = Math.min(state.bet / 2, state.bankroll);
    if (side > 0) {
      next = { ...next, insuranceBet: side, bankroll: next.bankroll - side };
    }
  }

  const dBJ = next.dealer.length === 2 && handTotals(next.dealer).blackjack;
  const pBJ = next.playerHands[0] ? naturalBlackjack(next.playerHands[0]) : false;
  if (dBJ || pBJ) {
    return settleRound({ ...next, holeRevealed: true }, rules);
  }
  return { ...next, phase: "player", holeRevealed: false };
}

function finishOrContinue(state: TableState): TableState {
  const hands = state.playerHands.map((h) => {
    if (isFinished(h)) return h;
    if (handTotals(h.cards).best === 21) return { ...h, stood: true };
    return h;
  });
  const next = { ...state, playerHands: hands };

  let active = next.active;
  while (active < next.playerHands.length && isFinished(next.playerHands[active]!)) {
    active += 1;
  }
  if (active >= next.playerHands.length) {
    return { ...next, active: Math.max(0, next.playerHands.length - 1), phase: "dealer", firstAction: false };
  }
  const moved = active !== next.active;
  return { ...next, active, firstAction: moved ? true : next.firstAction };
}

export function applyAction(state: TableState, rules: Rules, action: Action): TableState {
  if (state.phase !== "player") return state;
  const idx = state.active;
  const hand = state.playerHands[idx];
  if (!hand) return state;
  const legal = legalForActive(state, rules);
  if (!legal[action]) return state;

  if (action === "hit") {
    const d = take(state);
    const h: Hand = { ...hand, cards: [...hand.cards, d.card] };
    const hands = d.state.playerHands.map((x, i) => (i === idx ? h : x));
    return finishOrContinue({ ...d.state, playerHands: hands, firstAction: false });
  }

  if (action === "stand") {
    const h: Hand = { ...hand, stood: true };
    const hands = state.playerHands.map((x, i) => (i === idx ? h : x));
    return finishOrContinue({ ...state, playerHands: hands, firstAction: false });
  }

  if (action === "double") {
    const d = take(state);
    const h: Hand = {
      ...hand,
      cards: [...hand.cards, d.card],
      doubled: true,
      bet: hand.bet * 2,
      stood: true,
    };
    const hands = d.state.playerHands.map((x, i) => (i === idx ? h : x));
    return finishOrContinue({
      ...d.state,
      playerHands: hands,
      bankroll: d.state.bankroll - hand.bet,
      firstAction: false,
    });
  }

  if (action === "surrender") {
    const h: Hand = { ...hand, surrendered: true };
    const hands = state.playerHands.map((x, i) => (i === idx ? h : x));
    return finishOrContinue({ ...state, playerHands: hands, firstAction: false });
  }

  const aCard = hand.cards[0]!;
  const bCard = hand.cards[1]!;
  const fromAce = aCard.rank === "A";
  let n: TableState = { ...state, bankroll: state.bankroll - hand.bet };

  let handA = emptyHand(hand.bet, { cards: [aCard], fromSplit: true, fromAceSplit: fromAce });
  let handB = emptyHand(hand.bet, { cards: [bCard], fromSplit: true, fromAceSplit: fromAce });

  const d1 = take(n);
  n = d1.state;
  handA = { ...handA, cards: [aCard, d1.card] };
  const d2 = take(n);
  n = d2.state;
  handB = { ...handB, cards: [bCard, d2.card] };

  if (fromAce && !rules.hitSplitAces) {
    handA = { ...handA, stood: true };
    handB = { ...handB, stood: true };
  }

  const others = n.playerHands.filter((_, i) => i !== idx);
  const hands = [...others.slice(0, idx), handA, handB, ...others.slice(idx)];
  return finishOrContinue({ ...n, playerHands: hands, active: idx, firstAction: true });
}

export function dealerDraw(state: TableState, rules: Rules): TableState {
  const d = take(state);
  return { ...d.state, dealer: [...d.state.dealer, d.card], holeRevealed: true };
}

export function nextRound(state: TableState): TableState {
  const bet =
    state.bankroll >= MIN_BET ? Math.min(Math.max(MIN_BET, state.bet), state.bankroll) : 0;
  return {
    ...state,
    playerHands: [],
    dealer: [],
    holeRevealed: false,
    phase: "betting",
    insuranceBet: 0,
    firstAction: true,
    lastSettled: [],
    netDelta: 0,
    bet,
    active: 0,
  };
}

export function outcomeCopy(outcome: SettledHand["outcome"]): string {
  switch (outcome) {
    case "blackjack":
      return "Blackjack";
    case "win":
      return "Win";
    case "push":
      return "Push";
    case "lose":
      return "Lose";
    case "bust":
      return "Bust";
    case "surrender":
      return "Surrender";
  }
}
