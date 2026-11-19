// Poster lettering for VICE HEAT: bold original display type drawn on
// canvas with layered fill, outline and drop shadow. System fonts only —
// nothing is downloaded, and nothing imitates any game studio's lettering.
// Letters are drawn one at a time so letter-spacing is exact at any size.

const DISPLAY_FONT = '"Arial Black", "Liberation Sans", Arial, Helvetica, sans-serif';

/**
 * Measures a line of text at a given size and letter-spacing, in pixels.
 * Uses the same per-character walk the draw functions use.
 */
export function measureSpacedText(ctx, text, size, spacing) {
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  let w = 0;
  for (const ch of text) {
    w += ctx.measureText(ch).width + spacing;
  }
  return w - (text.length ? spacing : 0);
}

/**
 * Draws one line of spaced capitals. `fill` may be a colour or a gradient.
 * The text is built from three layers: a hard offset shadow, a thick dark
 * outline, and the fill on top — the poster look.
 */
export function drawSpacedText(ctx, text, x, y, size, spacing, fill) {
  ctx.save();
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  ctx.textBaseline = 'alphabetic';
  const shadow = size * 0.09;
  // Layer 1: drop shadow, drawn first so the outline sits on top of it.
  ctx.fillStyle = 'rgba(20, 4, 24, 0.85)';
  drawChars(ctx, text, x + shadow, y + shadow, spacing);
  // Layer 2: thick dark outline.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#160418';
  ctx.lineWidth = Math.max(2, size * 0.16);
  strokeChars(ctx, text, x, y, spacing);
  // Layer 3: the fill.
  ctx.fillStyle = fill;
  drawChars(ctx, text, x, y, spacing);
  // Layer 4: a thin hot highlight along the top edge of each letter.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size * 0.05, y - size * 1.02, measureSpacedText(ctx, text, size, spacing) + size * 0.1, size * 0.22);
  ctx.clip();
  drawChars(ctx, text, x, y, spacing);
  ctx.restore();
  ctx.restore();
}

function drawChars(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

function strokeChars(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.strokeText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

/**
 * The headline: big spaced capitals across the foot of the cover, with a
 * warm white-to-pink gradient fill. `maxWidth` shrinks the type until it
 * fits. Returns the size actually used.
 */
export function drawHeadline(ctx, text, W, H, opts = {}) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  const maxWidth = opts.maxWidth ?? W * 0.92;
  const baseSize = (opts.size ?? 0.115) * H;
  const spacingRatio = opts.spacing ?? 0.06;
  let size = baseSize;
  let spacing = size * spacingRatio;
  while (size > H * 0.03 && measureSpacedText(ctx, clean, size, spacing) > maxWidth) {
    size *= 0.94;
    spacing = size * spacingRatio;
  }
  const grad = ctx.createLinearGradient(0, H - size * 1.4, 0, H);
  grad.addColorStop(0, '#fff7e8');
  grad.addColorStop(0.55, '#ffffff');
  grad.addColorStop(1, '#ffb3d1');
  const x = (W - measureSpacedText(ctx, clean, size, spacing)) / 2;
  const y = H - H * 0.055;
  drawSpacedText(ctx, clean, x, y, size, spacing, grad);
  return size;
}

/**
 * The tagline: small tracked capitals in a dark strip under the headline,
 * like a poster billing line. Returns the strip height used (0 when empty).
 */
export function drawTagline(ctx, text, W, H, headlineSize) {
  const clean = (text || '').trim().toUpperCase();
  if (!clean) return 0;
  // Shrink the type until the strip fits the cover with room to spare.
  let size = Math.max(10, H * 0.026);
  let spacing = size * 0.28;
  let textW = measureSpacedText(ctx, clean, size, spacing);
  while (size > 8 && textW > W * 0.84) {
    size *= 0.94;
    spacing = size * 0.28;
    textW = measureSpacedText(ctx, clean, size, spacing);
  }
  ctx.font = `700 ${size}px ${DISPLAY_FONT}`;
  const padX = size * 1.1;
  const stripW = Math.min(W * 0.92, textW + padX * 2);
  const stripH = size * 2.1;
  const x = (W - stripW) / 2;
  const y = H - H * 0.055 - headlineSize * 1.15 - stripH + size * 0.4;
  ctx.save();
  ctx.fillStyle = 'rgba(16, 3, 18, 0.82)';
  roundRect(ctx, x, y, stripW, stripH, stripH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffd9ec';
  const tx = x + (stripW - textW) / 2;
  drawChars(ctx, clean, tx, y + stripH / 2 + size * 0.36, spacing);
  ctx.restore();
  return stripH;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
