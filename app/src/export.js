// PNG export for VICE HEAT: renders the cover at a real post size on an
// offscreen canvas and hands it back as a PNG blob or data URL.
// Sizes are the common post sizes: square, portrait and landscape.

import { drawCover } from './cover.js';

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Landscape', w: 1920, h: 1080 },
];

/** Returns the export size with this id, or the square one when unknown. */
export function exportSizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[0];
}

/** Renders the cover at W x H on a fresh canvas and returns the canvas. */
export function renderExport(state, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}

/** Renders the cover at W x H and returns a PNG data URL. */
export function exportDataURL(state, w, h) {
  return renderExport(state, w, h).toDataURL('image/png');
}

function fileName(state, w, h) {
  const slug = (state.headline || 'vice-heat').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'vice-heat';
  return `${slug}-${w}x${h}.png`;
}

/**
 * Renders the cover at W x H and triggers a browser download of the PNG.
 * Calls onDone(filename) once the download has been started.
 */
export function downloadExport(state, w, h, onDone) {
  const canvas = renderExport(state, w, h);
  canvas.toBlob((blob) => {
    if (!blob) {
      onDone(null);
      return;
    }
    const name = fileName(state, w, h);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    onDone(name);
  }, 'image/png');
}
