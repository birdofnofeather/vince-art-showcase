# Vince de Yaanga — Portfolio

A static React + Vite single-page application for the artist Vince de Yaanga.
Two layers share one build:

- **Public portfolio** (`/`, `/work/:slug`, `/about`) — bright, gallery-white.
- **Hidden atelier** (`/atelier`) — black archival register, reached only via a
  discreet glyph in the bottom-right corner of every page. Marked
  `noindex,nofollow`, excluded from `robots.txt` and `sitemap.xml`.

Pure static SPA: no backend, no database, no auth. Content is loaded at runtime
from JSON.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router 6.

## Environment variables

Create a `.env` (or set in your host's dashboard) — all are optional.

| Variable              | Purpose                                                                                          | Default                                                |
| --------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `VITE_DATA_BASE_URL`  | Base URL where `portfolio.json` and `project.json` are hosted.                                   | empty → falls back to `/portfolio.sample.json` and `/project.sample.json` |
| `VITE_WEB3FORMS_KEY`  | Web3Forms access key used by the `/about` contact form.                                          | empty → form will render but submissions will fail     |

When `VITE_DATA_BASE_URL` is set the app fetches:

- `${VITE_DATA_BASE_URL}/portfolio.json` (public portfolio)
- `${VITE_DATA_BASE_URL}/project.json`   (atelier)

When it is empty it falls back to the bundled samples in `public/`.

Image paths in the JSON: if `image` starts with `http(s)://` it is used as-is;
otherwise it is resolved against `VITE_DATA_BASE_URL`.

## JSON schemas

### `portfolio.json`

```jsonc
{
  "artist": { "name": "Vince de Yaanga", "location": "Los Angeles" },
  "works": [
    {
      "slug": "where-the-map-ends",
      "title": "Where the Map Ends",
      "headline": "Jailed couple's motorcycle becomes a roadside shrine",
      "date": "2026-06-06",
      "image": "https://placehold.co/1024x1280",
      "width": 1024,
      "height": 1280
    }
  ]
}
```

### `project.json` (atelier — private)

```jsonc
{
  "vision": "…",
  "pipeline": {
    "nodes": [
      { "id": "news", "label": "World news", "status": "ok", "lastRun": "2026-06-06T12:00:00Z" }
    ],
    "edges": [ { "from": "news", "to": "assemble" } ]
  },
  "diaries": {
    "vince": [ { "date": "2026-06-06", "body": "prose…\n\nsecond paragraph" } ],
    "ted":   [ { "date": "2026-06-06", "body": "prose…" } ]
  },
  "correspondence": [
    { "date": "2026-06-06", "from": "ted", "to": "vince", "body": "Dear Vince,\n\n…\n\nEver yours, Ted" }
  ],
  "runLog": [
    { "ts": "2026-06-06T12:05:00Z", "agent": "vince", "pipeline": "image", "status": "ok", "note": "1 work selected" }
  ]
}
```

Diary and letter bodies render exactly as provided — no markdown — with blank
lines splitting paragraphs.

## Contact form

The `/about` page submits as `multipart/form-data` to
`https://api.web3forms.com/submit` with `access_key = VITE_WEB3FORMS_KEY`. A
hidden `botcheck` honeypot field traps automated submissions. No email address
is ever printed on the page or in the source.

## Local development

```bash
bun install     # or: npm install
bun run dev     # or: npm run dev
```

The `predev` / `prebuild` hooks regenerate `public/sitemap.xml` from
`public/portfolio.sample.json`.

## Production build

```bash
bun run build   # or: npm run build
```

This produces a fully static `dist/` directory — HTML, JS, CSS, and the
bundled JSON samples — with no host-specific runtime, no server, and no
dependencies on Lovable, Supabase, or any backend.

## Deploying as a static SPA

Upload `dist/` to any static host (Cloudflare Pages, Netlify, Vercel static,
S3 + CloudFront, GitHub Pages, etc.).

Two SPA-routing helpers ship in `public/` and are copied into `dist/`:

- `_redirects` — `/*  /index.html  200` for Netlify / Cloudflare Pages so
  deep links (`/work/:slug`, `/atelier`) resolve to `index.html`.
- For Apache/Nginx, configure a fallback that serves `index.html` for any
  unmatched non-asset path.

`robots.txt` disallows `/atelier` and `/project.json`; `sitemap.xml` lists
only `/`, `/about`, and the work routes.

## Updating content without a redeploy

Host `portfolio.json` (and optionally `project.json`) anywhere CORS-readable,
set `VITE_DATA_BASE_URL` to its origin, and rebuild once. After that, content
updates are a JSON edit on your data host — no code changes, no redeploy.
