import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = path.join(process.cwd(), 'public', 'icons')

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

for (const size of sizes) {
  const fontSize = Math.round(size * 0.35)
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="#FF385C"/>
      <text
        x="50%" y="54%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-weight="700"
        font-size="${fontSize}"
        fill="white"
      >CI</text>
    </svg>
  `
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(outputDir, `icon-${size}x${size}.png`))

  console.log(`✅ icon-${size}x${size}.png gerado`)
}
