// ============================================================
// ADMIN ELITE PLUS - JavaScript Functions
// ============================================================
// Real-time Firebase integration for Elite Plus content management
// ============================================================

// Import sync manager
let syncManager = null;
let EliteAdminManager = null;

const _cachedBatchNames = {};

function populateEliteBatchDropdowns(batches) {
  const selectors = ['addEliteBatch', 'filterEliteBatch', 'editEliteBatch'];
  selectors.forEach(id => {
    const select = document.getElementById(id);
    if (!select || select.tagName !== 'SELECT') return;
    
    const currentValue = select.value;
    select.innerHTML = '';
    
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = id === 'filterEliteBatch' ? '— All Batches —' : '— Select Batch —';
    select.appendChild(defaultOpt);
    
    const eliteBatches = [];
    const bcaBatches = [];
    
    Object.entries(batches).forEach(([batchId, batchData]) => {
      const isElite = batchData.badge === 'Elite+' || batchData.isElitePlus === true;
      if (isElite) {
        eliteBatches.push({ id: batchId, ...batchData });
      } else {
        bcaBatches.push({ id: batchId, ...batchData });
      }
    });
    
    const sortByOrderOrName = (a, b) => {
      const orderA = a.orderIndex !== undefined ? a.orderIndex : 999;
      const orderB = b.orderIndex !== undefined ? b.orderIndex : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name);
    };
    eliteBatches.sort(sortByOrderOrName);
    bcaBatches.sort(sortByOrderOrName);
    
    if (eliteBatches.length > 0) {
      const group = document.createElement('optgroup');
      group.label = '💎 Elite Plus Batches';
      eliteBatches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.icon || '💎'} ${b.name}`;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }
    
    if (bcaBatches.length > 0) {
      const group = document.createElement('optgroup');
      group.label = '📚 BCA Store Batches';
      bcaBatches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.icon || '📚'} ${b.name}`;
        group.appendChild(opt);
      });
      select.appendChild(group);
    }
    
    select.value = currentValue;
  });
}

// Initialize sync manager when page loads
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const { syncManager: sm } = await import('./elite-realtime-sync-manager.js');
    syncManager = sm;
    console.log('✅ Sync manager loaded in admin panel');
  } catch (e) {
    console.warn('Sync manager not available (module environment required):', e.message);
  }

  // Real-time synchronization of batch dropdowns
  const checkDb = setInterval(() => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(checkDb);
      db.ref('batches').on('value', (snapshot) => {
        const batches = snapshot.val();
        if (batches) {
          Object.entries(batches).forEach(([batchId, batchData]) => {
            _cachedBatchNames[batchId] = `${batchData.icon || '💎'} ${batchData.name}`;
          });
          populateEliteBatchDropdowns(batches);
        }
      });
    }
  }, 1000);
});

// Switch between BCA Store and Elite Plus upload sections
function updateAdminUploadSection(section) {
  const bcaForm = document.getElementById('bcaStoreForm');
  const eliteForm = document.getElementById('elitePlusForm');
  const bcaLabel = document.getElementById('bcaStoreLabel');
  const eliteLabel = document.getElementById('elitePlusLabel');

  if (section === 'elite-plus') {
    bcaForm.style.display = 'none';
    eliteForm.style.display = 'block';
    bcaLabel.style.borderColor = 'var(--border)';
    bcaLabel.style.background = 'rgba(255,255,255,0.05)';
    eliteLabel.style.borderColor = '#8b5cf6';
    eliteLabel.style.background = 'rgba(139,92,246,0.15)';
  } else {
    bcaForm.style.display = 'block';
    eliteForm.style.display = 'none';
    bcaLabel.style.borderColor = '#8b5cf6';
    bcaLabel.style.background = 'rgba(139,92,246,0.15)';
    eliteLabel.style.borderColor = 'var(--border)';
    eliteLabel.style.background = 'rgba(255,255,255,0.05)';
  }
}

// Handle Elite Plus material addition with real-time sync
async function addElitePlusMaterial() {
  const batch = document.getElementById('addEliteBatch')?.value;
  const type = document.getElementById('addEliteType')?.value;
  const title = document.getElementById('addEliteTitle')?.value;
  const link = document.getElementById('addEliteLink')?.value;
  const description = document.getElementById('addEliteDescription')?.value || '';

  // Validation
  if (!batch || !type || !title || !link) {
    showAdminNotification('❌ Please fill all required fields', 'error');
    return;
  }

  if (!isValidUrl(link)) {
    showAdminNotification('❌ Please enter a valid HTTPS URL', 'error');
    return;
  }

  try {
    if (!db) {
      showAdminNotification('❌ Database connection not available', 'error');
      return;
    }

    // Show loading state
    showAdminNotification('⏳ Uploading content...', 'pending');

    // Prepare data based on type
    let contentData = {
      title: title.trim(),
      url: link,
      description: description.trim(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin',
      timestamp: Date.now()
    };

    // Add type-specific fields
    switch(type) {
      case 'videos':
        contentData = {
          ...contentData,
          duration: document.getElementById('addEliteVideoDuration')?.value || '0:00',
          instructor: document.getElementById('addEliteInstructor')?.value || 'Admin',
          views: 0,
          likes: 0
        };
        break;
      case 'notes':
        contentData = {
          ...contentData,
          pages: parseInt(document.getElementById('addEiteNotePages')?.value) || 0,
          difficulty: document.getElementById('addEliteDifficulty')?.value || 'Medium',
          downloads: 0
        };
        break;
      case 'dpp':
        contentData = {
          ...contentData,
          questions: parseInt(document.getElementById('addEliteDPPQuestions')?.value) || 0,
          difficulty: document.getElementById('addEliteDifficulty')?.value || 'Medium',
          solutions: document.getElementById('addEliteSolutions')?.value || '',
          attempts: 0
        };
        break;
      case 'live':
      case 'liveClasses':
        contentData = {
          ...contentData,
          instructor: document.getElementById('addEliteInstructor')?.value || 'Admin',
          schedule: document.getElementById('addEliveSchedule')?.value || '',
          maxAttendees: parseInt(document.getElementById('addEliteMaxAttendees')?.value) || 100,
          attendees: 0,
          recording: ''
        };
        break;
    }

    const classicType = type === 'live' ? 'live' : type;
    const premiumType = type === 'live' ? 'liveClasses' : type;
    const contentId = `${classicType}_${Date.now()}`;
    
    // Method 1: Old Firebase Realtime Database (for backward compatibility)
    const elitePlusRef = db.ref(`elitePlus/${batch}/${classicType}/${contentId}`);
    await elitePlusRef.set(contentData);

    // Method 2: Modern Firebase structure (if syncManager available)
    if (syncManager) {
      try {
        switch(type) {
          case 'videos':
            await syncManager.addVideo(batch, contentData);
            break;
          case 'notes':
            await syncManager.addNote(batch, contentData);
            break;
          case 'dpp':
            await syncManager.addDPP(batch, contentData);
            break;
          case 'live':
          case 'liveClasses':
            await syncManager.addLiveClass(batch, contentData);
            break;
        }
      } catch (e) {
        console.warn('Sync manager upload fallback:', e.message);
      }
    }

    // Update stats
    await updateBatchStatsWrapper(batch);

    // Automatically trigger live notification push
    try {
      if (window.NotificationsService) {
        const batchName = typeof getBatchDisplayName === 'function' ? getBatchDisplayName(batch) : batch;
        let notifType = 'announcement';
        let notifTitle = `📢 Important Update`;
        let notifMessage = `📚 ${batchName} Batch में updates add किए गए हैं।\n\nTopic: ${title}`;
        let actionName = 'Open Batch';
        
        if (type === 'videos') {
          notifType = 'video_upload';
          notifTitle = `🎉 New Video Uploaded`;
          notifMessage = `📚 ${batchName} Batch में एक नया वीडियो जोड़ा गया है।\n\nTopic: ${title}\n\nअभी सीखना शुरू करें और अपने concepts को मजबूत बनाएं।`;
          actionName = '🚀 Open Batch Now';
        } else if (type === 'notes') {
          notifType = 'notes_upload';
          notifTitle = `🔥 New Notes Added`;
          notifMessage = `Fresh Notes Available!\n\n${batchName} Batch में नए handwritten notes upload किए गए हैं।\n\nRevision के लिए अभी देखें।`;
          actionName = '📖 View Notes';
        } else if (type === 'dpp') {
          notifType = 'notes_upload';
          notifTitle = `🔥 New Practice Sheet Uploaded`;
          notifMessage = `DPP Available!\n\n${batchName} Batch में नया DPP practice sheet upload किया गया है: "${title}".`;
          actionName = '📖 View DPP';
        } else if (type === 'live' || type === 'liveClasses') {
          notifType = 'live_class';
          notifTitle = `🎥 Live Class Scheduled`;
          notifMessage = `Live Class Announcement!\n\n${batchName} Batch में नई Live Class schedule की गई है।\n\nTopic: ${title}\n\nSyllabus revision और live practice के लिए तैयार रहें।`;
          actionName = '🎥 View Schedule';
        }
        
        await window.NotificationsService.pushSystemNotification(
          notifType,
          notifTitle,
          notifMessage,
          batch,
          `elite-batches.html?batch=${batch}`,
          '',
          actionName
        );
      }
    } catch (e) {
      console.warn("Elite notification auto push failed:", e);
    }

    // Success feedback
    showAdminNotification(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully! 🎉`, 'success');
    clearEliteAddForm();

    // Log activity
    console.log('Elite Plus content added successfully:', { 
      batch, 
      type, 
      title, 
      contentId,
      timestamp: new Date().toISOString()
    });

    // Trigger real-time update event
    const event = new CustomEvent('elitePlusContentAdded', { 
      detail: { batch, type, contentData } 
    });
    document.dispatchEvent(event);

  } catch (error) {
    console.error('Error adding Elite Plus material:', error);
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Clear Elite Plus form
function clearEliteAddForm() {
  const fields = ['addEliteBatch', 'addEliteType', 'addEliteTitle', 'addEliteLink', 'addEliteDescription'];
  fields.forEach(f => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
}

// Handle Elite Plus link input and dynamic field rendering
function handleEliteAdminLinkInput() {
  const type = document.getElementById('addEliteType')?.value;
  const container = document.getElementById('eliteTypeFields');
  if (!container) return;

  container.innerHTML = '';
  
  if (type === 'videos') {
    container.innerHTML = `
      <div class="admin-form-grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="form-group">
          <label>Video Duration <span style="font-size:0.8rem; font-weight:700;" id="durationSyncStatus"></span></label>
          <input type="text" id="addEliteVideoDuration" placeholder="e.g. 10:25" value="0:00" />
        </div>
        <div class="form-group">
          <label>Instructor</label>
          <input type="text" id="addEliteInstructor" placeholder="Instructor Name" value="Admin" />
        </div>
      </div>
    `;
    // Auto-fetch if there is already a link
    autoFetchEliteVideoDuration();
  } else if (type === 'notes') {
    container.innerHTML = `
      <div class="admin-form-grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="form-group">
          <label>Number of Pages</label>
          <input type="number" id="addEiteNotePages" placeholder="e.g. 45" value="0" />
        </div>
        <div class="form-group">
          <label>Difficulty</label>
          <select id="addEliteDifficulty">
            <option value="Easy">Easy</option>
            <option value="Medium" selected>Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>
    `;
  } else if (type === 'dpp') {
    container.innerHTML = `
      <div class="admin-form-grid" style="grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="form-group">
          <label>Number of Questions</label>
          <input type="number" id="addEliteDPPQuestions" placeholder="e.g. 15" value="0" />
        </div>
        <div class="form-group">
          <label>Difficulty</label>
          <select id="addEliteDifficulty">
            <option value="Easy">Easy</option>
            <option value="Medium" selected>Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div class="form-group" style="grid-column: 1/-1;">
          <label>Solutions Link (optional)</label>
          <input type="url" id="addEliteSolutions" placeholder="https://..." />
        </div>
      </div>
    `;
  } else if (type === 'live') {
    container.innerHTML = `
      <div class="admin-form-grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 16px;">
        <div class="form-group">
          <label>Instructor</label>
          <input type="text" id="addEliteInstructor" placeholder="Instructor Name" value="Admin" />
        </div>
        <div class="form-group">
          <label>Schedule</label>
          <input type="text" id="addEliveSchedule" placeholder="e.g. Tomorrow 4 PM" />
        </div>
        <div class="form-group">
          <label>Max Attendees</label>
          <input type="number" id="addEliteMaxAttendees" value="100" />
        </div>
      </div>
    `;
  }
}

function getYouTubeId(url) {
  if (!url) return null;
  const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const m = url.match(reg);
  return m ? m[1] : null;
}

async function getYouTubeVideoDuration(videoId) {
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

async function autoFetchEliteVideoDuration() {
  const url = document.getElementById('addEliteLink')?.value;
  const ytId = getYouTubeId(url);
  if (!ytId) return;

  const statusEl = document.getElementById('durationSyncStatus');
  const durationInput = document.getElementById('addEliteVideoDuration');
  
  if (statusEl) {
    statusEl.textContent = '⏳ Fetching duration...';
    statusEl.style.color = '#3b82f6';
  }

  const duration = await getYouTubeVideoDuration(ytId);
  if (duration) {
    if (durationInput) {
      durationInput.value = duration;
      durationInput.style.borderColor = '#10b981';
      setTimeout(() => durationInput.style.borderColor = '', 1500);
    }
    if (statusEl) {
      statusEl.textContent = '✅ Auto-synced!';
      statusEl.style.color = '#10b981';
    }
  } else {
    if (statusEl) {
      statusEl.textContent = '❌ Failed to auto-sync duration';
      statusEl.style.color = '#ef4444';
    }
  }
}

// Bind autoFetch listener
document.addEventListener('DOMContentLoaded', () => {
  const linkInput = document.getElementById('addEliteLink');
  if (linkInput) {
    linkInput.addEventListener('input', async () => {
      const type = document.getElementById('addEliteType')?.value;
      if (type === 'videos') {
        await autoFetchEliteVideoDuration();
      }
    });
  }
});

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Show admin notification
function showAdminNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'pending' ? '#3b82f6' : '#ef4444'};
    color: white;
    border-radius: 8px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notif.textContent = message;
  document.body.appendChild(notif);

  // Auto remove
  if (type !== 'pending') {
    setTimeout(() => {
      notif.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notif.remove(), 300);
    }, 3000);
  } else {
    // Return notif so it can be manually cleared if needed
    window.activePendingNotif = notif;
  }
  
  // Clear any previous pending notification if a new one is loaded
  if (type !== 'pending' && window.activePendingNotif) {
    window.activePendingNotif.remove();
    window.activePendingNotif = null;
  }
}

// Add CSS animations if not present
if (!document.querySelector('style[data-elite-plus-animations]')) {
  const style = document.createElement('style');
  style.setAttribute('data-elite-plus-animations', 'true');
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
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Listen for real-time updates from Elite Plus
function setupAdminElitePlusListener() {
  if (!db) return;

  try {
    const elitePlusRef = db.ref('elitePlus');
    elitePlusRef.on('child_changed', (snapshot) => {
      const batchId = snapshot.key;
      const data = snapshot.val();
      console.log(`Elite Plus batch updated: ${batchId}`, data);
    });

    elitePlusRef.on('child_added', (snapshot) => {
      const batchId = snapshot.key;
      const data = snapshot.val();
      console.log(`New Elite Plus batch content: ${batchId}`, data);
    });
  } catch (error) {
    console.error('Error setting up Elite Plus listener:', error);
  }
}

// ============================================================
// RESOURCE MANAGEMENT FOR ELITE PLUS & PLACEMENT BATCHES
// ============================================================

// Toggle Manage tab filters based on Category selection
function toggleManageCategoryFilters() {
  const category = document.getElementById('filterCategory')?.value || 'bca-store';
  const bcaFilters = document.querySelectorAll('.bca-store-filter');
  const eliteFilters = document.querySelectorAll('.elite-plus-filter');
  
  if (category === 'elite-plus') {
    bcaFilters.forEach(el => el.style.display = 'none');
    eliteFilters.forEach(el => el.style.display = 'block');
  } else {
    bcaFilters.forEach(el => el.style.display = 'block');
    eliteFilters.forEach(el => el.style.display = 'none');
  }
  
  loadManageMaterials();
}

// Intercept and override standard loadManageMaterials function
const originalLoadManageMaterials = window.loadManageMaterials;

window.loadManageMaterials = function() {
  const category = document.getElementById('filterCategory')?.value || 'bca-store';
  if (category === 'elite-plus') {
    loadManageEliteMaterials();
  } else {
    if (typeof originalLoadManageMaterials === 'function') {
      originalLoadManageMaterials();
    }
  }
};

// Load Elite Plus and Placement prep batch resources
function loadManageEliteMaterials() {
  const fBatch = document.getElementById('filterEliteBatch')?.value || '';
  const fType = document.getElementById('filterEliteType')?.value || '';
  const fQ = (document.getElementById('manageSearch')?.value || '').toLowerCase();
  const cont = document.getElementById('manageMaterialsList');
  const emptyEl = document.getElementById('manageEmpty');
  if (!cont) return;

  if (window.manageListenerRef && db) {
    window.manageListenerRef.off('value');
    window.manageListenerRef = null;
  }

  cont.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  if (!db) {
    cont.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Firebase connection not active.</p>';
    return;
  }

  window.manageListenerRef = db.ref('elitePlus');
  window.manageListenerRef.on('value', snap => {
    let items = [];
    if (snap.exists()) {
      snap.forEach(batchSnap => {
        const batchId = batchSnap.key;
        if (fBatch && batchId !== fBatch) return;

        const batchName = getBatchDisplayName(batchId);
        const sections = ['notes', 'dpp', 'videos', 'liveClasses', 'live'];
        const seenIds = new Set();

        // 1. Scan premium path structure (sections/...)
        const sectionsSnap = batchSnap.child('sections');
        if (sectionsSnap.exists()) {
          sectionsSnap.forEach(typeSnap => {
            const type = typeSnap.key;
            const normalType = type === 'liveClasses' ? 'live' : type;
            if (fType && normalType !== fType) return;

            typeSnap.forEach(child => {
              const item = {
                id: child.key,
                ...child.val(),
                batchId,
                batchName,
                type: normalType,
                category: 'elite-plus',
                pathType: type
              };
              
              if (!fQ || item.title?.toLowerCase().includes(fQ)) {
                if (!seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  items.push(item);
                }
              }
            });
          });
        }

        // 2. Scan classic path structure (compatibility)
        sections.forEach(sec => {
          if (sec === 'sections' || sec === 'info' || sec === 'stats') return;
          const normalType = (sec === 'liveClasses' || sec === 'live') ? 'live' : sec;
          if (fType && normalType !== fType) return;

          const secSnap = batchSnap.child(sec);
          if (secSnap.exists()) {
            secSnap.forEach(child => {
              const item = {
                id: child.key,
                ...child.val(),
                batchId,
                batchName,
                type: normalType,
                category: 'elite-plus',
                pathType: sec
              };
              
              if (!fQ || item.title?.toLowerCase().includes(fQ)) {
                if (!seenIds.has(item.id)) {
                  seenIds.add(item.id);
                  items.push(item);
                }
              }
            });
          }
        });
      });
    }

    items.sort((a, b) => (b.timestamp || b.uploadDate || 0) - (a.timestamp || a.uploadDate || 0));
    renderManageEliteList(items, cont, emptyEl);
  }, error => {
    console.error("Firebase elitePlus manage read error:", error);
    cont.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Error reading Elite Plus materials.</p>';
  });
}

// Render Elite Plus materials table/cards
function renderManageEliteList(items, cont, emptyEl) {
  if (!items.length) { 
    cont.innerHTML = ''; 
    if (emptyEl) emptyEl.style.display = 'block'; 
    return; 
  }
  
  if (emptyEl) emptyEl.style.display = 'none';
  
  cont.innerHTML = items.map(item => {
    let badgeText = item.type || 'notes';
    if (badgeText === 'dpp') badgeText = 'DPP 📋';
    else if (badgeText === 'notes') badgeText = 'Notes 📝';
    else if (badgeText === 'videos') badgeText = 'Video 🎬';
    else if (badgeText === 'live') badgeText = 'Live Class 🔴';
    
    const t = item.timestamp || item.uploadDate || Date.now();
    const dateStr = new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const url = item.url || item.link || '#';
    
    return `<div class="manage-row" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:12px; padding:16px; margin-bottom:12px; transition:all 0.25s ease;">
      <div class="manage-row-info">
        <div class="manage-row-title" style="font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          ${escapeHtml(item.title || 'Untitled')}
          <span class="adm-section-badge" style="background:rgba(139,92,246,0.12); color:#8b5cf6; padding:2px 8px; border-radius:6px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">${badgeText}</span>
        </div>
        <div class="manage-row-meta" style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
          💎 Elite Plus › <strong>${item.batchName}</strong> | 🕐 ${dateStr}
        </div>
        <div class="manage-row-meta" style="margin-top:4px; font-size:0.8rem;">
          <a href="${url}" target="_blank" style="color:var(--primary); text-decoration:none;">🔗 ${url.substring(0, 65)}${url.length > 65 ? '...' : ''}</a>
        </div>
      </div>
      <div class="manage-row-actions" style="display:flex; gap:8px;">
        <button class="btn-outline" style="padding:8px 16px; font-size:0.85rem;" data-item="${encodeURIComponent(JSON.stringify(item))}" onclick="openEditModal(JSON.parse(decodeURIComponent(this.getAttribute('data-item'))))">✏️ Edit</button>
        <button class="btn-outline" style="padding:8px 12px; color:#ef4444; border-color:rgba(239,68,68,0.2);" onclick="deleteEliteMaterial('${item.batchId}','${item.type}','${item.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// Intercept and override standard openEditModal function
const originalOpenEditModal = window.openEditModal;

window.openEditModal = function(item) {
  const categoryInput = document.getElementById('editCategory');
  if (item.category === 'elite-plus') {
    document.getElementById('editId').value = item.id || '';
    if (categoryInput) categoryInput.value = 'elite-plus';
    document.getElementById('editEliteBatch').value = item.batchId || '';
    document.getElementById('editEliteType').value = item.type || '';
    
    document.getElementById('editTitle').value = item.title || '';
    document.getElementById('editDescription').value = item.description || '';
    document.getElementById('editLink').value = item.url || item.link || '';
    document.getElementById('editType').value = item.type || 'notes';
    
    document.getElementById('editModal')?.classList.add('active');
  } else {
    if (categoryInput) categoryInput.value = 'bca-store';
    if (typeof originalOpenEditModal === 'function') {
      originalOpenEditModal(item);
    }
  }
};

// Intercept and override standard saveEditMaterial function
const originalSaveEditMaterial = window.saveEditMaterial;

window.saveEditMaterial = function() {
  const category = document.getElementById('editCategory')?.value || 'bca-store';
  if (category === 'elite-plus') {
    saveEditEliteMaterial();
  } else {
    if (typeof originalSaveEditMaterial === 'function') {
      originalSaveEditMaterial();
    }
  }
};

// Save edited Elite Plus material
async function saveEditEliteMaterial() {
  const id = document.getElementById('editId').value;
  const batchId = document.getElementById('editEliteBatch').value;
  const type = document.getElementById('editEliteType').value;
  
  const title = document.getElementById('editTitle').value.trim();
  const description = document.getElementById('editDescription').value.trim();
  const link = document.getElementById('editLink').value.trim();
  
  if (!title || !link) {
    showAdminNotification('❌ Title and Link required.', 'error');
    return;
  }
  
  if (!db) {
    showAdminNotification('❌ Database connection not available', 'error');
    return;
  }
  
  showAdminNotification('⏳ Saving changes...', 'pending');
  
  const updates = {
    title,
    description,
    url: link,
    link: link,
    lastModified: Date.now(),
    timestamp: Date.now()
  };
  
  try {
    const classicType = type === 'live' ? 'live' : type;
    const premiumType = type === 'live' ? 'liveClasses' : type;
    
    // Path 1: Classic path
    const classicRef = db.ref(`elitePlus/${batchId}/${classicType}/${id}`);
    await classicRef.update(updates);
    
    // Path 2: Premium path
    const premiumRef = db.ref(`elitePlus/${batchId}/sections/${premiumType}/${id}`);
    await premiumRef.update(updates);
    
    // Update Stats
    await updateBatchStatsWrapper(batchId);
    
    showAdminNotification('✅ Elite Material updated successfully!', 'success');
    closeEditModal();
    loadManageMaterials();
  } catch (error) {
    console.error('Error saving elite material edit:', error);
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Delete Elite Plus material
async function deleteEliteMaterial(batchId, type, id) {
  if (!confirm('Are you sure you want to delete this Elite Plus material?')) return;
  
  if (!db) {
    showAdminNotification('❌ Database connection not available', 'error');
    return;
  }
  
  showAdminNotification('⏳ Deleting material...', 'pending');
  
  try {
    const classicType = type === 'live' ? 'live' : type;
    const premiumType = type === 'live' ? 'liveClasses' : type;
    
    // Path 1: Classic path
    const classicRef = db.ref(`elitePlus/${batchId}/${classicType}/${id}`);
    await classicRef.remove();
    
    // Path 2: Premium path
    const premiumRef = db.ref(`elitePlus/${batchId}/sections/${premiumType}/${id}`);
    await premiumRef.remove();
    
    // Update Stats
    await updateBatchStatsWrapper(batchId);
    
    showAdminNotification('🗑️ Elite Material deleted successfully!', 'success');
    loadManageMaterials();
  } catch (error) {
    console.error('Error deleting elite material:', error);
    showAdminNotification(`❌ Error: ${error.message}`, 'error');
  }
}

// Helper to update batch stats count on Firebase
async function updateBatchStatsWrapper(batchId) {
  if (!db) return;
  try {
    const snap = await db.ref(`elitePlus/${batchId}/sections`).once('value');
    const sections = snap.val() || {};
    
    const stats = {
      totalVideos: Object.keys(sections.videos || {}).length,
      totalNotes: Object.keys(sections.notes || {}).length,
      totalDPP: Object.keys(sections.dpp || {}).length,
      totalLiveClasses: Object.keys(sections.liveClasses || {}).length,
      lastModified: Date.now()
    };
    
    await db.ref(`elitePlus/${batchId}/stats`).set(stats);
    console.log(`📊 Stats updated for ${batchId}:`, stats);
  } catch (e) {
    console.warn('Error updating batch stats:', e);
  }
}

// Map batchId keys to clean display strings
function getBatchDisplayName(batchId) {
  if (_cachedBatchNames[batchId]) {
    return _cachedBatchNames[batchId];
  }
  const batches = {
    'c-programming': '⌨️ C Programming',
    'cpp': '🚀 C++',
    'java': '☕ Java',
    'javascript': '✨ JavaScript',
    'python': '🐍 Python',
    'dsa': '🌲 DSA Mastery',
    'web-development': '🌐 Web Development',
    'react-js': '⚛️ React JS',
    'node-js': '🔧 Node JS',
    'sql-database': '🗄️ SQL & DB',
    'elite-aptitude': '🧠 Elite Aptitude',
    'interview-prep': '💼 Interview Prep Pro',
    'placement-booster': '🚀 Placement Booster',
    'resume-linkedin': '📄 Resume & LinkedIn',
    'coding-round': '💻 Coding Round Crackers'
  };
  return batches[batchId] || batchId;
}

// Escape HTML utility helper
function escapeHtml(text) {
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

// ============================================================
// MORE TOOLS POPUP MENU INTERACTION LOGIC
// ============================================================

function toggleMoreToolsMenu(e) {
  if (e) e.stopPropagation();
  const popover = document.getElementById('admMoreToolsPopover');
  if (!popover) return;
  
  if (popover.style.display === 'grid') {
    closeMoreToolsMenu();
  } else {
    popover.style.display = 'grid';
    document.getElementById('tabMore')?.classList.add('active');
  }
}

function closeMoreToolsMenu() {
  const popover = document.getElementById('admMoreToolsPopover');
  if (popover) {
    popover.style.display = 'none';
  }
  
  // Refresh bottom navigation dock highlighting to correspond with active section
  const activeSection = document.querySelector('.adm-section.active');
  if (activeSection) {
    const tabId = activeSection.id.replace('admin-tab-', '');
    const primaryTabs = ['dashboard', 'add', 'manage', 'test'];
    if (primaryTabs.includes(tabId)) {
      document.getElementById('tabMore')?.classList.remove('active');
    }
  }
}

// Close popover when clicking anywhere else
document.addEventListener('click', (event) => {
  const popover = document.getElementById('admMoreToolsPopover');
  const moreBtn = document.getElementById('tabMore');
  if (popover && popover.style.display === 'grid') {
    if (!popover.contains(event.target) && !moreBtn.contains(event.target)) {
      closeMoreToolsMenu();
    }
  }
});

// Intercept switchAdminTab to handle "More" button highlighting
const finalSwitchAdminTab = window.switchAdminTab;

window.switchAdminTab = function(tab) {
  if (typeof finalSwitchAdminTab === 'function') {
    finalSwitchAdminTab(tab);
  }
  
  const primaryTabs = ['dashboard', 'add', 'manage', 'test'];
  const moreBtn = document.getElementById('tabMore');
  if (moreBtn) {
    if (!primaryTabs.includes(tab)) {
      moreBtn.classList.add('active');
    } else {
      moreBtn.classList.remove('active');
    }
  }
  
  // Highlight current item inside popover as active
  document.querySelectorAll('.adm-more-popover .adm-more-item').forEach(el => {
    el.classList.remove('active');
  });
  const popoverItem = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (popoverItem) {
    popoverItem.classList.add('active');
  }
};

// Override loadInboxBadge to update dock and popover badges simultaneously
window.loadInboxBadge = function() {
  if (!db) return;
  db.ref('suggestions').off('value');
  db.ref('suggestions').on('value', snap => {
    let count = 0;
    snap.forEach(child => { if (!child.val().read) count++; });
    
    // Update all badge elements
    ['inboxBadge', 'moreBadge'].forEach(id => {
      const b = document.getElementById(id);
      if (b) {
        b.textContent = count;
        b.style.display = count > 0 ? 'inline' : 'none';
      }
    });
  });
};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Set default to BCA Store
  updateAdminUploadSection('bca-store');
  
  // Setup filters category view
  toggleManageCategoryFilters();
  
  // Setup listeners
  if (typeof db !== 'undefined' && db) {
    setupAdminElitePlusListener();
    loadInboxBadge();
  }
});
