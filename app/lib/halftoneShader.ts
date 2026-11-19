export const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// OCTAVES is injected at compile time (fewer on mobile).
export const fragment = /* glsl */ `
precision highp float;

uniform vec2 uRes;        // plane size in device px
uniform float uDot;       // cell size in device px
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uContrast;
uniform float uReveal;    // 0 → 1 dot growth on enter
uniform float uHover;     // 0 → 1
uniform vec2 uMouse;      // 0..1 plane coords
uniform float uTime;
uniform sampler2D uTex;
uniform vec2 uTexSize;
uniform float uMode;      // 0 image, 1 procedural
uniform float uPattern;   // 0 flow, 1 contour, 2 network, 3 orbits, 4 ribbon
uniform float uSeed;
uniform float uAngle;
uniform float uLighten;  // -1..1 global lift toward paper (negative = toward ink)
uniform float uDrift;    // 0..0.15 slow pan of the image (fraction of its size)
uniform float uShadow;      // 0..1 strength of the cursor shadow
uniform vec2 uShadowMouse;  // lagged cursor, 0..1 plane coords
uniform float uFade;     // 0..1 fade to paper toward the bottom edge

varying vec2 vUv;

// --- Simplex noise (Ashima Arts / Stefan Gustavson, MIT) ---
vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * snoise(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// Returns luminance in 0..1 (1 = paper, 0 = full ink)
float procedural(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.035;
  vec2 s = vec2(uSeed * 3.17, uSeed * 1.71);
  float lum = 1.0;

  if (uPattern < 0.5) {
    // Flow field: streamlines bent by noise, with a soft tonal sweep
    vec2 q = p * 1.6 + s;
    float n = fbm(q + vec2(t, -t * 0.6));
    float lines = abs(fract(n * 3.2 + p.y * 1.4 + t * 0.5) - 0.5) * 2.0;
    float band = smoothstep(0.0, 0.55, lines);
    float tone = smoothstep(-0.7, 0.9, p.x * 0.9 + n * 0.8);
    lum = mix(band, 1.0, tone * 0.75);
  } else if (uPattern < 1.5) {
    // Contour map: iso-lines of a noise terrain, darker in valleys
    vec2 q = p * 1.35 + s;
    float h = fbm(q + t * 0.4);
    float iso = abs(fract(h * 7.0) - 0.5) * 2.0;
    float line = smoothstep(0.0, 0.28, iso);
    float shade = smoothstep(-0.6, 0.6, h);
    lum = min(line, 0.35 + shade * 0.65);
  } else if (uPattern < 2.5) {
    // Node network: Voronoi edges + nodes at cell sites
    vec2 q = p * 3.2 + s;
    vec2 g = floor(q);
    vec2 f = fract(q);
    float f1 = 8.0; float f2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 r = hash2(g + o);
        r = 0.5 + 0.38 * sin(t * 2.0 + 6.2831 * r);
        float d = length(o + r - f);
        if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
      }
    }
    float edge = smoothstep(0.0, 0.07, f2 - f1);
    float node = smoothstep(0.08, 0.16, f1);
    float field = 0.55 + 0.45 * smoothstep(-0.5, 0.6, fbm(p * 0.9 + s));
    lum = min(min(edge, node), field);
  } else if (uPattern > 3.5) {
    // Ribbon: one wide silk band sweeping down from the top left, folding and
    // running out to the right, lit across its width, on a smooth backdrop.
    float dx = 0.004;
    float x0 = p.x - dx; float x1 = p.x + dx;
    // centreline y = f(x): steep descent on the left, gentle drift on the right
    float f  = -0.06 - 0.05 * p.x + 0.85 * (1.0 - smoothstep(-0.95, 0.05, p.x)) + 0.03 * sin(p.x * 3.0 + t * 2.0);
    float fa = -0.06 - 0.05 * x0  + 0.85 * (1.0 - smoothstep(-0.95, 0.05, x0))  + 0.03 * sin(x0 * 3.0 + t * 2.0);
    float fb = -0.06 - 0.05 * x1  + 0.85 * (1.0 - smoothstep(-0.95, 0.05, x1))  + 0.03 * sin(x1 * 3.0 + t * 2.0);
    float slope = (fb - fa) / (2.0 * dx);
    float d = (p.y - f) / sqrt(1.0 + slope * slope);     // signed distance to centreline
    float w = 0.16 + 0.2 * smoothstep(-0.3, 0.9, p.x);   // band widens to the right
    float v = d / w;                                      // -1..1 across the band
    float inside = 1.0 - smoothstep(0.92, 1.0, abs(v));

    // Silk shading: a slow twist along the band, darker deep in the folds
    float twist = sin(p.x * 2.4 + uSeed + t * 3.0) * 1.3;
    float shade = 0.5 + 0.5 * cos(v * 2.2 + twist);
    float rim = smoothstep(0.7, 0.95, abs(v)) * 0.35;               // bright edges
    float crease = 1.0 - 0.45 * exp(-pow((v - 0.35 * sin(p.x * 3.1 + t * 2.0)) * 9.0, 2.0)); // thin fold line
    float deep = smoothstep(-0.2, 0.9, p.x) * smoothstep(0.2, -0.6, p.y) * 0.25; // darker lower right
    float band = clamp(0.18 + 0.55 * shade + rim - deep, 0.0, 1.0) * crease;

    // Backdrop: soft vertical gradient, with a faint shadow next to the band
    float bg = 0.64 + 0.07 * p.y + 0.03 * fbm(p * 0.8 + s);
    float shadow = 0.12 * exp(-pow(max(abs(v) - 1.0, 0.0) * 2.2, 2.0)) * (1.0 - inside);
    lum = mix(bg - shadow, band, inside);
  } else {
    // Orbits: concentric rings around a drifting node
    vec2 c = vec2(sin(uSeed) * 0.25, cos(uSeed * 1.3) * 0.15) + 0.04 * vec2(sin(t * 3.0), cos(t * 2.0));
    float d = length(p - c);
    float warp = fbm(p * 1.2 + s) * 0.06;
    float rings = abs(fract((d + warp) * 7.0 - t * 1.5) - 0.5) * 2.0;
    float ring = smoothstep(0.0, 0.4, rings);
    float core = smoothstep(0.0, 0.12, d);
    float falloff = smoothstep(0.15, 0.95, d);
    lum = min(mix(ring, 1.0, falloff * 0.8), core);
  }
  return clamp(lum, 0.0, 1.0);
}

vec2 coverUv(vec2 uv) {
  float pa = uRes.x / uRes.y;
  float ta = uTexSize.x / max(uTexSize.y, 1.0);
  vec2 sc = pa > ta ? vec2(1.0, ta / pa) : vec2(pa / ta, 1.0);
  return (uv - 0.5) * sc + 0.5;
}

float sampleLum(vec2 uv) {
  if (uMode > 0.5) return procedural(uv);
  vec2 cu = coverUv(uv);
  if (uDrift > 0.0) {
    // Zoom in just enough to hide the edges, then glide top to bottom (~35s cycle)
    // with a smaller, out-of-phase sideways drift so the motion feels organic.
    float z = 1.0 / (1.0 + 2.0 * uDrift);
    vec2 sway = vec2(0.45 * sin(uTime * 0.11 + 1.3), sin(uTime * 0.18));
    cu = (cu - 0.5) * z + 0.5 + sway * uDrift * z;
  }
  vec3 c = texture2D(uTex, cu).rgb;
  return dot(c, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec2 frag = vUv * uRes;
  float ca = cos(uAngle); float sa = sin(uAngle);
  mat2 rot = mat2(ca, -sa, sa, ca);
  mat2 inv = mat2(ca, sa, -sa, ca);

  float cell = max(uDot, 2.0);
  vec2 r = rot * frag;
  vec2 cellCenter = (floor(r / cell) + 0.5) * cell;
  vec2 local = r - cellCenter;
  vec2 sampleUv = clamp((inv * cellCenter) / uRes, 0.0, 1.0);

  float lum = sampleLum(sampleUv);
  lum = clamp((lum - 0.5) * uContrast + 0.5, 0.0, 1.0);
  lum = clamp(mix(lum, 1.0, uLighten), 0.0, 1.0); // negative uLighten darkens
  lum = mix(lum, 1.0, uFade * smoothstep(0.62, 0.04, sampleUv.y));
  float aspect = uRes.x / uRes.y;

  // Cursor shadow: a soft pool of ink that trails the pointer (dots swell inside it)
  if (uShadow > 0.0) {
    vec2 sd = (sampleUv - uShadowMouse) * vec2(aspect, 1.0);
    float pool = smoothstep(0.34, 0.0, length(sd));
    lum *= 1.0 - uShadow * 0.72 * pool * pool * (3.0 - 2.0 * pool);
  }
  float darkness = 1.0 - lum;

  float md = distance(sampleUv * vec2(aspect, 1.0), uMouse * vec2(aspect, 1.0));
  float hover = uHover * smoothstep(0.38, 0.0, md);

  float radius = sqrt(darkness) * cell * 0.74 * uReveal * (1.0 + hover * 0.4);
  float d = length(local);
  float aa = min(0.9, cell * 0.12); // crisper edges on small dots so grain stays visible
  float dotMask = 1.0 - smoothstep(radius - aa, radius + aa, d);

  vec3 col = mix(uPaper, uInk, dotMask);
  gl_FragColor = vec4(col, 1.0);
}
`
