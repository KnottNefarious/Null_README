// api/canvas-data.js
// Returns the full pixel grid as JSON for the /draw frontend.
// Keeps Supabase keys server-side only.

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/pixels?select=id,x,y,hex,last_user&order=id.asc&limit=2500`,
      {
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        },
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    const pixels = await response.json();

    res.status(200).json({ pixels });
  } catch (err) {
    console.error('canvas-data error:', err);
    res.status(500).json({ error: 'Failed to load canvas' });
  }
};
