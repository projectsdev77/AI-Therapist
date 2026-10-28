import { BRAND } from "@/lib/brand";

/** The orb dot (README "Top bar"): a 24px orb with an aqua ring. */
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 50% 42%, #1a8c84, #0b3c44 62%, #04141a)",
        boxShadow: size > 20 ? "0 0 0 2px rgba(111,240,230,.55), 0 0 12px rgba(63,214,205,.5)" : "0 0 0 1.5px rgba(111,240,230,.55)",
      }}
    />
  );
}

/** "Haven" at 18/600. A rename is a one-string change in BRAND. */
export function Wordmark({ className = "" }: { className?: string }) {
  return <span className={`text-[18px] font-semibold tracking-[-0.025em] ${className}`}>{BRAND.name}</span>;
}
