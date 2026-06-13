// ============================================================
// ELITE PLUS - FIREBASE CONFIGURATION & DATABASE MANAGEMENT
// ============================================================
// Manages all Elite Plus batches resources with real-time Firebase sync
// ============================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { 
  getDatabase, 
  ref, 
  onValue, 
  push, 
  set, 
  update, 
  remove 
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// ==================== FIREBASE CONFIGURATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyC_mWJld2NksodLIg0hI_O0wuLWpUL4AoE",
  authDomain: "bca-store.firebaseapp.com",
  databaseURL: "https://bca-store-default-rtdb.firebaseio.com",
  projectId: "bca-store",
  storageBucket: "bca-store.firebasestorage.app",
  messagingSenderId: "1063532602856",
  appId: "1:1063532602856:web:30812a52ccbded1548305d",
  measurementId: "G-SEYBV2CS0W"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==================== SYNC STATUS TRACKER ====================
export const SyncStatus = {
  isOnline: navigator.onLine,
  lastSync: null,
  pendingUpdates: [],
  
  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingUpdates();
      this.triggerSyncEvent('online');
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.triggerSyncEvent('offline');
    });
  },
  
  triggerSyncEvent(status) {
    const event = new CustomEvent('elitePlusSyncStatus', { detail: { status } });
    document.dispatchEvent(event);
  },
  
  addPendingUpdate(update) {
    this.pendingUpdates.push(update);
  },
  
  async processPendingUpdates() {
    for (const update of this.pendingUpdates) {
      try {
        await update();
        this.pendingUpdates = this.pendingUpdates.filter(u => u !== update);
      } catch (e) {
        console.error('Pending update failed:', e);
      }
    }
  }
};

SyncStatus.init();

// ==================== ELITE PLUS BATCHES LIST ====================
export const ELITE_BATCHES = {
  'c-programming': {
    id: 'c-programming',
    name: 'C Programming',
    icon: '⌨️',
    subtitle: 'Master core memory management, pointers, and foundational structures.',
    color: '#3b82f6',
    level: 'Beginner to Intermediate',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '⌨️ Complete C Syntax & Logic Building'
    ]
  },
  'cpp': {
    id: 'cpp',
    name: 'C++',
    icon: '🚀',
    subtitle: 'Implement advanced Object-Oriented patterns, templates, and optimized algorithms.',
    color: '#06b6d4',
    level: 'Intermediate to Advanced',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🚀 Core OOPs, Templates & STL Mastery'
    ]
  },
  'dsa': {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    icon: '🌳',
    subtitle: 'Build robust problem-solving skills with standard patterns and data structures.',
    color: '#8b5cf6',
    level: 'Intermediate to Advanced',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🌳 Trees, Graphs & Dynamic Programming'
    ]
  },
  'java': {
    id: 'java',
    name: 'Java',
    icon: '☕',
    subtitle: 'Develop scalable enterprise-grade applications with multithreading and MVC.',
    color: '#f59e0b',
    level: 'Intermediate to Advanced',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '☕ Core Java, Multithreading & JDBC'
    ]
  },
  'javascript': {
    id: 'javascript',
    name: 'JavaScript',
    icon: '✨',
    subtitle: 'Unleash modern ES6+, asynchronous operations, and clean DOM scripting.',
    color: '#eab308',
    level: 'Beginner to Intermediate',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '✨ ES6+ Modern JavaScript Concepts'
    ]
  },
  'node-js': {
    id: 'node-js',
    name: 'Node.js',
    icon: '🔧',
    subtitle: 'Architect scalable server-side systems, REST APIs, and event-driven backends.',
    color: '#10b981',
    level: 'Intermediate',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🔧 Express REST APIs & MongoDB Backend'
    ]
  },
  'python': {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    subtitle: 'Dive into dynamic scripting, advanced automation, OOP, and data analytics.',
    color: '#3b82f6',
    level: 'Beginner to Advanced',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🐍 Python Syntax, Automation & ML'
    ]
  },
  'react-js': {
    id: 'react-js',
    name: 'React.js',
    icon: '⚛️',
    subtitle: 'Design complex single-page apps using virtual DOM, hooks, and clean state management.',
    color: '#06b6d4',
    level: 'Intermediate',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '⚛️ Components, Hooks & Redux Toolkit'
    ]
  },
  'sql-database': {
    id: 'sql-database',
    name: 'SQL & Database',
    icon: '🗄️',
    subtitle: 'Model optimized relational databases, complex joins, and performant schemas.',
    color: '#ec4899',
    level: 'Beginner to Intermediate',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🗄️ Query Joins, Normalization & Tuning'
    ]
  },
  'web-development': {
    id: 'web-development',
    name: 'Web Development',
    icon: '🌐',
    subtitle: 'Construct modern full-stack responsive web portals and web applications.',
    color: '#f97316',
    level: 'Beginner to Advanced',
    category: 'programming',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🌐 Responsive HTML5, CSS3 Grid & Hosting'
    ]
  },
  'elite-aptitude': {
    id: 'elite-aptitude',
    name: 'Elite Aptitude Mastery',
    icon: '🧠',
    subtitle: 'Crack quantitative analysis, logical reasoning, and competitive aptitude assessments.',
    color: '#8b5cf6',
    level: 'Beginner to Advanced',
    category: 'placement',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🧠 Quantitative & Logical Reasoning Mastery'
    ]
  },
  'interview-prep': {
    id: 'interview-prep',
    name: 'Interview Preparation Pro',
    icon: '💼',
    subtitle: 'Develop technical and HR interview confidence with mock cases and feedback templates.',
    color: '#10b981',
    level: 'Intermediate to Advanced',
    category: 'placement',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '💼 HR, Technical & Behavior Mock Interviews'
    ]
  },
  'placement-booster': {
    id: 'placement-booster',
    name: 'Campus Placement Booster',
    icon: '🚀',
    subtitle: 'The ultimate step-by-step roadmap to land placement offers at product companies.',
    color: '#ef4444',
    level: 'Beginner to Advanced',
    category: 'placement',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '🚀 Complete Placement Prep & Roadmap Guide'
    ]
  },
  'resume-linkedin': {
    id: 'resume-linkedin',
    name: 'Resume & LinkedIn Masterclass',
    icon: '📄',
    subtitle: 'Craft ATS-compliant resumes and build a professional high-impact LinkedIn brand.',
    color: '#06b6d4',
    level: 'Beginner to Intermediate',
    category: 'placement',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '📄 ATS-friendly Resumes & LinkedIn Optimization'
    ]
  },
  'coding-round': {
    id: 'coding-round',
    name: 'Coding Round Crackers',
    icon: '💻',
    subtitle: 'Deconstruct assessments on LeetCode and HackerRank under strict time limits.',
    color: '#f59e0b',
    level: 'Intermediate to Advanced',
    category: 'placement',
    features: [
      '🚀 Basics to Advanced Learning',
      '📚 Notes + Classes + Practice',
      '⚡ Exam & Coding Focused',
      '🏆 Smart Prep for Top Results',
      '💻 Dynamic Programming, Recursion & Logic Practice'
    ]
  }
};

// ==================== DATABASE STRUCTURE TEMPLATE ====================
export const ELITE_STRUCTURE = {
  elitePlus: {
    'c-programming': {
      info: {
        name: 'C Programming',
        description: 'Master the fundamentals of C programming',
        icon: '⌨️',
        level: 'Beginner to Intermediate',
        studentsEnrolled: 0
      },
      sections: {
        videos: {},
        notes: {},
        dpp: {},
        liveClasses: {}
      },
      stats: {
        totalVideos: 0,
        totalNotes: 0,
        totalDPP: 0,
        totalLiveClasses: 0,
        totalStudents: 0
      }
    }
  }
};

// ==================== ELITE DATA MANAGER ====================
export class EliteDataManager {
  /**
   * Listen to Videos in real-time for a specific elite batch
   */
  static listenToVideos(batchId, callback) {
    const videosRef = ref(database, `elitePlus/${batchId}/sections/videos`);
    return onValue(videosRef, (snapshot) => {
      const videos = [];
      snapshot.forEach(child => {
        videos.push({
          id: child.key,
          ...child.val()
        });
      });
      // Sort by position first (if custom, i.e. not 999), otherwise fall back to uploadDate/timestamp in ascending order (oldest first, i.e., chronological)
      videos.sort((a, b) => {
        const posA = a.position !== undefined && a.position !== null && a.position !== 999 ? Number(a.position) : 999999;
        const posB = b.position !== undefined && b.position !== null && b.position !== 999 ? Number(b.position) : 999999;
        if (posA !== posB) {
          return posA - posB;
        }
        const timeA = a.uploadDate || a.timestamp || (a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0);
        const timeB = b.uploadDate || b.timestamp || (b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0);
        return timeA - timeB;
      });
      callback(videos);
    });
  }

  /**
   * Listen to Notes in real-time for a specific elite batch
   */
  static listenToNotes(batchId, callback) {
    const notesRef = ref(database, `elitePlus/${batchId}/sections/notes`);
    return onValue(notesRef, (snapshot) => {
      const notes = [];
      snapshot.forEach(child => {
        notes.push({
          id: child.key,
          ...child.val()
        });
      });
      notes.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(notes);
    });
  }

  /**
   * Listen to DPP in real-time for a specific elite batch
   */
  static listenToDPP(batchId, callback) {
    const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp`);
    return onValue(dppRef, (snapshot) => {
      const dpp = [];
      snapshot.forEach(child => {
        dpp.push({
          id: child.key,
          ...child.val()
        });
      });
      dpp.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(dpp);
    });
  }

  /**
   * Listen to Live Classes in real-time for a specific elite batch
   */
  static listenToLiveClasses(batchId, callback) {
    const liveRef = ref(database, `elitePlus/${batchId}/sections/liveClasses`);
    return onValue(liveRef, (snapshot) => {
      const liveClasses = [];
      snapshot.forEach(child => {
        liveClasses.push({
          id: child.key,
          ...child.val()
        });
      });
      liveClasses.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(liveClasses);
    });
  }

  /**
   * Get batch statistics
   */
  static getStats(batchId, callback) {
    const statsRef = ref(database, `elitePlus/${batchId}/stats`);
    return onValue(statsRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }
}

// ==================== ELITE ADMIN MANAGER ====================
export class EliteAdminManager {
  /**
   * Add a new video to Elite batch
   */
  static addVideo(batchId, videoData) {
    const videosRef = ref(database, `elitePlus/${batchId}/sections/videos`);
    return push(videosRef, {
      ...videoData,
      uploadDate: Date.now(),
      views: 0,
      likes: 0,
      position: videoData.position || 999
    });
  }

  /**
   * Update existing video
   */
  static updateVideo(batchId, videoId, updates) {
    const videoRef = ref(database, `elitePlus/${batchId}/sections/videos/${videoId}`);
    return update(videoRef, {
      ...updates,
      lastModified: Date.now()
    });
  }

  /**
   * Delete video
   */
  static deleteVideo(batchId, videoId) {
    const videoRef = ref(database, `elitePlus/${batchId}/sections/videos/${videoId}`);
    return remove(videoRef);
  }

  /**
   * Add a new note to Elite batch
   */
  static addNote(batchId, noteData) {
    const notesRef = ref(database, `elitePlus/${batchId}/sections/notes`);
    return push(notesRef, {
      ...noteData,
      uploadDate: Date.now(),
      downloads: 0,
      position: noteData.position || 999
    });
  }

  /**
   * Update existing note
   */
  static updateNote(batchId, noteId, updates) {
    const noteRef = ref(database, `elitePlus/${batchId}/sections/notes/${noteId}`);
    return update(noteRef, {
      ...updates,
      lastModified: Date.now()
    });
  }

  /**
   * Delete note
   */
  static deleteNote(batchId, noteId) {
    const noteRef = ref(database, `elitePlus/${batchId}/sections/notes/${noteId}`);
    return remove(noteRef);
  }

  /**
   * Add a new DPP to Elite batch
   */
  static addDPP(batchId, dppData) {
    const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp`);
    return push(dppRef, {
      ...dppData,
      uploadDate: Date.now(),
      attempts: 0,
      position: dppData.position || 999
    });
  }

  /**
   * Update existing DPP
   */
  static updateDPP(batchId, dppId, updates) {
    const dppRefPath = ref(database, `elitePlus/${batchId}/sections/dpp/${dppId}`);
    return update(dppRefPath, {
      ...updates,
      lastModified: Date.now()
    });
  }

  /**
   * Delete DPP
   */
  static deleteDPP(batchId, dppId) {
    const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp/${dppId}`);
    return remove(dppRef);
  }

  /**
   * Add a new Live Class to Elite batch
   */
  static addLiveClass(batchId, liveData) {
    const liveRef = ref(database, `elitePlus/${batchId}/sections/liveClasses`);
    return push(liveRef, {
      ...liveData,
      uploadDate: Date.now(),
      attendees: 0,
      position: liveData.position || 999
    });
  }

  /**
   * Update existing Live Class
   */
  static updateLiveClass(batchId, liveId, updates) {
    const liveRefPath = ref(database, `elitePlus/${batchId}/sections/liveClasses/${liveId}`);
    return update(liveRefPath, {
      ...updates,
      lastModified: Date.now()
    });
  }

  /**
   * Delete Live Class
   */
  static deleteLiveClass(batchId, liveId) {
    const liveRef = ref(database, `elitePlus/${batchId}/sections/liveClasses/${liveId}`);
    return remove(liveRef);
  }

  /**
   * Update batch statistics
   */
  static updateStats(batchId, stats) {
    const statsRef = ref(database, `elitePlus/${batchId}/stats`);
    return set(statsRef, stats);
  }
}

// ==================== UTILITY FUNCTIONS ====================
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function escapeHtml(text) {
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

// ==================== REAL-TIME BATCHES CONFIG SYNC ====================
onValue(ref(database, 'batches'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Clear and mutate in place
    for (const key in ELITE_BATCHES) {
      delete ELITE_BATCHES[key];
    }
    Object.assign(ELITE_BATCHES, data);
    
    // Dispatch custom event to notify listeners
    const event = new CustomEvent('eliteBatchesUpdated', { detail: data });
    document.dispatchEvent(event);
  }
});

// ==================== EXPORTS ====================
export { database };

console.log('✅ Elite Firebase Config Loaded - Ready for real-time synchronization');
