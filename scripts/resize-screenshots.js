const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const TARGET_W = 1284;
const TARGET_H = 2778;
const INPUT_DIR = path.join(__dirname, '../screenshots');
const OUTPUT_DIR = path.join(__dirname, '../screenshots/output');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const files = fs.readdirSync(INPUT_DIR).filter(f =>
    /\.(jpg|jpeg|png)$/i.test(f)
  );

  if (files.length === 0) {
    console.log('No images found in screenshots/');
    return;
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const inputPath = path.join(INPUT_DIR, file);
    const outputName = `screenshot_${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    const img = sharp(inputPath);
    const meta = await img.metadata();

    const scale = Math.min(TARGET_W / meta.width, TARGET_H / meta.height);
    const resizedW = Math.round(meta.width * scale);
    const resizedH = Math.round(meta.height * scale);
    const left = Math.round((TARGET_W - resizedW) / 2);
    const top = Math.round((TARGET_H - resizedH) / 2);

    await sharp({
      create: {
        width: TARGET_W,
        height: TARGET_H,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .composite([
        {
          input: await img.resize(resizedW, resizedH).toBuffer(),
          left,
          top,
        },
      ])
      .png()
      .toFile(outputPath);

    console.log(`✓ ${outputName}  (${meta.width}×${meta.height} → ${resizedW}×${resizedH} on ${TARGET_W}×${TARGET_H})`);
  }

  console.log(`\nDone! ${files.length} screenshots saved to screenshots/output/`);
}

run().catch(console.error);
