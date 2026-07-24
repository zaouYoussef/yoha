const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const publicDir = path.resolve(__dirname, '../public');

const files = ['ispits.png', 'fmp_tanger.png', 'burger_exploded.png', 'logo.png'];
files.forEach(f => {
  const input = path.join(publicDir, f);
  if (fs.existsSync(input)) {
    const output = path.join(publicDir, f.replace(/\.(png|jpg|jpeg)$/, '.webp'));
    console.log(`Optimizing ${f} -> ${path.basename(output)}`);
    execSync(`"${ffmpeg}" -y -i "${input}" -q:v 80 "${output}"`, { stdio: 'inherit' });
  }
});
console.log('Image optimization complete!');
