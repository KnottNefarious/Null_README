// api/pixel.js
// POST: Place a pixel on the canvas.
// Each user who has starred the repo gets exactly 4 pixels total.
// No cooldown — place them whenever, but once all 4 are used, that's it.

const jwt = require('jsonwebtoken');

const GRID = 50;
const MAX_PIXELS = 4; // Star the repo = 4 pixels, forever

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...val] = part.trim().split('=');
    cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

function isValidHex(hex) {
  return /^[0-9A-Fa-f]{6}$/.test(hex);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ───────────────────────────────────────────────────────────────────
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['nc_token'];
  if (!token) return res.status(401).json({ error: 'Not logged in', code: 'AUTH_REQUIRED' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Session expired', code: 'TOKEN_EXPIRED' });
  }

  const { username, hasStarred } = payload;

  // ── Star gate ──────────────────────────────────────────────────────────────
  if (!hasStarred) {
    return res.status(403).json({ error: 'Star the repository to unlock your pixels.', code: 'STAR_REQUIRED' });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let { x, y, hex } = req.body || {};

  if (!req.body) {
    try {
      const raw = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });
      ({ x, y, hex } = JSON.parse(raw));
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  x = parseInt(x, 10);
  y = parseInt(y, 10);

  if (isNaN(x) || isNaN(y) || x < 0 || x >= GRID || y < 0 || y >= GRID) {
    return res.status(400).json({ error: `x and y must be 0–${GRID - 1}` });
  }
  if (!hex || !isValidHex(hex)) {
    return res.status(400).json({ error: 'hex must be a valid 6-character hex color (no #)' });
  }

  // ── Check pixel budget ─────────────────────────────────────────────────────
  const userRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=pixel_count`,
    {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const userData = await userRes.json();
  const pixelCount = userData[0]?.pixel_count || 0;

  if (pixelCount >= MAX_PIXELS) {
    return res.status(403).json({
      error: `You've used all ${MAX_PIXELS} pixels. Your mark is permanent.`,
      code: 'NO_PIXELS_LEFT',
      pixelCount,
      maxPixels: MAX_PIXELS,
    });
  }

  // ── Update pixel ───────────────────────────────────────────────────────────
  const pixelId = y * GRID + x;

  const updateRes = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/pixels?id=eq.${pixelId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        hex: hex.toUpperCase(),
        last_user: username,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!updateRes.ok) {
    return res.status(500).json({ error: 'Failed to update pixel' });
  }

  // ── Increment user pixel count ─────────────────────────────────────────────
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/increment_pixel_count`, {
    method: 'POST',
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_username: username }),
  });

  const remaining = MAX_PIXELS - (pixelCount + 1);

  return res.status(200).json({
    success: true,
    pixel: { x, y, hex: hex.toUpperCase(), last_user: username },
    pixelsRemaining: remaining,
    message: remaining > 0
      ? `Pixel placed. ${remaining} pixel${remaining === 1 ? '' : 's'} remaining.`
      : `All ${MAX_PIXELS} pixels placed. Your mark is permanent.`,
  });
};
