import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "care" | "careOutline" | "link";
type Size = "md" | "lg" | "xl" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent font-medium",
  secondary: "bg-surface text-text border border-border shadow-soft hover:bg-surface-strong",
  ghost: "bg-transparent text-muted hover:text-text",
  care: "bg-care-strong text-on-care font-medium",
  careOutline: "bg-transparent text-care border border-care font-medium",
  link: "bg-transparent text-text underline underline-offset-4 decoration-border hover:decoration-current",
};

const SIZES: Record<Size, string> = {
  md: "min-h-11 px-5 text-[15px]",
  lg: "min-h-14 px-6 text-[17px]",
  xl: "min-h-16 px-8 text-lg",
  icon: "size-11 justify-center",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return [
    "inline-flex items-center justify-center gap-2 rounded-pill select-none",
    "transition-[background-color,color,border-color,transform] duration-[var(--motion-base)] ease-calm",
    "active:scale-[0.98] active:duration-[var(--motion-fast)]",
    "disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  ].join(" ");
}

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant, size, className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({ variant, size, className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
