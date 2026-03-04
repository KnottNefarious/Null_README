// api/auth/github.js
// Step 1 of OAuth: Redirect the user to GitHub's authorization page.
// GitHub will send them back to /api/auth/callback with a one-time code.

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const siteUrl = process.env.SITE_URL || 'https://null-readme.vercel.app';
  const redirectUri = `${siteUrl}/api/auth/callback`;

  // We only need read:user to get the username + check stars
  const scope = 'read:user';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    // 'force' makes GitHub always show the authorization screen (good for debugging)
    // remove this line in production if you want a smoother return-user experience
    // prompt: 'consent',
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params}`;
  res.redirect(302, githubAuthUrl);
};
