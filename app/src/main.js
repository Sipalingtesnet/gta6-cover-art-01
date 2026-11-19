// VICE HEAT — the editor: wires the controls to the cover renderer.
// State lives here; drawing lives in cover.js, grades in grade.js,
// lettering in lettering.js, layouts in panels.js, export in export.js.

import { LAYOUTS, layoutById, panelRects, defaultCrop } from './panels.js';
import { GRADES } from './grade.js';
import { drawCover } from './cover.js';
import { EXPORT_SIZES, exportSizeById, downloadExport, exportDataURL } from './export.js';
import { runShot, loadImage } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

// ---- State ---------------------------------------------------------------

const state = {
  layout: 'vice-split',
  grade: 'sunset',
  headline: 'VICE HEAT',
  tagline: 'Sunshine, sirens & second chances',
  headlineSize: 0.108,
  letterSpacing: 0.06,
  photos: { a: null, b: null },
  panels: [
    { slot: 'a', crop: defaultCrop() },
    { slot: 'b', crop: defaultCrop() },
    { slot: 'a', crop: defaultCrop() },
  ],
  selectedPanel: 0,
  exportSize: 'landscape',
};

function panelLabel(i) {
  return ['Hero panel', 'Panel 2', 'Panel 3'][i] ?? `Panel ${i + 1}`;
}

// ---- Preview -------------------------------------------------------------

function previewSize() {
  const size = exportSizeById(state.exportSize);
  const scale = Math.min(860 / size.w, 620 / size.h);
  return { w: Math.max(2, Math.round(size.w * scale)), h: Math.max(2, Math.round(size.h * scale)) };
}

function drawPreview() {
  const { w, h } = previewSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(preview, state);
  drawSelection();
  updatePanelControls();
}

/** A dashed outline around the selected panel, drawn over the preview. */
function drawSelection() {
  const ctx = preview.getContext('2d');
  const rects = panelRects(layoutById(state.layout), preview.width, preview.height);
  const rect = rects[state.selectedPanel];
  if (!rect) return;
  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
  ctx.setLineDash([]);
  ctx.font = '700 13px "Liberation Sans", Arial, sans-serif';
  const label = panelLabel(state.selectedPanel).toUpperCase();
  const labelW = ctx.measureText(label).width + 16;
  ctx.fillStyle = 'rgba(16, 3, 18, 0.85)';
  ctx.fillRect(rect.x + 6, rect.y + 6, labelW, 22);
  ctx.fillStyle = '#00e5ff';
  ctx.fillText(label, rect.x + 14, rect.y + 22);
  ctx.restore();
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ---- Photo loading -------------------------------------------------------

function setPhoto(slot, img) {
  state.photos[slot] = img;
  drawPreview();
}

async function loadFileIntoSlot(file, slot) {
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  setPhoto(slot, img);
  setStatus(`Photo ${slot.toUpperCase()} loaded: ${file.name}`);
}

async function loadSampleIntoSlot(name, slot) {
  const img = await loadImage(`samples/${name}.jpg`);
  setPhoto(slot, img);
  setStatus(`Sample “${name}” loaded as photo ${slot.toUpperCase()}.`);
}

// ---- Panel editing: click to select, drag to pan -------------------------

function previewPoint(event) {
  const r = preview.getBoundingClientRect();
  return {
    x: (event.clientX - r.left) * (preview.width / r.width),
    y: (event.clientY - r.top) * (preview.height / r.height),
  };
}

function hitPanel(p) {
  const rects = panelRects(layoutById(state.layout), preview.width, preview.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return 0;
}

let drag = null;
preview.addEventListener('pointerdown', (event) => {
  const p = previewPoint(event);
  state.selectedPanel = hitPanel(p);
  const rects = panelRects(layoutById(state.layout), preview.width, preview.height);
  const rect = rects[state.selectedPanel];
  drag = { x: p.x, y: p.y, rect };
  preview.setPointerCapture(event.pointerId);
  drawPreview();
});
preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const p = previewPoint(event);
  const crop = state.panels[state.selectedPanel].crop;
  crop.ox = clamp(crop.ox + (p.x - drag.x) / drag.rect.w, -0.6, 0.6);
  crop.oy = clamp(crop.oy + (p.y - drag.y) / drag.rect.h, -0.6, 0.6);
  drag.x = p.x;
  drag.y = p.y;
  drawPreview();
});
preview.addEventListener('pointerup', () => { drag = null; });

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ---- Controls ------------------------------------------------------------

function buildButtons(container, items, current, onPick) {
  const el = $(container);
  el.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick' + (item.id === current ? ' active' : '');
    b.textContent = item.name;
    b.title = item.hint || item.name;
    b.addEventListener('click', () => {
      onPick(item.id);
      buildButtons(container, items, item.id, onPick);
    });
    el.appendChild(b);
  });
}

function refreshPickers() {
  buildButtons('layout-picks', LAYOUTS.map((l) => ({ id: l.id, name: l.name, hint: l.hint })),
    state.layout, (id) => { state.layout = id; drawPreview(); });
  buildButtons('grade-picks', GRADES.map((g) => ({ id: g.id, name: g.name, hint: g.hint })),
    state.grade, (id) => { state.grade = id; drawPreview(); });
  buildButtons('size-picks', EXPORT_SIZES.map((s) => ({ id: s.id, name: `${s.label} ${s.w}×${s.h}` })),
    state.exportSize, (id) => {
      state.exportSize = id;
      const s = exportSizeById(id);
      setStatus(`Preview size: ${s.w} × ${s.h}.`);
      drawPreview();
    });
}

function updatePanelControls() {
  const panel = state.panels[state.selectedPanel];
  $('panel-name').textContent = `${panelLabel(state.selectedPanel)} — photo ${panel.slot.toUpperCase()}`;
  $('zoom').value = String(panel.crop.zoom);
  $('zoom-value').textContent = `${panel.crop.zoom.toFixed(2)}×`;
  $('slot-a').checked = panel.slot === 'a';
  $('slot-b').checked = panel.slot === 'b';
}

$('photo-a').addEventListener('change', (e) => loadFileIntoSlot(e.target.files[0], 'a'));
$('photo-b').addEventListener('change', (e) => loadFileIntoSlot(e.target.files[0], 'b'));
$('sample-boulevard').addEventListener('click', () => loadSampleIntoSlot('boulevard', 'a'));
$('sample-pier').addEventListener('click', () => loadSampleIntoSlot('pier', 'b'));
$('swap-photos').addEventListener('click', () => {
  [state.photos.a, state.photos.b] = [state.photos.b, state.photos.a];
  drawPreview();
  setStatus('Photos A and B swapped.');
});

$('headline').addEventListener('input', (e) => { state.headline = e.target.value; drawPreview(); });
$('tagline').addEventListener('input', (e) => { state.tagline = e.target.value; drawPreview(); });
$('headline-size').addEventListener('input', (e) => {
  state.headlineSize = Number(e.target.value);
  $('headline-size-value').textContent = `${Math.round(state.headlineSize * 1000) / 10}%`;
  drawPreview();
});
$('letter-spacing').addEventListener('input', (e) => {
  state.letterSpacing = Number(e.target.value);
  $('letter-spacing-value').textContent = `${Math.round(state.letterSpacing * 100)}%`;
  drawPreview();
});
$('zoom').addEventListener('input', (e) => {
  state.panels[state.selectedPanel].crop.zoom = Number(e.target.value);
  drawPreview();
});
$('reset-crop').addEventListener('click', () => {
  state.panels[state.selectedPanel].crop = defaultCrop();
  drawPreview();
  setStatus(`${panelLabel(state.selectedPanel)} crop reset.`);
});
$('slot-a').addEventListener('change', () => { state.panels[state.selectedPanel].slot = 'a'; drawPreview(); });
$('slot-b').addEventListener('change', () => { state.panels[state.selectedPanel].slot = 'b'; drawPreview(); });

$('export').addEventListener('click', () => {
  const size = exportSizeById(state.exportSize);
  downloadExport(state, size.w, size.h, (name) => {
    setStatus(name
      ? `Saved ${name} — ${size.w} × ${size.h} PNG.`
      : 'Export failed in this browser.');
  });
});

// ---- Test / screenshot API (used by shots.js and by the driver) ----------

window.__viceHeat = {
  state,
  setPhoto,
  setCaption(text) {
    state.headline = text;
    $('headline').value = text;
    drawPreview();
  },
  setLayout(id) { state.layout = id; refreshPickers(); drawPreview(); },
  setGrade(id) { state.grade = id; refreshPickers(); drawPreview(); },
  exportDataURL(w, h) { return exportDataURL(state, w, h); },
  setStatus,
  drawPreview,
};

// ---- Boot ----------------------------------------------------------------

refreshPickers();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), window.__viceHeat)
    .catch((err) => { setStatus(`Shot failed: ${err.message}`); });
} else {
  drawPreview();
  setStatus('Pick a sample photo or upload your own, then export a PNG.');
}
window.__viceHeatReady = true;
