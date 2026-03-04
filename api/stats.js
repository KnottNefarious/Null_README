// api/stats.js
// Returns canvas stats — total contributors and last pixel placed.
// Used by the README GitHub Action to update the contributor count.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=60');

  try {
    // Total unique contributors (anyone who placed at least 1 pixel)
    const totalRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?pixel_count=gt.0&select=username`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'count=exact',
          'Range': '0-0',
        },
      }
    );

    // Last pixel placed
    const lastPixelRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/pixels?last_user=not.is.null&select=last_user,updated_at&order=updated_at.desc&limit=1`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const lastPixelData = await lastPixelRes.json();

    // Parse Content-Range header for total: "0-0/42" -> 42
    const contentRange = totalRes.headers.get('Content-Range') || '0-0/0';
    const totalPainters = parseInt(contentRange.split('/')[1] || '0', 10);

    res.status(200).json({
      totalPainters,
      lastPatch: lastPixelData[0] || null,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
};
