import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition-[transform,background-color,opacity,box-shadow] duration-150 ease-out active:not-disabled:scale-[0.96] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:brightness-105",
        secondary:
          "bg-surface-2 text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_12%,transparent)] hover:bg-surface",
        ghost: "text-fg hover:bg-surface-2",
        good: "bg-good/20 text-fg shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-good)_40%,transparent)]",
        bad: "bg-bad/15 text-fg",
        book: "bg-accent text-accent-fg ring-2 ring-good ring-offset-2 ring-offset-bg hover:brightness-105",
      },
      size: {
        sm: "h-10 px-3 rounded-sm text-sm",
        md: "h-11 px-4 rounded-md text-sm",
        lg: "h-12 px-5 rounded-lg text-base",
        xl: "min-h-14 px-5 rounded-lg text-base",
        icon: "size-11 rounded-md",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
