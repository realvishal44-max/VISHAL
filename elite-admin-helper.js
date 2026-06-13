// ============================================================
// ELITE PLUS - QUICK ADMIN HELPER
// ============================================================
// Quick commands to manage Elite Plus content from browser console
// Usage: Open Developer Console (F12) and run commands
// ============================================================

console.log(`
╔═══════════════════════════════════════════════════════════╗
║     ELITE PLUS - QUICK ADMIN COMMANDS                     ║
╚═══════════════════════════════════════════════════════════╝

🔧 Available Commands:

1. ENROLL IN BATCHES
   window.eliteAdmin.enrollInAllBatches()
   window.eliteAdmin.enrollInBatch('c-programming')

2. VIEW ENROLLMENT STATUS
   window.eliteAdmin.checkEnrollment()

3. LOAD SAMPLE DATA
   window.eliteAdmin.loadSampleData()

4. VIEW DATABASE STRUCTURE
   window.eliteAdmin.viewDatabaseStructure()

5. RESET ENROLLMENT
   window.eliteAdmin.resetEnrollment()

6. OPEN BATCH PAGES
   window.eliteAdmin.openBatch('web-development')
   window.eliteAdmin.openBatch('java')
   window.eliteAdmin.openBatch('python')

Available Batch IDs:
- c-programming, cpp, java, javascript, python
- dsa, web-development, react-js, node-js, sql-database
- aptitude, booster, coding, interview, resume

`);

window.eliteAdmin = {
  // Enroll in all elite batches
  enrollInAllBatches() {
    const batches = [
      'c-programming', 'cpp', 'java', 'javascript', 'python',
      'dsa', 'web-development', 'react-js', 'node-js', 'sql-database',
      'aptitude', 'booster', 'coding', 'interview', 'resume-linkedin'
    ];
    localStorage.setItem('enrolledEliteBatches', JSON.stringify(batches));
    console.log('✅ Enrolled in all batches!');
    console.log('🔄 Refresh the page to see batches unlocked');
  },

  // Enroll in specific batch
  enrollInBatch(batchId) {
    let enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
    if (!enrolled.includes(batchId)) {
      enrolled.push(batchId);
      localStorage.setItem('enrolledEliteBatches', JSON.stringify(enrolled));
      console.log(`✅ Enrolled in: ${batchId}`);
    } else {
      console.log(`ℹ️ Already enrolled in: ${batchId}`);
    }
    console.log('🔄 Refresh the page to see changes');
  },

  // Check enrollment status
  checkEnrollment() {
    const enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
    console.log('📚 Enrolled Batches:');
    if (enrolled.length === 0) {
      console.log('   None - Run enrollInAllBatches() to enroll');
    } else {
      enrolled.forEach((batch, i) => console.log(`   ${i + 1}. ${batch}`));
    }
    console.log(`\n📊 Total: ${enrolled.length} batches`);
  },

  // Load sample data (requires Firebase)
  async loadSampleData() {
    try {
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = `
        import { initializeSampleData } from './elite-sample-data.js';
        window.loadSampleDataNow = initializeSampleData;
      `;
      document.body.appendChild(script);
      
      setTimeout(async () => {
        if (window.loadSampleDataNow) {
          await window.loadSampleDataNow();
          console.log('✅ Sample data loaded successfully!');
        }
      }, 1000);
    } catch (e) {
      console.error('❌ Error loading sample data:', e);
    }
  },

  // View database structure
  viewDatabaseStructure() {
    const structure = {
      'Database Path': 'elitePlus/{batchId}/sections/{sectionType}',
      'Section Types': ['videos', 'notes', 'dpp', 'live'],
      'Video Fields': [
        'title', 'description', 'url', 'thumbnail', 'duration',
        'instructor', 'views', 'likes', 'position', 'timestamp'
      ],
      'Note Fields': [
        'title', 'description', 'url', 'pages', 'downloads',
        'difficulty', 'position', 'timestamp'
      ],
      'DPP Fields': [
        'title', 'description', 'url', 'questions', 'attempts',
        'difficulty', 'solutions', 'position', 'timestamp'
      ],
      'Live Fields': [
        'title', 'description', 'zoomLink', 'recordingUrl', 'url',
        'status', 'schedule', 'duration', 'attendees', 'instructor',
        'timestamp'
      ]
    };
    console.table(structure);
  },

  // Reset enrollment
  resetEnrollment() {
    localStorage.removeItem('enrolledEliteBatches');
    console.log('✅ Enrollment reset');
    console.log('🔄 Refresh the page to see changes');
  },

  // Open batch page
  openBatch(batchId) {
    this.enrollInBatch(batchId);
    window.location.href = `/elite-batch-${batchId}.html`;
  },

  // Mark as admin (for sample data loading)
  setAdmin(isAdmin = true) {
    if (isAdmin) {
      localStorage.setItem('isAdmin', 'true');
      console.log('✅ Admin mode enabled');
    } else {
      localStorage.removeItem('isAdmin');
      console.log('✅ Admin mode disabled');
    }
  },

  // Quick stats
  showStats() {
    const enrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
    const stats = {
      'Enrolled Batches': enrolled.length,
      'Total Batches': 15,
      'Admin Mode': localStorage.getItem('isAdmin') === 'true' ? '✅ Enabled' : '❌ Disabled',
      'Last Access': new Date().toLocaleString()
    };
    console.table(stats);
  }
};

// Auto-print stats on every page load
window.eliteAdmin.showStats();
