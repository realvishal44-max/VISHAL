// ============================================================
// ELITE PLUS - REAL-TIME SYNCHRONIZATION MANAGER
// ============================================================
// Comprehensive real-time data sync with UI feedback
// ============================================================

import { 
  EliteDataManager, 
  EliteAdminManager, 
  ELITE_BATCHES,
  SyncStatus 
} from './elite-firebase-config.js';

/**
 * Elite Real-Time Sync Manager
 * Handles all real-time synchronization with live UI updates
 */
export class EliteRealtimeSyncManager {
  constructor() {
    this.listeners = new Map(); // batchId -> [unsubscribeFunctions]
    this.syncState = new Map(); // batchId -> { videos, notes, dpp, live, lastUpdate }
    this.uiCallbacks = new Map(); // UI update callbacks
    this.initSyncStateTracking();
  }

  /**
   * Initialize sync state tracking and offline detection
   */
  initSyncStateTracking() {
    document.addEventListener('elitePlusSyncStatus', (e) => {
      this.handleSyncStatusChange(e.detail.status);
    });

    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.onOffline());
  }

  /**
   * Setup real-time listeners for a batch
   */
  setupBatchListeners(batchId, callbacks = {}) {
    if (this.listeners.has(batchId)) {
      console.warn(`⚠️ Listeners already set for ${batchId}`);
      return;
    }

    const unsubscribers = [];

    // Videos listener
    const unsubVideos = EliteDataManager.listenToVideos(batchId, (videos) => {
      this.updateSyncState(batchId, { videos, lastUpdate: Date.now() });
      callbacks.onVideosUpdate?.(videos);
      this.notifyUI(batchId, 'videos', videos);
    });
    unsubscribers.push(unsubVideos);

    // Notes listener
    const unsubNotes = EliteDataManager.listenToNotes(batchId, (notes) => {
      this.updateSyncState(batchId, { notes, lastUpdate: Date.now() });
      callbacks.onNotesUpdate?.(notes);
      this.notifyUI(batchId, 'notes', notes);
    });
    unsubscribers.push(unsubNotes);

    // DPP listener
    const unsubDPP = EliteDataManager.listenToDPP(batchId, (dpp) => {
      this.updateSyncState(batchId, { dpp, lastUpdate: Date.now() });
      callbacks.onDPPUpdate?.(dpp);
      this.notifyUI(batchId, 'dpp', dpp);
    });
    unsubscribers.push(unsubDPP);

    // Live Classes listener
    const unsubLive = EliteDataManager.listenToLiveClasses(batchId, (liveClasses) => {
      this.updateSyncState(batchId, { liveClasses, lastUpdate: Date.now() });
      callbacks.onLiveUpdate?.(liveClasses);
      this.notifyUI(batchId, 'live', liveClasses);
    });
    unsubscribers.push(unsubLive);

    this.listeners.set(batchId, unsubscribers);
    console.log(`✅ Real-time listeners setup for ${batchId}`);
  }

  /**
   * Update sync state for a batch
   */
  updateSyncState(batchId, updates) {
    const current = this.syncState.get(batchId) || {};
    this.syncState.set(batchId, { ...current, ...updates });
  }

  /**
   * Get sync state for a batch
   */
  getSyncState(batchId) {
    return this.syncState.get(batchId) || {
      videos: [],
      notes: [],
      dpp: [],
      liveClasses: [],
      lastUpdate: null
    };
  }

  /**
   * Add video with real-time sync
   */
  async addVideo(batchId, videoData) {
    try {
      this.showSyncIndicator('Adding video...', 'pending');
      
      const docRef = await EliteAdminManager.addVideo(batchId, videoData);
      
      // Update stats in real-time
      this.updateBatchStats(batchId, 'videos');
      
      this.showSyncIndicator('✅ Video added successfully!', 'success');
      return docRef;
    } catch (error) {
      console.error('Error adding video:', error);
      this.showSyncIndicator('❌ Failed to add video', 'error');
      if (!SyncStatus.isOnline) {
        SyncStatus.addPendingUpdate(() => this.addVideo(batchId, videoData));
      }
      throw error;
    }
  }

  /**
   * Add note with real-time sync
   */
  async addNote(batchId, noteData) {
    try {
      this.showSyncIndicator('Adding note...', 'pending');
      
      const docRef = await EliteAdminManager.addNote(batchId, noteData);
      
      // Update stats in real-time
      this.updateBatchStats(batchId, 'notes');
      
      this.showSyncIndicator('✅ Note added successfully!', 'success');
      return docRef;
    } catch (error) {
      console.error('Error adding note:', error);
      this.showSyncIndicator('❌ Failed to add note', 'error');
      if (!SyncStatus.isOnline) {
        SyncStatus.addPendingUpdate(() => this.addNote(batchId, noteData));
      }
      throw error;
    }
  }

  /**
   * Add DPP with real-time sync
   */
  async addDPP(batchId, dppData) {
    try {
      this.showSyncIndicator('Adding DPP...', 'pending');
      
      const docRef = await EliteAdminManager.addDPP(batchId, dppData);
      
      // Update stats in real-time
      this.updateBatchStats(batchId, 'dpp');
      
      this.showSyncIndicator('✅ DPP added successfully!', 'success');
      return docRef;
    } catch (error) {
      console.error('Error adding DPP:', error);
      this.showSyncIndicator('❌ Failed to add DPP', 'error');
      if (!SyncStatus.isOnline) {
        SyncStatus.addPendingUpdate(() => this.addDPP(batchId, dppData));
      }
      throw error;
    }
  }

  /**
   * Add live class with real-time sync
   */
  async addLiveClass(batchId, liveData) {
    try {
      this.showSyncIndicator('Adding live class...', 'pending');
      
      const docRef = await EliteAdminManager.addLiveClass(batchId, liveData);
      
      // Update stats in real-time
      this.updateBatchStats(batchId, 'live');
      
      this.showSyncIndicator('✅ Live class added successfully!', 'success');
      return docRef;
    } catch (error) {
      console.error('Error adding live class:', error);
      this.showSyncIndicator('❌ Failed to add live class', 'error');
      if (!SyncStatus.isOnline) {
        SyncStatus.addPendingUpdate(() => this.addLiveClass(batchId, liveData));
      }
      throw error;
    }
  }

  /**
   * Update batch statistics in real-time
   */
  async updateBatchStats(batchId, type) {
    try {
      const state = this.getSyncState(batchId);
      const stats = {
        totalVideos: state.videos?.length || 0,
        totalNotes: state.notes?.length || 0,
        totalDPP: state.dpp?.length || 0,
        totalLiveClasses: state.liveClasses?.length || 0,
        lastModified: Date.now()
      };
      
      await EliteAdminManager.updateStats(batchId, stats);
      console.log(`📊 Stats updated for ${batchId}:`, stats);
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Notify UI of updates
   */
  notifyUI(batchId, type, data) {
    const callbacks = this.uiCallbacks.get(`${batchId}-${type}`);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  /**
   * Register UI callback for updates
   */
  onUpdate(batchId, type, callback) {
    const key = `${batchId}-${type}`;
    if (!this.uiCallbacks.has(key)) {
      this.uiCallbacks.set(key, []);
    }
    this.uiCallbacks.get(key).push(callback);
  }

  /**
   * Show sync indicator to user
   */
  showSyncIndicator(message, status = 'pending') {
    let indicator = document.getElementById('elite-sync-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'elite-sync-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      document.body.appendChild(indicator);
    }

    const statusColors = {
      pending: 'background: rgba(59, 130, 246, 0.9); color: white;',
      success: 'background: rgba(34, 197, 94, 0.9); color: white;',
      error: 'background: rgba(239, 68, 68, 0.9); color: white;'
    };

    indicator.style.cssText += statusColors[status] || statusColors.pending;
    indicator.textContent = message;
    indicator.style.display = 'block';

    if (status !== 'pending') {
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Handle online/offline status changes
   */
  handleSyncStatusChange(status) {
    if (status === 'online') {
      this.showSyncIndicator('🟢 Sync restored', 'success');
    } else {
      this.showSyncIndicator('🔴 Offline - Changes will sync when online', 'error');
    }
  }

  onOnline() {
    console.log('🟢 Online - Processing pending updates');
    this.showSyncIndicator('🟢 Back online!', 'success');
  }

  onOffline() {
    console.log('🔴 Offline - Pending updates queued');
    this.showSyncIndicator('🔴 Offline mode', 'error');
  }

  /**
   * Cleanup listeners for a batch
   */
  cleanupBatchListeners(batchId) {
    const unsubscribers = this.listeners.get(batchId);
    if (unsubscribers) {
      unsubscribers.forEach(unsub => unsub());
      this.listeners.delete(batchId);
      console.log(`🧹 Cleaned up listeners for ${batchId}`);
    }
  }

  /**
   * Cleanup all listeners
   */
  cleanupAll() {
    this.listeners.forEach((unsubscribers, batchId) => {
      unsubscribers.forEach(unsub => unsub());
    });
    this.listeners.clear();
    console.log('🧹 All listeners cleaned up');
  }
}

// Create global instance
export const syncManager = new EliteRealtimeSyncManager();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

console.log('✅ Elite Real-Time Sync Manager initialized');
