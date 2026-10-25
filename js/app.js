/**
 * MARSHALL MONITOR III A.N.C. — MAIN APPLICATION ORCHESTRATOR
 * Orchestrator for Smooth Scrolling, Pre-order Drawer, Navigation & Modals
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Canvas Scrollytelling Sequence
  const sequence = new CanvasSequenceController({
    canvasId: 'sequenceCanvas',
    containerSelector: '.scrolly-container'
  });
  window.sequence = sequence;

  // 2. Initialize Web Audio Marshall Sound Lab
  const soundLab = new SoundSimulator();

  // 3. Initialize Exploded Component Hotspots
  const hotspots = new HotspotController();

  // 4. Pre-Order & Buy Drawer Controller
  const buyBackdrop = document.getElementById('buyDrawerBackdrop');
  const openBuyButtons = document.querySelectorAll('.trigger-buy-drawer');
  const closeBuyBtn = document.getElementById('closeBuyDrawer');
  const checkoutBtn = document.getElementById('drawerCheckoutBtn');

  const openDrawer = () => {
    if (buyBackdrop) {
      buyBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  const closeDrawer = () => {
    if (buyBackdrop) {
      buyBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  openBuyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openDrawer();
    });
  });

  if (closeBuyBtn) {
    closeBuyBtn.addEventListener('click', closeDrawer);
  }

  if (buyBackdrop) {
    buyBackdrop.addEventListener('click', (e) => {
      if (e.target === buyBackdrop) closeDrawer();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      checkoutBtn.textContent = 'Processing Order...';
      checkoutBtn.style.opacity = '0.8';
      setTimeout(() => {
        checkoutBtn.textContent = 'Pre-Order Confirmed! ✓';
        checkoutBtn.style.background = 'linear-gradient(135deg, #00C853 0%, #64DD17 100%)';
        setTimeout(() => {
          closeDrawer();
          checkoutBtn.textContent = 'Complete Pre-Order — $349';
          checkoutBtn.style.background = '';
          checkoutBtn.style.opacity = '1';
        }, 1800);
      }, 1200);
    });
  }

  // 5. Scroll Indicator Click
  const scrollIndicator = document.getElementById('scrollIndicator');
  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      window.scrollTo({
        top: window.innerHeight * 1.2,
        behavior: 'smooth'
      });
    });
  }

  // 6. Smooth Navigation Links with Pinned Scroll Awareness
  const navLinks = document.querySelectorAll('.nav-link, #exploreBtn');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();

        if (targetId === '#scrollyHero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        if (targetId === '#beatEngineering') {
          const container = document.querySelector('.scrolly-container');
          if (container) {
            const totalScrollable = container.offsetHeight - window.innerHeight;
            window.scrollTo({
              top: container.offsetTop + totalScrollable * 0.28,
              behavior: 'smooth'
            });
            return;
          }
        }

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Dynamic Navigation Active State Tracking
  const updateNavActive = () => {
    const scrollY = window.scrollY;
    const container = document.querySelector('.scrolly-container');
    const soundLab = document.getElementById('soundLab');
    const battery = document.getElementById('batterySection');
    const specs = document.getElementById('specsSection');

    let currentSection = 'scrollyHero';

    if (specs && scrollY >= specs.offsetTop - 300) {
      currentSection = 'specsSection';
    } else if (battery && scrollY >= battery.offsetTop - 300) {
      currentSection = 'batterySection';
    } else if (soundLab && scrollY >= soundLab.offsetTop - 300) {
      currentSection = 'soundLab';
    } else if (container) {
      const totalScrollable = container.offsetHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(1, scrollY / totalScrollable));
      if (progress >= 0.20 && progress <= 0.85) {
        currentSection = 'beatEngineering';
      } else {
        currentSection = 'scrollyHero';
      }
    }

    document.querySelectorAll('.nav-center .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentSection}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };

  window.addEventListener('scroll', updateNavActive, { passive: true });
  updateNavActive();

  // 7. Dynamic Keyboard Shortcuts (Up/Down or Space to explore)
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'm' || e.key === 'M') {
      soundLab.togglePlayback();
    }
  });

  console.log('Marshall Monitor III A.N.C Experience Initialized Successfully.');
});
