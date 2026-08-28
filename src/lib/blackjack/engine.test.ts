import assert from "node:assert/strict";
import { test } from "node:test";
import { makeCard } from "./cards.ts";
import { evaluateHand, emptyHand, dealerShouldHit } from "./engine.ts";
import { legalActions, optimalAction } from "./strategy.ts";
import { DEFAULT_RULES } from "./types.ts";

const rules = DEFAULT_RULES;

function cards(...ranks: Array<"A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K">) {
  const suits = ["spades", "hearts", "diamonds", "clubs"] as const;
  return ranks.map((r, i) => makeCard(r, suits[i % 4]!));
}

function opt(player: ReturnType<typeof cards>, dealer: ReturnType<typeof cards>[0], extra?: Partial<Parameters<typeof legalActions>[0]>) {
  const legal = legalActions({
    cards: player,
    fromSplit: false,
    fromAceSplit: false,
    handsCount: 1,
    firstAction: true,
    rules,
    ...extra,
  });
  return optimalAction(player, dealer, rules, legal).action;
}

test("hard 16 vs 10 surrenders", () => {
  assert.equal(opt(cards("10", "6"), makeCard("K", "hearts")), "surrender");
});

test("hard 12 vs 2 hits", () => {
  assert.equal(opt(cards("10", "2"), makeCard("2", "clubs")), "hit");
});

test("hard 12 vs 4 stands", () => {
  assert.equal(opt(cards("10", "2"), makeCard("4", "clubs")), "stand");
});

test("always split aces", () => {
  assert.equal(opt(cards("A", "A"), makeCard("10", "spades")), "split");
});

test("never split tens", () => {
  assert.equal(opt(cards("10", "10"), makeCard("6", "hearts")), "stand");
});

test("soft 18 vs 9 hits", () => {
  assert.equal(opt(cards("A", "7"), makeCard("9", "diamonds")), "hit");
});

test("double 11 vs ace on H17", () => {
  assert.equal(opt(cards("5", "6"), makeCard("A", "spades")), "double");
});

test("8s vs ace surrenders when late surrender is on", () => {
  assert.equal(opt(cards("8", "8"), makeCard("A", "spades")), "surrender");
});

test("hard 16 vs ace surrenders", () => {
  assert.equal(opt(cards("10", "6"), makeCard("A", "clubs")), "surrender");
});

test("blackjack pays 3:2", () => {
  const player = emptyHand(20, { cards: cards("A", "K") });
  const r = evaluateHand(player, cards("9", "7"), rules);
  assert.equal(r.outcome, "blackjack");
  assert.equal(r.delta, 30);
});

test("bust loses the bet", () => {
  const player = emptyHand(25, { cards: cards("10", "8", "6") });
  const r = evaluateHand(player, cards("10", "7"), rules);
  assert.equal(r.outcome, "bust");
  assert.equal(r.delta, -25);
});

test("dealer hits soft 17 when H17", () => {
  assert.equal(dealerShouldHit(cards("A", "6"), rules), true);
  assert.equal(dealerShouldHit(cards("10", "7"), rules), false);
  assert.equal(dealerShouldHit(cards("A", "7"), rules), false);
});
