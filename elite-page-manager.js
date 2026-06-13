// ============================================================
// ELITE PLUS - PAGE MANAGER (Real-Time Updates)
// ============================================================
// Manages real-time data loading and display for Elite batches
// ============================================================

import { 
  EliteDataManager, 
  ELITE_BATCHES,
  escapeHtml,
  database
} from './elite-firebase-config.js';

import { 
  ref, 
  update 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

function getYouTubeId(url) {
  if (!url) return null;
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const m = url.match(reg);
  return m ? m[1] : null;
}

function getYouTubeThumb(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
}

class ElitePageManager {
  constructor(batchId) {
    this.batchId = batchId;
    this.batch = ELITE_BATCHES[batchId];
    this.currentTab = 'videos';
    this.listeners = []; // Store unsubscribe functions
    this.videosList = [];
    this.notesList = [];
    this.dppList = [];
    this.activeVideoId = null;
    this.likedVideos = [];
    this.watchedVideos = JSON.parse(localStorage.getItem(`watched_videos_${batchId}`) || '[]');
    
    if (!this.batch) {
      console.error(`❌ Batch not found: ${batchId}`);
      return;
    }

    this.init();
  }

  /**
   * Initialize the Elite page manager
   */
  init() {
    console.log(`🚀 Initializing Elite Page Manager for: ${this.batchId}`);
    
    // Initialize global dark mode and navigation drawer from script.js
    if (typeof window.initDarkMode === 'function') window.initDarkMode();
    if (typeof window.initNavbar === 'function') window.initNavbar();
    
    // Check if user is enrolled
    const enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
    if (!enrolled.includes(this.batchId)) {
      this.showLockScreen();
      return;
    }

    this.setupPageHeader();
    this.setupTabs();
    this.setupRealTimeSyncIndicator();
    
    // Show skeleton loaders before load
    this.showSkeletons('videos-grid');
    this.showSkeletons('notes-grid');
    this.showSkeletons('dpp-grid');

    // Instantly restore cached workspace data in 0ms!
    this.loadCachedResources();

    this.loadAllResources();
    this.setupTabClickHandlers();
  }

  /**
   * Load resources instantly from LocalStorage cache (Stale-While-Revalidate pattern)
   */
  loadCachedResources() {
    try {
      const cacheKey = `elite_cache_${this.batchId}`;
      const cache = JSON.parse(localStorage.getItem(cacheKey));
      if (cache) {
        console.log(`⚡ Instant load complete for batch ${this.batchId} from cache in 0ms!`);
        if (cache.videos) this.displayVideos(cache.videos, true);
        if (cache.notes) this.displayNotes(cache.notes, true);
        if (cache.dpp) this.displayDPP(cache.dpp, true);
        if (cache.liveClasses) this.displayLiveClasses(cache.liveClasses, true);
      }
    } catch (e) {
      console.warn("Failed to load cached resources:", e);
    }
  }

  /**
   * Persist resources to LocalStorage cache
   */
  saveToCache(type, data) {
    try {
      const cacheKey = `elite_cache_${this.batchId}`;
      const cache = JSON.parse(localStorage.getItem(cacheKey)) || {};
      cache[type] = data;
      localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (e) {
      console.warn("Failed to save to cache:", e);
    }
  }

  /**
   * Show a premium futuristic lock screen for non-enrolled users
   */
  showLockScreen() {
    // Basic setup of page header so they see the batch details
    this.setupPageHeader();

    const tabsNav = document.querySelector('.batch-tabs-nav');
    if (tabsNav) tabsNav.style.display = 'none';

    const sectionsContainer = document.querySelector('.batch-sections-container');
    if (sectionsContainer) {
      sectionsContainer.innerHTML = `
        <div class="elite-lock-container" style="text-align: center; padding: 60px 20px; background: var(--bg-primary); border: 1px solid var(--elite-border); border-radius: 20px; max-width: 600px; margin: 40px auto; box-shadow: var(--elite-shadow);">
          <div class="elite-lock-icon-wrap" style="width: 90px; height: 90px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); color: #f59e0b; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 24px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);">
            🔒
          </div>
          <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 12px; color: var(--text-primary);">Batch Locked</h2>
          <p style="color: var(--text-secondary); margin-bottom: 30px; font-weight: 600; line-height: 1.6;">
            You are not enrolled in this premium batch yet. Enroll now to unlock all high-quality video lectures, study notes, DPP question sets, and live sessions!
          </p>
          <button onclick="window.elitePageManager.enrollFromLockScreen()" class="btn-primary" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: none; padding: 14px 36px; border-radius: 12px; font-size: 1.05rem; font-weight: 800; cursor: pointer; color: white; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.35); transition: all 0.3s ease;">
            🚀 Enroll Now & Unlock
          </button>
        </div>
      `;
    }
  }

  enrollFromLockScreen() {
    const isRegistered = localStorage.getItem('student_registered') === 'true';
    if (!isRegistered) {
      if (window.showRegistrationModal) {
        localStorage.setItem('pendingEliteEnrollment', this.batchId);
        window.showRegistrationModal(false, 'register');
      } else {
        alert("Please register or login first to enroll!");
      }
      return;
    }

    let enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
    if (!enrolled.includes(this.batchId)) {
      enrolled.push(this.batchId);
      localStorage.setItem('enrolledEliteBatches', JSON.stringify(enrolled));
      
      // Sync visitor database log in real-time
      if (typeof window.syncVisitorData === 'function') {
        window.syncVisitorData();
      }
      
      // Show premium congratulation popup
      if (typeof window.showEnrollmentSuccessPopup === 'function') {
        window.showEnrollmentSuccessPopup(this.batch.name);
      } else if (typeof showToast === 'function') {
        showToast(`🎉 Enrolled in ${this.batch.name} successfully!`, 'success');
      }

      // Cleanup current manager and destroy its firebase listeners to avoid leaks
      this.destroy();

      // Expose tabs navigation display
      const tabsNav = document.querySelector('.batch-tabs-nav');
      if (tabsNav) tabsNav.style.display = 'flex';

      // Restore pristine HTML template for sections so fresh manager can hook into correct IDs and modern emojis
      const sectionsContainer = document.querySelector('.batch-sections-container');
      if (sectionsContainer) {
        sectionsContainer.innerHTML = `
          <!-- Videos Section -->
          <div id="videos-section" class="section-container active">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">🎥</span>
                <span>Video Lectures</span>
                <span class="section-count" id="videos-count">0 lectures</span>
              </div>
            </div>
            <div id="videos-grid" class="content-grid">
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading lectures...</p>
              </div>
            </div>
          </div>

          <!-- Notes Section -->
          <div id="notes-section" class="section-container">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">📄</span>
                <span>Study Notes</span>
                <span class="section-count" id="notes-count">0 notes</span>
              </div>
            </div>
            <div id="notes-grid" class="content-grid">
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading study notes...</p>
              </div>
            </div>
          </div>

          <!-- DPP Section -->
          <div id="dpp-section" class="section-container">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">📋</span>
                <span>Daily Practice Problems</span>
                <span class="section-count" id="dpp-count">0 DPPs</span>
              </div>
            </div>
            <div id="dpp-grid" class="content-grid">
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading practice sets...</p>
              </div>
            </div>
          </div>

          <!-- Live Classes Section -->
          <div id="live-section" class="section-container">
            <div class="section-header">
              <div class="section-title">
                <span class="section-icon">🔴</span>
                <span>Live Classes</span>
                <span class="section-count" id="live-count">0 classes</span>
              </div>
            </div>
            <div id="live-grid" class="content-grid">
              <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading scheduled live classes...</p>
              </div>
            </div>
          </div>
        `;
      }

      // Re-instantiate pristine Page Manager which will run full enrolled init logic seamlessly!
      window.elitePageManager = new ElitePageManager(this.batchId);
    }
  }

  /**
   * Setup real-time sync indicator
   */
  setupRealTimeSyncIndicator() {
    let indicator = document.getElementById('elite-sync-status');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'elite-sync-status';
      document.body.appendChild(indicator);
    }
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(34, 197, 94, 0.9);
      color: white;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    `;
    indicator.innerHTML = '🟢 Synced';

    // Monitor sync status
    document.addEventListener('elitePlusSyncStatus', (e) => {
      if (e.detail.status === 'online') {
        indicator.innerHTML = '🟢 Synced';
        indicator.style.background = 'rgba(34, 197, 94, 0.9)';
      } else {
        indicator.innerHTML = '🔴 Offline';
        indicator.style.background = 'rgba(239, 68, 68, 0.9)';
      }
    });

    // Monitor network status
    window.addEventListener('online', () => {
      indicator.innerHTML = '🟢 Synced';
      indicator.style.background = 'rgba(34, 197, 94, 0.9)';
    });
    
    window.addEventListener('offline', () => {
      indicator.innerHTML = '🔴 Offline';
      indicator.style.background = 'rgba(239, 68, 68, 0.9)';
    });
  }

  /**
   * Setup page header with batch information
   */
  setupPageHeader() {
    const heroContent = document.querySelector('.batch-hero-content');
    if (heroContent) {
      heroContent.innerHTML = `
        <div style="text-align: center;">
          <div class="batch-hero-icon">${this.batch.icon}</div>
          <h1 class="batch-hero-title">${this.batch.name}</h1>
          <p class="batch-hero-subtitle">${this.batch.subtitle}</p>
          <div class="batch-hero-meta" style="display: flex; justify-content: center; gap: 10px; align-items: center; margin-top: 10px;">
            <span class="meta-badge" style="background: ${this.batch.color}20; color: ${this.batch.color}; margin: 0;">
              📊 ${this.batch.level}
            </span>
            <button onclick="window.shareBatchOnWhatsApp('${this.batch.name.replace(/'/g, "\\'")}', '${this.batch.subtitle.replace(/'/g, "\\'")}', 'elite-batches.html?batch=${this.batchId}')" style="background: #25d366; color: white; border: none; border-radius: 20px; padding: 4px 12px; font-size: 0.75rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(37,211,102,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 14px; height: 14px; fill: white;"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 496l131-34.3c32.7 17.8 69.3 27.2 106.6 27.2 122.4 0 222-99.6 222-222 0-59.3-23.2-115-65.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-77.9 20.4 20.8-76-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
              <span>Share Batch</span>
            </button>
          </div>
        </div>
      `;
    }

    // Update page title
    document.title = `${this.batch.name} - Elite Plus | BCA STORE`;
  }

  /**
   * Setup tab navigation
   */
  setupTabs() {
    const tabsNav = document.querySelector('.batch-tabs-nav');
    if (!tabsNav) return;

    tabsNav.innerHTML = `
      <button class="tab-btn active" data-tab="videos" title="Video Lectures">▶️ Videos</button>
      <button class="tab-btn" data-tab="notes" title="Study Notes">📄 Notes</button>
      <button class="tab-btn" data-tab="dpp" title="Daily Practice Problems">📋 DPP</button>
      <button class="tab-btn" data-tab="live" title="Live Classes">🔴 Live</button>
    `;
  }

  /**
   * Setup tab click handlers
   */
  setupTabClickHandlers() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.target.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  /**
   * Switch between tabs
   */
  switchTab(tabId) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      }
    });

    // Hide all sections
    document.querySelectorAll('.section-container').forEach(section => {
      section.classList.remove('active');
    });

    // Show selected section
    const section = document.getElementById(`${tabId}-section`);
    if (section) {
      section.classList.add('active');
    }

    this.currentTab = tabId;
  }

  /**
   * Load all resources
   */
  loadAllResources() {
    console.log(`📦 Loading resources for: ${this.batchId}`);

    // Videos
    const unsubscribeVideos = EliteDataManager.listenToVideos(
      this.batchId,
      (videos) => this.displayVideos(videos)
    );
    this.listeners.push(unsubscribeVideos);

    // Notes
    const unsubscribeNotes = EliteDataManager.listenToNotes(
      this.batchId,
      (notes) => this.displayNotes(notes)
    );
    this.listeners.push(unsubscribeNotes);

    // DPP
    const unsubscribeDPP = EliteDataManager.listenToDPP(
      this.batchId,
      (dpp) => this.displayDPP(dpp)
    );
    this.listeners.push(unsubscribeDPP);

    // Live Classes
    const unsubscribeLive = EliteDataManager.listenToLiveClasses(
      this.batchId,
      (liveClasses) => this.displayLiveClasses(liveClasses)
    );
    this.listeners.push(unsubscribeLive);
  }

  showSkeletons(gridId, count = 6) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = Array(count).fill(0).map(() => `
      <div class="content-card skeleton-card skeleton-pulse" style="height: 320px; border: none; box-shadow: none;">
        <div style="height: 180px; border-radius: 12px; margin: 10px; background: rgba(255,255,255,0.05);"></div>
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px;">
          <div style="height: 20px; width: 60%; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>
          <div style="height: 15px; width: 90%; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>
          <div style="height: 15px; width: 40%; background: rgba(255,255,255,0.05); border-radius: 4px;"></div>
        </div>
      </div>
    `).join('');
  }

  calculateTotalDurationHours(videos) {
    let totalSeconds = 0;
    videos.forEach(v => {
      const dur = v.duration || '';
      if (!dur) return;
      if (dur.toLowerCase().includes('min')) {
        const mins = parseInt(dur) || 0;
        totalSeconds += mins * 60;
        return;
      }
      const parts = dur.split(':').map(Number);
      if (parts.some(isNaN)) return;
      if (parts.length === 3) {
        totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        totalSeconds += parts[0] * 60 + parts[1];
      } else if (parts.length === 1) {
        totalSeconds += parts[0] * 60;
      }
    });
    return Math.round(totalSeconds / 3600);
  }

  /**
   * Display Videos
   */
  displayVideos(videos, isCache = false) {
    const container = document.getElementById('videos-grid');
    if (!container) return;

    const filtered = (videos || []).filter(v => v.url || v.videoUrl);
    
    // Avoid layout flashes and heavy repaints if the sync returns identical content
    if (!isCache && JSON.stringify(filtered) === JSON.stringify(this.videosList)) {
      return;
    }

    this.videosList = filtered;
    if (!isCache) this.saveToCache('videos', videos);
    
    // Update video count
    const countElement = document.getElementById('videos-count');
    if (countElement) {
      countElement.textContent = this.videosList.length + ' ' + (this.videosList.length === 1 ? 'lecture' : 'lectures');
    }

    // Dynamic stats check: sum hours
    const totalHours = this.calculateTotalDurationHours(this.videosList);
    const totalDurationEl = document.getElementById('totalDuration');
    if (totalDurationEl) {
      totalDurationEl.textContent = `${totalHours} Hours`;
    }

    if (!videos || videos.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: rgba(30,41,59,0.3); border-radius: 18px; border: 1px dashed rgba(255,255,255,0.1); margin: 20px;">
          <div style="font-size: 3rem; margin-bottom: 12px;">😕</div>
          <h3 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 6px;">No Videos Yet</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Video lectures will appear here soon!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.videosList.map((video, index) => {
      const isCompleted = this.watchedVideos.includes(video.id);
      const isPremium = true; // Elite batches are premium by default
      const hasNotes = video.notesUrl || video.hasNotes || (this.notesList && this.notesList.some(n => n.title.toLowerCase().includes(video.title.toLowerCase())));
      const rawNo = video.lectureNo !== undefined ? video.lectureNo : (video.position !== undefined && video.position !== 999 ? video.position : null);
      const lectureNo = rawNo !== null ? rawNo : (index + 1);
      const lectureNoStr = Number(lectureNo) === 999 ? 'BCA STORE' : `Lecture ${String(lectureNo).padStart(2, '0')}`;
      const viewsCount = video.views || 0;
      const viewsFormatted = viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}K` : viewsCount;
      const thumb = video.thumbnail || getYouTubeThumb(video.url || video.videoUrl || '');
      const activeClass = video.id === this.activeVideoId ? 'video-active' : '';

      const badgeHtml = `
        <div class="video-badge-container">
          <span class="badge-item badge-premium">Premium</span>
          ${hasNotes ? '<span class="badge-item badge-notes">Notes</span>' : ''}
          ${isCompleted ? '<span class="badge-item badge-completed">Completed</span>' : ''}
        </div>
      `;

      return `
        <div class="content-card video-card ${activeClass}" data-id="${video.id}" data-url="${video.url || video.videoUrl}" onclick="window.elitePageManager.openVideoPlayer('${video.id}')">
          <div class="content-thumbnail">
            <img class="video-card-thumb" src="${thumb}" onerror="this.onerror=null; const id = getYouTubeId('${video.url || video.videoUrl}'); if(id) this.src='https://img.youtube.com/vi/' + id + '/hqdefault.jpg';" alt="${escapeHtml(video.title)}" loading="lazy">
            <div class="video-dark-overlay"></div>
            <div class="play-btn-circle">▶</div>
            <span class="video-duration" id="dur-text-${video.id}">${video.duration || '0:00'}</span>
            ${badgeHtml}
          </div>
          <div class="content-info">
            <div class="lecture-number">${lectureNoStr}</div>
            <h3 class="content-title">${escapeHtml(video.title || 'Untitled')}</h3>
            <p class="content-description">${escapeHtml(video.description || '')}</p>
            <div class="content-meta" style="margin-top: auto; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
              <span class="meta-item">👁️ ${viewsFormatted} Views</span>
              <span class="meta-item">❤️ ${video.likes || 0} Likes</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach premium previews
    this.attachPreviewHandlers();

    // Trigger lazy background duration fetching for videos with "0:00" duration
    this.lazyFetchVideoDurations();
  }

  async lazyFetchVideoDurations() {
    this.videosList.forEach(async (video) => {
      if (!video.duration || video.duration === '0:00') {
        const ytid = getYouTubeId(video.url || video.videoUrl || '');
        if (!ytid) return;
        
        try {
          const duration = await this.getYouTubeVideoDuration(ytid);
          if (duration && duration !== '0:00') {
            const durEl = document.getElementById(`dur-text-${video.id}`);
            if (durEl) {
              durEl.textContent = duration;
            }
            video.duration = duration;
            // Also update the cached copy in localStorage
            this.saveToCache('videos', this.videosList);
          }
        } catch (e) {
          console.warn(`Failed to lazy fetch duration for video ${video.id}:`, e);
        }
      }
    });
  }

  async getYouTubeVideoDuration(videoId) {
    const instances = [
      'https://yewtu.be',
      'https://invidious.flokinet.to',
      'https://inv.tux.pizza',
      'https://invidious.projectsegfau.lt'
    ];
    
    for (const instance of instances) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${instance}/api/v1/videos/${videoId}`, { signal: controller.signal });
        clearTimeout(id);
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.lengthSeconds) {
            const totalSeconds = Number(data.lengthSeconds);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            
            if (hrs > 0) {
              return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            } else {
              return `${mins}:${String(secs).padStart(2, '0')}`;
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch from Invidious instance ${instance}:`, e);
      }
    }

    // Try Piped API as fallback
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 3500);
      const response = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`, { signal: controller.signal });
      clearTimeout(id);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.duration) {
          const totalSeconds = Number(data.duration);
          const hrs = Math.floor(totalSeconds / 3600);
          const mins = Math.floor((totalSeconds % 3600) / 60);
          const secs = totalSeconds % 60;
          
          if (hrs > 0) {
            return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
          } else {
            return `${mins}:${String(secs).padStart(2, '0')}`;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch from Piped API:", e);
    }

    return null;
  }

  attachPreviewHandlers() {
    const cards = document.querySelectorAll('.video-card');
    cards.forEach(card => {
      const videoUrl = card.dataset.url;
      if (!videoUrl) return;
      
      let hoverTimeout = null;
      let previewIframe = null;

      card.addEventListener('mouseenter', () => {
        const ytid = getYouTubeId(videoUrl);
        if (!ytid) return;
        
        const thumbContainer = card.querySelector('.content-thumbnail');
        if (!thumbContainer) return;

        hoverTimeout = setTimeout(() => {
          if (thumbContainer.querySelector('.hover-preview-iframe')) return;

          previewIframe = document.createElement('iframe');
          previewIframe.src = `https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&start=15`;
          previewIframe.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
            pointer-events: none;
            z-index: 3;
            border-radius: 18px;
          `;
          previewIframe.className = 'hover-preview-iframe';
          thumbContainer.appendChild(previewIframe);
        }, 800);
      });

      card.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        if (previewIframe) {
          previewIframe.remove();
          previewIframe = null;
        }
        card.querySelectorAll('.hover-preview-iframe').forEach(el => el.remove());
      });

      let touchTimeout = null;
      card.addEventListener('touchstart', (e) => {
        const ytid = getYouTubeId(videoUrl);
        if (!ytid) return;

        const thumbContainer = card.querySelector('.content-thumbnail');
        if (!thumbContainer) return;

        touchTimeout = setTimeout(() => {
          if (navigator.vibrate) navigator.vibrate(50);
          if (thumbContainer.querySelector('.hover-preview-iframe')) return;

          previewIframe = document.createElement('iframe');
          previewIframe.src = `https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&start=15`;
          previewIframe.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            border: none;
            pointer-events: none;
            z-index: 3;
            border-radius: 18px;
          `;
          previewIframe.className = 'hover-preview-iframe';
          thumbContainer.appendChild(previewIframe);
        }, 1000);
      }, { passive: true });

      card.addEventListener('touchend', () => {
        clearTimeout(touchTimeout);
        setTimeout(() => {
          if (previewIframe) {
            previewIframe.remove();
            previewIframe = null;
          }
          card.querySelectorAll('.hover-preview-iframe').forEach(el => el.remove());
        }, 2000);
      }, { passive: true });
    });
  }

  /**
   * Display Notes
   */
  displayNotes(notes, isCache = false) {
    const container = document.getElementById('notes-grid');
    if (!container) return;

    const filtered = (notes || []).filter(n => n.url || n.pdfUrl || n.fileUrl);
    if (!isCache && JSON.stringify(filtered) === JSON.stringify(this.notesList)) {
      return;
    }

    this.notesList = filtered;
    if (!isCache) this.saveToCache('notes', notes);
    
    // Update notes count
    const countElement = document.getElementById('notes-count');
    if (countElement) {
      countElement.textContent = this.notesList.length + ' ' + (this.notesList.length === 1 ? 'note' : 'notes');
    }

    if (!notes || notes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No Notes Yet</div>
          <div class="empty-message">Study notes will be uploaded soon!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(note => `
      <div class="content-card" data-id="${note.id}" data-sync="true">
        <div class="content-thumbnail">
          <div class="note-icon">📄</div>
          <span class="note-pages">${note.pages || '?'} pages</span>
          <div class="sync-badge" style="position: absolute; top: 8px; right: 8px; background: rgba(34, 197, 94, 0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">✓ Live</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${escapeHtml(note.title || 'Untitled')}</h3>
          <p class="content-description">${escapeHtml(note.description || '')}</p>
          <div class="content-meta">
            <span>📥 ${note.downloads || 0} downloads</span>
            <span>📊 ${note.difficulty || 'Medium'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">📚 Study Material</div>
            <div class="content-actions">
              <a href="${escapeHtml(note.url || '#')}" target="_blank" class="action-btn" title="Download">
                📥 Download
              </a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Display DPP (Daily Practice Problems)
   */
  displayDPP(dpp, isCache = false) {
    const container = document.getElementById('dpp-grid');
    if (!container) return;

    const filtered = (dpp || []).filter(d => d.url || d.pdfUrl || d.questions);
    if (!isCache && JSON.stringify(filtered) === JSON.stringify(this.dppList)) {
      return;
    }

    this.dppList = filtered;
    if (!isCache) this.saveToCache('dpp', dpp);
    
    // Update DPP count
    const countElement = document.getElementById('dpp-count');
    if (countElement) {
      countElement.textContent = this.dppList.length + ' ' + (this.dppList.length === 1 ? 'set' : 'sets');
    }

    if (!dpp || dpp.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No DPP Sets Yet</div>
          <div class="empty-message">Practice problems will be available soon!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = dpp.map(item => `
      <div class="content-card" data-id="${item.id}" data-sync="true">
        <div class="content-thumbnail">
          <div class="dpp-icon">📋</div>
          <span class="dpp-questions">${item.questions || '?'} Q's</span>
          <div class="sync-badge" style="position: absolute; top: 8px; right: 8px; background: rgba(34, 197, 94, 0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">✓ Live</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${escapeHtml(item.title || 'Practice Set')}</h3>
          <p class="content-description">${escapeHtml(item.description || '')}</p>
          <div class="content-meta">
            <span>⏱️ ${item.attempts || 0} attempts</span>
            <span>🎯 ${item.difficulty || 'Medium'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">✏️ Practice Problems</div>
            <div class="content-actions">
              <a href="${escapeHtml(item.url || '#')}" target="_blank" class="action-btn" title="Attempt">
                ✏️ Attempt
              </a>
              ${item.solutions ? `<a href="${escapeHtml(item.solutions)}" target="_blank" class="action-btn" title="Solutions">
                ✅ Solutions
              </a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Display Live Classes
   */
  displayLiveClasses(liveClasses, isCache = false) {
    const container = document.getElementById('live-grid');
    if (!container) return;

    const filtered = liveClasses || [];
    // Only re-render if data has changed to prevent flashing
    if (this.liveClassesList && !isCache && JSON.stringify(filtered) === JSON.stringify(this.liveClassesList)) {
      return;
    }
    this.liveClassesList = filtered;
    if (!isCache) this.saveToCache('liveClasses', liveClasses);
    
    // Update live count
    const countElement = document.getElementById('live-count');
    if (countElement) {
      const count = filtered.length;
      countElement.textContent = count + ' ' + (count === 1 ? 'class' : 'classes');
    }

    if (!liveClasses || liveClasses.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">No Live Classes Yet</div>
          <div class="empty-message">Live sessions will be scheduled soon!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = liveClasses.map(live => `
      <div class="content-card" data-id="${live.id}" data-sync="true">
        <div class="content-thumbnail">
          <div class="live-icon">🔴</div>
          <span class="live-status" style="background: ${live.status === 'active' ? '#ef4444' : '#8b5cf6'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
            ${live.status === 'active' ? '🔴 LIVE' : '⏱️ ' + (live.schedule || 'Scheduled')}
          </span>
          <div class="sync-badge" style="position: absolute; top: 8px; right: 8px; background: rgba(34, 197, 94, 0.9); color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">✓ Live</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${escapeHtml(live.title || 'Live Session')}</h3>
          <p class="content-description">${escapeHtml(live.description || '')}</p>
          <div class="content-meta">
            <span>👥 ${live.attendees || 0} attending</span>
            <span>⏱️ ${live.duration || '60 mins'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">👨‍🏫 ${escapeHtml(live.instructor || 'Instructor')}</div>
            <div class="content-actions">
              ${live.zoomLink ? `<a href="${escapeHtml(live.zoomLink)}" target="_blank" class="action-btn" title="Join Zoom">
                📹 Join
              </a>` : ''}
              ${live.recordingUrl ? `<a href="${escapeHtml(live.recordingUrl)}" target="_blank" class="action-btn" title="Watch Recording">
                📺 Recording
              </a>` : ''}
              ${live.url ? `<a href="${escapeHtml(live.url)}" target="_blank" class="action-btn" title="Stream Link">
                🔗 Stream
              </a>` : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Open Video Player Modal
   */
  openVideoPlayer(videoId) {
    const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
    if (!video) return;

    this.activeVideoId = videoId;
    this.showVideoModal(video);
    this.incrementViews(videoId);

    // Watch Progress Auto-mark
    if (!this.watchedVideos.includes(videoId)) {
      this.watchedVideos.push(videoId);
      localStorage.setItem(`watched_videos_${this.batchId}`, JSON.stringify(this.watchedVideos));
      setTimeout(() => this.displayVideos(this.videosList), 500);
    } else {
      this.displayVideos(this.videosList);
    }
  }

  /**
   * Increment video views in Firebase
   */
  async incrementViews(videoId) {
    if (!database) return;
    try {
      const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
      if (video) {
        const newViews = (video.views || 0) + 1;
        const videoRef = ref(database, `elitePlus/${this.batchId}/sections/videos/${videoId}`);
        await update(videoRef, { views: newViews });
      }
    } catch (e) {
      console.warn('Failed to increment views:', e);
    }
  }

  /**
   * Increment video likes in Firebase
   */
  async likeVideo(videoId) {
    if (!database) return;
    try {
      const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
      if (video) {
        if (this.likedVideos && this.likedVideos.includes(videoId)) {
          return; // Already liked in this session
        }
        if (!this.likedVideos) this.likedVideos = [];
        this.likedVideos.push(videoId);

        const newLikes = (video.likes || 0) + 1;
        const videoRef = ref(database, `elitePlus/${this.batchId}/sections/videos/${videoId}`);
        await update(videoRef, { likes: newLikes });

        // Update active video list structure locally
        video.likes = newLikes;

        const likeCountEl = document.getElementById('eliteLikeCount');
        if (likeCountEl) {
          likeCountEl.textContent = newLikes;
        }
      }
    } catch (e) {
      console.warn('Failed to increment likes:', e);
    }
  }

  /**
   * Show Video Modal
   */
  showVideoModal(video) {
    let modal = document.getElementById('eliteVideoPlayerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'eliteVideoPlayerModal';
      modal.className = 'elite-video-modal-overlay';
      document.body.appendChild(modal);

      // Close modal on clicking overlay background
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeVideoModal();
        }
      });
    }

    const ytid = getYouTubeId(video.url || video.videoUrl || '');
    const embedUrl = ytid ? `https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0` : (video.url || video.videoUrl);

    modal.innerHTML = `
      <div class="elite-video-modal-wrapper">
        <button class="elite-video-modal-close" onclick="window.elitePageManager.closeVideoModal()">&times;</button>
        
        <div class="elite-video-modal-body">
          <!-- Left Column: Video Player & Info -->
          <div class="elite-video-left-pane">
            <div class="elite-video-player-container">
              <iframe 
                id="eliteIframePlayer"
                src="${embedUrl}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
              </iframe>
            </div>
            <div class="elite-video-details">
              <h2 id="eliteModalVideoTitle" class="elite-video-title">${escapeHtml(video.title)}</h2>
              <div class="elite-video-meta-row">
                <div class="elite-video-meta-left">
                  <span class="instructor-tag">👨‍🏫 ${escapeHtml(video.instructor || 'Instructor')}</span>
                  <span class="date-tag">⏱️ ${new Date(video.uploadDate || video.timestamp || Date.now()).toLocaleDateString()}</span>
                </div>
                <div class="elite-video-meta-right">
                  <span class="views-tag">👁️ <span id="eliteViewCount">${video.views || 0}</span> Views</span>
                  <button class="like-btn" onclick="window.elitePageManager.likeVideo('${video.id}')">❤️ <span id="eliteLikeCount">${video.likes || 0}</span></button>
                </div>
              </div>
              <div class="elite-video-description-box">
                <p id="eliteModalVideoDesc" class="elite-video-desc">${escapeHtml(video.description || 'No description available for this lecture.')}</p>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Playlist & Materials Sidebar -->
          <div class="elite-video-right-pane">
            <div class="elite-modal-tabs-header">
              <button class="elite-modal-tab-btn active" data-modal-tab="playlist" onclick="window.elitePageManager.switchModalTab('playlist')">🎥 Playlist</button>
              <button class="elite-modal-tab-btn" data-modal-tab="notes" onclick="window.elitePageManager.switchModalTab('notes')">📄 Notes</button>
              <button class="elite-modal-tab-btn" data-modal-tab="dpp" onclick="window.elitePageManager.switchModalTab('dpp')">📋 DPP</button>
            </div>
            <div class="elite-modal-tab-content active" id="modal-tab-playlist">
              ${this.renderPlaylist()}
            </div>
            <div class="elite-modal-tab-content" id="modal-tab-notes">
              ${this.renderNotes()}
            </div>
            <div class="elite-modal-tab-content" id="modal-tab-dpp">
              ${this.renderDPP()}
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close Video Modal
   */
  closeVideoModal() {
    const modal = document.getElementById('eliteVideoPlayerModal');
    if (modal) {
      modal.classList.remove('active');
      const iframe = document.getElementById('eliteIframePlayer');
      if (iframe) iframe.src = '';
    }
    document.body.style.overflow = '';
  }

  /**
   * Update active video when selected from playlist sidebar
   */
  updateActiveVideo(video) {
    const ytid = getYouTubeId(video.url || video.videoUrl || '');
    const embedUrl = ytid ? `https://www.youtube-nocookie.com/embed/${ytid}?autoplay=1&rel=0` : (video.url || video.videoUrl);

    const iframe = document.getElementById('eliteIframePlayer');
    if (iframe) iframe.src = embedUrl;

    const titleEl = document.getElementById('eliteModalVideoTitle');
    if (titleEl) titleEl.textContent = video.title;

    const descEl = document.getElementById('eliteModalVideoDesc');
    if (descEl) descEl.textContent = video.description || 'No description available for this lecture.';

    const viewCountEl = document.getElementById('eliteViewCount');
    if (viewCountEl) viewCountEl.textContent = video.views || 0;

    const likeCountEl = document.getElementById('eliteLikeCount');
    if (likeCountEl) likeCountEl.textContent = video.likes || 0;

    // Refresh playlist sidebar rendering to highlight active item
    const playlistContent = document.getElementById('modal-tab-playlist');
    if (playlistContent) {
      playlistContent.innerHTML = this.renderPlaylist();
    }

    this.incrementViews(video.id);
  }

  /**
   * Play video from sidebar playlist
   */
  playVideoFromPlaylist(videoId) {
    const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
    if (!video) return;
    this.activeVideoId = videoId;
    this.updateActiveVideo(video);
  }

  /**
   * Switch Sidebar tabs in modal
   */
  switchModalTab(tabName) {
    const tabs = document.querySelectorAll('.elite-modal-tab-btn');
    tabs.forEach(btn => {
      if (btn.getAttribute('data-modal-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const panels = document.querySelectorAll('.elite-modal-tab-content');
    panels.forEach(panel => {
      if (panel.id === `modal-tab-${tabName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });
  }

  /**
   * Render Playlist sidebar
   */
  renderPlaylist() {
    if (!this.videosList || this.videosList.length === 0) {
      return '<div class="empty-tab-state">🎥 No lectures in this batch.</div>';
    }
    return this.videosList.map(v => {
      const isActive = v.id === this.activeVideoId;
      const thumb = v.thumbnail || getYouTubeThumb(v.url || v.videoUrl);
      return `
        <div class="elite-playlist-item ${isActive ? 'active' : ''}" onclick="window.elitePageManager.playVideoFromPlaylist('${v.id}')">
          <div class="playlist-item-thumb">
            <img src="${thumb}" alt="${escapeHtml(v.title)}" loading="lazy" decoding="async">
            <span class="playlist-item-duration">${escapeHtml(v.duration || '0:00')}</span>
          </div>
          <div class="playlist-item-info">
            <div class="playlist-item-title">${escapeHtml(v.title)}</div>
            <div class="playlist-item-instructor">👨‍🏫 ${escapeHtml(v.instructor || 'Instructor')}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Notes sidebar
   */
  renderNotes() {
    if (!this.notesList || this.notesList.length === 0) {
      return '<div class="empty-tab-state">📄 No study notes uploaded yet.</div>';
    }
    return this.notesList.map(n => `
      <div class="elite-resource-item">
        <div class="resource-icon">📄</div>
        <div class="resource-info">
          <div class="resource-title">${escapeHtml(n.title)}</div>
          <div class="resource-meta">📚 ${n.pages || '?'} pages | Difficulty: ${n.difficulty || 'Medium'}</div>
        </div>
        <a href="${escapeHtml(n.url)}" target="_blank" class="resource-download-btn">📥 Download</a>
      </div>
    `).join('');
  }

  /**
   * Render DPP sidebar
   */
  renderDPP() {
    if (!this.dppList || this.dppList.length === 0) {
      return '<div class="empty-tab-state">📋 No DPP sheets available.</div>';
    }
    return this.dppList.map(d => `
      <div class="elite-resource-item">
        <div class="resource-icon">📋</div>
        <div class="resource-info">
          <div class="resource-title">${escapeHtml(d.title)}</div>
          <div class="resource-meta">🎯 ${d.questions || '?'} Qs | Difficulty: ${d.difficulty || 'Medium'}</div>
        </div>
        <div class="resource-actions-group">
          <a href="${escapeHtml(d.url)}" target="_blank" class="resource-attempt-btn">✏️ Attempt</a>
          ${d.solutions ? `<a href="${escapeHtml(d.solutions)}" target="_blank" class="resource-solutions-btn">✅ Solutions</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * Cleanup - Unsubscribe from all listeners
   */
  destroy() {
    console.log(`🧹 Cleaning up Elite Page Manager listeners...`);
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners = [];
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Get batch ID from HTML element or body element
  const batchId = document.documentElement.getAttribute('data-batch-id') || 
                  document.body.getAttribute('data-batch-id') || 
                  'c-programming';
  
  console.log(`🚀 Elite Plus page initializing for batch: ${batchId}`);
  
  window.elitePageManager = new ElitePageManager(batchId);
  
  console.log(`✅ Elite Plus page loaded for batch: ${batchId}`);
});

// ==================== CLEANUP ====================
window.addEventListener('beforeunload', () => {
  if (window.elitePageManager) {
    window.elitePageManager.destroy();
  }
});

// ==================== EXPORTS ====================
export { ElitePageManager };
