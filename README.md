# The Felt

**Play now: [clubjk.github.io/the-felt](https://clubjk.github.io/the-felt/)**

Blackjack trainer. Sit across from the dealer. Every hit, stand, double, split, and surrender is graded against basic strategy.

**Rules:** 4-deck chute · H17 · DAS · late surrender · blackjack pays 3:2  
**Bankroll:** you sit down with $100

## Play

Open the link above on your phone or computer. No install.

- **Sit down** — play a full table vs the dealer. The book play is highlighted on every decision.
- **Spot trainer** — drill hard totals, soft totals, pairs, and weak spots.
- **Chart** — color-coded basic-strategy grid. Tap a cell to train that spot.
- **Record** — accuracy, streak, and the situations you miss.

Coach modes: *Review after*, *Hint first*, *Strict* (wrong actions are blocked).

On a phone, tap **Sit down**, place a bet, then follow the gold **Book** button. Keyboard on desktop: H hit, S stand, D double, P split, R surrender.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (port 8080).

```bash
npm run build:pages   # static site used by GitHub Pages
npm run typecheck
```

## Stack

React 19, TanStack Start, Tailwind v4, Zustand. Strategy tables live in `src/lib/blackjack/strategy.ts`.
