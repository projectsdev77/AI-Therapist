import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "care";
type Size = "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-strong",
  secondary: "bg-surface-strong text-text hover:bg-surface border border-border",
  ghost: "text-muted hover:text-text hover:bg-surface",
  care: "bg-care text-bg hover:opacity-90",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-8 text-lg",
  icon: "h-11 w-11 justify-center",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return [
    "inline-flex items-center gap-2 rounded-pill font-medium select-none",
    "transition-[background-color,color,opacity,transform] duration-300 ease-calm active:scale-[0.98]",
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
