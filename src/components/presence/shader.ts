export const VERTEX_SHADER = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/*
 * The Presence (direction 3a): three translucent membranes around a lit core,
 * over a soft glow. Each membrane's edge is displaced by layered sines at its own
 * phase, so the layers slide past each other. Port of the designer's reference
 * renderer (docs/design-handoff/from-designer/Orb.dc.html).
 *
 * Output is premultiplied alpha. Membranes blend with "screen" in Twilight and
 * "source-over" in Dawn (u_screen), matching --orb-blend.
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2 u_res;
uniform float u_phase;   // accumulated time × swirl
uniform float u_radius;  // R in units of the canvas size
uniform float u_wobble;
uniform float u_ripple;
uniform float u_level;
uniform float u_spread;
uniform float u_glowAmt; // glow-alpha × glow × (1 + 0.5 level)
uniform float u_screen;  // 1.0 = screen blend, 0.0 = source-over
uniform vec3 u_tone;
uniform vec3 u_core;
uniform vec3 u_membrane;

float edgeNoise(float a, float t, float ph) {
  return (sin(3.0 * a + 0.7 * t + ph)
        + 0.6 * sin(5.0 * a - 0.9 * t + 2.0 * ph)
        + 0.35 * sin(8.0 * a + 1.3 * t + ph)) / 1.95;
}

// Coverage (0..1) of a wobbly blob of base radius R.
float blob(vec2 p, float R, float t, float wob, float ph, float rip, float aa) {
  float a = atan(p.y, p.x);
  float rad = R * (1.0 + wob * edgeNoise(a, t, ph) + rip * u_level * 0.02 * sin(11.0 * a - 5.0 * t + ph));
  return smoothstep(rad + aa, rad - aa, length(p));
}

vec4 composite(vec4 src, vec4 dst, float screen) {
  vec4 over = src + dst * (1.0 - src.a);
  vec4 scr = vec4(src.rgb + dst.rgb - src.rgb * dst.rgb, src.a + dst.a - src.a * dst.a);
  return mix(over, scr, screen);
}

void main() {
  float size = min(u_res.x, u_res.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / size;
  float aa = 1.2 / size;
  float R = u_radius;
  float r = length(p);
  float wob = u_wobble;

  // Glow: tone, fading from 0.4R out to the canvas edge.
  float g = clamp((r - 0.4 * R) / max(0.5 - 0.4 * R, 0.001), 0.0, 1.0);
  float ga = u_glowAmt * (1.0 - g);
  vec4 col = vec4(u_tone * ga, ga);

  // Membranes: outer (membrane color), middle and inner (tone).
  float m0 = blob(p, R * 1.22 * u_spread, u_phase, wob, 0.0, u_ripple, aa) * 0.22;
  col = composite(vec4(u_membrane * m0, m0), col, u_screen);
  float m1 = blob(p, R * 1.08 * u_spread, u_phase * (1.0 + 2.1 * 0.08), wob, 2.1, u_ripple, aa) * 0.38;
  col = composite(vec4(u_tone * m1, m1), col, u_screen);
  float m2 = blob(p, R * 0.94, u_phase * (1.0 + 4.3 * 0.08), wob, 4.3, u_ripple, aa) * 0.55;
  col = composite(vec4(u_tone * m2, m2), col, u_screen);

  // Lit core: radial gradient core → tone, offset up and to the left.
  float cm = blob(p, R * 0.85, u_phase * 1.2, wob * 0.8, 1.3, 0.0, aa);
  float d = clamp(length(p - vec2(-0.12 * R, 0.15 * R)) / (0.85 * R), 0.0, 1.0);
  vec3 cc = d < 0.35 ? u_core : mix(u_core, u_tone, (d - 0.35) / 0.65);
  float ca = d < 0.35 ? mix(0.95, 0.55, d / 0.35) : mix(0.55, 0.0, (d - 0.35) / 0.65);
  ca *= cm;
  col = composite(vec4(cc * ca, ca), col, 0.0);

  gl_FragColor = col;
}
`;
