# ▒▒ Null_README ▒▒

<div align="center">

> **Status:** 🟢 LIVE &nbsp;·&nbsp; **Experiment:** Collaborative Pixel Mapping &nbsp;·&nbsp; **Constraint:** 0% JavaScript. 100% SVG.

[![Null_README Live](https://null-readme.vercel.app/api/canvas.svg)](https://null-readme.vercel.app/draw)

### [↳ CLICK THE CANVAS TO CLAIM A PIXEL](https://null-readme.vercel.app/draw)

</div>

---

## How is this possible? 
                           
This image updates in **real-time** — but GitHub isn't running any code.

Here's the trick: GitHub routes all README images through a caching proxy called **Camo**. Normally, Camo saves a copy of an image forever. But if the server responds with specific HTTP headers — `Cache-Control: no-cache, no-store, must-revalidate` — Camo is forced to re-fetch the image on every page load.

Our server is a **serverless function** that generates SVG code on the fly. Every time Camo asks for the image, the function reads the current pixel data from a database and builds a fresh `<svg>` with 2,500 colored `<rect>` elements. What GitHub thinks is a static image file is actually a live, continuously-regenerated data visualization.

**You are not looking at a screenshot. You are looking at the current state of the database.**

---

## Current Architects 

**Total Contributors:** <!-- STAT:TOTAL -->0

**Latest Patch by:** <!-- STAT:LAST -->@none

---

## Top Architects

---

## Canvas History

The canvas is automatically snapshotted every hour (only when it has changed).
This creates a permanent time-lapse of the art's evolution.

[→ View snapshot archive](./history/)

---

## Rules

- **One pixel every 30 seconds** per GitHub account
- **Must star this repo** to unlock drawing access
- No JavaScript runs on GitHub's servers — this is a pure HTTP trick
- Every pixel is permanent (but paintable over)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Image serving | Vercel Serverless (Node.js) |
| Database | Supabase (PostgreSQL) |
| Auth | GitHub OAuth |
| Frontend | React (served from same Vercel project) |
| Automation | GitHub Actions |

---

<div align="center">
<sub>Null_README · A live SVG exploit · Built by <a href="https://github.com/YOUR_USERNAME">@YOUR_USERNAME</a></sub>
</div>
