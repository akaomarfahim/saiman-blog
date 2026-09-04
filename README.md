# My Blog — Alternate Design (v2)

The same fully-functional personal blog (Node.js/Express, JSON file
storage — no database) as the original build, with a different visual
identity: full-bleed edge-to-edge layout, a magazine-style homepage hero,
and scroll-triggered animations.

## What's different from the original design

- **Full-screen layout** — content spans the full browser width with
  responsive horizontal padding (`clamp()`-based, so it scales with the
  viewport), instead of being boxed into a narrow centered column.
- **Homepage hero grid** — the newest post is shown as one large featured
  tile, with the next three posts stacked beside it as smaller tiles that
  together match the big tile's height exactly. Any older posts appear
  below in a regular grid.
- **New type & color system** — Sora (bold, geometric) for headlines,
  Inter for body text, a violet-to-pink accent gradient, and full-bleed
  image tiles with a dark gradient overlay for text (a "magazine cover"
  look) instead of the previous newspaper/serif styling.
- **Animations** — beyond load-in animations, content now animates in as
  you *scroll* to it (via a small IntersectionObserver script), the
  header goes translucent/blurred once you scroll past the top, and
  there are slow-drifting ambient gradient blobs in the background for a
  more "alive" feel. All animation respects `prefers-reduced-motion`.

## Features (same as the original build)

- Public homepage and single-post pages
- Visitor accounts: sign up, log in, log out (bcrypt-hashed passwords)
- Logged-in visitors can comment; any logged-in user (including you) can
  reply — your replies show an "Author" badge
- Comment authors and the admin can delete comments (cascades to replies)
- Admin dashboard at `/admin` to write, edit, and delete posts, with an
  optional featured image (JPG/PNG/WEBP/GIF, up to 5MB) per post
- Everything lives in `data/users.json`, `data/posts.json`,
  `data/comments.json`, and `public/uploads/` — no database

## Getting started

1. `npm install`
2. `cp .env.example .env` and set `SESSION_SECRET` plus your own
   `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. `npm start`
4. Open `http://localhost:3000` — your admin account is created
   automatically on first run from the `.env` values

See the code comments in `public/css/style.css` and `public/js/main.js`
for how the hero-grid height-matching and scroll-reveal animation work,
in case you want to tune them (e.g. the `--hero-height` CSS variable
controls the fixed height the big tile and the 3 side tiles share).

## Deploying

Same notes as the original build: use a real `SESSION_SECRET` in
production, and make sure `data/` and `public/uploads/` sit on
**persistent** storage so a redeploy doesn't wipe your content.
