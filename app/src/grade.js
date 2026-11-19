// Colour grades for VICE HEAT. Each grade is a set of translucent washes
// painted over the finished panels, plus a vignette and a deterministic
// film grain, so the same photo reads as a different time of day.
// Nothing here touches the network; everything is canvas gradients.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    hint: 'Warm orange, pink and purple wash',
    top: 'rgba(255, 122, 26, 0.16)',
    bottom: 'rgba(214, 51, 132, 0.42)',
    glow: 'rgba(255, 90, 120, 0.20)',
    glowX: 0.5,
    glowY: 0.62,
    vignette: 0.42,
    grain: 0.07,
    warmth: 0.10,
  },
  {
    id: 'neon',
    name: 'Neon Night',
    hint: 'Magenta and cyan glow, deep shadows',
    top: 'rgba(0, 229, 255, 0.10)',
    bottom: 'rgba(255, 0, 170, 0.44)',
    glow: 'rgba(160, 60, 255, 0.24)',
    glowX: 0.78,
    glowY: 0.3,
    vignette: 0.55,
    grain: 0.09,
    warmth: 0.0,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    hint: 'Low sun gold, soft haze, gentle contrast',
    top: 'rgba(255, 196, 66, 0.20)',
    bottom: 'rgba(255, 126, 32, 0.26)',
    glow: 'rgba(255, 220, 120, 0.22)',
    glowX: 0.22,
    glowY: 0.18,
    vignette: 0.30,
    grain: 0.05,
    warmth: 0.16,
  },
];

/** Returns the grade with this id, or the first grade when unknown. */
export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// A tiny seeded generator so the grain is identical on every render and
// every export of the same size — no Math.random anywhere in the art.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One shared grain tile, built lazily per seed, reused across renders.
const grainTiles = new Map();
function grainTile(seed) {
  if (!grainTiles.has(seed)) {
    const size = 128;
    const tile = document.createElement('canvas');
    tile.width = size;
    tile.height = size;
    const tctx = tile.getContext('2d');
    const img = tctx.createImageData(size, size);
    const rnd = mulberry32(seed);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rnd() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    grainTiles.set(seed, tile);
  }
  return grainTiles.get(seed);
}

/**
 * Paints a grade over a finished cover of width W and height H.
 * ctx is the cover's 2D context; the panels and lettering are already drawn
 * underneath, so the grade unifies them into one poster.
 */
export function applyGrade(ctx, W, H, grade) {
  // Warm wash, top to bottom.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);

  // A soft coloured glow, like a neon sign or a low sun just off frame.
  const glow = ctx.createRadialGradient(
    grade.glowX * W, grade.glowY * H, 0,
    grade.glowX * W, grade.glowY * H, Math.max(W, H) * 0.75,
  );
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Extra warmth: a faint orange overlay blended in.
  if (grade.warmth > 0) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = `rgba(255, 150, 60, ${grade.warmth})`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }

  // Vignette: darkened corners pull the eye to the middle.
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.78,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, `rgba(10, 4, 20, ${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Film grain, tiled from the seeded tile.
  const tile = grainTile(20261119);
  ctx.save();
  ctx.globalAlpha = grade.grain;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
