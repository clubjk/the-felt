import { cn } from "@/lib/utils";

const TONE: Record<number, { fill: string; ink: string; ring: string }> = {
  5: { fill: "var(--color-accent)", ink: "var(--color-accent-fg)", ring: "var(--color-accent-fg)" },
  25: { fill: "var(--color-felt)", ink: "var(--color-fg)", ring: "var(--color-accent)" },
  100: { fill: "var(--color-card-ink)", ink: "var(--color-accent)", ring: "var(--color-accent)" },
  500: { fill: "var(--color-heart)", ink: "var(--color-fg)", ring: "var(--color-accent)" },
};

export function Chip({
  value,
  selected = false,
  onClick,
  disabled,
}: {
  value: number;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const tone = TONE[value] ?? TONE[5]!;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={`Add ${value} chip`}
      className={cn(
        "chip relative grid place-items-center rounded-full transition-transform duration-150 ease-out active:not-disabled:scale-[0.96] disabled:opacity-40",
        selected && "ring-2 ring-accent ring-offset-2 ring-offset-bg",
      )}
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        <circle cx="50" cy="50" r="48" fill={tone.fill} />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={tone.ring}
          strokeWidth="3"
          strokeDasharray="7 6"
          opacity="0.85"
        />
        <circle cx="50" cy="50" r="28" fill="none" stroke={tone.ring} strokeWidth="2" opacity="0.5" />
      </svg>
      <span
        className="absolute font-display text-sm font-semibold tabular-nums"
        style={{ color: tone.ink }}
      >
        {value}
      </span>
    </button>
  );
}
