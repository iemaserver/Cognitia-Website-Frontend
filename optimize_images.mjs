import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const publicDir = path.resolve('public');

async function processImages() {
  console.log('Optimizing images...');

  // 1. Optimize spideybg.jpg (Resize 1400x1400 -> 720x720, WebP & JPEG)
  const spideybgPath = path.join(publicDir, 'spideybg.jpg');
  if (fs.existsSync(spideybgPath)) {
    const inputBuffer = fs.readFileSync(spideybgPath);

    const webpBuf = await sharp(inputBuffer)
      .resize(720, 720, { fit: 'inside' })
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'spideybg.webp'), webpBuf);

    const jpgBuf = await sharp(inputBuffer)
      .resize(720, 720, { fit: 'inside' })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    fs.writeFileSync(spideybgPath, jpgBuf);

    console.log(`spideybg.jpg original size was 131 KB, new size: ${(jpgBuf.length/1024).toFixed(1)} KB, WebP size: ${(webpBuf.length/1024).toFixed(1)} KB`);
  }

  // 2. Optimize cognitia logo.png (Create WebP & optimized PNG)
  const logoPath = path.join(publicDir, 'cognitia logo.png');
  if (fs.existsSync(logoPath)) {
    const inputBuffer = fs.readFileSync(logoPath);

    const webpBuf = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'cognitia_logo.webp'), webpBuf);

    const pngBuf = await sharp(inputBuffer)
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
    fs.writeFileSync(logoPath, pngBuf);

    console.log(`cognitia logo.png original size was 58 KB, new size: ${(pngBuf.length/1024).toFixed(1)} KB, WebP size: ${(webpBuf.length/1024).toFixed(1)} KB`);
  }

  console.log('Image optimization completed successfully!');
}

processImages().catch(err => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
