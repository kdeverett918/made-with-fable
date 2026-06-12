import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'seed-assets', 'prepared')
const CAPTURES = path.join(ROOT, 'seed-assets', 'dizzy')
const FINAL = path.join(ROOT, 'seed-assets', 'final')

mkdirSync(OUT, { recursive: true })

function mustExist(file) {
  if (!existsSync(file)) throw new Error(`Missing source asset: ${path.relative(ROOT, file)}`)
  return file
}

function labelSvg({ title, eyebrow, width, height }) {
  const safeTitle = title.replaceAll('&', '&amp;')
  const safeEyebrow = eyebrow.replaceAll('&', '&amp;')
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#14120f" stroke-width="8"/>
      <rect x="0" y="0" width="${width}" height="74" fill="#14120f"/>
      <rect x="32" y="26" width="16" height="16" fill="#ee3d2f"/>
      <text x="64" y="42" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#f6f1e8">${safeEyebrow}</text>
      <text x="32" y="${height - 34}" font-family="Arial Black, Arial, sans-serif" font-size="44" font-weight="900" letter-spacing="1" fill="#f6f1e8" stroke="#14120f" stroke-width="8" paint-order="stroke">${safeTitle}</text>
    </svg>
  `)
}

async function boardPoster({ src, out, title, eyebrow, crop, saturation = 0.92 }) {
  let image = sharp(mustExist(src))
  if (crop) image = image.extract(crop)
  const base = await image
    .resize(1200, 900, { fit: 'cover', position: 'top' })
    .modulate({ saturation })
    .webp({ quality: 86 })
    .toBuffer()

  await sharp(base)
    .composite([{ input: labelSvg({ title, eyebrow, width: 1200, height: 900 }), top: 0, left: 0 }])
    .webp({ quality: 88 })
    .toFile(path.join(OUT, out))
}

async function copyPoster({ src, out, title, eyebrow }) {
  const input = mustExist(src)
  const meta = await sharp(input).metadata()
  const width = meta.width ?? 900
  const height = meta.height ?? 620
  const resized = await sharp(input).resize({ width: 1200, withoutEnlargement: false }).webp({ quality: 88 }).toBuffer()
  const resizedMeta = await sharp(resized).metadata()
  await sharp(resized)
    .composite([
      {
        input: labelSvg({
          title,
          eyebrow,
          width: resizedMeta.width ?? width,
          height: resizedMeta.height ?? height,
        }),
        top: 0,
        left: 0,
      },
    ])
    .webp({ quality: 88 })
    .toFile(path.join(OUT, out))
}

await boardPoster({
  src: path.join(CAPTURES, 'thetechslp.png'),
  out: 'thetechslp.webp',
  title: 'THE TECH SLP',
  eyebrow: 'DIZZY / WEBSITE + TOOLS',
  // Crop the public hero to avoid the personal portrait/location area in the board preview.
  crop: { left: 228, top: 88, width: 575, height: 360 },
})

await boardPoster({
  src: path.join(CAPTURES, 'flimflam.png'),
  out: 'flimflam.webp',
  title: 'FLIMFLAM',
  eyebrow: 'DIZZY / PARTY GAME HUB',
  saturation: 1.08,
})

await boardPoster({
  src: path.join(CAPTURES, 'the-villa.png'),
  out: 'the-villa.webp',
  title: 'THE VILLA',
  eyebrow: 'DIZZY / SOCIAL DEDUCTION',
  saturation: 1.04,
})

await boardPoster({
  src: path.join(CAPTURES, 'jrmoguls.png'),
  out: 'jrmoguls.webp',
  title: 'JR. MOGULS',
  eyebrow: 'DIZZY / LEARNING PLATFORM',
})

await copyPoster({
  src: path.join(FINAL, 'builders-snake-poster.png'),
  out: 'builders-snake.webp',
  title: 'REWIND SNAKE',
  eyebrow: 'DIZZY / PLAYABLE ARCADE',
})

await copyPoster({
  src: path.join(FINAL, 'builders-tetris-poster.png'),
  out: 'builders-tetris.webp',
  title: 'GLITCH DROP',
  eyebrow: 'DIZZY / FALLING BLOCKS',
})

await copyPoster({
  src: path.join(FINAL, 'makers-boss-rush-poster.png'),
  out: 'makers-boss-rush.webp',
  title: 'BOSS RUSH',
  eyebrow: 'DIZZY / ACTION GAME',
})

await copyPoster({
  src: path.join(FINAL, 'sparks-flappy-poster.png'),
  out: 'sparks-flappy.webp',
  title: 'SPARKS FLAPPY',
  eyebrow: 'DIZZY / ONE-BUTTON GAME',
})

console.log(`Prepared showcase previews written to ${path.relative(ROOT, OUT)}`)
