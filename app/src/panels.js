// Panel layouts for VICE HEAT: where each photo panel sits on the cover.
// Every layout is three panels (a hero plus two supporting panels) given as
// fractions of the cover size, so the same layout works at any export size.
// The small panels carry a slight tilt for the collage-poster feel; the hero
// always stays square to the frame.

export const LAYOUTS = [
  {
    id: 'vice-split',
    name: 'Vice Split',
    hint: 'Hero left, two stacked panels right',
    panels: [
      { x: 0.0, y: 0.0, w: 0.615, h: 1.0, tilt: 0 },
      { x: 0.63, y: 0.0, w: 0.37, h: 0.52, tilt: 1.4 },
      { x: 0.63, y: 0.535, w: 0.37, h: 0.465, tilt: -1.1 },
    ],
  },
  {
    id: 'sunset-stack',
    name: 'Sunset Stack',
    hint: 'Hero on top, two panels along the foot',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.6, tilt: 0 },
      { x: 0.0, y: 0.615, w: 0.49, h: 0.385, tilt: -1.2 },
      { x: 0.51, y: 0.615, w: 0.49, h: 0.385, tilt: 1.2 },
    ],
  },
  {
    id: 'neon-trio',
    name: 'Neon Trio',
    hint: 'Three tall panels, hero in the middle',
    panels: [
      { x: 0.0, y: 0.0, w: 0.27, h: 1.0, tilt: -1.4 },
      { x: 0.285, y: 0.0, w: 0.43, h: 1.0, tilt: 0 },
      { x: 0.73, y: 0.0, w: 0.27, h: 1.0, tilt: 1.4 },
    ],
  },
];

/** Returns the layout with this id, or the first layout when unknown. */
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/**
 * Turns a layout's fractional panels into pixel rects for a cover of
 * width W and height H. Returns [{x, y, w, h, tilt}] in pixels.
 */
export function panelRects(layout, W, H) {
  return layout.panels.map((p) => ({
    x: p.x * W,
    y: p.y * H,
    w: p.w * W,
    h: p.h * H,
    tilt: p.tilt,
  }));
}

/**
 * Cover-fit math for one photo inside one panel rect.
 * crop = { zoom, ox, oy }: zoom multiplies the cover scale, ox/oy shift the
 * photo by fractions of the panel size. Returns the draw rect for drawImage.
 */
export function coverFitRect(imgW, imgH, rect, crop) {
  const base = Math.max(rect.w / imgW, rect.h / imgH);
  const scale = base * (crop?.zoom ?? 1);
  const dw = imgW * scale;
  const dh = imgH * scale;
  const ox = (crop?.ox ?? 0) * rect.w;
  const oy = (crop?.oy ?? 0) * rect.h;
  return {
    x: rect.x + (rect.w - dw) / 2 + ox,
    y: rect.y + (rect.h - dh) / 2 + oy,
    w: dw,
    h: dh,
  };
}

/** The default crop for a fresh panel: no zoom, centred. */
export function defaultCrop() {
  return { zoom: 1, ox: 0, oy: 0 };
}
