// ============================================================
// STUDENT REGISTRATION & ACADEMIC INTELLIGENCE CONSOLE (ERP)
// ============================================================

(function () {
  // Global reference and state variables
  window.allStudentsList = [];
  window.selectedStudentId = null;
  window.currentProfileTab = 'overview';
  
  // Local cache for attendance data
  let sessionsMap = {};
  let recordsMap = {};
  let listLayoutMode = 'grid'; // 'grid' or 'table'

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

  // Lightbox overlay zoom modal for student profile photo
  window.openFullImage = function(photoSrc, studentName) {
    if (!photoSrc) return;
    
    let lightbox = document.getElementById('adminLightboxOverlay');
    if (lightbox) lightbox.remove();
    
    lightbox = document.createElement('div');
    lightbox.id = 'adminLightboxOverlay';
    lightbox.style.position = 'fixed';
    lightbox.style.top = '0';
    lightbox.style.left = '0';
    lightbox.style.width = '100vw';
    lightbox.style.height = '100vh';
    lightbox.style.backgroundColor = 'rgba(10, 12, 30, 0.95)';
    lightbox.style.backdropFilter = 'blur(12px)';
    lightbox.style.zIndex = '99999';
    lightbox.style.display = 'flex';
    lightbox.style.flexDirection = 'column';
    lightbox.style.alignItems = 'center';
    lightbox.style.justifyContent = 'center';
    lightbox.style.cursor = 'zoom-out';
    
    lightbox.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; max-width: 90%; max-height: 85%;" onclick="event.stopPropagation();">
        <button style="position: absolute; top: -45px; right: 0; background: none; border: none; color: #fff; font-size: 2.2rem; cursor: pointer; line-height: 1; opacity: 0.8;" onclick="document.getElementById('adminLightboxOverlay').remove()">✕</button>
        <img src="${photoSrc}" alt="${studentName}" style="max-width: 100%; max-height: 75vh; border-radius: 20px; border: 3px solid rgba(255,255,255,0.1); box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />
        <h3 style="margin-top: 20px; color: #fff; font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.35rem;">${studentName}</h3>
      </div>
    `;
    
    lightbox.onclick = function() {
      lightbox.remove();
    };
    
    document.body.appendChild(lightbox);
  };

  // Terminate active device session
  window.terminateStudentSession = function(studentId, deviceId) {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    if (confirm("Are you sure you want to terminate this active device session? The student will be logged out of this device immediately.")) {
      firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).remove()
        .then(() => {
          alert("Session terminated successfully.");
          showStudentProfilePage(studentId);
        })
        .catch(err => {
          alert("Error terminating session: " + err.message);
        });
    }
  };

  // Initialize Styles on DOM Load
  document.addEventListener('DOMContentLoaded', () => {
    injectAdminRegStyles();
  });

  // Toggle grid/table list view mode
  window.switchStudentLayout = function(mode) {
    listLayoutMode = mode;
    const btnGrid = document.getElementById('layoutBtnGrid');
    const btnTable = document.getElementById('layoutBtnTable');
    if (btnGrid && btnTable) {
      if (mode === 'grid') {
        btnGrid.className = "px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold";
        btnTable.className = "px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-xs font-semibold";
      } else {
        btnTable.className = "px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold";
        btnGrid.className = "px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-xs font-semibold";
      }
    }
    filterStudentsDirectory();
  };

  // Main entry point called by switchAdminTab
  window.loadRegisteredStudentsTab = function () {
    const container = document.getElementById('admin-tab-registered-students');
    if (!container) return;

    container.innerHTML = `
      <div class="reg-admin-wrapper select-none font-sans" id="studentRegViewWrapper">
        <!-- Stage 1: Student List Directory Section -->
        <div id="studentListContainer" class="space-y-6">
          <div class="saas-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/10">
            <div class="saas-header-text">
              <h2 class="text-xl font-black text-white font-[Outfit] tracking-tight">🎓 Student Roster Directory</h2>
              <p class="text-xs text-zinc-400 mt-1">Monitor course enrolments, smart tracking stats, and academic profiles.</p>
            </div>
            <div class="saas-header-actions flex items-center gap-3">
              <div class="flex items-center bg-zinc-950/40 p-1 border border-white/10 rounded-xl">
                <button id="layoutBtnGrid" onclick="switchStudentLayout('grid')" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Grid View</button>
                <button id="layoutBtnTable" onclick="switchStudentLayout('table')" class="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-xs font-semibold ml-1">Table View</button>
              </div>
              <button class="px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all shadow" onclick="loadRegisteredStudentsTab()">🔄 Refresh Directory</button>
            </div>
          </div>

          <!-- KPI stats HUD -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4" id="regStatsContainer">
            <div class="adm-skeleton-card bg-zinc-900/50 p-4 rounded-2xl border border-white/5 h-24"></div>
            <div class="adm-skeleton-card bg-zinc-900/50 p-4 rounded-2xl border border-white/5 h-24"></div>
            <div class="adm-skeleton-card bg-zinc-900/50 p-4 rounded-2xl border border-white/5 h-24"></div>
            <div class="adm-skeleton-card bg-zinc-900/50 p-4 rounded-2xl border border-white/5 h-24"></div>
            <div class="adm-skeleton-card bg-zinc-900/50 p-4 rounded-2xl border border-white/5 h-24"></div>
          </div>

          <!-- CHARTS SECTION -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="glass-card chart-card p-5 rounded-2xl border border-white/10 lg:col-span-2 space-y-4">
              <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider block">📈 Registration Growth Trend (Last 7 Days)</h3>
              <div id="growthChartContainer" class="h-40 relative">
                <div class="w-full h-full bg-white/5 rounded-xl animate-pulse"></div>
              </div>
            </div>
            <div class="glass-card chart-card p-5 rounded-2xl border border-white/10 lg:col-span-1 space-y-4">
              <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider block">🏢 College & Semester Distributions</h3>
              <div id="distributionContainer" class="h-40 relative">
                <div class="w-full h-full bg-white/5 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- FILTERS & DIRECTORY GRID/TABLE -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-5">
            <div class="db-filter-bar flex flex-col lg:flex-row justify-between gap-4">
              <!-- Search bar -->
              <div class="relative flex-1 min-w-[280px]">
                <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">🔍</span>
                <input type="text" id="dbStudentSearch" placeholder="Search by name, roll, reg, mobile, parent, email..." oninput="filterStudentsDirectory()" class="w-full bg-zinc-950/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none focus:border-indigo-500 transition-all">
              </div>
              
              <!-- Filter dropdown Grid -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-2 flex-wrap">
                <select id="filterCollege" onchange="filterStudentsDirectory()" class="bg-zinc-950/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer">
                  <option value="">All Colleges</option>
                  <option value="LND COLLEGE">LND COLLEGE</option>
                  <option value="MS COLLEGE">MS COLLEGE</option>
                  <option value="SNS COLLEGE">SNS COLLEGE</option>
                </select>
                <select id="filterSemester" onchange="filterStudentsDirectory()" class="bg-zinc-950/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer">
                  <option value="">All Semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                </select>
                <select id="filterAttendanceStatus" onchange="filterStudentsDirectory()" class="bg-zinc-950/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer">
                  <option value="">Attendance Rate</option>
                  <option value="regular">Regular (>=75%)</option>
                  <option value="low">Low (50-74%)</option>
                  <option value="critical">Critical (<50%)</option>
                  <option value="inactive">Inactive Student</option>
                </select>
                <select id="filterAdmissionYear" onchange="filterStudentsDirectory()" class="bg-zinc-950/40 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer">
                  <option value="">Admission Year</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>

            <!-- Directory output target -->
            <div id="studentDirectoryTarget">
              <div class="text-center py-12 text-xs text-zinc-500 font-sans">Compiling Student database directory...</div>
            </div>
          </div>
        </div>

        <!-- Stage 2: ERP Student Profile Page Content (Hidden initially) -->
        <div id="studentProfilePageContainer" class="hidden space-y-6">
          <!-- Profiles are drawn dynamically in showStudentProfilePage -->
        </div>
      </div>
    `;

    fetchStudentsAndTelemetry();
  };

  // Real-time Firebase Fetch for Telemetry calculations
  function fetchStudentsAndTelemetry() {
    if (typeof firebase === 'undefined' || !firebase.database) return;

    // Load attendance maps first to enable attendance percentage computations
    firebase.database().ref('attendance-v2/sessions').once('value').then(sessSnap => {
      sessionsMap = sessSnap.exists() ? sessSnap.val() : {};
      
      firebase.database().ref('attendance-v2/records').once('value').then(recSnap => {
        recordsMap = recSnap.exists() ? recSnap.val() : {};
        
        // Load Students directory
        firebase.database().ref('students').on('value', snap => {
          const data = snap.val();
          const list = [];
          if (data) {
            Object.keys(data).forEach(key => {
              list.push({
                id: key,
                ...data[key]
              });
            });
          }
          list.sort((a, b) => (b.registeredAt || 0) - (a.registeredAt || 0));
          window.allStudentsList = list;

          renderKpiWidgets();
          renderCharts();
          filterStudentsDirectory();

          // Refresh current page if profile is open
          if (window.selectedStudentId && document.getElementById('studentProfilePageContainer') && !document.getElementById('studentProfilePageContainer').classList.contains('hidden')) {
            showStudentProfilePage(window.selectedStudentId);
          }
        });
      });
    });
  }

  // Render KPIs
  function renderKpiWidgets() {
    const container = document.getElementById('regStatsContainer');
    if (!container) return;

    const list = window.allStudentsList;
    const total = list.length;
    const lnd = list.filter(s => s.college === 'LND COLLEGE').length;
    const ms = list.filter(s => s.college === 'MS COLLEGE').length;
    const sns = list.filter(s => s.college === 'SNS COLLEGE').length;
    const elite = list.filter(s => s.isElitePlusUser).length;

    container.innerHTML = `
      <div class="adm-kpi-card bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <span class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Total Directory</span>
        <div class="text-2xl font-black text-white mt-1 font-[Outfit]">${total}</div>
        <span class="text-[8px] text-emerald-400 font-bold uppercase tracking-wider block mt-1">● Active ERP</span>
      </div>
      <div class="adm-kpi-card bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <span class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">LND College</span>
        <div class="text-2xl font-black text-indigo-400 mt-1 font-[Outfit]">${lnd}</div>
        <span class="text-[8px] text-zinc-500 block mt-1">BCA Enrolled</span>
      </div>
      <div class="adm-kpi-card bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <span class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">MS College</span>
        <div class="text-2xl font-black text-sky-400 mt-1 font-[Outfit]">${ms}</div>
        <span class="text-[8px] text-zinc-500 block mt-1">BCA Enrolled</span>
      </div>
      <div class="adm-kpi-card bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <span class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">SNS College</span>
        <div class="text-2xl font-black text-amber-500 mt-1 font-[Outfit]">${sns}</div>
        <span class="text-[8px] text-zinc-500 block mt-1">BCA Enrolled</span>
      </div>
      <div class="adm-kpi-card bg-zinc-950/40 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
        <span class="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Elite Plus</span>
        <div class="text-2xl font-black text-purple-400 mt-1 font-[Outfit]">${elite}</div>
        <span class="text-[8px] text-purple-400 font-bold uppercase block mt-1">💎 Premium Ranks</span>
      </div>
    `;
  }

  // Draw Charts
  function renderCharts() {
    const growthChartEl = document.getElementById('growthChartContainer');
    const distChartEl = document.getElementById('distributionContainer');

    if (!growthChartEl || !distChartEl) return;

    const list = window.allStudentsList;
    if (list.length === 0) return;

    // Growth trend (last 7 days)
    const last7Days = [];
    const dateCounts = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      last7Days.push(key);
      dateCounts[key] = 0;
    }

    list.forEach(student => {
      if (student.registeredAt) {
        const dateKey = new Date(student.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dateKey in dateCounts) {
          dateCounts[dateKey]++;
        }
      }
    });

    const growthValues = last7Days.map(day => dateCounts[day]);
    let runningSum = list.filter(s => s.registeredAt < (Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const cumulativeValues = growthValues.map(v => {
      runningSum += v;
      return runningSum;
    });
    const maxCumulative = Math.max(...cumulativeValues, 10);

    // SVG Line Graph
    const svgWidth = 450;
    const svgHeight = 140;
    const padding = 20;
    const plotWidth = svgWidth - padding * 2;
    const plotHeight = svgHeight - padding * 2;

    const points = cumulativeValues.map((val, idx) => {
      const x = padding + (idx / (cumulativeValues.length - 1)) * plotWidth;
      const y = padding + plotHeight - (val / maxCumulative) * plotHeight;
      return `${x},${y}`;
    }).join(' ');

    const labelsHtml = last7Days.map((day, idx) => {
      const x = padding + (idx / (last7Days.length - 1)) * plotWidth;
      return `<text x="${x}" y="${svgHeight - 2}" text-anchor="middle" font-size="8" fill="#71717a" font-weight="600">${day}</text>`;
    }).join('');

    growthChartEl.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full h-full overflow-visible font-sans">
        <line x1="${padding}" y1="${padding}" x2="${svgWidth - padding}" y2="${padding}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <line x1="${padding}" y1="${padding + plotHeight/2}" x2="${svgWidth - padding}" y2="${padding + plotHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <line x1="${padding}" y1="${padding + plotHeight}" x2="${svgWidth - padding}" y2="${padding + plotHeight}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <polygon points="${padding},${padding + plotHeight} ${points} ${svgWidth - padding},${padding + plotHeight}" fill="url(#areaGlow)" opacity="0.1" />
        <polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        ${cumulativeValues.map((val, idx) => {
          const x = padding + (idx / (cumulativeValues.length - 1)) * plotWidth;
          const y = padding + plotHeight - (val / maxCumulative) * plotHeight;
          return `
            <circle cx="${x}" cy="${y}" r="3" fill="#09090b" stroke="#6366f1" stroke-width="2" />
            <text x="${x}" y="${y - 8}" text-anchor="middle" font-size="8" fill="#fafafa" font-weight="800">${val}</text>
          `;
        }).join('')}
        ${labelsHtml}
        <defs>
          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="transparent" />
          </linearGradient>
        </defs>
      </svg>
    `;

    // Semester Distributions
    const semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6'];
    const semCounts = semesters.reduce((acc, sem) => {
      acc[sem] = list.filter(s => s.semester === sem).length;
      return acc;
    }, {});
    const maxSem = Math.max(...Object.values(semCounts), 1);

    distChartEl.innerHTML = `
      <div class="flex flex-col gap-2 w-full mt-1.5">
        ${semesters.map(sem => {
          const count = semCounts[sem];
          const pct = (count / maxSem) * 100;
          return `
            <div class="flex items-center gap-3 text-[10px]">
              <span class="w-16 font-semibold text-zinc-400 truncate">${sem}</span>
              <div class="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-sky-500 h-full rounded-full" style="width: ${pct}%"></div>
              </div>
              <span class="w-5 text-right font-bold text-zinc-200">${count}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Attendance rate and status badge utility
  function calculateStudentStats(student) {
    const studentRoll = student.rollNo || student.rollNumber || student.roll || 'N/A';
    const semester = student.semester || '';

    const eligibleSessions = Object.keys(sessionsMap)
      .map(id => ({ id, ...sessionsMap[id] }))
      .filter(s => s.semester === semester);
    
    const total = eligibleSessions.length;
    let present = 0;
    let late = 0;

    eligibleSessions.forEach(s => {
      const records = recordsMap[s.id] || {};
      let rec = records[studentRoll];
      if (!rec) {
        rec = Object.values(records).find(r => r.studentId === student.id);
      }
      if (rec) {
        if (rec.status === 'present') present++;
        else if (rec.status === 'late') late++;
      }
    });

    const attended = present + late;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Status Badge
    const now = Date.now();
    const isInactive = !student.lastActive || (now - student.lastActive > 14 * 24 * 60 * 60 * 1000);
    
    let statusText = 'Regular Student';
    let statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (isInactive) {
      statusText = 'Inactive Student';
      statusClass = 'bg-zinc-800 text-zinc-400 border border-zinc-700';
    } else if (rate < 50) {
      statusText = 'Critical Attendance';
      statusClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    } else if (rate < 75) {
      statusText = 'Low Attendance';
      statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }

    return {
      attendancePct: rate,
      presentCount: present,
      lateCount: late,
      absentCount: Math.max(0, total - attended),
      totalSessions: total,
      statusText: statusText,
      statusClass: statusClass,
      isInactive: isInactive
    };
  }

  // Filter student directory list
  window.filterStudentsDirectory = function () {
    const query = (document.getElementById('dbStudentSearch')?.value || '').toLowerCase().trim();
    const collegeFilter = document.getElementById('filterCollege')?.value || '';
    const semesterFilter = document.getElementById('filterSemester')?.value || '';
    const rateFilter = document.getElementById('filterAttendanceStatus')?.value || '';
    const yearFilter = document.getElementById('filterAdmissionYear')?.value || '';

    const target = document.getElementById('studentDirectoryTarget');
    if (!target) return;

    let list = window.allStudentsList;

    // Apply filters
    if (collegeFilter) list = list.filter(s => s.college === collegeFilter);
    if (semesterFilter) list = list.filter(s => s.semester === semesterFilter);
    if (yearFilter) list = list.filter(s => s.admissionYear === yearFilter || (s.registeredAt && new Date(s.registeredAt).getFullYear().toString() === yearFilter));

    // Attendance rate filter mapping
    let recordsData = list.map(student => {
      const stats = calculateStudentStats(student);
      return { student, stats };
    });

    if (rateFilter) {
      recordsData = recordsData.filter(item => {
        if (rateFilter === 'inactive') return item.stats.isInactive;
        if (rateFilter === 'regular') return !item.stats.isInactive && item.stats.attendancePct >= 75;
        if (rateFilter === 'low') return !item.stats.isInactive && item.stats.attendancePct >= 50 && item.stats.attendancePct < 75;
        if (rateFilter === 'critical') return !item.stats.isInactive && item.stats.attendancePct < 50;
        return true;
      });
    }

    // Keyword search filter
    if (query) {
      recordsData = recordsData.filter(item => {
        const s = item.student;
        const name = (s.name || '').toLowerCase();
        const roll = (s.rollNo || s.rollNumber || '').toLowerCase();
        const reg = (s.registrationNumber || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const parentPhone = (s.parentPhone || '').toLowerCase();
        
        return name.includes(query) || roll.includes(query) || reg.includes(query) || phone.includes(query) || email.includes(query) || parentPhone.includes(query) || s.id.toLowerCase().includes(query);
      });
    }

    if (recordsData.length === 0) {
      target.innerHTML = `
        <div class="text-center py-16 text-zinc-500 font-sans text-xs border border-dashed border-white/10 rounded-2xl bg-zinc-950/20">
          No student records matching filters found.
        </div>`;
      return;
    }

    if (listLayoutMode === 'grid') {
      // Responsive Card Grid layout
      target.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${recordsData.map(item => {
            const s = item.student;
            const stats = item.stats;
            const photo = s.photo || 'avatar_faculty1.png';
            const roll = s.rollNo || s.rollNumber || s.roll || 'N/A';
            const reg = s.registrationNumber || 'Pending Verification';
            const progressColor = stats.attendancePct >= 75 ? 'from-emerald-500 to-teal-500' : (stats.attendancePct >= 50 ? 'from-amber-500 to-yellow-500' : 'from-rose-500 to-red-500');

            return `
              <div class="glass-card p-5 rounded-2xl border border-white/10 hover:border-indigo-500/50 flex flex-col justify-between space-y-4 hover:shadow-lg transition-all duration-300 font-sans cursor-pointer" onclick="showStudentProfilePage('${s.id}')">
                <div class="flex items-start gap-3.5">
                  <img src="${photo}" class="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-md flex-shrink-0 bg-zinc-900" onclick="event.stopPropagation(); window.openFullImage('${photo}', '${s.name.replace(/'/g, "\\'")}')">
                  <div class="flex-grow min-w-0">
                    <div class="flex items-center gap-1.5">
                      <h4 class="font-extrabold text-white text-sm truncate leading-snug">${s.name || 'Student Name'}</h4>
                      ${s.isElitePlusUser ? '<span class="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 rounded font-black tracking-wider uppercase font-mono">Elite</span>' : ''}
                    </div>
                    <p class="text-[11px] text-zinc-400 font-semibold mt-0.5 truncate">${s.college} • ${s.semester}</p>
                    <p class="text-[10px] text-zinc-500 font-mono mt-1">Roll: ${roll}</p>
                    <p class="text-[10px] text-zinc-500 font-mono">Reg: ${reg}</p>
                  </div>
                </div>

                <div class="space-y-1.5 pt-2.5 border-t border-white/5">
                  <div class="flex justify-between text-[10px] font-bold">
                    <span class="text-zinc-500 uppercase tracking-wide">ERP Attendance</span>
                    <span class="text-indigo-400 font-mono">${stats.attendancePct}% (${stats.presentCount + stats.lateCount} / ${stats.totalSessions})</span>
                  </div>
                  <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div class="bg-gradient-to-r ${progressColor} h-full rounded-full transition-all duration-300" style="width: ${stats.attendancePct}%"></div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-white/5">
                  <span class="text-[10px] ${stats.statusClass} px-2.5 py-0.5 rounded-full font-extrabold uppercase font-sans">${stats.statusText}</span>
                  <button class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1">
                    Manage Profile <i class="fa-solid fa-arrow-right text-[8px]"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      // Compact Table View
      target.innerHTML = `
        <div class="overflow-x-auto border border-white/5 rounded-2xl bg-zinc-950/20">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="border-b border-white/5 text-zinc-500 font-bold uppercase">
                <th class="py-3 px-4">Student Details</th>
                <th class="py-3 px-4">Roll Number</th>
                <th class="py-3 px-4">Reg Number</th>
                <th class="py-3 px-4">College Semester</th>
                <th class="py-3 px-4">Attendance Rate</th>
                <th class="py-3 px-4">Status Indicator</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              ${recordsData.map(item => {
                const s = item.student;
                const stats = item.stats;
                const photo = s.photo || 'avatar_faculty1.png';
                const roll = s.rollNo || s.rollNumber || s.roll || 'N/A';
                const reg = s.registrationNumber || 'N/A';
                return `
                  <tr class="hover:bg-white/5 transition-colors cursor-pointer" onclick="showStudentProfilePage('${s.id}')">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <img src="${photo}" class="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0 bg-zinc-900">
                        <div>
                          <span class="text-white font-bold block">${s.name}</span>
                          <span class="text-[10px] text-zinc-500 font-mono">${s.id}</span>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4 font-mono text-zinc-300">${roll}</td>
                    <td class="py-3 px-4 font-mono text-zinc-300">${reg}</td>
                    <td class="py-3 px-4 font-medium text-zinc-400">${s.college} <span class="block text-[9px] text-zinc-500 font-normal">${s.semester}</span></td>
                    <td class="py-3 px-4 font-extrabold text-indigo-400 font-mono">${stats.attendancePct}% <span class="text-[9px] font-normal text-zinc-500 block">${stats.presentCount + stats.lateCount} / ${stats.totalSessions} Sessions</span></td>
                    <td class="py-3 px-4"><span class="text-[9px] ${stats.statusClass} px-2 py-0.5 rounded-full font-bold uppercase">${stats.statusText}</span></td>
                    <td class="py-3 px-4 text-right">
                      <button onclick="event.stopPropagation(); showStudentProfilePage('${s.id}')" class="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded font-bold text-[10px] transition-all">ERP View</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  };

  // Open Full-Screen ERP student profile page
  window.showStudentProfilePage = function(studentId) {
    window.selectedStudentId = studentId;
    
    const listContainer = document.getElementById('studentListContainer');
    const profilePageContainer = document.getElementById('studentProfilePageContainer');
    
    if (listContainer) listContainer.classList.add('hidden');
    if (profilePageContainer) profilePageContainer.classList.remove('hidden');

    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student) return;

    // Calculated fields
    const stats = calculateStudentStats(student);
    const photo = student.photo || 'avatar_faculty1.png';
    const roll = student.rollNo || student.rollNumber || student.roll || 'N/A';
    const reg = student.registrationNumber || 'Pending Verification';
    const course = student.course || 'BCA (Bachelor of Computer Applications)';
    const section = student.section || 'Section A';
    const batch = student.batch || '2024-2027';

    // Emergency Contact
    const parentPhone = student.parentPhone || 'Not Provided';
    const fatherName = student.fatherName || 'Not Provided';

    // Profile Completion Score computation
    const fieldsToCheck = ['photo', 'fatherName', 'motherName', 'gender', 'dob', 'bloodGroup', 'aadhaar', 'parentPhone', 'permAddress', 'currAddress'];
    let filledCount = 0;
    fieldsToCheck.forEach(f => {
      if (student[f] && student[f] !== 'Not Provided') filledCount++;
    });
    const completionPct = Math.round((filledCount / fieldsToCheck.length) * 100);

    // Classmate Rank computation (attendance based)
    const classmates = window.allStudentsList.filter(s => s.semester === student.semester);
    const classmateRates = classmates.map(c => {
      const cStats = calculateStudentStats(c);
      return { id: c.id, rate: cStats.attendancePct };
    });
    classmateRates.sort((a,b) => b.rate - a.rate);
    const rankIndex = classmateRates.findIndex(c => c.id === student.id);
    const rank = rankIndex !== -1 ? rankIndex + 1 : classmates.length;

    // Render Stage 2 Layout
    profilePageContainer.innerHTML = `
      <!-- Sticky Profile Header -->
      <div class="glass-card p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl">
        <div class="flex items-center gap-3">
          <button onclick="window.backToStudentDirectory()" class="px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2">
            <i class="fa-solid fa-arrow-left"></i> Directory
          </button>
          <div class="flex items-center gap-3 ml-2">
            <img src="${photo}" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 bg-zinc-900 cursor-zoom-in" onclick="window.openFullImage('${photo}', '${student.name.replace(/'/g, "\\'")}')">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-black text-white font-[Outfit] leading-none">${student.name}</h3>
                <span class="text-[9px] ${stats.statusClass} px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${stats.statusText}</span>
              </div>
              <p class="text-[11px] text-zinc-400 font-semibold mt-1 font-mono">${course} • ${student.semester} (${section})</p>
            </div>
          </div>
        </div>

        <!-- Sticky Quick actions -->
        <div class="flex items-center gap-2 flex-wrap self-end md:self-auto">
          <button onclick="window.promoteStudentSemester('${student.id}')" class="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl text-xs font-bold transition-all">Promote Term</button>
          <button onclick="window.sendStudentNotification('${student.id}')" class="px-2.5 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded-xl text-xs font-bold transition-all">Notify</button>
          <button onclick="window.archiveStudentProfile('${student.id}')" class="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold transition-all">Archive</button>
          <button onclick="window.deleteStudentProfile('${student.id}')" class="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>

      <!-- Navigation Tabs Grid (ERP style) -->
      <div class="flex border-b border-white/10 gap-1 overflow-x-auto scrollbar-hide py-1">
        <button onclick="window.switchProfileTab('overview')" id="profTabBtnOverview" class="py-2 px-4 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow whitespace-nowrap">📊 Overview</button>
        <button onclick="window.switchProfileTab('registration')" id="profTabBtnRegistration" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">📋 Registration</button>
        <button onclick="window.switchProfileTab('academics')" id="profTabBtnAcademics" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">🎓 Academic Details</button>
        <button onclick="window.switchProfileTab('attendance')" id="profTabBtnAttendance" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">📊 Attendance Analytics</button>
        <button onclick="window.switchProfileTab('documents')" id="profTabBtnDocuments" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">📁 Documents</button>
        <button onclick="window.switchProfileTab('activity')" id="profTabBtnActivity" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">🕒 Activity History</button>
        <button onclick="window.switchProfileTab('reports')" id="profTabBtnReports" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">📈 Reports</button>
        <button onclick="window.switchProfileTab('remarks')" id="profTabBtnRemarks" class="py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap">📝 Notes & Remarks</button>
      </div>

      <!-- Content Panels -->
      <div class="min-h-[400px]">
        <!-- OVERVIEW TAB -->
        <div id="profTabOverview" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 space-y-1">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Attendance Rate</span>
              <div class="text-3xl font-black text-indigo-400 font-[Outfit]">${stats.attendancePct}%</div>
              <span class="text-[10px] text-zinc-400 block">${stats.presentCount + stats.lateCount} / ${stats.totalSessions} Lectures</span>
            </div>
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 space-y-1">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Profile Completion</span>
              <div class="text-3xl font-black text-emerald-400 font-[Outfit]">${completionPct}%</div>
              <div class="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div class="bg-emerald-500 h-full rounded-full" style="width: ${completionPct}%"></div>
              </div>
            </div>
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 space-y-1">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Class Attendance Rank</span>
              <div class="text-3xl font-black text-amber-400 font-[Outfit]">#${rank} <span class="text-xs font-bold text-zinc-500">out of ${classmates.length}</span></div>
              <span class="text-[10px] text-zinc-400 block">In class ${student.semester}</span>
            </div>
            <div class="bg-zinc-950/40 p-3.5 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${student.id}&bgcolor=09090b&color=ffffff" class="w-16 h-16 rounded border border-white/10 p-1 bg-zinc-950 shadow-md">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mt-1">Student QR Pass</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Left column: Smart Insights & Emergency -->
            <div class="md:col-span-1 space-y-6">
              <!-- Insights -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Smart Insights</h4>
                <div class="space-y-2 text-xs leading-normal" id="insightsWidget">
                  <!-- Generated Insights -->
                </div>
              </div>

              <!-- Emergency Card -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Emergency Contact</h4>
                <div class="bg-zinc-950/40 p-4 rounded-xl border border-white/5 text-xs space-y-2">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Parent Name:</span>
                    <span class="text-zinc-200 font-bold">${fatherName}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Emergency Phone:</span>
                    <a href="tel:${parentPhone}" class="text-indigo-400 font-bold hover:underline">${parentPhone}</a>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500">Alt Phone:</span>
                    <span class="text-zinc-300">${student.altPhone || 'Not Provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right column: Recent Attendance Widget -->
            <div class="md:col-span-2 space-y-3">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Recent Attendance Widget (Last 10 Records)</h4>
              <div class="glass-card p-4 rounded-2xl border border-white/10 overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-white/5 text-zinc-500 font-bold uppercase">
                      <th class="py-2">Subject Class</th>
                      <th class="py-2">Session Date</th>
                      <th class="py-2">Status</th>
                      <th class="py-2 text-right">Method</th>
                    </tr>
                  </thead>
                  <tbody id="recentAttendanceWidgetBody">
                    <!-- Dynamic records -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- REGISTRATION DETAILS TAB -->
        <div id="profTabRegistration" class="hidden space-y-6">
          <form id="erpProfileEditForm" onsubmit="window.saveStudentProfileEdits(event, '${student.id}')" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- Personal info -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Personal Information</h4>
                <div class="space-y-3 text-xs">
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Full Name</label>
                    <input type="text" name="name" value="${student.name || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                  </div>
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Father's Name</label>
                    <input type="text" name="fatherName" value="${student.fatherName || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                  </div>
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Mother's Name</label>
                    <input type="text" name="motherName" value="${student.motherName || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Gender</label>
                      <select name="gender" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                        <option value="">Select</option>
                        <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${student.gender === 'Other' ? 'selected' : ''}>Other</option>
                      </select>
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Blood Group</label>
                      <input type="text" name="bloodGroup" value="${student.bloodGroup || ''}" placeholder="e.g. O+" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                  </div>
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Aadhaar Number (Optional)</label>
                    <input type="text" name="aadhaar" value="${student.aadhaar || ''}" placeholder="12 Digit Aadhaar" maxlength="12" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Category</label>
                      <input type="text" name="category" value="${student.category || 'General'}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Nationality</label>
                      <input type="text" name="nationality" value="${student.nationality || 'Indian'}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contact & Address info -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Contact & Address</h4>
                <div class="space-y-3 text-xs">
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Email Address</label>
                    <input type="email" name="email" value="${student.email || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Mobile No</label>
                      <input type="tel" name="phone" value="${student.phone || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Parent Phone</label>
                      <input type="tel" name="parentPhone" value="${student.parentPhone || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                  </div>
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Current Address</label>
                    <textarea name="currAddress" rows="2" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500 resize-none">${student.currAddress || ''}</textarea>
                  </div>
                  <div>
                    <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Permanent Address</label>
                    <textarea name="permAddress" rows="2" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500 resize-none">${student.permAddress || ''}</textarea>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2">
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">City/State</label>
                      <input type="text" name="city" placeholder="City" value="${student.city || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-1.5 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">PIN Code</label>
                      <input type="text" name="pin" placeholder="PIN" value="${student.pin || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-1.5 px-2 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Registration Metadata -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">System Registration Info</h4>
                  <div class="space-y-3 text-xs mt-4">
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Student Unique ID (Read-only)</label>
                      <input type="text" value="${student.id}" class="w-full bg-white/5 border border-white/5 rounded-xl py-2 px-3 text-zinc-400 text-xs outline-none cursor-not-allowed" readonly>
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Registration Number</label>
                      <input type="text" name="registrationNumber" value="${student.registrationNumber || ''}" placeholder="Pending Verification" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div>
                        <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">DOB Date</label>
                        <input type="text" name="dob" value="${student.dob || ''}" placeholder="YYYY-MM-DD" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                      </div>
                      <div>
                        <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Admission Year</label>
                        <input type="text" name="admissionYear" value="${student.admissionYear || ''}" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-2 text-white text-xs outline-none focus:border-indigo-500">
                      </div>
                    </div>
                    <div>
                      <label class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Admission Type</label>
                      <select name="admissionType" class="w-full bg-zinc-950/40 border border-white/5 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-indigo-500">
                        <option value="Regular" ${student.admissionType === 'Regular' ? 'selected' : ''}>Regular</option>
                        <option value="Lateral Entry" ${student.admissionType === 'Lateral Entry' ? 'selected' : ''}>Lateral Entry</option>
                        <option value="Transfer" ${student.admissionType === 'Transfer' ? 'selected' : ''}>Transfer</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <button type="submit" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md mt-4">
                  Save Registration Profile ⚡
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- ACADEMIC DETAILS TAB -->
        <div id="profTabAcademics" class="hidden space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Profile and Stats -->
            <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-5">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Academic Profile</h4>
              
              <div class="space-y-3 text-xs border-b border-white/5 pb-4">
                <div class="flex justify-between">
                  <span class="text-zinc-500">Affiliated Department:</span>
                  <span class="text-zinc-200 font-bold">Computer Applications (CS)</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Class Term:</span>
                  <span class="text-indigo-400 font-bold">${student.semester}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Section Assigned:</span>
                  <span class="text-zinc-200 font-bold">${section}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Roster Batch ID:</span>
                  <span class="text-zinc-200 font-bold">${batch}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">College:</span>
                  <span class="text-zinc-200 font-bold truncate max-w-[120px]">${student.college}</span>
                </div>
              </div>

              <h4 class="text-xs font-bold text-white uppercase tracking-wider block pt-2">Academic Ranks & Stats</h4>
              <div class="space-y-3 text-xs">
                <div class="flex justify-between">
                  <span class="text-zinc-500">Current Semester:</span>
                  <span class="text-zinc-200 font-bold">${student.semester}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Total Course Duration:</span>
                  <span class="text-zinc-200 font-bold">6 Semesters</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500">Academic Progress Rate:</span>
                  <span class="text-emerald-400 font-bold font-mono">${Math.round((parseInt(student.semester.replace(/\D/g, '')) / 6) * 100)}%</span>
                </div>
              </div>
              <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" style="width: ${Math.round((parseInt(student.semester.replace(/\D/g, '')) / 6) * 100)}%"></div>
              </div>
            </div>

            <!-- Subject Information -->
            <div class="glass-card p-5 rounded-2xl border border-white/10 md:col-span-2 space-y-4">
              <div class="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Enrolled Subjects (${student.semester})</h4>
                <span class="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Compulsory Curriculum</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="enrolledSubjectsContainer">
                <!-- Populated dynamically based on semester subjects -->
              </div>
            </div>
          </div>
        </div>

        <!-- ATTENDANCE ANALYTICS TAB -->
        <div id="profTabAttendance" class="hidden space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-center">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Attendance Rate</span>
              <div class="text-3xl font-black text-indigo-400 font-[Outfit] mt-1">${stats.attendancePct}%</div>
              <span class="text-[9px] text-zinc-500 block mt-1">${stats.attendancePct >= 75 ? '🟢 Excellent' : '🔴 Poor'} Range</span>
            </div>
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-center">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Present Lectures</span>
              <div class="text-3xl font-black text-emerald-400 font-[Outfit] mt-1">${stats.presentCount}</div>
              <span class="text-[9px] text-zinc-500 block mt-1">Check-ins Logged</span>
            </div>
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-center">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Late Entries</span>
              <div class="text-3xl font-black text-amber-500 font-[Outfit] mt-1">${stats.lateCount}</div>
              <span class="text-[9px] text-zinc-500 block mt-1">Beyond grace window</span>
            </div>
            <div class="bg-zinc-950/40 p-4 rounded-2xl border border-white/5 text-center">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Absent Marks</span>
              <div class="text-3xl font-black text-rose-500 font-[Outfit] mt-1">${stats.absentCount}</div>
              <span class="text-[9px] text-zinc-500 block mt-1">Missed Sessions</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Subject-wise bars -->
            <div class="glass-card p-5 rounded-2xl border border-white/10 lg:col-span-1 space-y-4">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Subject Wise Attendance Breakdown</h4>
              <div class="space-y-3" id="profSubjectAttendanceList">
                <!-- Dynamic subject bars -->
              </div>
            </div>

            <!-- Graph Trend (ChartJS) & Heatmap -->
            <div class="lg:col-span-2 space-y-6">
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Monthly Attendance Trend Chart</h4>
                <div class="h-44 relative">
                  <canvas id="profAttendanceTrendChart"></canvas>
                </div>
              </div>

              <!-- Heatmap Activity Grid -->
              <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">GitHub Style Check-In Heatmap (Last 6 Weeks)</h4>
                <div class="flex items-center gap-3 justify-center py-2 bg-zinc-950/20 border border-white/5 rounded-xl">
                  <div class="grid grid-rows-7 grid-flow-col gap-1.5" id="attendanceHeatmapGrid">
                    <!-- Dynamic heatmap cells -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DOCUMENTS TAB -->
        <div id="profTabDocuments" class="hidden space-y-6">
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Official Documents Cabinet</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="documentsCabinetGrid">
              <!-- Dynamically populated document uploaders and preview cards -->
            </div>
          </div>
        </div>

        <!-- ACTIVITY HISTORY TIMELINE TAB -->
        <div id="profTabActivity" class="hidden space-y-6">
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
            <div class="flex justify-between items-center pb-2 border-b border-white/5">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Client Activity Trail Logs</h4>
              <input type="text" id="profActivitySearch" oninput="window.filterProfileActivities()" placeholder="Filter logs..." class="bg-zinc-950/40 border border-white/10 rounded-lg py-1 px-3 text-white text-xs outline-none focus:border-indigo-500">
            </div>
            
            <div class="max-h-[350px] overflow-y-auto pr-1 timeline-scroll-area">
              <div class="reg-timeline relative" id="profTimelineTarget">
                <!-- Activity timeline cards -->
              </div>
            </div>
          </div>
        </div>

        <!-- REPORTS TAB -->
        <div id="profTabReports" class="hidden space-y-6">
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-5">
            <div>
              <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Instant ERP Report Generators</h4>
              <p class="text-xs text-zinc-400 mt-1">Compile comprehensive profiles, compliance audit metrics, and academic statistics sheets.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <h5 class="font-bold text-white uppercase text-[10px]">Academic & Attendance Report Card</h5>
                  <p class="text-zinc-500 mt-1 text-[11px] leading-relaxed">Generates a formal, printable PDF document complete with subject stats, registration details, and security signatures.</p>
                </div>
                <button onclick="window.generateErpPdfReport('${student.id}')" class="w-full py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5"><i class="fa-solid fa-file-pdf"></i> Export PDF Report Card</button>
              </div>

              <div class="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3 text-xs flex flex-col justify-between">
                <div>
                  <h5 class="font-bold text-white uppercase text-[10px]">Student Audit Sheets (Excel / CSV)</h5>
                  <p class="text-zinc-500 mt-1 text-[11px] leading-relaxed">Downloads a raw spreadsheet containing a comprehensive log of all attendance check-ins, geofence variables, and timeline footprints.</p>
                </div>
                <div class="flex gap-2">
                  <button onclick="window.generateErpExcelReport('${student.id}')" class="flex-1 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5"><i class="fa-solid fa-file-excel"></i> Excel Sheet</button>
                  <button onclick="window.generateErpCsvReport('${student.id}')" class="flex-1 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5">CSV File</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- NOTES & REMARKS TAB -->
        <div id="profTabRemarks" class="hidden space-y-6">
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">Faculty Audit Remarks & Notes</h4>
            
            <!-- Add remark form -->
            <div class="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3">
              <span class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Add Official Feedback Note</span>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input type="text" id="newRemarkText" placeholder="Write feedback note... (e.g. Needs academic coaching)" class="md:col-span-3 bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3.5 text-white text-xs outline-none focus:border-indigo-500">
                <select id="newRemarkCategory" class="bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none cursor-pointer">
                  <option value="Academic">Academic</option>
                  <option value="Attendance">Attendance</option>
                  <option value="Behavior">Behavior</option>
                  <option value="Excellence">Excellence</option>
                </select>
              </div>
              <button onclick="window.saveStudentRemark('${student.id}')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md">Add Note to Profile 📝</button>
            </div>

            <!-- List of remarks -->
            <div class="space-y-3" id="profileRemarksListContainer">
              <!-- Remarks items go here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Populate Overview Tab specific child elements
    populateSmartInsights(student, stats, completionPct);
    populateRecentAttendance(student);

    // Initial switch to first tab
    window.switchProfileTab('overview');
  };

  // Return back to directory list view
  window.backToStudentDirectory = function() {
    window.selectedStudentId = null;
    const listContainer = document.getElementById('studentListContainer');
    const profilePageContainer = document.getElementById('studentProfilePageContainer');
    
    if (listContainer) listContainer.classList.remove('hidden');
    if (profilePageContainer) profilePageContainer.classList.add('hidden');
  };

  // Tab switching inside ERP student profile page
  window.switchProfileTab = function(tab) {
    window.currentProfileTab = tab;
    const tabs = ['overview', 'registration', 'academics', 'attendance', 'documents', 'activity', 'reports', 'remarks'];
    
    tabs.forEach(t => {
      const pane = document.getElementById(`profTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
      const btn = document.getElementById(`profTabBtn${t.charAt(0).toUpperCase() + t.slice(1)}`);
      
      if (pane) {
        if (t === tab) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
      }
      
      if (btn) {
        if (t === tab) {
          btn.className = "py-2 px-4 rounded-lg text-xs font-bold transition-all bg-indigo-600 text-white shadow whitespace-nowrap";
        } else {
          btn.className = "py-2 px-4 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap";
        }
      }
    });

    const student = window.allStudentsList.find(s => s.id === window.selectedStudentId);
    if (!student) return;

    if (tab === 'academics') {
      populateAcademicsTab(student);
    } else if (tab === 'attendance') {
      populateAttendanceAnalytics(student);
    } else if (tab === 'documents') {
      populateDocumentsCabinet(student);
    } else if (tab === 'activity') {
      populateActivityTimeline(student);
    } else if (tab === 'remarks') {
      populateRemarksCabinet(student);
    }
  };

  // Smart student insights generator helper
  function populateSmartInsights(student, stats, completionPct) {
    const el = document.getElementById('insightsWidget');
    if (!el) return;

    const insights = [];

    if (stats.attendancePct < 75) {
      insights.push({
        text: 'Attendance below institutional threshold (75%). Warning active.',
        class: 'bg-rose-500/10 border-rose-500/20 text-rose-400'
      });
    } else if (stats.attendancePct >= 90) {
      insights.push({
        text: 'Excellent consistency. Strong candidate for semester honours.',
        class: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      });
    }

    if (completionPct < 90) {
      insights.push({
        text: `Profile information incomplete (${completionPct}%). Please complete registration fields.`,
        class: 'bg-amber-500/10 border-amber-500/15 text-amber-400'
      });
    } else {
      insights.push({
        text: 'Profile completion is optimal (100%). Identity verified.',
        class: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      });
    }

    // Check last active time for warnings
    const lastActiveDiffDays = student.lastActive ? (Date.now() - student.lastActive) / (1000 * 60 * 60 * 24) : 999;
    if (lastActiveDiffDays > 5) {
      insights.push({
        text: `Student has not opened the portal app in ${Math.round(lastActiveDiffDays)} days. Inactivity risk.`,
        class: 'bg-amber-500/10 border-amber-500/15 text-amber-400'
      });
    }

    // Check recent absences
    const studentRoll = student.rollNo || student.rollNumber || student.roll || 'N/A';
    const recentSessions = Object.keys(sessionsMap)
      .map(id => ({ id, ...sessionsMap[id] }))
      .filter(s => s.semester === student.semester)
      .sort((a,b) => b.startTime - a.startTime)
      .slice(0, 4);

    let consecutiveAbsents = 0;
    for (let s of recentSessions) {
      const records = recordsMap[s.id] || {};
      const hasRecord = !!records[studentRoll] || Object.values(records).some(r => r.studentId === student.id);
      if (!hasRecord) consecutiveAbsents++;
      else break;
    }

    if (consecutiveAbsents >= 3) {
      insights.push({
        text: `Absent for last ${consecutiveAbsents} chronological lecture sessions. Faculty check recommended.`,
        class: 'bg-rose-500/10 border-rose-500/20 text-rose-400 font-bold'
      });
    }

    if (insights.length === 0) {
      el.innerHTML = '<div class="text-center text-zinc-500 py-3">No active insights logged.</div>';
    } else {
      el.innerHTML = insights.map(ins => `
        <div class="p-2.5 rounded-xl border text-[11px] leading-snug flex items-start gap-2 ${ins.class}">
          <i class="fa-solid fa-circle-info mt-0.5 flex-shrink-0"></i>
          <p>${ins.text}</p>
        </div>
      `).join('');
    }
  }

  // Populate recent attendance widget helper
  function populateRecentAttendance(student) {
    const body = document.getElementById('recentAttendanceWidgetBody');
    if (!body) return;

    const studentRoll = student.rollNo || student.rollNumber || student.roll || 'N/A';
    const eligibleSessions = Object.keys(sessionsMap)
      .map(id => ({ id, ...sessionsMap[id] }))
      .filter(s => s.semester === student.semester)
      .sort((a,b) => b.startTime - a.startTime)
      .slice(0, 10);

    if (eligibleSessions.length === 0) {
      body.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-zinc-500 font-sans">No recent attendance records found.</td></tr>';
      return;
    }

    body.innerHTML = eligibleSessions.map(s => {
      const dateStr = new Date(s.startTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const records = recordsMap[s.id] || {};
      let rec = records[studentRoll];
      if (!rec) {
        rec = Object.values(records).find(r => r.studentId === student.id);
      }

      let badge = '<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">Absent</span>';
      let method = '—';
      if (rec) {
        method = rec.method || 'QR';
        if (rec.status === 'present') {
          badge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">Present</span>';
        } else {
          badge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold tracking-wider">Late</span>';
        }
      }

      return `
        <tr class="border-b border-white/5 font-sans hover:bg-white/5 transition-colors">
          <td class="py-2.5 font-bold text-white">${s.subject}<span class="block text-[9px] text-zinc-500 font-normal">By ${s.teacher}</span></td>
          <td class="py-2.5 text-zinc-400 font-mono">${dateStr}</td>
          <td class="py-2.5">${badge}</td>
          <td class="py-2.5 text-right text-zinc-500 font-semibold">${method}</td>
        </tr>
      `;
    }).join('');
  }

  // Populate Academics Details tab
  function populateAcademicsTab(student) {
    const el = document.getElementById('enrolledSubjectsContainer');
    if (!el) return;

    const semKey = student.semester.replace(/\s+/g, '');
    const subjects = SUBJECTS[semKey] || [];

    if (subjects.length === 0) {
      el.innerHTML = '<div class="col-span-full py-8 text-center text-zinc-500 font-sans text-xs">No core subjects registered for this semester term.</div>';
      return;
    }

    el.innerHTML = subjects.map(sub => `
      <div class="bg-zinc-950/40 p-3.5 rounded-xl border border-white/5 flex items-center justify-between text-xs leading-normal font-sans hover:border-white/10 transition-colors">
        <div class="flex items-center gap-3">
          <span class="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-base border border-indigo-500/25">${sub.icon}</span>
          <div>
            <span class="text-white font-bold block leading-snug">${sub.name}</span>
            <span class="text-[9px] text-zinc-500 font-mono font-bold">${sub.code}</span>
          </div>
        </div>
        <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black tracking-wider uppercase">Active</span>
      </div>
    `).join('');
  }

  // Populate Attendance Analytics Charts & Heatmap
  let profAttendanceChartInstance = null;

  function populateAttendanceAnalytics(student) {
    const subjectList = document.getElementById('profSubjectAttendanceList');
    const heatmapGrid = document.getElementById('attendanceHeatmapGrid');
    
    if (!subjectList || !heatmapGrid) return;

    const studentRoll = student.rollNo || student.rollNumber || student.roll || 'N/A';
    const semester = student.semester;

    // Scan eligible sessions
    const eligibleSessions = Object.keys(sessionsMap)
      .map(id => ({ id, ...sessionsMap[id] }))
      .filter(s => s.semester === semester);

    // Subject breakdown calculation
    const subjectStats = {};
    eligibleSessions.forEach(s => {
      if (!subjectStats[s.subject]) {
        subjectStats[s.subject] = { present: 0, total: 0 };
      }
      subjectStats[s.subject].total++;

      const records = recordsMap[s.id] || {};
      const hasRecord = !!records[studentRoll] || Object.values(records).some(r => r.studentId === student.id);
      if (hasRecord) {
        subjectStats[s.subject].present++;
      }
    });

    if (Object.keys(subjectStats).length === 0) {
      subjectList.innerHTML = '<div class="text-center py-6 text-zinc-500 font-sans text-xs">No lectures logs compiled yet.</div>';
    } else {
      subjectList.innerHTML = Object.keys(subjectStats).map(sub => {
        const item = subjectStats[sub];
        const pct = Math.round((item.present / item.total) * 100);
        const barColor = pct >= 75 ? 'bg-indigo-500' : (pct >= 50 ? 'bg-amber-500' : 'bg-rose-500');
        return `
          <div class="space-y-1 text-xs font-sans">
            <div class="flex justify-between font-bold">
              <span class="text-zinc-300 truncate max-w-[150px]" title="${sub}">${sub}</span>
              <span class="text-indigo-400 font-mono">${item.present} / ${item.total} (${pct}%)</span>
            </div>
            <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div class="${barColor} h-full rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Chart.js monthly trend
    const ctx = document.getElementById('profAttendanceTrendChart');
    if (ctx) {
      // Group sessions by month (last 4 months)
      const monthlyData = {};
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Seed last 4 months
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const name = monthNames[d.getMonth()];
        monthlyData[name] = { present: 0, total: 0 };
      }

      eligibleSessions.forEach(s => {
        const date = new Date(s.startTime);
        const name = monthNames[date.getMonth()];
        if (monthlyData[name]) {
          monthlyData[name].total++;
          const records = recordsMap[s.id] || {};
          const hasRecord = !!records[studentRoll] || Object.values(records).some(r => r.studentId === student.id);
          if (hasRecord) {
            monthlyData[name].present++;
          }
        }
      });

      const labels = Object.keys(monthlyData);
      const rates = labels.map(lbl => {
        const m = monthlyData[lbl];
        return m.total > 0 ? Math.round((m.present / m.total) * 100) : 0;
      });

      if (profAttendanceChartInstance) profAttendanceChartInstance.destroy();
      profAttendanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Attendance %',
            data: rates,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            borderWidth: 2,
            tension: 0.35,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { min: 0, max: 100, ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.03)' } },
            x: { ticks: { color: '#71717a' }, grid: { display: false } }
          }
        }
      });
    }

    // Heatmap calendar grid (last 6 weeks, 42 blocks)
    heatmapGrid.innerHTML = '';
    const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const heatmapData = [];

    // Get 42 days offset starting Sunday 6 weeks ago
    const startOfCurrentWeek = new Date();
    startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay()); // Sunday of this week
    const startDate = new Date(startOfCurrentWeek.getTime() - (5 * 7 * 24 * 60 * 60 * 1000)); // 5 weeks ago Sunday

    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const cellDateString = cellDate.toDateString();

      // Check if student attended any session on this date
      let attendedOnDate = false;
      let hasClassOnDate = false;

      eligibleSessions.forEach(s => {
        const sessDate = new Date(s.startTime).toDateString();
        if (sessDate === cellDateString) {
          hasClassOnDate = true;
          const records = recordsMap[s.id] || {};
          const hasRecord = !!records[studentRoll] || Object.values(records).some(r => r.studentId === student.id);
          if (hasRecord) attendedOnDate = true;
        }
      });

      heatmapData.push({
        dateStr: cellDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        attended: attendedOnDate,
        hasClass: hasClassOnDate
      });
    }

    heatmapGrid.innerHTML = heatmapData.map(cell => {
      let bg = 'bg-zinc-900 border border-white/5';
      if (cell.hasClass) {
        bg = cell.attended ? 'bg-emerald-500 shadow shadow-emerald-500/25 border border-emerald-600' : 'bg-rose-500/30 border border-rose-500/40';
      }
      return `
        <div class="w-3.5 h-3.5 rounded-sm ${bg} transition-all duration-300 hover:scale-110" title="${cell.dateStr}: ${cell.hasClass ? (cell.attended ? 'Attended' : 'Absent') : 'No Lecture'}"></div>
      `;
    }).join('');
  }

  // Populate Documents Cabinet tab
  function populateDocumentsCabinet(student) {
    const grid = document.getElementById('documentsCabinetGrid');
    if (!grid) return;

    const docTypes = [
      { key: 'photo', name: 'Profile Photo' },
      { key: 'aadhaarCard', name: 'Aadhaar Card' },
      { key: 'admissionForm', name: 'Admission Form' },
      { key: 'marksheet', name: 'Marksheet' },
      { key: 'transferCert', name: 'Transfer Certificate' },
      { key: 'migrationCert', name: 'Migration Certificate' },
      { key: 'feeReceipt', name: 'Fee Receipt' },
      { key: 'otherDoc', name: 'Other Document' }
    ];

    const docs = student.documents || {};

    grid.innerHTML = docTypes.map(doc => {
      const docUrl = docs[doc.key] || (doc.key === 'photo' ? student.photo : null);
      
      if (docUrl) {
        return `
          <div class="bg-zinc-950/40 p-3.5 border border-white/5 rounded-2xl flex flex-col justify-between items-center text-center space-y-3 relative group">
            <span class="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-sans">${doc.name}</span>
            <img src="${docUrl}" class="w-full h-24 object-cover rounded-xl border border-white/10 shadow bg-zinc-900">
            <div class="flex gap-2 w-full pt-1.5 border-t border-white/5">
              <button onclick="window.openFullImage('${docUrl}', '${doc.name}')" class="flex-1 py-1 bg-white/5 hover:bg-indigo-600 text-zinc-300 hover:text-white rounded border border-white/10 text-[10px] font-bold transition-all"><i class="fa-solid fa-expand"></i> Preview</button>
              <a href="${docUrl}" download="${doc.key}_${student.id}.png" class="p-1 px-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded text-[10px] font-bold transition-all flex items-center justify-center" title="Download"><i class="fa-solid fa-download"></i></a>
              <button onclick="window.deleteStudentDoc('${student.id}', '${doc.key}')" class="p-1 px-2 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 rounded text-[10px] font-bold transition-all flex items-center justify-center" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="bg-zinc-950/40 p-4 border border-dashed border-white/10 rounded-2xl flex flex-col justify-between items-center text-center min-h-[170px] space-y-4">
            <div class="space-y-1">
              <span class="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">${doc.name}</span>
              <span class="text-[10px] text-zinc-600 italic block">Not Uploaded</span>
            </div>
            <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 text-xs border border-white/5"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            
            <div class="w-full relative">
              <input type="file" id="upload_input_${doc.key}" accept="image/png, image/jpeg, image/jpg" class="hidden" onchange="window.handleStudentDocUpload(event, '${student.id}', '${doc.key}')">
              <button onclick="document.getElementById('upload_input_${doc.key}').click()" class="w-full py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl font-bold transition-all text-[10px]">Upload Document</button>
            </div>
          </div>
        `;
      }
    }).join('');
  }

  // Handle Base64 file upload helper
  window.handleStudentDocUpload = function(event, studentId, docKey) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Error: File size exceeds the maximum upload threshold of 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Data = e.target.result;
      
      if (typeof firebase === 'undefined' || !firebase.database) return;
      
      const updates = {};
      if (docKey === 'photo') {
        updates[`students/${studentId}/photo`] = base64Data;
      } else {
        updates[`students/${studentId}/documents/${docKey}`] = base64Data;
      }

      firebase.database().ref().update(updates)
        .then(() => {
          alert("Document uploaded and verified successfully.");
          
          // Log activity
          logStudentActivity(studentId, 'Uploaded Document', {
            title: `Uploaded document signature: ${docKey}`,
            timestamp: Date.now()
          });

          showStudentProfilePage(studentId);
        })
        .catch(err => {
          alert("Upload failed: " + err.message);
        });
    };
    reader.readAsDataURL(file);
  };

  // Delete student document signature
  window.deleteStudentDoc = function(studentId, docKey) {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    if (confirm("Are you sure you want to remove this document permanently from student records?")) {
      const refPath = docKey === 'photo' ? `students/${studentId}/photo` : `students/${studentId}/documents/${docKey}`;
      
      firebase.database().ref(refPath).remove()
        .then(() => {
          alert("Document deleted successfully.");
          
          logStudentActivity(studentId, 'Removed Document', {
            title: `Deleted document signature: ${docKey}`,
            timestamp: Date.now()
          });

          showStudentProfilePage(studentId);
        })
        .catch(err => {
          alert("Failed to delete document: " + err.message);
        });
    }
  };

  // Populate Activity history timeline
  window.populateActivityTimeline = function(student) {
    const target = document.getElementById('profTimelineTarget');
    if (!target) return;

    const searchVal = document.getElementById('profActivitySearch').value.toLowerCase().trim();

    const logs = [];
    if (student.activityLogs) {
      Object.keys(student.activityLogs).forEach(id => {
        logs.push({ id, ...student.activityLogs[id] });
      });
    }

    logs.sort((a,b) => b.timestamp - a.timestamp);

    let filteredLogs = logs;
    if (searchVal) {
      filteredLogs = logs.filter(l => l.event.toLowerCase().includes(searchVal) || (l.title || '').toLowerCase().includes(searchVal));
    }

    if (filteredLogs.length === 0) {
      target.innerHTML = '<div class="text-center py-8 text-zinc-500 font-sans text-xs">No activity timeline events found.</div>';
      return;
    }

    target.innerHTML = filteredLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const date = new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      
      let badgeIcon = '📝';
      let badgeColor = '#cbd5e1';
      if (log.event === 'App Opened') { badgeIcon = '📱'; badgeColor = '#3b82f6'; }
      else if (log.event === 'Batch Opened') { badgeIcon = '🎓'; badgeColor = '#8b5cf6'; }
      else if (log.event === 'Video Watched') { badgeIcon = '🎥'; badgeColor = '#10b981'; }
      else if (log.event === 'Notes Downloaded') { badgeIcon = '📥'; badgeColor = '#ec4899'; }
      else if (log.event === 'PDF Opened') { badgeIcon = '📄'; badgeColor = '#f59e0b'; }
      else if (log.event === 'Uploaded Document') { badgeIcon = '📁'; badgeColor = '#10b981'; }

      return `
        <div class="timeline-item mt-2 font-sans">
          <div class="timeline-badge w-6 h-6 flex items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-[10px] absolute -left-3" style="color: ${badgeColor}">${badgeIcon}</div>
          <div class="timeline-content pl-6">
            <span class="text-white font-bold block leading-snug">${log.event}</span>
            <span class="text-[11px] text-zinc-400 block">${log.title || log.url || 'Logged Event'}</span>
            <span class="text-[9px] text-zinc-500 font-mono mt-1 block">${date} at ${time} • Performed By Student</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.filterProfileActivities = function() {
    const student = window.allStudentsList.find(s => s.id === window.selectedStudentId);
    if (student) populateActivityTimeline(student);
  };

  // Populate Notes & Remarks tab
  function populateRemarksCabinet(student) {
    const container = document.getElementById('profileRemarksListContainer');
    if (!container) return;

    const remarks = [];
    if (student.remarks) {
      Object.keys(student.remarks).forEach(id => {
        remarks.push({ id, ...student.remarks[id] });
      });
    }

    remarks.sort((a,b) => b.timestamp - a.timestamp);

    if (remarks.length === 0) {
      container.innerHTML = '<div class="text-center py-6 text-zinc-500 font-sans text-xs">No faculty feedback notes left for this student.</div>';
      return;
    }

    container.innerHTML = remarks.map(rem => {
      const dateStr = new Date(rem.timestamp).toLocaleString('en-IN');
      const pillColors = {
        Academic: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        Attendance: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        Behavior: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        Excellence: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
      const pill = pillColors[rem.category] || pillColors.Academic;

      return `
        <div class="bg-zinc-950/40 p-3.5 border border-white/5 rounded-2xl flex flex-col justify-between space-y-3 font-sans">
          <div class="flex justify-between items-start">
            <span class="text-[9px] ${pill} border px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">${rem.category}</span>
            <button onclick="window.deleteStudentRemark('${student.id}', '${rem.id}')" class="text-zinc-500 hover:text-rose-400 text-xs transition-colors"><i class="fa-solid fa-trash-can"></i></button>
          </div>
          <p class="text-xs text-zinc-200 leading-snug">${rem.text}</p>
          <div class="text-[9px] text-zinc-500 flex justify-between pt-1.5 border-t border-white/5">
            <span>By: Faculty Administrator</span>
            <span class="font-mono">${dateStr}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Save new remark notes
  window.saveStudentRemark = function(studentId) {
    const textEl = document.getElementById('newRemarkText');
    const catEl = document.getElementById('newRemarkCategory');
    if (!textEl || !catEl) return;

    const text = textEl.value.trim();
    const cat = catEl.value;

    if (!text) {
      alert("Please enter a feedback note.");
      return;
    }

    if (typeof firebase === 'undefined' || !firebase.database) return;

    const ref = firebase.database().ref(`students/${studentId}/remarks`).push();
    ref.set({
      text: text,
      category: cat,
      timestamp: Date.now()
    }).then(() => {
      textEl.value = '';
      
      logStudentActivity(studentId, 'Added Remark', {
        title: `Left ${cat} feedback note: "${text}"`,
        timestamp: Date.now()
      });

      showStudentProfilePage(studentId);
    }).catch(err => {
      alert("Failed to write remark: " + err.message);
    });
  };

  // Delete feedback remark
  window.deleteStudentRemark = function(studentId, remarkId) {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    if (confirm("Are you sure you want to remove this feedback note permanently?")) {
      firebase.database().ref(`students/${studentId}/remarks/${remarkId}`).remove()
        .then(() => {
          showStudentProfilePage(studentId);
        })
        .catch(err => {
          alert("Failed to delete note: " + err.message);
        });
    }
  };

  // Save Registration details edits
  window.saveStudentProfileEdits = function(event, studentId) {
    event.preventDefault();
    const form = document.getElementById('erpProfileEditForm');
    if (!form || typeof firebase === 'undefined' || !firebase.database) return;

    const formData = new FormData(form);
    const updates = {};

    formData.forEach((value, key) => {
      updates[key] = value.trim() || 'Not Provided';
    });

    firebase.database().ref(`students/${studentId}`).update(updates)
      .then(() => {
        alert("Registration profile updated successfully!");
        
        logStudentActivity(studentId, 'Updated Profile', {
          title: `Updated registration fields: ${Object.keys(updates).join(', ')}`,
          timestamp: Date.now()
        });

        showStudentProfilePage(studentId);
      })
      .catch(err => {
        alert("Failed to update profile: " + err.message);
      });
  };

  // Quick actions: Promote Student Semester
  window.promoteStudentSemester = function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student || typeof firebase === 'undefined' || !firebase.database) return;

    const currentSem = student.semester;
    const match = currentSem.match(/\d+/);
    const semNum = match ? parseInt(match[0]) : 1;
    const nextSemNum = Math.min(6, semNum + 1);
    const nextSem = `Semester ${nextSemNum}`;

    if (semNum === 6) {
      alert("Student has already reached the final term (Semester 6).");
      return;
    }

    if (confirm(`Promote student ${student.name} from ${currentSem} to ${nextSem} term?`)) {
      firebase.database().ref(`students/${studentId}`).update({
        semester: nextSem
      }).then(() => {
        alert(`Student promoted successfully to ${nextSem}!`);
        
        logStudentActivity(studentId, 'Changed Semester', {
          title: `Promoted academic term from ${currentSem} to ${nextSem}`,
          timestamp: Date.now()
        });

        showStudentProfilePage(studentId);
      }).catch(err => {
        alert("Promotion failed: " + err.message);
      });
    }
  };

  // Quick actions: Send Notification
  window.sendStudentNotification = function(studentId) {
    const msg = prompt("Enter the notification message to broadcast to this student's mobile dashboard:");
    if (!msg || !msg.trim()) return;

    if (typeof firebase === 'undefined' || !firebase.database) return;

    const ref = firebase.database().ref(`students/${studentId}/notifications`).push();
    ref.set({
      message: msg.trim(),
      timestamp: Date.now(),
      unread: true
    }).then(() => {
      alert("Notification sent successfully.");
      
      logStudentActivity(studentId, 'Sent Notification', {
        title: `Broadcasted alert: "${msg.trim()}"`,
        timestamp: Date.now()
      });
    }).catch(err => {
      alert("Failed to broadcast alert: " + err.message);
    });
  };

  // Quick actions: Archive Profile
  window.archiveStudentProfile = function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student || typeof firebase === 'undefined' || !firebase.database) return;

    const currentStatus = student.archived === true ? 'archived' : 'active';
    const nextStatus = student.archived === true ? false : true;

    if (confirm(`Are you sure you want to ${nextStatus ? 'ARCHIVE' : 'RESTORE'} student ${student.name}? ${nextStatus ? 'Archived students will be hidden from daily rosters.' : ''}`)) {
      firebase.database().ref(`students/${studentId}`).update({
        archived: nextStatus
      }).then(() => {
        alert(`Student profile ${nextStatus ? 'archived' : 'restored'} successfully.`);
        window.backToStudentDirectory();
      }).catch(err => {
        alert("Failed to change archive state: " + err.message);
      });
    }
  };

  // Quick actions: Delete student profile
  window.deleteStudentProfile = function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student || typeof firebase === 'undefined' || !firebase.database) return;

    if (confirm(`💣 CRITICAL ACTION 💣\nDelete student profile ${student.name} (ID: ${studentId}) and all their logs permanently? This cannot be undone.`)) {
      firebase.database().ref(`students/${studentId}`).remove()
        .then(() => {
          alert("Student record removed successfully.");
          window.backToStudentDirectory();
        })
        .catch(err => {
          alert("Failed to delete student: " + err.message);
        });
    }
  };

  // Report Exporters inside Student Profile
  window.generateErpPdfReport = function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student) return;

    if (typeof window.jspdf === 'undefined') {
      alert("PDF library loading. Please try again in a few seconds.");
      return;
    }

    const stats = calculateStudentStats(student);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Custom ERP Header
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, 210, 36, 'F');

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("UNIVERSITY STUDENT REPORT CARD", 14, 22);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 255);
    doc.text(`Official ERP Archive • Generated on ${new Date().toLocaleString('en-IN')}`, 14, 30);

    // Profile Box Details
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Student Name: ${student.name}`, 14, 48);
    doc.text(`Student ID: ${student.id}`, 14, 54);
    doc.text(`Roll Number: ${student.rollNo || student.rollNumber || 'N/A'}`, 14, 60);
    doc.text(`Reg Number: ${student.registrationNumber || 'N/A'}`, 14, 66);
    
    doc.text(`Course: ${student.course || 'BCA'}`, 115, 48);
    doc.text(`Academic Term: ${student.semester}`, 115, 54);
    doc.text(`Affiliation: ${student.college}`, 115, 60);
    doc.text(`ERP Status: ${stats.statusText}`, 115, 66);

    doc.line(14, 72, 196, 72);

    // Attendance stats
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("ATTENDANCE COMPLIANCE SUMMARY", 14, 82);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Present Sessions: ${stats.presentCount}`, 14, 92);
    doc.text(`Late Sessions: ${stats.lateCount}`, 14, 98);
    doc.text(`Absent Sessions: ${stats.absentCount}`, 14, 104);
    doc.text(`Attendance Compliance Rate: ${stats.attendancePct}%`, 14, 110);

    // Remarks and Notes list
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("FACULTY ASSESSMENT REMARKS", 14, 122);

    const remarks = [];
    if (student.remarks) {
      Object.values(student.remarks).forEach(r => remarks.push(r));
    }
    remarks.sort((a,b) => b.timestamp - a.timestamp);

    let currY = 132;
    if (remarks.length === 0) {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text("No official remarks left on the student profile.", 14, currY);
    } else {
      remarks.slice(0, 5).forEach(rem => {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        const date = new Date(rem.timestamp).toLocaleDateString('en-IN');
        doc.text(`[${rem.category}] - ${date}`, 14, currY);
        doc.setFont("Helvetica", "normal");
        doc.text(`- ${rem.text}`, 14, currY + 5);
        currY += 14;
      });
    }

    doc.save(`Student_Report_${student.name.replace(/\s+/g, '_')}.pdf`);
  };

  window.generateErpExcelReport = async function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student) return;

    if (typeof XLSX === 'undefined') {
      alert("Excel library loading. Please try again in a few seconds.");
      return;
    }

    const stats = calculateStudentStats(student);
    const wb = XLSX.utils.book_new();

    const header = [
      ["BCA STORE ERP - STUDENT DETAILS SUMMARY"],
      ["Generated Time:", new Date().toLocaleString()],
      [],
      ["STUDENT METADATA"],
      ["Student ID:", student.id],
      ["Full Name:", student.name],
      ["Roll Number:", student.rollNo || student.rollNumber || 'N/A'],
      ["Reg Number:", student.registrationNumber || 'N/A'],
      ["College:", student.college],
      ["Semester:", student.semester],
      ["Course:", student.course || 'BCA'],
      ["Section:", student.section || 'A'],
      [],
      ["ATTENDANCE SUMMARY STATS"],
      ["Total Tracked Classes:", stats.totalSessions],
      ["Present Logged:", stats.presentCount],
      ["Late Logged:", stats.lateCount],
      ["Absent Logged:", stats.absentCount],
      ["Percentage Rate:", `${stats.attendancePct}%`],
      ["Status Tag:", stats.statusText]
    ];

    const ws = XLSX.utils.aoa_to_sheet(header);
    ws['!cols'] = [{ wch: 22 }, { wch: 35 }];

    XLSX.utils.book_append_sheet(wb, ws, "Profile Data");
    XLSX.writeFile(wb, `Student_Profile_${student.name.replace(/\s+/g, '_')}.xlsx`);
  };

  window.generateErpCsvReport = function(studentId) {
    const student = window.allStudentsList.find(s => s.id === studentId);
    if (!student) return;

    const stats = calculateStudentStats(student);
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Attribute,Value\n";
    csv += `Student ID,${student.id}\n`;
    csv += `Full Name,${student.name}\n`;
    csv += `Roll Number,${student.rollNo || student.rollNumber || 'N'}\n`;
    csv += `College,${student.college}\n`;
    csv += `Semester,${student.semester}\n`;
    csv += `Attendance Rate,${stats.attendancePct}%\n`;
    csv += `Status Tag,${stats.statusText}\n`;

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `Student_Profile_${student.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Activity logger helper
  function logStudentActivity(studentId, eventType, eventData = {}) {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    
    const activityRef = firebase.database().ref(`students/${studentId}/activityLogs`).push();
    activityRef.set({
      event: eventType,
      timestamp: Date.now(),
      performedBy: 'Admin',
      ...eventData
    });
  }

  // Inject Registration Admin CSS styles
  function injectAdminRegStyles() {
    if (document.getElementById('adminRegStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminRegStyles';
    style.textContent = `
      .reg-admin-wrapper {
        animation: regFadeIn 0.35s ease;
      }
      .chart-pulse-dot {
        transition: r 0.2s;
        cursor: pointer;
      }
      .chart-pulse-dot:hover {
        r: 5px;
      }
      .student-row.active-row {
        background: rgba(99, 102, 241, 0.08);
        box-shadow: inset 3px 0 0 #6366f1;
      }
      .zoomable-avatar {
        transition: transform 0.25s ease, border-color 0.25s ease;
      }
      .zoomable-avatar:hover {
        transform: scale(1.08);
        border-color: #a78bfa !important;
      }
      @keyframes regFadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .timeline-badge {
        z-index: 2;
      }
      .timeline-scroll-area::-webkit-scrollbar {
        width: 4px;
      }
      .timeline-scroll-area::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.1);
        border-radius: 99px;
      }
    `;
    document.head.appendChild(style);
  }
})();
