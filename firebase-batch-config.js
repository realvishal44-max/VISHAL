// Firebase Batch System Configuration
// Complete Firebase setup for batch resources management

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push, remove, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_mWJld2NksodLIg0hI_O0wuLWpUL4AoE",
  authDomain: "bca-store.firebaseapp.com",
  databaseURL: "https://bca-store-default-rtdb.firebaseio.com",
  projectId: "bca-store",
  storageBucket: "bca-store.firebasestorage.app",
  messagingSenderId: "1063532602856",
  appId: "1:1063532602856:web:30812a52ccbded1548305d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Batch List (10 core programming batches for BCA Store) - syncs dynamically in real-time
export const BATCH_LIST = {
  'c-programming': {
    id: 'c-programming',
    name: 'C Programming',
    icon: '⌨️',
    description: 'Master the fundamentals of C programming language',
    color: '#3b82f6',
    level: 'Beginner to Intermediate'
  },
  'cpp': {
    id: 'cpp',
    name: 'C++',
    icon: '🚀',
    description: 'Advanced object-oriented programming with C++',
    color: '#06b6d4',
    level: 'Beginner to Advanced'
  },
  'dsa': {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    icon: '🌳',
    description: 'Master DSA for interview preparation and competitive programming',
    color: '#8b5cf6',
    level: 'Intermediate to Advanced'
  },
  'java': {
    id: 'java',
    name: 'Java',
    icon: '☕',
    description: 'Complete Java programming from basics to advanced',
    color: '#f59e0b',
    level: 'Beginner to Advanced'
  },
  'javascript': {
    id: 'javascript',
    name: 'JavaScript',
    icon: '✨',
    description: 'Modern JavaScript for web development',
    color: '#fbbf24',
    level: 'Beginner to Intermediate'
  },
  'node-js': {
    id: 'node-js',
    name: 'Node.js',
    icon: '🔧',
    description: 'Backend development with Node.js and Express',
    color: '#10b981',
    level: 'Intermediate to Advanced'
  },
  'python': {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    description: 'Python programming for beginners and professionals',
    color: '#3b82f6',
    level: 'Beginner to Intermediate'
  },
  'react-js': {
    id: 'react-js',
    name: 'React.js',
    icon: '⚛️',
    description: 'Frontend development with React.js',
    color: '#06b6d4',
    level: 'Intermediate to Advanced'
  },
  'sql-database': {
    id: 'sql-database',
    name: 'SQL & Database',
    icon: '🗄️',
    description: 'SQL, database design, and optimization',
    color: '#ec4899',
    level: 'Beginner to Intermediate'
  },
  'web-development': {
    id: 'web-development',
    name: 'Web Development',
    icon: '🌐',
    description: 'Complete web development from HTML to full-stack',
    color: '#8b5cf6',
    level: 'Beginner to Advanced'
  }
};

// Real-time listener to sync BATCH_LIST with batches
onValue(ref(database, 'batches'), (snapshot) => {
  const data = snapshot.val();
  if (data) {
    for (const key in BATCH_LIST) {
      delete BATCH_LIST[key];
    }
    Object.assign(BATCH_LIST, data);
    
    // Dispatch custom event to notify listeners
    document.dispatchEvent(new CustomEvent('batchListUpdated', { detail: data }));
  }
});

// Database References - pointing to elitePlus/${batchId} instead of batches/${batchId}
export const dbRefs = {
  getBatchRef: (batchId) => ref(database, `elitePlus/${batchId}`),
  getVideosRef: (batchId) => ref(database, `elitePlus/${batchId}/sections/videos`),
  getNotesRef: (batchId) => ref(database, `elitePlus/${batchId}/sections/notes`),
  getDPPRef: (batchId) => ref(database, `elitePlus/${batchId}/sections/dpp`),
  getLiveClassesRef: (batchId) => ref(database, `elitePlus/${batchId}/sections/liveClasses`),
  getPDFsRef: (batchId) => ref(database, `elitePlus/${batchId}/sections/pdfs`),
  getStatsRef: (batchId) => ref(database, `elitePlus/${batchId}/stats`),
  getUserProgressRef: (userId, batchId) => ref(database, `userProgress/${userId}/${batchId}`),
  getAdminsRef: () => ref(database, 'admins')
};

// Real-time Data Listeners - pointing to elitePlus/
export class BatchDataManager {
  static listenToVideos(batchId, callback) {
    const videosRef = ref(database, `elitePlus/${batchId}/sections/videos`);
    return onValue(videosRef, (snapshot) => {
      const videos = [];
      snapshot.forEach((childSnapshot) => {
        videos.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      // Sort by position
      videos.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(videos);
    });
  }

  static listenToNotes(batchId, callback) {
    const notesRef = ref(database, `elitePlus/${batchId}/sections/notes`);
    return onValue(notesRef, (snapshot) => {
      const notes = [];
      snapshot.forEach((childSnapshot) => {
        notes.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      notes.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(notes);
    });
  }

  static listenToDPP(batchId, callback) {
    const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp`);
    return onValue(dppRef, (snapshot) => {
      const dpp = [];
      snapshot.forEach((childSnapshot) => {
        dpp.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      dpp.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(dpp);
    });
  }

  static listenToLiveClasses(batchId, callback) {
    const classesRef = ref(database, `elitePlus/${batchId}/sections/liveClasses`);
    return onValue(classesRef, (snapshot) => {
      const classes = [];
      snapshot.forEach((childSnapshot) => {
        classes.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      classes.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(classes);
    });
  }

  static listenToPDFs(batchId, callback) {
    const pdfsRef = ref(database, `elitePlus/${batchId}/sections/pdfs`);
    return onValue(pdfsRef, (snapshot) => {
      const pdfs = [];
      snapshot.forEach((childSnapshot) => {
        pdfs.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      pdfs.sort((a, b) => (a.position || 999) - (b.position || 999));
      callback(pdfs);
    });
  }

  static listenToAllSections(batchId, callback) {
    const batchRef = ref(database, `elitePlus/${batchId}/sections`);
    return onValue(batchRef, (snapshot) => {
      const sections = snapshot.val() || {};
      callback(sections);
    });
  }

  static listenToStats(batchId, callback) {
    const statsRef = ref(database, `elitePlus/${batchId}/stats`);
    return onValue(statsRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  }
}

// Admin Functions - pointing to elitePlus/
export class AdminBatchManager {
  static addVideo(batchId, videoData) {
    const videosRef = ref(database, `elitePlus/${batchId}/sections/videos`);
    return push(videosRef, {
      ...videoData,
      uploadDate: Date.now(),
      views: 0,
      likes: 0
    });
  }

  static updateVideo(batchId, videoId, updates) {
    const videoRef = ref(database, `elitePlus/${batchId}/sections/videos/${videoId}`);
    return update(videoRef, updates);
  }

  static deleteVideo(batchId, videoId) {
    const videoRef = ref(database, `elitePlus/${batchId}/sections/videos/${videoId}`);
    return remove(videoRef);
  }

  static addNote(batchId, noteData) {
    const notesRef = ref(database, `elitePlus/${batchId}/sections/notes`);
    return push(notesRef, {
      ...noteData,
      uploadDate: Date.now(),
      downloads: 0
    });
  }

  static updateNote(batchId, noteId, updates) {
    const noteRef = ref(database, `elitePlus/${batchId}/sections/notes/${noteId}`);
    return update(noteRef, updates);
  }

  static deleteNote(batchId, noteId) {
    const noteRef = ref(database, `elitePlus/${batchId}/sections/notes/${noteId}`);
    return remove(noteRef);
  }

  static addDPP(batchId, dppData) {
    const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp`);
    return push(dppRef, {
      ...dppData,
      uploadDate: Date.now(),
      attempts: 0
    });
  }

  static updateDPP(batchId, dppId, updates) {
    const dppRefPath = ref(database, `elitePlus/${batchId}/sections/dpp/${dppId}`);
    return update(dppRefPath, updates);
  }

  static deleteDPP(batchId, dppId) {
    const dppRefPath = ref(database, `elitePlus/${batchId}/sections/dpp/${dppId}`);
    return remove(dppRefPath);
  }

  static addLiveClass(batchId, classData) {
    const classesRef = ref(database, `elitePlus/${batchId}/sections/liveClasses`);
    return push(classesRef, {
      ...classData,
      attendees: 0,
      status: 'scheduled'
    });
  }

  static updateLiveClass(batchId, classId, updates) {
    const classRef = ref(database, `elitePlus/${batchId}/sections/liveClasses/${classId}`);
    return update(classRef, updates);
  }

  static deleteLiveClass(batchId, classId) {
    const classRef = ref(database, `elitePlus/${batchId}/sections/liveClasses/${classId}`);
    return remove(classRef);
  }

  static addPDF(batchId, pdfData) {
    const pdfsRef = ref(database, `elitePlus/${batchId}/sections/pdfs`);
    return push(pdfsRef, {
      ...pdfData,
      uploadDate: Date.now(),
      downloads: 0
    });
  }

  static updatePDF(batchId, pdfId, updates) {
    const pdfRef = ref(database, `elitePlus/${batchId}/sections/pdfs/${pdfId}`);
    return update(pdfRef, updates);
  }

  static deletePDF(batchId, pdfId) {
    const pdfRef = ref(database, `elitePlus/${batchId}/sections/pdfs/${pdfId}`);
    return remove(pdfRef);
  }

  static updateStats(batchId, stats) {
    const statsRef = ref(database, `elitePlus/${batchId}/stats`);
    return set(statsRef, stats);
  }
}

// Utility Functions
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export { database, auth, app };
