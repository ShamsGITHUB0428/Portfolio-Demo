const TOTAL_FRAMES = 300;
const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const images = new Array(TOTAL_FRAMES + 1);
let loadedCount = 0;
let currentFrame = 1;
let targetFrame = 1;
let lastDrawnFrame = -1;
let needsRedraw = true;

const getFramePath = (index) => {
  const pad = String(index).padStart(3, '0');
  return `images/ezgif-2573cfbc25471211-jpg/ezgif-frame-${pad}.jpg`;
};

// Canvas sizing with High-DPI support
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  needsRedraw = true;
}

// Find nearest loaded frame to prevent any flicker or blank frames
function getBestFrame(index) {
  const rounded = Math.round(index);
  if (images[rounded] && images[rounded].complete && images[rounded].naturalWidth > 0) {
    return images[rounded];
  }

  for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
    const prev = rounded - offset;
    if (prev >= 1 && images[prev] && images[prev].complete && images[prev].naturalWidth > 0) {
      return images[prev];
    }
    const next = rounded + offset;
    if (next <= TOTAL_FRAMES && images[next] && images[next].complete && images[next].naturalWidth > 0) {
      return images[next];
    }
  }

  return images[1] || null;
}

// Render image maintaining aspect ratio and seamless white background
function drawFrame(img) {
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = canvas.width;
  const ch = canvas.height;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cw, ch);

  // Responsive scale: ensures full subject is visible and beautifully framed on all screens
  const scaleHeight = ch / ih;
  const scaleWidthFit = cw / (iw * 0.58);
  const scale = Math.min(scaleHeight, Math.max(scaleWidthFit, cw / iw));

  const renderW = iw * scale;
  const renderH = ih * scale;
  const offsetX = (cw - renderW) / 2;
  const offsetY = (ch - renderH) / 2;

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
}

// Scroll position calculation
function onScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(Math.max(scrollTop / maxScroll, 0), 1) : 0;
  targetFrame = 1 + progress * (TOTAL_FRAMES - 1);
}

// Silky smooth render loop using lerp damping
function animationLoop() {
  const damping = 0.08;
  currentFrame += (targetFrame - currentFrame) * damping;

  if (Math.abs(targetFrame - currentFrame) < 0.005) {
    currentFrame = targetFrame;
  }

  const frameToDraw = Math.round(currentFrame);

  if (frameToDraw !== lastDrawnFrame || needsRedraw) {
    const img = getBestFrame(frameToDraw);
    if (img) {
      drawFrame(img);
      lastDrawnFrame = frameToDraw;
      needsRedraw = false;
    }
  }

  requestAnimationFrame(animationLoop);
}

// Progressive image loading
function preloadImages() {
  // Load frame 1 with top priority
  const firstImg = new Image();
  firstImg.onload = () => {
    images[1] = firstImg;
    loadedCount++;
    needsRedraw = true;
  };
  firstImg.src = getFramePath(1);
  if (firstImg.complete && firstImg.naturalWidth > 0) {
    images[1] = firstImg;
    needsRedraw = true;
  }

  // Preload remaining frames
  for (let i = 2; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.onload = () => {
      images[i] = img;
      loadedCount++;
      if (Math.round(currentFrame) === i) {
        needsRedraw = true;
      }
    };
    img.src = getFramePath(i);
  }
}

// Initialization
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', onScroll, { passive: true });

resizeCanvas();
preloadImages();
onScroll();
requestAnimationFrame(animationLoop);
