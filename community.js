// ============================================================
// COMMUNITY TAB — community.js
// All community logic: Registration, Doubts, Chat, Announcements
// ============================================================

// ---- Community User State ----
let commUser = null;
let commDoubtsCache = [];
let commTypingTimeout = null;
let commChatListener = null;

// ---- Helpers ----
function commId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6); }
function commVisitorId() {
  const studentId = localStorage.getItem('student_id');
  if (studentId) return studentId;
  let id = localStorage.getItem('comm_visitorId');
  if (!id) { id = 'cu_' + commId(); localStorage.setItem('comm_visitorId', id); }
  return id;
}
function commTimeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function commTimeStamp(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ============================================================
// LOCAL PROFILE PHOTO CACHE & LOADER
// ============================================================
const studentPhotoCache = {};

function loadAndRenderAvatar(userId, initText, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;

  if (studentPhotoCache[userId] !== undefined) {
    if (studentPhotoCache[userId]) {
      container.innerHTML = `<img src="${studentPhotoCache[userId]}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
    } else {
      container.innerHTML = initText;
    }
    return;
  }

  if (typeof firebase !== 'undefined' && firebase.database && userId && (userId.startsWith('STU_') || userId.startsWith('DEV_'))) {
    firebase.database().ref(`students/${userId}/photo`).once('value').then(snapshot => {
      const photo = snapshot.val() || '';
      studentPhotoCache[userId] = photo;
      if (photo) {
        container.innerHTML = `<img src="${photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" />`;
      } else {
        container.innerHTML = initText;
      }
    }).catch(() => {
      studentPhotoCache[userId] = '';
      container.innerHTML = initText;
    });
  } else {
    studentPhotoCache[userId] = '';
    container.innerHTML = initText;
  }
}

function showUniversalLoginBlocker() {
  const gate = document.getElementById('commRegGate');
  if (!gate) return;
  
  gate.style.display = 'flex';
  gate.innerHTML = `
    <div class="comm-reg-card animate-scale-up" style="text-align: center; max-width: 450px;">
      <div class="comm-reg-icon" style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
      <div class="comm-reg-title" style="font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; color: var(--text);">Login Required</div>
      <p class="comm-reg-sub" style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
        To access the BCA student community, ask doubts, and chat live, you need to sign in or register with a premium universal account.
      </p>
      <button class="comm-reg-btn" onclick="if (window.triggerStudentLoginPopup) { window.triggerStudentLoginPopup(); } else { alert('Central login engine not loaded yet. Please reload.'); }" style="width: 100%; padding: 14px; background: linear-gradient(135deg, var(--primary), var(--secondary)); border: none; color: #fff; font-weight: 800; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px var(--primary-glow);">
        🔑 Sign In / Register ⚡
      </button>
    </div>
  `;
}

// ============================================================
// INIT
// ===================================================function initCommunityPage() {
  initDarkMode();
  initNavbar();
  initVisitCounter();

  // Consume Centralized Student Authentication
  const isRegistered = localStorage.getItem('student_registered') === 'true';
  const studentDataStr = localStorage.getItem('student_data');
  let studentData = null;

  if (isRegistered && studentDataStr) {
    try {
      studentData = JSON.parse(studentDataStr);
    } catch(e) {}
  }

  if (isRegistered && studentData) {
    const studentId = localStorage.getItem('student_id') || 'STU_' + Date.now();
    commUser = {
      name: studentData.name,
      semester: studentData.semester,
      rollNo: studentData.username || studentData.rollNo || 'N/A',
      uid: studentId,
      photo: studentData.photo || ''
    };
    showCommunityMain();
  } else {
    document.getElementById('commPage').style.display = 'none';
  }
}

// ============================================================
// REGISTRATION (Bypassed but kept for compatibility)
// ============================================================
function commRegister() {
  // Bypassed: central authentication system handles registration/login
}

function showCommunityMain() {
  document.getElementById('commPage').style.display = 'block';
  const gate = document.getElementById('commRegGate');
  if (gate) gate.style.display = 'none';
  loadDoubts();
  loadAnnouncements();
  setupOnlinePresence();
}sence();
}

// ============================================================
// ONLINE PRESENCE
// ============================================================
function setupOnlinePresence() {
  if (!db || !commUser) return;
  const uid = commVisitorId();
  const onlineRef = db.ref('community_online/' + uid);
  onlineRef.set({ name: commUser.name, semester: commUser.semester, lastSeen: Date.now() });
  onlineRef.onDisconnect().remove();

  // Update every 30s
  setInterval(() => {
    onlineRef.update({ lastSeen: Date.now() });
  }, 30000);

  // Listen for online count
  db.ref('community_online').on('value', snap => {
    const count = snap.numChildren() || 0;
    const el1 = document.getElementById('commOnlineCount');
    const el2 = document.getElementById('commChatOnline');
    if (el1) el1.textContent = count;
    if (el2) el2.textContent = count;
  });
}

// ============================================================
// TAB SWITCHING
// ============================================================
function commSwitchTab(tab) {
  ['doubts', 'chat', 'announcements', 'voting'].forEach(t => {
    const el = document.getElementById('comm-tab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.comm-tab').forEach(btn => {
    const text = btn.textContent.toLowerCase();
    btn.classList.toggle('active', text.includes(tab.substring(0, 4)) || (tab === 'voting' && text.includes('vote')));
  });

  if (tab === 'chat') initChat();
  if (tab === 'announcements') loadAnnouncements();
  if (tab === 'voting') loadLivePolls();
}

// ============================================================
// DOUBTS SYSTEM
// ============================================================
function loadDoubts() {
  if (!db) return;
  const list = document.getElementById('commDoubtsList');
  const empty = document.getElementById('commDoubtsEmpty');

  db.ref('community_doubts').orderByChild('timestamp').on('value', snap => {
    commDoubtsCache = [];
    if (!snap.exists()) {
      if (list) list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    snap.forEach(child => commDoubtsCache.push({ id: child.key, ...child.val() }));
    commDoubtsCache.reverse(); // newest first
    if (empty) empty.style.display = 'none';
    renderDoubts(commDoubtsCache);
  });
}

function renderDoubts(doubts) {
  const list = document.getElementById('commDoubtsList');
  const empty = document.getElementById('commDoubtsEmpty');
  if (!list) return;

  if (!doubts.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  const uid = commUser ? commUser.uid : commVisitorId();
  // Sort: pinned first
  doubts.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  list.innerHTML = doubts.map((d, i) => {
    const init = (d.userName || '?')[0].toUpperCase();
    const likes = d.likes ? Object.keys(d.likes).length : 0;
    const liked = d.likes && d.likes[uid];
    const replies = d.replies ? Object.values(d.replies) : [];
    replies.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    const replyCount = replies.length;

    return `<div class="comm-doubt-card ${d.pinned ? 'pinned' : ''} ${d.solved ? 'solved' : ''}" style="animation-delay:${i * 0.05}s">
      <div class="comm-doubt-top">
        <div class="comm-doubt-user">
          <div class="comm-doubt-avatar" id="doubt-avatar-${d.id}">${init}</div>
          <div class="comm-doubt-meta">
            <div class="name">${escHtml(d.userName || 'Anonymous')}</div>
            <div class="info">Sem ${d.userSemester || '?'} • ${commTimeAgo(d.timestamp)}</div>
          </div>
        </div>
        <div class="comm-doubt-badges">
          ${d.subject ? `<span class="comm-badge">${escHtml(d.subject)}</span>` : ''}
          ${d.semester ? `<span class="comm-badge">Sem ${d.semester}</span>` : ''}
          ${d.solved ? '<span class="comm-badge solved">✅ Solved</span>' : ''}
          ${d.pinned ? '<span class="comm-badge pinned">📌 Pinned</span>' : ''}
        </div>
      </div>
      <div class="comm-doubt-title">${escHtml(d.title || '')}</div>
      ${d.description ? `<div class="comm-doubt-desc">${escHtml(d.description)}</div>` : ''}
      <div class="comm-doubt-actions">
        <button class="comm-action-btn ${liked ? 'liked' : ''}" onclick="commLikeDoubt('${d.id}')">
          ${liked ? '❤️' : '🤍'} ${likes}
        </button>
        <button class="comm-action-btn" onclick="commToggleReplies('${d.id}')">
          💬 ${replyCount} ${replyCount === 1 ? 'Reply' : 'Replies'}
        </button>
        ${d.userId === uid && !d.solved ? `<button class="comm-action-btn" onclick="commMarkSolved('${d.id}')">✅ Mark Solved</button>` : ''}
      </div>
      <div class="comm-replies" id="replies-${d.id}" style="display:none;">
        ${replies.map((r, rIdx) => {
          const rInit = (r.userName || '?')[0].toUpperCase();
          const rId = r.timestamp || rIdx;
          return `
          <div class="comm-reply">
            <div class="comm-reply-avatar" id="reply-avatar-${d.id}-${rId}">${rInit}</div>
            <div class="comm-reply-body">
              <div class="comm-reply-header">
                <span class="rname">${escHtml(r.userName || 'Anonymous')}</span>
                <span class="rtime">${commTimeAgo(r.timestamp)}</span>
              </div>
              <div class="comm-reply-text">${escHtml(r.text || '')}</div>
            </div>
          </div>
          `;
        }).join('')}
        <div class="comm-reply-input-wrap">
          <input type="text" id="reply-input-${d.id}" placeholder="Write a reply..." maxlength="300"
                 onkeydown="if(event.key==='Enter')commPostReply('${d.id}')" />
          <button onclick="commPostReply('${d.id}')">Reply</button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Asynchronously load student profile photos
  doubts.forEach(d => {
    const init = (d.userName || '?')[0].toUpperCase();
    loadAndRenderAvatar(d.userId, init, `doubt-avatar-${d.id}`);

    const replies = d.replies ? Object.values(d.replies) : [];
    replies.forEach((r, rIdx) => {
      const rInit = (r.userName || '?')[0].toUpperCase();
      const rId = r.timestamp || rIdx;
      loadAndRenderAvatar(r.userId, rInit, `reply-avatar-${d.id}-${rId}`);
    });
  });
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function commFilterDoubts() {
  const q = (document.getElementById('commDoubtSearch')?.value || '').toLowerCase();
  const sem = document.getElementById('commDoubtFilterSem')?.value || '';
  let filtered = commDoubtsCache;
  if (q) filtered = filtered.filter(d =>
    (d.title || '').toLowerCase().includes(q) ||
    (d.description || '').toLowerCase().includes(q) ||
    (d.subject || '').toLowerCase().includes(q)
  );
  if (sem) filtered = filtered.filter(d => d.semester === sem);
  renderDoubts(filtered);
}

function commOpenDoubtModal() { document.getElementById('commDoubtModal').style.display = 'flex'; }
function commCloseDoubtModal() { document.getElementById('commDoubtModal').style.display = 'none'; }

function commPostDoubt() {
  if (!commUser || !db) return;
  const title = document.getElementById('commDoubtTitle')?.value.trim();
  const desc = document.getElementById('commDoubtDesc')?.value.trim();
  const subject = document.getElementById('commDoubtSubject')?.value.trim();
  const sem = document.getElementById('commDoubtSem')?.value;

  if (!title) { showToast('❌ Please enter a doubt title.', 'error'); return; }

  const id = commId();
  db.ref('community_doubts/' + id).set({
    userId: commUser.uid,
    userName: commUser.name,
    userSemester: commUser.semester,
    title, description: desc || '',
    subject: subject || '', semester: sem || '',
    timestamp: Date.now(),
    solved: false, pinned: false, likes: {}, replies: {}
  }).then(() => {
    showToast('✅ Doubt posted successfully!', 'success');
    commCloseDoubtModal();
    document.getElementById('commDoubtTitle').value = '';
    document.getElementById('commDoubtDesc').value = '';
    document.getElementById('commDoubtSubject').value = '';
    document.getElementById('commDoubtSem').value = '';
  }).catch(() => showToast('❌ Failed to post doubt.', 'error'));
}

function commLikeDoubt(id) {
  if (!db || !commUser) return;
  const uid = commUser.uid;
  const ref = db.ref('community_doubts/' + id + '/likes/' + uid);
  ref.once('value', snap => {
    if (snap.exists()) ref.remove();
    else ref.set(true);
  });
}

function commMarkSolved(id) {
  if (!db) return;
  db.ref('community_doubts/' + id).update({ solved: true });
  showToast('✅ Marked as solved!', 'success');
}

function commToggleReplies(id) {
  const el = document.getElementById('replies-' + id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function commPostReply(doubtId) {
  if (!commUser || !db) return;
  const input = document.getElementById('reply-input-' + doubtId);
  const text = input?.value.trim();
  if (!text) return;

  const replyId = commId();
  db.ref('community_doubts/' + doubtId + '/replies/' + replyId).set({
    userId: commUser.uid,
    userName: commUser.name,
    text, timestamp: Date.now()
  }).then(() => { input.value = ''; })
    .catch(() => showToast('❌ Failed to post reply.', 'error'));
}

// ============================================================
// CHAT SYSTEM
// ============================================================
function initChat() {
  if (commChatListener || !db) return;
  const msgContainer = document.getElementById('commChatMessages');
  if (!msgContainer) return;
  msgContainer.innerHTML = '';

  // Load last 100 messages
  const ref = db.ref('community_chat').orderByChild('timestamp').limitToLast(100);
  commChatListener = ref.on('child_added', snap => {
    const msg = snap.val();
    if (!msg) return;
    appendChatMsg(msg);
  });

  // Typing indicator listener
  db.ref('community_typing').on('value', snap => {
    const typingEl = document.getElementById('commChatTyping');
    const textEl = document.getElementById('commTypingText');
    if (!typingEl || !snap.exists()) { if (typingEl) typingEl.style.display = 'none'; return; }

    const uid = commVisitorId();
    const typers = [];
    const now = Date.now();
    snap.forEach(child => {
      const d = child.val();
      if (child.key !== uid && d.timestamp && (now - d.timestamp) < 5000) {
        typers.push(d.name || 'Someone');
      }
    });

    if (typers.length > 0) {
      typingEl.style.display = 'flex';
      textEl.textContent = typers.length === 1
        ? typers[0] + ' is typing...'
        : typers.length + ' people are typing...';
    } else {
      typingEl.style.display = 'none';
    }
  });
}

function appendChatMsg(msg) {
  const container = document.getElementById('commChatMessages');
  if (!container) return;
  const uid = commUser ? commUser.uid : commVisitorId();
  const isSelf = msg.userId === uid;
  const init = (msg.userName || '?')[0].toUpperCase();
  const avatarId = `chat-avatar-${msg.timestamp}`;

  const div = document.createElement('div');
  div.className = 'comm-chat-msg' + (isSelf ? ' self' : '');
  div.innerHTML = `
    <div class="comm-chat-msg-avatar" id="${avatarId}">${init}</div>
    <div class="comm-chat-msg-body">
      <div class="comm-chat-msg-name">${escHtml(msg.userName || 'Anonymous')} • Sem ${msg.userSemester || '?'}</div>
      <div class="comm-chat-msg-text">${escHtml(msg.message || '')}</div>
      <div class="comm-chat-msg-time">${commTimeStamp(msg.timestamp)}</div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Load avatar photo
  loadAndRenderAvatar(msg.userId, init, avatarId);
}

function commSendChat() {
  if (!commUser || !db) return;
  const input = document.getElementById('commChatInput');
  const text = input?.value.trim();
  if (!text) return;

  db.ref('community_chat').push({
    userId: commUser.uid,
    userName: commUser.name,
    userSemester: commUser.semester,
    message: text,
    timestamp: Date.now()
  }).then(() => {
    input.value = '';
    // Remove typing indicator
    db.ref('community_typing/' + commUser.uid).remove();
  });
}

function commTypingSignal() {
  if (!db || !commUser) return;
  const uid = commVisitorId();
  db.ref('community_typing/' + uid).set({ name: commUser.name, timestamp: Date.now() });

  clearTimeout(commTypingTimeout);
  commTypingTimeout = setTimeout(() => {
    db.ref('community_typing/' + uid).remove();
  }, 4000);
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================
function loadAnnouncements() {
  if (!db) return;
  const list = document.getElementById('commAnnounceList');
  const empty = document.getElementById('commAnnounceEmpty');

  db.ref('community_announcements').orderByChild('createdAt').on('value', snap => {
    if (!snap.exists()) {
      if (list) list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    let items = [];
    snap.forEach(child => items.push({ id: child.key, ...child.val() }));
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const readIds = JSON.parse(localStorage.getItem('comm_read_announces') || '[]');

    if (list) list.innerHTML = items.map((a, i) => {
      const isRead = readIds.includes(a.id);
      const type = a.type || 'info';
      return `<div class="comm-announce-card type-${type}" style="animation-delay:${i * 0.05}s">
        <div class="comm-announce-top">
          <span class="comm-announce-type ${type}">${type === 'info' ? '🔵 Info' : type === 'update' ? '🟢 Update' : type === 'exam' ? '🟡 Exam' : '🔴 Alert'}</span>
          <span class="comm-announce-date">${commTimeAgo(a.createdAt)}</span>
        </div>
        <div class="comm-announce-title">${escHtml(a.title || '')}</div>
        <div class="comm-announce-msg">${escHtml(a.message || '')}</div>
        ${!isRead ? `<div class="comm-announce-read" onclick="commMarkRead('${a.id}', this)">Mark as read ✓</div>` : '<div style="font-size:0.72rem;color:var(--success);margin-top:8px;font-weight:600;">✅ Read</div>'}
      </div>`;
    }).join('');
  });
}

function commMarkRead(id, el) {
  const readIds = JSON.parse(localStorage.getItem('comm_read_announces') || '[]');
  if (!readIds.includes(id)) readIds.push(id);
  localStorage.setItem('comm_read_announces', JSON.stringify(readIds));
  if (el) { el.innerHTML = '✅ Read'; el.style.cursor = 'default'; el.onclick = null; }
}

// ============================================================
// ADMIN: Community Management Functions
// (Called from admin.html via script.js switchAdminTab)
// ============================================================
function loadAdminCommunityTab() {
  if (!db) return;
  loadAdminCommStats();
  loadAdminCommUsers();
  loadAdminCommDoubts();
  loadAdminCommChat();
}

function loadAdminCommStats() {
  if (!db) return;
  db.ref('community_users').once('value', snap => {
    const el = document.getElementById('commAdminUserCount');
    if (el) el.textContent = snap.numChildren() || 0;
  });
  db.ref('community_doubts').once('value', snap => {
    const el = document.getElementById('commAdminDoubtCount');
    if (el) el.textContent = snap.numChildren() || 0;
  });
  db.ref('community_chat').once('value', snap => {
    const el = document.getElementById('commAdminChatCount');
    if (el) el.textContent = snap.numChildren() || 0;
  });
  db.ref('community_online').once('value', snap => {
    const el = document.getElementById('commAdminOnlineCount');
    if (el) el.textContent = snap.numChildren() || 0;
  });
}

function loadAdminCommUsers() {
  if (!db) return;
  const container = document.getElementById('commAdminUsersTable');
  if (!container) return;
  db.ref('community_users').once('value', snap => {
    if (!snap.exists()) { container.innerHTML = '<p style="color:var(--text-muted);padding:16px;">No users yet.</p>'; return; }
    let users = [];
    snap.forEach(child => users.push({ id: child.key, ...child.val() }));
    users.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
    container.innerHTML = `<table class="comm-admin-table">
      <thead><tr><th>Name</th><th>Sem</th><th>Roll No</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>${users.map(u => `<tr>
        <td>${escHtml(u.name || '')}</td><td>${u.semester || '—'}</td>
        <td>${escHtml(u.rollNo || '—')}</td><td>${commTimeAgo(u.joinedAt)}</td>
        <td><button class="comm-admin-del" onclick="commAdminBanUser('${u.id}', ${!!u.banned})">${u.banned ? '🔓 Unban' : '🚫 Ban'}</button></td>
      </tr>`).join('')}</tbody>
    </table>`;
  });
}

function loadAdminCommDoubts() {
  if (!db) return;
  const container = document.getElementById('commAdminDoubtsList');
  if (!container) return;
  db.ref('community_doubts').orderByChild('timestamp').once('value', snap => {
    if (!snap.exists()) { container.innerHTML = '<p style="color:var(--text-muted);padding:16px;">No doubts yet.</p>'; return; }
    let items = [];
    snap.forEach(child => items.push({ id: child.key, ...child.val() }));
    items.reverse();
    container.innerHTML = items.slice(0, 30).map(d => `
      <div class="comm-doubt-card" style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <div style="font-weight:700;margin-bottom:4px;">${escHtml(d.title || '')}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">by ${escHtml(d.userName || '?')} • Sem ${d.semester || '?'} • ${commTimeAgo(d.timestamp)}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="comm-admin-pin" onclick="commAdminPinDoubt('${d.id}', ${!!d.pinned})">${d.pinned ? '📌 Unpin' : '📌 Pin'}</button>
            <button class="comm-admin-del" onclick="commAdminDeleteDoubt('${d.id}')">🗑️ Del</button>
          </div>
        </div>
      </div>
    `).join('');
  });
}

function loadAdminCommChat() {
  if (!db) return;
  const container = document.getElementById('commAdminChatList');
  if (!container) return;
  db.ref('community_chat').orderByChild('timestamp').limitToLast(20).once('value', snap => {
    if (!snap.exists()) { container.innerHTML = '<p style="color:var(--text-muted);padding:16px;">No messages yet.</p>'; return; }
    let items = [];
    snap.forEach(child => items.push({ id: child.key, ...child.val() }));
    items.reverse();
    container.innerHTML = items.map(m => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
        <div><strong>${escHtml(m.userName || '?')}</strong>: ${escHtml(m.message || '')}</div>
        <button class="comm-admin-del" onclick="commAdminDeleteChat('${m.id}')">🗑️</button>
      </div>
    `).join('');
  });
}

function commAdminPostAnnouncement() {
  if (!db) return;
  const title = document.getElementById('commAdminAnnTitle')?.value.trim();
  const message = document.getElementById('commAdminAnnMsg')?.value.trim();
  const type = document.getElementById('commAdminAnnType')?.value || 'info';
  if (!title || !message) { showToast('❌ Fill in title and message.', 'error'); return; }

  db.ref('community_announcements').push({
    title, message, type, createdAt: Date.now(), postedBy: 'Admin'
  }).then(() => {
    showToast('📢 Announcement posted!', 'success');
    document.getElementById('commAdminAnnTitle').value = '';
    document.getElementById('commAdminAnnMsg').value = '';
  }).catch(() => showToast('❌ Failed to post.', 'error'));
}

function commAdminDeleteDoubt(id) {
  if (!confirm('Delete this doubt?')) return;
  db.ref('community_doubts/' + id).remove().then(() => showToast('🗑️ Deleted.', 'success'));
  loadAdminCommDoubts();
}

function commAdminPinDoubt(id, isPinned) {
  db.ref('community_doubts/' + id).update({ pinned: !isPinned }).then(() => {
    showToast(isPinned ? '📌 Unpinned.' : '📌 Pinned!', 'success');
    loadAdminCommDoubts();
  });
}

function commAdminDeleteChat(id) {
  if (!confirm('Delete this message?')) return;
  db.ref('community_chat/' + id).remove().then(() => { showToast('🗑️ Deleted.', 'success'); loadAdminCommChat(); });
}

function commAdminBanUser(id, isBanned) {
  db.ref('community_users/' + id).update({ banned: !isBanned }).then(() => {
  });
}

// ============================================================
// VOTING SYSTEM — Core Logic
// ============================================================
let pollTimers = {};

function loadLivePolls() {
  if (!db) return;
  const list = document.getElementById('commVotingList');
  const empty = document.getElementById('commVotingEmpty');
  const rollNo = commUser ? commUser.rollNo : null;

  db.ref('community_polls').on('value', snap => {
    if (!snap.exists()) {
      if (list) list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    
    let polls = [];
    snap.forEach(child => polls.push({ id: child.key, ...child.val() }));
    polls.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // For each poll, we also need to listen for votes
    renderPolls(polls, list);
  });
}

function renderPolls(polls, container) {
  if (!container) return;
  const rollNo = commUser ? commUser.rollNo : 'GUEST';

  container.innerHTML = polls.map((p, i) => {
    const isEnded = p.endTime <= Date.now();
    const isActive = p.isActive !== false;
    
    return `<div class="poll-card" id="poll-${p.id}" style="animation-delay:${i * 0.1}s">
      <div class="poll-category">${p.category || 'General'}</div>
      <div class="poll-title">${escHtml(p.title)}</div>
      <div class="poll-desc">${escHtml(p.description || '')}</div>
      
      <div class="poll-options" id="options-${p.id}">
        <div class="comm-skeleton"><div class="comm-skel-line"></div><div class="comm-skel-line"></div></div>
      </div>

      <div class="poll-footer">
        <div class="poll-timer" id="timer-${p.id}">
          ⏳ ${isEnded ? 'Ended' : 'Loading...'}
        </div>
        <div id="poll-status-${p.id}"></div>
      </div>
    </div>`;
  }).join('');

  // Start listeners for each poll's votes and update timers
  polls.forEach(p => {
    setupPollListener(p);
  });
}

function setupPollListener(poll) {
  if (!db) return;
  const rollNo = commUser ? commUser.rollNo : null;
  const optionsContainer = document.getElementById(`options-${poll.id}`);
  const timerEl = document.getElementById(`timer-${poll.id}`);

  // 1. Vote Listener
  db.ref(`community_votes/${poll.id}`).on('value', snap => {
    const votes = snap.val() || {};
    const totalVotes = Object.keys(votes).length;
    const userVote = rollNo ? votes[rollNo] : null;
    const isEnded = poll.endTime <= Date.now();
    
    // Calculate Option Percentages
    const counts = {};
    Object.values(votes).forEach(v => {
      counts[v.optionId] = (counts[v.optionId] || 0) + 1;
    });

    // Determine Winner if Ended
    let winnerText = '';
    let maxVotes = -1;
    let winnerOption = '';
    if (isEnded && totalVotes > 0) {
      poll.options.forEach((opt, idx) => {
        const optId = `opt-${idx}`;
        const count = counts[optId] || 0;
        if (count > maxVotes) {
          maxVotes = count;
          winnerOption = opt;
        } else if (count === maxVotes && maxVotes > 0) {
          winnerOption += ` & ${opt}`; // Tie
        }
      });
      winnerText = `🏆 Winner: ${escHtml(winnerOption)}! 🎉`;
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = poll.options.map((opt, idx) => {
        const optId = `opt-${idx}`;
        const count = counts[optId] || 0;
        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isVoted = userVote && userVote.optionId === optId;
        const showResult = isEnded || isVoted; 

        return `
          <div class="poll-opt ${isVoted ? 'voted' : ''} ${isEnded ? 'ended' : ''}" onclick="castVote('${poll.id}', '${optId}', ${isEnded || !poll.isActive || !!userVote})">
            <div class="opt-progress" style="width: ${showResult ? percent : 0}%"></div>
            <span class="opt-text">${escHtml(opt)}</span>
            ${showResult ? `<span class="opt-percent">${percent}%</span>` : `<div class="opt-radio"></div>`}
          </div>
        `;
      }).join('');
    }

    const statusEl = document.getElementById(`poll-status-${poll.id}`);
    if (statusEl) {
      if (isEnded) {
        statusEl.innerHTML = `
          <div class="poll-winner-wrap">
            <div class="winner-congrats">Congratulations!</div>
            <div class="winner-name">${winnerText || 'No votes cast'}</div>
            <div class="final-stats">Total Votes: ${totalVotes} • 100% Accurate Data</div>
          </div>
        `;
      }
      else if (userVote) statusEl.innerHTML = `<span style="font-size:0.75rem; color:var(--primary); font-weight:700;">✅ Voted (Results hidden until end)</span>`;
    }
  });

  // 2. Timer Update
  if (pollTimers[poll.id]) clearInterval(pollTimers[poll.id]);
  pollTimers[poll.id] = setInterval(() => {
    const now = Date.now();
    const diff = poll.endTime - now;
    if (diff <= 0) {
      if (timerEl) timerEl.innerHTML = '🏁 Poll Ended';
      clearInterval(pollTimers[poll.id]);
      return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (timerEl) {
      timerEl.innerHTML = `⏳ ${h > 0 ? h + 'h ' : ''}${m}m ${s}s left`;
      if (diff < 300000) timerEl.classList.add('urgent');
    }
  }, 1000);
}

function castVote(pollId, optionId, disabled) {
  if (disabled || !db || !commUser) {
    if (!commUser) showToast('❌ Please register to vote.', 'error');
    return;
  }
  
  // Accuracy Check: Check if poll is still active and not expired
  db.ref(`community_polls/${pollId}`).once('value').then(snap => {
    const poll = snap.val();
    if (!poll || !poll.isActive || (poll.endTime && Date.now() > poll.endTime)) {
      showToast('⚠️ This poll has ended or is no longer active.', 'warning');
      return;
    }

    const rollNo = commUser.rollNo;
    db.ref(`community_votes/${pollId}/${rollNo}`).set({
      optionId,
      username: commUser.name,
      timestamp: Date.now()
    }).then(() => {
      showToast('🎉 Vote cast successfully!', 'success');
    });
  });
}

// ============================================================
// ADMIN VOTING HUB LOGIC
// ============================================================
function loadAdminVotingTab() {
  if (!db) return;
  loadAdminPolls();
  updateAdminVotingStats();
}

function adminCreatePoll() {
  if (!db) return;
  const title = document.getElementById('pollTitle').value.trim();
  const desc = document.getElementById('pollDesc').value.trim();
  const cat = document.getElementById('pollCategory').value;
  const duration = parseInt(document.getElementById('pollDuration').value);
  const loader = document.getElementById('pollLoader');
  
  // Collect options from dynamic inputs
  const optionInputs = document.querySelectorAll('.poll-opt-input');
  const options = Array.from(optionInputs)
    .map(input => input.value.trim())
    .filter(val => val !== '');

  if (!title || isNaN(duration) || options.length < 2) {
    showToast('❌ Please fill title, duration and at least 2 options.', 'error');
    return;
  }

  if (loader) loader.style.display = 'block';

  const pollId = 'poll_' + Date.now();
  db.ref(`community_polls/${pollId}`).set({
    title, description: desc,
    category: cat,
    createdAt: Date.now(),
    endTime: Date.now() + (duration * 60000),
    isActive: true,
    options: options
  }).then(() => {
    showToast('🚀 Poll launched!', 'success');
    document.getElementById('pollTitle').value = '';
    document.getElementById('pollDesc').value = '';
    // Reset options to initial 2
    const container = document.getElementById('pollOptionsContainer');
    if (container) {
      container.innerHTML = `
        <div class="poll-opt-field" style="display:flex; gap:8px;">
          <input type="text" class="poll-opt-input" placeholder="Option 1" style="flex:1;" />
          <button type="button" class="btn-outline" style="padding:0 12px; opacity:0; pointer-events:none;">×</button>
        </div>
        <div class="poll-opt-field" style="display:flex; gap:8px;">
          <input type="text" class="poll-opt-input" placeholder="Option 2" style="flex:1;" />
          <button type="button" class="btn-outline" style="padding:0 12px; opacity:0; pointer-events:none;">×</button>
        </div>
      `;
    }
    if (loader) loader.style.display = 'none';
    loadAdminPolls();
  }).catch(() => {
    if (loader) loader.style.display = 'none';
    showToast('❌ Failed to launch poll.', 'error');
  });
}

function loadAdminPolls() {
  if (!db) return;
  const list = document.getElementById('adminPollsList');
  db.ref('community_polls').on('value', snap => {
    if (!snap.exists()) {
      list.innerHTML = '<p style="color:var(--text-muted); padding:20px;">No polls created yet.</p>';
      return;
    }
    let polls = [];
    snap.forEach(child => polls.push({ id: child.key, ...child.val() }));
    polls.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    list.innerHTML = polls.map(p => `
      <div class="admin-poll-card">
        <div class="admin-poll-info">
          <h4>${escHtml(p.title)}</h4>
          <div class="admin-poll-meta">
            ${p.category} • ${p.isActive ? '🟢 Active' : '🔴 Disabled'} • ${commTimeAgo(p.createdAt)}
          </div>
        </div>
        <div class="admin-poll-actions">
          <button class="admin-poll-btn" onclick="viewPollResults('${p.id}')">📊 Results</button>
          <button class="admin-poll-btn" onclick="adminTogglePoll('${p.id}', ${p.isActive})">${p.isActive ? 'Disable' : 'Enable'}</button>
          <button class="admin-poll-btn del" onclick="adminDeletePoll('${p.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  });
}

function adminTogglePoll(id, current) {
  db.ref(`community_polls/${id}`).update({ isActive: !current });
}

function adminDeletePoll(id) {
  if (!confirm('Delete this poll and all its votes?')) return;
  db.ref(`community_polls/${id}`).remove();
  db.ref(`community_votes/${id}`).remove();
  showToast('🗑️ Poll deleted.', 'success');
}

function addPollOptionField() {
  const container = document.getElementById('pollOptionsContainer');
  if (!container) return;
  
  const count = container.querySelectorAll('.poll-opt-field').length + 1;
  const div = document.createElement('div');
  div.className = 'poll-opt-field';
  div.style.display = 'flex';
  div.style.gap = '8px';
  div.innerHTML = `
    <input type="text" class="poll-opt-input" placeholder="Option ${count}" style="flex:1;" />
    <button type="button" class="btn-outline" onclick="removePollOptionField(this)" style="padding:0 12px; color:var(--accent-red); border-color:var(--accent-red-bg);">×</button>
  `;
  container.appendChild(div);
}

function removePollOptionField(btn) {
  const field = btn.closest('.poll-opt-field');
  if (field) field.remove();
}

let activeResPollId = null;
function viewPollResults(pollId) {
  if (!db) return;
  activeResPollId = pollId;
  const modal = document.getElementById('pollResultsModal');
  if (!modal) return;
  modal.classList.add('show');

  // Load Poll Info
  db.ref(`community_polls/${pollId}`).once('value', pSnap => {
    const p = pSnap.val();
    if (!p) return;
    document.getElementById('resPollTitle').textContent = p.title;
    document.getElementById('resPollMeta').textContent = `${p.category} • Created ${new Date(p.createdAt).toLocaleString()}`;

    // Load Votes Real-time
    db.ref(`community_votes/${pollId}`).on('value', vSnap => {
      const votes = vSnap.val() || {};
      const voteList = Object.entries(votes);
      document.getElementById('resVoteCount').textContent = voteList.length;

      // Calculate Stats
      const counts = {};
      p.options.forEach(opt => counts[opt] = 0);
      voteList.forEach(([roll, data]) => {
        if (counts.hasOwnProperty(data.optionId)) counts[data.optionId]++;
      });

      // Render Stats
      const statsHtml = p.options.map(opt => {
        const count = counts[opt] || 0;
        const pct = voteList.length > 0 ? (count / voteList.length * 100).toFixed(1) : 0;
        return `
          <div class="res-bar-item">
            <div class="res-bar-label">
              <span>${escHtml(opt)}</span>
              <span>${count} votes (${pct}%)</span>
            </div>
            <div class="res-bar-track"><div class="res-bar-fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('');
      document.getElementById('resPollStats').innerHTML = statsHtml;

      // Render Table
      const tableHtml = voteList.map(([roll, data]) => `
        <tr>
          <td><div style="font-weight:600;">${escHtml(data.username || 'Anonymous')}</div></td>
          <td><code style="font-size:0.75rem;">${roll}</code></td>
          <td><span class="badge-live" style="animation:none; background:var(--accent-blue-bg); color:var(--accent-blue); font-size:0.7rem;">${escHtml(data.optionId)}</span></td>
          <td style="font-size:0.7rem; color:var(--text-secondary);">${new Date(data.timestamp).toLocaleTimeString()}</td>
        </tr>
      `).reverse().join('');
      document.getElementById('resVotesTable').innerHTML = tableHtml || '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">No votes yet</td></tr>';
    });
  });
}

function closeResModal() {
  const modal = document.getElementById('pollResultsModal');
  if (modal) modal.classList.remove('show');
  if (activeResPollId) db.ref(`community_votes/${activeResPollId}`).off();
  activeResPollId = null;
}

function exportPollResults() {
  if (!activeResPollId || !db) return;
  db.ref(`community_votes/${activeResPollId}`).once('value', snap => {
    const votes = snap.val();
    if (!votes) return showToast('No data to export', 'info');
    
    let csv = 'Student Name,Roll Number,Selection,Timestamp\n';
    Object.entries(votes).forEach(([roll, data]) => {
      csv += `"${data.username}","${roll}","${data.optionId}","${new Date(data.timestamp).toLocaleString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `poll_results_${activeResPollId}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

function updateAdminVotingStats() {
  if (!db) return;
  db.ref('community_votes').on('value', snap => {
    const statsEl = document.getElementById('pollAdminStats');
    if (!snap.exists()) return;
    
    let totalVotes = 0;
    snap.forEach(p => { totalVotes += p.numChildren(); });
    
    statsEl.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:10px;">
        <div class="poll-admin-stat-card">
          <div class="poll-admin-stat-val">${totalVotes}</div>
          <div class="poll-admin-stat-lbl">Total Votes</div>
        </div>
        <div class="poll-admin-stat-card">
          <div class="poll-admin-stat-val" id="activePollCount">0</div>
          <div class="poll-admin-stat-lbl">Active Polls</div>
        </div>
      </div>
    `;
    
    db.ref('community_polls').once('value', pSnap => {
      let active = 0;
      pSnap.forEach(p => { if(p.val().isActive && p.val().endTime > Date.now()) active++; });
      const el = document.getElementById('activePollCount');
      if (el) el.textContent = active;
    });
  });
}

