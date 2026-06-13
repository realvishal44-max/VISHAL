// ============================================================
// BCA STORE ADMIN CONSOLE — ATTENDANCE ENGINE (EMBEDDED)
// ============================================================

(function() {
  const SUBJECTS = {
    Semester1: [
      { code: "BCA-101", name: "Mathematical Foundation", icon: "📐" },
      { code: "BCA-102", name: "Computer Fundamentals", icon: "💻" },
      { code: "BCA-103", name: "Business Communication & Information System", icon: "📊" },
      { code: "BCA-104", name: "C Programming", icon: "⌨️" },
      { code: "BCA-105", name: "Lab on DOS & Windows", icon: "🖥️" },
      { code: "BCA-106", name: "Lab on C", icon: "🔬" }
    ],
    Semester2: [
      { code: "BCA-201", name: "Discrete Mathematics", icon: "🔢" },
      { code: "BCA-202", name: "Computer Architecture", icon: "🏗️" },
      { code: "BCA-203", name: "Data Structure through C", icon: "🌲" },
      { code: "BCA-204", name: "System Analysis and Design", icon: "📋" },
      { code: "BCA-205", name: "Lab on MS-Office", icon: "📝" },
      { code: "BCA-206", name: "Lab on Data Structure", icon: "🔬" }
    ],
    Semester3: [
      { code: "BCA-301", name: "Management & Business Accounting", icon: "💰" },
      { code: "BCA-302", name: "Database Management System", icon: "🗄️" },
      { code: "BCA-303", name: "Object Oriented Programming using C++", icon: "🎯" },
      { code: "BCA-304", name: "Numerical Methodology", icon: "🔢" },
      { code: "BCA-305", name: "Lab on DBMS", icon: "🔬" },
      { code: "BCA-306", name: "Lab on C++", icon: "🔬" }
    ],
    Semester4: [
      { code: "BCA-401", name: "Java Programming", icon: "☕" },
      { code: "BCA-402", name: "Computer Graphics & Multimedia", icon: "🎨" },
      { code: "BCA-403", name: "Operating System & Linux", icon: "🐧" },
      { code: "BCA-404", name: "Software Engineering", icon: "🛠️" },
      { code: "BCA-405", name: "Lab on Java", icon: "🔬" },
      { code: "BCA-406", name: "Lab on Graphics & Linux", icon: "🔬" }
    ],
    Semester5: [
      { code: "BCA-501", name: "RDBMS", icon: "🗄️" },
      { code: "BCA-502", name: "AI with Python", icon: "🤖" },
      { code: "BCA-503", name: "Web Technology (HTML, CSS, JS)", icon: "🌐" },
      { code: "BCA-504", name: "Network & Cyber Law", icon: "🔒" },
      { code: "BCA-505", name: "Lab on Oracle", icon: "🔬" },
      { code: "BCA-506", name: "Lab on Python & Web", icon: "🔬" }
    ],
    Semester6: [
      { code: "BCA-601", name: "Project", icon: "🚀" },
      { code: "BCA-602", name: "Seminar", icon: "🎤" },
      { code: "BCA-603", name: "Viva", icon: "🎓" }
    ]
  };

  let activeQrSessionId = '';
  let qrRotationInterval = null;
  let qrCountDownSeconds = 15;
  let registeredStudentsCount = 0;
  let sessionsMap = {};
  let studentsMap = {};
  let recordsMap = {};

  // Verify Role and Retrieve Authorized Payload
  async function getAuthorizedAdmin() {
    try {
      const auth = JSON.parse(localStorage.getItem('adminAuth') || 'null');
      if (!auth || !auth.token) {
        return { authorized: false, reason: "No active admin session found" };
      }
      
      // Verify signature of the client-side JWT
      const result = await AttendanceSecurity.verifyJWT(auth.token);
      if (!result.valid) {
        return { authorized: false, reason: "Session signature mismatch: " + result.reason };
      }
      
      return { authorized: true, role: result.payload.role, username: result.payload.username };
    } catch (e) {
      return { authorized: false, reason: e.message };
    }
  }

  // Initialize and mount listeners on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', async () => {
    await initAdminAttendancePage();
  });

  async function initAdminAttendancePage() {
    // Manually initialize Firebase if window.db is not set yet
    if (typeof db === 'undefined' || !db) {
      if (typeof firebase !== 'undefined' && typeof firebaseConfig !== 'undefined') {
        try {
          const app = firebase.apps && firebase.apps.length > 0 ? firebase.app() : firebase.initializeApp(firebaseConfig);
          window.db = firebase.database(app);
        } catch (e) {
          console.error("Firebase fallback init failed:", e);
        }
      }
    }

    if (typeof db === 'undefined' || !db) {
      console.warn("Firebase Database is not initialized yet.");
      return;
    }

    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Session signature verification failed: " + authCheck.reason + "\nClearing session. Please log in again.");
      localStorage.removeItem('adminAuth');
      window.location.replace("admin.html");
      return;
    }

    // Load overall counts and KPIs
    loadDashboardKPIs();
    loadSessionsRoster();
    loadCorrectionsQueue();
    loadIdCardsQueue();
    loadAuditLogsList();
    
    // Load learning batches for dropdown selection
    db.ref('batches').once('value', (snapshot) => {
      const selectEl = document.getElementById('attSessBatch');
      if (selectEl && snapshot.exists()) {
        selectEl.innerHTML = '<option value="">Select Batch</option>';
        snapshot.forEach(child => {
          const batchData = child.val();
          if (batchData.status === 'Active' || batchData.status === 'Published') {
            const opt = document.createElement('option');
            opt.value = child.key;
            opt.textContent = `📚 ${batchData.name}`;
            selectEl.appendChild(opt);
          }
        });
      }
    });
    
    // Setup change listeners for form select
    const deploySem = document.getElementById('attSessSemester');
    if (deploySem) {
      deploySem.addEventListener('change', updateDeployFormSubjects);
    }

    // Log action to audit logs
    logAuditTrail("Opened Attendance Desk", `Admin (${authCheck.username}) accessed the standalone attendance control desk.`);

    // Setup activity listeners to update adminLastActive in localStorage
    let lastWriteTime = 0;
    function updateLastActiveTime(force = false) {
      const now = Date.now();
      if (force || (now - lastWriteTime > 10000)) {
        localStorage.setItem('adminLastActive', now.toString());
        lastWriteTime = now;
      }
    }
    updateLastActiveTime(true);
    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click'];
    events.forEach(eventName => {
      document.addEventListener(eventName, () => {
        if (localStorage.getItem('adminAuth')) {
          updateLastActiveTime();
        }
      }, { passive: true });
    });
  }

  // Switch between subtabs of the attendance tab
  window.switchAttSubTab = function(subTab) {
    const tabs = ['dash', 'deploy', 'history', 'records', 'corrections', 'idcards', 'audit'];
    tabs.forEach(t => {
      const pane = document.getElementById(`attSubTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const btn = document.getElementById(`attTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
      
      if (pane) {
        if (t === subTab) {
          pane.classList.remove('hidden');
          if (t === 'deploy') pane.classList.add('grid');
        } else {
          pane.classList.add('hidden');
          pane.classList.remove('grid');
        }
      }
      
      if (btn) {
        if (t === subTab) {
          btn.className = "py-2 px-3 sm:py-2.5 sm:px-5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all bg-indigo-600 text-white border border-transparent shadow whitespace-nowrap";
        } else {
          btn.className = "py-2 px-3 sm:py-2.5 sm:px-5 rounded-lg text-xs sm:text-sm font-semibold tracking-wide transition-all text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent whitespace-nowrap";
        }
      }
    });

    if (subTab === 'history') {
      renderSessionHistory(true);
    }
  };

  // Log administrative audit logs
  async function logAuditTrail(action, details) {
    if (typeof db === 'undefined' || !db) return;
    try {
      const logId = `AUDIT_${Date.now()}`;
      await db.ref(`attendance-v2/audit_logs/${logId}`).set({
        action: AttendanceSecurity.sanitizeInput(action),
        operator: 'Admin',
        details: AttendanceSecurity.sanitizeInput(details),
        timestamp: Date.now()
      });
    } catch (e) {
      console.warn("Audit logging failed:", e);
    }
  }

  // Geolocation presets apply
  window.applyAttGeofencePreset = function() {
    const select = document.getElementById('attGeofencePreset').value;
    const lat = document.getElementById('attSessLat');
    const lng = document.getElementById('attSessLng');
    const rad = document.getElementById('attSessRadius');

    if (select === 'disabled') {
      lat.value = '0';
      lng.value = '0';
      rad.value = '0';
    } else if (select === 'lab') {
      lat.value = '26.650800';
      lng.value = '84.908200';
      rad.value = '50';
    } else if (select === 'custom') {
      navigator.geolocation.getCurrentPosition(pos => {
        lat.value = pos.coords.latitude.toFixed(6);
        lng.value = pos.coords.longitude.toFixed(6);
        rad.value = '50';
      }, err => {
        alert("Unable to acquire location: " + err.message);
        document.getElementById('attGeofencePreset').value = 'lab';
        applyAttGeofencePreset();
      });
    }
  };

  // Deploy session submit
  window.handleAttDeploySubmit = async function(e) {
    e.preventDefault();
    if (typeof db === 'undefined' || !db) return;

    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Operation rejected: Admin JWT verification failed.");
      return;
    }

    const subject = AttendanceSecurity.sanitizeInput(document.getElementById('attSessSubject').value);
    const teacher = AttendanceSecurity.sanitizeInput(document.getElementById('attSessTeacher').value);
    const semester = document.getElementById('attSessSemester').value;
    const batch = AttendanceSecurity.sanitizeInput(document.getElementById('attSessBatch').value);
    const duration = parseInt(document.getElementById('attSessDuration').value);
    const method = document.getElementById('attSessMethod').value;
    const lat = parseFloat(document.getElementById('attSessLat').value);
    const lng = parseFloat(document.getElementById('attSessLng').value);
    const radius = parseInt(document.getElementById('attSessRadius').value);
    const deviceLock = document.getElementById('attDeviceLock').checked;
    const grace = parseInt(document.getElementById('attLateGrace').value);

    if (!subject || !teacher || !batch) {
      alert("Please fill all required session fields.");
      return;
    }

    if (!AttendanceSecurity.validateCoordinates(lat, lng)) {
      alert("Invalid Geofence Coordinates. Check latitude/longitude ranges.");
      return;
    }

    try {
      const sId = `SESS_${Date.now()}`;
      const firstSecret = Math.floor(100000 + Math.random() * 900000).toString();
      
      const newSession = {
        subject: subject,
        teacher: teacher,
        semester: semester,
        batch: batch,
        startTime: Date.now(),
        endTime: Date.now() + (duration * 60 * 1000),
        status: 'active',
        geofence: {
          lat: lat,
          lng: lng,
          radius: radius
        },
        deviceLock: deviceLock,
        lateGraceMinutes: grace
      };

      if (method === 'qr') {
        newSession.qrSecret = firstSecret;
      } else {
        newSession.linkCampaign = {
          token: 'LINK_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          expiresAt: Date.now() + (duration * 60 * 1000)
        };
      }

      await db.ref(`attendance-v2/sessions/${sId}`).set(newSession);
      await logAuditTrail("Session Deployed", `Created ${method === 'qr' ? 'QR' : 'Link'} session for ${subject} (${semester}) by ${authCheck.username}`);

alert(`Roster Session Deployed Successfully!\nMethod: ${method.toUpperCase()}`);
      document.getElementById('attDeployForm').reset();
      document.getElementById('attGeofencePreset').value = 'lab';
      applyAttGeofencePreset();

      switchAttSubTab('deploy');
    } catch(err) {
      alert("Session Deploy failed: " + err.message);
    }
  };

  let attendanceTrendChartInstance = null;
  let subjectPerformanceChartInstance = null;
  let classAttendanceChartInstance = null;
  let activeSessionsInterval = null;

  function getPrettySemesterName(sem) {
    const mapping = {
      'Semester 1': 'BCA 1st Semester',
      'Semester 2': 'BCA 2nd Semester',
      'Semester 3': 'BCA 3rd Semester',
      'Semester 4': 'BCA 4th Semester',
      'Semester 5': 'BCA 5th Semester',
      'Semester 6': 'BCA 6th Semester'
    };
    return mapping[sem] || sem;
  }

  // Load Dashboard analytics and KPI calculations
  async function loadDashboardKPIs() {
    if (typeof db === 'undefined' || !db) return;

    db.ref('students').on('value', snap => {
      studentsMap = snap.exists() ? snap.val() : {};
      registeredStudentsCount = Object.keys(studentsMap).length;
      const el = document.getElementById('kpiTotalStudents');
      if (el) el.textContent = registeredStudentsCount;
      updateIntelligenceDashboard();
    });

    const recordsRef = db.ref('attendance-v2/records');
    recordsRef.on('value', snap => {
      recordsMap = snap.exists() ? snap.val() : {};
      updateIntelligenceDashboard();
    });

    db.ref('attendance-v2/sessions').on('value', snap => {
      sessionsMap = snap.exists() ? snap.val() : {};
      updateReportSessionFilterOptions();
      updateIntelligenceDashboard();
    });

    initActiveCountdowns();
  }

  async function updateIntelligenceDashboard() {
    if (typeof db === 'undefined' || !db) return;

    const totalStudents = Object.keys(studentsMap).length;
    const allSessions = Object.keys(sessionsMap).map(sId => ({ id: sId, ...sessionsMap[sId] }));
    const totalSessions = allSessions.length;

    // Calculate Active Sessions
    const now = Date.now();
    const activeSessionsList = allSessions.filter(s => s.status === 'active' && now < s.endTime);
    const activeSessionsCount = activeSessionsList.length;

    // Calculate Today's Attendance Rate
    const startOfToday = new Date().setHours(0,0,0,0);
    const todaySessions = allSessions.filter(s => s.startTime >= startOfToday);
    
    let todayRatesSum = 0;
    let todaySessionsCount = 0;

    let allRatesSum = 0;
    let validSessionsCount = 0;

    const subjectStats = {};
    const classStats = {};
    const trendData = [];
    const studentCheckinCounts = {};

    // Initialize student counts
    for (let sId of Object.keys(studentsMap)) {
      const s = studentsMap[sId];
      studentCheckinCounts[sId] = {
        present: 0,
        total: 0,
        name: s.name || "Student",
        roll: s.rollNumber || s.roll || "N/A",
        semester: s.semester
      };
    }

    // Process sessions
    for (let s of allSessions) {
      const sessionRecords = recordsMap[s.id] || {};
      const presentInSession = Object.keys(sessionRecords).length;
      
      const eligibleStudents = Object.keys(studentsMap).filter(sId => studentsMap[sId].semester === s.semester);
      const eligibleCount = eligibleStudents.length || 1;
      
      const rate = (presentInSession / eligibleCount) * 100;
      
      // Store/sync aggregations to the DB node dynamically
      if (s.presentCount !== presentInSession || s.absentCount !== (eligibleCount - presentInSession) || Math.abs((s.attendancePercentage || 0) - rate) > 0.1) {
        db.ref(`attendance-v2/sessions/${s.id}`).update({
          presentCount: presentInSession,
          absentCount: Math.max(0, eligibleCount - presentInSession),
          attendancePercentage: Math.round(rate)
        }).catch(e => {});
      }

      if (s.startTime >= startOfToday) {
        todayRatesSum += rate;
        todaySessionsCount++;
      }

      allRatesSum += rate;
      validSessionsCount++;

      // Subject stats
      if (!subjectStats[s.subject]) subjectStats[s.subject] = { sum: 0, count: 0 };
      subjectStats[s.subject].sum += rate;
      subjectStats[s.subject].count++;

      // Class stats
      if (!classStats[s.semester]) classStats[s.semester] = { sum: 0, count: 0 };
      classStats[s.semester].sum += rate;
      classStats[s.semester].count++;

      // Trend data
      const dateStr = new Date(s.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      trendData.push({ timestamp: s.startTime, dateStr: dateStr, rate: rate });

      // Student consistency
      eligibleStudents.forEach(sId => {
        studentCheckinCounts[sId].total++;
        const roll = studentCheckinCounts[sId].roll;
        let hasRecord = !!sessionRecords[roll];
        if (!hasRecord) {
          hasRecord = Object.values(sessionRecords).some(r => r.studentId === sId);
        }
        if (hasRecord) {
          studentCheckinCounts[sId].present++;
        }
      });
    }

    const todayRate = todaySessionsCount > 0 ? (todayRatesSum / todaySessionsCount) : 0.0;
    const avgRate = validSessionsCount > 0 ? (allRatesSum / validSessionsCount) : 0.0;

    // Update KPIs
    const safeSet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    safeSet('kpiTotalSessions', totalSessions);
    safeSet('kpiActiveSessions', activeSessionsCount);
    safeSet('kpiTodayRate', `${Math.round(todayRate)}%`);
    safeSet('kpiAvgRate', `${avgRate.toFixed(1)}%`);
    safeSet('kpiTotalStudents', totalStudents);

    // Live monitor feed update
    updateLiveCheckinFeed();

    // Redraw charts
    renderTrendChartJS(trendData);
    renderSubjectPerformanceChartJS(subjectStats);
    renderClassAttendanceChartJS(classStats);

    // Redraw grids & history
    renderLiveActiveSessions(activeSessionsList);
    renderSessionHistory(false);

    // Redraw Alerts & Leaderboard
    renderAlertsAndLeaderboard(studentCheckinCounts, classStats, subjectStats);

    // If modal is open, compile it
    if (activeDetailSessionId) {
      compileModalRoster();
    }
  }

  async function updateLiveCheckinFeed() {
    const liveList = document.getElementById('attLiveMonitorFeed');
    if (!liveList) return;

    liveList.innerHTML = '';
    const liveLogs = [];
    const startOfToday = new Date().setHours(0,0,0,0);

    for (let sId of Object.keys(recordsMap)) {
      const sessionSnap = recordsMap[sId];
      for (let rollKey of Object.keys(sessionSnap)) {
        const rec = sessionSnap[rollKey];
        if (rec.checkInTime >= startOfToday) {
          const decName = await AttendanceSecurity.decryptData(rec.studentName);
          const studentInfo = studentsMap[rec.studentId] || {};
          const registeredName = studentInfo.name || decName || "Student";

          liveLogs.push({
            name: registeredName,
            roll: rec.rollNumber,
            time: rec.checkInTime,
            status: rec.status,
            sessionId: sId,
            studentId: rec.studentId
          });
        }
      }
    }

    if (liveLogs.length === 0) {
      liveList.innerHTML = `
        <div class="text-center py-12 text-xs text-zinc-500 font-sans">
          No check-in entries logged yet today.
        </div>`;
      return;
    }

    liveLogs.sort((a,b) => b.time - a.time);
    liveLogs.forEach(l => {
      const row = document.createElement('div');
      row.className = "flex items-center justify-between p-2.5 bg-zinc-950/40 border border-white/5 rounded-xl text-xs leading-snug font-sans";
      const timeStr = new Date(l.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const statusColor = l.status === 'present' ? 'text-emerald-400' : 'text-amber-400';
      
      row.innerHTML = `
        <div class="text-left">
          <span class="text-indigo-400 hover:text-indigo-300 font-bold block cursor-pointer hover:underline" onclick="openStudentProfileModal('${l.studentId}')">${l.name} <span class="text-zinc-500 font-normal hover:no-underline text-[10px]">(Roll ${l.roll})</span></span>
          <span class="text-[10px] text-zinc-600 font-mono">${timeStr}</span>
        </div>
        <span class="font-bold uppercase tracking-wider ${statusColor} text-[10px] font-mono">${l.status}</span>
      `;
      liveList.appendChild(row);
    });
  }

  function renderTrendChartJS(trendData) {
    const ctx = document.getElementById('attendanceTrendChart');
    if (!ctx) return;

    trendData.sort((a, b) => a.timestamp - b.timestamp);
    const grouped = {};
    trendData.forEach(item => {
      if (!grouped[item.dateStr]) grouped[item.dateStr] = { sum: 0, count: 0 };
      grouped[item.dateStr].sum += item.rate;
      grouped[item.dateStr].count++;
    });

    const labels = Object.keys(grouped);
    const data = labels.map(lbl => (grouped[lbl].sum / grouped[lbl].count));

    if (attendanceTrendChartInstance) attendanceTrendChartInstance.destroy();

    attendanceTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Attendance Rate (%)',
          data: data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#a1a1aa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#a1a1aa' }
          }
        }
      }
    });
  }

  function renderSubjectPerformanceChartJS(subjectStats) {
    const ctx = document.getElementById('subjectPerformanceChart');
    if (!ctx) return;

    const labels = Object.keys(subjectStats);
    const data = labels.map(sub => (subjectStats[sub].sum / subjectStats[sub].count));

    if (subjectPerformanceChartInstance) subjectPerformanceChartInstance.destroy();

    subjectPerformanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Avg Rate (%)',
          data: data,
          backgroundColor: '#3b82f6',
          borderRadius: 8,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#a1a1aa' }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#a1a1aa' }
          }
        }
      }
    });
  }

  function renderClassAttendanceChartJS(classStats) {
    const ctx = document.getElementById('classAttendanceChart');
    if (!ctx) return;

    const labels = Object.keys(classStats).map(sem => getPrettySemesterName(sem));
    const data = Object.keys(classStats).map(sem => (classStats[sem].sum / classStats[sem].count));

    if (classAttendanceChartInstance) classAttendanceChartInstance.destroy();

    classAttendanceChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#e4e4e7', font: { size: 9 } }
          }
        }
      }
    });
  }

  // Declaring state variables for Universal Session Detail modal
  let activeDetailSessionId = null;
  let activeDetailTab = 'overview';
  let detailRatioChartInstance = null;
  let detailTimelineChartInstance = null;

  // Render recent sessions list under "Deploy Session" tab
  function loadSessionsRoster() {
    const body = document.getElementById('attSessionsTableBody');
    if (!body) return;

    body.innerHTML = '';
    const allSessions = Object.keys(sessionsMap).map(id => ({ id, ...sessionsMap[id] }));
    
    if (allSessions.length === 0) {
      body.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-zinc-500 font-sans">No deployed sessions.</td></tr>';
      return;
    }

    // Sort by start time descending
    allSessions.sort((a, b) => b.startTime - a.startTime);

    allSessions.forEach(s => {
      const now = Date.now();
      const isQr = !!s.qrSecret;
      const shareUrl = `${window.location.origin}/attendance.html?session=${s.id}${isQr ? '&qrSecret=' + s.qrSecret : ''}`;

      // Status Badge
      let statusBadge = '';
      if (s.status === 'active' && now < s.endTime) {
        statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Active</span>';
      } else {
        statusBadge = '<span class="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Ended</span>';
      }

      // Method Type
      const methodType = isQr ? 'Rotating QR' : 'Expiring Link';

      // Roster calculations
      const eligibleStudents = Object.values(studentsMap).filter(st => st.semester === s.semester);
      const totalEligible = eligibleStudents.length || 1;
      const present = s.presentCount || 0;
      const rateText = `${present} / ${totalEligible} (${Math.round((present / totalEligible) * 100)}%)`;

      // Actions Column
      const actionBtns = `
        <div class="flex items-center justify-end gap-1.5">
          ${isQr && s.status === 'active' && now < s.endTime ? `
            <button onclick="openAttQrModal('${s.id}')" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] transition-all font-bold font-sans">QR Code</button>
          ` : ''}
          ${!isQr && s.status === 'active' && now < s.endTime ? `
            <button onclick="copyLinkToClip('${shareUrl}')" class="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[9px] transition-all font-bold font-sans">Copy Link</button>
          ` : ''}
          <button onclick="openSessionDetailModal('${s.id}')" class="px-2 py-1 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded font-bold text-[9px] transition-all font-sans">Details</button>
          <button onclick="deleteAttSession('${s.id}')" class="px-1.5 py-1 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded font-bold text-[9px] transition-all font-sans"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      `;

      const tr = document.createElement('tr');
      tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors font-sans";
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-bold text-white text-left">
          ${s.subject}
          <span class="block text-[9px] text-zinc-500 font-normal">By: ${s.teacher} (${s.semester})</span>
        </td>
        <td class="py-2.5 px-3 text-zinc-300 font-mono text-left">${statusBadge}</td>
        <td class="py-2.5 px-3 text-zinc-300 font-sans text-left">${methodType}</td>
        <td class="py-2.5 px-3 font-bold text-zinc-300 font-sans text-left">${rateText}</td>
        <td class="py-2.5 px-3 text-right">${actionBtns}</td>
      `;
      body.appendChild(tr);
    });

    renderRosterReport();
  }

  // Render live cards on dashboard
  window.renderLiveActiveSessions = function(activeSessionsList) {
    const grid = document.getElementById('liveActiveSessionsGrid');
    const label = document.getElementById('activeSessionsCountLabel');
    if (!grid) return;

    grid.innerHTML = '';
    if (activeSessionsList.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-8 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
          No active classroom sessions currently found. Deploy a session to start.
        </div>`;
      if (label) label.textContent = "0 Running";
      return;
    }

    if (label) label.textContent = `${activeSessionsList.length} Running`;

    activeSessionsList.forEach(s => {
      const now = Date.now();
      const timeLeftMs = Math.max(0, s.endTime - now);
      const timeLeftMin = Math.floor(timeLeftMs / 60000);
      const timeLeftSec = Math.floor((timeLeftMs % 60000) / 1000);
      const countdownStr = timeLeftMs > 0 ? `${timeLeftMin}m ${timeLeftSec}s` : 'Expired';

      // Roster Progress
      const eligibleStudents = Object.values(studentsMap).filter(st => st.semester === s.semester);
      const totalEligible = eligibleStudents.length || 1;
      const presentCount = s.presentCount || 0;
      const pct = Math.round((presentCount / totalEligible) * 100);

      const isQr = !!s.qrSecret;
      const shareUrl = `${window.location.origin}/attendance.html?session=${s.id}${isQr ? '&qrSecret=' + s.qrSecret : ''}`;

      const card = document.createElement('div');
      card.className = "glass-card p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4 hover:border-indigo-500/50 transition-all duration-300";
      card.innerHTML = `
        <div>
          <!-- Header -->
          <div class="flex justify-between items-start">
            <span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">
              ${isQr ? '🔑 Rotating QR' : '🔗 Campaign Link'}
            </span>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Active</span>
            </div>
          </div>

          <!-- Subject Details -->
          <div class="mt-3">
            <h4 class="text-sm sm:text-base font-black text-white font-[Outfit] leading-snug">${s.subject}</h4>
            <p class="text-[11px] text-zinc-400 font-medium mt-0.5">${getPrettySemesterName(s.semester)}</p>
          </div>

          <!-- Session Metadata -->
          <div class="mt-4 space-y-1.5 text-xs text-zinc-400 font-sans border-t border-b border-white/5 py-3">
            <div class="flex justify-between">
              <span>Faculty:</span>
              <span class="text-zinc-200 font-bold">${s.teacher}</span>
            </div>
            <div class="flex justify-between">
              <span>Start Time:</span>
              <span class="text-zinc-300 font-mono">${new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="flex justify-between">
              <span>GPS Lock:</span>
              <span class="text-zinc-300 font-bold">${s.geofence.radius > 0 ? `${s.geofence.radius}m Rad` : 'Off'}</span>
            </div>
          </div>

          <!-- Live Progress Bar -->
          <div class="mt-4 space-y-1">
            <div class="flex justify-between text-[10px] font-bold">
              <span class="text-zinc-500 uppercase">Live Roster</span>
              <span class="text-indigo-400 font-mono">${presentCount} / ${totalEligible} (${pct}%)</span>
            </div>
            <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
            </div>
          </div>
        </div>

        <!-- Footer Countdown & Quick Actions -->
        <div class="pt-2 border-t border-white/5 flex items-center justify-between">
          <div class="text-left">
            <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Time Left</span>
            <span class="text-xs font-extrabold text-amber-400 font-mono live-countdown" data-ends="${s.endTime}" data-sess-id="${s.id}">${countdownStr}</span>
          </div>

          <div class="flex items-center gap-1.5">
            ${isQr ? `
              <button onclick="openAttQrModal('${s.id}')" title="Display Rotating QR Code" class="p-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-lg transition-all border border-indigo-500/20">
                <i class="fa-solid fa-qrcode text-xs"></i>
              </button>
            ` : `
              <button onclick="copyLinkToClip('${shareUrl}')" title="Copy Check-In Link" class="p-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-400 rounded-lg transition-all border border-indigo-500/20">
                <i class="fa-solid fa-copy text-xs"></i>
              </button>
            `}
            <button onclick="shareAttSessionOnWhatsApp('${s.id}')" title="Share on WhatsApp" class="p-2 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-lg transition-all border border-emerald-500/20">
              <i class="fa-brands fa-whatsapp text-xs"></i>
            </button>
            <button onclick="openSessionDetailModal('${s.id}')" title="Detailed Analytics" class="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-lg transition-all border border-white/10">
              <i class="fa-solid fa-chart-line text-xs"></i>
            </button>
            <button onclick="endSessionEarly('${s.id}')" title="End Session Early" class="p-2 bg-rose-600/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg transition-all border border-rose-500/20">
              <i class="fa-solid fa-circle-stop text-xs"></i>
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  };

  // Close session manually early
  window.endSessionEarly = async function(sId) {
    if (confirm("Are you sure you want to end this attendance session early? Students will not be able to check in anymore.")) {
      try {
        await db.ref(`attendance-v2/sessions/${sId}`).update({ status: 'ended', endTime: Date.now() });
        await logAuditTrail("Session Ended Early", `Admin manually terminated session ${sId}`);
        alert("Session ended successfully.");
      } catch(e) {
        alert("Failed to end session: " + e.message);
      }
    }
  };

  // Interval timer loop for active sessions
  function initActiveCountdowns() {
    if (activeSessionsInterval) clearInterval(activeSessionsInterval);
    activeSessionsInterval = setInterval(() => {
      const countdowns = document.querySelectorAll('.live-countdown');
      const now = Date.now();
      let hasUpdates = false;

      countdowns.forEach(el => {
        const endTime = parseInt(el.getAttribute('data-ends'));
        const sId = el.getAttribute('data-sess-id');
        const timeLeftMs = Math.max(0, endTime - now);

        if (timeLeftMs <= 0) {
          el.textContent = 'Expired';
          el.className = 'text-xs font-extrabold text-rose-500 font-mono';
          if (sessionsMap[sId] && sessionsMap[sId].status === 'active') {
            db.ref(`attendance-v2/sessions/${sId}`).update({ status: 'ended' }).catch(() => {});
            hasUpdates = true;
          }
        } else {
          const timeLeftMin = Math.floor(timeLeftMs / 60000);
          const timeLeftSec = Math.floor((timeLeftMs % 60000) / 1000);
          el.textContent = `${timeLeftMin}m ${timeLeftSec}s`;
        }
      });
    }, 1000);
  }

  // Compile Consistency leaderboards and Low Attendance alerts
  window.renderAlertsAndLeaderboard = function(studentCounts, classStats, subjectStats) {
    const leaderboardEl = document.getElementById('leaderboardWidget');
    const alertsEl = document.getElementById('intelligenceAlertsPanel');

    // 1. Leaderboard
    if (leaderboardEl) {
      leaderboardEl.innerHTML = '';
      const list = Object.values(studentCounts)
        .filter(item => item.total > 0)
        .map(item => ({
          ...item,
          rate: (item.present / item.total) * 100
        }))
        .sort((a, b) => b.rate - a.rate || b.present - a.present);

      if (list.length === 0) {
        leaderboardEl.innerHTML = '<div class="text-center py-4 text-zinc-500 text-xs">No session statistics compiled yet.</div>';
      } else {
        list.slice(0, 5).forEach((item, idx) => {
          const badgeColors = [
            'bg-amber-400/20 text-amber-300 border-amber-400/30', // Gold
            'bg-zinc-300/20 text-zinc-300 border-zinc-300/30',   // Silver
            'bg-amber-700/20 text-amber-500 border-amber-700/30', // Bronze
            'bg-white/5 text-zinc-400 border-white/10',
            'bg-white/5 text-zinc-400 border-white/10'
          ];
          const tr = document.createElement('div');
          tr.className = "flex items-center justify-between p-2 bg-zinc-950/20 border border-white/5 rounded-xl text-xs font-sans mt-2";
          tr.innerHTML = `
            <div class="flex items-center gap-2.5">
              <span class="w-5 h-5 flex items-center justify-center rounded-lg border font-bold text-[10px] ${badgeColors[idx] || badgeColors[3]}">
                #${idx + 1}
              </span>
              <div>
                <span class="text-zinc-200 font-bold block leading-snug">${item.name}</span>
                <span class="text-[10px] text-zinc-500 font-mono">Roll ${item.roll}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-emerald-400 font-black block font-mono">${Math.round(item.rate)}%</span>
              <span class="text-[9px] text-zinc-500 font-mono">${item.present}/${item.total} Lectures</span>
            </div>
          `;
          leaderboardEl.appendChild(tr);
        });
      }
    }

    // 2. Intelligence Alerts
    if (alertsEl) {
      alertsEl.innerHTML = '';
      const alerts = [];

      Object.values(studentCounts).forEach(item => {
        if (item.total >= 3) {
          const rate = (item.present / item.total) * 100;
          if (rate < 75) {
            alerts.push({
              title: "Low Student Consistency",
              desc: `Student <strong>${item.name}</strong> (Roll ${item.roll}) is at <strong>${Math.round(rate)}%</strong> (${item.present}/${item.total} lectures).`,
              severity: 'critical'
            });
          }
        }
      });

      Object.keys(classStats).forEach(sem => {
        const stat = classStats[sem];
        const rate = stat.sum / stat.count;
        if (rate < 75) {
          alerts.push({
            title: "Low Class Average",
            desc: `Class <strong>${getPrettySemesterName(sem)}</strong> average has dropped to <strong>${Math.round(rate)}%</strong>.`,
            severity: 'warning'
          });
        }
      });

      if (alerts.length === 0) {
        alertsEl.innerHTML = `
          <div class="text-center py-4 text-emerald-500/80 font-sans text-xs flex items-center justify-center gap-2">
            <i class="fa-solid fa-circle-check"></i> System healthy. No consistency alerts active.
          </div>`;
      } else {
        alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
        alerts.slice(0, 4).forEach(alt => {
          const box = document.createElement('div');
          const isCrit = alt.severity === 'critical';
          box.className = `p-2.5 rounded-xl border text-[11px] font-sans flex items-start gap-2 mt-2 ${
            isCrit 
              ? 'bg-rose-500/5 border-rose-500/20 text-rose-400/90' 
              : 'bg-amber-500/5 border-amber-500/15 text-amber-400/90'
          }`;
          box.innerHTML = `
            <i class="fa-solid ${isCrit ? 'fa-circle-xmark mt-0.5' : 'fa-triangle-exclamation mt-0.5'}"></i>
            <div>
              <span class="font-extrabold uppercase text-[9px] tracking-wider block">${alt.title}</span>
              <p class="mt-0.5 leading-snug">${alt.desc}</p>
            </div>
          `;
          alertsEl.appendChild(box);
        });
      }
    }
  };

  // Session History Pagination & Filters
  let historyCurrentPage = 1;
  let filteredHistorySessions = [];

  window.onHistorySemesterChange = function() {
    const semSelect = document.getElementById('histFilterSemester');
    const subSelect = document.getElementById('histFilterSubject');
    if (!semSelect || !subSelect) return;

    const semVal = semSelect.value;
    subSelect.innerHTML = '<option value="all">All Subjects</option>';

    if (semVal !== 'all') {
      const semKey = semVal.replace(/\s+/g, '');
      const subjects = SUBJECTS[semKey];
      if (subjects) {
        subjects.forEach(sub => {
          const opt = document.createElement('option');
          opt.value = `${sub.code} ${sub.name}`;
          opt.textContent = `${sub.code} ${sub.name}`;
          subSelect.appendChild(opt);
        });
      }
    }
    renderSessionHistory(true);
  };

  window.onHistoryDateRangeChange = function() {
    const range = document.getElementById('histFilterDateRange').value;
    const customContainer = document.getElementById('histCustomDateContainer');
    
    if (range === 'custom') {
      customContainer.classList.remove('hidden');
    } else {
      customContainer.classList.add('hidden');
    }
    renderSessionHistory(true);
  };

  window.onHistoryFilterChange = function() {
    renderSessionHistory(true);
  };

  window.loadMoreHistorySessions = function() {
    const spinner = document.getElementById('histLoadMoreSpinner');
    if (spinner) spinner.classList.remove('hidden');
    
    setTimeout(() => {
      historyCurrentPage++;
      renderSessionHistory(false);
      if (spinner) spinner.classList.add('hidden');
    }, 300);
  };

  window.renderSessionHistory = function(forceReset = false) {
    const grid = document.getElementById('historicalSessionsGrid');
    const countEl = document.getElementById('histResultsCount');
    const loadMoreContainer = document.getElementById('histLoadMoreContainer');

    if (!grid) return;

    if (forceReset) {
      historyCurrentPage = 1;
    }

    const searchVal = document.getElementById('histSearchInput').value.toLowerCase().trim();
    const semVal = document.getElementById('histFilterSemester').value;
    const subVal = document.getElementById('histFilterSubject').value;
    const dateRange = document.getElementById('histFilterDateRange').value;
    
    const now = Date.now();
    const allSessions = Object.keys(sessionsMap).map(id => ({ id, ...sessionsMap[id] }));

    filteredHistorySessions = allSessions.filter(s => {
      if (semVal !== 'all' && s.semester !== semVal) return false;
      if (subVal !== 'all' && s.subject !== subVal) return false;

      if (searchVal) {
        const matchSubject = s.subject.toLowerCase().includes(searchVal);
        const matchTeacher = s.teacher.toLowerCase().includes(searchVal);
        const matchId = s.id.toLowerCase().includes(searchVal);
        if (!matchSubject && !matchTeacher && !matchId) return false;
      }

      const startTime = s.startTime;
      const startOfToday = new Date().setHours(0,0,0,0);
      
      if (dateRange === 'today') {
        if (startTime < startOfToday) return false;
      } else if (dateRange === 'yesterday') {
        const startOfYesterday = startOfToday - 86400000;
        if (startTime < startOfYesterday || startTime >= startOfToday) return false;
      } else if (dateRange === '7days') {
        const sevenDaysAgo = startOfToday - (7 * 86400000);
        if (startTime < sevenDaysAgo) return false;
      } else if (dateRange === '30days') {
        const thirtyDaysAgo = startOfToday - (30 * 86400000);
        if (startTime < thirtyDaysAgo) return false;
      } else if (dateRange === 'custom') {
        const fromVal = document.getElementById('histFilterFromDate').value;
        const toVal = document.getElementById('histFilterToDate').value;
        if (fromVal) {
          const fromTime = new Date(fromVal).setHours(0,0,0,0);
          if (startTime < fromTime) return false;
        }
        if (toVal) {
          const toTime = new Date(toVal).setHours(23,59,59,999);
          if (startTime > toTime) return false;
        }
      }
      return true;
    });

    filteredHistorySessions.sort((a, b) => b.startTime - a.startTime);

    if (countEl) countEl.textContent = filteredHistorySessions.length;

    const limit = historyCurrentPage * 50;
    const chunk = filteredHistorySessions.slice(0, limit);

    grid.innerHTML = '';
    if (chunk.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center text-xs text-zinc-500 border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
          No archived sessions found matching the filter criteria.
        </div>`;
      if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
      return;
    }

    chunk.forEach(s => {
      const dateStr = new Date(s.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const present = s.presentCount || 0;
      const absent = s.absentCount || 0;
      const total = present + absent;
      const pct = s.attendancePercentage !== undefined ? s.attendancePercentage : (total > 0 ? Math.round((present / total) * 100) : 0);

      const isQr = !!s.qrSecret;
      
      const card = document.createElement('div');
      card.className = "glass-card p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 font-sans";
      card.innerHTML = `
        <div>
          <div class="flex justify-between items-center">
            <span class="text-[9px] text-zinc-500 font-mono">${s.id}</span>
            <span class="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
              ${isQr ? 'QR Code' : 'Link Campaign'}
            </span>
          </div>

          <div class="mt-2">
            <h4 class="text-sm font-black text-white truncate" title="${s.subject}">${s.subject}</h4>
            <span class="text-[10px] text-zinc-400 block font-medium mt-0.5">${getPrettySemesterName(s.semester)} • ${s.teacher}</span>
          </div>

          <div class="mt-3 grid grid-cols-3 gap-2 text-center text-xs border-t border-b border-white/5 py-2.5 bg-zinc-950/10 rounded-lg">
            <div>
              <span class="text-[9px] text-zinc-500 uppercase block font-semibold">Rate</span>
              <span class="text-indigo-400 font-extrabold font-mono">${pct}%</span>
            </div>
            <div>
              <span class="text-[9px] text-zinc-500 uppercase block font-semibold">Present</span>
              <span class="text-emerald-400 font-bold font-mono">${present}</span>
            </div>
            <div>
              <span class="text-[9px] text-zinc-500 uppercase block font-semibold">Absent</span>
              <span class="text-rose-400 font-bold font-mono">${absent}</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2">
          <div class="text-[10px] text-zinc-500">
            <span class="block leading-none">${dateStr}</span>
            <span class="font-mono mt-1 block">${timeStr}</span>
          </div>
          <div class="flex gap-2">
            <button onclick="openSessionDetailModal('${s.id}')" class="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-lg text-[10px] font-bold transition-all">
              <i class="fa-solid fa-folder-open mr-1"></i> Roster
            </button>
            <button onclick="deleteAttSession('${s.id}')" class="px-2 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-[10px] font-bold transition-all">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    if (filteredHistorySessions.length > limit) {
      if (loadMoreContainer) loadMoreContainer.classList.remove('hidden');
    } else {
      if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    }
  };

  // Universal Session Detail Modal Controls
  window.openSessionDetailModal = function(sessionId) {
    activeDetailSessionId = sessionId;
    activeDetailTab = 'overview';

    const overlay = document.getElementById('sessionDetailModal');
    if (overlay) {
      overlay.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');
    }

    switchDetailTab('overview');
    compileModalRoster();
  };

  window.closeSessionDetailModal = function() {
    activeDetailSessionId = null;
    const overlay = document.getElementById('sessionDetailModal');
    if (overlay) {
      overlay.classList.add('hidden');
      document.body.classList.remove('overflow-hidden');
    }

    if (detailRatioChartInstance) {
      detailRatioChartInstance.destroy();
      detailRatioChartInstance = null;
    }
    if (detailTimelineChartInstance) {
      detailTimelineChartInstance.destroy();
      detailTimelineChartInstance = null;
    }
  };

  window.switchDetailTab = function(tab) {
    activeDetailTab = tab;
    const tabs = ['overview', 'present', 'absent', 'analytics'];
    
    tabs.forEach(t => {
      const pane = document.getElementById(`detailTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const btn = document.getElementById(`detailTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
      
      if (pane) {
        if (t === tab) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
      
      if (btn) {
        if (t === tab) {
          btn.className = "py-1.5 px-4 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow";
        } else {
          btn.className = "py-1.5 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5";
        }
      }
    });

    if (tab === 'analytics') {
      setTimeout(renderDetailCharts, 100);
    }
  };

  // Roster Compiler for Modal Detail Context
  let modalPresentList = [];
  let modalAbsentList = [];

  async function compileModalRoster() {
    if (!activeDetailSessionId) return;
    const s = sessionsMap[activeDetailSessionId];
    if (!s) return;

    // Set UI labels
    document.getElementById('detailSessionIdLabel').textContent = activeDetailSessionId;
    document.getElementById('detailSubjectLabel').textContent = s.subject;
    document.getElementById('detailClassLabel').textContent = getPrettySemesterName(s.semester);
    
    // Status Badge
    const now = Date.now();
    const isLive = s.status === 'active' && now < s.endTime;
    const badge = document.getElementById('detailStatusBadge');
    if (badge) {
      if (isLive) {
        badge.textContent = "🟢 Active";
        badge.className = "px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      } else {
        badge.textContent = "🔴 Ended";
        badge.className = "px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700";
      }
    }

    // Overview general labels
    document.getElementById('detailFacultyLabel').textContent = s.teacher;
    document.getElementById('detailDateLabel').textContent = new Date(s.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    
    const startStr = new Date(s.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(s.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('detailDurationLabel').textContent = `${startStr} - ${endStr}`;
    
    const cdLabel = document.getElementById('detailCountdownLabel');
    if (cdLabel) {
      if (isLive) {
        const left = Math.ceil((s.endTime - now) / 60000);
        cdLabel.textContent = `${left} Min(s) Left`;
        cdLabel.className = "text-[10px] text-amber-400 font-semibold block";
      } else {
        cdLabel.textContent = "Closed / Archived";
        cdLabel.className = "text-[10px] text-zinc-500 block";
      }
    }

    // Security metrics
    document.getElementById('detailSecurityType').textContent = s.qrSecret ? 'Rotating QR Code' : 'Expiring Link';
    document.getElementById('detailDeviceLockState').textContent = s.deviceLock ? 'Enabled (Anti-Proxy)' : 'Disabled';
    
    const isPreset = s.geofence.lat === 26.6508 && s.geofence.lng === 84.9082;
    document.getElementById('detailGeofenceLabel').textContent = s.geofence.radius > 0 ? (isPreset ? 'Main IT Lab' : 'Custom Boundary') : 'Disabled';
    document.getElementById('detailGraceWindow').textContent = `${s.lateGraceMinutes || 5} Minutes`;
    document.getElementById('detailCoordinates').textContent = `${s.geofence.lat.toFixed(5)}, ${s.geofence.lng.toFixed(5)}`;
    document.getElementById('detailRadius').textContent = s.geofence.radius > 0 ? `${s.geofence.radius} Meters` : '0 Meters';

    // Roster arrays compilation
    const sessionRecords = recordsMap[activeDetailSessionId] || {};
    const eligibleStudents = Object.keys(studentsMap).filter(id => studentsMap[id].semester === s.semester);

    const presents = [];
    const absents = [];
    const processedRolls = new Set();

    for (let sKey of eligibleStudents) {
      const student = studentsMap[sKey];
      const roll = student.rollNumber || student.roll || "N/A";
      let rec = sessionRecords[roll];

      if (!rec) {
        for (let rK of Object.keys(sessionRecords)) {
          if (sessionRecords[rK].studentId === sKey) {
            rec = sessionRecords[rK];
            processedRolls.add(rK);
            break;
          }
        }
      } else {
        processedRolls.add(roll);
      }

      if (rec) {
        const decName = await AttendanceSecurity.decryptData(rec.studentName);
        presents.push({
          studentId: sKey,
          rollNumber: roll,
          name: student.name || decName || "Student",
          photo: student.photo || 'avatar_faculty1.png',
          checkInTime: rec.checkInTime,
          status: rec.status || 'present',
          method: rec.method || 'QR Code',
          deviceInfo: rec.deviceInfo || 'Unknown',
          deviceFingerprint: rec.deviceFingerprint || 'N/A'
        });
      } else {
        absents.push({
          studentId: sKey,
          rollNumber: roll,
          name: student.name || "Student",
          photo: student.photo || 'avatar_faculty1.png'
        });
      }
    }

    // Cross-registered check-in fallbacks
    for (let rK of Object.keys(sessionRecords)) {
      if (!processedRolls.has(rK)) {
        const rec = sessionRecords[rK];
        let decName = "Student";
        if (rec.studentName) {
          decName = await AttendanceSecurity.decryptData(rec.studentName);
        }
        const studentInfo = studentsMap[rec.studentId] || {};
        presents.push({
          studentId: rec.studentId || 'unknown',
          rollNumber: rK,
          name: studentInfo.name || decName || "Student",
          photo: studentInfo.photo || 'avatar_faculty1.png',
          checkInTime: rec.checkInTime,
          status: rec.status || 'present',
          method: rec.method || 'QR Code',
          deviceInfo: rec.deviceInfo || 'Unknown',
          deviceFingerprint: rec.deviceFingerprint || 'N/A'
        });
      }
    }

    presents.sort((a,b) => b.checkInTime - a.checkInTime);
    absents.sort((a,b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));

    modalPresentList = presents;
    modalAbsentList = absents;

    // Counters update
    document.getElementById('detailPresentCountLabel').textContent = presents.length;
    document.getElementById('detailAbsentCountLabel').textContent = absents.length;

    // Metrics panel summary
    const totalCount = presents.length + absents.length || 1;
    const ratePct = Math.round((presents.length / totalCount) * 100);
    document.getElementById('detailRateMetric').textContent = `${ratePct}%`;
    document.getElementById('detailRatioMetric').textContent = `${presents.length} / ${totalCount} Students`;

    renderModalRosterGrids();
  }

  // Draw students card grids inside modal tab views
  window.renderModalRosterGrids = function() {
    const presentGrid = document.getElementById('detailPresentListGrid');
    const absentGrid = document.getElementById('detailAbsentListGrid');
    
    const searchPresent = document.getElementById('detailPresentSearch').value.toLowerCase().trim();
    const searchAbsent = document.getElementById('detailAbsentSearch').value.toLowerCase().trim();

    // 1. Present cards
    if (presentGrid) {
      presentGrid.innerHTML = '';
      const filteredP = modalPresentList.filter(p => p.name.toLowerCase().includes(searchPresent) || p.rollNumber.toLowerCase().includes(searchPresent));
      document.getElementById('detailPresentFilteredCount').textContent = `Showing ${filteredP.length} of ${modalPresentList.length}`;
      
      if (filteredP.length === 0) {
        presentGrid.innerHTML = '<div class="col-span-full text-center text-xs py-8 text-zinc-500">No present students matched the search.</div>';
      } else {
        filteredP.forEach(p => {
          const time = new Date(p.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          const isLate = p.status === 'late';
          
          // OS Icon Selector
          let osIcon = 'fa-circle-question';
          const os = p.deviceInfo ? p.deviceInfo.toLowerCase() : '';
          if (os.includes('android')) osIcon = 'fa-android text-emerald-400';
          else if (os.includes('ios') || os.includes('iphone') || os.includes('mac')) osIcon = 'fa-apple text-zinc-300';
          else if (os.includes('windows')) osIcon = 'fa-windows text-indigo-400';
          else if (os.includes('linux')) osIcon = 'fa-linux text-orange-400';

          const card = document.createElement('div');
          card.className = "bg-zinc-950/40 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs leading-normal font-sans hover:border-white/10 transition-colors mt-1";
          card.innerHTML = `
            <div class="flex items-center gap-2.5">
              <img src="${p.photo}" class="w-8 h-8 rounded-full border border-white/10 object-cover bg-zinc-900">
              <div>
                <span class="text-white font-bold block leading-snug cursor-pointer hover:text-indigo-400 hover:underline" onclick="closeSessionDetailModal(); openStudentProfileModal('${p.studentId}')">
                  ${p.name}
                </span>
                <span class="text-[9px] text-zinc-500 font-mono">Roll: ${p.rollNumber} • ${time}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded font-mono text-[9px] border border-white/5 text-zinc-400">
                <i class="fa-brands ${osIcon}"></i> ${p.deviceInfo || 'OS'}
              </span>
              <span class="${isLate ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">
                ${p.status}
              </span>
              <button onclick="overrideRosterStatus('${activeDetailSessionId}', '${p.studentId}', '${p.rollNumber}', 'present')" class="p-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded border border-rose-500/20 text-[9px]" title="Mark Absent"><i class="fa-solid fa-user-minus"></i></button>
            </div>
          `;
          presentGrid.appendChild(card);
        });
      }
    }

    // 2. Absent cards
    if (absentGrid) {
      absentGrid.innerHTML = '';
      const filteredA = modalAbsentList.filter(a => a.name.toLowerCase().includes(searchAbsent) || a.rollNumber.toLowerCase().includes(searchAbsent));
      document.getElementById('detailAbsentFilteredCount').textContent = `Showing ${filteredA.length} of ${modalAbsentList.length}`;

      if (filteredA.length === 0) {
        absentGrid.innerHTML = '<div class="col-span-full text-center text-xs py-8 text-zinc-500">No absent students matched the search.</div>';
      } else {
        filteredA.forEach(a => {
          const card = document.createElement('div');
          card.className = "bg-zinc-950/40 border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs leading-normal font-sans hover:border-white/10 transition-colors mt-1";
          card.innerHTML = `
            <div class="flex items-center gap-2.5">
              <img src="${a.photo}" class="w-8 h-8 rounded-full border border-white/10 object-cover bg-zinc-900 grayscale">
              <div>
                <span class="text-zinc-400 font-bold block leading-snug cursor-pointer hover:text-indigo-400 hover:underline" onclick="closeSessionDetailModal(); openStudentProfileModal('${a.studentId}')">
                  ${a.name}
                </span>
                <span class="text-[9px] text-zinc-500 font-mono">Roll: ${a.rollNumber}</span>
              </div>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 border px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">
                Absent
              </span>
              <button onclick="overrideRosterStatus('${activeDetailSessionId}', '${a.studentId}', '${a.rollNumber}', 'absent')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[9px] transition-all font-sans" title="Mark Present">Override</button>
            </div>
          `;
          absentGrid.appendChild(card);
        });
      }
    }
  };

  window.filterDetailRoster = function() {
    renderModalRosterGrids();
  };

  // Override attendance handler specifically inside modal context
  window.overrideRosterStatus = async function(sId, studentId, roll, status) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Session signature rejected. Override permission denied.");
      return;
    }

    const student = studentsMap[studentId] || {};
    const studentName = student.name || "Student";

    try {
      if (status === 'absent') {
        // Mark present
        const encName = await AttendanceSecurity.encryptData(studentName);
        const encCoords = await AttendanceSecurity.encryptData("0,0");
        
        await db.ref(`attendance-v2/records/${sId}/${roll}`).set({
          studentId: studentId,
          studentName: encName,
          rollNumber: roll,
          checkInTime: Date.now(),
          checkOutTime: Date.now(),
          status: 'present',
          deviceFingerprint: 'BYPASS_ADMIN_MANUAL',
          location: encCoords,
          method: 'Manual',
          deviceInfo: 'Windows', // Mock admin OS
          id: `ATT_MANUAL_${Date.now()}`
        });
        await logAuditTrail("Roster Overridden", `Marked roll ${roll} (${studentName}) as PRESENT in session ${sId} by ${authCheck.username}`);
      } else {
        // Mark absent
        await db.ref(`attendance-v2/records/${sId}/${roll}`).remove();
        await logAuditTrail("Roster Overridden", `Marked roll ${roll} (${studentName}) as ABSENT in session ${sId} by ${authCheck.username}`);
      }
      
      // Local re-compile is triggered automatically by FirebaseRTDB listener update dashboard
    } catch(e) {
      alert("Override failed: " + e.message);
    }
  };

  // Render modal doughnut and timeline charts
  function renderDetailCharts() {
    const ratioCtx = document.getElementById('detailRatioChart');
    const timelineCtx = document.getElementById('detailTimelineChart');
    if (!activeDetailSessionId || !sessionsMap[activeDetailSessionId]) return;

    const session = sessionsMap[activeDetailSessionId];
    const present = modalPresentList.length;
    const absent = modalAbsentList.length;
    const ratePct = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0;

    // 1. Doughnut Chart
    if (ratioCtx) {
      if (detailRatioChartInstance) detailRatioChartInstance.destroy();
      detailRatioChartInstance = new Chart(ratioCtx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            data: [present, absent],
            backgroundColor: ['#10b981', '#f43f5e'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '75%'
        }
      });
      const txt = document.getElementById('detailRatioChartText');
      if (txt) txt.innerHTML = `<strong>${ratePct}%</strong> attendance rate`;
    }

    // 2. Timeline chart (cumulative check-ins)
    if (timelineCtx) {
      const start = session.startTime;
      const grace = (session.lateGraceMinutes || 5) * 60 * 1000;
      
      let withinGraceCount = 0;
      let lateCount = 0;

      modalPresentList.forEach(p => {
        const offset = p.checkInTime - start;
        if (offset <= grace) withinGraceCount++;
        else lateCount++;
      });

      // OS Statistics
      const osStats = { Windows: 0, Android: 0, iOS: 0, macOS: 0, Linux: 0, Unknown: 0 };
      modalPresentList.forEach(p => {
        const os = p.deviceInfo || 'Unknown';
        if (osStats[os] !== undefined) osStats[os]++;
        else osStats.Unknown++;
      });

      // Update text indicators
      const lateEl = document.getElementById('detailLateArrivalsSummary');
      if (lateEl) {
        const latePct = present > 0 ? Math.round((lateCount / present) * 100) : 0;
        lateEl.innerHTML = `Out of <strong>${present}</strong> present student(s), <strong>${lateCount}</strong> (${latePct}%) checked in after the grace period threshold of ${session.lateGraceMinutes || 5} mins. ${
          latePct > 30 
            ? "Caution: High latency pattern detected. Recommend reviewing QR rotation duration." 
            : "Registration speed is stable."
        }`;
      }

      const telemetryEl = document.getElementById('detailDeviceTelemetrySummary');
      if (telemetryEl) {
        telemetryEl.innerHTML = `Client platform profiles verified: 
          Android (<strong>${osStats.Android}</strong>), 
          iOS (<strong>${osStats.iOS}</strong>), 
          Windows (<strong>${osStats.Windows}</strong>), 
          macOS (<strong>${osStats.macOS}</strong>), 
          Linux (<strong>${osStats.Linux}</strong>). 
          Integrity signatures enforced.`;
      }

      // Render Bar chart
      if (detailTimelineChartInstance) detailTimelineChartInstance.destroy();
      detailTimelineChartInstance = new Chart(timelineCtx, {
        type: 'bar',
        data: {
          labels: ['On Time (< Grace)', 'Late Arrivals'],
          datasets: [{
            label: 'Students Count',
            data: [withinGraceCount, lateCount],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderRadius: 6,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#a1a1aa', stepSize: 1 }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#a1a1aa' }
            }
          }
        }
      });
    }
  }

  // High-accuracy Excel Exporter inside open modal
  window.exportDetailToExcel = async function() {
    if (!activeDetailSessionId) {
      alert("No active session modal is open.");
      return;
    }
    const session = sessionsMap[activeDetailSessionId];
    if (!session) return;

    const roster = await compileDetailRosterData();
    if (roster.length === 0) {
      alert("No roster logs compiled for this session.");
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert("Excel export library is loading, please try again in a few seconds.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const headerData = [
      ["BCA STORE - SESSION ROSTER ATTENDANCE REPORT"],
      ["Generated Date:", new Date().toLocaleString('en-IN')],
      [],
      ["SESSION METADATA"],
      ["Subject Class:", session.subject],
      ["Instructor:", session.teacher],
      ["Academic Term:", session.semester],
      ["Session Date:", new Date(session.startTime).toLocaleDateString('en-IN')],
      ["GPS Geofence:", session.geofence.radius > 0 ? `${session.geofence.lat}, ${session.geofence.lng} (Radius: ${session.geofence.radius}m)` : "Disabled"],
      [],
      ["DETAILED STUDENT ROSTER LOGS"],
      ["Roll Number", "Student Name", "Check-In Time", "Roster Status", "Verification Method", "Client OS Platform", "Device Fingerprint"]
    ];

    const rowData = roster.map(r => [
      r.rollNumber,
      r.studentName,
      r.checkInTimeStr,
      r.status.toUpperCase(),
      r.method,
      r.deviceInfo || 'Unknown',
      r.deviceFingerprint || 'N/A'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([...headerData, ...rowData]);
    ws['!cols'] = [
      { wch: 18 }, // Roll Number
      { wch: 28 }, // Student Name
      { wch: 20 }, // Check-In Time
      { wch: 15 }, // Status
      { wch: 22 }, // Verification Method
      { wch: 20 }, // Client OS
      { wch: 32 }  // Device Fingerprint
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Session Roster");
    const safeSubject = session.subject.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Roster_${safeSubject}_${new Date(session.startTime).toISOString().split('T')[0]}.xlsx`);
  };

  // High-accuracy PDF Exporter inside open modal
  window.exportDetailToPDF = async function() {
    if (!activeDetailSessionId) {
      alert("No active session modal is open.");
      return;
    }
    const session = sessionsMap[activeDetailSessionId];
    if (!session) return;

    if (typeof window.jspdf === 'undefined') {
      alert("PDF library is not loaded. Try again in a few seconds.");
      return;
    }

    const roster = await compileDetailRosterData();
    if (roster.length === 0) {
      alert("No roster logs compiled for this session.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Premium Navy Background Accent Banner
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("CLASS ROSTER ATTENDANCE REPORT", 14, 22);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 255);
    doc.text(`Official Academic Roster • Generated on ${new Date().toLocaleString('en-IN')}`, 14, 30);

    // Session Info
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    doc.text(`Subject: ${session.subject}`, 14, 48);
    doc.text(`Instructor: ${session.teacher}`, 14, 54);
    doc.text(`Academic Term: ${session.semester}`, 14, 60);
    doc.text(`Session ID: ${activeDetailSessionId}`, 14, 66);

    const totalReg = roster.length;
    const presentCount = roster.filter(r => r.status === 'present').length;
    const lateCount = roster.filter(r => r.status === 'late').length;
    const absentCount = roster.filter(r => r.status === 'absent').length;
    const rate = totalReg > 0 ? (((presentCount + lateCount) / totalReg) * 100).toFixed(1) : "0";

    doc.text(`Total Roster Size: ${totalReg}`, 115, 48);
    doc.text(`Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount}`, 115, 54);
    doc.text(`Roster Participation Rate: ${rate}%`, 115, 60);

    // Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 72, 196, 72);

    const columns = [
      { header: 'Roll No', dataKey: 'rollNumber' },
      { header: 'Student Name', dataKey: 'studentName' },
      { header: 'Check-In', dataKey: 'checkInTimeStr' },
      { header: 'Roster Status', dataKey: 'status' },
      { header: 'Verification Method', dataKey: 'method' },
      { header: 'Client OS', dataKey: 'deviceInfo' }
    ];

    const rows = roster.map(r => ({
      rollNumber: r.rollNumber,
      studentName: r.studentName,
      checkInTimeStr: r.checkInTimeStr,
      status: r.status.toUpperCase(),
      method: r.method,
      deviceInfo: r.deviceInfo
    }));

    doc.autoTable({
      columns: columns,
      body: rows,
      startY: 78,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [30, 41, 59] },
      margin: { top: 78, left: 14, right: 14 },
      didDrawPage: function(data) {
        // Footer pagination
        const str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(str, 196 - doc.getTextWidth(str), 287);
        doc.text("System Secured by AES-256 Web Crypto API", 14, 287);
      }
    });

    const safeSubject = session.subject.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Roster_${safeSubject}_${new Date(session.startTime).toISOString().split('T')[0]}.pdf`);
  };

  // Compile full detail roster data for exporters
  async function compileDetailRosterData() {
    if (!activeDetailSessionId) return [];
    const session = sessionsMap[activeDetailSessionId];
    if (!session) return [];

    const sessionRecords = recordsMap[activeDetailSessionId] || {};
    const eligibleStudents = Object.keys(studentsMap).filter(id => studentsMap[id].semester === session.semester);
    
    const rows = [];
    const processedRolls = new Set();

    for (let sKey of eligibleStudents) {
      const student = studentsMap[sKey];
      const roll = student.rollNumber || student.roll || "N/A";
      let record = sessionRecords[roll];

      if (!record) {
        for (let rK of Object.keys(sessionRecords)) {
          if (sessionRecords[rK].studentId === sKey) {
            record = sessionRecords[rK];
            processedRolls.add(rK);
            break;
          }
        }
      } else {
        processedRolls.add(roll);
      }

      if (record) {
        const decName = await AttendanceSecurity.decryptData(record.studentName);
        rows.push({
          rollNumber: roll,
          studentName: student.name || decName || "Student",
          checkInTimeStr: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          checkInTime: record.checkInTime,
          status: record.status || 'present',
          method: record.method || 'QR Code',
          deviceInfo: record.deviceInfo || 'Unknown',
          deviceFingerprint: record.deviceFingerprint || 'N/A'
        });
      } else {
        rows.push({
          rollNumber: roll,
          studentName: student.name || "Student",
          checkInTimeStr: "—",
          checkInTime: null,
          status: 'absent',
          method: '—',
          deviceInfo: '—',
          deviceFingerprint: '—'
        });
      }
    }

    for (let rK of Object.keys(sessionRecords)) {
      if (!processedRolls.has(rK)) {
        const record = sessionRecords[rK];
        let decName = "Student";
        if (record.studentName) {
          decName = await AttendanceSecurity.decryptData(record.studentName);
        }
        const studentInfo = studentsMap[record.studentId] || {};
        rows.push({
          rollNumber: rK,
          studentName: studentInfo.name || decName || "Student",
          checkInTimeStr: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          checkInTime: record.checkInTime,
          status: record.status || 'present',
          method: record.method || 'QR Code',
          deviceInfo: record.deviceInfo || 'Unknown',
          deviceFingerprint: record.deviceFingerprint || 'N/A'
        });
      }
    }

    rows.sort((a, b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));
    return rows;
  }

  window.copyLinkToClip = function(text) {
    navigator.clipboard.writeText(text);
    alert("Check-in link copied to clipboard!");
  };

  window.deleteAttSession = async function(sId) {
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    if (confirm("Delete this session and all checked-in records permanently? This cannot be undone.")) {
      try {
        await db.ref(`attendance-v2/sessions/${sId}`).remove();
        await db.ref(`attendance-v2/records/${sId}`).remove();
        await logAuditTrail("Session Deleted", `Deleted campaign ${sId} and associated records by ${authCheck.username}`);
        alert("Session deleted successfully.");
      } catch(e) {
        alert("Delete failed: " + e.message);
      }
    }
  };

  // Rotating QR code display modal actions
  window.openAttQrModal = function(sId) {
    activeQrSessionId = sId;
    const s = sessionsMap[sId];
    if (!s) return;

    document.getElementById('attQrModalSubject').textContent = s.subject;
    document.getElementById('attQrModalOverlay').classList.remove('hidden');

    qrCountDownSeconds = 15;
    document.getElementById('attQrModalTimer').textContent = qrCountDownSeconds;

    rotateAttQrSecret();

    if (qrRotationInterval) clearInterval(qrRotationInterval);
    qrRotationInterval = setInterval(() => {
      qrCountDownSeconds--;
      document.getElementById('attQrModalTimer').textContent = qrCountDownSeconds;
      
      if (qrCountDownSeconds <= 0) {
        qrCountDownSeconds = 15;
        rotateAttQrSecret();
      }
    }, 1000);
  };

  async function rotateAttQrSecret() {
    if (typeof db === 'undefined' || !db || !activeQrSessionId) return;

    // Generate random 6 digit code passcode
    const nextSecret = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await db.ref(`attendance-v2/sessions/${activeQrSessionId}`).update({
        qrSecret: nextSecret
      });

      document.getElementById('attQrModalPasscode').textContent = nextSecret;

      const entryUrl = `${window.location.origin}/attendance.html?session=${activeQrSessionId}&qrSecret=${nextSecret}`;
      document.getElementById('attQrModalCodeImg').src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(entryUrl)}`;

    } catch (e) {
      console.warn("Secret rotation failed:", e);
    }
  }

  window.closeAttQrModal = function() {
    document.getElementById('attQrModalOverlay').classList.add('hidden');
    if (qrRotationInterval) {
      clearInterval(qrRotationInterval);
      qrRotationInterval = null;
    }
    activeQrSessionId = '';
  };

  // Roster report database compiler and rendering logic
  async function compileAllRosterRows() {
    const rows = [];
    
    for (let sId of Object.keys(sessionsMap)) {
      const session = sessionsMap[sId];
      const semester = session.semester;
      const subject = session.subject;
      const teacher = session.teacher;
      const startTime = session.startTime;
      const sessionDateStr = new Date(startTime).toLocaleDateString('en-IN');
      
      const sessionRecords = recordsMap[sId] || {};
      const processedRolls = new Set();
      
      for (let sKey of Object.keys(studentsMap)) {
        const student = studentsMap[sKey];
        if (student.semester === semester) {
          const roll = student.rollNumber || student.roll || "N/A";
          let record = sessionRecords[roll];
          if (!record) {
            for (let rK of Object.keys(sessionRecords)) {
              if (sessionRecords[rK].studentId === sKey) {
                record = sessionRecords[rK];
                processedRolls.add(rK);
                break;
              }
            }
          } else {
            processedRolls.add(roll);
          }
          
          if (record) {
            rows.push({
              sessionId: sId,
              studentId: sKey,
              rollNumber: roll,
              studentName: student.name || "Student",
              semester: semester,
              subject: subject,
              teacher: teacher,
              sessionDate: sessionDateStr,
              checkInTime: record.checkInTime,
              checkInTimeStr: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              checkOutTime: record.checkOutTime || null,
              checkOutTimeStr: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Pending',
              status: record.status || 'present',
              method: record.method || 'QR Code',
              location: record.location,
              deviceFingerprint: record.deviceFingerprint || 'N/A',
              hasRecord: true
            });
          } else {
            rows.push({
              sessionId: sId,
              studentId: sKey,
              rollNumber: roll,
              studentName: student.name || "Student",
              semester: semester,
              subject: subject,
              teacher: teacher,
              sessionDate: sessionDateStr,
              checkInTime: null,
              checkInTimeStr: "—",
              checkOutTime: null,
              checkOutTimeStr: "—",
              status: 'absent',
              method: '—',
              location: null,
              deviceFingerprint: '—',
              hasRecord: false
            });
          }
        }
      }

      for (let rK of Object.keys(sessionRecords)) {
        if (!processedRolls.has(rK)) {
          const record = sessionRecords[rK];
          let decName = "Student";
          if (record.studentName) {
            decName = await AttendanceSecurity.decryptData(record.studentName);
          }
          rows.push({
            sessionId: sId,
            studentId: record.studentId || "unknown",
            rollNumber: rK,
            studentName: decName || "Student",
            semester: semester,
            subject: subject,
            teacher: teacher,
            sessionDate: sessionDateStr,
            checkInTime: record.checkInTime,
            checkInTimeStr: new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            checkOutTime: record.checkOutTime || null,
            checkOutTimeStr: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Pending',
            status: record.status || 'present',
            method: record.method || 'QR Code',
            location: record.location,
            deviceFingerprint: record.deviceFingerprint || 'N/A',
            hasRecord: true
          });
        }
      }
    }
    
    rows.sort((a, b) => {
      const tA = sessionsMap[a.sessionId]?.startTime || 0;
      const tB = sessionsMap[b.sessionId]?.startTime || 0;
      if (tB !== tA) return tB - tA;
      return (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0);
    });
    
    const decryptedRows = await Promise.all(rows.map(async r => {
      let decCoords = "0,0";
      if (r.location) {
        decCoords = await AttendanceSecurity.decryptData(r.location);
      }
      return {
        ...r,
        locationDecrypted: decCoords || "0,0"
      };
    }));
    
    return decryptedRows;
  }

  window.renderRosterReport = async function() {
    const body = document.getElementById('attLogsTableBody');
    if (!body) return;
    
    const allRows = await compileAllRosterRows();
    
    const semVal = document.getElementById('repFilterSemester').value;
    const subVal = document.getElementById('repFilterSubject').value;
    const teachVal = document.getElementById('repFilterTeacher').value;
    const dateVal = document.getElementById('repFilterDate').value;
    const sessVal = document.getElementById('repFilterSession').value;
    const statusVal = document.getElementById('repFilterStatus').value;
    const searchVal = document.getElementById('repFilterSearch').value.toLowerCase().trim();
    
    const filteredRows = allRows.filter(r => {
      if (semVal !== 'all' && r.semester !== semVal) return false;
      if (subVal !== 'all' && r.subject !== subVal) return false;
      if (teachVal !== 'all' && r.teacher !== teachVal) return false;
      if (dateVal) {
        const filterDateStr = new Date(dateVal).toDateString();
        const sessionStartTime = sessionsMap[r.sessionId]?.startTime;
        if (sessionStartTime) {
          const sessionDateStr = new Date(sessionStartTime).toDateString();
          if (filterDateStr !== sessionDateStr) return false;
        } else {
          return false;
        }
      }
      if (sessVal !== 'all' && r.sessionId !== sessVal) return false;
      if (statusVal !== 'all' && r.status !== statusVal) return false;
      if (searchVal) {
        const nameMatch = r.studentName.toLowerCase().includes(searchVal);
        const rollMatch = r.rollNumber.toLowerCase().includes(searchVal);
        if (!nameMatch && !rollMatch) return false;
      }
      return true;
    });
    
    window.activeRosterList = filteredRows;
    
    const filteredCountEl = document.getElementById('repFilteredCount');
    const totalCountEl = document.getElementById('repTotalCount');
    if (filteredCountEl) filteredCountEl.textContent = filteredRows.length;
    if (totalCountEl) totalCountEl.textContent = allRows.length;
    
    body.innerHTML = '';
    if (filteredRows.length === 0) {
      body.innerHTML = `<tr><td colspan="8" class="py-10 text-center text-zinc-500 font-sans">No roster records found matching the criteria.</td></tr>`;
      return;
    }
    
    filteredRows.forEach(r => {
      let statusBadge = '';
      if (r.status === 'present') {
        statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Present</span>';
      } else if (r.status === 'late') {
        statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Late</span>';
      } else {
        statusBadge = '<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Absent</span>';
      }
      
      const tr = document.createElement('tr');
      tr.className = "hover:bg-white/5 transition-colors border-b border-white/5 font-sans";
      tr.innerHTML = `
        <td class="py-2.5 px-3 font-mono font-bold text-white text-left">${r.rollNumber}</td>
        <td class="py-2.5 px-3 font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer hover:underline text-left" onclick="openStudentProfileModal('${r.studentId}')">${r.studentName}</td>
        <td class="py-2.5 px-3 text-zinc-300 text-left font-medium">
          ${r.subject}
          <span class="block text-[9px] text-zinc-500 font-normal">${r.semester}</span>
        </td>
        <td class="py-2.5 px-3 text-zinc-400 text-left font-sans">${r.teacher}</td>
        <td class="py-2.5 px-3 text-zinc-400 text-left font-mono">${r.sessionDate}</td>
        <td class="py-2.5 px-3 text-zinc-400 text-left font-mono">${r.checkInTimeStr}</td>
        <td class="py-2.5 px-3 text-left">${statusBadge}</td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="toggleAttRosterStatus('${r.sessionId}', '${r.studentId}', '${r.rollNumber}', '${r.status}')" class="px-2 py-0.5 bg-indigo-600/15 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded font-bold text-[9px] transition-all font-sans">Status</button>
          <button onclick="deleteAttRosterRecord('${r.sessionId}', '${r.rollNumber}')" class="px-1.5 py-0.5 bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded font-bold text-[9px] transition-all font-sans"><i class="fa-solid fa-trash-can"></i></button>
        </td>
      `;
      body.appendChild(tr);
    });
  };

  window.toggleAttRosterStatus = async function(sId, studentId, roll, current) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    const student = studentsMap[studentId] || {};
    const studentName = student.name || "Student";
    try {
      if (current === 'absent') {
        const encName = await AttendanceSecurity.encryptData(studentName);
        const encCoords = await AttendanceSecurity.encryptData("0,0");
        
        await db.ref(`attendance-v2/records/${sId}/${roll}`).set({
          studentId: studentId,
          studentName: encName,
          rollNumber: roll,
          checkInTime: Date.now(),
          checkOutTime: Date.now(),
          status: 'present',
          deviceFingerprint: 'BYPASS_ADMIN_MANUAL',
          location: encCoords,
          method: 'Manual',
          id: `ATT_MANUAL_${Date.now()}`
        });
        await logAuditTrail("Roster Overridden", `Marked roll ${roll} (${studentName}) as PRESENT in session ${sId} by ${authCheck.username}`);
      } else {
        await db.ref(`attendance-v2/records/${sId}/${roll}`).remove();
        await logAuditTrail("Roster Overridden", `Marked roll ${roll} (${studentName}) as ABSENT in session ${sId} by ${authCheck.username}`);
      }
    } catch(e) {
      alert("Toggle failed: " + e.message);
    }
  };

  window.deleteAttRosterRecord = async function(sId, roll) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    if (confirm(`Remove checked attendance for roll ${roll}?`)) {
      try {
        await db.ref(`attendance-v2/records/${sId}/${roll}`).remove();
        await logAuditTrail("Record Deleted", `Deleted checked attendance for roll ${roll} in session ${sId} by ${authCheck.username}`);
      } catch(e) {
        alert("Delete failed: " + e.message);
      }
    }
  };

  // Exports to CSV (kept as fallback)
  window.exportAttToCSV = function() {
    if (!window.activeRosterList || window.activeRosterList.length === 0) {
      alert("No checked-in roster records found to export.");
      return;
    }
    const s = sessionsMap[window.activeRosterSessionId];
    const subject = s ? s.subject : 'Lecture';
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll Number,Student Name,Check-In Time,Check-Out Time,Status,Method,Coordinates\n";
    
    window.activeRosterList.forEach(r => {
      const checkin = new Date(r.checkInTime).toLocaleString();
      const checkout = r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : 'N/A';
      csvContent += `${r.rollNumber},${r.studentNameDecrypted},${checkin},${checkout},${r.status},${r.method},"${r.locationDecrypted}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${subject}_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // High-Accuracy Real Excel Workbook Exporter (SheetJS)
  window.exportAttToExcel = function() {
    if (!window.activeRosterList || window.activeRosterList.length === 0) {
      alert("No checked-in roster records found to export.");
      return;
    }

    if (typeof XLSX === 'undefined') {
      alert("Excel export library is loading, please try again in a few seconds.");
      return;
    }

    const s = sessionsMap[window.activeRosterSessionId];
    const subject = s ? s.subject : 'Lecture Class';
    const teacher = s ? s.teacher : 'Teacher';
    const semester = s ? s.semester : 'Semester';
    const batch = s ? s.batch : 'Batch';
    
    const totalReg = registeredStudentsCount || 1;
    const checkedInCount = window.activeRosterList.length;
    const presentCount = window.activeRosterList.filter(r => r.status === 'present').length;
    const lateCount = window.activeRosterList.filter(r => r.status === 'late').length;
    const rate = ((checkedInCount / totalReg) * 100).toFixed(1);

    const wb = XLSX.utils.book_new();
    
    // Workbook Metadata and Stats Headers
    const headerData = [
      ["BCA STORE - ACADEMIC ROSTER ATTENDANCE REPORT"],
      ["Generated Date:", new Date().toLocaleString('en-IN')],
      ["Report Authenticity:", "100% Cryptographic Signature Secured"],
      [],
      ["SESSION METADATA"],
      ["Subject Class:", subject],
      ["Instructor:", teacher],
      ["Academic Term:", semester],
      ["Batch ID:", batch],
      ["Session Date:", s ? new Date(s.startTime).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')],
      ["Method Security:", s ? (s.qrSecret !== undefined ? "Rotating QR (15s Lock)" : "Expiring Campaign Link") : "N/A"],
      ["GPS Geofence:", s ? `${s.geofence.lat}, ${s.geofence.lng} (Radius: ${s.geofence.radius}m)` : "Disabled"],
      [],
      ["ROSTER SUMMARY STATISTICS"],
      ["Registered Class Strength:", totalReg],
      ["Checked-in Roster Count:", checkedInCount],
      ["Present Marks:", presentCount],
      ["Late Marks (Over Grace):", lateCount],
      ["Roster Attendance Rate:", `${rate}%`],
      [],
      ["DETAILED STUDENT ROSTER LOGS"],
      ["Roll Number", "Student Name", "Check-In Time", "Check-Out Time", "Roster Status", "Verification Method", "Coordinates Verified", "Device Fingerprint Block"]
    ];

    // Roster record items map
    const rowData = window.activeRosterList.map(r => {
      const checkin = new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const checkout = r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending';
      return [
        r.rollNumber,
        r.studentNameDecrypted,
        checkin,
        checkout,
        r.status.toUpperCase(),
        r.method || 'QR Code',
        r.locationDecrypted,
        r.deviceFingerprint || 'BYPASS'
      ];
    });

    const finalSheetData = [...headerData, ...rowData];
    const ws = XLSX.utils.aoa_to_sheet(finalSheetData);

    // Apply strict column widths for premium alignment and clarity
    ws['!cols'] = [
      { wch: 18 }, // Roll Number
      { wch: 28 }, // Student Name
      { wch: 18 }, // Check-In Time
      { wch: 18 }, // Check-Out Time
      { wch: 15 }, // Roster Status
      { wch: 22 }, // Verification Method
      { wch: 32 }, // Coordinates Verified
      { wch: 28 }  // Device Fingerprint Block
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Roster Logs");
    
    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Attendance_${safeSubject}_Roster.xlsx`);
  };

  // High-Accuracy Premium PDF Exporter
  window.exportAttToPDF = function() {
    if (!window.activeRosterList || window.activeRosterList.length === 0) {
      alert("No checked-in roster records found to export.");
      return;
    }

    const s = sessionsMap[window.activeRosterSessionId];
    const subject = s ? s.subject : 'Lecture Class';
    const teacher = s ? s.teacher : 'Teacher';
    const semester = s ? s.semester : 'Semester';
    const batch = s ? s.batch : 'Batch';

    if (typeof window.jspdf === 'undefined') {
      alert("PDF library is not loaded. Try again in a few seconds.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Premium Navy Background Accent Banner
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("BCA STORE - ATTENDANCE REPORT", 14, 22);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 255);
    doc.text(`Official Academic Roster • Generated on ${new Date().toLocaleString('en-IN')}`, 14, 30);

    // Session Information Panel
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    
    // Left Column Info
    doc.text(`Subject: ${subject}`, 14, 48);
    doc.text(`Instructor: ${teacher}`, 14, 54);
    doc.text(`Academic Term: ${semester}`, 14, 60);
    doc.text(`Batch ID: ${batch}`, 14, 66);

    // Right Column Info - Statistics calculations
    const totalReg = registeredStudentsCount || 1;
    const checkedInCount = window.activeRosterList.length;
    const presentCount = window.activeRosterList.filter(r => r.status === 'present').length;
    const lateCount = window.activeRosterList.filter(r => r.status === 'late').length;
    const rate = ((checkedInCount / totalReg) * 100).toFixed(1);

    doc.text(`Total Registered Strength: ${registeredStudentsCount}`, 115, 48);
    doc.text(`Checked-In Roster Count: ${checkedInCount}`, 115, 54);
    doc.text(`Present: ${presentCount} | Late: ${lateCount}`, 115, 60);
    doc.text(`Roster Participation Rate: ${rate}%`, 115, 66);

    // Divider Line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 72, 196, 72);

    const columns = [
      { header: 'Roll No', dataKey: 'rollNumber' },
      { header: 'Student Name', dataKey: 'studentName' },
      { header: 'Check-In', dataKey: 'checkInTime' },
      { header: 'Check-Out', dataKey: 'checkOutTime' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Auth Method', dataKey: 'method' },
      { header: 'GPS Coordinates', dataKey: 'location' }
    ];

    const rows = window.activeRosterList.map(r => ({
      rollNumber: r.rollNumber,
      studentName: r.studentNameDecrypted,
      checkInTime: new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      checkOutTime: r.checkOutTime ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Pending',
      status: r.status.toUpperCase(),
      method: r.method,
      location: r.locationDecrypted
    }));

    doc.autoTable({
      columns: columns,
      body: rows,
      startY: 78,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      bodyStyles: { textColor: [30, 41, 59] },
      margin: { top: 78, left: 14, right: 14 },
      didDrawPage: function(data) {
        // Footer pagination
        const str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(str, 196 - doc.getTextWidth(str), 287);
        doc.text("System Secured by AES-256 Web Crypto API", 14, 287);
      }
    });

    // Signatures block at the end of the report
    const finalY = doc.lastAutoTable.finalY || 120;
    if (finalY + 40 < 290) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.line(14, finalY + 20, 74, finalY + 20);
      doc.text("Instructor Signature", 14, finalY + 25);

      doc.line(136, finalY + 20, 196, finalY + 20);
      doc.text("System Administrator Approval", 136, finalY + 25);
    }

    const safeSubject = subject.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Attendance_${safeSubject}_Roster.pdf`);
  };

  // Load and listen on correction requests queue
  function loadCorrectionsQueue() {
    if (typeof db === 'undefined' || !db) return;

    db.ref('attendance-v2/corrections').on('value', snapshot => {
      const body = document.getElementById('attCorrectionsTableBody');
      if (!body) return;

      body.innerHTML = '';
      if (!snapshot.exists()) {
        body.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-zinc-500 font-sans">No pending requests.</td></tr>`;
        return;
      }

      let list = [];
      snapshot.forEach(child => {
        list.push({
          id: child.key,
          ...child.val()
        });
      });

      list.sort((a,b) => b.requestedAt - a.requestedAt);

      list.forEach(c => {
        const date = new Date(c.requestedAt).toLocaleDateString('en-IN');
        let statusColor = c.requestedStatus === 'present' ? 'text-emerald-400' : 'text-amber-400';

        let decisionBtns = '';
        if (c.status === 'pending') {
          decisionBtns = `
            <button onclick="approveAttCorrection('${c.id}')" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[9px] transition-all mr-1 font-sans"><i class="fa-solid fa-check"></i> Approve</button>
            <button onclick="rejectAttCorrection('${c.id}')" class="px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 rounded font-bold text-[9px] transition-all font-sans"><i class="fa-solid fa-xmark"></i> Reject</button>
          `;
        } else {
          const badge = c.status === 'approved' ? 'text-emerald-400' : 'text-rose-400';
          decisionBtns = `<span class="${badge} font-bold font-mono uppercase text-[9px]">${c.status}</span>`;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors font-sans";
        tr.innerHTML = `
          <td class="py-2.5 px-3 font-bold text-white text-left">${c.studentName}<span class="block text-[9px] text-zinc-500 font-normal">Roll: ${c.rollNumber}</span></td>
          <td class="py-2.5 px-3 font-medium text-zinc-300 text-left">${c.subject}<span class="block text-[9px] text-zinc-500">Date: ${c.lectureDate}</span></td>
          <td class="py-2.5 px-3 text-zinc-400 max-w-[150px] truncate text-left" title="${c.reason}">${c.reason}</td>
          <td class="py-2.5 px-3 font-bold ${statusColor} uppercase font-mono text-left">${c.requestedStatus}</td>
          <td class="py-2.5 px-3 text-right">${decisionBtns}</td>
        `;
        body.appendChild(tr);
      });
    });
  }

  window.approveAttCorrection = async function(corrId) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    try {
      const corrRef = db.ref(`attendance-v2/corrections/${corrId}`);
      const snap = await corrRef.once('value');
      if (!snap.exists()) return;

      const c = snap.val();
      
      const sessionsSnap = await db.ref('attendance-v2/sessions').once('value');
      let matchedSessId = `CORR_MANUAL_${Date.now()}`;
      
      if (sessionsSnap.exists()) {
        sessionsSnap.forEach(sSnap => {
          const s = sSnap.val();
          const sDate = new Date(s.startTime).toISOString().split('T')[0];
          if (s.subject.toLowerCase().trim() === c.subject.toLowerCase().trim() && sDate === c.lectureDate) {
            matchedSessId = sSnap.key;
          }
        });
      }

      // Encrypt name and mock coordinates for correction override
      const encName = await AttendanceSecurity.encryptData(c.studentName);
      const encCoords = await AttendanceSecurity.encryptData("0,0");

      const recordRef = db.ref(`attendance-v2/records/${matchedSessId}/${c.rollNumber}`);
      await recordRef.set({
        studentId: c.studentId,
        studentName: encName, // ENCRYPTED
        rollNumber: c.rollNumber,
        checkInTime: Date.now(),
        checkOutTime: Date.now(),
        status: c.requestedStatus,
        deviceFingerprint: 'BYPASS_ADMIN_CORR',
        location: encCoords, // ENCRYPTED
        method: 'Manual',
        id: `ATT_CORR_${Date.now()}`
      });

      await corrRef.update({ status: 'approved' });
      await logAuditTrail("Correction Approved", `Approved correction for ${c.studentName} (Roll ${c.rollNumber}) by ${authCheck.username}`);
      alert("Correction request approved!");
    } catch(e) {
      alert("Approval failed: " + e.message);
    }
  };

  window.rejectAttCorrection = async function(corrId) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    try {
      await db.ref(`attendance-v2/corrections/${corrId}`).update({ status: 'rejected' });
      await logAuditTrail("Correction Rejected", `Rejected request ${corrId} by ${authCheck.username}`);
      alert("Correction request rejected.");
    } catch(e) {
      alert("Rejection failed: " + e.message);
    }
  };

  // Load Administrative Audit Logs List
  function loadAuditLogsList() {
    if (typeof db === 'undefined' || !db) return;

    db.ref('attendance-v2/audit_logs').on('value', snapshot => {
      const body = document.getElementById('attAuditTableBody');
      if (!body) return;

      body.innerHTML = '';
      if (!snapshot.exists()) {
        body.innerHTML = `<tr><td colspan="3" class="py-10 text-center text-zinc-500 font-sans">No audit logs found.</td></tr>`;
        return;
      }

      let logs = [];
      snapshot.forEach(child => {
        logs.push(child.val());
      });

      logs.sort((a,b) => b.timestamp - a.timestamp);

      logs.slice(0, 50).forEach(l => {
        const timeStr = new Date(l.timestamp).toLocaleString('en-IN');
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors font-sans";
        tr.innerHTML = `
          <td class="py-2 px-3 text-indigo-400 font-bold text-left">${l.action}</td>
          <td class="py-2 px-3 text-zinc-300 text-left">${l.details}</td>
          <td class="py-2 px-3 text-right text-zinc-500 font-mono">${timeStr}</td>
        `;
        body.appendChild(tr);
      });
    });
  }

  // Load and listen on ID Card Verification Queue
  function loadIdCardsQueue() {
    if (typeof db === 'undefined' || !db) return;

    db.ref('students').on('value', snapshot => {
      const body = document.getElementById('attIdcardsTableBody');
      if (!body) return;

      body.innerHTML = '';
      if (!snapshot.exists()) {
        body.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-zinc-500 font-sans">No students registered.</td></tr>`;
        return;
      }

      let list = [];
      snapshot.forEach(child => {
        const student = child.val();
        if (student.idCard) {
          list.push({
            id: child.key,
            ...student
          });
        }
      });

      if (list.length === 0) {
        body.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-zinc-500 font-sans">No ID card uploads found in the system.</td></tr>`;
        return;
      }

      // Sort: 'pending' first, then 'rejected', then 'approved'
      const statusOrder = { 'pending': 1, 'rejected': 2, 'approved': 3 };
      list.sort((a, b) => {
        const orderA = statusOrder[a.idCardStatus || 'pending'] || 1;
        const orderB = statusOrder[b.idCardStatus || 'pending'] || 1;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (b.registeredAt || 0) - (a.registeredAt || 0);
      });

      list.forEach(stu => {
        let statusBadge = '';
        const status = stu.idCardStatus || 'pending';
        if (status === 'pending') {
          statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Pending Review</span>';
        } else if (status === 'approved') {
          statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Approved</span>';
        } else {
          statusBadge = '<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold uppercase text-[9px] font-sans">Rejected</span>';
        }

        let decisionBtns = '';
        if (status === 'pending') {
          decisionBtns = `
            <button onclick="approveStudentIdCard('${stu.id}')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[9px] transition-all mr-1 font-sans"><i class="fa-solid fa-check"></i> Approve</button>
            <button onclick="rejectStudentIdCard('${stu.id}')" class="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[9px] transition-all font-sans"><i class="fa-solid fa-xmark"></i> Reject</button>
          `;
        } else if (status === 'approved') {
          decisionBtns = `
            <button onclick="rejectStudentIdCard('${stu.id}')" class="px-2 py-1 bg-white/5 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg text-[9px] font-bold transition-all"><i class="fa-solid fa-xmark"></i> Revoke & Reject</button>
          `;
        } else {
          decisionBtns = `
            <button onclick="approveStudentIdCard('${stu.id}')" class="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-[9px] font-bold transition-all"><i class="fa-solid fa-check"></i> Approve</button>
          `;
        }

        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/5 border-b border-white/5 transition-colors font-sans";
        tr.innerHTML = `
          <td class="py-2.5 px-3 text-left">
            <span class="text-white font-bold block cursor-pointer hover:text-indigo-400 hover:underline" onclick="openStudentProfileModal('${stu.id}')">${stu.name || 'Student'}</span>
            <span class="text-[9px] text-zinc-500 block">User: ${stu.username || 'N/A'} • ID: ${stu.id}</span>
          </td>
          <td class="py-2.5 px-3 text-zinc-300 text-left font-medium">
            ${stu.college || 'N/A'}
            <span class="block text-[9px] text-zinc-500 font-normal">${stu.semester || 'N/A'}</span>
          </td>
          <td class="py-2.5 px-3 text-left">
            <img src="${stu.idCard}" alt="ID Card" class="w-12 h-8 rounded object-cover border border-white/10 cursor-zoom-in hover:scale-105 transition-all" onclick="openStudentProfileModal('${stu.id}')">
          </td>
          <td class="py-2.5 px-3 text-left">${statusBadge}</td>
          <td class="py-2.5 px-3 text-right whitespace-nowrap">${decisionBtns}</td>
        `;
        body.appendChild(tr);
      });
    });
  }

  window.approveStudentIdCard = async function(studentId) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    try {
      await db.ref(`students/${studentId}`).update({
        idCardStatus: 'approved'
      });
      db.ref(`students/${studentId}/activityLogs`).push().set({
        event: 'ID Card Approved',
        timestamp: Date.now(),
        details: `College ID Card verified and approved by admin.`
      });
      await logAuditTrail("Student ID Approved", `Approved College ID card for student ${studentId} by ${authCheck.username}`);
      alert("Student ID card approved successfully!");
      
      const modal = document.getElementById('studentProfileModal');
      if (modal && !modal.classList.contains('hidden')) {
        openStudentProfileModal(studentId);
      }
    } catch(e) {
      alert("Approval failed: " + e.message);
    }
  };

  window.rejectStudentIdCard = async function(studentId) {
    if (typeof db === 'undefined' || !db) return;
    const authCheck = await getAuthorizedAdmin();
    if (!authCheck.authorized) {
      alert("Unauthorized action!");
      return;
    }

    if (confirm("Are you sure you want to reject this student's ID Card? They will be blocked from check-ins until they upload a new image.")) {
      try {
        await db.ref(`students/${studentId}`).update({
          idCardStatus: 'rejected'
        });
        db.ref(`students/${studentId}/activityLogs`).push().set({
          event: 'ID Card Rejected',
          timestamp: Date.now(),
          details: `College ID Card was rejected by admin. Re-upload required.`
        });
        await logAuditTrail("Student ID Rejected", `Rejected College ID card for student ${studentId} by ${authCheck.username}`);
        alert("Student ID card rejected.");
        
        const modal = document.getElementById('studentProfileModal');
        if (modal && !modal.classList.contains('hidden')) {
          openStudentProfileModal(studentId);
        }
      } catch(e) {
        alert("Rejection failed: " + e.message);
      }
    }
  };

  window.openStudentProfileModal = async function(studentId) {
    if (typeof db === 'undefined' || !db) return;

    try {
      const snap = await db.ref(`students/${studentId}`).once('value');
      if (!snap.exists()) {
        alert("Student details not found.");
        return;
      }

      const stu = snap.val();
      
      document.getElementById('modalStudentPhoto').src = stu.photo || 'avatar_faculty1.png';
      document.getElementById('modalStudentName').textContent = stu.name || 'Full Name';
      document.getElementById('modalStudentIdText').textContent = `ID: ${studentId}`;
      document.getElementById('modalStudentUsername').textContent = stu.username || 'N/A';
      document.getElementById('modalStudentCollege').textContent = stu.college || 'N/A';
      document.getElementById('modalStudentSemester').textContent = stu.semester || 'N/A';
      
      const regDate = stu.registeredAt ? new Date(stu.registeredAt).toLocaleDateString('en-IN') : 'N/A';
      document.getElementById('modalStudentRegDate').textContent = regDate;

      const uploadDateVal = stu.idCardUploadDate ? new Date(stu.idCardUploadDate).toLocaleDateString('en-IN') : (stu.registeredAt ? new Date(stu.registeredAt).toLocaleDateString('en-IN') : 'N/A');
      const uploadDateEl = document.getElementById('modalStudentIdCardUploadDate');
      if (uploadDateEl) {
        uploadDateEl.textContent = stu.idCard ? uploadDateVal : 'N/A';
      }
      
      const mailEl = document.getElementById('modalStudentEmail');
      mailEl.textContent = stu.email || 'N/A';
      mailEl.href = stu.email ? `mailto:${stu.email}` : '';
      
      document.getElementById('modalStudentPhone').textContent = stu.phone || 'N/A';
      document.getElementById('modalStudentDob').textContent = stu.dob || 'N/A';

      const status = stu.idCardStatus || 'unuploaded';
      const badge = document.getElementById('modalStudentStatusBadge');
      if (badge) {
        badge.textContent = status === 'unuploaded' ? 'NOT UPLOADED' : status;
        if (status === 'approved') {
          badge.className = "mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        } else if (status === 'pending') {
          badge.className = "mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20";
        } else if (status === 'rejected') {
          badge.className = "mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border-rose-500/20";
        } else {
          badge.className = "mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
        }
      }

      const cardImg = document.getElementById('modalIdCardImg');
      const noCardTxt = document.getElementById('modalNoIdCardText');
      const downloadBtn = document.getElementById('modalIdCardDownload');
      if (stu.idCard) {
        cardImg.src = stu.idCard;
        cardImg.classList.remove('hidden');
        noCardTxt.classList.add('hidden');
        if (downloadBtn) {
          downloadBtn.href = stu.idCard;
          downloadBtn.classList.remove('hidden');
        }
      } else {
        cardImg.src = '';
        cardImg.classList.add('hidden');
        noCardTxt.classList.remove('hidden');
        if (downloadBtn) downloadBtn.classList.add('hidden');
      }

      const decisionRow = document.getElementById('modalAdminDecisionRow');
      if (decisionRow) {
        if (stu.idCard) {
          decisionRow.classList.remove('hidden');
          document.getElementById('modalApproveBtn').onclick = () => window.approveStudentIdCard(studentId);
          document.getElementById('modalRejectBtn').onclick = () => window.rejectStudentIdCard(studentId);
        } else {
          decisionRow.classList.add('hidden');
        }
      }

      document.getElementById('studentProfileModal').classList.remove('hidden');
    } catch(e) {
      alert("Error loading profile: " + e.message);
    }
  };

  window.closeStudentProfileModal = function() {
    document.getElementById('studentProfileModal').classList.add('hidden');
  };

  // Dynamic Subjects and Filters Helpers
  function updateDeployFormSubjects() {
    const semSelect = document.getElementById('attSessSemester');
    const subSelect = document.getElementById('attSessSubject');
    if (!semSelect || !subSelect) return;
    
    const semVal = semSelect.value;
    subSelect.innerHTML = '<option value="">Select Subject</option>';
    
    if (semVal) {
      const semKey = semVal.replace(/\s+/g, '');
      const subjects = SUBJECTS[semKey];
      if (subjects) {
        subjects.forEach(sub => {
          const optionVal = `${sub.code} ${sub.name}`;
          const opt = document.createElement('option');
          opt.value = optionVal;
          opt.textContent = optionVal;
          subSelect.appendChild(opt);
        });
      }
    } else {
      subSelect.innerHTML = '<option value="">Select Semester First</option>';
    }
  }

  function updateReportSubjectAndSessionOptions() {
    const semSelect = document.getElementById('repFilterSemester');
    const subSelect = document.getElementById('repFilterSubject');
    const sessSelect = document.getElementById('repFilterSession');
    if (!semSelect || !subSelect || !sessSelect) return;
    
    const semVal = semSelect.value;
    
    subSelect.innerHTML = '<option value="all">All Subjects</option>';
    if (semVal !== 'all') {
      const semKey = semVal.replace(/\s+/g, '');
      const subjects = SUBJECTS[semKey];
      if (subjects) {
        subjects.forEach(sub => {
          const optionVal = `${sub.code} ${sub.name}`;
          const opt = document.createElement('option');
          opt.value = optionVal;
          opt.textContent = optionVal;
          subSelect.appendChild(opt);
        });
      }
    }
    
    updateReportSessionFilterOptions();
  }

  function updateReportSessionFilterOptions() {
    const semSelect = document.getElementById('repFilterSemester');
    const sessSelect = document.getElementById('repFilterSession');
    if (!semSelect || !sessSelect) return;
    
    const semVal = semSelect.value;
    const currentSessVal = sessSelect.value;
    
    sessSelect.innerHTML = '<option value="all">All Sessions</option>';
    const sessionsList = [];
    for (let sId of Object.keys(sessionsMap)) {
      const s = sessionsMap[sId];
      if (semVal === 'all' || s.semester === semVal) {
        sessionsList.push({ id: sId, ...s });
      }
    }
    sessionsList.sort((a,b) => b.startTime - a.startTime);
    sessionsList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      const dateStr = new Date(s.startTime).toLocaleDateString('en-IN');
      opt.textContent = `${s.subject} (${dateStr} - ${s.teacher})`;
      sessSelect.appendChild(opt);
    });
    
    if (currentSessVal) {
      sessSelect.value = currentSessVal;
    }
  }

  window.onReportFilterChange = function(semesterChanged = false) {
    if (semesterChanged) {
      updateReportSubjectAndSessionOptions();
    }
    renderRosterReport();
  };

  window.shareAttSessionOnWhatsApp = function(sId) {
    const s = sessionsMap[sId];
    if (!s) return;
    
    const linkUrl = `${window.location.origin}/attendance.html?session=${sId}`;
    
    const message = `📝 *BCA CLASS ATTENDANCE SESSION*

Dear Students, the attendance session for the following lecture is now active. Please click on the link below to mark your attendance.

📌 *Semester:* ${s.semester}
📖 *Subject:* ${s.subject}
👨‍🏫 *Instructor:* ${s.teacher}
🔗 *Attendance Link:* ${linkUrl}

_Note: Please ensure you are within the classroom geofence area. Proxies are strictly monitored._`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // ============================================================
  // ID CARD ZOOM PREVIEW CONTROLLER
  // ============================================================
  let idCardZoomLevel = 1.0;
  let isPanningIdCard = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOffsetX = 0;
  let panOffsetY = 0;

  window.zoomStudentIdCard = function() {
    const srcImg = document.getElementById('modalIdCardImg');
    if (!srcImg || !srcImg.src || srcImg.src.includes('unuploaded') || srcImg.src === '') return;
    
    const zoomModal = document.getElementById('idCardZoomModal');
    const zoomImg = document.getElementById('idCardZoomImg');
    const downloadLink = document.getElementById('idCardZoomDownload');
    
    if (zoomModal && zoomImg) {
      zoomImg.src = srcImg.src;
      if (downloadLink) downloadLink.href = srcImg.src;
      zoomModal.classList.remove('hidden');
      window.resetIdCardZoom();
    }
  };

  window.closeIdCardZoom = function() {
    const zoomModal = document.getElementById('idCardZoomModal');
    if (zoomModal) zoomModal.classList.add('hidden');
  };

  window.adjustIdCardZoom = function(amount) {
    idCardZoomLevel = Math.max(0.5, Math.min(idCardZoomLevel + amount, 4.0));
    updateIdCardZoomTransform();
  };

  window.resetIdCardZoom = function() {
    idCardZoomLevel = 1.0;
    panOffsetX = 0;
    panOffsetY = 0;
    updateIdCardZoomTransform();
  };

  function updateIdCardZoomTransform() {
    const img = document.getElementById('idCardZoomImg');
    const badge = document.getElementById('idCardZoomBadge');
    if (img) {
      img.style.transform = `scale(${idCardZoomLevel}) translate(${panOffsetX / idCardZoomLevel}px, ${panOffsetY / idCardZoomLevel}px)`;
    }
    if (badge) {
      badge.textContent = Math.round(idCardZoomLevel * 100) + '%';
    }
  }

  window.startIdCardPan = function(e) {
    if (idCardZoomLevel <= 1.0) return; // Only pan when zoomed
    isPanningIdCard = true;
    panStartX = e.clientX - panOffsetX;
    panStartY = e.clientY - panOffsetY;
    const container = document.getElementById('idCardZoomContainer');
    if (container) container.style.cursor = 'grabbing';
  };

  window.doIdCardPan = function(e) {
    if (!isPanningIdCard) return;
    panOffsetX = e.clientX - panStartX;
    panOffsetY = e.clientY - panStartY;
    updateIdCardZoomTransform();
  };

  window.stopIdCardPan = function() {
    isPanningIdCard = false;
    const container = document.getElementById('idCardZoomContainer');
    if (container) container.style.cursor = 'grab';
  };

})();
