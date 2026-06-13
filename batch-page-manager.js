// Firebase Batch Pages - Real-time Data Fetching & Display
// Manages all batch resources with real-time synchronization

import { 
  BatchDataManager, 
  BATCH_LIST, 
  formatDate, 
  formatFileSize,
  database
} from './firebase-batch-config.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

function getYouTubeId(url) {
  if (!url) return null;
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const m = url.match(reg);
  return m ? m[1] : null;
}

function getYouTubeThumb(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60';
}

class BatchPageManager {
  constructor(batchId) {
    this.batchId = batchId;
    this.batch = {
      name: 'Loading...',
      description: 'Loading details from database...',
      icon: '🎓',
      color: '#3b82f6'
    };
    this.currentTab = 'videos';
    this.listeners = [];
    this.videosList = [];
    this.notesList = [];
    this.dppList = [];
    this.activeVideoId = null;
    this.watchedVideos = JSON.parse(localStorage.getItem(`watched_videos_${batchId}`) || '[]');
    this.init();
  }

  init() {
    // Sync with real-time batches_config
    if (database) {
      const configRef = ref(database, `batches/${this.batchId}`);
      onValue(configRef, (snapshot) => {
        const dbBatch = snapshot.val();
        if (dbBatch) {
          this.batch = {
            id: this.batchId,
            ...dbBatch
          };
          this.setupPageHeader();
          
          if (dbBatch.color) {
            document.documentElement.style.setProperty('--accent-color', dbBatch.color);
            // Also update any theme-color or glow styles dynamically
            const heroHeader = document.querySelector('.batch-hero-header');
            if (heroHeader) {
              heroHeader.style.background = `radial-gradient(circle at 50% 0%, ${dbBatch.color}25 0%, transparent 60%)`;
            }
          }
        }
      });
    }

    this.setupPageHeader();
    this.setupTabs();
    this.setupSortControls();
    
    // Show skeleton loaders on init
    this.showSkeletons('videos-grid');
    this.showSkeletons('notes-grid');
    this.showSkeletons('dpp-grid');
    this.showSkeletons('pdfs-grid');

    this.loadAllResources();
  }

  setupPageHeader() {
    const header = document.querySelector('.batch-hero-header');
    if (!header) return;

    const headerContent = document.querySelector('.batch-hero-content');
    headerContent.innerHTML = `
      <div class="batch-hero-text">
        <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
          <h1 style="margin: 0;">${this.batch.name}</h1>
          <button onclick="window.shareBatchOnWhatsApp('${this.batch.name.replace(/'/g, "\\'")}', '${this.batch.description.replace(/'/g, "\\'")}', 'elite-batches.html?batch=${this.batchId}')" style="background: #25d366; color: white; border: none; border-radius: 20px; padding: 6px 14px; font-size: 0.8rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(37,211,102,0.3); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width: 14px; height: 14px; fill: white;"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L3 496l131-34.3c32.7 17.8 69.3 27.2 106.6 27.2 122.4 0 222-99.6 222-222 0-59.3-23.2-115-65.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-77.9 20.4 20.8-76-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
            <span>Share Batch</span>
          </button>
        </div>
        <p style="margin-top: 8px;">${this.batch.description}</p>
        <div class="batch-hero-stats" style="display: flex; gap: 24px; flex-wrap: wrap; margin-top: 20px;">
          <div class="stat-item" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; backdrop-filter: blur(10px);">
            <span style="font-size: 1.5rem;">🎥</span>
            <div>
              <span class="stat-number" id="totalVideos" style="font-weight: 800; font-size: 1.2rem; display: block;">0</span>
              <span class="stat-label" style="font-size: 0.8rem; opacity: 0.8;">Lectures</span>
            </div>
          </div>
          <div class="stat-item" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; backdrop-filter: blur(10px);">
            <span style="font-size: 1.5rem;">📄</span>
            <div>
              <span class="stat-number" id="totalNotes" style="font-weight: 800; font-size: 1.2rem; display: block;">0</span>
              <span class="stat-label" style="font-size: 0.8rem; opacity: 0.8;">Notes</span>
            </div>
          </div>
          <div class="stat-item" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; backdrop-filter: blur(10px);">
            <span style="font-size: 1.5rem;">⏱️</span>
            <div>
              <span class="stat-number" id="totalDuration" style="font-weight: 800; font-size: 1.2rem; display: block;">0 Hours</span>
              <span class="stat-label" style="font-size: 0.8rem; opacity: 0.8;">Total Duration</span>
            </div>
          </div>
          <div class="stat-item" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 12px; backdrop-filter: blur(10px);">
            <span style="font-size: 1.5rem;">📋</span>
            <div>
              <span class="stat-number" id="totalDPP" style="font-weight: 800; font-size: 1.2rem; display: block;">0</span>
              <span class="stat-label" style="font-size: 0.8rem; opacity: 0.8;">DPP Sets</span>
            </div>
          </div>
        </div>
      </div>
      <div class="batch-hero-icon" style="font-size: 5rem; animation: float 6s ease-in-out infinite;">${this.batch.icon}</div>
    `;
  }

  setupTabs() {
    const tabsNav = document.querySelector('.batch-tabs-nav');
    if (!tabsNav) return;

    const tabs = [
      { id: 'videos', label: '🎥 Videos' },
      { id: 'notes', label: '📄 Notes' },
      { id: 'dpp', label: '📋 DPP' },
      { id: 'pdfs', label: '📚 Resources' }
    ];

    tabsNav.innerHTML = '';
    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${tab.id === 'videos' ? 'active' : ''}`;
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.onclick = (e) => this.switchTab(tab.id, e);
      tabsNav.appendChild(btn);
    });
  }

  switchTab(tabId, event) {
    this.currentTab = tabId;

    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (event && event.target) {
      event.target.classList.add('active');
    } else {
      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.dataset.tab === tabId);
      if (activeBtn) activeBtn.classList.add('active');
    }

    // Update section visibility
    document.querySelectorAll('.section-container').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    let activeSectionId = `${tabId}-section`;
    if (tabId === 'pdfs') {
      activeSectionId = 'pdfs-section';
    }
    const activeSection = document.getElementById(activeSectionId);
    if (activeSection) {
      activeSection.classList.add('active');
      activeSection.style.display = 'block';
    }
  }

  setupSortControls() {
    const sortBtn = document.querySelector('.sort-btn');
    const filterBtn = document.querySelector('.filter-btn');
    const gridToggleBtn = document.querySelector('.grid-toggle-btn');

    if (sortBtn) {
      sortBtn.addEventListener('click', () => this.showSortMenu());
    }
    if (filterBtn) {
      filterBtn.addEventListener('click', () => this.showFilterMenu());
    }
    if (gridToggleBtn) {
      gridToggleBtn.addEventListener('click', () => this.toggleGridView());
    }
  }

  loadAllResources() {
    // Load Videos
    const unsubscribeVideos = BatchDataManager.listenToVideos(
      this.batchId,
      (videos) => this.displayVideos(videos)
    );
    this.listeners.push(unsubscribeVideos);

    // Load Notes
    const unsubscribeNotes = BatchDataManager.listenToNotes(
      this.batchId,
      (notes) => this.displayNotes(notes)
    );
    this.listeners.push(unsubscribeNotes);

    // Load DPP
    const unsubscribeDPP = BatchDataManager.listenToDPP(
      this.batchId,
      (dpp) => this.displayDPP(dpp)
    );
    this.listeners.push(unsubscribeDPP);

    // Load Live Classes
    const unsubscribeLiveClasses = BatchDataManager.listenToLiveClasses(
      this.batchId,
      (classes) => this.displayLiveClasses(classes)
    );
    this.listeners.push(unsubscribeLiveClasses);

    // Load PDFs
    const unsubscribePDFs = BatchDataManager.listenToPDFs(
      this.batchId,
      (pdfs) => this.displayPDFs(pdfs)
    );
    this.listeners.push(unsubscribePDFs);

    // Load Stats
    const unsubscribeStats = BatchDataManager.listenToStats(
      this.batchId,
      (stats) => this.updateStats(stats)
    );
    this.listeners.push(unsubscribeStats);
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

  displayVideos(videos) {
    const container = document.getElementById('videos-grid');
    if (!container) return;

    this.videosList = videos || [];

    // Update count
    const countEl = document.getElementById('videos-count');
    if (countEl) countEl.textContent = this.videosList.length + ' ' + (this.videosList.length === 1 ? 'lecture' : 'lectures');

    // Update stats header dynamically
    const totalVideosEl = document.getElementById('totalVideos');
    if (totalVideosEl) totalVideosEl.textContent = this.videosList.length;

    const totalHours = this.calculateTotalDurationHours(this.videosList);
    const totalDurationEl = document.getElementById('totalDuration');
    if (totalDurationEl) totalDurationEl.textContent = `${totalHours} Hours`;

    if (this.videosList.length === 0) {
      container.innerHTML = this.getEmptyState('😕', 'No videos uploaded yet', 'Lectures will appear here soon');
      return;
    }

    container.innerHTML = this.videosList.map((video, index) => {
      const isCompleted = this.watchedVideos.includes(video.id);
      const isPremium = this.batchId === 'dsa' || this.batchId === 'react-js' || video.isPremium || video.type === 'premium';
      const hasNotes = video.notesUrl || video.hasNotes || (this.notesList && this.notesList.some(n => n.title.toLowerCase().includes(video.title.toLowerCase())));
      const lectureNo = video.lectureNo || video.position || (index + 1);
      const lectureNoStr = Number(lectureNo) === 999 ? 'BCA STORE' : `Lecture ${String(lectureNo).padStart(2, '0')}`;
      const viewsCount = video.views || 0;
      const viewsFormatted = viewsCount >= 1000 ? `${(viewsCount / 1000).toFixed(1)}K` : viewsCount;
      const thumb = video.thumbnail || getYouTubeThumb(video.url || video.videoUrl || '');
      const activeClass = video.id === this.activeVideoId ? 'video-active' : '';

      const badgeHtml = `
        <div class="video-badge-container">
          <span class="badge-item ${isPremium ? 'badge-premium' : 'badge-free'}">${isPremium ? 'Premium' : 'Free'}</span>
          ${hasNotes ? '<span class="badge-item badge-notes">Notes</span>' : ''}
          ${isCompleted ? '<span class="badge-item badge-completed">Completed</span>' : ''}
        </div>
      `;

      return `
        <div class="content-card video-card ${activeClass}" data-id="${video.id}" data-url="${video.url || video.videoUrl}" onclick="window.batchPageManager.openVideoPlayer('${video.id}')">
          <div class="content-thumbnail">
            <img class="video-card-thumb" src="${thumb}" onerror="this.onerror=null; const id = getYouTubeId('${video.url || video.videoUrl}'); if(id) this.src='https://img.youtube.com/vi/' + id + '/hqdefault.jpg';" alt="${this.escapeHtml(video.title)}" loading="lazy">
            <div class="video-dark-overlay"></div>
            <div class="play-btn-circle">▶</div>
            <span class="video-duration">${video.duration || '0:00'}</span>
            ${badgeHtml}
          </div>
          <div class="content-info">
            <div class="lecture-number">${lectureNoStr}</div>
            <h3 class="content-title">${this.escapeHtml(video.title)}</h3>
            <p class="content-description">${this.escapeHtml(video.description || '')}</p>
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
  }

  displayNotes(notes) {
    const container = document.getElementById('notes-grid');
    if (!container) return;

    this.notesList = notes || [];

    // Update count
    const countEl = document.getElementById('notes-count');
    if (countEl) countEl.textContent = this.notesList.length + ' ' + (this.notesList.length === 1 ? 'note' : 'notes');

    const totalNotesEl = document.getElementById('totalNotes');
    if (totalNotesEl) totalNotesEl.textContent = this.notesList.length;

    if (this.notesList.length === 0) {
      container.innerHTML = this.getEmptyState('📄', 'No Notes Yet', 'Study notes will be added soon');
      return;
    }

    container.innerHTML = this.notesList.map(note => `
      <div class="content-card" onclick="window.open('${note.url}', '_blank')">
        <div class="content-thumbnail">
          <span class="thumbnail-icon">📄</span>
          <div class="play-button">📥</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${this.escapeHtml(note.title)}</h3>
          <p class="content-description">${this.escapeHtml(note.description || '')}</p>
          <div class="content-meta">
            <span class="meta-item">📑 ${note.pages || '?'} pages</span>
            <span class="meta-item">📥 ${note.downloads || 0} downloads</span>
            <span class="meta-badge difficulty-${note.difficulty || 'medium'}">${note.difficulty || 'medium'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">
              <div class="instructor-avatar">📄</div>
              <span>${formatDate(note.uploadDate)}</span>
            </div>
            <div class="content-actions">
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.toggleFavorite()">❤️</button>
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.shareContent()">📤</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  displayDPP(dpp) {
    const container = document.getElementById('dpp-grid');
    if (!container) return;

    this.dppList = dpp || [];

    // Update count
    const countEl = document.getElementById('dpp-count');
    if (countEl) countEl.textContent = this.dppList.length + ' ' + (this.dppList.length === 1 ? 'set' : 'sets');

    const totalDPPEl = document.getElementById('totalDPP');
    if (totalDPPEl) totalDPPEl.textContent = this.dppList.length;

    if (this.dppList.length === 0) {
      container.innerHTML = this.getEmptyState('📋', 'No DPP Yet', 'Daily Practice Problems coming soon');
      return;
    }

    container.innerHTML = this.dppList.map(item => `
      <div class="content-card" onclick="window.open('${item.url}', '_blank')">
        <div class="content-thumbnail">
          <span class="thumbnail-icon">📋</span>
          <div class="play-button">📥</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${this.escapeHtml(item.title)}</h3>
          <p class="content-description">${this.escapeHtml(item.description || '')}</p>
          <div class="content-meta">
            <span class="meta-item">❓ ${item.questions || '?'} questions</span>
            <span class="meta-item">🔧 ${item.attempts || 0} attempts</span>
            <span class="meta-badge difficulty-${item.difficulty || 'hard'}">${item.difficulty || 'hard'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">
              <div class="instructor-avatar">📋</div>
              <span>${formatDate(item.uploadDate)}</span>
            </div>
            <div class="content-actions">
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.toggleFavorite()">❤️</button>
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.downloadContent()">📥</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  openVideoPlayer(videoId) {
    const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
    if (!video) return;

    this.activeVideoId = videoId;
    this.showVideoModal(video);
    this.incrementViews(videoId);

    // Dynamic Watch Progress Auto-mark
    if (!this.watchedVideos.includes(videoId)) {
      this.watchedVideos.push(videoId);
      localStorage.setItem(`watched_videos_${this.batchId}`, JSON.stringify(this.watchedVideos));
      setTimeout(() => this.displayVideos(this.videosList), 500);
    } else {
      this.displayVideos(this.videosList);
    }
  }

  closeVideoModal() {
    const modal = document.getElementById('eliteVideoPlayerModal');
    if (modal) {
      modal.classList.remove('active');
      const iframe = document.getElementById('eliteIframePlayer');
      if (iframe) iframe.src = '';
    }
    document.body.style.overflow = '';
  }

  showVideoModal(video) {
    let modal = document.getElementById('eliteVideoPlayerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'eliteVideoPlayerModal';
      modal.className = 'elite-video-modal-overlay';
      document.body.appendChild(modal);

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
        <button class="elite-video-modal-close" onclick="window.batchPageManager.closeVideoModal()">&times;</button>
        
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
              <h2 id="eliteModalVideoTitle" class="elite-video-title">${this.escapeHtml(video.title)}</h2>
              <div class="elite-video-meta-row">
                <div class="elite-video-meta-left">
                  <span class="instructor-tag">👨‍🏫 ${this.escapeHtml(video.instructor || 'Instructor')}</span>
                  <span class="date-tag">⏱️ ${video.duration || '0:00'}</span>
                </div>
                <div class="elite-video-meta-right">
                  <span class="views-tag">👁️ <span id="eliteViewCount">${video.views || 0}</span> Views</span>
                  <button class="like-btn" onclick="window.batchPageManager.likeVideo('${video.id}')">❤️ <span id="eliteLikeCount">${video.likes || 0}</span></button>
                </div>
              </div>
              <div class="elite-video-description-box">
                <p id="eliteModalVideoDesc" class="elite-video-desc">${this.escapeHtml(video.description || 'No description available for this lecture.')}</p>
              </div>
            </div>
          </div>
          
          <!-- Right Column: Playlist & Materials Sidebar -->
          <div class="elite-video-right-pane">
            <div class="elite-modal-tabs-header">
              <button class="elite-modal-tab-btn active" data-modal-tab="playlist" onclick="window.batchPageManager.switchModalTab('playlist')">🎥 Playlist</button>
              <button class="elite-modal-tab-btn" data-modal-tab="notes" onclick="window.batchPageManager.switchModalTab('notes')">📄 Notes</button>
              <button class="elite-modal-tab-btn" data-modal-tab="dpp" onclick="window.batchPageManager.switchModalTab('dpp')">📋 DPP</button>
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

  playVideoFromPlaylist(videoId) {
    const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
    if (!video) return;
    this.activeVideoId = videoId;
    this.updateActiveVideo(video);
  }

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

    const playlistContent = document.getElementById('modal-tab-playlist');
    if (playlistContent) {
      playlistContent.innerHTML = this.renderPlaylist();
    }

    this.incrementViews(video.id);
  }

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

  renderPlaylist() {
    if (!this.videosList || this.videosList.length === 0) {
      return '<div class="empty-tab-state">🎥 No lectures in this batch.</div>';
    }
    return this.videosList.map(v => {
      const isActive = v.id === this.activeVideoId;
      const thumb = v.thumbnail || getYouTubeThumb(v.url || v.videoUrl);
      return `
        <div class="elite-playlist-item ${isActive ? 'active' : ''}" onclick="window.batchPageManager.playVideoFromPlaylist('${v.id}')">
          <div class="playlist-item-thumb">
            <img src="${thumb}" alt="${this.escapeHtml(v.title)}" loading="lazy" decoding="async">
            <span class="playlist-item-duration">${this.escapeHtml(v.duration || '0:00')}</span>
          </div>
          <div class="playlist-item-info">
            <div class="playlist-item-title">${this.escapeHtml(v.title)}</div>
            <div class="playlist-item-instructor">👨‍🏫 ${this.escapeHtml(v.instructor || 'Instructor')}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderNotes() {
    if (!this.notesList || this.notesList.length === 0) {
      return '<div class="empty-tab-state">📄 No study notes uploaded yet.</div>';
    }
    return this.notesList.map(n => `
      <div class="elite-resource-item">
        <div class="resource-icon">📄</div>
        <div class="resource-info">
          <div class="resource-title">${this.escapeHtml(n.title)}</div>
          <div class="resource-meta">📚 ${n.pages || '?'} pages | Difficulty: ${n.difficulty || 'Medium'}</div>
        </div>
        <a href="${this.escapeHtml(n.url)}" target="_blank" class="resource-download-btn">📥 Download</a>
      </div>
    `).join('');
  }

  renderDPP() {
    if (!this.dppList || this.dppList.length === 0) {
      return '<div class="empty-tab-state">📋 No DPP sheets available.</div>';
    }
    return this.dppList.map(d => `
      <div class="elite-resource-item">
        <div class="resource-icon">📋</div>
        <div class="resource-info">
          <div class="resource-title">${this.escapeHtml(d.title)}</div>
          <div class="resource-meta">🎯 ${d.questions || '?'} Qs | Difficulty: ${d.difficulty || 'Medium'}</div>
        </div>
        <div class="resource-actions-group">
          <a href="${this.escapeHtml(d.url)}" target="_blank" class="resource-attempt-btn">✏️ Attempt</a>
          ${d.solutions ? `<a href="${this.escapeHtml(d.solutions)}" target="_blank" class="resource-solutions-btn">✅ Solutions</a>` : ''}
        </div>
      </div>
    `).join('');
  }

  async incrementViews(videoId) {
    try {
      const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
      if (video) {
        video.views = (video.views || 0) + 1;
      }
    } catch (e) {
      console.warn(e);
    }
  }

  async likeVideo(videoId) {
    try {
      const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
      if (video) {
        const newLikes = (video.likes || 0) + 1;
        video.likes = newLikes;
        const likeCountEl = document.getElementById('eliteLikeCount');
        if (likeCountEl) likeCountEl.textContent = newLikes;
        this.displayVideos(this.videosList);
      }
    } catch (e) {
      console.warn(e);
    }
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

  displayLiveClasses(classes) {
    const container = document.getElementById('live-grid');
    if (!container) return;

    // Update count
    const countEl = document.getElementById('live-count');
    if (countEl) countEl.textContent = classes.length + ' ' + (classes.length === 1 ? 'class' : 'classes');

    if (classes.length === 0) {
      container.innerHTML = this.getEmptyState('🔴', 'No Live Classes Scheduled', 'Check back soon for live sessions');
      return;
    }

    container.innerHTML = classes.map(cls => `
      <div class="content-card ${cls.status === 'ongoing' ? 'live-active' : ''}">
        <div class="content-thumbnail" style="position: relative;">
          <span class="thumbnail-icon">🔴</span>
          ${cls.status === 'ongoing' ? '<span style="position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; animation: pulse 2s infinite;">LIVE</span>' : ''}
        </div>
        <div class="content-info">
          <h3 class="content-title">${this.escapeHtml(cls.title)}</h3>
          <p class="content-description">${this.escapeHtml(cls.description || '')}</p>
          <div class="content-meta">
            <span class="meta-item">⏱️ ${cls.duration || '90 mins'}</span>
            <span class="meta-item">👥 ${cls.attendees || 0} attending</span>
            <span class="meta-badge">${cls.status}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">
              <div class="instructor-avatar">${this.getInitials(cls.instructor || 'BCA')}</div>
              <span>${cls.instructor || 'BCA Store'}</span>
            </div>
            <div class="content-actions">
              ${cls.status === 'ongoing' ? `
                <button class="action-btn" onclick="event.stopPropagation(); window.open('${cls.zoomLink}', '_blank')" style="color: #ef4444;">🔗</button>
              ` : `
                <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.toggleReminder()">🔔</button>
              `}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  displayPDFs(pdfs) {
    const container = document.getElementById('pdfs-grid');
    if (!container) return;

    if (pdfs.length === 0) {
      container.innerHTML = this.getEmptyState('📚', 'No PDFs Yet', 'Reference materials coming soon');
      return;
    }

    container.innerHTML = pdfs.map(pdf => `
      <div class="content-card" onclick="window.open('${pdf.url}', '_blank')">
        <div class="content-thumbnail">
          <span class="thumbnail-icon">📚</span>
          <div class="play-button">📥</div>
        </div>
        <div class="content-info">
          <h3 class="content-title">${this.escapeHtml(pdf.title)}</h3>
          <p class="content-description">${this.escapeHtml(pdf.description || '')}</p>
          <div class="content-meta">
            <span class="meta-item">📑 ${pdf.pages || '?'} pages</span>
            <span class="meta-item">📥 ${pdf.downloads || 0} downloads</span>
            <span class="meta-badge">${pdf.type || 'material'}</span>
          </div>
          <div class="content-footer">
            <div class="content-instructor">
              <div class="instructor-avatar">📚</div>
              <span>${formatDate(pdf.uploadDate)}</span>
            </div>
            <div class="content-actions">
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.toggleFavorite()">❤️</button>
              <button class="action-btn" onclick="event.stopPropagation(); window.batchPageManager.shareContent()">📤</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateStats(stats) {
    document.getElementById('totalVideos').textContent = stats.totalVideos || 0;
    document.getElementById('totalNotes').textContent = stats.totalNotes || 0;
    document.getElementById('totalDPP').textContent = stats.totalDPP || 0;
    document.getElementById('totalClasses').textContent = stats.totalLiveClasses || 0;
  }

  getEmptyState(icon, title, description) {
    return `
      <div style="grid-column: 1/-1;">
        <div class="empty-state">
          <div class="empty-icon">${icon}</div>
          <h3 class="empty-title">${title}</h3>
          <p class="empty-description">${description}</p>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  showSortMenu() {
    alert('Sort options: By Date, By Views, By Rating, By Difficulty');
  }

  showFilterMenu() {
    alert('Filter options: By Difficulty, By Instructor, By Date Range');
  }

  toggleGridView() {
    const grid = document.querySelector('.content-grid');
    grid.classList.toggle('list-view');
  }

  toggleFavorite() {
    alert('Added to favorites!');
  }

  shareContent() {
    window.shareBatchOnWhatsApp(
      this.batch.name,
      this.batch.description,
      `elite-batches.html?batch=${this.batchId}`
    );
  }

  downloadContent() {
    alert('Downloading...');
  }

  toggleReminder() {
    alert('Reminder set! You\'ll be notified before the class starts.');
  }

  destroy() {
    this.listeners.forEach(unsubscribe => unsubscribe());
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const batchId = document.body.dataset.batchId || 'c-programming';
  window.batchPageManager = new BatchPageManager(batchId);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.batchPageManager) {
    window.batchPageManager.destroy();
  }
});
