// api/canvas.svg.js
// THE CORE HACK: Serves live pixel data as a fake SVG image.
// GitHub's Camo proxy is forced to re-fetch this on every page load
// because of the no-cache headers set in vercel.json.

const GRID = 50;
const PIXEL_SIZE = 10;
const CANVAS_SIZE = GRID * PIXEL_SIZE; // 500px

module.exports = async (req, res) => {
  // These headers are what tricks GitHub's Camo proxy
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Fetch all 2,500 pixels from Supabase in one request
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/pixels?select=x,y,hex&order=id.asc&limit=2500`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
        // Short timeout so GitHub's proxy doesn't hang
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    const pixels = await response.json();

    // Build a lookup map: "x,y" -> hex color
    const pixelMap = {};
    pixels.forEach(p => {
      pixelMap[`${p.x},${p.y}`] = p.hex || 'FFFFFF';
    });

    // Build SVG rect elements
    // Animation: rows cascade in from top to bottom (row 0 first, row 49 last)
    // Each row fades in 0.04s after the previous one = 2s total animation
    let rects = '';
    for (let y = 0; y < GRID; y++) {
      const delay = (y * 0.04).toFixed(2);
      for (let x = 0; x < GRID; x++) {
        const hex = pixelMap[`${x},${y}`] || 'FFFFFF';
        rects += `<rect x="${x * PIXEL_SIZE}" y="${y * PIXEL_SIZE}" width="${PIXEL_SIZE}" height="${PIXEL_SIZE}" fill="#${hex}"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="${delay}s" fill="freeze"/></rect>`;
      }
    }

    // Thin grid lines overlay for visual clarity
    let gridLines = '';
    // Vertical lines every 10 pixels
    for (let x = 0; x <= GRID; x++) {
      gridLines += `<line x1="${x * PIXEL_SIZE}" y1="0" x2="${x * PIXEL_SIZE}" y2="${CANVAS_SIZE}" stroke="#00000010" stroke-width="0.5"/>`;
    }
    // Horizontal lines every 10 pixels
    for (let y = 0; y <= GRID; y++) {
      gridLines += `<line x1="0" y1="${y * PIXEL_SIZE}" x2="${CANVAS_SIZE}" y2="${y * PIXEL_SIZE}" stroke="#00000010" stroke-width="0.5"/>`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" style="shape-rendering:crispEdges" role="img" aria-label="Null_README - Live Collaborative Pixel Art">
<!--  Null_README | Generated: ${new Date().toISOString()} | null-readme.vercel.app -->
<rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#FFFFFF"/>
${rects}
${gridLines}
</svg>`;

    res.status(200).send(svg);

  } catch (err) {
    console.error('canvas.svg error:', err);
    // Fallback: serve a placeholder so GitHub doesn't show a broken image
    res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="#0d1117"/>
  <text x="${CANVAS_SIZE / 2}" y="${CANVAS_SIZE / 2 - 10}" text-anchor="middle" font-family="monospace" font-size="14" fill="#58a6ff">Null_README</text>
  <text x="${CANVAS_SIZE / 2}" y="${CANVAS_SIZE / 2 + 14}" text-anchor="middle" font-family="monospace" font-size="10" fill="#8b949e">Loading pixel grid...</text>
</svg>`);
  }
};
