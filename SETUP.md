# Null_README — Setup Guide

Follow these steps in order. Each section takes about 5 minutes.
Total setup time: ~25 minutes.

---

## STEP 1 — Create the GitHub Repository

1. Go to https://github.com/new
2. Repository name: `Null_README`
3. Set to **Public**
4. Do NOT initialize with a README (we have our own)
5. Click **Create repository**
6. Note your GitHub username — you'll need it in Step 4

---

## STEP 2 — Set Up Supabase (Your Database)

1. Go to https://supabase.com and click **Start your project** (free account)
2. Click **New project**
   - Name: `Null_README`
   - Region: Choose the one closest to you
   - Database password: Generate one and save it somewhere safe
3. Wait ~1 minute for the project to spin up
4. Click **SQL Editor** in the left sidebar
5. Click **New query**
6. Open the file `supabase_seed.sql` from this project folder
7. Copy ALL of its contents and paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter)
9. You should see: `total_pixels: 2500` in the results
10. Go to **Project Settings → API** (gear icon in sidebar)
11. Copy and save these two values:
    - **Project URL** → this is your `SUPABASE_URL`
    - **service_role (secret)** key → this is your `SUPABASE_SERVICE_KEY`
    - ⚠️ Keep the service_role key private — it has full database access

---

## STEP 3 — Create a GitHub OAuth App

This is what lets users log in with GitHub on your draw page.

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** in the left sidebar
3. Click **New OAuth App**
4. Fill in:
   - **Application name:** Null_README
   - **Homepage URL:** `https://null-readme.vercel.app`
   - **Authorization callback URL:** `https://null-readme.vercel.app/api/auth/callback`
5. Click **Register application**
6. On the next page, copy and save:
   - **Client ID** → this is your `GITHUB_CLIENT_ID`
7. Click **Generate a new client secret**
8. Copy and save it immediately (you can't see it again):
   - **Client Secret** → this is your `GITHUB_CLIENT_SECRET`

---

## STEP 4 — Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project**
3. Import your `Null_README` repository
   - (You'll need to push the code to GitHub first — see Step 6 below)
   - If you haven't pushed yet, go to Step 6 first, then come back here
4. Vercel should auto-detect the project. Click **Deploy** once
5. After it deploys, note your project URL (e.g. `null-readme.vercel.app`)
6. Go to your project in Vercel → **Settings → Environment Variables**
7. Add each of these one by one (click **Add** after each):

| Name | Value |
|------|-------|
| `SUPABASE_URL` | Your Supabase Project URL from Step 2 |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key from Step 2 |
| `GITHUB_CLIENT_ID` | From Step 3 |
| `GITHUB_CLIENT_SECRET` | From Step 3 |
| `JWT_SECRET` | A random string — use this to generate one: open a terminal and run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `REPO_OWNER` | Your GitHub username (lowercase) |
| `REPO_NAME` | `Null_README` |
| `SITE_URL` | `https://null-readme.vercel.app` (or your actual Vercel URL) |

8. After adding all variables, go to **Deployments** and click **Redeploy** on the latest deployment

---

## STEP 5 — Add GitHub Action Secrets

The snapshot and stats GitHub Actions also need your Supabase credentials.

1. Go to your `Null_README` repo on GitHub
2. Click **Settings → Secrets and variables → Actions**
3. Click **New repository secret** and add:
   - Name: `SUPABASE_URL` / Value: (same as in Vercel)
   - Name: `SUPABASE_SERVICE_KEY` / Value: (same as in Vercel)
   - Name: `SITE_URL` / Value: `https://null-readme.vercel.app`

---

## STEP 6 — Push the Code to GitHub

In your terminal, from the `Null_README` project folder:

```bash
git init
git add .
git commit -m "🎨 Null_README — initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Null_README.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

## STEP 7 — Update the README with Your URLs

Open `README.md` and replace these placeholders:
- `null-readme.vercel.app` → your actual Vercel URL (if different)
- `YOUR_USERNAME` → your GitHub username

Also open `public/draw.html` and find this line near the bottom:
```javascript
href={`https://github.com/${window.REPO_OWNER || 'YOUR_USERNAME'}/Null_README`}
```
You can leave it as-is (it uses `window.REPO_OWNER`) OR you can hardcode your username.

---

## STEP 8 — Test It

1. Visit `https://null-readme.vercel.app/draw` — you should see the white canvas grid
2. Click **Login with GitHub** — you should be redirected to GitHub and back
3. Star your own repo at `https://github.com/YOUR_USERNAME/Null_README`
4. Go back to `/draw`, click a pixel, pick a color, hit **Commit**
5. Wait ~5 seconds, then visit `https://null-readme.vercel.app/api/canvas.svg` in a new tab
6. You should see your colored pixel in the SVG

---

## STEP 9 — Add to Your GitHub Profile README

If you have a GitHub profile README (a repo named after your username), add this:

```markdown
[![Null_README](https://null-readme.vercel.app/api/canvas.svg)](https://null-readme.vercel.app/draw)

### [↳ CLICK TO CLAIM A PIXEL](https://null-readme.vercel.app/draw)
```

This is the main "hook" — what people see on your GitHub profile.

---

## Troubleshooting

**Canvas shows "Loading pixel grid..."**
→ Check your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Vercel environment variables.
→ Make sure you ran the SQL seed script (Step 2).

**Login redirects to an error**
→ Double-check the OAuth callback URL in your GitHub OAuth App settings.
→ It must be exactly: `https://null-readme.vercel.app/api/auth/callback`

**"Must star to draw" even after starring**
→ Click "Verify" on the star gate screen — this re-runs the OAuth flow and re-checks your star status.

**SVG image on GitHub README doesn't update**
→ This is normal — GitHub's Camo proxy can cache for 5–10 minutes even with no-cache headers.
→ The draw page at `/draw` always shows real-time state.
→ Wait 10 minutes and hard refresh the GitHub page.

**GitHub Actions failing**
→ Make sure you added `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SITE_URL` as repository secrets (Step 5).

---

## Done! 🎉

Share your GitHub profile link everywhere.
The canvas in your README is live.
