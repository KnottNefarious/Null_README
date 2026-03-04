// api/auth/callback.js
// Step 2 of OAuth: GitHub sends back a ?code= parameter.
// We exchange it for a real access token, get the user's info,
// check if they've starred the repo, then mint a JWT and set it as a cookie.

const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
  const { code } = req.query;
  const siteUrl = process.env.SITE_URL || 'https://null-readme.vercel.app';

  if (!code) {
    return res.redirect(`${siteUrl}/draw?error=no_code`);
  }

  try {
    // ── Step 1: Exchange the code for a GitHub access token ──────────────────
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${siteUrl}/api/auth/callback`,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('No access token:', tokenData);
      return res.redirect(`${siteUrl}/draw?error=oauth_failed`);
    }

    // ── Step 2: Get the user's GitHub profile ─────────────────────────────────
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Null_README',
      },
    });

    const userData = await userRes.json();
    const { login: username, avatar_url: avatarUrl, id: githubId } = userData;

    if (!username) {
      return res.redirect(`${siteUrl}/draw?error=no_user`);
    }

    // ── Step 3: Check if user has starred the repo ────────────────────────────
    // Returns 204 if starred, 404 if not
    const owner = process.env.REPO_OWNER;
    const repo = process.env.REPO_NAME || 'Null_README';

    const starRes = await fetch(
      `https://api.github.com/user/starred/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Null_README',
        },
      }
    );

    const hasStarred = starRes.status === 204;

    // ── Step 4: Upsert user in Supabase (create or update record) ─────────────
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        username,
        avatar_url: avatarUrl,
        github_id: githubId,
        pixel_count: 0, // Only set on first insert; ignored on update due to merge
      }),
    });

    // ── Step 5: Sign a JWT and set as HTTP-only cookie ─────────────────────────
    const token = jwt.sign(
      { username, avatarUrl, hasStarred },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set TWO cookies:
    // 1. nc_token — HttpOnly JWT (real auth, JS can't read it)
    // 2. nc_auth  — NOT HttpOnly, just a flag so the draw page JS knows
    //               a session exists and can skip the auto-redirect.
    //               Contains NO sensitive data.
    const isProduction = siteUrl.startsWith('https://');
    const secure = isProduction ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      `nc_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`,
      `nc_auth=1; SameSite=Lax; Path=/; Max-Age=604800${secure}`,
    ]);

    // ── Step 6: Redirect back to the draw page ────────────────────────────────
    res.redirect(302, `${siteUrl}/draw`);

  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${siteUrl}/draw?error=server_error`);
  }
};
