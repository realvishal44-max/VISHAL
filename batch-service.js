// ============================================================
// UNIFIED BATCH MANAGEMENT SERVICE
// ============================================================
// Single source of truth for all batch operations
// Handles Firebase Realtime Database and Firestore compatibility
// ============================================================

/**
 * BatchService - Unified batch management across entire platform
 * - Real-time synchronization
 * - Automatic platform-wide updates
 * - Batch-wise content mapping
 * - Maintains data consistency
 */
class BatchService {
  constructor() {
    this.batches = new Map(); // Map<batchId, batchData>
    this.batchContent = new Map(); // Map<batchId, { lectures, notes, assignments, tests }>
    this.listeners = new Map(); // Map<eventType, [callbacks]>
    this.db = null;
    this.isInitialized = false;
    this.syncState = {
      isOnline: navigator.onLine,
      lastSync: null,
      pendingUpdates: []
    };
    this.initSyncTracking();
  }

  /**
   * Initialize sync tracking and offline detection
   */
  initSyncTracking() {
    window.addEventListener('online', () => {
      this.syncState.isOnline = true;
      this.triggerEvent('sync-status-change', { status: 'online' });
      this.processPendingUpdates();
    });

    window.addEventListener('offline', () => {
      this.syncState.isOnline = false;
      this.triggerEvent('sync-status-change', { status: 'offline' });
    });
  }

  /**
   * Initialize with Firebase database reference
   * @param {object} database - Firebase Realtime Database instance
   */
  async initialize(database) {
    if (this.isInitialized) return;

    this.db = database;

    try {
      // Wait for database to be ready
      if (!this.db) {
        console.warn('⚠️ Database not available, will retry...');
        setTimeout(() => this.initialize(database), 1000);
        return;
      }

      // Load all batches from database
      await this.loadAllBatches();

      // Setup real-time listeners
      this.setupRealtimeListeners();

      this.isInitialized = true;
      this.triggerEvent('initialized', { success: true });
    } catch (error) {
      console.error('❌ BatchService initialization error:', error);
      this.triggerEvent('initialization-error', { error });
    }
  }

  /**
   * Load all batches from database
   */
  async loadAllBatches() {
    try {
      // Check if using Firebase Realtime Database
      if (typeof db !== 'undefined' && db && db.ref) {
        const snapshot = await db.ref('batches').get();
        const batchesData = snapshot.val();

        if (batchesData) {
          // Clear existing batches
          this.batches.clear();

          // Load each batch with its metadata
          Object.entries(batchesData).forEach(([batchId, batchData]) => {
            this.batches.set(batchId, {
              id: batchId,
              name: batchData.name || batchData.batchName || '',
              thumbnail: batchData.thumbnail || batchData.icon || '',
              description: batchData.description || batchData.subtitle || '',
              faculty: batchData.faculty || batchData.instructor || 'Admin',
              createdAt: batchData.createdAt || new Date().toISOString(),
              isElitePlus: batchData.isElitePlus || batchData.badge === 'Elite+',
              icon: batchData.icon || '📚',
              level: batchData.level || 'Beginner',
              category: batchData.category || 'programming',
              color: batchData.color || '#3b82f6',
              badge: batchData.badge || (batchData.isElitePlus ? 'Elite+' : 'BCA'),
              sections: batchData.sections || ['lectures', 'notes', 'assignments', 'tests'],
              ...batchData // Include any additional fields
            });
          });

          console.log(`✅ Loaded ${this.batches.size} batches`);
          this.triggerEvent('batches-loaded', { count: this.batches.size });
        }
      }
    } catch (error) {
      console.error('❌ Error loading batches:', error);
      this.triggerEvent('batches-load-error', { error });
    }
  }

  /**
   * Setup real-time listeners for batch changes
   */
  setupRealtimeListeners() {
    if (!this.db || typeof db === 'undefined' || !db.ref) return;

    // Listen for batch additions/updates
    db.ref('batches').on('child_added', (snapshot) => {
      const batchId = snapshot.key;
      const batchData = snapshot.val();
      this.updateBatchInCache(batchId, batchData);
      this.triggerEvent('batch-added', { batchId, batchData });
    });

    // Listen for batch updates
    db.ref('batches').on('child_changed', (snapshot) => {
      const batchId = snapshot.key;
      const batchData = snapshot.val();
      this.updateBatchInCache(batchId, batchData);
      this.triggerEvent('batch-updated', { batchId, batchData });
    });

    // Listen for batch deletions
    db.ref('batches').on('child_removed', (snapshot) => {
      const batchId = snapshot.key;
      this.batches.delete(batchId);
      this.batchContent.delete(batchId);
      this.triggerEvent('batch-removed', { batchId });
    });

    // Listen for content updates
    db.ref('lectures').on('value', () => {
      this.triggerEvent('content-updated', { type: 'lectures' });
    });

    db.ref('notes').on('value', () => {
      this.triggerEvent('content-updated', { type: 'notes' });
    });

    db.ref('assignments').on('value', () => {
      this.triggerEvent('content-updated', { type: 'assignments' });
    });

    db.ref('tests').on('value', () => {
      this.triggerEvent('content-updated', { type: 'tests' });
    });
  }

  /**
   * Update batch in cache
   */
  updateBatchInCache(batchId, batchData) {
    this.batches.set(batchId, {
      id: batchId,
      name: batchData.name || batchData.batchName || '',
      thumbnail: batchData.thumbnail || batchData.icon || '',
      description: batchData.description || batchData.subtitle || '',
      faculty: batchData.faculty || batchData.instructor || 'Admin',
      createdAt: batchData.createdAt || new Date().toISOString(),
      isElitePlus: batchData.isElitePlus || batchData.badge === 'Elite+',
      icon: batchData.icon || '📚',
      level: batchData.level || 'Beginner',
      category: batchData.category || 'programming',
      color: batchData.color || '#3b82f6',
      badge: batchData.badge || (batchData.isElitePlus ? 'Elite+' : 'BCA'),
      sections: batchData.sections || ['lectures', 'notes', 'assignments', 'tests'],
      ...batchData
    });
  }

  /**
   * Get all batches
   * @returns {Map<string, object>} Map of all batches
   */
  getAllBatches() {
    return new Map(this.batches);
  }

  /**
   * Get batch by ID
   * @param {string} batchId - Batch ID
   * @returns {object|null} Batch data or null
   */
  getBatch(batchId) {
    return this.batches.get(batchId) || null;
  }

  /**
   * Get all elite plus batches
   * @returns {Map<string, object>} Map of elite plus batches
   */
  getElitePlusBatches() {
    const eliteBatches = new Map();
    this.batches.forEach((batch, id) => {
      if (batch.isElitePlus || batch.badge === 'Elite+') {
        eliteBatches.set(id, batch);
      }
    });
    return eliteBatches;
  }

  /**
   * Get all BCA store batches
   * @returns {Map<string, object>} Map of BCA batches
   */
  getBCABatches() {
    const bcaBatches = new Map();
    this.batches.forEach((batch, id) => {
      if (!batch.isElitePlus && batch.badge !== 'Elite+') {
        bcaBatches.set(id, batch);
      }
    });
    return bcaBatches;
  }

  /**
   * Get batch content (lectures, notes, assignments, tests)
   * @param {string} batchId - Batch ID
   * @returns {Promise<object>} Content data
   */
  async getBatchContent(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) {
        return {
          lectures: [],
          notes: [],
          assignments: [],
          tests: []
        };
      }

      const content = {
        lectures: [],
        notes: [],
        assignments: [],
        tests: []
      };

      // Fetch lectures
      let snapshot = await db.ref('lectures').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        content.lectures = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }

      // Fetch notes
      snapshot = await db.ref('notes').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        content.notes = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }

      // Fetch assignments
      snapshot = await db.ref('assignments').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        content.assignments = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }

      // Fetch tests
      snapshot = await db.ref('tests').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        content.tests = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }

      this.batchContent.set(batchId, content);
      return content;
    } catch (error) {
      console.error(`❌ Error fetching content for batch ${batchId}:`, error);
      return {
        lectures: [],
        notes: [],
        assignments: [],
        tests: []
      };
    }
  }

  /**
   * Get lectures for a batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<array>} Array of lectures
   */
  async getLectures(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) return [];

      const snapshot = await db.ref('lectures').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        return Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching lectures for ${batchId}:`, error);
      return [];
    }
  }

  /**
   * Get notes for a batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<array>} Array of notes
   */
  async getNotes(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) return [];

      const snapshot = await db.ref('notes').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        return Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching notes for ${batchId}:`, error);
      return [];
    }
  }

  /**
   * Get assignments for a batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<array>} Array of assignments
   */
  async getAssignments(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) return [];

      const snapshot = await db.ref('assignments').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        return Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching assignments for ${batchId}:`, error);
      return [];
    }
  }

  /**
   * Get tests for a batch
   * @param {string} batchId - Batch ID
   * @returns {Promise<array>} Array of tests
   */
  async getTests(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) return [];

      const snapshot = await db.ref('tests').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        return Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data
        }));
      }
      return [];
    } catch (error) {
      console.error(`❌ Error fetching tests for ${batchId}:`, error);
      return [];
    }
  }

  /**
   * Create a new batch
   * @param {object} batchData - Batch information
   * @returns {Promise<string>} New batch ID
   */
  async createBatch(batchData) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) {
        throw new Error('Database not available');
      }

      const batchId = batchData.id || this.generateBatchId(batchData.name);

      const normalizedData = {
        id: batchId,
        name: batchData.name || '',
        batchName: batchData.name || '',
        thumbnail: batchData.thumbnail || '',
        icon: batchData.icon || '📚',
        description: batchData.description || '',
        subtitle: batchData.description || '',
        faculty: batchData.faculty || 'Admin',
        instructor: batchData.faculty || 'Admin',
        createdAt: new Date().toISOString(),
        isElitePlus: batchData.isElitePlus || false,
        badge: batchData.badge || (batchData.isElitePlus ? 'Elite+' : 'BCA'),
        level: batchData.level || 'Beginner',
        category: batchData.category || 'programming',
        color: batchData.color || '#3b82f6',
        sections: batchData.sections || ['lectures', 'notes', 'assignments', 'tests'],
        ...batchData
      };

      await db.ref(`batches/${batchId}`).set(normalizedData);

      console.log(`✅ Batch created: ${batchId}`);
      this.triggerEvent('batch-created', { batchId, batchData: normalizedData });

      return batchId;
    } catch (error) {
      console.error('❌ Error creating batch:', error);
      this.triggerEvent('batch-creation-error', { error });
      throw error;
    }
  }

  /**
   * Update a batch
   * @param {string} batchId - Batch ID
   * @param {object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateBatch(batchId, updates) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) {
        throw new Error('Database not available');
      }

      await db.ref(`batches/${batchId}`).update(updates);

      console.log(`✅ Batch updated: ${batchId}`);
      this.triggerEvent('batch-update-success', { batchId, updates });
    } catch (error) {
      console.error(`❌ Error updating batch ${batchId}:`, error);
      this.triggerEvent('batch-update-error', { batchId, error });
      throw error;
    }
  }

  /**
   * Delete a batch and all its content
   * @param {string} batchId - Batch ID
   * @returns {Promise<void>}
   */
  async deleteBatch(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) {
        throw new Error('Database not available');
      }

      // Delete batch
      await db.ref(`batches/${batchId}`).remove();

      // Delete associated content
      await this.deleteContentForBatch(batchId);

      console.log(`✅ Batch deleted: ${batchId}`);
      this.triggerEvent('batch-deleted', { batchId });
    } catch (error) {
      console.error(`❌ Error deleting batch ${batchId}:`, error);
      this.triggerEvent('batch-deletion-error', { batchId, error });
      throw error;
    }
  }

  /**
   * Delete all content for a batch
   */
  async deleteContentForBatch(batchId) {
    try {
      if (!this.db || typeof db === 'undefined' || !db.ref) return;

      // Delete lectures
      let snapshot = await db.ref('lectures').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach(key => {
          db.ref(`lectures/${key}`).remove();
        });
      }

      // Delete notes
      snapshot = await db.ref('notes').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach(key => {
          db.ref(`notes/${key}`).remove();
        });
      }

      // Delete assignments
      snapshot = await db.ref('assignments').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach(key => {
          db.ref(`assignments/${key}`).remove();
        });
      }

      // Delete tests
      snapshot = await db.ref('tests').orderByChild('batchId').equalTo(batchId).get();
      if (snapshot.val()) {
        Object.keys(snapshot.val()).forEach(key => {
          db.ref(`tests/${key}`).remove();
        });
      }
    } catch (error) {
      console.error(`❌ Error deleting content for batch ${batchId}:`, error);
    }
  }

  /**
   * Generate batch ID from name
   * @param {string} batchName - Batch name
   * @returns {string} Generated batch ID
   */
  generateBatchId(batchName) {
    return batchName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Listen for batch changes
   * @param {string} eventType - Event type (batches-loaded, batch-added, etc.)
   * @param {function} callback - Callback function
   * @returns {function} Unsubscribe function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Trigger an event
   */
  triggerEvent(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${eventType} callback:`, error);
        }
      });
    }
  }

  /**
   * Process pending updates when going online
   */
  async processPendingUpdates() {
    while (this.syncState.pendingUpdates.length > 0) {
      const update = this.syncState.pendingUpdates.shift();
      try {
        await update();
      } catch (error) {
        console.error('Error processing pending update:', error);
        this.syncState.pendingUpdates.unshift(update); // Re-add to queue
        break;
      }
    }
    this.syncState.lastSync = new Date();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.syncState.isOnline,
      lastSync: this.syncState.lastSync,
      pendingUpdates: this.syncState.pendingUpdates.length,
      isInitialized: this.isInitialized
    };
  }
}

// Create singleton instance
const batchService = new BatchService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { batchService, BatchService };
}
