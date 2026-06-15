// ============================================================
// HOME PAGE BATCH INTEGRATION
// ============================================================
// Dynamically loads and displays batches on home page
// Syncs with database in real-time
// ============================================================

/**
 * Home Page Batch Manager
 */
class HomePageBatchManager {
  constructor() {
    this.currentCategory = 'semester';
    this.batchCache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize home page batch displays
   */
  async init() {
    if (this.initialized) return;

    try {
      // Wait for batch service
      await this.waitForBatchService();

      // Setup event listeners
      this.setupEventListeners();

      // Load initial batches
      await this.loadBatches();

      // Listen for batch updates
      if (typeof batchService !== 'undefined') {
        batchService.on('batch-added', () => this.loadBatches());
        batchService.on('batch-updated', () => this.loadBatches());
        batchService.on('batch-removed', () => this.loadBatches());
      }

      this.initialized = true;
      console.log('✅ Home Page Batch Manager Initialized');
    } catch (error) {
      console.error('❌ Home page batch manager error:', error);
    }
  }

  /**
   * Wait for batch service to be ready
   */
  async waitForBatchService() {
    return new Promise((resolve) => {
      const maxAttempts = 50;
      let attempts = 0;

      const check = setInterval(() => {
        if (typeof batchService !== 'undefined' && batchService.isInitialized) {
          clearInterval(check);
          resolve();
        }

        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(check);
          console.warn('⚠️ Batch service timeout');
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Category switcher buttons
    document.querySelectorAll('.batch-category-switcher .switcher-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.batch-category-switcher .switcher-btn').forEach(b => {
          b.classList.remove('active');
        });
        e.target.closest('.switcher-btn').classList.add('active');
        
        const category = e.target.closest('.switcher-btn').dataset.category;
        this.switchCategory(category);
      });
    });
  }

  /**
   * Switch batch category
   */
  switchCategory(category) {
    this.currentCategory = category;
    this.loadBatches();
  }

  /**
   * Load and display batches
   */
  async loadBatches() {
    try {
      if (typeof batchService === 'undefined' || !batchService.isInitialized) {
        console.warn('⚠️ Batch service not ready');
        return;
      }

      const grid = document.getElementById('semesterGrid');
      if (!grid) return;

      let batches = [];
      let title = '';
      let description = '';

      switch (this.currentCategory) {
        case 'semester':
          batches = Array.from(batchService.getBCABatches().values());
          title = '🎓 Semester Batches';
          description = 'Organized by semesters for structured learning';
          break;

        case 'elite':
          batches = Array.from(batchService.getElitePlusBatches().values());
          title = '💎 Elite Coding Batches';
          description = 'Premium coding mastery programs';
          break;

        case 'placement':
          batches = Array.from(batchService.getAllBatches().values())
            .filter(b => b.category === 'placement' || b.name?.includes('Placement'));
          title = '💼 Placement Preparation';
          description = 'Interview & aptitude preparation';
          break;
      }

      // Clear grid
      grid.innerHTML = '';

      if (batches.length === 0) {
        grid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
            <div style="font-size: 2rem; margin-bottom: 10px;">📭</div>
            <p>No batches available in this category yet</p>
          </div>
        `;
        return;
      }

      // Render batches
      batches.forEach((batch) => {
        const card = document.createElement('div');
        card.innerHTML = BatchCardRenderer.renderBatchCard(batch.id, batch, {
          showEnrollBtn: true,
          showDetailsLink: true
        });
        grid.appendChild(card.firstElementChild);
      });

      console.log(`✅ Loaded ${batches.length} batches for ${this.currentCategory}`);
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  }
}

/**
 * Initialize home page batch manager when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for batch platform integration
  const checkIntegration = setInterval(async () => {
    if (typeof batchPlatformIntegration !== 'undefined') {
      clearInterval(checkIntegration);
      
      const homeManager = new HomePageBatchManager();
      window.homePageBatchManager = homeManager;
      
      // Wait a bit more for batch service to be initialized by platform integration
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        await homeManager.init();
      } catch (error) {
        console.warn('⚠️ Home manager init deferred:', error.message);
      }
    }
  }, 100);

  // Timeout after 3 seconds
  setTimeout(() => clearInterval(checkIntegration), 3000);
});
