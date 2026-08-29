import {
  DEFAULT_RULES,
  SAVE_VERSION,
  STARTING_BANKROLL,
  type PersistedStats,
} from "./types";

const KEY = "felt-blackjack-v1";

export function defaultStats(): PersistedStats {
  return {
    version: SAVE_VERSION,
    bankroll: STARTING_BANKROLL,
    decisions: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    handsPlayed: 0,
    byKey: {},
    settings: {
      hitSoft17: DEFAULT_RULES.hitSoft17,
      lateSurrender: DEFAULT_RULES.lateSurrender,
      coachMode: "after",
      sound: true,
    },
  };
}

function migrate(raw: PersistedStats): PersistedStats {
  const base = defaultStats();
  const next = {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    settings: { ...base.settings, ...raw.settings },
    byKey: raw.byKey ?? {},
  };
  if ((raw.version ?? 0) < 3) {
    next.bankroll = STARTING_BANKROLL;
  }
  return next;
}

export function loadStats(): PersistedStats {
  if (typeof window === "undefined") return defaultStats();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as PersistedStats;
    if (!parsed || typeof parsed !== "object") return defaultStats();
    return migrate(parsed);
  } catch {
    return defaultStats();
  }
}

export function saveStats(stats: PersistedStats): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...stats, version: SAVE_VERSION }));
  } catch {
    // private mode / quota — keep playing in memory
  }
}
