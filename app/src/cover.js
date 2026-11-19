// Draws a whole VICE HEAT cover onto a canvas at its own size.
// Pure drawing: given the state, it paints background, photo panels,
// the retro sun motif, the colour grade and the poster lettering.
// The same function renders the editor preview and every export size.

import { layoutById, panelRects, coverFitRect } from './panels.js';
import { gradeById, applyGrade } from './grade.js';
import { drawHeadline, drawTagline } from './lettering.js';

const PAPER = '#f6efe4'; // warm off-white poster board between the panels

/**
 * Draws the cover described by `state` onto `canvas`:
 *   state = {
 *     layout: 'vice-split' | 'sunset-stack' | 'neon-trio',
 *     grade: 'sunset' | 'neon' | 'golden',
 *     headline: string, tagline: string,
 *     headlineSize: number (fraction of height), letterSpacing: number (em),
 *     photos: { a: Image|null, b: Image|null },
 *     panels: [{ slot: 'a'|'b', crop: { zoom, ox, oy } }, ...] (3 entries)
 *   }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const layout = layoutById(state.layout);
  const rects = panelRects(layout, W, H);
  const gutter = Math.max(3, Math.round(Math.min(W, H) * 0.008));

  // Poster board.
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Photo panels, each clipped to its rect and tilted a touch.
  const heroIndex = rects.reduce((best, r, i) => (r.w * r.h > rects[best].w * rects[best].h ? i : best), 0);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { slot: 'a', crop: { zoom: 1, ox: 0, oy: 0 } };
    const img = state.photos[panel.slot] || null;
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.rotate((rect.tilt * Math.PI) / 180);
    ctx.translate(-rect.w / 2, -rect.h / 2);
    ctx.beginPath();
    ctx.rect(gutter / 2, gutter / 2, rect.w - gutter, rect.h - gutter);
    ctx.clip();
    if (img) {
      const r = coverFitRect(img.naturalWidth, img.naturalHeight,
        { x: 0, y: 0, w: rect.w, h: rect.h }, panel.crop);
      ctx.drawImage(img, r.x, r.y, r.w, r.h);
    } else {
      drawEmptyPanel(ctx, rect.w, rect.h, panel.slot);
    }
    // The largest panel (the hero) gets the retro sun painted over its
    // photo, tucked into its top corner. On a tall narrow hero the sun
    // goes top-left, where the sky is; otherwise top-right.
    if (i === heroIndex && img) {
      drawRetroSun(ctx, rect.w, rect.h, rect.w < rect.h * 0.6);
    }
    ctx.restore();
  });

  // A thin dark keyline around the whole poster.
  ctx.strokeStyle = 'rgba(22, 4, 24, 0.9)';
  ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.restore();

  // The colour grade unifies the panels into one poster.
  applyGrade(ctx, W, H, gradeById(state.grade));

  // Lettering last, so it sits above the grade.
  const headlineSize = drawHeadline(ctx, state.headline, W, H, {
    size: state.headlineSize,
    spacing: state.letterSpacing,
  });
  if (state.tagline) drawTagline(ctx, state.tagline, W, H, headlineSize);
}

/** A placeholder panel: diagonal stripes and the slot name, until a photo lands. */
function drawEmptyPanel(ctx, w, h, slot) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#3a2340');
  g.addColorStop(1, '#1c0f22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  ctx.lineWidth = Math.max(2, w * 0.012);
  for (let x = -h; x < w + h; x += w * 0.14) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + h, h);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = `700 ${Math.max(12, w * 0.055)}px "Liberation Sans", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`ADD PHOTO ${slot.toUpperCase()}`, w / 2, h / 2);
  ctx.textAlign = 'left';
}

/**
 * The retro sun: a gradient disc with horizontal slats cut through its
 * lower half, drawn in the hero panel's top corner. Original art, drawn
 * with canvas paths — no image, no borrowed artwork.
 */
function drawRetroSun(ctx, w, h, left) {
  const r = Math.min(w, h) * 0.15;
  const cx = left ? w * 0.14 : w * 0.86;
  const cy = h * 0.13;
  ctx.save();
  ctx.globalAlpha = 0.85;
  const sun = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  sun.addColorStop(0, '#ffd166');
  sun.addColorStop(0.55, '#ff7a3d');
  sun.addColorStop(1, '#ff2e88');
  ctx.fillStyle = sun;
  // Clip to the disc, then paint it in slices: the whole upper half, and
  // widening bands below, so the photo shows through the gaps.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillRect(cx - r, cy - r, r * 2, r);
  let y = cy;
  let band = r * 0.16;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, band);
    y += band + r * 0.09;
    band *= 0.82;
  }
  ctx.restore();
}
