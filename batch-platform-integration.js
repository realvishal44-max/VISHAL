// ============================================================
// BATCH PLATFORM INTEGRATION MODULE
// ============================================================
// Ensures real-time synchronization of batches across entire platform
// Handles automatic updates to home page, elite page, and all batch displays
// ============================================================

/**
 * Batch Platform Integration Manager
 * Coordinates batch display and synchronization across all pages
 */
class BatchPlatformIntegration {
  constructor() {
    this.batchService = null;
    this.isInitialized = false;
    this.syncListeners = new Map();
    this.config = {
      autoRefreshInterval: 30000, // 30 seconds
      enableRealtimeSync: true
    };
  }

  /**
   * Initialize platform integration
   * @param {object} database - Firebase database instance
   */
  async initialize(database) {
    if (this.isInitialized) return;

    try {
      // Wait for batch service to be available
      await this.waitForBatchService();

      if (typeof batchService !== 'undefined') {
        this.batchService = batchService;
        
        // Initialize batch service with database
        if (!this.batchService.isInitialized) {
          await this.batchService.initialize(database);
        }

        // Setup real-time listeners
        this.setupRealtimeListeners();

        // Trigger initial sync
        this.triggerPlatformSync();

        this.isInitialized = true;
        console.log('✅ Batch Platform Integration Initialized');
      }
    } catch (error) {
      console.error('❌ Platform integration error:', error);
    }
  }

  /**
   * Wait for batch service to load
   */
  async waitForBatchService() {
    return new Promise((resolve) => {
      const maxAttempts = 30; // 3 seconds max
      let attempts = 0;

      const check = setInterval(() => {
        if (typeof batchService !== 'undefined') {
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
   * Setup real-time listeners for batch changes
   */
  setupRealtimeListeners() {
    // Listen for batch additions
    this.batchService.on('batch-added', (data) => {
      console.log('📢 New batch added:', data.batchId);
      this.onBatchAdded(data);
    });

    // Listen for batch updates
    this.batchService.on('batch-updated', (data) => {
      console.log('📝 Batch updated:', data.batchId);
      this.onBatchUpdated(data);
    });

    // Listen for batch removals
    this.batchService.on('batch-removed', (data) => {
      console.log('🗑️ Batch removed:', data.batchId);
      this.onBatchRemoved(data);
    });

    // Listen for content updates
    this.batchService.on('content-updated', (data) => {
      console.log('📚 Content updated:', data.type);
      this.onContentUpdated(data);
    });

    // Listen for batches loaded
    this.batchService.on('batches-loaded', (data) => {
      console.log(`✅ Loaded ${data.count} batches`);
      this.triggerPlatformSync();
    });
  }

  /**
   * Handle new batch addition
   */
  onBatchAdded(data) {
    const { batchId, batchData } = data;

    // Update home page if visible
    if (this.isPageActive('index.html')) {
      this.updateHomePageBatches();
    }

    // Update elite page if visible
    if (this.isPageActive('elite-plus.html', 'elite-batches.html')) {
      this.updateEliteBatches();
    }

    // Update sidebar batch lists
    this.updateBatchSidebars();

    // Dispatch custom event for other listeners
    this.dispatchBatchEvent('batch-added-platform', { batchId, batchData });
  }

  /**
   * Handle batch update
   */
  onBatchUpdated(data) {
    const { batchId, batchData } = data;

    // Update batch cards on current page
    this.updateBatchCardOnPage(batchId, batchData);

    // Dispatch custom event
    this.dispatchBatchEvent('batch-updated-platform', { batchId, batchData });
  }

  /**
   * Handle batch removal
   */
  onBatchRemoved(data) {
    const { batchId } = data;

    // Remove batch card from current page
    const card = document.querySelector(`[data-batch-id="${batchId}"]`);
    if (card) {
      card.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => card.remove(), 300);
    }

    // Update all batch displays
    this.triggerPlatformSync();

    // Dispatch custom event
    this.dispatchBatchEvent('batch-removed-platform', { batchId });
  }

  /**
   * Handle content update
   */
  onContentUpdated(data) {
    // Refresh content display if on batch details page
    const params = new URLSearchParams(window.location.search);
    if (params.has('id')) {
      // Trigger page-specific content refresh
      if (typeof controller !== 'undefined' && controller.loadAllContent) {
        controller.loadAllContent();
      }
    }

    // Dispatch custom event
    this.dispatchBatchEvent('content-updated-platform', data);
  }

  /**
   * Trigger platform-wide sync
   */
  triggerPlatformSync() {
    // Update home page batches
    this.updateHomePageBatches();

    // Update elite page batches
    this.updateEliteBatches();

    // Update batch sidebars
    this.updateBatchSidebars();

    // Update featured batches
    this.updateFeaturedBatches();

    // Update batch selectors in forms
    this.updateBatchSelectors();
  }

  /**
   * Update home page batch displays
   */
  updateHomePageBatches() {
    // Elite Plus batches container
    const eliteContainer = document.getElementById('elite-batches-container');
    if (eliteContainer && this.batchService) {
      const eliteBatches = this.batchService.getElitePlusBatches();
      if (eliteBatches.size > 0) {
        BatchCardRenderer.renderBatchGrid(eliteContainer, eliteBatches, {
          gridColumns: 3,
          gap: 20
        });
      }
    }

    // BCA batches container
    const bcaContainer = document.getElementById('bca-batches-container');
    if (bcaContainer && this.batchService) {
      const bcaBatches = this.batchService.getBCABatches();
      if (bcaBatches.size > 0) {
        BatchCardRenderer.renderBatchGrid(bcaContainer, bcaBatches, {
          gridColumns: 3,
          gap: 20
        });
      }
    }

    // Featured batches container
    const featuredContainer = document.getElementById('featured-batches-container');
    if (featuredContainer && this.batchService) {
      const allBatches = this.batchService.getAllBatches();
      const featured = Array.from(allBatches.values()).slice(0, 6);
      if (featured.length > 0) {
        BatchCardRenderer.renderBatchGrid(featuredContainer, featured, {
          gridColumns: 3,
          gap: 20
        });
      }
    }
  }

  /**
   * Update elite batches page
   */
  updateEliteBatches() {
    const sidebar = document.getElementById('sidebarBatchList');
    if (sidebar && this.batchService) {
      const eliteBatches = this.batchService.getElitePlusBatches();
      BatchCardRenderer.renderMiniBatchList(sidebar, eliteBatches);
    }

    // Also update main grid
    const mainGrid = document.querySelector('.elite-batches-grid');
    if (mainGrid && this.batchService) {
      const eliteBatches = this.batchService.getElitePlusBatches();
      BatchCardRenderer.renderBatchGrid(mainGrid, eliteBatches, {
        gridColumns: 3,
        gap: 20
      });
    }
  }

  /**
   * Update batch sidebars across pages
   */
  updateBatchSidebars() {
    const sidebars = document.querySelectorAll('.batch-sidebar, .batch-list-wrapper, .batch-selector-list');
    if (sidebars.length > 0 && this.batchService) {
      const allBatches = this.batchService.getAllBatches();
      sidebars.forEach(sidebar => {
        BatchCardRenderer.renderMiniBatchList(sidebar, allBatches);
      });
    }
  }

  /**
   * Update featured batches
   */
  updateFeaturedBatches() {
    const container = document.querySelector('.featured-batches, .trending-batches');
    if (container && this.batchService) {
      const allBatches = this.batchService.getAllBatches();
      const featured = Array.from(allBatches.values())
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, 4);
      
      if (featured.length > 0) {
        BatchCardRenderer.renderBatchGrid(container, featured, {
          gridColumns: 4,
          gap: 20
        });
      }
    }
  }

  /**
   * Update batch selectors in forms (admin panels, filters, etc.)
   */
  updateBatchSelectors() {
    const selectors = document.querySelectorAll('select.batch-selector, [data-batch-select]');
    if (selectors.length > 0 && this.batchService) {
      const allBatches = this.batchService.getAllBatches();
      
      selectors.forEach(select => {
        if (select.tagName === 'SELECT') {
          const currentValue = select.value;
          
          // Clear existing options (keep default)
          while (select.options.length > 1) {
            select.remove(1);
          }
          
          // Add batches
          allBatches.forEach((batch) => {
            const option = document.createElement('option');
            option.value = batch.id;
            option.textContent = `${batch.icon || '📚'} ${batch.name}`;
            select.appendChild(option);
          });
          
          select.value = currentValue;
        }
      });
    }
  }

  /**
   * Update single batch card on page
   */
  updateBatchCardOnPage(batchId, batchData) {
    const card = document.querySelector(`[data-batch-id="${batchId}"]`);
    if (card) {
      BatchCardRenderer.updateBatchCard(batchId, batchData);
    }
  }

  /**
   * Check if a page is currently active
   */
  isPageActive(...pageNames) {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    return pageNames.some(name => currentPage.includes(name));
  }

  /**
   * Dispatch custom batch event
   */
  dispatchBatchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }

  /**
   * Register sync listener
   */
  onSync(callback) {
    const id = Math.random().toString(36);
    this.syncListeners.set(id, callback);
    return () => this.syncListeners.delete(id);
  }

  /**
   * Get all batches
   */
  getAllBatches() {
    return this.batchService ? this.batchService.getAllBatches() : new Map();
  }

  /**
   * Get elite batches
   */
  getEliteBatches() {
    return this.batchService ? this.batchService.getElitePlusBatches() : new Map();
  }

  /**
   * Get BCA batches
   */
  getBCABatches() {
    return this.batchService ? this.batchService.getBCABatches() : new Map();
  }

  /**
   * Get single batch
   */
  getBatch(batchId) {
    return this.batchService ? this.batchService.getBatch(batchId) : null;
  }
}

// Create singleton instance
const batchPlatformIntegration = new BatchPlatformIntegration();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for Firebase to be ready
  const checkDb = setInterval(async () => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(checkDb);
      try {
        await batchPlatformIntegration.initialize(db);
      } catch (error) {
        console.warn('⚠️ Platform integration initialization deferred:', error.message);
      }
    }
  }, 100);

  // Timeout after 5 seconds
  setTimeout(() => clearInterval(checkDb), 5000);
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { batchPlatformIntegration, BatchPlatformIntegration };
}

// Global functions for event handling
function enrollBatch(batchId) {
  const enrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
  if (!enrolled.includes(batchId)) {
    enrolled.push(batchId);
    localStorage.setItem('enrolledBatches', JSON.stringify(enrolled));
    
    // Update button state
    const btn = event.target;
    btn.textContent = '✅ Enrolled';
    btn.classList.add('enrolled');
    btn.disabled = true;
    
    // Show toast
    if (typeof showToast === 'function') {
      showToast('✅ Successfully enrolled!', 'success');
    }
  }
}

function openBatchDetails(batchId) {
  window.location.href = `batch-details.html?id=${batchId}`;
}
