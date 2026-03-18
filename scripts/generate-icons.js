const sharp = require('sharp');
const path = require('path');

const BG = '#111111';
const FG = '#FFFFFF';

function iconSvg(size) {
  const fontSize = Math.round(size * 0.62);
  const y = Math.round(size * 0.72);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BG}" rx="${Math.round(size * 0.18)}"/>
  <text x="${size / 2}" y="${y}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${FG}"
    text-anchor="middle"
    letter-spacing="-10">G</text>
</svg>`;
}

function splashSvg(w, h) {
  const fontSize = 160;
  const letterSpacing = 28;
  return `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${BG}"/>
  <text x="${w / 2}" y="${h / 2 - 20}"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${FG}"
    text-anchor="middle"
    letter-spacing="${letterSpacing}">G</text>
  <text x="${w / 2 + 14}" y="${h / 2 + 60}"
    font-family="Arial, sans-serif"
    font-size="36"
    font-weight="400"
    fill="#818384"
    text-anchor="middle"
    letter-spacing="14">GLOSSIA</text>
</svg>`;
}

async function generate() {
  const assetsDir = path.join(__dirname, '../assets');

  // icon.png — 1024x1024
  await sharp(Buffer.from(iconSvg(1024)))
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('✓ icon.png');

  // adaptive-icon.png — 1024x1024 (no rounded corners, Android clips itself)
  const adaptiveSvg = iconSvg(1024).replace(`rx="${Math.round(1024 * 0.18)}"`, 'rx="0"');
  await sharp(Buffer.from(adaptiveSvg))
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png');

  // splash.png — 1284x2778
  await sharp(Buffer.from(splashSvg(1284, 2778)))
    .png()
    .toFile(path.join(assetsDir, 'splash.png'));
  console.log('✓ splash.png');

  // favicon.png — 48x48
  await sharp(Buffer.from(iconSvg(48)))
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\nAll icons generated in /assets');
}

generate().catch(console.error);
