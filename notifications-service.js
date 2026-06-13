/**
 * ============================================================================
 * LIVE BATCH ACTIVITY & ANNOUNCEMENT SYSTEM - SERVICE ENGINE
 * ============================================================================
 * Handles real-time notifications, client-side glassmorphic popups,
 * local storage sync, smart highlights, active heartbeats, and admin stats.
 * ============================================================================
 */

// Helper to safely fetch from localStorage
function lsGet(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

// Helper to safely write to localStorage
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

const CATEGORY_MAP = {
  'video_upload': { label: 'New Video Uploaded', icon: '🎥', color: '#3b82f6' },
  'notes_upload': { label: 'Fresh Notes Available!', icon: '📖', color: '#10b981' },
  'test_added': { label: 'Challenge Yourself!', icon: '📝', color: '#f59e0b' },
  'assignment': { label: 'New Assignment', icon: '📋', color: '#ec4899' },
  'live_class': { label: 'Live Class Scheduled', icon: '🎥', color: '#8b5cf6' },
  'announcement': { label: 'Important Update', icon: '📢', color: '#ef4444' },
  'batch_update': { label: 'Batch Updated', icon: '🔄', color: '#06b6d4' },
  'achievement': { label: 'Achievement unlocked!', icon: '🏆', color: '#fbbf24' }
};

const PAGE_LOAD_TIME = Date.now();
let notificationListenerActive = false;

// Inject custom glassmorphic notification styling dynamically on load
function injectNotificationStyles() {
  if (document.getElementById('live-notif-styles')) return;
  const style = document.createElement('style');
  style.id = 'live-notif-styles';
  style.textContent = `
    /* Premium Glassmorphic Bell Dropdown & Toast Styles */
    .notif-bell-btn {
      position: relative;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.16));
      border: 1px solid rgba(129, 140, 248, 0.22);
      cursor: pointer;
      color: #fff;
      text-decoration: none;
      font-size: 0;
      width: 46px;
      height: 46px;
      padding: 0;
      border-radius: 50%;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(79, 70, 229, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16);
      overflow: visible;
    }
    .notif-bell-btn:hover {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.32), rgba(139, 92, 246, 0.26));
      border-color: rgba(129, 140, 248, 0.42);
      transform: translateY(-1px) scale(1.04);
      box-shadow: 0 14px 32px rgba(79, 70, 229, 0.24), 0 0 0 8px rgba(99, 102, 241, 0.08);
    }
    .notif-bell-btn.active,
    .notif-bell-btn.has-unread {
      animation: bellFloat 3s ease-in-out infinite;
    }
    .notif-bell-btn.has-unread .notif-bell-glyph {
      animation: bellSwing 1.8s ease-in-out infinite;
      transform-origin: top center;
    }
    .notif-bell-glyph {
      font-size: 1.2rem;
      line-height: 1;
      filter: drop-shadow(0 6px 14px rgba(99, 102, 241, 0.35));
    }
    .nav-bell-btn {
      margin-right: 2px;
    }
    .drawer-notif-link {
      flex-shrink: 0;
      margin-left: auto;
    }
    .drawer-notif-link.active {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.34));
      border-color: rgba(165, 180, 252, 0.5);
    }
    .notif-badge-pill {
      position: absolute;
      top: -2px;
      right: -2px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      border-radius: 99px;
      font-size: 0.65rem;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg-card, #0f172a);
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
      animation: badgePulse 2s infinite;
    }
    @keyframes badgePulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    @keyframes bellSwing {
      0%, 100% { transform: rotate(0deg); }
      20% { transform: rotate(14deg); }
      40% { transform: rotate(-10deg); }
      60% { transform: rotate(7deg); }
      80% { transform: rotate(-4deg); }
    }
    @keyframes bellFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
    
    .bell-dropdown-container {
      position: relative;
      display: inline-block;
    }
    
    .bell-dropdown-menu {
      position: absolute;
      right: 0;
      top: calc(100% + 12px);
      width: 380px;
      max-height: 480px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1);
      z-index: 10000;
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    .bell-dropdown-menu.active {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }
    .bell-dropdown-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .bell-dropdown-header h3 {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
    }
    .bell-dropdown-actions {
      display: flex;
      gap: 12px;
    }
    .bell-dropdown-action-link {
      font-size: 0.78rem;
      color: var(--primary, #6366f1);
      background: none;
      border: none;
      font-weight: 700;
      cursor: pointer;
      padding: 0;
    }
    .bell-dropdown-action-link:hover {
      text-decoration: underline;
    }
    .bell-dropdown-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      max-height: 340px;
    }
    .bell-dropdown-item {
      padding: 12px 14px;
      border-radius: 12px;
      transition: all 0.2s ease;
      cursor: pointer;
      display: flex;
      gap: 12px;
      margin-bottom: 6px;
      position: relative;
      border: 1px solid transparent;
    }
    .bell-dropdown-item:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.06);
    }
    .bell-dropdown-item.unread {
      background: rgba(99, 102, 241, 0.06);
      border-color: rgba(99, 102, 241, 0.12);
    }
    .bell-dropdown-item.smart-highlight {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
      border-color: rgba(139, 92, 246, 0.2);
      box-shadow: 0 0 15px rgba(139, 92, 246, 0.1);
    }
    .bell-dropdown-thumb {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      flex-shrink: 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
      background: rgba(0,0,0,0.2);
    }
    .bell-dropdown-icon-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }
    .bell-dropdown-info {
      flex: 1;
      min-width: 0;
    }
    .bell-dropdown-type-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .bell-dropdown-type-badge {
      font-size: 0.65rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .bell-dropdown-time {
      font-size: 0.65rem;
      color: var(--text-muted, #94a3b8);
    }
    .bell-dropdown-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bell-dropdown-msg {
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .bell-dropdown-footer {
      padding: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      text-align: center;
    }
    .bell-dropdown-view-all {
      display: block;
      width: 100%;
      padding: 8px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      font-size: 0.85rem;
      color: #fff;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .bell-dropdown-view-all:hover {
      background: var(--primary, #6366f1);
      border-color: var(--primary, #6366f1);
    }
    .bell-dropdown-empty {
      padding: 40px 20px;
      text-align: center;
      color: var(--text-muted, #94a3b8);
    }
    .bell-dropdown-empty-icon {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .bell-dropdown-item-delete {
      position: absolute;
      right: 8px;
      top: 8px;
      background: none;
      border: none;
      color: rgba(255,255,255,0.3);
      font-size: 0.85rem;
      cursor: pointer;
      opacity: 0;
      transition: all 0.2s ease;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }
    .bell-dropdown-item:hover .bell-dropdown-item-delete {
      opacity: 1;
    }
    .bell-dropdown-item-delete:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    /* Live Toast Popup Overlay Container */
    .live-toast-container {
      position: fixed;
      top: 85px;
      right: 20px;
      width: 360px;
      max-width: calc(100vw - 40px);
      z-index: 999999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }
    .live-toast-card {
      pointer-events: auto;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35), 
                  0 0 25px rgba(99, 102, 241, 0.1),
                  inset 0 1px 1px rgba(255,255,255,0.1);
      backdrop-filter: blur(18px) saturate(180%);
      -webkit-backdrop-filter: blur(18px) saturate(180%);
      display: flex;
      gap: 12px;
      transform: translateX(400px);
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      overflow: hidden;
      animation: toastSlideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    .live-toast-card.smart-highlight {
      border-color: rgba(245, 158, 11, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 
                  0 0 30px rgba(245, 158, 11, 0.15),
                  inset 0 1px 1px rgba(255,255,255,0.15);
    }
    .live-toast-card.smart-highlight::after {
      content: 'SMART HIGH';
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #000;
      font-size: 0.55rem;
      font-weight: 900;
      padding: 2px 8px;
      border-bottom-left-radius: 8px;
      letter-spacing: 0.5px;
    }
    .live-toast-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 5px;
      background: var(--toast-accent, #6366f1);
    }
    .live-toast-close {
      position: absolute;
      top: 10px; right: 10px;
      background: none; border: none;
      color: rgba(255,255,255,0.4);
      font-size: 0.9rem; cursor: pointer;
      transition: color 0.2s;
    }
    .live-toast-close:hover {
      color: #fff;
    }
    .live-toast-card.slide-out {
      animation: toastSlideOut 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
    }
    @keyframes toastSlideIn {
      from { transform: translateX(450px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastSlideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(450px); opacity: 0; }
    }
    
    .live-toast-thumb {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      object-fit: cover;
      border: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
      background: rgba(0,0,0,0.2);
    }
    .live-toast-icon-wrap {
      width: 50px; height: 50px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 1.6rem;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .live-toast-body {
      flex: 1;
      min-width: 0;
    }
    .live-toast-cat {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--toast-accent, #6366f1);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 2px;
    }
    .live-toast-title {
      font-size: 0.9rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px;
      padding-right: 12px;
    }
    .live-toast-msg {
      font-size: 0.8rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.45;
      margin-bottom: 8px;
    }
    .live-toast-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .live-toast-btn {
      padding: 6px 14px;
      background: var(--toast-accent, #6366f1);
      border: none;
      color: #fff;
      font-weight: 700;
      font-size: 0.78rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .live-toast-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
    .live-toast-dismiss {
      background: none;
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.6);
      padding: 5px 12px;
      font-size: 0.78rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .live-toast-dismiss:hover {
      border-color: rgba(255,255,255,0.2);
      color: #fff;
    }
  `;
  document.head.appendChild(style);
}

// Format time relative (e.g., "Just Now", "2 min ago")
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just Now';
  const diff = Date.now() - timestamp;
  if (diff < 10000) return 'Just Now';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

// Play notification sound
function playNotificationChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create double bell-like frequency tones
    const playTone = (freq, duration, delay) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
      
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + duration);
    };
    
    // Ring-ring chime
    playTone(830, 0.4, 0);
    playTone(1050, 0.5, 0.1);
  } catch (e) {
    console.warn("Chime play error:", e.message);
  }
}

// Core Notifications Engine Object
const NotificationsService = {
  // Push Notification (Admin portal call)
  async pushSystemNotification(type, title, message, batchId = '', targetUrl = '', batchThumbnail = '', actionText = 'Open Batch') {
    if (typeof db === 'undefined' || !db) {
      console.error("Database connection not ready for pushing notification.");
      return null;
    }
    
    const cat = CATEGORY_MAP[type] || { label: 'Announcement', icon: '📢', color: '#ef4444' };
    const notifId = `live_notif_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const timestamp = Date.now();
    
    // Resolve batch name if applicable
    let batchName = '';
    if (batchId) {
      try {
        const batchSnap = await db.ref(`batches/${batchId}`).once('value');
        if (batchSnap.exists()) {
          batchName = batchSnap.val().name || '';
          if (!batchThumbnail && batchSnap.val().thumbnail) {
            batchThumbnail = batchSnap.val().thumbnail;
          }
        }
      } catch (e) {
        console.warn("Failed resolving batch name:", e);
      }
    }
    
    const payload = {
      id: notifId,
      type,
      category: cat.label,
      title,
      message,
      batchId,
      batchName,
      batchThumbnail,
      targetUrl,
      actionText,
      timestamp,
      icon: cat.icon
    };
    
    try {
      // 1. Push to database
      await db.ref(`notifications_live/${notifId}`).set(payload);
      
      // 2. Initialize analytics logging
      await db.ref(`notification_analytics/details/${notifId}`).set({
        id: notifId,
        title: title,
        type: type,
        sentAt: timestamp,
        openedCount: 0,
        clicksCount: 0,
        totalViews: 0
      });
      
      // Increment total sent index
      const sentRef = db.ref('notification_analytics/summary/sentCount');
      await sentRef.transaction(current => (current || 0) + 1);
      
      console.log(`🚀 Notification pushed successfully: ${notifId}`);
      return notifId;
    } catch (error) {
      console.error("Failed to push notification:", error);
      throw error;
    }
  },

  // Check if a notification is personalized for the active student
  isPersonalized(batchId) {
    if (!batchId) return false;
    
    const enrolledElites = lsGet('enrolledEliteBatches', []);
    const enrolledSems = lsGet('enrolledBatches', []); // semester entries e.g. "Semester 1"
    
    // Check match for elite batches
    if (enrolledElites.includes(batchId)) return true;
    
    // Check match for semester paths e.g. "Semester 3" -> "semester-3"
    const parsedBatch = batchId.toLowerCase().replace('semester', '').replace(' ', '').trim();
    const isSemMatch = enrolledSems.some(sem => {
      const val = sem.toLowerCase().replace('semester', '').replace(' ', '').trim();
      return val === parsedBatch;
    });
    
    if (isSemMatch) return true;
    return false;
  },

  // Forcefully request native browser notification permissions
  requestBrowserPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default" || Notification.permission === "denied") {
      // Try asking immediately
      Notification.requestPermission();
      // Force request on any user interaction globally to ensure prompt appears
      const requestNative = () => {
        Notification.requestPermission();
        document.removeEventListener('click', requestNative);
      };
      document.addEventListener('click', requestNative);
    }
  },

  // Send Native OS Notification
  sendNativeNotification(notif) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    
    const isPersonal = this.isPersonalized(notif.batchId);
    const title = isPersonal ? `🎯 ${notif.title}` : notif.title;
    
    const options = {
      body: notif.message,
      icon: notif.batchThumbnail || 'logo.png',
      badge: 'logo.png',
      requireInteraction: true,
      tag: notif.id
    };
    
    try {
      const nativeNotif = new Notification(title, options);
      nativeNotif.onclick = function() {
        window.focus();
        if (notif.targetUrl && notif.targetUrl !== '#') {
          window.location.href = notif.targetUrl;
        } else {
          window.location.href = 'notifications.html';
        }
        nativeNotif.close();
      };
    } catch(e) {
      console.warn("Native notification error:", e);
    }
  },

  // Setup real-time listeners for students
  listenForRealTimeNotifications() {
    if (notificationListenerActive || typeof db === 'undefined' || !db) return;
    notificationListenerActive = true;
    
    this.requestBrowserPermission();
    
    injectNotificationStyles();
    
    const notifRef = db.ref('notifications_live');
    notifRef.limitToLast(10).on('child_added', (snapshot) => {
      const notif = snapshot.val();
      if (!notif) return;
      
      // Calculate deleted status local list
      const deletedList = lsGet('deleted_notifications', []);
      if (deletedList.includes(notif.id)) return;
      
      // Update UI counts and dropdowns
      NotificationsService.updateNavbarBell();
      
      // Trigger live popup only if it is uploaded *after* the student loaded this page
      if (notif.timestamp > PAGE_LOAD_TIME - 5000) {
        NotificationsService.showLivePopup(notif);
        NotificationsService.sendNativeNotification(notif);
        playNotificationChime();
      }
    });

    // Also update UI when children are removed or updated
    notifRef.on('child_removed', () => NotificationsService.updateNavbarBell());
    notifRef.on('value', () => NotificationsService.updateNavbarBell());
  },

  // Display Premium Glassmorphic Toast popup
  showLivePopup(notif) {
    let container = document.querySelector('.live-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'live-toast-container';
      document.body.appendChild(container);
    }
    
    const isPersonal = this.isPersonalized(notif.batchId);
    const cat = CATEGORY_MAP[notif.type] || { label: 'Update', icon: '📢', color: '#6366f1' };
    
    const toast = document.createElement('div');
    toast.className = `live-toast-card${isPersonal ? ' smart-highlight' : ''}`;
    toast.style.setProperty('--toast-accent', cat.color);
    
    // Personalization prefix alert message
    const displayMsg = isPersonal 
      ? `🎯 Your ${notif.batchName || 'enrolled'} Batch Just Got Better!\n${notif.message}`
      : notif.message;
      
    const thumbHtml = notif.batchThumbnail 
      ? `<img class="live-toast-thumb" src="${notif.batchThumbnail}" alt="Batch Cover" />`
      : `<div class="live-toast-icon-wrap">${notif.icon || '🔔'}</div>`;
      
    toast.innerHTML = `
      <button class="live-toast-close" onclick="this.parentElement.classList.add('slide-out'); setTimeout(() => this.parentElement.remove(), 400)">✕</button>
      ${thumbHtml}
      <div class="live-toast-body">
        <div class="live-toast-cat">${notif.category || cat.label}</div>
        <div class="live-toast-title">${notif.title}</div>
        <div class="live-toast-msg" style="white-space: pre-line;">${displayMsg}</div>
        <div class="live-toast-actions">
          <button class="live-toast-btn" onclick="NotificationsService.handleNotificationClick('${notif.id}', '${notif.targetUrl || '#'}', true)">${notif.actionText || 'Tap To View'}</button>
          <button class="live-toast-dismiss" onclick="this.closest('.live-toast-card').classList.add('slide-out'); setTimeout(() => this.closest('.live-toast-card').remove(), 400)">Dismiss</button>
        </div>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto dismiss after 8 seconds
    setTimeout(() => {
      if (toast && !toast.classList.contains('slide-out')) {
        toast.classList.add('slide-out');
        setTimeout(() => toast.remove(), 400);
      }
    }, 8500);
  },

  // Update Bell Badge and Dropdown list dynamically
  async updateNavbarBell() {
    const badge = document.getElementById('bellBadge');
    const mobileBadge = document.getElementById('mobileNotifBadge');
    const listCont = document.getElementById('dropdownNotifList');
    if (!badge && !mobileBadge && !listCont) return; // Dropdown or badge DOM element missing on this page
    
    if (typeof db === 'undefined' || !db) return;
    
    try {
      const snap = await db.ref('notifications_live').orderByChild('timestamp').once('value');
      let notifications = [];
      const readList = lsGet('read_notifications', []);
      const deletedList = lsGet('deleted_notifications', []);
      
      if (snap.exists()) {
        snap.forEach(child => {
          const item = child.val();
          if (!deletedList.includes(item.id)) {
            notifications.push(item);
          }
        });
      }
      
      // Sort: newest first
      notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      // Calculate unread count
      const unreadCount = notifications.filter(n => !readList.includes(n.id)).length;
      
      // Update badge count
      if (badge) {
        if (unreadCount > 0) {
          badge.textContent = unreadCount;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
      if (mobileBadge) {
        if (unreadCount > 0) {
          mobileBadge.textContent = unreadCount;
          mobileBadge.style.display = 'flex';
        } else {
          mobileBadge.style.display = 'none';
        }
      }
      document.querySelectorAll('.notif-bell-btn').forEach(btn => {
        btn.classList.toggle('has-unread', unreadCount > 0);
      });
      
      // Update dropdown items HTML
      if (listCont) {
        if (notifications.length === 0) {
          listCont.innerHTML = `
            <div class="bell-dropdown-empty">
              <div class="bell-dropdown-empty-icon">🔔</div>
              <div>No new updates yet</div>
              <p style="font-size:0.75rem; color:var(--text-muted); margin:4px 0 0 0;">Check back later for batch activity.</p>
            </div>
          `;
          return;
        }
        
        listCont.innerHTML = notifications.slice(0, 5).map(n => {
          const isRead = readList.includes(n.id);
          const isPersonal = this.isPersonalized(n.batchId);
          const cat = CATEGORY_MAP[n.type] || { label: 'Update', icon: '📢', color: '#6366f1' };
          
          const thumbHtml = n.batchThumbnail
            ? `<img class="bell-dropdown-thumb" src="${n.batchThumbnail}" alt="" />`
            : `<div class="bell-dropdown-icon-placeholder">${n.icon || '🔔'}</div>`;
            
          const readClass = isRead ? '' : ' unread';
          const highlightClass = isPersonal ? ' smart-highlight' : '';
          
          const displayTitle = isPersonal ? `🎯 ${n.title}` : n.title;
          
          return `
            <div class="bell-dropdown-item${readClass}${highlightClass}" onclick="NotificationsService.handleNotificationClick('${n.id}', '${n.targetUrl || '#'}')">
              <button class="bell-dropdown-item-delete" title="Delete notification" onclick="event.stopPropagation(); NotificationsService.deleteNotification('${n.id}')">✕</button>
              ${thumbHtml}
              <div class="bell-dropdown-info">
                <div class="bell-dropdown-type-row">
                  <span class="bell-dropdown-type-badge" style="color:${cat.color}">${n.category || cat.label}</span>
                  <span class="bell-dropdown-time">${formatTimeAgo(n.timestamp)}</span>
                </div>
                <div class="bell-dropdown-title">${displayTitle}</div>
                <div class="bell-dropdown-msg">${n.message}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      console.warn("Error updating bell menu UI:", e);
    }
  },

  // Handle clicking a notification card
  async handleNotificationClick(id, targetUrl, isPopup = false) {
    // 1. Mark as read locally
    const readList = lsGet('read_notifications', []);
    if (!readList.includes(id)) {
      readList.push(id);
      lsSet('read_notifications', readList);
    }
    
    // 2. Increment click metrics
    if (typeof db !== 'undefined' && db) {
      try {
        db.ref(`notification_analytics/details/${id}/clicksCount`).transaction(current => (current || 0) + 1);
        db.ref(`notification_analytics/details/${id}/openedCount`).transaction(current => (current || 0) + 1);
      } catch (e) {
        console.warn("Analytics increment failed:", e);
      }
    }
    
    // Update Bell badge counts
    this.updateNavbarBell();
    
    // Close dropdown
    const drop = document.getElementById('notifDropdown');
    if (drop) drop.classList.remove('active');
    
    // Redirect if page exists
    if (targetUrl && targetUrl !== '#') {
      window.location.href = targetUrl;
    }
  },

  // Delete notification locally
  deleteNotification(id) {
    const deletedList = lsGet('deleted_notifications', []);
    if (!deletedList.includes(id)) {
      deletedList.push(id);
      lsSet('deleted_notifications', deletedList);
    }
    this.updateNavbarBell();
  },

  // Clear all notifications
  clearAll() {
    const deletedList = lsGet('deleted_notifications', []);
    const dropdownList = document.querySelectorAll('.bell-dropdown-item');
    if (dropdownList.length === 0) return;
    
    // Collect all notification ids inside dropdown
    if (typeof db !== 'undefined' && db) {
      db.ref('notifications_live').once('value', snap => {
        if (snap.exists()) {
          snap.forEach(child => {
            const id = child.key;
            if (!deletedList.includes(id)) {
              deletedList.push(id);
            }
          });
          lsSet('deleted_notifications', deletedList);
          this.updateNavbarBell();
        }
      });
    }
  },

  // Read all notifications
  readAll() {
    const readList = lsGet('read_notifications', []);
    if (typeof db !== 'undefined' && db) {
      db.ref('notifications_live').once('value', snap => {
        if (snap.exists()) {
          snap.forEach(child => {
            const id = child.key;
            if (!readList.includes(id)) {
              readList.push(id);
              // Increment viewed counts in database analytics
              db.ref(`notification_analytics/details/${id}/openedCount`).transaction(current => (current || 0) + 1);
            }
          });
          lsSet('read_notifications', readList);
          this.updateNavbarBell();
        }
      });
    }
  },

  // Student portal Heartbeat registration to track live active users
  startUserHeartbeat(studentId, studentName) {
    if (!studentId || typeof db === 'undefined' || !db) return;
    
    const sendHeartbeat = () => {
      db.ref(`active_users/${studentId}`).set({
        id: studentId,
        name: studentName || 'BCA Student',
        lastActive: Date.now()
      }).catch(err => console.warn("Heartbeat update failed:", err.message));
    };
    
    // Send immediate heartbeat on start
    sendHeartbeat();
    
    // Repeat heartbeat every 2 minutes
    setInterval(sendHeartbeat, 120000);
  }
};

// Toggle navbar dropdown display state
window.toggleNotifDropdown = function(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('notifDropdown');
  if (!dropdown) return;
  
  dropdown.classList.toggle('active');
  
  // Close bookmarks panel or other panels if active
  const bkPanel = document.getElementById('bkPanel');
  if (bkPanel) bkPanel.classList.remove('active');
  
  // Increment analytics totalViews when dropdown is loaded
  if (dropdown.classList.contains('active') && typeof db !== 'undefined' && db) {
    db.ref('notifications_live').once('value', snap => {
      if (snap.exists()) {
        const readList = lsGet('read_notifications', []);
        snap.forEach(child => {
          const notifId = child.key;
          db.ref(`notification_analytics/details/${notifId}/totalViews`).transaction(c => (c || 0) + 1);
          // If first time viewed but unread, count as open/impression
          if (!readList.includes(notifId)) {
            db.ref(`notification_analytics/details/${notifId}/openedCount`).transaction(c => (c || 0) + 1);
          }
        });
      }
    });
  }
};

// Document Click listener to close notification menu dropdown when clicking away
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('notifDropdown');
  const btn = document.getElementById('navBellBtn');
  if (dropdown && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) {
    dropdown.classList.remove('active');
  }
});

// Self initialize style injection
injectNotificationStyles();

// Expose module globally for browser script loads
window.NotificationsService = NotificationsService;
export default NotificationsService;
