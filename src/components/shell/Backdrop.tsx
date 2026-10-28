/**
 * The Deep lagoon background behind every screen: the --lg-bg gradient under three
 * blurred light streaks (README "Background"). Fixed to the viewport.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ background: "var(--lg-bg)" }}>
      <div
        className="absolute rounded-[50%]"
        style={{ width: "140%", height: 160, left: "-30%", top: 150, background: "var(--lg-streak-a)", filter: "blur(60px)", transform: "rotate(-16deg)" }}
      />
      <div
        className="absolute rounded-[50%]"
        style={{ width: "120%", height: 160, right: "-40%", top: "46%", background: "var(--lg-streak-b)", filter: "blur(64px)", transform: "rotate(14deg)" }}
      />
      <div
        className="absolute rounded-[50%]"
        style={{ width: "110%", height: 200, left: "-10%", bottom: -90, background: "var(--lg-streak-c)", filter: "blur(70px)" }}
      />
    </div>
  );
}
