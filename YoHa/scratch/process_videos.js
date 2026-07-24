const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ffmpegPath = require('ffmpeg-static');

const baseDir = path.resolve(__dirname, '../..');
const publicVideosDir = path.resolve(__dirname, '../public/videos');

if (!fs.existsSync(publicVideosDir)) {
  fs.mkdirSync(publicVideosDir, { recursive: true });
}

const jobs = [
  {
    input: path.join(baseDir, 'A_hyper_realistic_D_food_deli.mp4'),
    name: 'hero-food-orbit'
  },
  {
    input: path.join(baseDir, 'A_sleek_D_delivery_scooter_ma.mp4'),
    name: 'speed-scooter'
  }
];

jobs.forEach(job => {
  console.log(`Processing ${job.name}...`);
  const webmOut = path.join(publicVideosDir, `${job.name}.webm`);
  const mp4Out = path.join(publicVideosDir, `${job.name}.mp4`);
  const posterOut = path.join(publicVideosDir, `${job.name}-poster.webp`);

  // WebM
  console.log(`Generating ${job.name}.webm...`);
  execSync(`"${ffmpegPath}" -y -i "${job.input}" -c:v libvpx-vp9 -b:v 1M -crf 30 "${webmOut}"`, { stdio: 'inherit' });

  // MP4 optimized
  console.log(`Generating ${job.name}.mp4...`);
  execSync(`"${ffmpegPath}" -y -i "${job.input}" -c:v libx264 -crf 23 -preset slow -movflags +faststart "${mp4Out}"`, { stdio: 'inherit' });

  // WebP poster frame
  console.log(`Generating ${job.name}-poster.webp...`);
  execSync(`"${ffmpegPath}" -y -ss 00:00:01 -i "${job.input}" -vframes 1 -q:v 80 "${posterOut}"`, { stdio: 'inherit' });
});

console.log('Video processing finished successfully!');
