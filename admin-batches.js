// ==========================================================================
// BCA STORE - BATCHES MANAGEMENT ENGINE (ADMIN INTERFACE)
// Handles complete CRUD, Seeding, Ordering, Image validations (<= 1MB)
// ==========================================================================

let batchesList = []; // Real-time synced batches list
let currentFilter = 'all';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  // Wait for global Firebase 'db' instance to be ready
  const dbCheck = setInterval(() => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(dbCheck);
      initBatchesSystem();
    }
  }, 500);
});

let batchStudentCounts = {};
let batchSessionCounts = {};

// Parse price helper
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const clean = priceStr.replace(/[^0-9]/g, '');
  return parseInt(clean) || 0;
}

// UPDATE BATCHES HUD METRICS
function updateBatchesHUD() {
  const totalEl = document.getElementById('batchesKPI_total');
  const publishedEl = document.getElementById('batchesKPI_published');
  const draftEl = document.getElementById('batchesKPI_draft');
  const studentsEl = document.getElementById('batchesKPI_students');
  const revenueEl = document.getElementById('batchesKPI_revenue');
  const popNewestEl = document.getElementById('batchesKPI_popular_newest');

  if (!totalEl) return;

  const total = batchesList.length;
  const published = batchesList.filter(b => b.status === 'Published' || b.status === 'Active').length;
  const draft = batchesList.filter(b => b.status === 'Draft').length;
  
  let totalStudents = 0;
  let estimatedRevenue = 0;
  let popularBatchName = 'None';
  let maxStudents = -1;
  let newestBatchName = 'None';
  let newestTime = -1;

  batchesList.forEach(b => {
    const students = batchStudentCounts[b.id] || 0;
    totalStudents += students;
    
    const priceVal = parsePrice(b.price);
    estimatedRevenue += priceVal * students;

    if (students > maxStudents && students > 0) {
      maxStudents = students;
      popularBatchName = b.name;
    }

    const created = b.createdAt || 0;
    if (created > newestTime) {
      newestTime = created;
      newestBatchName = b.name;
    }
  });

  totalEl.textContent = total;
  publishedEl.textContent = published;
  draftEl.textContent = draft;
  studentsEl.textContent = totalStudents;
  revenueEl.textContent = '₹' + estimatedRevenue.toLocaleString('en-IN');
  
  if (popNewestEl) {
    popNewestEl.innerHTML = `Popular: <span style="color:#a78bfa;">${popularBatchName}</span> ${maxStudents > 0 ? `(${maxStudents} studs)` : ''}<br>Newest: <span style="color:#06b6d4;">${newestBatchName}</span>`;
  }
}

// INITIALIZE BATCHES NODE & REAL-TIME SYNC
function initBatchesSystem() {
  console.log("📚 Initializing Batches Management System...");
  
  // 1. Listen to student enrollments
  db.ref('students').on('value', (snapshot) => {
    batchStudentCounts = {};
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(studentId => {
        const student = data[studentId];
        const enrolled = [];
        if (student.batchesEliteEnrolled && Array.isArray(student.batchesEliteEnrolled)) {
          student.batchesEliteEnrolled.forEach(b => { if (!enrolled.includes(b)) enrolled.push(b); });
        }
        if (student.batchesEnrolled && Array.isArray(student.batchesEnrolled)) {
          student.batchesEnrolled.forEach(b => { if (!enrolled.includes(b)) enrolled.push(b); });
        }
        if (student.enrolled && Array.isArray(student.enrolled)) {
          student.enrolled.forEach(b => { if (!enrolled.includes(b)) enrolled.push(b); });
        }
        enrolled.forEach(batchId => {
          batchStudentCounts[batchId] = (batchStudentCounts[batchId] || 0) + 1;
        });
      });
    }
    updateBatchesHUD();
    renderBatchesGrid();
  });

  // 2. Listen to attendance sessions
  db.ref('attendance-v2/sessions').on('value', (snapshot) => {
    batchSessionCounts = {};
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(sessionId => {
        const session = data[sessionId];
        if (session && session.batch) {
          batchSessionCounts[session.batch] = (batchSessionCounts[session.batch] || 0) + 1;
        }
      });
    }
    updateBatchesHUD();
    renderBatchesGrid();
  });

  // 3. Listen to batches config
  db.ref('batches').on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      console.log("No batches configuration found, seeding defaults...");
      seedDefaultBatches();
    } else {
      batchesList = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      // Sort batches by orderIndex
      batchesList.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      
      // Update HUD and re-render batches list if we are currently looking at it
      updateBatchesHUD();
      renderBatchesGrid();
    }
  });
}

// SEED INITIAL BATCH DATA COMBINING STATIC PRESETS
function seedDefaultBatches() {
  const defaults = {
    'c-programming': {
      name: 'C Programming',
      icon: '⌨️',
      subtitle: 'Master core memory management, pointers, and foundational structures.',
      description: 'Master the fundamentals of C programming language, memory layouts, allocations, and standard structures.',
      color: '#3b82f6',
      level: 'Beginner to Intermediate',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '⌨️ Complete C Syntax & Logic Building'
      ],
      orderIndex: 0
    },
    'cpp': {
      name: 'C++',
      icon: '🚀',
      subtitle: 'Implement advanced Object-Oriented patterns, templates, and optimized algorithms.',
      description: 'Advanced object-oriented programming with C++, custom templates, memory mapping, and STL optimization.',
      color: '#06b6d4',
      level: 'Beginner to Advanced',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🚀 Core OOPs, Templates & STL Mastery'
      ],
      orderIndex: 1
    },
    'dsa': {
      name: 'Data Structures & Algorithms',
      icon: '🌳',
      subtitle: 'Build robust problem-solving skills with standard patterns and data structures.',
      description: 'Master DSA for interview preparation and competitive programming, trees, graphs, dynamic programming.',
      color: '#8b5cf6',
      level: 'Intermediate to Advanced',
      category: 'programming',
      badge: 'Elite+',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: true,
      lockContent: true,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🌳 Trees, Graphs & Dynamic Programming'
      ],
      orderIndex: 2
    },
    'java': {
      name: 'Java',
      icon: '☕',
      subtitle: 'Develop scalable enterprise-grade applications with multithreading and MVC.',
      description: 'Complete Java programming from basics to advanced, covering multi-threading, databases, collections, and JDBC.',
      color: '#f59e0b',
      level: 'Beginner to Advanced',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '☕ Core Java, Multithreading & JDBC'
      ],
      orderIndex: 3
    },
    'javascript': {
      name: 'JavaScript',
      icon: '✨',
      subtitle: 'Modern JavaScript for web development and responsive client interfaces.',
      description: 'Modern JavaScript from variables and DOM to async-await, APIs, ES6 modules, and functional programming.',
      color: '#fbbf24',
      level: 'Beginner to Intermediate',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '✨ ES6+ Modern JavaScript Concepts'
      ],
      orderIndex: 4
    },
    'node-js': {
      name: 'Node.js',
      icon: '🔧',
      subtitle: 'Backend development with Node.js, Express, databases, and microservices.',
      description: 'Architect scalable server-side systems, REST APIs, asynchronous request pipelines, and database integrations.',
      color: '#10b981',
      level: 'Intermediate to Advanced',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🔧 Express REST APIs & MongoDB Backend'
      ],
      orderIndex: 5
    },
    'python': {
      name: 'Python',
      icon: '🐍',
      subtitle: 'Python programming for scripting, automation, web backends, and data analysis.',
      description: 'Dive into python variables, conditions, oops, automated scraping, data parsing, and analytics libraries.',
      color: '#3b82f6',
      level: 'Beginner to Intermediate',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🐍 Python Syntax, Automation & ML'
      ],
      orderIndex: 6
    },
    'react-js': {
      name: 'React.js',
      icon: '⚛️',
      subtitle: 'Frontend development with React.js components, hooks, and global state management.',
      description: 'Learn modern React hooks, state lifting, custom routing, API bindings, and components layout.',
      color: '#06b6d4',
      level: 'Intermediate to Advanced',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '⚛️ Components, Hooks & Redux Toolkit'
      ],
      orderIndex: 7
    },
    'sql-database': {
      name: 'SQL & Database',
      icon: '🗄️',
      subtitle: 'SQL, database design, optimization, and performant data storage models.',
      description: 'Model optimized relational databases, complex joins, indexes, foreign relationships, and nested queries.',
      color: '#ec4899',
      level: 'Beginner to Intermediate',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🗄️ Query Joins, Normalization & Tuning'
      ],
      orderIndex: 8
    },
    'web-development': {
      name: 'Web Development',
      icon: '🌐',
      subtitle: 'Complete web development from HTML, CSS foundations to responsive web portals.',
      description: 'Construct modern full-stack responsive web portals and web applications with proper styling and JS scripts.',
      color: '#f97316',
      level: 'Beginner to Advanced',
      category: 'programming',
      badge: 'Elite',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🌐 Responsive HTML5, CSS3 Grid & Hosting'
      ],
      orderIndex: 9
    },
    'elite-aptitude': {
      name: 'Elite Aptitude Mastery',
      icon: '🧠',
      subtitle: 'Crack quantitative analysis, logical reasoning, and competitive aptitude assessments.',
      description: 'Preparation for campus placements, standard quant formulas, logical patterns, and tricks.',
      color: '#8b5cf6',
      level: 'Beginner to Advanced',
      category: 'placement',
      badge: 'Premium',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🧠 Quantitative & Logical Reasoning Mastery'
      ],
      orderIndex: 10
    },
    'interview-prep': {
      name: 'Interview Preparation Pro',
      icon: '💼',
      subtitle: 'Develop technical and HR interview confidence with mock cases and feedback templates.',
      description: 'Standard HR and Technical mock interviews preparation, coding round behavioral questions and tips.',
      color: '#10b981',
      level: 'Intermediate to Advanced',
      category: 'placement',
      badge: 'Premium',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '💼 HR, Technical & Behavior Mock Interviews'
      ],
      orderIndex: 11
    },
    'placement-booster': {
      name: 'Campus Placement Booster',
      icon: '🚀',
      subtitle: 'The ultimate step-by-step roadmap to land placement offers at product companies.',
      description: 'Detailed company roadmap, target profiles, practice coding problems sheet and mentorship.',
      color: '#ef4444',
      level: 'Beginner to Advanced',
      category: 'placement',
      badge: 'Premium',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '🚀 Complete Placement Prep & Roadmap Guide'
      ],
      orderIndex: 12
    },
    'resume-linkedin': {
      name: 'Resume & LinkedIn Masterclass',
      icon: '📄',
      subtitle: 'Craft ATS-compliant resumes and build a professional high-impact LinkedIn brand.',
      description: 'Learn resume formatting, keywords selection, profiling, LinkedIn outreach methods, and portfolio design.',
      color: '#06b6d4',
      level: 'Beginner to Intermediate',
      category: 'placement',
      badge: 'Premium',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '📄 ATS-friendly Resumes & LinkedIn Optimization'
      ],
      orderIndex: 13
    },
    'coding-round': {
      name: 'Coding Round Crackers',
      icon: '💻',
      subtitle: 'Deconstruct assessments on LeetCode and HackerRank under strict time limits.',
      description: 'Practice coding questions under timed mock setups, data structures optimizations, and code dry running.',
      color: '#f59e0b',
      level: 'Intermediate to Advanced',
      category: 'placement',
      badge: 'Premium',
      status: 'Active',
      visibility: 'Visible',
      isElitePlus: false,
      lockContent: false,
      enrollment: 'Open',
      price: 'Free',
      benefits: 'Basics to Advanced Learning\nNotes + Classes + Practice\nExam & Coding Focused',
      features: [
        '🚀 Basics to Advanced Learning',
        '📚 Notes + Classes + Practice',
        '⚡ Exam & Coding Focused',
        '🏆 Smart Prep for Top Results',
        '💻 Dynamic Programming, Recursion & Logic Practice'
      ],
      orderIndex: 14
    }
  };

  db.ref('batches').set(defaults)
    .then(() => console.log("✅ Seeding defaults complete."))
    .catch(err => console.error("❌ Seeding defaults failed:", err));
}

// SWITCH ACTIVE TAB TRIGGER
function initBatchesTab() {
  console.log("🔄 Rendering batches dashboard...");
  renderBatchesGrid();
}

// RENDER BATCH CARDS GRID
function renderBatchesGrid() {
  const grid = document.getElementById('admBatchesGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const q = document.getElementById('batchSearch') ? document.getElementById('batchSearch').value.toLowerCase().trim() : '';
  const statusFilter = document.getElementById('batchesFilterStatus') ? document.getElementById('batchesFilterStatus').value : 'all';
  const sortBy = document.getElementById('batchesSortBy') ? document.getElementById('batchesSortBy').value : 'order';

  const filtered = batchesList.filter(batch => {
    // 1. Search filter (by Name, Faculty, Category, Subtitle)
    if (q) {
      const name = (batch.name || '').toLowerCase();
      const tags = (batch.subtitle || '').toLowerCase();
      const fac = (batch.faculty || '').toLowerCase();
      const cat = (batch.category || '').toLowerCase();
      if (!name.includes(q) && !tags.includes(q) && !fac.includes(q) && !cat.includes(q)) {
        return false;
      }
    }

    // 2. Pill/Category tabs
    if (currentFilter !== 'all') {
      if (currentFilter === 'programming' || currentFilter === 'placement' || currentFilter === 'core' || currentFilter === 'other') {
        if (batch.category !== currentFilter) return false;
      } else if (currentFilter === 'elite-plus') {
        if (!batch.isElitePlus) return false;
      }
    }

    // 3. Status select dropdown
    if (statusFilter !== 'all') {
      if (statusFilter === 'Published') {
        if (batch.status !== 'Published' && batch.status !== 'Active') return false;
      } else if (statusFilter === 'Draft') {
        if (batch.status !== 'Draft') return false;
      } else if (statusFilter === 'Archived') {
        if (batch.status !== 'Archived') return false;
      }
    }

    return true;
  });

  // 4. Sorting queries
  if (sortBy === 'order') {
    filtered.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => (batchStudentCounts[b.id] || 0) - (batchStudentCounts[a.id] || 0));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } else if (sortBy === 'oldest') {
    filtered.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  // Update HUD metrics
  updateBatchesHUD();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; padding:60px 0; text-align:center; color:var(--text-muted);">
        <div style="font-size:3rem; margin-bottom:12px;">📚</div>
        <h3>No learning batches found</h3>
        <p>Try resetting filters or adjusting search keyword.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((batch, idx) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.style.cssText = `
      position: relative;
      border-top: 3px solid ${batch.color || 'var(--accent-primary)'} !important;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    // Dynamic hover states with real-time CSS animations and shadow glows
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = `${batch.color}80`;
      card.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.75), 0 0 25px ${batch.color}25`;
      card.style.transform = 'translateY(-6px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
      card.style.transform = '';
    });

    const isLocked = batch.lockContent ? '🔒 Locked' : '📖 Public';
    const elitePlusTag = batch.isElitePlus ? '<span class="status-badge" style="background:#8b5cf615; color:#a78bfa; border:1px solid #8b5cf625; font-weight:700;">Elite+</span>' : '';
    const visibilityColor = batch.visibility === 'Visible' ? '#10b981' : '#ef4444';
    
    // Status indicators with green pulsing animation for Active states
    let statusIndicatorHtml = '';
    if (batch.status === 'Active' || batch.status === 'Published') {
      statusIndicatorHtml = `
        <span style="display:flex; align-items:center; gap:6px;">
          <span class="pulse-indicator" style="background:#10b981; box-shadow:0 0 8px rgba(16, 185, 129, 0.5); margin:0;"></span>
          Published
        </span>
      `;
    } else if (batch.status === 'Draft') {
      statusIndicatorHtml = `
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#f59e0b;"></span>
          Draft
        </span>
      `;
    } else {
      statusIndicatorHtml = `
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#ef4444;"></span>
          Archived
        </span>
      `;
    }

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:start; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.8rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); padding:8px; border-radius:10px; width:46px; height:46px; display:flex; justify-content:center; align-items:center; color:#fff;">
            ${batch.icon || '🎓'}
          </span>
          <div>
            <h4 style="margin:0; font-weight:700; color:#fff; font-size:1.05rem; letter-spacing:-0.01em;">${batch.name}</h4>
            <span style="font-size:0.75rem; font-family:monospace; color:var(--text-muted); opacity:0.8;">${batch.id}</span>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:end; gap:6px;">
          <span class="status-badge" style="background:${batch.color}15; color:${batch.color}; border:1px solid ${batch.color}30; font-weight:800; text-transform:uppercase; font-size:0.7rem; letter-spacing:0.5px; padding:2px 8px;">
            ${batch.badge || 'Elite'}
          </span>
          ${elitePlusTag}
        </div>
      </div>

      <p style="font-size:0.85rem; color:var(--text-secondary); margin:4px 0 0 0; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;" title="${batch.subtitle}">
        ${batch.subtitle || 'No tagline defined.'}
      </p>

      <!-- Thumbnails and preview cover information -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.04); border-radius:10px; padding:10px 14px; margin-top:4px; font-size:0.8rem;">
        <div style="color:var(--text-secondary);">Track: <strong style="color:#fff; font-weight:600;">${batch.category || 'programming'}</strong></div>
        <div style="color:var(--text-secondary);">Level: <strong style="color:#fff; font-weight:600;">${batch.level || 'Any'}</strong></div>
        <div style="color:var(--text-secondary);">Faculty: <strong style="color:#fff; font-weight:600;">${batch.faculty || 'N/A'}</strong></div>
        <div style="color:var(--text-secondary);">Duration: <strong style="color:#fff; font-weight:600;">${batch.duration || 'N/A'}</strong></div>
        <div style="color:var(--text-secondary);">Rating: <strong style="color:#f59e0b; font-weight:700;">⭐ ${batch.rating || '4.8'}</strong></div>
        <div style="color:var(--text-secondary);">Price: <strong style="color:#a78bfa; font-weight:700;">${batch.price || 'Free'} ${batch.originalPrice ? `<span style="text-decoration:line-through; font-size:0.7rem; color:var(--text-muted); font-weight:normal; margin-left:4px;">${batch.originalPrice}</span>` : ''}</strong></div>
        <div style="color:var(--text-secondary); grid-column: span 2; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; display: flex; justify-content: space-between;">
          <span>Students: <strong style="color:var(--accent-blue);">${batchStudentCounts[batch.id] || 0}</strong></span>
          <span>Sessions: <strong style="color:#10b981;">${batchSessionCounts[batch.id] || 0}</strong></span>
        </div>
      </div>

      <!-- Visibility and Status indicators -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; margin-top:2px; color:var(--text-secondary); padding:0 4px;">
        <span style="display:flex; align-items:center; gap:6px;">
          Status: <strong style="color:#fff; font-weight:600;">${statusIndicatorHtml}</strong>
        </span>
        <span style="display:flex; align-items:center; gap:6px;">
          <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${visibilityColor};"></span>
          Visibility: <strong style="color:#fff; font-weight:600;">${batch.visibility || 'Visible'}</strong>
        </span>
      </div>

      <!-- Footer action tools -->
      <div style="display:flex; align-items:center; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:14px; margin-top:auto; gap:8px;">
        <!-- Ordering controls -->
        <div style="display:flex; gap:6px;">
          <button class="btn-outline" onclick="reorderBatch('${batch.id}', 'up')" style="padding:6px 10px; font-size:0.75rem; border-radius:6px;" title="Move Up" ${idx === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>▲</button>
          <button class="btn-outline" onclick="reorderBatch('${batch.id}', 'down')" style="padding:6px 10px; font-size:0.75rem; border-radius:6px;" title="Move Down" ${idx === filtered.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>▼</button>
        </div>
        
        <!-- Action items -->
        <div style="display:flex; gap:6px;">
          <button class="btn-outline" onclick="duplicateBatchConfig('${batch.id}')" style="padding:6px 10px; font-size:0.8rem; color:#a78bfa; border-radius:8px;" title="Duplicate Batch">📋 Clone</button>
          <button class="btn-outline" onclick="openEditBatchModal('${batch.id}')" style="padding:6px 10px; font-size:0.8rem; color:#60a5fa; border-radius:8px;" title="Edit details">✏️ Edit</button>
          <button class="btn-outline" onclick="deleteBatchConfig('${batch.id}')" style="padding:6px 10px; font-size:0.8rem; color:#f87171; border-radius:8px;" title="Delete Batch">🗑️ Delete</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// FILTER CONTROLLERS
window.filterBatchesBy = function(filterType, btn) {
  currentFilter = filterType;
  const filterBtns = document.querySelectorAll('#batchesFilterContainer button');
  filterBtns.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBatchesGrid();
};

window.searchBatches = function(query) {
  currentSearch = query.toLowerCase().trim();
  renderBatchesGrid();
};

// ADD BATCH TRIGGER
window.openAddBatchModal = function() {
  document.getElementById('batchModalTitle').innerText = "Add New Learning Batch";
  document.getElementById('batchModal_isEdit').value = "false";
  
  const idInput = document.getElementById('batchModal_id');
  idInput.value = "";
  idInput.disabled = false;
  
  document.getElementById('batchModal_name').value = "";
  document.getElementById('batchModal_subtitle').value = "";
  document.getElementById('batchModal_description').value = "";
  document.getElementById('batchModal_category').value = "programming";
  document.getElementById('batchModal_level').value = "Beginner to Intermediate";
  document.getElementById('batchModal_color').value = "#3b82f6";
  document.getElementById('batchModal_badge').value = "Elite";
  document.getElementById('batchModal_status').value = "Published";
  document.getElementById('batchModal_visibility').value = "Visible";
  
  document.getElementById('batchModal_isElitePlus').checked = false;
  document.getElementById('batchModal_lockContent').checked = false;
  document.getElementById('batchModal_hideEliteBadge').checked = false;
  document.getElementById('batchModal_enrollment').value = "Open";
  document.getElementById('batchModal_price').value = "Free";
  document.getElementById('batchModal_benefits').value = "";

  document.getElementById('batchModal_faculty').value = "";
  document.getElementById('batchModal_duration').value = "";
  document.getElementById('batchModal_originalPrice').value = "";
  document.getElementById('batchModal_rating').value = "";
  
  // Clear feature rows
  document.getElementById('batchModal_featuresList').innerHTML = "";
  addFeatureRow("🚀 Basics to Advanced Learning");
  addFeatureRow("📚 Notes + Classes + Practice");
  addFeatureRow("⚡ Exam & Coding Focused");
  
  // Reset media previews
  resetBatchMediaPreviews();
  
  document.getElementById('admBatchModal').style.display = 'flex';
};

// EDIT BATCH TRIGGER
window.openEditBatchModal = function(batchId) {
  const batch = batchesList.find(b => b.id === batchId);
  if (!batch) return;

  document.getElementById('batchModalTitle').innerText = "Edit Learning Batch";
  document.getElementById('batchModal_isEdit').value = "true";
  
  const idInput = document.getElementById('batchModal_id');
  idInput.value = batch.id;
  idInput.disabled = true; // Lock ID slug during editing
  
  document.getElementById('batchModal_name').value = batch.name || "";
  document.getElementById('batchModal_subtitle').value = batch.subtitle || "";
  document.getElementById('batchModal_description').value = batch.description || "";
  document.getElementById('batchModal_category').value = batch.category || "programming";
  document.getElementById('batchModal_level').value = batch.level || "Beginner to Intermediate";
  document.getElementById('batchModal_color').value = batch.color || "#3b82f6";
  document.getElementById('batchModal_badge').value = batch.badge || "Elite";
  document.getElementById('batchModal_status').value = (batch.status === 'Active') ? 'Published' : (batch.status || 'Published');
  document.getElementById('batchModal_visibility').value = batch.visibility || "Visible";
  
  document.getElementById('batchModal_isElitePlus').checked = !!batch.isElitePlus;
  document.getElementById('batchModal_lockContent').checked = !!batch.lockContent;
  document.getElementById('batchModal_hideEliteBadge').checked = !!batch.hideEliteBadge;
  document.getElementById('batchModal_enrollment').value = batch.enrollment || "Open";
  document.getElementById('batchModal_price').value = batch.price || "Free";
  document.getElementById('batchModal_benefits').value = batch.benefits || "";

  document.getElementById('batchModal_faculty').value = batch.faculty || "";
  document.getElementById('batchModal_duration').value = batch.duration || "";
  document.getElementById('batchModal_originalPrice').value = batch.originalPrice || "";
  document.getElementById('batchModal_rating').value = batch.rating || "";
  
  // Fill feature rows
  const featuresContainer = document.getElementById('batchModal_featuresList');
  featuresContainer.innerHTML = "";
  if (batch.features && Array.isArray(batch.features)) {
    batch.features.forEach(feat => addFeatureRow(feat));
  } else {
    addFeatureRow("");
  }
  
  // Restore media previews
  resetBatchMediaPreviews();
  
  if (batch.thumbnail) {
    document.getElementById('batchModal_thumbPreview').src = batch.thumbnail;
    document.getElementById('batchModal_thumbPreview').style.display = 'block';
    document.getElementById('batchModal_thumbPlaceholder').style.display = 'none';
    document.getElementById('batchModal_thumbBase64').value = batch.thumbnail;
  }
  if (batch.banner) {
    document.getElementById('batchModal_bannerPreview').src = batch.banner;
    document.getElementById('batchModal_bannerPreview').style.display = 'block';
    document.getElementById('batchModal_bannerPlaceholder').style.display = 'none';
    document.getElementById('batchModal_bannerBase64').value = batch.banner;
  }
  if (batch.facultyImage) {
    document.getElementById('batchModal_facultyImagePreview').src = batch.facultyImage;
    document.getElementById('batchModal_facultyImagePreview').style.display = 'block';
    document.getElementById('batchModal_facultyImagePlaceholder').style.display = 'none';
    document.getElementById('batchModal_facultyImageBase64').value = batch.facultyImage;
  }
  
  document.getElementById('admBatchModal').style.display = 'flex';
};

// CLOSE MODAL WINDOW
window.closeBatchModal = function() {
  document.getElementById('admBatchModal').style.display = 'none';
};

// ADD FEATURE FIELD ROW
window.addFeatureRow = function(val = '') {
  const container = document.getElementById('batchModal_featuresList');
  if (!container) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:8px;';
  row.className = 'feature-input-row';
  
  row.innerHTML = `
    <input type="text" placeholder="e.g. 🚀 Basics to Advanced Learning" value="${val}" style="flex:1; padding:8px 12px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.08); border-radius:6px; color:#fff; font-size:0.85rem; outline:none;" />
    <button type="button" class="btn-outline" onclick="this.parentElement.remove()" style="padding:6px 12px; color:#ef4444; border-color:rgba(239,68,68,0.2);">✕</button>
  `;
  container.appendChild(row);
};

// MEDIA UPLOAD VALIDATION HANDLER (<= 1MB)
window.uploadBatchMedia = function(input, type) {
  const file = input.files[0];
  if (!file) return;

  // Format validation
  const allowedExtensions = /(\.png|\.jpg|\.jpeg|\.webp)$/i;
  if (!allowedExtensions.exec(file.name)) {
    alert("Invalid format. Only JPG, JPEG, PNG, or WEBP formats are supported.");
    input.value = '';
    return;
  }

  // Size limit validation (Strictly <= 1 MB)
  const maxSize = 1 * 1024 * 1024; // 1 MB
  if (file.size > maxSize) {
    alert("Image size must be 1 MB or less.");
    input.value = '';
    return;
  }

  // Convert to Base64 String
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    if (type === 'thumbnail') {
      document.getElementById('batchModal_thumbPreview').src = base64Data;
      document.getElementById('batchModal_thumbPreview').style.display = 'block';
      document.getElementById('batchModal_thumbPlaceholder').style.display = 'none';
      document.getElementById('batchModal_thumbBase64').value = base64Data;
    } else if (type === 'banner') {
      document.getElementById('batchModal_bannerPreview').src = base64Data;
      document.getElementById('batchModal_bannerPreview').style.display = 'block';
      document.getElementById('batchModal_bannerPlaceholder').style.display = 'none';
      document.getElementById('batchModal_bannerBase64').value = base64Data;
    } else if (type === 'facultyImage') {
      document.getElementById('batchModal_facultyImagePreview').src = base64Data;
      document.getElementById('batchModal_facultyImagePreview').style.display = 'block';
      document.getElementById('batchModal_facultyImagePlaceholder').style.display = 'none';
      document.getElementById('batchModal_facultyImageBase64').value = base64Data;
    }
  };
  reader.readAsDataURL(file);
};

// MEDIA PREVIEWS CLEANER
function resetBatchMediaPreviews() {
  document.getElementById('batchModal_thumbPreview').src = "";
  document.getElementById('batchModal_thumbPreview').style.display = 'none';
  document.getElementById('batchModal_thumbPlaceholder').style.display = 'block';
  document.getElementById('batchModal_thumbBase64').value = "";
  document.getElementById('batchModal_thumbFileInput').value = "";
  
  document.getElementById('batchModal_bannerPreview').src = "";
  document.getElementById('batchModal_bannerPreview').style.display = 'none';
  document.getElementById('batchModal_bannerPlaceholder').style.display = 'block';
  document.getElementById('batchModal_bannerBase64').value = "";
  document.getElementById('batchModal_bannerFileInput').value = "";

  document.getElementById('batchModal_facultyImagePreview').src = "";
  document.getElementById('batchModal_facultyImagePreview').style.display = 'none';
  document.getElementById('batchModal_facultyImagePlaceholder').style.display = 'block';
  document.getElementById('batchModal_facultyImageBase64').value = "";
  if (document.getElementById('batchModal_facultyImageFileInput')) {
    document.getElementById('batchModal_facultyImageFileInput').value = "";
  }
}

// SAVE OR UPDATE CONFIG TO REALTIME DATABASE
window.saveBatchConfig = function() {
  const isEdit = document.getElementById('batchModal_isEdit').value === "true";
  const batchId = document.getElementById('batchModal_id').value.trim().toLowerCase();
  
  if (!batchId) {
    alert("Unique Batch Slug is required.");
    return;
  }

  // Slug check regex (lowercase letters and hyphens only)
  const slugRegex = /^[a-z0-9\-]+$/;
  if (!slugRegex.test(batchId)) {
    alert("Unique Batch ID (Slug) must contain only lowercase letters, numbers, and hyphens (no spaces, special chars).");
    return;
  }

  // Gather values
  const name = document.getElementById('batchModal_name').value.trim();
  const subtitle = document.getElementById('batchModal_subtitle').value.trim();
  const description = document.getElementById('batchModal_description').value.trim();
  const category = document.getElementById('batchModal_category').value;
  const level = document.getElementById('batchModal_level').value;
  const color = document.getElementById('batchModal_color').value;
  const badge = document.getElementById('batchModal_badge').value;
  const status = document.getElementById('batchModal_status').value;
  const visibility = document.getElementById('batchModal_visibility').value;
  
  const isElitePlus = document.getElementById('batchModal_isElitePlus').checked;
  const lockContent = document.getElementById('batchModal_lockContent').checked;
  const hideEliteBadge = document.getElementById('batchModal_hideEliteBadge').checked;
  const enrollment = document.getElementById('batchModal_enrollment').value;
  const price = document.getElementById('batchModal_price').value.trim();
  const benefits = document.getElementById('batchModal_benefits').value;

  const faculty = document.getElementById('batchModal_faculty').value.trim();
  const duration = document.getElementById('batchModal_duration').value.trim();
  const originalPrice = document.getElementById('batchModal_originalPrice').value.trim();
  const rating = document.getElementById('batchModal_rating').value.trim();
  const facultyImage = document.getElementById('batchModal_facultyImageBase64').value;
  
  // Gather dynamic features array
  const featureRows = document.querySelectorAll('#batchModal_featuresList .feature-input-row input');
  const features = [];
  featureRows.forEach(input => {
    const val = input.value.trim();
    if (val) features.push(val);
  });

  const thumbnail = document.getElementById('batchModal_thumbBase64').value;
  const banner = document.getElementById('batchModal_bannerBase64').value;

  // Determine Icon from Category presets
  let icon = '🎓';
  if (category === 'programming') {
    if (batchId.includes('c-programming')) icon = '⌨️';
    else if (batchId.includes('cpp')) icon = '🚀';
    else if (batchId.includes('java')) icon = '☕';
    else if (batchId.includes('javascript')) icon = '✨';
    else if (batchId.includes('node')) icon = '🔧';
    else if (batchId.includes('python')) icon = '🐍';
    else if (batchId.includes('react')) icon = '⚛️';
    else if (batchId.includes('sql') || batchId.includes('db')) icon = '🗄️';
    else if (batchId.includes('web')) icon = '🌐';
    else icon = '💻';
  } else if (category === 'placement') {
    if (batchId.includes('aptitude') || batchId.includes('quant')) icon = '🧠';
    else if (batchId.includes('interview')) icon = '💼';
    else if (batchId.includes('resume') || batchId.includes('linkedin')) icon = '📄';
    else if (batchId.includes('round') || batchId.includes('cracker')) icon = '💻';
    else icon = '🚀';
  } else if (category === 'core') {
    icon = '📚';
  }

  // Lookup existing batch for order index preservation
  const existingBatch = batchesList.find(b => b.id === batchId);
  const orderIndex = existingBatch ? (existingBatch.orderIndex || 0) : batchesList.length;

  const payload = {
    name,
    icon,
    subtitle,
    description,
    category,
    level,
    color,
    badge,
    status,
    visibility,
    isElitePlus,
    lockContent,
    hideEliteBadge,
    enrollment,
    price,
    benefits,
    features,
    thumbnail,
    banner,
    faculty,
    duration,
    originalPrice,
    rating,
    facultyImage,
    orderIndex,
    updatedAt: Date.now()
  };

  if (!isEdit) {
    payload.createdAt = Date.now();
  } else if (existingBatch && existingBatch.createdAt) {
    payload.createdAt = existingBatch.createdAt;
  }

  db.ref('batches/' + batchId).set(payload)
    .then(() => {
      // Trigger notification pushes based on updates
      try {
        if (window.NotificationsService) {
          const targetUrl = `elite-plus.html`;
          if (!isEdit) {
            window.NotificationsService.pushSystemNotification(
              'batch_update',
              '🚀 New Learning Batch Launched!',
              `BCA Store में एक नया batch जोड़ा गया है: "${name}".\n\n${subtitle}\n\nअभी enroll करें और सीखना शुरू करें।`,
              batchId,
              targetUrl,
              thumbnail,
              'Enroll Now'
            ).catch(e => console.error(e));
          } else if (existingBatch) {
            if (thumbnail !== existingBatch.thumbnail) {
              window.NotificationsService.pushSystemNotification(
                'batch_update',
                '🔄 Batch Thumbnail Updated',
                `"${name}" batch का cover/thumbnail update किया गया है।\n\nनया visual check करने के लिए batch open करें।`,
                batchId,
                targetUrl,
                thumbnail,
                'Open Batch'
              ).catch(e => console.error(e));
            }
            if (description !== existingBatch.description) {
              window.NotificationsService.pushSystemNotification(
                'batch_update',
                '📝 Batch Description Updated',
                `"${name}" batch का description update किया गया है।\n\nनया syllabus और details check करने के लिए open करें।`,
                batchId,
                targetUrl,
                thumbnail,
                'Check Details'
              ).catch(e => console.error(e));
            }
            if (price !== existingBatch.price) {
              window.NotificationsService.pushSystemNotification(
                'batch_update',
                '⚡ Batch Price Changed',
                `"${name}" batch की pricing details update हुई हैं।\n\nNew Pricing structure: ${price}`,
                batchId,
                targetUrl,
                thumbnail,
                'Check Offer'
              ).catch(e => console.error(e));
            }
            if (JSON.stringify(features) !== JSON.stringify(existingBatch.features || [])) {
              window.NotificationsService.pushSystemNotification(
                'batch_update',
                '✨ Batch Features Updated',
                `"${name}" batch में नए benefits और learning features add किए गए हैं।`,
                batchId,
                targetUrl,
                thumbnail,
                'View Features'
              ).catch(e => console.error(e));
            }
          }
        }
      } catch (e) {
        console.warn("Notification push trigger failed:", e);
      }

      closeBatchModal();
      if (typeof showToast === 'function') {
        showToast(`⚡ Batch "${name}" saved and published successfully!`, 'success');
      } else {
        alert(`⚡ Batch "${name}" saved and published successfully!`);
      }
    })
    .catch(err => {
      console.error("Save failed:", err);
      alert("Error saving batch configurations: " + err.message);
    });
};

// CLONE / DUPLICATE BATCH
window.duplicateBatchConfig = function(batchId) {
  const original = batchesList.find(b => b.id === batchId);
  if (!original) return;

  const confirmClone = confirm(`Clone and duplicate "${original.name}" batch configuration?`);
  if (!confirmClone) return;

  const newSlug = original.id + '-copy';
  
  // Resolve unique slug naming collision
  let finalizedSlug = newSlug;
  let collisionIndex = 1;
  while (batchesList.some(b => b.id === finalizedSlug)) {
    finalizedSlug = newSlug + '-' + collisionIndex;
    collisionIndex++;
  }

  const clonedPayload = {
    ...original,
    name: original.name + " (Copy)",
    orderIndex: batchesList.length,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  delete clonedPayload.id; // Strip out mapped id property if any

  db.ref('batches/' + finalizedSlug).set(clonedPayload)
    .then(() => {
      if (window.NotificationsService) {
        window.NotificationsService.pushSystemNotification(
          'batch_update',
          '🚀 New Learning Batch Launched!',
          `BCA Store में एक नया batch जोड़ा गया है: "${clonedPayload.name}".\n\nअभी enroll करें और सीखना शुरू करें।`,
          finalizedSlug,
          'elite-plus.html',
          clonedPayload.thumbnail || '',
          'Enroll Now'
        ).catch(e => console.error(e));
      }

      if (typeof showToast === 'function') {
        showToast("📋 Batch cloned and duplicated successfully!", "success");
      } else {
        alert("📋 Batch cloned and duplicated successfully!");
      }
    })
    .catch(err => {
      console.error("Cloning failed:", err);
      alert("Cloning failed: " + err.message);
    });
};

// DELETE BATCH CONFIG - SMART DELETE PROTECTION MODAL OPENER
let batchToDeleteId = null;

window.deleteBatchConfig = function(batchId) {
  const batch = batchesList.find(b => b.id === batchId);
  if (!batch) return;

  batchToDeleteId = batchId;
  document.getElementById('deleteBatchName').textContent = batch.name;

  const studentsCount = batchStudentCounts[batchId] || 0;
  const sessionsCount = batchSessionCounts[batchId] || 0;

  // Update Checkmarks inside Smart Delete Protection Modal
  const checkStudIcon = document.getElementById('checkStudentsIcon');
  const checkStudText = document.getElementById('checkStudentsText');
  if (studentsCount > 0) {
    checkStudIcon.textContent = '⚠️';
    checkStudIcon.style.color = '#f59e0b';
    checkStudText.textContent = `Contains ${studentsCount} enrolled student(s)`;
  } else {
    checkStudIcon.textContent = '🟢';
    checkStudIcon.style.color = '#10b981';
    checkStudText.textContent = 'No enrolled students';
  }

  const checkSessIcon = document.getElementById('checkSessionsIcon');
  const checkSessText = document.getElementById('checkSessionsText');
  if (sessionsCount > 0) {
    checkSessIcon.textContent = '⚠️';
    checkSessIcon.style.color = '#f59e0b';
    checkSessText.textContent = `Contains ${sessionsCount} attendance session(s)`;
  } else {
    checkSessIcon.textContent = '🟢';
    checkSessIcon.style.color = '#10b981';
    checkSessText.textContent = 'No attendance sessions';
  }

  // Populate transfer targets
  const transferContainer = document.getElementById('transferContainer');
  const transferSelect = document.getElementById('transferTargetBatch');
  const btnTransfer = document.getElementById('btnDeleteTransfer');

  if (studentsCount > 0) {
    transferContainer.style.display = 'block';
    btnTransfer.style.display = 'inline-block';
    
    // Clear & Populate select dropdown with other batches
    transferSelect.innerHTML = '';
    batchesList.forEach(b => {
      if (b.id !== batchId) {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = `${b.name} (${b.category || 'programming'})`;
        transferSelect.appendChild(opt);
      }
    });

    if (transferSelect.children.length === 0) {
      // No other batch exists to transfer
      transferContainer.style.display = 'none';
      btnTransfer.style.display = 'none';
    }
  } else {
    transferContainer.style.display = 'none';
    btnTransfer.style.display = 'none';
  }

  // Open modal
  document.getElementById('batchDeleteModal').style.display = 'flex';
};

window.closeDeleteBatchModal = function() {
  document.getElementById('batchDeleteModal').style.display = 'none';
  batchToDeleteId = null;
};

window.executeDeleteBatch = async function(mode) {
  if (!batchToDeleteId) return;
  const batchId = batchToDeleteId;
  const targetId = document.getElementById('transferTargetBatch').value;

  if (mode === 'transfer' && !targetId) {
    alert('Please select a target batch to transfer students.');
    return;
  }

  // Confirm once again before final deletion
  const doubleCheck = confirm(
    mode === 'transfer' 
      ? `Are you sure you want to transfer all students to another batch and delete this batch?`
      : `Are you sure you want to delete this batch and ALL associated data (student enrollments and attendance sessions)? THIS CANNOT BE UNDONE!`
  );
  if (!doubleCheck) return;

  try {
    // 1. Delete batch config
    await db.ref('batches/' + batchId).remove();
    
    // 2. Delete elitePlus materials
    await db.ref(`elitePlus/${batchId}`).remove();
    
    // 3. Delete notifications & analytics
    const notifSnap = await db.ref('notifications_live').once('value');
    if (notifSnap.exists()) {
      const updates = {};
      notifSnap.forEach(child => {
        const notif = child.val();
        if (notif.batchId === batchId) {
          updates[`notifications_live/${child.key}`] = null;
          updates[`notification_analytics/details/${child.key}`] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        await db.ref().update(updates);
      }
    }

    // 4. Handle student enrollments (Transfer or Delete)
    const studentsSnap = await db.ref('students').once('value');
    if (studentsSnap.exists()) {
      const studentUpdates = {};
      studentsSnap.forEach(child => {
        const student = child.val();
        
        ['batchesEliteEnrolled', 'batchesEnrolled', 'enrolled'].forEach(field => {
          if (student[field] && Array.isArray(student[field])) {
            const idx = student[field].indexOf(batchId);
            if (idx !== -1) {
              student[field].splice(idx, 1);
              if (mode === 'transfer') {
                if (!student[field].includes(targetId)) {
                  student[field].push(targetId);
                }
              }
              studentUpdates[`students/${child.key}/${field}`] = student[field];
            }
          }
        });
      });
      if (Object.keys(studentUpdates).length > 0) {
        await db.ref().update(studentUpdates);
      }
    }

    // 5. Handle attendance sessions and records
    const sessionsSnap = await db.ref('attendance-v2/sessions').once('value');
    if (sessionsSnap.exists()) {
      const sessUpdates = {};
      sessionsSnap.forEach(child => {
        const session = child.val();
        if (session && session.batch === batchId) {
          // Delete session and its records
          sessUpdates[`attendance-v2/sessions/${child.key}`] = null;
          sessUpdates[`attendance-v2/records/${child.key}`] = null;
        }
      });
      if (Object.keys(sessUpdates).length > 0) {
        await db.ref().update(sessUpdates);
      }
    }

    if (typeof showToast === 'function') {
      showToast(mode === 'transfer' ? "⚡ Batch deleted, students transferred." : "🗑️ Batch and all associated data deleted.", "info");
    } else {
      alert(mode === 'transfer' ? "⚡ Batch deleted, students transferred." : "🗑️ Batch and all associated data deleted.");
    }
  } catch (err) {
    console.error("Delete execution failed:", err);
    alert("Delete failed: " + err.message);
  } finally {
    closeDeleteBatchModal();
  }
};

// REORDER BATCH SWAP
window.reorderBatch = function(batchId, direction) {
  const idx = batchesList.findIndex(b => b.id === batchId);
  if (idx === -1) return;
  if (direction === 'up' && idx === 0) return;
  if (direction === 'down' && idx === batchesList.length - 1) return;

  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  const current = batchesList[idx];
  const neighbor = batchesList[swapIdx];

  // Swap orderIndex
  const tempIdxVal = current.orderIndex || 0;
  current.orderIndex = neighbor.orderIndex || 0;
  neighbor.orderIndex = tempIdxVal;

  const updates = {};
  updates[`batches/${current.id}/orderIndex`] = current.orderIndex;
  updates[`batches/${neighbor.id}/orderIndex`] = neighbor.orderIndex;

  db.ref().update(updates)
    .then(() => {
      console.log("↕️ Reorder updated in Realtime DB");
    })
    .catch(err => {
      console.error("Reorder write failed:", err);
    });
};
