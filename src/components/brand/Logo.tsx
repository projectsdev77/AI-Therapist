import { BRAND } from "@/lib/brand";

/** The orb mark: membrane, middle, and core, drawn from tokens so it follows the theme. */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="15" fill="var(--tone-neutral)" opacity=".35" />
      <circle cx="15" cy="15.5" r="11" fill="var(--tone-neutral)" opacity=".6" />
      <circle cx="14.5" cy="14.5" r="6.5" fill="var(--orb-core)" />
    </svg>
  );
}

/** Lowercase Instrument Serif italic wordmark. A rename is a one-string change in BRAND. */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`font-accent text-[27px] leading-none tracking-[-0.01em] italic ${className}`}>{BRAND.name.toLowerCase()}</span>;
}
