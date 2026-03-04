// api/participants.js
// Returns everyone who has placed pixels, ordered by who joined first.
// No ranking — just a simple roll call with their coordinates.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  try {
    // Get all users who have placed at least 1 pixel, oldest first (join order)
    const usersRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/users?pixel_count=gt.0&select=username,avatar_url,pixel_count,created_at&order=created_at.asc&limit=500`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const users = await usersRes.json();

    if (!users.length) {
      return res.status(200).json({ participants: [], total: 0 });
    }

    // For each user, fetch their own pixels directly so coordinates
    // are always accurate no matter how many total placements exist
    const usernames = users.map(u => u.username);

    const pixelsRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/pixels?last_user=in.(${usernames.map(u => `"${u}"`).join(',')})&select=x,y,hex,last_user&limit=2500`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    const pixels = await pixelsRes.json();

    // Group pixels by username
    const pixelMap = {};
    pixels.forEach(p => {
      if (!pixelMap[p.last_user]) pixelMap[p.last_user] = [];
      pixelMap[p.last_user].push({ x: p.x, y: p.y, hex: p.hex });
    });

    const participants = users.map(u => ({
      username: u.username,
      avatarUrl: u.avatar_url,
      pixelCount: u.pixel_count,
      recentPixels: pixelMap[u.username] || [],
    }));

    res.status(200).json({ participants, total: participants.length });

  } catch (err) {
    console.error('participants error:', err);
    res.status(500).json({ error: 'Failed to load participants' });
  }
};
