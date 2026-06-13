// ============================================================
// ELITE PLUS - REAL-TIME LOADER
// ============================================================
// Loads Elite Plus batches with real-time Firebase sync
// ============================================================

import { EliteDataManager, ELITE_BATCHES, escapeHtml } from './elite-firebase-config.js';

// ==================== INITIALIZATION ====================
let searchQuery = '';
let selectedLevel = 'all';

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Elite Plus Real-Time Loader Initializing...');
  if (typeof window.initDarkMode === 'function') window.initDarkMode();
  if (typeof window.initNavbar === 'function') window.initNavbar();
  loadElitePlusBatches();
  setupRealTimeListeners();
  setupFilters();

  // Handle dynamic batches update
  document.addEventListener('eliteBatchesUpdated', () => {
    console.log('🔄 Dynamic batches list updated, re-rendering grid...');
    loadElitePlusBatches();
  });
});

// ==================== FILTERING HANDLERS ====================
function setupFilters() {
  const searchInput = document.getElementById('batchSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      loadElitePlusBatches();
    });
  }

  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedLevel = e.target.getAttribute('data-level');
      loadElitePlusBatches();
    });
  });
}

// ==================== LOAD ELITE PLUS BATCHES ====================
function loadElitePlusBatches() {
  const grid = document.getElementById('eliteBatchesGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // Determine page category
  let pageCategory = 'programming'; // fallback
  if (document.body.classList.contains('placement-page') || window.location.pathname.includes('placement')) {
    pageCategory = 'placement';
  } else if (document.body.classList.contains('programming-page') || window.location.pathname.includes('programming')) {
    pageCategory = 'programming';
  }

  const filteredBatches = Object.entries(ELITE_BATCHES).filter(([batchId, batchData]) => {
    // Only display Elite+ batches
    if (batchData.isElitePlus !== true) return false;

    // 1. Filter by Page Category (Programming vs Placement)
    if (batchData.category !== pageCategory) return false;

    // 2. Filter by Search Query
    if (searchQuery) {
      const nameMatch = batchData.name.toLowerCase().includes(searchQuery);
      const subMatch = batchData.subtitle.toLowerCase().includes(searchQuery);
      const featureMatch = (batchData.features || []).some(f => f.toLowerCase().includes(searchQuery));
      if (!nameMatch && !subMatch && !featureMatch) return false;
    }

    // 3. Filter by Level
    if (selectedLevel !== 'all') {
      const levelStr = batchData.level || 'Premium';
      if (!levelStr.toLowerCase().includes(selectedLevel.toLowerCase())) return false;
    }

    return true;
  });

  if (filteredBatches.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <div style="font-size: 3.5rem; margin-bottom: 16px;">🔍</div>
        <h3>No matching batches found</h3>
        <p>Try searching for a different language, topic, or feature.</p>
      </div>
    `;
    const countPill = document.getElementById('eliteBatchCount');
    if (countPill) countPill.textContent = '0 Batches';
    return;
  }

  // Create batch cards
  filteredBatches.forEach(([batchId, batchData]) => {
    const card = createEliteBatchCard(batchId, batchData);
    grid.appendChild(card);
  });

  // Set batch count
  const countPill = document.getElementById('eliteBatchCount');
  if (countPill) {
    countPill.textContent = `${filteredBatches.length} Batches`;
  }

  console.log(`✅ Loaded ${filteredBatches.length} filtered Elite Plus batches`);
}

// ==================== GLOBAL ENROLLMENT HANDLER ====================
window.showEnrollmentSuccessPopup = function (batchName) {
  let existing = document.getElementById('enrollment-success-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'enrollment-success-popup';
  popup.style.cssText = `
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.4);
    border-radius: 16px;
    padding: 16px 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.2);
    z-index: 100000;
    color: #fff;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 0.95rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease, top 0.3s ease;
  `;

  popup.innerHTML = `
    <span style="font-size: 1.5rem;">🎉</span>
    <div>
      <div style="color: #a78bfa; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; font-weight: 800;">Congratulations</div>
      <div>Your batch <span style="color: #fbbf24;">${batchName}</span> is enrolled successfully!</div>
    </div>
  `;

  document.body.appendChild(popup);

  // Trigger reflow
  popup.offsetHeight;

  // Show
  popup.style.opacity = '1';
  popup.style.top = '32px';

  // Hide after 2 seconds
  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.top = '24px';
    setTimeout(() => {
      popup.remove();
    }, 300);
  }, 2000);
};

window.enrollInEliteBatch = function (batchId) {
  let enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
  if (!enrolled.includes(batchId)) {
    enrolled.push(batchId);
    localStorage.setItem('enrolledEliteBatches', JSON.stringify(enrolled));

    // Show premium congratulation popup
    if (typeof window.showEnrollmentSuccessPopup === 'function') {
      window.showEnrollmentSuccessPopup(ELITE_BATCHES[batchId].name);
    }

    loadElitePlusBatches(); // Rerender cards immediately!

    // Smooth futuristic auto-navigation so they can use it immediately without extra clicks or refreshes!
    setTimeout(() => {
      window.location.href = getBatchPageUrl(batchId);
    }, 850);
  }
};

// ==================== CREATE BATCH CARD ====================
function createEliteBatchCard(batchId, batchData) {
  const card = document.createElement('div');
  card.className = 'elite-batch-card';
  card.style.setProperty('--accent-glow', batchData.color || '#8b5cf6');

  card.innerHTML = window.generateUnifiedBatchCardHTML(batchId, batchData);

  // Load and update stats in real-time
  loadBatchStats(batchId);

  const batchPageUrl = getBatchPageUrl(batchId);

  card.addEventListener('click', (e) => {
    // Navigate to batch page if clicking card body (not footer link/share button directly)
    if (!e.target.closest('.view-batch-btn') && !e.target.closest('.batch-card-whatsapp-share')) {
      const currentEnrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
      if (currentEnrolled.includes(batchId)) {
        window.location.href = batchPageUrl;
      } else {
        if (typeof showToast === 'function') {
          showToast('🔒 Please enroll first to access this batch!', 'warning');
        }
      }
    }
  });

  return card;
}

// ==================== LOAD BATCH STATISTICS ====================
function loadBatchStats(batchId) {
  const statContainer = document.getElementById(`stats-${batchId}`);
  if (!statContainer) return;

  // 1. Try loading cached stats instantly (0ms UI render)
  const cachedStatsKey = `elite_stats_${batchId}`;
  const cachedStats = localStorage.getItem(cachedStatsKey);
  if (cachedStats) {
    try {
      const stats = JSON.parse(cachedStats);
      updateStatsDisplay(
        batchId,
        stats.totalVideos || 0,
        stats.totalNotes || 0,
        stats.totalDPP || 0,
        stats.totalLiveClasses || 0
      );
    } catch (e) {
      console.warn(`[Stats Cache] Failed to parse cache for ${batchId}:`, e);
    }
  }

  // 2. Attach a single, ultra-lightweight real-time listener to the pre-aggregated stats node
  EliteDataManager.getStats(batchId, (stats) => {
    const totalVideos = stats.totalVideos || 0;
    const totalNotes = stats.totalNotes || 0;
    const totalDPP = stats.totalDPP || 0;
    const totalLiveClasses = stats.totalLiveClasses || 0;

    // Cache the updated metrics to ensure next load is instant
    localStorage.setItem(cachedStatsKey, JSON.stringify({
      totalVideos,
      totalNotes,
      totalDPP,
      totalLiveClasses
    }));

    // Update display in real-time
    updateStatsDisplay(batchId, totalVideos, totalNotes, totalDPP, totalLiveClasses);
  });
}

function updateStatsDisplay(batchId, videos, notes, dpp, live) {
  const statContainer = document.getElementById(`stats-${batchId}`);
  if (!statContainer) return;

  statContainer.innerHTML = `
    <span class="stat-badge" title="Videos">📹 ${videos}</span>
    <span class="stat-badge" title="Notes">📄 ${notes}</span>
    <span class="stat-badge" title="DPP">📋 ${dpp}</span>
    <span class="stat-badge" title="Live Classes">🔴 ${live}</span>
  `;
}

// ==================== GET BATCH PAGE URL ====================
function getBatchPageUrl(batchId) {
  return `elite-batches.html?batch=${batchId}`;
}

// ==================== SETUP REAL-TIME LISTENERS ====================
function setupRealTimeListeners() {
  console.log('🔄 Setting up real-time listeners for Elite Plus batches...');

  // The listeners are set up in loadBatchStats for each batch
  // This function is called when the page loads to ensure all listeners are active
}

// Redundant dark mode functions removed (using script.js globals)

// ==================== BOOKMARK SUPPORT ====================
function openBkPanel() {
  if (typeof window.openBkPanel === 'function') {
    window.openBkPanel();
  }
}

// ==================== SUGGESTION MODAL ====================
function openSuggestionModal() {
  if (typeof window.openSuggestionModal === 'function') {
    window.openSuggestionModal();
  }
}

// ==================== EXPORTS ====================
window.openBkPanel = openBkPanel;
window.openSuggestionModal = openSuggestionModal;

console.log('✅ Elite Plus Real-Time Loader Ready');
