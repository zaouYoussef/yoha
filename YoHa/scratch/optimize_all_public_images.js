import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ffmpegPath = path.resolve('node_modules/ffmpeg-static/ffmpeg.exe');

function getFiles(dir, ext = '.png') {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, ext));
    } else if (file.toLowerCase().endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
}

const publicDir = path.resolve('public');
const pngFiles = getFiles(publicDir, '.png');

console.log(`Found ${pngFiles.length} PNG files to optimize...`);

pngFiles.forEach((pngPath) => {
  const stat = fs.statSync(pngPath);
  if (stat.size < 50000) return; // Skip small PNGs < 50KB

  const webpPath = pngPath.slice(0, -4) + '.webp';
  console.log(`Converting (${(stat.size / 1024 / 1024).toFixed(2)} MB): ${path.relative(publicDir, pngPath)}`);

  try {
    execSync(`"${ffmpegPath}" -y -i "${pngPath}" -q:v 80 "${webpPath}"`, { stdio: 'ignore' });
    const newStat = fs.statSync(webpPath);
    console.log(` -> WebP created (${(newStat.size / 1024).toFixed(1)} KB) - Saved ${((1 - newStat.size / stat.size) * 100).toFixed(1)}%`);
  } catch (err) {
    console.error(`Failed to convert ${pngPath}:`, err.message);
  }
});

console.log('All public images optimized to WebP successfully!');
