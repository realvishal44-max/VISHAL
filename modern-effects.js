// ================================================
// ANIMATED EFFECTS MODULE - Optimized for Premium Performance
// Code Rain is REMOVED for clean homepage aesthetic
// Particle System: MINIMAL & ELEGANT
// ================================================

// ================================================
// SCROLL REVEAL ANIMATIONS - GPU Accelerated
// ================================================
class ScrollReveal {
  constructor() {
    this.elements = document.querySelectorAll(
      '.card, .tf-item, .subject-card, .grid-item, .resource-item, .elite-batch-card, .category-portal-card, .compare-card, .benefit-item, .content-card'
    );
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          this.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    this.elements.forEach((el) => this.observer.observe(el));
    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .card, .tf-item, .subject-card, .grid-item, .resource-item, .elite-batch-card, .category-portal-card, .compare-card, .benefit-item, .content-card {
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        will-change: opacity, transform;
      }

      .card.revealed, .tf-item.revealed, .subject-card.revealed, 
      .grid-item.revealed, .resource-item.revealed, .elite-batch-card.revealed, .category-portal-card.revealed, .compare-card.revealed, .benefit-item.revealed, .content-card.revealed {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
}

// ================================================
// PERFORMANCE OPTIMIZATION - LAZY LOADING
// ================================================
class LazyLoader {
  constructor() {
    this.images = document.querySelectorAll('img[data-src]');
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.lazyLoad(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    });

    this.images.forEach((img) => this.observer.observe(img));
  }

  lazyLoad(img) {
    img.src = img.dataset.src;
    img.removeAttribute('data-src');
    img.style.animation = 'fadeInUp 0.5s ease-out';
  }
}

// ================================================
// MOUSE TRAIL EFFECT - REMOVED for Performance
// Code Rain - REMOVED for clean aesthetic
// ParticleSystem - Handled by ultra-fx.js
// ================================================

// ================================================
// TOAST NOTIFICATIONS
// ================================================
class Toast {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const colors = {
      success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      info: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: ${colors[type] || colors.info};
      color: #fff;
      padding: 16px 24px;
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      max-width: 400px;
      font-weight: 600;
      backdrop-filter: blur(20px);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9rem;
    `;

    document.body.appendChild(toast);
    toast.textContent = message;

    const removeToast = () => {
      toast.style.animation = 'slideOut 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
      setTimeout(() => toast.remove(), 400);
    };

    setTimeout(removeToast, duration);
  }
}

// ================================================
// FLOATING ACTION BUTTON - Minimal
// ================================================
class FloatingActionButton {
  constructor() {
    this.fab = document.getElementById('fab') || this.createFab();
    this.setupEvents();
  }

  createFab() {
    const fab = document.createElement('button');
    fab.id = 'fab';
    fab.innerHTML = '↑';
    fab.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #fff;
      border: none;
      cursor: pointer;
      z-index: 999;
      font-size: 1.2rem;
      font-weight: 700;
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      opacity: 0;
      visibility: hidden;
      transform: scale(0) translateZ(0);
      will-change: transform, opacity;
    `;
    document.body.appendChild(fab);
    return fab;
  }

  setupEvents() {
    this.fab.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        this.fab.style.opacity = '1';
        this.fab.style.visibility = 'visible';
        this.fab.style.transform = 'scale(1) translateZ(0)';
      } else {
        this.fab.style.opacity = '0';
        this.fab.style.visibility = 'hidden';
        this.fab.style.transform = 'scale(0) translateZ(0)';
      }
    }, { passive: true });

    this.fab.addEventListener('mouseenter', () => {
      this.fab.style.transform = 'scale(1.1) translateZ(0)';
      this.fab.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
    });

    this.fab.addEventListener('mouseleave', () => {
      this.fab.style.transform = 'scale(1) translateZ(0)';
      this.fab.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.35)';
    });
  }
}

// ================================================
// INIT FUNCTION - Clean initialization
// ================================================
function initModernEffects() {
  setTimeout(() => {
    try {
      // Code rain and mouse trail removed for clean aesthetic
      new ScrollReveal();
      new LazyLoader();
      new FloatingActionButton();
    } catch (e) {
      console.warn('Modern effects initialization:', e.message);
    }
  }, 150);
}

// Auto initialize if script is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModernEffects);
} else {
  initModernEffects();
}

// Export for manual initialization
window.ModernEffects = {
  ScrollReveal,
  FloatingActionButton,
  Toast,
  LazyLoader,
  init: initModernEffects,
};
