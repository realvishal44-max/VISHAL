/* ============================================================
   BCA STORE — Self-Generated Analytics Engine v2.0
   No API. No cost. 100% local + optional Firebase sync.
   ============================================================ */

const BCA_Analytics = (() => {

  // ── SCHEMA ──────────────────────────────────────────────────
  const DEFAULT_SCHEMA = {
    version: 2,
    userName: '',
    totalStudyMinutes: 0,
    notesRead: {},        // { "Semester1_BCA-104": count }
    videosWatched: {},    // { "Semester1_BCA-104": count }
    videoMinutes: {},     // { "Semester1_BCA-104": totalMinutes }
    materialsClicked: {}, // { notes: n, video: n, pyq: n, program: n }
    completedSubjects: [],
    streakDays: 0,
    longestStreak: 0,
    lastLoginDate: '',
    activityLog: [],      // [{ date:"YYYY-MM-DD", minutes:N, actions:N }] last 49
    semesterProgress: {}, // { Semester1: 40 }
    subjectStats: {},     // { "Semester1_BCA-104": { notesOpened, videosWatched, xp, lastVisit } }
    xpPoints: 0,
    rank: 'Fresher 🌱',
    badges: [],           // ["7_day_streak", "note_master", ...]
    sessionStart: null,
    totalSessions: 0,
    pyqSolved: 0,
    labsCompleted: 0,
    pageVisits: {},
  };

  const LS_KEY = 'bca_analytics_v2';

  // ── XP RANK LADDER ──────────────────────────────────────────
  const RANKS = [
    { min: 0,    label: 'Fresher 🌱' },
    { min: 100,  label: 'Learner 📖' },
    { min: 300,  label: 'Scholar 🎓' },
    { min: 600,  label: 'Coder 💻' },
    { min: 1000, label: 'Pro Dev ⚡' },
    { min: 1500, label: 'Expert 🔥' },
    { min: 2500, label: 'Master 🏆' },
    { min: 4000, label: 'Legend 👑' },
    { min: 6000, label: 'Grandmaster 🚀' },
    { min: 9000, label: 'BCA GOD 🌟' },
  ];

  // ── BADGE DEFINITIONS ────────────────────────────────────────
  const BADGE_DEFS = [
    { id: 'first_login',    icon: '🎉', label: 'First Login',      desc: 'Joined BCA STORE',       xp: 10  },
    { id: 'streak_3',       icon: '🔥', label: '3-Day Streak',     desc: '3 days in a row',         xp: 30  },
    { id: 'streak_7',       icon: '⚡', label: '7-Day Streak',     desc: '7 days in a row',         xp: 70  },
    { id: 'streak_30',      icon: '💎', label: '30-Day Streak',    desc: '30 days in a row',        xp: 300 },
    { id: 'note_master',    icon: '📘', label: 'Note Master',      desc: 'Read 10+ notes',          xp: 50  },
    { id: 'video_watcher',  icon: '🎥', label: 'Video Watcher',    desc: 'Watched 5+ videos',       xp: 50  },
    { id: 'pyq_solver',     icon: '📄', label: 'PYQ Solver',       desc: 'Opened 10+ PYQs',         xp: 60  },
    { id: 'completer',      icon: '✅', label: 'Completer',        desc: 'Completed a subject',     xp: 100 },
    { id: 'speedrun',       icon: '🏃', label: 'Speed Learner',    desc: '3 subjects in one day',   xp: 80  },
    { id: 'all_rounder',    icon: '🎯', label: 'All-Rounder',      desc: 'Used all 4 content types',xp: 90  },
    { id: 'sem1_done',      icon: '1️⃣', label: 'Sem 1 Champion',   desc: 'Completed Semester 1',    xp: 200 },
    { id: 'sem2_done',      icon: '2️⃣', label: 'Sem 2 Champion',   desc: 'Completed Semester 2',    xp: 200 },
    { id: 'sem3_done',      icon: '3️⃣', label: 'Sem 3 Champion',   desc: 'Completed Semester 3',    xp: 200 },
    { id: 'night_owl',      icon: '🦉', label: 'Night Owl',        desc: 'Studied after midnight',  xp: 40  },
    { id: 'early_bird',     icon: '🌅', label: 'Early Bird',       desc: 'Studied before 7 AM',     xp: 40  },
    { id: 'bookmarker',     icon: '🔖', label: 'Bookmarker',       desc: 'Saved 5+ bookmarks',      xp: 30  },
  ];

  // ── PRIVATE STATE ────────────────────────────────────────────
  let _data = null;
  let _sessionTimer = null;
  let _sessionMinutes = 0;

  // ── LOAD / SAVE ──────────────────────────────────────────────
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        _data = { ...DEFAULT_SCHEMA, ...JSON.parse(raw) };
      } else {
        _data = { ...DEFAULT_SCHEMA };
      }
    } catch {
      _data = { ...DEFAULT_SCHEMA };
    }
    _data.userName = localStorage.getItem('userName') || _data.userName || 'Student';
    return _data;
  }

  function save() {
    if (!_data) return;
    _data.userName = localStorage.getItem('userName') || _data.userName;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(_data));
    } catch { }
    // Optional Firebase sync (fire-and-forget)
    _syncToFirebase();
  }

  function _syncToFirebase() {
    try {
      if (typeof db !== 'undefined' && db && _data.userName) {
        const safeKey = _data.userName.replace(/[.#$\[\]]/g, '_').toLowerCase();
        db.ref('analytics/' + safeKey).set({
          xp: _data.xpPoints,
          rank: _data.rank,
          streak: _data.streakDays,
          totalStudyMinutes: _data.totalStudyMinutes,
          completedSubjects: _data.completedSubjects.length,
          badges: _data.badges.length,
          lastSeen: new Date().toISOString(),
        });
      }
    } catch { }
  }

  // ── UTILS ────────────────────────────────────────────────────
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function _getTodayLog() {
    const today = todayStr();
    let entry = _data.activityLog.find(l => l.date === today);
    if (!entry) {
      entry = { date: today, minutes: 0, actions: 0 };
      _data.activityLog.push(entry);
      // Keep only last 49 days
      if (_data.activityLog.length > 49) {
        _data.activityLog = _data.activityLog.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 49);
      }
    }
    return entry;
  }

  function _ensureSubjectStat(key) {
    if (!_data.subjectStats[key]) {
      _data.subjectStats[key] = { notesOpened: 0, videosWatched: 0, pyqOpened: 0, xp: 0, lastVisit: '' };
    }
    return _data.subjectStats[key];
  }

  function _addXP(amount, reason) {
    _data.xpPoints = (_data.xpPoints || 0) + amount;
    _updateRank();
    // Log XP gain to console nicely
    console.log(`%c⚡ +${amount} XP — ${reason}`, 'color:#818cf8;font-weight:bold');
  }

  function _updateRank() {
    const xp = _data.xpPoints;
    let rank = RANKS[0].label;
    for (const r of RANKS) {
      if (xp >= r.min) rank = r.label;
    }
    _data.rank = rank;
  }

  function _unlockBadge(id) {
    if (_data.badges.includes(id)) return;
    _data.badges.push(id);
    const def = BADGE_DEFS.find(b => b.id === id);
    if (def) {
      _addXP(def.xp, 'Badge: ' + def.label);
      _showBadgeToast(def);
    }
  }

  function _showBadgeToast(def) {
    // Try platform showToast, fallback to custom
    const msg = `${def.icon} Badge Unlocked: <strong>${def.label}</strong><br><small>${def.desc} +${def.xp} XP</small>`;
    if (typeof showToast === 'function') {
      showToast(`${def.icon} Badge: ${def.label} (+${def.xp} XP)`, 'success');
    } else {
      const t = document.createElement('div');
      t.className = 'bca-badge-toast';
      t.innerHTML = msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('show'), 50);
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3500);
    }
  }

  // ── STREAK SYSTEM ────────────────────────────────────────────
  function updateStreak() {
    if (!_data) load();
    const today = todayStr();
    if (_data.lastLoginDate === today) return; // already counted

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (_data.lastLoginDate === yesterdayStr) {
      _data.streakDays = (_data.streakDays || 0) + 1;
    } else if (_data.lastLoginDate !== today) {
      _data.streakDays = 1; // reset
    }

    _data.longestStreak = Math.max(_data.longestStreak || 0, _data.streakDays);
    _data.lastLoginDate = today;

    // Streak badges
    if (_data.streakDays >= 3)  _unlockBadge('streak_3');
    if (_data.streakDays >= 7)  _unlockBadge('streak_7');
    if (_data.streakDays >= 30) _unlockBadge('streak_30');

    // First login badge
    if (!_data.badges.includes('first_login')) _unlockBadge('first_login');

    // Night owl / early bird
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 5)  _unlockBadge('night_owl');
    if (hour >= 5 && hour < 7)  _unlockBadge('early_bird');

    _addXP(5, 'Daily login');
    save();
  }

  // ── SESSION TRACKING ─────────────────────────────────────────
  function trackSessionStart() {
    if (!_data) load();
    _data.sessionStart = Date.now();
    _data.totalSessions = (_data.totalSessions || 0) + 1;
    updateStreak();

    // tick every minute
    clearInterval(_sessionTimer);
    _sessionMinutes = 0;
    _sessionTimer = setInterval(() => {
      _sessionMinutes++;
      _data.totalStudyMinutes = (_data.totalStudyMinutes || 0) + 1;
      const log = _getTodayLog();
      log.minutes++;
      log.actions++;
      if (_sessionMinutes % 5 === 0) save(); // save every 5 min
    }, 60000);

    window.addEventListener('beforeunload', trackSessionEnd);
    save();
  }

  function trackSessionEnd() {
    clearInterval(_sessionTimer);
    if (!_data) return;
    if (_sessionMinutes > 0) {
      _addXP(Math.floor(_sessionMinutes / 5), `Study session (${_sessionMinutes} min)`);
      save();
    }
  }

  // ── CONTENT TRACKING ─────────────────────────────────────────
  function trackNoteOpen(semKey, subjectCode) {
    if (!_data) load();
    const key = semKey + '_' + subjectCode;
    _data.notesRead[key] = (_data.notesRead[key] || 0) + 1;
    const stat = _ensureSubjectStat(key);
    stat.notesOpened++;
    stat.lastVisit = todayStr();
    _data.materialsClicked.notes = (_data.materialsClicked.notes || 0) + 1;
    _getTodayLog().actions++;
    _addXP(2, 'Note opened');

    // Badges
    const totalNotes = Object.values(_data.notesRead).reduce((s, v) => s + v, 0);
    if (totalNotes >= 10) _unlockBadge('note_master');
    _checkAllRounder();
    save();
  }

  function trackVideoWatch(semKey, subjectCode, minutes = 0) {
    if (!_data) load();
    const key = semKey + '_' + subjectCode;
    _data.videosWatched[key] = (_data.videosWatched[key] || 0) + 1;
    _data.videoMinutes[key] = (_data.videoMinutes[key] || 0) + minutes;
    _data.totalStudyMinutes = (_data.totalStudyMinutes || 0) + minutes;
    const stat = _ensureSubjectStat(key);
    stat.videosWatched++;
    stat.lastVisit = todayStr();
    _data.materialsClicked.video = (_data.materialsClicked.video || 0) + 1;
    _getTodayLog().actions++;
    _addXP(5 + Math.floor(minutes / 2), 'Video watched');

    // Badges
    const totalVids = Object.values(_data.videosWatched).reduce((s, v) => s + v, 0);
    if (totalVids >= 5) _unlockBadge('video_watcher');
    _checkAllRounder();
    save();
  }

  function trackMaterialClick(type, semKey, subjectCode) {
    if (!_data) load();
    const key = semKey + '_' + (subjectCode || 'general');
    _data.materialsClicked[type] = (_data.materialsClicked[type] || 0) + 1;
    _ensureSubjectStat(key).lastVisit = todayStr();
    _getTodayLog().actions++;

    if (type === 'pyq' || type === 'pyq_solve') {
      _data.pyqSolved = (_data.pyqSolved || 0) + 1;
      _addXP(3, 'PYQ opened');
      if (_data.pyqSolved >= 10) _unlockBadge('pyq_solver');
    } else if (type === 'notes') {
      if (semKey && subjectCode) trackNoteOpen(semKey, subjectCode);
      return; // trackNoteOpen handles XP
    } else if (type === 'video') {
      _addXP(1, 'Video item clicked');
    } else if (type === 'program') {
      _addXP(2, 'Program opened');
      _data.labsCompleted = (_data.labsCompleted || 0) + 1;
    }
    _checkAllRounder();
    save();
  }

  function trackSubjectComplete(semKey, subjectCode, subjectName) {
    if (!_data) load();
    const key = semKey + '_' + subjectCode;
    if (!_data.completedSubjects.includes(key)) {
      _data.completedSubjects.push(key);
      _addXP(100, 'Subject completed: ' + subjectName);
      _unlockBadge('completer');

      // Check for today's speed-run (3 completions in one day)
      const today = todayStr();
      const todayDone = _data.completedSubjects.filter(k => {
        const stat = _data.subjectStats[k];
        return stat && stat.lastVisit === today;
      });
      if (todayDone.length >= 3) _unlockBadge('speedrun');

      // Semester completion badges
      const sem1Codes = ['BCA-101','BCA-102','BCA-103','BCA-104','BCA-105','BCA-106'];
      const sem2Codes = ['BCA-201','BCA-202','BCA-203','BCA-204','BCA-205','BCA-206'];
      const sem3Codes = ['BCA-301','BCA-302','BCA-303','BCA-304','BCA-305','BCA-306'];
      if (sem1Codes.every(c => _data.completedSubjects.includes('Semester1_' + c))) _unlockBadge('sem1_done');
      if (sem2Codes.every(c => _data.completedSubjects.includes('Semester2_' + c))) _unlockBadge('sem2_done');
      if (sem3Codes.every(c => _data.completedSubjects.includes('Semester3_' + c))) _unlockBadge('sem3_done');
    }
    save();
  }

  function trackSubjectIncomplete(semKey, subjectCode) {
    if (!_data) load();
    const key = semKey + '_' + subjectCode;
    _data.completedSubjects = _data.completedSubjects.filter(k => k !== key);
    save();
  }

  function trackPageVisit(page, subjectKey) {
    if (!_data) load();
    _data.pageVisits[page] = (_data.pageVisits[page] || 0) + 1;
    if (subjectKey) _ensureSubjectStat(subjectKey).lastVisit = todayStr();
    _getTodayLog().actions++;
    save();
  }

  function trackBookmark() {
    if (!_data) load();
    const bk = JSON.parse(localStorage.getItem('bookmarks_v2') || '[]');
    if (bk.length >= 5) _unlockBadge('bookmarker');
    save();
  }

  // ── ALL-ROUNDER CHECK ────────────────────────────────────────
  function _checkAllRounder() {
    const mc = _data.materialsClicked;
    if (mc.notes > 0 && mc.video > 0 && mc.pyq > 0 && mc.program > 0) {
      _unlockBadge('all_rounder');
    }
  }

  // ── INTELLIGENCE / ANALYSIS ──────────────────────────────────
  function getWeakSubjects(SUBJECTS_OBJ) {
    if (!_data) load();
    const weak = [];
    if (!SUBJECTS_OBJ) return weak;
    for (const [semKey, subjects] of Object.entries(SUBJECTS_OBJ)) {
      for (const sub of subjects) {
        const key = semKey + '_' + sub.code;
        const stat = _data.subjectStats[key];
        if (!stat) continue;
        const isCompleted = _data.completedSubjects.includes(key);
        const lowActivity = (stat.notesOpened || 0) < 2 && (stat.videosWatched || 0) < 1;
        if (!isCompleted && lowActivity && stat.lastVisit) {
          weak.push({ key, name: sub.name, icon: sub.icon, semKey });
        }
      }
    }
    return weak.slice(0, 5);
  }

  function getStrongSubjects(SUBJECTS_OBJ) {
    if (!_data) load();
    const strong = [];
    if (!SUBJECTS_OBJ) return strong;
    for (const [semKey, subjects] of Object.entries(SUBJECTS_OBJ)) {
      for (const sub of subjects) {
        const key = semKey + '_' + sub.code;
        const stat = _data.subjectStats[key];
        if (!stat) continue;
        const isCompleted = _data.completedSubjects.includes(key);
        const highActivity = (stat.notesOpened || 0) >= 3 || (stat.videosWatched || 0) >= 2 || isCompleted;
        if (highActivity) {
          strong.push({ key, name: sub.name, icon: sub.icon, semKey, isCompleted });
        }
      }
    }
    return strong.slice(0, 5);
  }

  function getExamReadiness() {
    if (!_data) load();
    const factors = {
      completion: Math.min(_data.completedSubjects.length * 8, 40),
      studyTime:  Math.min(Math.floor(_data.totalStudyMinutes / 60) * 5, 25),
      streak:     Math.min(_data.streakDays * 2, 15),
      resources:  Math.min(
        (Object.values(_data.notesRead).reduce((s, v) => s + v, 0) * 0.5) +
        (Object.values(_data.videosWatched).reduce((s, v) => s + v, 0) * 1) +
        (_data.pyqSolved * 0.8),
        20
      ),
    };
    return Math.min(Math.round(Object.values(factors).reduce((a, b) => a + b, 0)), 100);
  }

  function getProductivityScore() {
    if (!_data) load();
    const hours = _data.totalStudyMinutes / 60;
    const actions = Object.values(_data.materialsClicked).reduce((s, v) => s + v, 0);
    const streakBonus = _data.streakDays * 0.1;
    const base = Math.min((hours * 0.5) + (actions * 0.2) + streakBonus, 9.9);
    return Math.max(base, 0).toFixed(1);
  }

  function getSmartSuggestions() {
    if (!_data) load();
    const tips = [];
    const studyHours = _data.totalStudyMinutes / 60;
    const readiness = getExamReadiness();

    if (studyHours < 1) tips.push({ icon: '⏰', text: 'Study time is low. Even 30 minutes daily makes a big difference!', type: 'warning' });
    if (_data.streakDays === 0) tips.push({ icon: '🔥', text: 'Start your study streak today! Consistency is the key to success.', type: 'info' });
    if (_data.streakDays > 0 && _data.streakDays < 7) tips.push({ icon: '⚡', text: `Keep going! You're ${7 - _data.streakDays} day(s) away from your 7-day streak badge.`, type: 'success' });
    if (!_data.materialsClicked.video) tips.push({ icon: '🎥', text: 'You haven\'t watched any videos yet. Video lectures can boost understanding!', type: 'info' });
    if (!_data.materialsClicked.pyq) tips.push({ icon: '📄', text: 'Solve Previous Year Questions to prepare for exams effectively.', type: 'warning' });
    if (_data.completedSubjects.length === 0) tips.push({ icon: '✅', text: 'Mark your first subject as complete to earn the Completer badge!', type: 'info' });
    if (readiness < 30) tips.push({ icon: '📊', text: `Exam readiness is at ${readiness}%. Increase your study sessions!`, type: 'warning' });
    if (readiness >= 80) tips.push({ icon: '🎯', text: `Excellent! Your exam readiness is ${readiness}%. You're well prepared!`, type: 'success' });
    if (studyHours >= 10) tips.push({ icon: '🏆', text: `You've studied for ${Math.floor(studyHours)} hours total. Amazing dedication!`, type: 'success' });

    return tips.slice(0, 4);
  }

  function getNextRank() {
    const xp = _data ? _data.xpPoints : 0;
    const idx = RANKS.findLastIndex(r => xp >= r.min);
    return RANKS[idx + 1] || null;
  }

  function getXPToNextRank() {
    const next = getNextRank();
    if (!next) return 0;
    return next.min - (_data ? _data.xpPoints : 0);
  }

  function getXPProgress() {
    if (!_data) load();
    const xp = _data.xpPoints;
    const idx = RANKS.findLastIndex(r => xp >= r.min);
    const currentMin = RANKS[idx]?.min || 0;
    const nextMin = RANKS[idx + 1]?.min || currentMin + 1000;
    return Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100);
  }

  function getActivityHeatmap() {
    if (!_data) load();
    const map = {};
    _data.activityLog.forEach(l => { map[l.date] = l.actions; });
    return map;
  }

  function getTotalNotesRead() {
    if (!_data) load();
    return Object.values(_data.notesRead).reduce((s, v) => s + v, 0);
  }

  function getTotalVideosWatched() {
    if (!_data) load();
    return Object.values(_data.videosWatched).reduce((s, v) => s + v, 0);
  }

  function getSubjectProgress(semKey, subjectCode, totalMaterials = 10) {
    if (!_data) load();
    const key = semKey + '_' + subjectCode;
    if (_data.completedSubjects.includes(key)) return 100;
    const stat = _data.subjectStats[key];
    if (!stat) return 0;
    const interactions = (stat.notesOpened || 0) + (stat.videosWatched || 0) + (stat.pyqOpened || 0);
    return Math.min(Math.round((interactions / totalMaterials) * 100), 95);
  }

  function getData() {
    if (!_data) load();
    return _data;
  }

  function getBadgeDefs() { return BADGE_DEFS; }
  function getRanks() { return RANKS; }

  // ── INIT ─────────────────────────────────────────────────────
  load();

  return {
    load, save, getData,
    updateStreak,
    trackSessionStart, trackSessionEnd,
    trackNoteOpen, trackVideoWatch,
    trackMaterialClick, trackPageVisit, trackBookmark,
    trackSubjectComplete, trackSubjectIncomplete,
    getWeakSubjects, getStrongSubjects,
    getExamReadiness, getProductivityScore,
    getSmartSuggestions, getNextRank, getXPToNextRank,
    getXPProgress, getActivityHeatmap,
    getTotalNotesRead, getTotalVideosWatched,
    getSubjectProgress,
    getBadgeDefs, getRanks,
    BADGE_DEFS, RANKS,
  };
})();

// ── GLOBAL BADGE TOAST STYLES ────────────────────────────────
(function injectBadgeToastStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .bca-badge-toast {
      position: fixed; bottom: 90px; right: 24px; z-index: 99999;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; padding: 14px 20px; border-radius: 16px;
      font-size: 0.88rem; line-height: 1.5; max-width: 280px;
      box-shadow: 0 8px 32px rgba(99,102,241,0.5);
      transform: translateX(120%); opacity: 0;
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
      pointer-events: none;
    }
    .bca-badge-toast.show { transform: translateX(0); opacity: 1; }
  `;
  document.head.appendChild(style);
})();
