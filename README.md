# Vidpod

A dynamic ads editor for video podcasts. Podcasters can mark where ads should play in their episodes, choose ad types (static, auto-rotate, or A/B test), and preview the final playback with ad insertions in real time.

**Live demo:** [vidpod-sigma.vercel.app](https://vidpod-sigma.vercel.app/)

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TailwindCSS 4, shadcn/ui, Motion
- **Backend:** Convex (real-time queries, mutations, file storage)
- **Forms:** TanStack Form with Zod validation
- **Testing:** Vitest, Testing Library, convex-test

## Features

- **Marker CRUD** — Create, edit, delete, and drag ad markers on a visual timeline
- **Three marker types** — Static (fixed ad), Auto (random from pool), A/B Test (compare variants with experiment results)
- **Timeline** — Zoomable, scrollable timeline with real audio waveform rendering (Web Audio API peak extraction)
- **Video playback** — Dual-video player that crossfades between episode content and ad previews at marker positions
- **Undo / Redo** — Full command-history stack with keyboard shortcuts (Cmd+Z / Cmd+Shift+Z)
- **Keyboard shortcuts** — Space (play/pause), arrow keys (skip), undo/redo
- **Uploads** — Upload episode videos and ad creatives directly via Convex file storage
- **Responsive sidebar** — Navigation shell with hover states

## Getting Started

```bash
pnpm install
```

Run the Next.js dev server and Convex backend in parallel:

```bash
pnpm dev      # Next.js on localhost:3000
pnpm dev:db   # Convex dev server
```

Seed the database (runs automatically on first `dev:db` start via dashboard, or manually):

```bash
npx convex run ads/seed:seedMvpData
```

## Testing

```bash
pnpm test:run          # all tests
pnpm test:convex       # backend tests only
pnpm test:frontend     # frontend tests only
```

## Project Structure

```
app/ads/[episodeId]/   → Ads editor page and feature components
hooks/                 → Playback engine, editor session, waveform, upload hooks
lib/ads/               → Domain logic (timeline math, history, ad selection, forms)
convex/                → Schema, public API, domain modules, seed data
convex/ads/            → Marker lifecycle, persistence, read model, tests
components/            → Shared UI (shadcn/ui, shell, sidebar)
```
