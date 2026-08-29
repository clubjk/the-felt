import { create } from "zustand";
import { sfx, setSoundEnabled, unlockAudio } from "./audio";
import {
  addChip as addTableChip,
  applyAction,
  applyInsurance,
  canTakeInsurance,
  coachForAction,
  coachForInsurance,
  dealRound,
  dealerDraw,
  dealerShouldHit,
  freshTable,
  legalForActive,
  needsShuffle,
  nextRound,
  settleRound,
  shouldDealerPlay,
  clearBet as clearTableBet,
  type TableState,
} from "./engine";
import {
  cardsForSpot,
  drillLegal,
  pickSpot,
  type DrillFocus,
  type Spot,
} from "./drills";
import { explainDecision } from "./explain";
import { loadStats, saveStats } from "./persist";
import { optimalAction, type LegalSet } from "./strategy";
import {
  DEFAULT_RULES,
  MIN_BET,
  SAVE_VERSION,
  STARTING_BANKROLL,
  type Action,
  type Card,
  type CoachEvent,
  type CoachMode,
  type DecisionStat,
  type InsuranceChoice,
  type PersistedStats,
  type Rules,
  type View,
} from "./types";

export interface DrillState {
  focus: DrillFocus;
  spot: Spot;
  player: Card[];
  dealer: Card;
  legal: ReturnType<typeof drillLegal>;
  resolved: CoachEvent | null;
}

export interface GameStore {
  hydrated: boolean;
  view: View;
  rules: Rules;
  coachMode: CoachMode;
  sound: boolean;
  bankroll: number;
  decisions: number;
  correct: number;
  streak: number;
  bestStreak: number;
  handsPlayed: number;
  byKey: Record<string, DecisionStat>;
  table: TableState | null;
  drill: DrillState | null;
  busy: boolean;
  lastCoach: CoachEvent | null;
  runId: number;

  hydrate: () => void;
  persist: () => void;
  setView: (view: View) => void;
  setCoachMode: (mode: CoachMode) => void;
  setSound: (on: boolean) => void;
  setHitSoft17: (on: boolean) => void;
  setLateSurrender: (on: boolean) => void;
  sitDown: () => void;
  addChip: (value: number) => void;
  clearBet: () => void;
  deal: () => Promise<void>;
  act: (action: Action) => void;
  insure: (choice: InsuranceChoice) => void;
  nextHand: () => void;
  rebuy: () => void;
  startDrill: (focus: DrillFocus, spot?: Spot) => void;
  drillAct: (action: Action | InsuranceChoice) => void;
  drillNext: () => void;
  resetRecord: () => void;
}

function motionMs(ms: number): number {
  if (typeof window === "undefined") return 0;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  return ms;
}

function snapshot(st: GameStore): PersistedStats {
  return {
    version: SAVE_VERSION,
    bankroll: st.bankroll,
    decisions: st.decisions,
    correct: st.correct,
    streak: st.streak,
    bestStreak: st.bestStreak,
    handsPlayed: st.handsPlayed,
    byKey: st.byKey,
    settings: {
      hitSoft17: st.rules.hitSoft17,
      lateSurrender: st.rules.lateSurrender,
      coachMode: st.coachMode,
      sound: st.sound,
    },
  };
}

export const useGame = create<GameStore>((set, get) => {
  const record = (event: CoachEvent) => {
    const st = get();
    const prev = st.byKey[event.key] ?? { n: 0, correct: 0 };
    const nextStat = { n: prev.n + 1, correct: prev.correct + (event.correct ? 1 : 0) };
    const streak = event.correct ? st.streak + 1 : 0;
    set({
      lastCoach: event,
      decisions: st.decisions + 1,
      correct: st.correct + (event.correct ? 1 : 0),
      streak,
      bestStreak: Math.max(st.bestStreak, streak),
      byKey: { ...st.byKey, [event.key]: nextStat },
    });
    sfx(event.correct ? "correct" : "wrong");
    get().persist();
  };

  const finishSettle = (table: TableState) => {
    set({
      table,
      busy: false,
      bankroll: table.bankroll,
      handsPlayed: get().handsPlayed + table.playerHands.length,
    });
    if (table.netDelta > 0) sfx("win");
    else if (table.netDelta < 0) sfx("lose");
    get().persist();
  };

  const runDealer = async (from: TableState) => {
    const my = get().runId;
    const rules = get().rules;
    let table: TableState = { ...from, holeRevealed: true, phase: "dealer" };
    set({ table, busy: true });
    await sleep(motionMs(420));
    if (get().runId !== my || get().view !== "play") return;

    if (shouldDealerPlay(table)) {
      while (dealerShouldHit(table.dealer, rules)) {
        table = dealerDraw(table, rules);
        sfx("card");
        set({ table });
        await sleep(motionMs(480));
        if (get().runId !== my || get().view !== "play") return;
      }
    }
    finishSettle(settleRound(table, rules));
  };

  return {
    hydrated: false,
    view: "menu",
    rules: { ...DEFAULT_RULES },
    coachMode: "after",
    sound: true,
    bankroll: STARTING_BANKROLL,
    decisions: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    handsPlayed: 0,
    byKey: {},
    table: null,
    drill: null,
    busy: false,
    lastCoach: null,
    runId: 0,

    hydrate: () => {
      if (get().hydrated) return;
      const saved = loadStats();
      set({
        hydrated: true,
        bankroll: saved.bankroll,
        decisions: saved.decisions,
        correct: saved.correct,
        streak: saved.streak,
        bestStreak: saved.bestStreak,
        handsPlayed: saved.handsPlayed,
        byKey: saved.byKey,
        coachMode: saved.settings.coachMode,
        sound: saved.settings.sound,
        rules: {
          ...DEFAULT_RULES,
          hitSoft17: saved.settings.hitSoft17,
          lateSurrender: saved.settings.lateSurrender,
        },
      });
      setSoundEnabled(saved.settings.sound);
    },

    persist: () => {
      if (!get().hydrated) return;
      saveStats(snapshot(get()));
    },

    setView: (view) => {
      set({ view, runId: get().runId + 1, busy: false });
      if (view === "menu") set({ lastCoach: null });
    },

    setCoachMode: (mode) => {
      set({ coachMode: mode });
      get().persist();
    },

    setSound: (on) => {
      set({ sound: on });
      setSoundEnabled(on);
      unlockAudio();
      get().persist();
    },

    setHitSoft17: (on) => {
      set({ rules: { ...get().rules, hitSoft17: on } });
      get().persist();
    },

    setLateSurrender: (on) => {
      set({ rules: { ...get().rules, lateSurrender: on } });
      get().persist();
    },

    sitDown: () => {
      const { bankroll, rules } = get();
      unlockAudio();
      set({
        view: "play",
        table: freshTable(bankroll, rules, Math.min(MIN_BET, Math.max(bankroll, 0))),
        lastCoach: null,
        busy: false,
        runId: get().runId + 1,
      });
    },

    addChip: (value) => {
      const table = get().table;
      if (!table || table.phase !== "betting") return;
      sfx("chip");
      set({ table: addTableChip(table, value) });
    },

    clearBet: () => {
      const table = get().table;
      if (!table || table.phase !== "betting") return;
      set({ table: clearTableBet(table) });
    },

    deal: async () => {
      const { table, rules, busy } = get();
      if (!table || busy || table.phase !== "betting") return;
      if (table.bet < MIN_BET || table.bankroll < MIN_BET) return;
      unlockAudio();
      const my = get().runId;
      set({ busy: true, lastCoach: null });
      sfx("chip");
      if (needsShuffle(table)) {
        set({ table: { ...table, phase: "shuffle" } });
        await sleep(motionMs(700));
        if (get().runId !== my || get().view !== "play") return;
      }
      const dealt = dealRound(get().table ?? table, rules);
      sfx("deal");
      set({ table: dealt, bankroll: dealt.bankroll, busy: dealt.phase === "dealer" });
      get().persist();
      if (dealt.phase === "settle") finishSettle(dealt);
    },

    act: (action) => {
      const { table, rules, coachMode, busy } = get();
      if (!table || busy || table.phase !== "player") return;
      const legal = legalForActive(table, rules);
      if (!legal[action]) return;
      const event = coachForAction(table, rules, action);
      if (!event) return;
      record(event);
      if (coachMode === "strict" && !event.correct) return;
      const next = applyAction(table, rules, action);
      set({ table: next, bankroll: next.bankroll });
      if (action === "hit" || action === "double" || action === "split") sfx("card");
      if (next.phase === "dealer") void runDealer(next);
    },

    insure: (choice) => {
      const { table, rules, coachMode, busy } = get();
      if (!table || busy || table.phase !== "insurance") return;
      if (choice === "take" && !canTakeInsurance(table)) return;
      const event = coachForInsurance(table, choice);
      record(event);
      if (coachMode === "strict" && !event.correct) return;
      const next = applyInsurance(table, rules, choice);
      set({ table: next, bankroll: next.bankroll });
      if (next.phase === "settle") finishSettle(next);
    },

    nextHand: () => {
      const table = get().table;
      if (!table || table.phase !== "settle") return;
      set({ table: nextRound(table), lastCoach: null, busy: false });
    },

    rebuy: () => {
      const table = get().table;
      set({
        bankroll: STARTING_BANKROLL,
        table: table
          ? { ...table, bankroll: STARTING_BANKROLL, bet: MIN_BET, phase: "betting", playerHands: [], dealer: [] }
          : table,
      });
      get().persist();
    },

    startDrill: (focus, spot) => {
      const { rules, byKey } = get();
      const picked = spot ?? pickSpot(focus, byKey);
      const dealt = cardsForSpot(picked);
      const legal = drillLegal(dealt.player, rules);
      const tab: DrillFocus = spot
        ? picked.kind === "hard"
          ? "hard"
          : picked.kind === "soft"
            ? "soft"
            : "pairs"
        : focus;
      set({
        view: "drill",
        lastCoach: null,
        drill: {
          focus: tab,
          spot: picked,
          player: dealt.player,
          dealer: dealt.dealer,
          legal,
          resolved: null,
        },
      });
    },

    drillAct: (action) => {
      const { drill, rules, coachMode } = get();
      if (!drill || drill.resolved) return;
      let event: CoachEvent;
      if (drill.spot.kind === "insurance") {
        if (action !== "take" && action !== "pass") return;
        const taken = action === "take" ? "insurance" : "noInsurance";
        event = {
          key: "insurance-0-vs-A",
          category: "insurance",
          taken,
          optimal: "noInsurance",
          correct: taken === "noInsurance",
          ...explainDecision({
            kind: "insurance",
            total: 0,
            dealerRank: "A",
            taken,
            optimal: "noInsurance",
            correct: taken === "noInsurance",
          }),
        };
      } else {
        if (action === "take" || action === "pass") return;
        if (!drill.legal[action]) return;
        const opt = optimalAction(drill.player, drill.dealer, rules, drill.legal);
        const correct = action === opt.action;
        event = {
          key: `${opt.kind}-${opt.total}-vs-${drill.dealer.rank}`,
          category: opt.kind,
          taken: action,
          optimal: opt.action,
          correct,
          ...explainDecision({
            kind: opt.kind,
            total: opt.total,
            dealerRank: drill.dealer.rank,
            taken: action,
            optimal: opt.action,
            correct,
          }),
        };
      }
      record(event);
      if (coachMode === "strict" && !event.correct) return;
      set({ drill: { ...drill, resolved: event } });
    },

    drillNext: () => {
      const drill = get().drill;
      get().startDrill(drill?.focus ?? "mixed");
    },

    resetRecord: () => {
      const { rules, coachMode, sound, bankroll } = get();
      set({
        decisions: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
        handsPlayed: 0,
        byKey: {},
        lastCoach: null,
        bankroll: Math.max(bankroll, STARTING_BANKROLL),
      });
      saveStats({
        version: SAVE_VERSION,
        bankroll: Math.max(bankroll, STARTING_BANKROLL),
        decisions: 0,
        correct: 0,
        streak: 0,
        bestStreak: 0,
        handsPlayed: 0,
        byKey: {},
        settings: {
          hitSoft17: rules.hitSoft17,
          lateSurrender: rules.lateSurrender,
          coachMode,
          sound,
        },
      });
    },
  };
});

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function legalFromStore(): LegalSet {
  const { table, rules } = useGame.getState();
  if (!table) return { hit: false, stand: false, double: false, split: false, surrender: false };
  return legalForActive(table, rules);
}
