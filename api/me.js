// api/me.js
// Returns the current logged-in user's info from their JWT cookie.

const jwt = require('jsonwebtoken');

const MAX_PIXELS = 4;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...val] = part.trim().split('=');
    cookies[key.trim()] = val.join('=');
  });
  return cookies;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookies = parseCookies(req.headers.cookie);
  const token = cookies['nc_token'];

  if (!token) return res.status(401).json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const { username, avatarUrl, hasStarred } = payload;

    // Fetch live pixel count from Supabase
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
    const pixelsRemaining = Math.max(0, MAX_PIXELS - pixelCount);

    res.status(200).json({
      user: {
        username,
        avatarUrl,
        hasStarred,
        pixelCount,
        pixelsRemaining,
        maxPixels: MAX_PIXELS,
      }
    });
  } catch {
    res.setHeader('Set-Cookie', [
      'nc_token=; HttpOnly; Path=/; Max-Age=0',
      'nc_auth=; Path=/; Max-Age=0',
    ]);
    res.status(401).json({ user: null });
  }
};
