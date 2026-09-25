import fs from 'fs';
import path from 'path';

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = ['index.html', 'styles.css', 'app.js', 'config.js'];
for (const file of files) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(outDir, file));
  }
}

console.log('Build successful: static assets prepared in public/ for Vercel deployment.');
