/**
 * MARSHALL MONITOR III A.N.C. — SCROLL-LINKED CANVAS SEQUENCE CONTROLLER
 * Ultra-Smooth Hardware-Accelerated Rendering with RAF Lerp & Seamless Void Blending
 */

class CanvasSequenceController {
  constructor(options = {}) {
    this.canvas = document.getElementById(options.canvasId || 'sequenceCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d', { alpha: false });

    this.container = document.querySelector(options.containerSelector || '.scrolly-container');
    this.progressBar = document.querySelector('.nav-progress-bar');
    this.loaderOverlay = document.querySelector('.loader-overlay');
    this.loaderBarFill = document.querySelector('.loader-bar-fill');
    this.loaderPercent = document.querySelector('.loader-percent');

    // Perspectives available with tailored scroll distances
    this.perspectives = {
      horizontal: {
        folder: 'horizontal headphone',
        totalFrames: 240,
        prefix: 'ezgif-frame-',
        ext: '.jpg',
        scrollDistanceVh: 400
      },
      vertical: {
        folder: 'vertical headphone',
        totalFrames: 240,
        prefix: 'ezgif-frame-',
        ext: '.jpg',
        scrollDistanceVh: 400
      },
      driver: {
        folder: 'driver',
        totalFrames: 40,
        prefix: 'ezgif-frame-',
        ext: '.jpg',
        scrollDistanceVh: 240
      }
    };

    this.currentPerspective = 'horizontal';
    this.imagesCache = {}; // perspectiveKey -> array of Image objects
    this.loadedCounts = {};

    this.currentFrame = 1;
    this.targetFrame = 1;
    this.lerpFactor = 0.14; // Ultra-buttery Apple-like deceleration

    this.scrollProgress = 0; // 0.0 to 1.0
    this.isLoaded = false;
    this.initialKeyframesLoaded = false;

    // Beats elements
    this.beats = [
      { id: 'beatHero', min: 0.00, max: 0.16 },
      { id: 'beatEngineering', min: 0.16, max: 0.42 },
      { id: 'beatAnc', min: 0.42, max: 0.66 },
      { id: 'beatSound', min: 0.66, max: 0.85 },
      { id: 'beatCta', min: 0.85, max: 1.00 }
    ];

    this.hotspotsEl = document.querySelector('.hotspots-container');

    this.init();
  }

  init() {
    this.updateContainerHeight();
    this.resizeCanvas();
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.onScroll();
    });

    // Preload current perspective frames
    this.preloadPerspective(this.currentPerspective, () => {
      this.hideLoader();
    });

    // Setup scroll tracking
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();

    // Start RAF rendering loop
    this.renderLoop();

    // Bind perspective buttons
    const btns = document.querySelectorAll('.perspective-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const perspective = btn.getAttribute('data-perspective');
        if (perspective && perspective !== this.currentPerspective) {
          this.switchPerspective(perspective);
          btns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });
  }

  updateContainerHeight() {
    if (this.container && this.perspectives[this.currentPerspective]) {
      const vh = this.perspectives[this.currentPerspective].scrollDistanceVh || 400;
      this.container.style.height = `${vh}vh`;
    }
  }

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.drawFrame(Math.round(this.currentFrame));
  }

  formatFrameNumber(index) {
    return String(index).padStart(3, '0');
  }

  preloadPerspective(key, onInitialReady) {
    const config = this.perspectives[key];
    if (this.imagesCache[key]) {
      if (onInitialReady) onInitialReady();
      return;
    }

    const images = [];
    this.imagesCache[key] = images;
    this.loadedCounts[key] = 0;

    const total = config.totalFrames;
    let priorityLoaded = 0;
    const priorityCount = Math.min(30, total); // First few for instant display

    for (let i = 1; i <= total; i++) {
      const img = new Image();
      const frameStr = this.formatFrameNumber(i);
      img.src = `${encodeURIComponent(config.folder)}/${config.prefix}${frameStr}${config.ext}`;

      img.onload = () => {
        this.loadedCounts[key]++;
        if (key === this.currentPerspective) {
          const percent = Math.round((this.loadedCounts[key] / total) * 100);
          if (this.loaderBarFill) this.loaderBarFill.style.width = percent + '%';
          if (this.loaderPercent) this.loaderPercent.textContent = percent + '%';
        }

        if (i <= priorityCount) {
          priorityLoaded++;
          if (priorityLoaded >= priorityCount && !this.initialKeyframesLoaded) {
            this.initialKeyframesLoaded = true;
            if (onInitialReady) onInitialReady();
          }
        }

        if (this.loadedCounts[key] === total) {
          this.isLoaded = true;
          if (onInitialReady && !this.initialKeyframesLoaded) onInitialReady();
        }
      };

      img.onerror = () => {
        // Fallback gracefully on missing frame
        this.loadedCounts[key]++;
      };

      images.push(img);
    }
  }

  switchPerspective(newKey) {
    if (!this.perspectives[newKey]) return;
    this.currentPerspective = newKey;
    this.updateContainerHeight();

    if (!this.imagesCache[newKey]) {
      this.preloadPerspective(newKey);
    }
    this.onScroll();
    this.drawFrame(Math.round(this.targetFrame));
  }

  hideLoader() {
    if (this.loaderOverlay) {
      setTimeout(() => {
        this.loaderOverlay.classList.add('loaded');
      }, 350);
    }
  }

  onScroll() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const totalScrollable = this.container.offsetHeight - window.innerHeight;

    let progress = 0;
    if (totalScrollable > 0) {
      progress = Math.max(0, Math.min(1, -rect.top / totalScrollable));
    }
    this.scrollProgress = progress;

    if (this.progressBar) {
      this.progressBar.style.width = (progress * 100) + '%';
    }

    const config = this.perspectives[this.currentPerspective];
    const totalFrames = config.totalFrames;

    let targetIdx = 1;
    if (this.currentPerspective === 'driver') {
      // Dynamic Driver (40 frames):
      // Progresses smoothly through the entire exploded transducer view from frame 1 to 40
      // Frame 1 = assembled driver, Frame 40 = final exploded view state
      // Releases pin cleanly once 100% completion is reached
      targetIdx = 1 + progress * (totalFrames - 1);
    } else {
      // Horizontal Explosion & Vertical Architecture (240 frames):
      // 0.00 -> 0.48: Disassembly / Explode phase (1 -> totalFrames)
      // 0.48 -> 0.76: Peak exploded hover inspection phase with hotspots
      // 0.76 -> 1.00: Reassembly phase back into pristine hero pose (totalFrames -> 1)
      if (progress < 0.48) {
        const norm = progress / 0.48;
        targetIdx = 1 + norm * (totalFrames - 1);
      } else if (progress <= 0.76) {
        const norm = (progress - 0.48) / 0.28;
        targetIdx = totalFrames - (norm * 12);
      } else {
        const norm = (progress - 0.76) / 0.24;
        targetIdx = (totalFrames - 12) * (1 - norm) + 1;
      }
    }

    this.targetFrame = Math.max(1, Math.min(totalFrames, targetIdx));

    // Update Storytelling beats visibility
    this.updateBeats(progress);

    // Update Hotspots visibility (active during exploded inspection phase on horizontal view)
    if (this.hotspotsEl) {
      if (progress >= 0.40 && progress <= 0.78 && this.currentPerspective === 'horizontal') {
        this.hotspotsEl.classList.add('visible');
      } else {
        this.hotspotsEl.classList.remove('visible');
      }
    }
  }

  updateBeats(progress) {
    this.beats.forEach(beat => {
      const el = document.getElementById(beat.id);
      if (!el) return;
      if (progress >= beat.min && progress < beat.max) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Update Apple-style navigation opacity
    const nav = document.querySelector('.site-nav');
    if (nav) {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }

  renderLoop() {
    // Smooth lerp interpolation for 60-120fps fluid feel
    const diff = this.targetFrame - this.currentFrame;
    if (Math.abs(diff) > 0.005) {
      this.currentFrame += diff * this.lerpFactor;
      this.drawFrame(Math.round(this.currentFrame));
    } else if (this.currentFrame !== this.targetFrame) {
      this.currentFrame = this.targetFrame;
      this.drawFrame(Math.round(this.currentFrame));
    }

    requestAnimationFrame(() => this.renderLoop());
  }

  drawFrame(frameIndex) {
    const images = this.imagesCache[this.currentPerspective];
    if (!images || images.length === 0) return;

    const clampedIndex = Math.max(1, Math.min(images.length, frameIndex));
    const img = images[clampedIndex - 1];

    if (!img || !img.complete || img.naturalWidth === 0) {
      // Fallback to nearest loaded frame
      const fallbackImg = images.find(im => im && im.complete && im.naturalWidth > 0);
      if (fallbackImg) this.renderImageToCanvas(fallbackImg);
      return;
    }

    this.renderImageToCanvas(img);
  }

  renderImageToCanvas(img) {
    const vw = this.viewportWidth;
    const vh = this.viewportHeight;

    // 1. Clear with exact deep charcoal background (#050505)
    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, vw, vh);

    // 2. Scale image to preserve aspect ratio (cover / fit)
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = vw / vh;

    let dw, dh, dx, dy;
    
    // On wide desktop: contain with slight upscale for heroic presence
    if (canvasRatio > imgRatio) {
      dh = vh * 0.95;
      dw = dh * imgRatio;
    } else {
      dw = vw * 0.95;
      dh = dw / imgRatio;
    }

    // Slightly scale up in middle exploded phase for dramatic presence
    let scaleMultiplier = 1.0;
    if (this.scrollProgress >= 0.15 && this.scrollProgress <= 0.85) {
      const peakDist = 1 - Math.abs(this.scrollProgress - 0.50) / 0.35;
      scaleMultiplier = 1.0 + Math.max(0, peakDist) * 0.08;
    }

    dw *= scaleMultiplier;
    dh *= scaleMultiplier;

    dx = (vw - dw) / 2;
    dy = (vh - dh) / 2;

    // Draw frame
    this.ctx.drawImage(img, dx, dy, dw, dh);

    // 3. SEAMLESS BLENDING & EDGE FEATHERING:
    // Create an edge falloff vignette so the image boundary melts 100% seamlessly into #050505 void
    const radius = Math.max(vw, vh) * 0.75;
    const gradient = this.ctx.createRadialGradient(
      vw / 2, vh / 2, radius * 0.42,
      vw / 2, vh / 2, radius * 0.92
    );
    gradient.addColorStop(0, 'rgba(5, 5, 5, 0)');
    gradient.addColorStop(0.7, 'rgba(5, 5, 5, 0.45)');
    gradient.addColorStop(1, '#050505');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, vw, vh);

    // 4. WATERMARK SEAMLESS CONCEALMENT:
    // Gently blend out the tiny bottom-right corner where "Veo" appears
    const wmRadius = 75;
    const wmX = dx + dw - 40;
    const wmY = dy + dh - 24;
    const wmGrad = this.ctx.createRadialGradient(wmX, wmY, 5, wmX, wmY, wmRadius);
    wmGrad.addColorStop(0, 'rgba(5, 5, 5, 0.95)');
    wmGrad.addColorStop(0.6, 'rgba(5, 5, 5, 0.7)');
    wmGrad.addColorStop(1, 'rgba(5, 5, 5, 0)');
    this.ctx.fillStyle = wmGrad;
    this.ctx.beginPath();
    this.ctx.arc(wmX, wmY, wmRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // 5. Subtle cinematic ambient glow behind product
    const glow = this.ctx.createRadialGradient(
      vw / 2, vh / 2, 20,
      vw / 2, vh / 2, Math.min(vw, vh) * 0.55
    );
    glow.addColorStop(0, 'rgba(0, 80, 255, 0.06)');
    glow.addColorStop(0.5, 'rgba(0, 214, 255, 0.02)');
    glow.addColorStop(1, 'rgba(5, 5, 5, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, vw, vh);
  }
}

// Export instance
window.CanvasSequenceController = CanvasSequenceController;
