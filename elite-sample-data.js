// ============================================================
// ELITE PLUS - SAMPLE DATA INITIALIZATION
// ============================================================
// This script adds sample videos, notes, DPP, and live classes
// to Firebase for testing and demonstration purposes
// ============================================================

import { 
  database,
  ref,
  set,
  child,
  get
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

import { EliteDataManager, ELITE_BATCHES } from './elite-firebase-config.js';

// Sample data for each batch
const SAMPLE_DATA = {
  'c-programming': {
    videos: [
      {
        title: 'Introduction to C Programming',
        description: 'Learn the basics of C programming language including variables, data types, and operators.',
        url: 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
        duration: '45:32',
        instructor: 'Dr. Rajesh Kumar',
        views: 1250,
        likes: 185,
        position: 1
      },
      {
        title: 'Arrays and Pointers in C',
        description: 'Deep dive into arrays, pointers, and memory management in C programming.',
        url: 'https://www.youtube.com/watch?v=CSYQ-_-_-_Q',
        duration: '52:15',
        instructor: 'Dr. Rajesh Kumar',
        views: 890,
        likes: 142,
        position: 2
      },
      {
        title: 'Functions and Recursion',
        description: 'Master function definitions, function calls, and recursive programming techniques.',
        url: 'https://www.youtube.com/watch?v=_O0Csw5pjRU',
        duration: '38:45',
        instructor: 'Dr. Rajesh Kumar',
        views: 756,
        likes: 98,
        position: 3
      }
    ],
    notes: [
      {
        title: 'C Fundamentals Complete Notes',
        description: 'Comprehensive notes covering all C programming fundamentals with examples.',
        url: 'https://drive.google.com/file/d/sample-pdf-1/view',
        pages: 45,
        downloads: 320,
        difficulty: 'Beginner',
        position: 1
      },
      {
        title: 'Advanced C Concepts',
        description: 'Advanced topics including file I/O, structures, and unions.',
        url: 'https://drive.google.com/file/d/sample-pdf-2/view',
        pages: 38,
        downloads: 210,
        difficulty: 'Advanced',
        position: 2
      }
    ],
    dpp: [
      {
        title: 'Basic C Operators - DPP Set 1',
        description: '20 problems on operators and control flow in C.',
        questions: 20,
        attempts: 450,
        difficulty: 'Beginner',
        url: 'https://docs.google.com/forms/sample-dpp-1',
        solutions: 'https://docs.google.com/document/sample-sol-1',
        position: 1
      },
      {
        title: 'Arrays and Strings - DPP Set 2',
        description: '25 problems on arrays, strings, and 2D arrays.',
        questions: 25,
        attempts: 380,
        difficulty: 'Intermediate',
        url: 'https://docs.google.com/forms/sample-dpp-2',
        solutions: 'https://docs.google.com/document/sample-sol-2',
        position: 2
      }
    ]
  },
  'java': {
    videos: [
      {
        title: 'Java Basics for Beginners',
        description: 'Learn Java fundamentals including syntax, variables, and control structures.',
        url: 'https://www.youtube.com/watch?v=goToXTC96Co',
        duration: '55:20',
        instructor: 'Prof. Amit Singh',
        views: 2100,
        likes: 290,
        position: 1
      },
      {
        title: 'Object-Oriented Programming in Java',
        description: 'Master OOP concepts: classes, objects, inheritance, polymorphism, and encapsulation.',
        url: 'https://www.youtube.com/watch?v=xk4_1d0P1KI',
        duration: '62:45',
        instructor: 'Prof. Amit Singh',
        views: 1890,
        likes: 267,
        position: 2
      }
    ],
    notes: [
      {
        title: 'Java Complete Reference',
        description: 'Complete reference guide for Java programming with all important concepts.',
        url: 'https://drive.google.com/file/d/java-notes-1/view',
        pages: 68,
        downloads: 450,
        difficulty: 'Beginner',
        position: 1
      }
    ],
    dpp: [
      {
        title: 'Java Syntax - DPP Set 1',
        description: '30 problems on Java basic syntax and operators.',
        questions: 30,
        attempts: 520,
        difficulty: 'Beginner',
        url: 'https://docs.google.com/forms/java-dpp-1',
        solutions: 'https://docs.google.com/document/java-sol-1',
        position: 1
      }
    ]
  },
  'python': {
    videos: [
      {
        title: 'Python Programming Basics',
        description: 'Introduction to Python programming with hands-on examples.',
        url: 'https://www.youtube.com/watch?v=rfscVS0vtik',
        duration: '48:30',
        instructor: 'Ms. Priya Sharma',
        views: 3200,
        likes: 412,
        position: 1
      },
      {
        title: 'Data Structures in Python',
        description: 'Learn lists, dictionaries, sets, and tuples with practical examples.',
        url: 'https://www.youtube.com/watch?v=W8KRzm-HUcc',
        duration: '56:15',
        instructor: 'Ms. Priya Sharma',
        views: 2850,
        likes: 365,
        position: 2
      }
    ],
    notes: [
      {
        title: 'Python Quick Start Guide',
        description: 'Quick reference guide for Python programming essentials.',
        url: 'https://drive.google.com/file/d/python-notes-1/view',
        pages: 52,
        downloads: 680,
        difficulty: 'Beginner',
        position: 1
      }
    ],
    dpp: [
      {
        title: 'Python Basics - DPP Set 1',
        description: '25 problems on Python fundamentals.',
        questions: 25,
        attempts: 720,
        difficulty: 'Beginner',
        url: 'https://docs.google.com/forms/python-dpp-1',
        solutions: 'https://docs.google.com/document/python-sol-1',
        position: 1
      }
    ]
  },
  'dsa': {
    videos: [
      {
        title: 'Data Structures Introduction',
        description: 'Learn fundamental data structures and their applications.',
        url: 'https://www.youtube.com/watch?v=1SecJRVc6gc',
        duration: '50:45',
        instructor: 'Dr. Arun Verma',
        views: 2400,
        likes: 325,
        position: 1
      },
      {
        title: 'Sorting and Searching Algorithms',
        description: 'Master important sorting and searching algorithms with complexity analysis.',
        url: 'https://www.youtube.com/watch?v=otQyFvjqPYQ',
        duration: '58:20',
        instructor: 'Dr. Arun Verma',
        views: 2100,
        likes: 298,
        position: 2
      }
    ],
    notes: [
      {
        title: 'DSA Complete Handbook',
        description: 'Comprehensive handbook covering all data structures and algorithms.',
        url: 'https://drive.google.com/file/d/dsa-notes-1/view',
        pages: 95,
        downloads: 890,
        difficulty: 'Advanced',
        position: 1
      }
    ],
    dpp: [
      {
        title: 'Array Problems - DPP Set 1',
        description: '20 array manipulation problems with increasing difficulty.',
        questions: 20,
        attempts: 640,
        difficulty: 'Intermediate',
        url: 'https://docs.google.com/forms/dsa-dpp-1',
        solutions: 'https://docs.google.com/document/dsa-sol-1',
        position: 1
      }
    ]
  }
};

export async function initializeSampleData() {
  console.log('🚀 Initializing Sample Data for Elite Plus...');
  
  try {
    for (const [batchId, data] of Object.entries(SAMPLE_DATA)) {
      console.log(`📝 Adding sample data for batch: ${batchId}`);
      
      // Add videos
      if (data.videos && data.videos.length > 0) {
        for (const video of data.videos) {
          const videoId = 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const videoRef = ref(database, `elitePlus/${batchId}/sections/videos/${videoId}`);
          await set(videoRef, {
            ...video,
            id: videoId,
            timestamp: new Date().toISOString(),
            uploadDate: new Date().toLocaleDateString()
          });
          console.log(`   ✅ Added video: ${video.title}`);
        }
      }
      
      // Add notes
      if (data.notes && data.notes.length > 0) {
        for (const note of data.notes) {
          const noteId = 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const noteRef = ref(database, `elitePlus/${batchId}/sections/notes/${noteId}`);
          await set(noteRef, {
            ...note,
            id: noteId,
            timestamp: new Date().toISOString(),
            uploadDate: new Date().toLocaleDateString()
          });
          console.log(`   ✅ Added note: ${note.title}`);
        }
      }
      
      // Add DPP
      if (data.dpp && data.dpp.length > 0) {
        for (const dppItem of data.dpp) {
          const dppId = 'dpp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const dppRef = ref(database, `elitePlus/${batchId}/sections/dpp/${dppId}`);
          await set(dppRef, {
            ...dppItem,
            id: dppId,
            timestamp: new Date().toISOString(),
            uploadDate: new Date().toLocaleDateString()
          });
          console.log(`   ✅ Added DPP: ${dppItem.title}`);
        }
      }
    }
    
    console.log('✅ Sample Data Initialization Complete!');
    showToast('✅ Sample data loaded successfully!', 'success');
    return true;
  } catch (error) {
    console.error('❌ Error initializing sample data:', error);
    showToast('❌ Error loading sample data', 'error');
    return false;
  }
}

// Helper function to show toast notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    padding: 16px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is admin or in development mode
    if (localStorage.getItem('isAdmin') === 'true' || window.location.hostname === 'localhost') {
      const btn = document.createElement('button');
      btn.textContent = '🚀 Load Sample Data';
      btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      `;
      btn.onclick = () => initializeSampleData();
      document.body.appendChild(btn);
    }
  });
} else {
  // Only initialize if user is admin or in development mode
  if (localStorage.getItem('isAdmin') === 'true' || window.location.hostname === 'localhost') {
    const btn = document.createElement('button');
    btn.textContent = '🚀 Load Sample Data';
    btn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    `;
    btn.onclick = () => initializeSampleData();
    document.body.appendChild(btn);
  }
}
