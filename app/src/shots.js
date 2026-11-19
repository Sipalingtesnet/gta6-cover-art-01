// Fixed scenes for screenshots, driven by a `?shot=` query:
//   ?shot=editor&photo=boulevard&caption=Boulevard%20Queen
//       shows the editor with a sample photo loaded.
//   ?shot=export&photo=pier&caption=VICE%20HEAT&size=1920x1080
//       shows the actual PNG the app exported at that size, scaled to fit
//       the window — the exported file itself, not a re-draw.
// window.__shotReady is set once the scene has painted, so a screenshot
// driver knows when to capture.

/** Loads an image from a URL inside app/, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function markReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

/**
 * Runs one shot scene. `api` is the editor API from main.js:
 * { state, setPhoto, setCaption, setLayout, setGrade, exportDataURL, drawPreview }.
 */
export async function runShot(shot, query, api) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'VICE HEAT';
  const layout = query.get('layout') ?? 'vice-split';
  const grade = query.get('grade') ?? 'sunset';
  const other = photo === 'pier' ? 'boulevard' : 'pier';

  api.state.layout = layout;
  api.state.grade = grade;
  api.setCaption(caption);
  api.setPhoto('a', await loadImage(`samples/${photo}.jpg`));
  api.setPhoto('b', await loadImage(`samples/${other}.jpg`));
  // The third panel repeats a photo, so frame it as a close-up detail
  // instead of the same shot twice. The crop is picked per layout and
  // photo so it lands on a face or a scene, not on empty space.
  if (layout === 'neon-trio') {
    // Tall side panel: show the other photo's sunset side, not a face.
    api.state.panels[2].slot = 'b';
    api.state.panels[2].crop = { zoom: 1.4, ox: 0.25, oy: 0.1 };
  } else if (photo === 'pier') {
    // The pier subject stands upper-left: pan the detail onto him.
    api.state.panels[2].crop = { zoom: 1.45, ox: 0.22, oy: 0.16 };
  } else {
    // The boulevard subject stands upper-right: pan the detail onto her.
    api.state.panels[2].crop = { zoom: 1.5, ox: -0.18, oy: 0.12 };
  }
  if (layout === 'sunset-stack') {
    // The wide hero crops the photo's top; pan it down a touch so the
    // subject's head is not cut by the frame.
    api.state.panels[0].crop = { zoom: 1.0, ox: 0, oy: 0.14 };
  }

  if (shot === 'export') {
    // Show the exported PNG itself: render it, then draw it scaled to fit.
    const w = Number(query.get('w') ?? 1920);
    const h = Number(query.get('h') ?? 1080);
    const dataUrl = api.exportDataURL(w, h);
    const exported = await loadImage(dataUrl);
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('shot-canvas');
    const scale = Math.min(
      window.innerWidth / exported.naturalWidth,
      window.innerHeight / exported.naturalHeight,
    );
    canvas.width = Math.round(exported.naturalWidth * scale);
    canvas.height = Math.round(exported.naturalHeight * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(exported, 0, 0, canvas.width, canvas.height);
    markReady();
    return;
  }

  // Editor scene: the full editor, with the photo and caption in place.
  api.setStatus(`Sample “${photo}” loaded as photo A. Click a panel to select it, drag to pan, then export.`);
  api.drawPreview();
  markReady();
}
