# Made with Fable

A community gallery of creations built with Claude Fable 5 — websites, games, art, tools,
agents, writing, and music, each with the prompt behind it. Pinterest-style pinned board,
sign-in to pin a project, human moderation queue.

**Live:** https://made-with-fable.onrender.com

## Stack

- Next.js 16 (App Router, standalone output) · Tailwind CSS v4 · motion · lucide-react
- Supabase: Postgres + RLS, Auth (magic link + Google), Storage (public `media` bucket)
- Render web service (free tier), auto-deploys from `main`

## Development

```bash
npm install
npm run dev          # http://localhost:3000
npm run previews:dizzy
npx next build       # production build (unset NODE_ENV if your shell sets it)
npx eslint . --max-warnings 0
npx tsc --noEmit
```

Env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`NEXT_PUBLIC_SITE_URL`, optional `SUPABASE_SERVICE_ROLE_KEY` (not needed for core flows).

## Auth setup

- Email sign-in uses Supabase magic links and redirects through `/auth/callback`. Add production
  and local callback URLs to Supabase Auth > URL Configuration.
- The custom magic-link email lives in `supabase/email-templates/`. Hosted Supabase projects on
  the default free email provider cannot apply custom templates; configure custom SMTP or upgrade
  before applying the template in Auth > Email Templates.
- Google sign-in must be enabled in Supabase Auth > Sign In / Providers > Google with a Google
  OAuth client ID and secret. The Google OAuth app also needs the Supabase provider callback URL
  as an authorized redirect URI.

## Seed real showcase posts

Real preview captures for the initial approved feed posts are generated from `seed-assets/dizzy/*`
and the existing gameplay captures in `seed-assets/final/*`:

```bash
npm run previews:dizzy
```

To replace the placeholder demo rows with approved real projects under the public maker name
`Dizzy`, set `SUPABASE_SERVICE_ROLE_KEY`, then run:

```bash
npm run seed:dizzy
```

The seed anonymizes the selected maker profile to `username=dizzy`, `display_name=Dizzy`, removes
the avatar URL, uploads the curated screenshots/videos into the `media` bucket, deletes only known
demo creations, and inserts approved projects for The Tech SLP, Flimflam, The Villa, Jr. Moguls,
and the captured Jr. Moguls games as normal feed cards. If there is no existing `dizzy` profile and
more than one admin, set `DIZZY_USER_ID` or `DIZZY_CURRENT_USERNAME` before running.

## Architecture notes

- **Feed**: `feed_page` Postgres RPC (see `supabase/migrations/001_initial_schema.sql`) returns
  creations + author + first media in one round trip with keyset cursor pagination.
  `like_count`/`comment_count` are denormalized via triggers, so Popular sort is an index scan.
- **Pinned board**: `src/components/feed/masonry-grid.tsx` renders a responsive CSS grid so the
  board paints fully on first load, with pin animations on each card.
- **Moderation**: everything submits as `pending`; only `approved` rows are public (enforced by
  RLS, not just UI). Admins are flagged via `profiles.is_admin`, checked in policies through the
  `is_admin()` security-definer function.
- **Uploads**: browser-side compression to webp (max 1920px), one video ≤25MB/60s with a
  client-captured poster frame, direct-to-Storage uploads into a per-user folder enforced by
  storage RLS.
- **Link previews**: `src/lib/og-fetch.ts` fetches og:image/og:title server-side with SSRF
  guards (DNS resolution check against private ranges, re-validated per redirect, size caps).

## Operations

```sql
-- make a user an admin (Supabase SQL editor)
update profiles set is_admin = true where id = '<auth user uuid>';

-- reconcile denormalized counters if they ever drift
update creations c set
  like_count = (select count(*) from likes l where l.creation_id = c.id),
  comment_count = (select count(*) from comments m where m.creation_id = c.id);

-- remove the demo seed content
delete from auth.users where email in ('fable.tester@example.com', 'demo.maker@example.com');
```

- Keep-alive: point UptimeRobot (or similar) at `https://made-with-fable.onrender.com/` every
  10 minutes — prevents Render free-tier spin-down and Supabase free-tier pausing.
- Supabase free tier: 1GB storage / ~2GB egress per month. Watch the dashboard once videos
  start coming in.
