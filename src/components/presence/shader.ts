export const VERTEX_SHADER = /* glsl */ `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/*
 * The Presence: a soft organic blob.
 * Radius is perturbed by simplex noise sampled around the circle, so the edge
 * breathes and wobbles; the interior swirls between the tone color and accent.
 */
export const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_color;
uniform vec3 u_accent;
uniform float u_scale;
uniform float u_wobble;
uniform float u_swirl;
uniform float u_level;
uniform float u_ripple;
uniform float u_glow;

// Simplex 3D noise — Ian McEwan, Ashima Arts (MIT).
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  vec2 dir = vec2(cos(a), sin(a));

  float t = u_time;
  float edge = snoise(vec3(dir * 0.75, t * 0.16)) * u_wobble
             + snoise(vec3(dir * 1.25 + 11.0, t * 0.27)) * u_wobble * 0.4;
  float ripple = sin(a * 5.0 - t * 4.0) * u_ripple * u_level * 0.018;
  float radius = 0.27 * u_scale + edge + u_level * 0.045 + ripple;
  float d = r - radius;

  float body = smoothstep(0.008, -0.008, d);

  // Interior swirl.
  float ang = t * u_swirl;
  mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
  vec2 p = rot * uv;
  float inner = snoise(vec3(p * 3.2, t * 0.22)) * 0.5 + 0.5;
  float depth = clamp(r / max(radius, 0.001), 0.0, 1.0);
  vec3 col = mix(u_color, u_accent, inner * 0.38);
  col = mix(col * 1.08, col * 0.82, depth * depth);
  float highlight = smoothstep(radius * 0.9, 0.0, length(uv - vec2(-0.09, 0.11) * u_scale));
  col += highlight * 0.16;

  float glow = exp(-max(d, 0.0) * 12.0) * (0.36 + u_level * 0.25) * u_glow;
  // Fade to nothing before the canvas edge so the glow never shows a square.
  glow *= smoothstep(0.5, 0.36, r);
  // Premultiplied: body over glow.
  float alpha = body + glow * (1.0 - body);
  vec3 outCol = col * body + u_color * glow * (1.0 - body);
  gl_FragColor = vec4(outCol, alpha);
}
`;
