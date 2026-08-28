import { cn } from "@/lib/utils";
import type { Card, Suit } from "@/lib/blackjack/types";

function SuitMark({ suit, className }: { suit: Suit; className?: string }) {
  const red = suit === "hearts" || suit === "diamonds";
  return (
    <svg viewBox="0 0 100 100" className={cn("overflow-visible", className)} aria-hidden>
      {suit === "spades" && (
        <path
          fill="currentColor"
          d="M50 6C28 32 10 46 10 66c0 14 10 24 24 24 6 0 11-3 16-10 5 7 10 10 16 10 14 0 24-10 24-24 0-20-18-34-40-60zM42 78c2 10 4 16 8 22h0c4-6 6-12 8-22H42z"
        />
      )}
      {suit === "hearts" && (
        <path
          fill="currentColor"
          d="M50 90 16 50C6 38 10 14 32 14c10 0 16 8 18 16 2-8 8-16 18-16 22 0 26 24 16 36L50 90z"
        />
      )}
      {suit === "diamonds" && <polygon fill="currentColor" points="50,6 94,50 50,94 6,50" />}
      {suit === "clubs" && (
        <path
          fill="currentColor"
          d="M50 18c-12 0-20 10-20 20 0 6 3 12 8 16-10 2-18 10-18 20 0 12 10 20 22 20 6 0 10-2 16-8 6 6 10 8 16 8 12 0 22-8 22-20 0-10-8-18-18-20 5-4 8-10 8-16 0-10-8-20-20-20zM44 82c2 8 4 14 6 18h0c2-4 4-10 6-18H44z"
        />
      )}
      {red ? <title>{suit}</title> : null}
    </svg>
  );
}

export function PlayingCard({
  card,
  faceDown = false,
  delay = 0,
  rot = 0,
  size = "md",
}: {
  card?: Card;
  faceDown?: boolean;
  delay?: number;
  rot?: number;
  size?: "sm" | "md";
}) {
  const red = card ? card.suit === "hearts" || card.suit === "diamonds" : false;
  const sm = size === "sm";
  return (
    <div
      className={cn("playing-card deal-in shrink-0", sm && "playing-card-sm")}
      style={{ animationDelay: `${delay}ms`, ["--deal-rot" as string]: `${rot}deg` }}
    >
      <div className={cn("card-inner", faceDown && "is-down")}>
        <div className={cn("card-face p-1.5", red ? "text-heart" : "text-card-ink")}>
          {card ? (
            <div className="flex h-full flex-col justify-between">
              <div className="flex flex-col items-start leading-none">
                <span
                  className={cn(
                    "font-display font-semibold tabular-nums",
                    sm
                      ? card.rank === "10"
                        ? "text-base"
                        : "text-lg"
                      : card.rank === "10"
                        ? "text-lg"
                        : "text-xl",
                  )}
                >
                  {card.rank}
                </span>
                <SuitMark suit={card.suit} className={cn("mt-0.5", sm ? "size-3" : "size-3.5")} />
              </div>
              <div className="flex flex-1 items-center justify-center">
                <SuitMark suit={card.suit} className={sm ? "size-6" : "size-8 sm:size-10"} />
              </div>
              <div className="flex rotate-180 flex-col items-start leading-none">
                <span
                  className={cn(
                    "font-display font-semibold tabular-nums",
                    sm
                      ? card.rank === "10"
                        ? "text-base"
                        : "text-lg"
                      : card.rank === "10"
                        ? "text-lg"
                        : "text-xl",
                  )}
                >
                  {card.rank}
                </span>
                <SuitMark suit={card.suit} className={cn("mt-0.5", sm ? "size-3" : "size-3.5")} />
              </div>
            </div>
          ) : null}
        </div>
        <div className="card-back" />
      </div>
    </div>
  );
}

export function CardFan({
  cards,
  hideHole = false,
  startDelay = 0,
  size = "md",
}: {
  cards: Card[];
  hideHole?: boolean;
  startDelay?: number;
  size?: "sm" | "md";
}) {
  const n = cards.length;
  const sm = size === "sm";
  return (
    <div className={cn("flex items-end justify-center", sm ? "pl-5 sm:pl-6" : "pl-6 sm:pl-8")}>
      {cards.map((card, i) => {
        const rot = (i - (n - 1) / 2) * 5;
        return (
          <div
            key={card.id}
            className={sm ? "-ml-5 sm:-ml-6" : "-ml-6 sm:-ml-8"}
            style={{ zIndex: i + 1, transform: `rotate(${rot}deg)`, transformOrigin: "bottom center" }}
          >
            <PlayingCard
              card={card}
              faceDown={hideHole && i === 1}
              delay={startDelay + i * 70}
              rot={rot}
              size={size}
            />
          </div>
        );
      })}
    </div>
  );
}
