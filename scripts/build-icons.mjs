// Renders PNG app icons from public/icons/icon.svg. Run manually after changing the SVG.
import { readFileSync } from 'node:fs'
import sharp from 'sharp'

const svg = readFileSync('public/icons/icon.svg')
for (const size of [180, 192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`)
}
console.log('icons ok')
