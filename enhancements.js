// ================================================
// PERFORMANCE & ENHANCEMENT MODULE
// Lazy Loading, Performance Optimization, Advanced Interactions
// ================================================

// ============= PERFORMANCE MONITORING ============= 
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      loadTime: 0,
      interactions: 0,
      animationFrames: 0,
    };
    this.init();
  }

  init() {
    window.addEventListener('load', () => {
      this.metrics.loadTime = performance.now();
      console.log(`%c⚡ Page Load Time: ${this.metrics.loadTime.toFixed(2)}ms`, 'color: #00f0ff; font-weight: bold;');
    });
  }

  trackInteraction() {
    this.metrics.interactions++;
  }
}

// ============= SMOOTH SCROLL OBSERVER ============= 
class SmoothScrollObserver {
  constructor() {
    this.setupScrollListener();
  }

  setupScrollListener() {
    let scrollTimeout;
    const scrollElements = document.querySelectorAll('.card, .section, .grid-item');

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      document.body.classList.add('scrolling');

      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('scrolling');
      }, 150);

      this.checkElementsInView();
    });
  }

  checkElementsInView() {
    const elements = document.querySelectorAll('[data-scroll-animate]');
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible && !el.classList.contains('animated')) {
        el.classList.add('animated');
        el.style.animation = `slideIn${el.dataset.direction || 'Up'} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`;
      }
    });
  }
}

// ============= DYNAMIC IMAGE LOADING ============= 
class DynamicImageLoader {
  constructor() {
    this.loadImages();
  }

  loadImages() {
    const images = document.querySelectorAll('img[data-lazy]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.lazy;
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        });
      });

      images.forEach((img) => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach((img) => {
        img.src = img.dataset.lazy;
      });
    }
  }
}

// ============= RIPPLE EFFECT ============= 
class RippleEffect {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-ripple], button, a, .btn');
      if (target) {
        this.createRipple(e, target);
      }
    });
  }

  createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 240, 255, 0.5), transparent);
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      animation: rippleExpand 0.6s ease-out;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }
}

// ============= KEYBOARD NAVIGATION ENHANCEMENT ============= 
class KeyboardNavigation {
  constructor() {
    this.focusableElements = [];
    this.currentFocus = 0;
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      } else if (e.key === 'Enter') {
        this.handleEnter();
      } else if (e.key === 'Escape') {
        this.handleEscape();
      }
    });
  }

  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    if (e.shiftKey) {
      // Shift + Tab
      this.currentFocus--;
      if (this.currentFocus < 0) {
        this.currentFocus = focusableElements.length - 1;
      }
    } else {
      // Tab
      this.currentFocus++;
      if (this.currentFocus >= focusableElements.length) {
        this.currentFocus = 0;
      }
    }

    focusableElements[this.currentFocus].focus();
  }

  handleEnter() {
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A')) {
      activeElement.click();
    }
  }

  handleEscape() {
    const modals = document.querySelectorAll('[class*="modal"].open, [class*="dialog"].open');
    if (modals.length > 0) {
      modals[modals.length - 1].classList.remove('open');
    }
  }
}

// ============= FORM VALIDATION ENHANCEMENT ============= 
class FormValidator {
  constructor() {
    this.forms = document.querySelectorAll('form');
    this.setupValidation();
  }

  setupValidation() {
    this.forms.forEach((form) => {
      // Skip validation on admin login forms to avoid conflicts with custom auth flow and password autofill
      if (form.closest('.admin-login-gate') || form.id === 'adminLoginForm') {
        return;
      }
      form.addEventListener('submit', (e) => this.handleSubmit(e));
      form.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          this.validateField(e.target);
        }
      });
    });
  }

  validateField(field) {
    let isValid = true;
    let message = '';

    if (field.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      isValid = emailRegex.test(field.value);
      message = 'Please enter a valid email address';
    } else if (field.type === 'password') {
      isValid = field.value.length >= 6;
      message = 'Password must be at least 6 characters';
    } else if (field.required) {
      isValid = field.value.trim().length > 0;
      message = 'This field is required';
    }

    this.updateFieldVisuals(field, isValid, message);
    return isValid;
  }

  updateFieldVisuals(field, isValid, message) {
    if (isValid) {
      field.style.borderColor = '#22c55e';
      field.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.3)';
    } else {
      field.style.borderColor = '#ef4444';
      field.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.3)';
    }
  }

  handleSubmit(e) {
    const form = e.target;
    const fields = form.querySelectorAll('input, textarea, select');
    let isFormValid = true;

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      e.preventDefault();
      Toast.show('Please fix the form errors', 'error');
    }
  }
}

// ============= BREADCRUMB NAVIGATION ENHANCEMENT ============= 
class BreadcrumbEnhancer {
  constructor() {
    this.init();
  }

  init() {
    const breadcrumbs = document.querySelectorAll('[class*="breadcrumb"] a, [class*="breadcrumb"] span');
    breadcrumbs.forEach((crumb) => {
      crumb.style.transition = 'all 0.3s ease';
      crumb.addEventListener('mouseenter', () => {
        crumb.style.color = '#00f0ff';
        crumb.style.textShadow = '0 0 10px rgba(0, 240, 255, 0.5)';
      });
      crumb.addEventListener('mouseleave', () => {
        crumb.style.color = '';
        crumb.style.textShadow = '';
      });
    });
  }
}

// ============= TOAST NOTIFICATION HELPER ============= 
class Toast {
  static show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    const colors = {
      success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      info: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)',
    };

    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: ${colors[type] || colors.info};
      color: ${type === 'warning' ? '#000' : '#fff'};
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(0, 240, 255, 0.4);
      z-index: 10000;
      animation: slideDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      max-width: 400px;
      font-weight: 600;
      backdrop-filter: blur(20px);
    `;

    document.body.appendChild(toast);
    toast.textContent = message;

    const removeToast = () => {
      toast.style.animation = 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(() => toast.remove(), 400);
    };

    setTimeout(removeToast, duration);
  }

  static success(message, duration = 2000) {
    this.show(message, 'success', duration);
  }

  static error(message, duration = 3000) {
    this.show(message, 'error', duration);
  }

  static warning(message, duration = 2500) {
    this.show(message, 'warning', duration);
  }

  static info(message, duration = 2000) {
    this.show(message, 'info', duration);
  }
}

// ============= PRELOAD CRITICAL IMAGES ============= 
class ImagePreloader {
  constructor() {
    this.preloadImages();
  }

  preloadImages() {
    const criticalImages = document.querySelectorAll('img[data-preload]');
    criticalImages.forEach((img) => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'image';
      preloadLink.href = img.src;
      document.head.appendChild(preloadLink);
    });
  }
}

// ============= PAGE ANIMATION HANDLER ============= 
class PageAnimations {
  constructor() {
    this.setupPageAnimations();
  }

  setupPageAnimations() {
    // Fade in animation on page load
    document.body.style.opacity = '0';
    window.addEventListener('load', () => {
      document.body.style.transition = 'opacity 0.5s ease-out';
      document.body.style.opacity = '1';
    });

    // Fade out on page unload
    window.addEventListener('beforeunload', () => {
      document.body.style.opacity = '0';
    });
  }
}

// ============= INIT FUNCTION ============= 
function initEnhancements() {
  setTimeout(() => {
    try {
      new PerformanceMonitor();
      new SmoothScrollObserver();
      new DynamicImageLoader();
      new RippleEffect();
      new KeyboardNavigation();
      new FormValidator();
      new BreadcrumbEnhancer();
      new ImagePreloader();
      new PageAnimations();
      
      console.log('%c✨ All enhancements initialized successfully!', 'color: #00f0ff; font-weight: bold;');
    } catch (e) {
      console.warn('Enhancement initialization:', e.message);
    }
  }, 200);
}

// Auto initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
  initEnhancements();
}

// Export for external use
window.Enhancements = {
  PerformanceMonitor,
  SmoothScrollObserver,
  DynamicImageLoader,
  RippleEffect,
  KeyboardNavigation,
  FormValidator,
  BreadcrumbEnhancer,
  Toast,
  ImagePreloader,
  PageAnimations,
  init: initEnhancements,
};
