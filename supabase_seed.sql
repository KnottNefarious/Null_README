-- ============================================================
-- Null_README — Supabase Database Setup
-- Run this ONCE in the Supabase SQL Editor to initialize the project.
-- ============================================================

-- ── Table: pixels ────────────────────────────────────────────────────────────
-- Stores all 2,500 pixels of the 50x50 grid.
CREATE TABLE IF NOT EXISTS pixels (
  id         INTEGER PRIMARY KEY,          -- 0–2499, row-major: id = y*50 + x
  x          INTEGER NOT NULL,             -- 0–49
  y          INTEGER NOT NULL,             -- 0–49
  hex        CHAR(6) NOT NULL DEFAULT 'FFFFFF',  -- Color without '#'
  last_user  TEXT,                         -- GitHub username of last painter
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table: users ─────────────────────────────────────────────────────────────
-- Tracks each contributor's stats.
CREATE TABLE IF NOT EXISTS users (
  username      TEXT PRIMARY KEY,
  avatar_url    TEXT,
  github_id     BIGINT,
  pixel_count   INTEGER NOT NULL DEFAULT 0,
  last_pixel_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RPC Function: increment_pixel_count ──────────────────────────────────────
-- Called after a successful pixel placement to atomically increment the count.
CREATE OR REPLACE FUNCTION increment_pixel_count(p_username TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET pixel_count = pixel_count + 1
  WHERE username = p_username;
END;
$$ LANGUAGE plpgsql;

-- ── Seed: 2,500 white pixels ──────────────────────────────────────────────────
-- This loop inserts all pixels for a 50x50 grid.
-- Each pixel starts as white (#FFFFFF).
DO $$
DECLARE
  x INT;
  y INT;
BEGIN
  FOR y IN 0..49 LOOP
    FOR x IN 0..49 LOOP
      INSERT INTO pixels (id, x, y, hex)
      VALUES (y * 50 + x, x, y, 'FFFFFF')
      ON CONFLICT (id) DO NOTHING;  -- Safe to re-run
    END LOOP;
  END LOOP;
END;
$$;

-- ── Indexes for performance ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS pixels_xy_idx ON pixels(x, y);
CREATE INDEX IF NOT EXISTS users_pixel_count_idx ON users(pixel_count DESC);

-- ── Verify the seed ────────────────────────────────────────────────────────────
SELECT COUNT(*) AS total_pixels FROM pixels;
-- Should return: 2500

SELECT COUNT(*) AS total_users FROM users;
-- Should return: 0 (no users yet)
