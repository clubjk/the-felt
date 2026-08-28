import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex min-w-0 items-center gap-2">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ArrowLeft className="size-5" />
          </Button>
        ) : (
          <span className="size-11" />
        )}
        <h1 className="truncate font-display text-xl font-medium tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}
