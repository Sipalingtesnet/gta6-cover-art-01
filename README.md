# VICE HEAT — GTA-style cover art maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Sipalingtesnet/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Sipalingtesnet/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Entry for the [make.fun bounty gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01)
("Make GTA 6 Cover Art", $250 pot). **VICE HEAT** turns a photo and a caption
into a GTA-style poster cover: a multi-panel collage, bold poster lettering,
and a Vice City sunset / neon colour grade — then exports a PNG ready to post.

Everything is original: the lettering, the retro-sun motif and the layouts are
drawn in code. No Rockstar logo, artwork or fonts are used anywhere.

## What it does

- **Photo in:** upload one photo (Photo A) and a second photo (Photo B), or
  tap a built-in sample — Boulevard or Pier — to start instantly. Photos
  never leave your machine; the app works fully offline.
- **Multi-panel cover:** a big hero panel plus two supporting panels in the
  GTA poster layout, with thin gutters and a slight tilt on the small panels.
  Three layouts: **Vice Split**, **Sunset Stack**, **Neon Trio**.
- **Per-panel crop:** click a panel in the preview to select it, drag to pan,
  use the zoom slider, or reset the crop. Each panel can show Photo A or B.
- **Caption:** an editable headline (default `VICE HEAT`) and a tagline line,
  drawn in bold poster lettering with layered fill, outline and drop shadow,
  plus headline-size and letter-spacing controls.
- **Colour grade:** three presets drawn on canvas — **Vice Sunset** (warm
  orange/pink/purple wash), **Neon Night** (magenta/cyan glow) and
  **Golden Hour** (low-sun gold) — each with vignette and film grain.
- **Export PNG:** one click exports 1080×1080 (square), 1080×1350
  (portrait) or 1920×1080 (landscape). The status line confirms the file
  name and dimensions of every export.

Fast path: load a sample photo, type a caption, hit **Export PNG** — a
finished cover in seconds.

## How to run it

The app is plain static files — no build step, no network.

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

Then open http://localhost:8080 in a desktop browser. Or open
`app/index.html` directly from the folder (all files are relative, so it
also works from `file://`).

To build the submission output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes
`out/dossier.json`.

## Files

- `app/index.html`, `app/style.css` — the editor page and its styling.
- `app/src/main.js` — editor state and control wiring.
- `app/src/cover.js` — draws the whole cover (panels, sun motif, grade,
  lettering) at any size.
- `app/src/panels.js` — the three panel layouts and cover-fit crop math.
- `app/src/grade.js` — the three colour grades, vignette and seeded grain.
- `app/src/lettering.js` — bold poster lettering with outline and shadow.
- `app/src/export.js` — PNG export at 1080×1080, 1080×1350, 1920×1080.
- `app/src/shots.js` — fixed scenes used to take the screenshots.
- `app/samples/` — two built-in sample photos (boulevard, pier), made for
  make.fun and free to use.
- `main.ts` — submission plumbing (Node 22, standard library only).
- `vendor/makefun-app.ts` — the make.fun dossier library, as shipped.
- `screenshots/` — the entry's screenshots (the first by name is the cover).

## License

MIT — see [LICENSE](LICENSE).
