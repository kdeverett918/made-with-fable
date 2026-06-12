import sharp from 'sharp'

const width = 1200
const height = 630

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="1200" height="630" fill="#f0eee8"/>
  <filter id="paper">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.06"/>
    </feComponentTransfer>
  </filter>
  <rect width="1200" height="630" filter="url(#paper)"/>
  <rect x="10" y="10" width="1180" height="610" fill="none" stroke="#141310" stroke-width="6"/>
  <line x1="10" y1="72" x2="1190" y2="72" stroke="#141310" stroke-width="5"/>
  <line x1="360" y1="10" x2="360" y2="72" stroke="#141310" stroke-width="5"/>
  <line x1="630" y1="10" x2="630" y2="72" stroke="#141310" stroke-width="5"/>
  <text x="38" y="48" font-family="JetBrains Mono, Consolas, monospace" font-size="20" font-weight="700" letter-spacing="2" fill="#141310">FABLE COMMUNITY</text>
  <text x="390" y="48" font-family="JetBrains Mono, Consolas, monospace" font-size="20" font-weight="700" letter-spacing="2" fill="#d1232a">/ GALLERY</text>
  <text x="662" y="48" font-family="JetBrains Mono, Consolas, monospace" font-size="20" font-weight="700" letter-spacing="2" fill="#141310">LIKE · COMMENT · SHARE</text>
  <text x="38" y="334" font-family="Impact, Anton, Arial Black, sans-serif" font-size="168" font-weight="900" letter-spacing="-6" fill="#141310">MADE WITH</text>
  <text x="38" y="500" font-family="Impact, Anton, Arial Black, sans-serif" font-size="176" font-weight="900" letter-spacing="-6" fill="#141310">FABLE</text>
  <g transform="translate(1002 116) rotate(-10)">
    <line x1="36" y1="58" x2="36" y2="128" stroke="#141310" stroke-width="10"/>
    <circle cx="36" cy="36" r="29" fill="#d1232a" stroke="#141310" stroke-width="6"/>
    <circle cx="36" cy="36" r="8" fill="#f0eee8"/>
  </g>
  <line x1="10" y1="542" x2="1190" y2="542" stroke="#141310" stroke-width="5"/>
  <line x1="760" y1="542" x2="760" y2="620" stroke="#141310" stroke-width="5"/>
  <text x="38" y="588" font-family="JetBrains Mono, Consolas, monospace" font-size="22" font-weight="700" letter-spacing="1.2" fill="#141310">PROJECTS MADE WITH FABLE, PINNED BY THE COMMUNITY.</text>
  <text x="804" y="588" font-family="JetBrains Mono, Consolas, monospace" font-size="22" font-weight="700" letter-spacing="1.2" fill="#d1232a">SUBMIT A PROJECT →</text>
</svg>`

await sharp(Buffer.from(svg)).png().toFile('public/og-image.png')
