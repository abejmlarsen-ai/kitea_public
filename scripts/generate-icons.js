const sharp = require('sharp')
const path  = require('path')
const fs    = require('fs')

const INPUT      = path.join(__dirname, '../public/images/Kitea Logo Only.png')
const OUTPUT_DIR = path.join(__dirname, '../public/icons')

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }

  await sharp(INPUT)
    .resize(192, 192, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon-192.png'))
  console.log('Generated icon-192.png')

  await sharp(INPUT)
    .resize(512, 512, { fit: 'contain', background: { r: 10, g: 10, b: 10, alpha: 1 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'icon-512.png'))
  console.log('Generated icon-512.png')
}

main().catch((err) => { console.error(err); process.exit(1) })
