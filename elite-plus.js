// ============================================================
// ELITE PLUS - JavaScript
// ============================================================

const ELITE_PLUS_BATCHES = {
  "c-programming": {
    name: "C Programming",
    icon: "⌨️",
    subtitle: "Master the fundamentals of C",
    color: "#3b82f6",
    level: "Beginner to Intermediate",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '⌨️ Complete C Syntax & Logic Building'
    ]
  },
  "cpp": {
    name: "C++",
    icon: "🚀",
    subtitle: "Object-oriented programming in C++",
    color: "#06b6d4",
    level: "Intermediate to Advanced",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🚀 Core OOPs, Templates & STL Mastery'
    ]
  },
  "java": {
    name: "Java",
    icon: "☕",
    subtitle: "Enterprise Java programming",
    color: "#f59e0b",
    level: "Intermediate to Advanced",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '☕ Core Java, Multithreading & JDBC'
    ]
  },
  "javascript": {
    name: "JavaScript",
    icon: "✨",
    subtitle: "Dynamic web development with JS",
    color: "#eab308",
    level: "Beginner to Intermediate",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '✨ ES6+ Modern JavaScript Concepts'
    ]
  },
  "python": {
    name: "Python",
    icon: "🐍",
    subtitle: "Versatile Python programming",
    color: "#3b82f6",
    level: "Beginner to Advanced",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🐍 Python Syntax, Automation & ML'
    ]
  },
  "dsa": {
    name: "Data Structures & Algorithms",
    icon: "🌲",
    subtitle: "Master DSA concepts and patterns",
    color: "#8b5cf6",
    level: "Intermediate to Advanced",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🌳 Trees, Graphs & Dynamic Programming'
    ]
  },
  "web-development": {
    name: "Web Development",
    icon: "🌐",
    subtitle: "Full-stack web technologies",
    color: "#f97316",
    level: "Beginner to Advanced",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🌐 Responsive HTML5, CSS3 Grid & Hosting'
    ]
  },
  "react-js": {
    name: "React JS",
    icon: "⚛️",
    subtitle: "Modern UI development with React",
    color: "#06b6d4",
    level: "Intermediate",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '⚛️ Components, Hooks & Redux Toolkit'
    ]
  },
  "node-js": {
    name: "Node JS",
    icon: "🔧",
    subtitle: "Backend development with Node",
    color: "#10b981",
    level: "Intermediate",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🔧 Express REST APIs & MongoDB Backend'
    ]
  },
  "sql-database": {
    name: "SQL & Database",
    icon: "🗄️",
    subtitle: "Database design and SQL mastery",
    color: "#ec4899",
    level: "Beginner to Intermediate",
    category: "programming",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🗄️ Query Joins, Normalization & Tuning'
    ]
  },
  "elite-aptitude": {
    name: "Elite Aptitude Mastery",
    icon: "🧠",
    subtitle: "Master Quantitative & Logical Reasoning",
    color: "#8b5cf6",
    level: "Beginner to Advanced",
    category: "placement",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🧠 Quantitative & Logical Reasoning Mastery'
    ]
  },
  "interview-prep": {
    name: "Interview Preparation Pro",
    icon: "💼",
    subtitle: "Cracking Technical & HR Interviews",
    color: "#10b981",
    level: "Intermediate to Advanced",
    category: "placement",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '💼 HR, Technical & Behavior Mock Interviews'
    ]
  },
  "placement-booster": {
    name: "Campus Placement Booster",
    icon: "🚀",
    subtitle: "Your ultimate placement roadmap",
    color: "#ef4444",
    level: "Beginner to Advanced",
    category: "placement",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🚀 Complete Placement Prep & Roadmap Guide'
    ]
  },
  "resume-linkedin": {
    name: "Resume & LinkedIn Masterclass",
    icon: "📄",
    subtitle: "Build a resume that stands out",
    color: "#06b6d4",
    level: "Beginner to Intermediate",
    category: "placement",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '📄 ATS-friendly Resumes & LinkedIn Optimization'
    ]
  },
  "coding-round": {
    name: "Coding Round Crackers",
    icon: "💻",
    subtitle: "Ace coding assessments and tests",
    color: "#f59e0b",
    level: "Intermediate to Advanced",
    category: "placement",
    sections: ["notes", "dpp", "videos", "live"],
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '💻 Dynamic Programming, Recursion & Logic Practice'
    ]
  }
};

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

const SECTION_NAMES = {
  notes: "📝 Notes",
  dpp: "📝 DPP (Daily Practice Problems)",
  videos: "🎥 Videos",
  live: "🔴 Live Classes"
};

const SECTION_ICONS = {
  notes: "📄",
  dpp: "📋",
  videos: "🎬",
  live: "🔴"
};

// Initialize Elite Plus page
document.addEventListener('DOMContentLoaded', function () {
  initDarkMode();
  loadElitePlusBatches();
  setupElitePlusNavigation();
  setupElitePlusScrollHandlers();

  // Dynamic Real-time Sync
  const dbCheck = setInterval(() => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(dbCheck);
      db.ref('batches').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          for (const key in ELITE_PLUS_BATCHES) {
            delete ELITE_PLUS_BATCHES[key];
          }
          Object.assign(ELITE_PLUS_BATCHES, data);
          loadElitePlusBatches();
        }
      });
    }
  }, 1000);
});

// Setup scroll handlers for Elite Plus
function setupElitePlusScrollHandlers() {
  window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    const btt = document.getElementById('backToTop');

    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }

    if (window.scrollY > 500) {
      btt?.classList.add('show');
    } else {
      btt?.classList.remove('show');
    }
  });
}

// Setup navigation for Elite Plus
function setupElitePlusNavigation() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks?.classList.toggle('active');
    });
  }

  // Close nav on link click
  const navLinkElements = document.querySelectorAll('.nav-link');
  navLinkElements.forEach(link => {
    link.addEventListener('click', () => {
      navLinks?.classList.remove('active');
    });
  });
}

// Load Elite Plus batches
function loadElitePlusBatches() {
  const grid = document.getElementById('eliteBatchesGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // Create batch cards for all Elite Plus batches
  let cardIndex = 0;
  Object.entries(ELITE_PLUS_BATCHES).forEach(([batchId, batchData]) => {
    if (batchData.isElitePlus !== true) return;
    const card = createEliteBatchCard(batchId, batchData);
    card.style.animationDelay = (cardIndex * 45) + 'ms';
    cardIndex++;
    grid.appendChild(card);
  });

  // Set batch count
  const countPill = document.getElementById('eliteBatchCount');
  if (countPill) {
    countPill.textContent = `${cardIndex} Batches`;
  }
}

// Create batch card element
function createEliteBatchCard(batchId, batchData) {
  const card = document.createElement('div');
  card.className = 'elite-batch-card';
  card.style.setProperty('--accent-glow', batchData.color || '#8b5cf6');

  card.innerHTML = window.generateUnifiedBatchCardHTML(batchId, batchData);

  const batchPageUrl = getBatchPageUrl(batchId);
  const enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
  const isEnrolled = enrolled.includes(batchId);

  card.addEventListener('click', (e) => {
    if (!e.target.closest('.redesigned-card-btn') && !e.target.closest('.redesigned-card-share-btn')) {
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

// Get batch page URL from batch ID
function getBatchPageUrl(batchId) {
  return `elite-batches.html?batch=${batchId}`;
}

// Open batch detail modal (DEPRECATED - Using separate pages now)
async function openEliteBatchModal(batchId) {
  const batchPageUrl = getBatchPageUrl(batchId);
  window.location.href = batchPageUrl;
}

// Close batch modal
function closeEliteBatchModal() {
  const modal = document.getElementById('batchDetailModal');
  modal?.classList.remove('active');
  document.body.style.overflow = '';
}

// Load Elite Plus content from Firebase
async function loadElitePlusContent(batchId, batchData) {
  if (!db) {
    showNoContentMessage();
    return;
  }

  try {
    // Load content for each section
    for (const section of ['notes', 'dpp', 'videos', 'live']) {
      await loadEliteSectionContent(batchId, section);
    }
  } catch (error) {
    console.error('Error loading Elite Plus content:', error);
    showNoContentMessage();
  }
}

// Load specific section content from Firebase
async function loadEliteSectionContent(batchId, sectionType) {
  try {
    const contentRef = db.ref(`elitePlus/${batchId}/${sectionType}`);
    const snapshot = await contentRef.once('value');
    const data = snapshot.val();

    const contentElementId = `modal${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}Content`;
    const contentElement = document.getElementById(contentElementId);

    if (!contentElement) return;

    if (!data || Object.keys(data).length === 0) {
      contentElement.innerHTML = '<div class="empty-content">📭 No content uploaded yet</div>';
      return;
    }

    // Create content links
    let html = '';
    Object.entries(data).forEach(([key, item]) => {
      if (item && item.link) {
        const linkText = item.title || item.link;
        html += `
          <a href="${item.link}" target="_blank" class="content-link" title="${linkText}">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
            </svg>
            <span class="content-link-text">${linkText}</span>
          </a>
        `;
      }
    });

    contentElement.innerHTML = html;
  } catch (error) {
    console.error(`Error loading ${sectionType}:`, error);
    const contentElementId = `modal${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}Content`;
    const contentElement = document.getElementById(contentElementId);
    if (contentElement) {
      contentElement.innerHTML = '<div class="empty-content">⚠️ Error loading content</div>';
    }
  }
}

// Show no content message
function showNoContentMessage() {
  const sections = ['Notes', 'DPP', 'Videos', 'Live'];
  sections.forEach((section) => {
    const elementId = `modal${section}Content`;
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = '<div class="empty-content">📭 No content available</div>';
    }
  });
}

// Close modal when clicking overlay
window.addEventListener('click', (e) => {
  const modal = document.getElementById('batchDetailModal');
  if (e.target === modal) {
    closeEliteBatchModal();
  }
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEliteBatchModal();
  }
});

// Listen for real-time updates from Firebase
function setupElitePlusRealTimeListener() {
  if (!db) return;

  try {
    const elitePlusRef = db.ref('elitePlus');
    elitePlusRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Elite Plus data updated in real-time:', data);
        // If modal is open, refresh the content
        if (document.getElementById('batchDetailModal')?.classList.contains('active')) {
          const batchId = getCurrentOpenBatchId();
          if (batchId) {
            loadElitePlusContent(batchId, ELITE_PLUS_BATCHES[batchId]);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error setting up real-time listener:', error);
  }
}

// Get currently open batch ID
function getCurrentOpenBatchId() {
  const title = document.getElementById('modalBatchTitle')?.textContent;
  for (const [batchId, batchData] of Object.entries(ELITE_PLUS_BATCHES)) {
    if (batchData.name === title) {
      return batchId;
    }
  }
  return null;
}

// Initialize real-time listener when db is ready
if (typeof db !== 'undefined' && db) {
  setupElitePlusRealTimeListener();
} else {
  // Retry after a delay
  setTimeout(() => {
    if (typeof db !== 'undefined' && db) {
      setupElitePlusRealTimeListener();
    }
  }, 1000);
}

// Add dark mode toggle support
function initDarkMode() {
  const dark = localStorage.getItem('darkMode') === 'true';
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateDarkToggle(dark);

  const darkButton = document.getElementById('darkToggle');
  if (darkButton && !darkButton.dataset.darkBound) {
    darkButton.dataset.darkBound = '1';
    darkButton.addEventListener('click', toggleDarkMode);
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('darkMode', !isDark);
  updateDarkToggle(!isDark);
}

function updateDarkToggle(isDark) {
  const btn = document.getElementById('darkToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Bookmark support (from main script)
function openBkPanel() {
  // This function is defined in main script.js
  if (typeof window.openBkPanel === 'function') {
    window.openBkPanel();
  }
}

// Suggestion modal support
function openSuggestionModal() {
  // This function is defined in main script.js
  if (typeof window.openSuggestionModal === 'function') {
    window.openSuggestionModal();
  }
}
