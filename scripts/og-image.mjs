// Generates public/og-image.png (1200×630) from an SVG. Run: node scripts/og-image.mjs
// Placeholder social card; regenerate after the real logo is supplied.
import sharp from 'sharp'

const W = 1200
const H = 630
const ink = '#1A26AE'
const paper = '#E8E6E1'

// halftone dots fading from the right
let dots = ''
for (let y = 0; y < H; y += 14) {
  for (let x = 560; x < W; x += 14) {
    const t = (x - 560) / (W - 560)
    const wave = 0.5 + 0.5 * Math.sin(y / 60 + x / 90)
    const r = Math.max(0, 6 * t * wave)
    if (r > 0.6) dots += `<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${paper}" fill-opacity="0.9"/>`
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${ink}"/>
  ${dots}
  <g transform="translate(80 80) scale(1.1)" stroke="${paper}" stroke-width="3" fill="none">
    <path d="M50 14 81.2 32 81.2 68 50 86 18.8 68 18.8 32Z"/><path d="M50 14 81.2 68 18.8 68Z"/><path d="M50 50 81.2 32M50 50 50 86M50 50 18.8 32"/>
  </g>
  <g transform="translate(80 80) scale(1.1)" fill="${paper}">
    <circle cx="50" cy="14" r="6"/><circle cx="81.2" cy="32" r="6"/><circle cx="81.2" cy="68" r="6"/><circle cx="50" cy="86" r="6"/><circle cx="18.8" cy="68" r="6"/><circle cx="18.8" cy="32" r="6"/><circle cx="50" cy="50" r="8.5"/>
  </g>
  <text x="80" y="420" fill="${paper}" font-family="Arial, Helvetica, sans-serif" font-size="64" letter-spacing="-2">Understanding systems.</text>
  <text x="80" y="490" fill="${paper}" font-family="Arial, Helvetica, sans-serif" font-size="64" letter-spacing="-2">Anticipating change.</text>
  <text x="80" y="560" fill="#FFFFFF" font-family="Courier New, monospace" font-size="22" letter-spacing="3">SAVELLE GROUP AFRICA</text>
</svg>`

await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og-image.png', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'))
console.log('public/og-image.png written')
