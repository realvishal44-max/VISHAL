// ============================================================
// ADMIN PANEL BATCH INTEGRATION
// ============================================================
// Seamless integration of batch creation with batch service
// Automatically syncs batches across entire platform
// ============================================================

/**
 * Admin Batch Manager - Handles batch creation and management
 */
class AdminBatchManager {
  constructor() {
    this.isInitialized = false;
    this.batchService = null;
  }

  /**
   * Initialize admin batch manager
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Wait for batch service
      await this.waitForBatchService();

      if (typeof batchService !== 'undefined') {
        this.batchService = batchService;
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('✅ Admin Batch Manager Initialized');
      }
    } catch (error) {
      console.error('❌ Admin manager initialization error:', error);
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
   * Setup event listeners
   */
  setupEventListeners() {
    // Intercept existing batch creation forms
    const createBatchBtn = document.getElementById('addBatchBtn') || 
                           document.querySelector('[onclick*="addBatch"]');
    
    if (createBatchBtn) {
      console.log('Found batch creation button');
    }
  }

  /**
   * Create batch via batch service
   * @param {object} batchData - Batch information
   * @returns {Promise<string>} Batch ID
   */
  async createBatch(batchData) {
    if (!this.batchService) {
      throw new Error('Batch service not available');
    }

    // Validate required fields
    if (!batchData.name) {
      throw new Error('Batch name is required');
    }

    // Normalize batch data
    const normalizedData = {
      name: batchData.name.trim(),
      batchName: batchData.name.trim(), // For compatibility
      description: (batchData.description || '').trim(),
      subtitle: (batchData.description || '').trim(), // For compatibility
      faculty: (batchData.faculty || 'Admin').trim(),
      instructor: (batchData.faculty || 'Admin').trim(), // For compatibility
      icon: batchData.icon || '📚',
      thumbnail: batchData.thumbnail || '',
      level: batchData.level || 'Beginner',
      category: batchData.category || 'programming',
      color: batchData.color || '#3b82f6',
      isElitePlus: batchData.isElitePlus || false,
      badge: batchData.badge || (batchData.isElitePlus ? 'Elite+' : 'BCA'),
      sections: batchData.sections || ['lectures', 'notes', 'assignments', 'tests'],
      features: batchData.features || [],
      id: this.batchService.generateBatchId(batchData.name)
    };

    try {
      const batchId = await this.batchService.createBatch(normalizedData);
      console.log(`✅ Batch created successfully: ${batchId}`);
      return batchId;
    } catch (error) {
      console.error('❌ Error creating batch:', error);
      throw error;
    }
  }

  /**
   * Update batch
   * @param {string} batchId - Batch ID
   * @param {object} updates - Fields to update
   */
  async updateBatch(batchId, updates) {
    if (!this.batchService) {
      throw new Error('Batch service not available');
    }

    try {
      await this.batchService.updateBatch(batchId, updates);
      console.log(`✅ Batch updated: ${batchId}`);
    } catch (error) {
      console.error('❌ Error updating batch:', error);
      throw error;
    }
  }

  /**
   * Delete batch
   * @param {string} batchId - Batch ID
   */
  async deleteBatch(batchId) {
    if (!this.batchService) {
      throw new Error('Batch service not available');
    }

    try {
      await this.batchService.deleteBatch(batchId);
      console.log(`✅ Batch deleted: ${batchId}`);
    } catch (error) {
      console.error('❌ Error deleting batch:', error);
      throw error;
    }
  }

  /**
   * Add content to batch
   * @param {string} type - Content type (lectures, notes, assignments, tests)
   * @param {string} batchId - Batch ID
   * @param {object} contentData - Content information
   */
  async addContent(type, batchId, contentData) {
    if (!this.db || typeof db === 'undefined') {
      throw new Error('Database not available');
    }

    const normalizedData = {
      batchId: batchId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin',
      ...contentData
    };

    try {
      await db.ref(type).push(normalizedData);
      console.log(`✅ ${type} added to batch ${batchId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get database reference
   */
  get db() {
    return typeof db !== 'undefined' ? db : null;
  }

  /**
   * List all batches (for admin dashboard)
   */
  async listBatches() {
    if (!this.batchService) {
      return new Map();
    }

    return this.batchService.getAllBatches();
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(batchId) {
    if (!this.batchService || !this.db) {
      return { lectures: 0, notes: 0, assignments: 0, tests: 0 };
    }

    try {
      const [lectures, notes, assignments, tests] = await Promise.all([
        this.batchService.getLectures(batchId),
        this.batchService.getNotes(batchId),
        this.batchService.getAssignments(batchId),
        this.batchService.getTests(batchId)
      ]);

      return {
        lectures: lectures.length,
        notes: notes.length,
        assignments: assignments.length,
        tests: tests.length,
        total: lectures.length + notes.length + assignments.length + tests.length
      };
    } catch (error) {
      console.error('Error fetching batch stats:', error);
      return { lectures: 0, notes: 0, assignments: 0, tests: 0, total: 0 };
    }
  }
}

// Create singleton instance
const adminBatchManager = new AdminBatchManager();

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', async () => {
  await adminBatchManager.init();
  console.log('✅ Admin Batch Manager Ready');
});

/**
 * ============================================================
 * EXAMPLE USAGE IN ADMIN PANEL
 * ============================================================
 */

/*

// Example 1: Create a new batch from form
async function handleCreateBatchForm(event) {
  event.preventDefault();

  const batchData = {
    name: document.getElementById('batchName').value,
    description: document.getElementById('batchDescription').value,
    faculty: document.getElementById('batchFaculty').value,
    category: document.getElementById('batchCategory').value,
    level: document.getElementById('batchLevel').value,
    icon: document.getElementById('batchIcon').value || '📚',
    thumbnail: document.getElementById('batchThumbnail').value || '',
    isElitePlus: document.getElementById('isElitePlus').checked,
    features: [
      document.getElementById('feature1').value,
      document.getElementById('feature2').value
    ].filter(f => f)
  };

  try {
    const batchId = await adminBatchManager.createBatch(batchData);
    showAdminNotification(`✅ Batch created successfully: ${batchId}`, 'success');
    event.target.reset();
    // Automatically synced across platform!
  } catch (error) {
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Example 2: Add lecture to batch
async function handleAddLecture(event) {
  event.preventDefault();

  const lectureData = {
    title: document.getElementById('lectureTitle').value,
    description: document.getElementById('lectureDesc').value,
    videoUrl: document.getElementById('videoUrl').value,
    duration: document.getElementById('duration').value || '0:00',
    instructor: document.getElementById('instructor').value || 'Admin'
  };

  const batchId = document.getElementById('lectureByBatch').value;

  try {
    await adminBatchManager.addContent('lectures', batchId, lectureData);
    showAdminNotification('✅ Lecture added successfully', 'success');
    event.target.reset();
    // Automatically appears in batch-details.html!
  } catch (error) {
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Example 3: Delete batch
async function handleDeleteBatch(batchId) {
  if (!confirm('Are you sure you want to delete this batch and all its content?')) {
    return;
  }

  try {
    await adminBatchManager.deleteBatch(batchId);
    showAdminNotification('✅ Batch deleted successfully', 'success');
    // Automatically removed from all pages!
  } catch (error) {
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Example 4: Get batch statistics
async function displayBatchStats(batchId) {
  const stats = await adminBatchManager.getBatchStats(batchId);
  console.log(`
    📊 Batch Statistics for ${batchId}:
    - Lectures: ${stats.lectures}
    - Notes: ${stats.notes}
    - Assignments: ${stats.assignments}
    - Tests: ${stats.tests}
    - Total: ${stats.total}
  `);
}

// Example 5: List all batches
async function displayAllBatches() {
  const batches = await adminBatchManager.listBatches();
  batches.forEach((batch, batchId) => {
    console.log(`📚 ${batch.icon} ${batch.name} (${batchId})`);
  });
}

*/

/**
 * Global function for showing admin notifications
 */
function showAdminNotification(message, type = 'info') {
  if (typeof showToast === 'function') {
    showToast(message, type);
  } else {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdminBatchManager, adminBatchManager };
}
