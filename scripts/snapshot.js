// scripts/snapshot.js
// Run by GitHub Actions every hour.
// Fetches the current canvas, generates a PNG, and saves it if changed.

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GRID = 50;
const PIXEL_SIZE = 12; // 12px per pixel = 600x600 output PNG
const CANVAS_PX = GRID * PIXEL_SIZE;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function fetchColoredPixels() {
  // Only fetch non-white pixels — avoids the 1000 row default limit
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/pixels?select=x,y,hex&hex=neq.FFFFFF&limit=2500`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status}`);
  return res.json();
}

function pixelsToHash(pixels) {
  // Sort by position so hash is consistent regardless of return order
  const sorted = [...pixels].sort((a, b) => (a.y * 50 + a.x) - (b.y * 50 + b.x));
  const str = sorted.map(p => `${p.x},${p.y},${p.hex}`).join('|');
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function main() {
  console.log('📸 Null_README Snapshot Script');
  console.log('Fetching pixel data...');

  const coloredPixels = await fetchColoredPixels();
  console.log(`Fetched ${coloredPixels.length} colored pixels.`);

  const hash = pixelsToHash(coloredPixels);
  const hashFile = path.join(__dirname, '../history/latest_hash.txt');

  // Check if canvas has changed since last snapshot
  let lastHash = '';
  if (fs.existsSync(hashFile)) {
    lastHash = fs.readFileSync(hashFile, 'utf-8').trim();
  }

  if (hash === lastHash) {
    console.log('✓ Canvas unchanged since last snapshot. Skipping.');
    process.exit(0);
  }

  console.log('Canvas has changed! Generating PNG...');

  // Build pixel map from colored pixels only
  const pixelMap = {};
  coloredPixels.forEach(p => {
    pixelMap[`${p.x},${p.y}`] = p.hex || 'FFFFFF';
  });

  // Draw on node-canvas
  const canvas = createCanvas(CANVAS_PX, CANVAS_PX);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

  // Draw colored pixels
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const hex = pixelMap[`${x},${y}`];
      if (hex && hex !== 'FFFFFF') {
        ctx.fillStyle = `#${hex}`;
        ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }

  // Draw subtle grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * PIXEL_SIZE, 0);
    ctx.lineTo(i * PIXEL_SIZE, CANVAS_PX);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * PIXEL_SIZE);
    ctx.lineTo(CANVAS_PX, i * PIXEL_SIZE);
    ctx.stroke();
  }

  // Timestamp watermark
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, CANVAS_PX - 18, CANVAS_PX, 18);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '10px monospace';
  ctx.fillText(`Null_README  ${timestamp}`, 6, CANVAS_PX - 5);

  // Ensure history/ directory exists
  const historyDir = path.join(__dirname, '../history');
  if (!fs.existsSync(historyDir)) fs.mkdirSync(historyDir, { recursive: true });

  // Save PNG with ISO timestamp in filename
  const filename = now.toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.png';
  const outPath = path.join(historyDir, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Saved snapshot: history/${filename} (${Math.round(buffer.length / 1024)}KB)`);

  // Update latest hash
  fs.writeFileSync(hashFile, hash);

  // Copy to latest.png
  const latestPath = path.join(historyDir, 'latest.png');
  if (fs.existsSync(latestPath)) fs.unlinkSync(latestPath);
  fs.copyFileSync(outPath, latestPath);
  console.log('✓ Updated history/latest.png');

  console.log('Snapshot complete.');
}

main().catch(err => {
  console.error('Snapshot failed:', err);
  process.exit(1);
});
