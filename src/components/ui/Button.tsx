import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Deep lagoon buttons (README "Buttons"). Aqua always means "do it"; lilac always means care.
 * Only one primary button per view.
 */
type Variant = "primary" | "secondary" | "tertiary" | "ghost" | "outline" | "care" | "careOutline" | "danger" | "dangerOutline" | "link";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-mic text-mic-fg font-semibold hover:bg-mic-hover",
  secondary: "bg-glass-strong border border-edge-hi text-text font-medium hover:bg-glass-hover",
  tertiary: "bg-transparent text-muted hover:bg-glass hover:text-text",
  ghost: "bg-transparent text-muted hover:bg-glass hover:text-text",
  outline: "bg-transparent border border-edge-hi text-text hover:bg-glass",
  care: "bg-care text-on-care font-semibold",
  careOutline: "bg-transparent border border-[rgba(220,207,255,.5)] text-care font-semibold hover:bg-care-surface",
  danger: "bg-danger text-danger-on font-semibold",
  dangerOutline: "bg-transparent border border-danger-edge text-danger-text font-medium",
  link: "bg-transparent text-text underline underline-offset-[3px] decoration-[rgba(239,252,250,.35)] hover:decoration-current",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-3.5 text-[14px]",
  md: "min-h-11 px-[18px] text-[15px]",
  lg: "min-h-12 px-5 text-[15px]",
  xl: "min-h-14 px-6 text-[17px]",
  icon: "size-11 justify-center",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra = "") {
  return [
    "press inline-flex items-center justify-center gap-2 rounded-pill select-none whitespace-nowrap",
    "disabled:opacity-45 disabled:pointer-events-none",
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
  return <Link className={buttonClass(variant, size, `no-underline hover:text-inherit ${className}`)} {...rest} />;
}
