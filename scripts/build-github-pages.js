const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');
const tempApiDir = path.join(rootDir, 'src', 'api_temp_backup');

console.log('🚀 Starting GitHub Pages Static Export Build...');

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

let copied = false;
try {
  // 1. Back up API directory and remove from src/app/api during static export
  if (fs.existsSync(apiDir)) {
    copyDir(apiDir, tempApiDir);
    removeDir(apiDir);
    copied = true;
    console.log('  [1/4] Server API routes isolated for static export.');
  }

  // 2. Run Next.js static build
  console.log('  [2/4] Running Next.js static export...');
  execSync('npm run build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      GITHUB_PAGES: 'true',
      NODE_ENV: 'production',
    },
  });

  // 3. Post-process GitHub Pages artifact
  const outDir = path.join(rootDir, 'out');
  if (fs.existsSync(outDir)) {
    console.log('  [3/4] Adding .nojekyll and SPA fallback...');
    fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
    const indexHtml = path.join(outDir, 'index.html');
    const notFoundHtml = path.join(outDir, '404.html');
    if (fs.existsSync(indexHtml) && !fs.existsSync(notFoundHtml)) {
      fs.copyFileSync(indexHtml, notFoundHtml);
    }
  }

  console.log('  [4/4] Static export complete in ./out directory.');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
} finally {
  // Restore API directory
  if (copied && fs.existsSync(tempApiDir)) {
    copyDir(tempApiDir, apiDir);
    removeDir(tempApiDir);
    console.log('  ✓ Restored API route handlers.');
  }
}

console.log('🎉 GitHub Pages Static Build Succeeded!');
