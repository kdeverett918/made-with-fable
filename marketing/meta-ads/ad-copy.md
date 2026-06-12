# Made with Fable — Meta Ads Kit

Campaign goal: traffic → submissions. Destination: https://madewithfable.com/submit
(Send ad traffic to `/submit` or `/?utm_...` — test both. Submit converts harder but the
gallery home is a softer landing for cold audiences.)

> madewithfable.com is live (custom domain on Render; Supabase auth + NEXT_PUBLIC_SITE_URL
> updated 2026-06-12). Remaining pre-spend item: Meta Pixel / Conversions API.

Suggested UTM template: `?utm_source=meta&utm_medium=paid&utm_campaign=launch&utm_content={ad-name}`

---

## Angle 1 — The deal (core message)

**Primary text**
> You make things with AI. We get them seen.
>
> Made with Fable is a community gallery for AI-built projects — games, music apps, websites, tools. Upload your creation, get a maker profile, and let the community find you.
>
> You upload. We drive the traffic.

**Headline:** You Upload. We Drive the Traffic.
**Description:** A community gallery for AI-made projects.
**CTA button:** Submit your work → (use Meta's "Sign Up" or "Learn More")
**Creative:** `images/ad-square-1080.png` or `fable-ad-square-1080.mp4`

---

## Angle 2 — Don't let it die in a chat log (pain point)

**Primary text**
> You spent hours making something genuinely cool with AI… and now it's buried in a chat history nobody will ever scroll back to.
>
> Pin it to the board instead. Made with Fable is where AI makers show their work — and where people actually browse it.

**Headline:** Don't Let It Die in a Chat Log
**Description:** Show what you made. Get found.
**CTA button:** Learn More
**Creative:** `fable-ad-square-1080.mp4` (the video opens on this exact beat) or `images/ad-feed-4x5.png`

---

## Angle 3 — FOMO / limited window (matches the site's tagline)

**Primary text**
> Fable is here for a limited time. Show what you made.
>
> A growing board of AI-built games, music tools, and websites — each one pinned by the maker who built it. Browse for inspiration or claim your spot.

**Headline:** Show What You Made With AI
**Description:** Browse. Get inspired. Submit your work.
**CTA button:** Learn More
**Creative:** `images/ad-story-9x16.png` (Stories/Reels placement)

---

## Creative inventory

| File | Format | Placement |
|------|--------|-----------|
| `images/ad-square-1080.png` | 1:1 image | Feed |
| `images/ad-feed-4x5.png` | 4:5 image | Feed (mobile-optimized) |
| `images/ad-story-9x16.png` | 9:16 image | Stories / Reels |
| `fable-ad-square-1080.mp4` | 1:1 video, 15s | Feed |
| `fable-ad-story-1080x1920.mp4` | 9:16 video, 15s | Stories / Reels |

Image style: surreal-miniature editorial poster — tiny figurine on a floor of collaged
project pages, huge black grotesk type, red mono microtext (style ref in `images/`).

Video beat sheet (15s): surreal MADE WITH FABLE poster push-in → You upload your creations /
WE DRIVE THE TRAFFIC → upload-process collage from the real submit wizard (01 Tell us what
you made → 02 Pin your media → 03 Submit for review → 04 Live on the board) →
MADE WITH FABLE / Submit a project → madewithfable.com

Video source: `ad-video/` (Remotion). Re-render: `cd ad-video && npx remotion render AdSquare out.mp4`.
Edit copy beats in `ad-video/src/Ad.tsx`.

## Before spending money

- **Domain**: ads point at `made-with-fable.onrender.com`. A real domain (e.g. madewithfable.com)
  will noticeably improve CTR and Meta's ad review experience — worth doing first.
- **Pixel**: install the Meta Pixel (or Conversions API) and fire a `CompleteRegistration`/custom
  `SubmitProject` event so the campaign can optimize for submissions, not clicks.
- **AI disclosure**: the static images are AI-generated; Meta may require the "AI-generated"
  disclosure toggle for some ad categories — the video is motion graphics + real screenshots, so it's safe.
- Run all 3 angles in one ad set with Advantage+ creative off, ~$10–20/day, kill losers after ~3 days.
