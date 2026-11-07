// Writes the list of form clips the service worker precaches. Runs before every build.
import { readdirSync, writeFileSync } from 'node:fs'

const media = readdirSync('public/media').filter((f) => /\.(mp4|gif|webp|png|jpg)$/i.test(f)).map((f) => `/media/${f}`)
writeFileSync('public/media-list.json', JSON.stringify(media, null, 2) + '\n')
console.log(`${media.length} media files`)
