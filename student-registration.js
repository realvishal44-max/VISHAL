// ============================================================
// STUDENT REGISTRATION SYSTEM - CLIENT SIDE ENGINE
// ============================================================

(function () {
  // Constants
  const STORAGE_KEY = 'student_registered';
  const DATA_KEY = 'student_data';
  const DEVICE_KEY = 'student_device_id';
  const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    // Inject Styles
    injectStyles();
    // Run Check
    initRegistrationFlow();
    // Process any pending enrollments if user is now registered
    processPendingEnrollments();
    // Setup Global Click Interceptor for index.html enrollment buttons
    setupClickInterceptors();
    // Setup specific page event listeners for activity tracking
    setupActivityTrackingHooks();
  });

  // Unique Device ID Generation & Fingerprinting
  window.generateDeviceFingerprint = function() {
    const nav = window.navigator;
    const scr = window.screen;
    let base = nav.userAgent.replace(/\D+/g, '');
    base += nav.language || '';
    base += scr.height || '';
    base += scr.width || '';
    base += scr.pixelDepth || '';
    
    // Canvas Fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillText("BCA Store Fingerprint 💎", 2, 2);
    const canvasHash = canvas.toDataURL().slice(-50, -10);
    
    const finalHash = 'DEV_' + btoa(base + canvasHash).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    return finalHash;
  };

  function getOrCreateDeviceId() {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = getCookie(DEVICE_KEY);
      if (deviceId) {
        localStorage.setItem(DEVICE_KEY, deviceId);
      } else {
        deviceId = generateDeviceFingerprint();
        localStorage.setItem(DEVICE_KEY, deviceId);
        setCookie(DEVICE_KEY, deviceId, 365);
      }
    }
    return deviceId;
  }

  // Cookie Helpers
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Load Flatpickr dynamically
  function loadFlatpickr(callback) {
    if (window.flatpickr) {
      callback();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/flatpickr';
    script.onload = callback;
    document.head.appendChild(script);
  }

  // Clear local session storage keys
  function clearSessionLocal() {
    localStorage.removeItem('userName');
    localStorage.removeItem('student_registered');
    localStorage.removeItem('student_data');
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_session_token');
    localStorage.removeItem('enrolledBatches');
    localStorage.removeItem('enrolledEliteBatches');
    
    document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "student_registered=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    sessionStorage.removeItem('welcomeShownThisSession');
  }

  // Secure session verification against Firebase Realtime Database
  async function verifyActiveSession() {
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    
    // Safety check: Never force logout while taking a test or marking attendance
    if (currentPage.includes('test.html') || currentPage.includes('attendance.html')) {
      return true;
    }

    const studentId = localStorage.getItem('student_id');
    const deviceId = getOrCreateDeviceId();
    const localToken = localStorage.getItem('student_session_token');

    if (!studentId || !deviceId || !localToken) {
      clearSessionLocal();
      return false;
    }

    // Cache session validation for 5 minutes in sessionStorage to avoid redundant queries during rapid transitions
    try {
      const lastVerify = sessionStorage.getItem('session_verified_ts');
      const now = Date.now();
      if (lastVerify && (now - parseInt(lastVerify)) < 300000) {
        return true;
      }
    } catch (e) {}

    if (typeof firebase === 'undefined' || !firebase.database) {
      // Wait for Firebase database wrapper to initialize (up to 3 seconds)
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 200));
        if (typeof firebase !== 'undefined' && firebase.database) break;
      }
      if (typeof firebase === 'undefined' || !firebase.database) {
        // Fallback to true if database is totally unreachable offline
        return true;
      }
    }

    try {
      const snap = await firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).once('value');
      if (!snap.exists()) {
        // Self-heal session mapping in DB instead of force logout if local credentials are present
        const studentDataStr = localStorage.getItem('student_data');
        if (studentDataStr) {
          const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
          await firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).set({
            sessionToken: localToken,
            lastLogin: Date.now(),
            deviceType: deviceType,
            userAgent: navigator.userAgent
          });
          sessionStorage.setItem('session_verified_ts', Date.now().toString());
          return true;
        }
        clearSessionLocal();
        return false;
      }

      const sessionData = snap.val();
      const dbToken = typeof sessionData === 'object' ? sessionData.sessionToken : sessionData;
      
      if (dbToken !== localToken) {
        clearSessionLocal();
        alert("Session expired or logged in on another device. Please sign in again.");
        return false;
      }

      // Session is valid, update timestamps
      firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).update({
        lastActive: Date.now()
      });
      
      sessionStorage.setItem('session_verified_ts', Date.now().toString());
      return true;
    } catch (e) {
      console.warn("Active session verification bypassed due to network issue:", e);
      return true;
    }
  }

  // Expose functions globally
  window.verifyActiveSession = verifyActiveSession;
  window.clearSessionLocal = clearSessionLocal;

  // Main Flow Director
  async function initRegistrationFlow() {
    const isRegisteredLocal = localStorage.getItem(STORAGE_KEY) === 'true';
    const currentPage = window.location.pathname.split('/').pop().toLowerCase();
    const blockedPages = [
      'semester.html', 
      'subject.html', 
      'my-batches.html', 
      'elite-batches.html',
      'elite-programming.html',
      'elite-placement.html',
      'community.html',
      'my-account.html',
      'test-hub.html',
      'test.html'
    ];

    const shouldBlock = blockedPages.some(page => currentPage.includes(page));

    if (isRegisteredLocal) {
      const isValid = await verifyActiveSession();
      if (isValid) {
        syncLastActive();
        return;
      } else {
        if (shouldBlock) {
          showRegistrationModal(true, 'login'); // Block screen with login view
        } else {
          showRegistrationModal(false, 'login');
        }
        return;
      }
    }

    if (shouldBlock) {
      showRegistrationModal(true); // Full-screen compulsory block
    } else {
      // For elite-plus.html, show registration popup immediately but as a non-blocker (closable)
      if (currentPage.includes('elite-plus.html')) {
        showRegistrationModal(false, 'register');
      } else {
        // Auto-trigger registration form after 10 seconds on other non-blocked pages (like index.html)
        setTimeout(() => {
          const stillNotRegistered = localStorage.getItem(STORAGE_KEY) !== 'true';
          if (stillNotRegistered && !document.getElementById('studentRegOverlay')) {
            showRegistrationModal(false, 'register');
          }
        }, 10000);
      }
    }
  }

  // Sync session and active state
  function syncLastActive() {
    const studentId = localStorage.getItem('student_id');
    if (!studentId || typeof firebase === 'undefined' || !firebase.database) return;
    
    const dbRef = firebase.database().ref(`students/${studentId}`);
    
    // Track session visits
    let sessionCounted = sessionStorage.getItem('session_active_counted');
    const updates = {
      lastActive: Date.now()
    };
    
    if (!sessionCounted) {
      dbRef.once('value').then(snap => {
        if (snap.exists()) {
          const currentData = snap.val();
          updates.totalSessions = (currentData.totalSessions || 0) + 1;
          updates.totalVisits = (currentData.totalVisits || 0) + 1;
          updates.lastLogin = Date.now();
          dbRef.update(updates);
          sessionStorage.setItem('session_active_counted', 'true');
          
          // Log app opened activity
          logStudentActivity(studentId, 'App Opened', {
            url: window.location.href,
            userAgent: navigator.userAgent
          });
        }
      });
    } else {
      dbRef.update(updates);
    }
  }

  // Intercept standard index.html clicks
  function setupClickInterceptors() {
    document.addEventListener('click', (e) => {
      const isRegistered = localStorage.getItem(STORAGE_KEY) === 'true';
      if (isRegistered) return;

      // Detect button clicks that attempt to study or enroll
      const target = e.target.closest('button, a');
      if (!target) return;

      const clickText = (target.textContent || '').toLowerCase();
      const href = (target.getAttribute('href') || '').toLowerCase();
      const isEnrollBtn = clickText.includes('enroll') || clickText.includes("let's study") || clickText.includes('study 🚀') || clickText.includes('access lectures');
      const isBatchLink = href.includes('semester.html') || href.includes('elite-plus.html') || href.includes('elite-batches.html') || target.closest('.batch-card') || target.closest('.tf-item');

      if (isEnrollBtn || isBatchLink) {
        // Prevent default navigation
        e.preventDefault();
        e.stopPropagation();
        
        // Trigger registration popup modal
        showRegistrationModal(false);
      }
    });
  }

  // Hook into study actions (downloads, video plays, etc.)
  function setupActivityTrackingHooks() {
    // Intercept clicks on notes/DPPs downloads
    document.addEventListener('click', (e) => {
      const studentId = localStorage.getItem('student_id');
      if (!studentId) return;

      const anchor = e.target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      const text = (anchor.textContent || '').toLowerCase();

      if (href.includes('drive.google.com') || href.includes('.pdf')) {
        const isNotes = text.includes('download') || href.includes('notes');
        const isDPP = text.includes('attempt') || href.includes('dpp');
        const eventType = isNotes ? 'Notes Downloaded' : (isDPP ? 'PDF Opened' : 'PDF Opened');

        logStudentActivity(studentId, eventType, {
          title: anchor.getAttribute('title') || anchor.textContent.trim(),
          url: href
        });
      }
    });

    // Hook into Elite Video Player modal opens
    // Overriding openVideoPlayer globally
    const checkInterval = setInterval(() => {
      const studentId = localStorage.getItem('student_id');
      if (!studentId) return;

      // Hook elitePageManager video launch
      if (window.elitePageManager && !window.elitePageManager._hooked) {
        const originalOpenVideoPlayer = window.elitePageManager.openVideoPlayer;
        window.elitePageManager.openVideoPlayer = function(videoId) {
          const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
          logStudentActivity(studentId, 'Video Watched', {
            videoId: videoId,
            title: video ? video.title : 'Premium Video',
            batchId: this.batchId
          });
          originalOpenVideoPlayer.call(window.elitePageManager, videoId);
        };
        window.elitePageManager._hooked = true;
      }

      // Hook batchPageManager video launch
      if (window.batchPageManager && !window.batchPageManager._hooked) {
        const originalOpenVideoPlayer = window.batchPageManager.openVideoPlayer;
        window.batchPageManager.openVideoPlayer = function(videoId) {
          const video = this.videosList ? this.videosList.find(v => v.id === videoId) : null;
          logStudentActivity(studentId, 'Video Watched', {
            videoId: videoId,
            title: video ? video.title : 'Standard Video',
            batchId: this.batchId
          });
          originalOpenVideoPlayer.call(window.batchPageManager, videoId);
        };
        window.batchPageManager._hooked = true;
      }
    }, 1000);
  }

  // Logs student activities to Firebase Realtime Database
  function logStudentActivity(studentId, eventType, eventData = {}) {
    if (typeof firebase === 'undefined' || !firebase.database) return;
    
    const activityRef = firebase.database().ref(`students/${studentId}/activityLogs`).push();
    activityRef.set({
      event: eventType,
      timestamp: Date.now(),
      ...eventData
    });

    // Update lastActive timestamp on root
    firebase.database().ref(`students/${studentId}`).update({
      lastActive: Date.now()
    });
  }

  // Create & Inject Form Modal UI
  function showRegistrationModal(isFullBlocker = false, initialTab = 'register', preselectedSemester = '') {
    // If modal already exists, don't create duplicate
    if (document.getElementById('studentRegOverlay')) {
      // Just switch to the correct tab if it's already there
      if (window.switchRegTab) window.switchRegTab(initialTab);
      // Preselect semester if dynamic switch
      if (preselectedSemester) {
        const semSelect = document.getElementById('regSemester');
        if (semSelect) {
          semSelect.value = preselectedSemester;
          const event = new Event('change');
          semSelect.dispatchEvent(event);
        }
      }
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'studentRegOverlay';
    overlay.className = 'reg-overlay';
    if (isFullBlocker) {
      overlay.classList.add('reg-blocker');
    }

    const closeAction = isFullBlocker 
      ? "window.location.href='index.html';" 
      : "const o = document.getElementById('studentRegOverlay'); if (o) { o.remove(); document.body.classList.remove('reg-gate-active'); }";

    overlay.innerHTML = `
      <div class="reg-card glass-card animate-scale-up">
        <!-- Close Button -->
        <button class="reg-close-btn" onclick="${closeAction}" title="${isFullBlocker ? 'Back to Home' : 'Close'}">✕</button>

        <!-- Left Side: PC Premium Branding -->
        <div class="reg-card-left">
          <div class="reg-glow reg-glow-1"></div>
          <div class="reg-glow reg-glow-2"></div>
          <div class="reg-grid-bg"></div>
          <div class="reg-brand-content">
            <div class="brand-logo">🎓</div>
            <h2>BCA Store <br/>Premium</h2>
            <p>Your Ultimate Academic Companion. Join thousands of top students achieving excellence today.</p>
            <ul class="brand-features">
              <li><span>✨</span> Premium Notes & PYQs</li>
              <li><span>🎯</span> Elite Video Lectures</li>
              <li><span>🚀</span> Career Placement Support</li>
            </ul>
          </div>
        </div>

        <!-- Right Side: Forms -->
        <div class="reg-card-right">
          <div class="reg-tabs" id="regTabsHeader">
            <button class="reg-tab-btn active" id="tabBtnRegister" onclick="window.switchRegTab('register')">📝 Register</button>
            <button class="reg-tab-btn" id="tabBtnLogin" onclick="window.switchRegTab('login')">🔑 Login</button>
          </div>

          <!-- ==================== REGISTRATION VIEW ==================== -->
          <div class="reg-view-container" id="viewRegister">
            <div class="reg-header">
              <div class="reg-icon-wrapper">
                <span class="reg-icon-gem">💎</span>
                <div class="reg-icon-ring"></div>
              </div>
              <h2>Student Portal Registration</h2>
              <p>Complete compulsory registration to unlock study resources 🚀</p>
              <div class="reg-progress-track">
                <div class="reg-progress-fill" id="regProgressFill"></div>
              </div>
            </div>

            <div class="reg-body">
              <form id="studentRegistrationForm" onsubmit="return false;">
                <!-- Full Name -->
                <div class="reg-form-group">
                  <label for="regName">Full Name *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">👤</span>
                    <input type="text" id="regName" placeholder="Enter your full name..." autocomplete="off">
                  </div>
                  <span class="reg-err" id="regNameErr">Name must be at least 3 characters.</span>
                </div>

                <!-- Email Address -->
                <div class="reg-form-group">
                  <label for="regEmail">Email Address (Optional)</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">📧</span>
                    <input type="email" id="regEmail" placeholder="Enter your email address..." autocomplete="off">
                  </div>
                  <span class="reg-err" id="regEmailErr">Please enter a valid email address.</span>
                </div>

                <!-- Phone Number -->
                <div class="reg-form-group">
                  <label for="regPhone">Phone Number (WhatsApp) *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">📞</span>
                    <input type="tel" id="regPhone" placeholder="Enter 10-digit number..." maxlength="10" autocomplete="off">
                  </div>
                  <span class="reg-err" id="regPhoneErr">Phone number must be exactly 10 digits.</span>
                </div>

                <!-- Date of Birth -->
                <div class="reg-form-group">
                  <label for="regDOB">Date of Birth *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">📅</span>
                    <input type="text" id="regDOB" placeholder="YYYY-MM-DD" autocomplete="off">
                  </div>
                  <span class="reg-err" id="regDOBErr">Date of birth is required.</span>
                </div>

                <!-- Password -->
                <div class="reg-form-group">
                  <label for="regPassword">Password * (Min 6 Characters)</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">🔒</span>
                    <input type="password" id="regPassword" placeholder="Create a login password..." autocomplete="off">
                    <button type="button" class="reg-eye-btn" onclick="window.togglePasswordVisibility('regPassword', this)">👁️</button>
                  </div>
                  <span class="reg-err" id="regPasswordErr">Password must be at least 6 characters.</span>
                </div>

                <!-- Confirm Password -->
                <div class="reg-form-group">
                  <label for="regConfirmPassword">Confirm Password *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">🛡️</span>
                    <input type="password" id="regConfirmPassword" placeholder="Confirm your password..." autocomplete="off">
                    <button type="button" class="reg-eye-btn" onclick="window.togglePasswordVisibility('regConfirmPassword', this)">👁️</button>
                  </div>
                  <span class="reg-err" id="regConfirmPasswordErr">Passwords do not match.</span>
                </div>

                <div class="reg-form-row">
                  <!-- Semester Selection -->
                  <div class="reg-form-group">
                    <label for="regSemester">Semester *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">📖</span>
                      <select id="regSemester">
                        <option value="">Select Semester</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                      </select>
                    </div>
                  </div>

                  <!-- College Selection -->
                  <div class="reg-form-group">
                    <label for="regCollege">College *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">🏢</span>
                      <select id="regCollege">
                        <option value="">Select College</option>
                        <option value="LND COLLEGE">LND COLLEGE</option>
                        <option value="MS COLLEGE">MS COLLEGE</option>
                        <option value="SNS COLLEGE">SNS COLLEGE</option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Profile Photo Picker -->
                <div class="reg-form-group">
                  <label>Profile Photo * (Compulsory, Max 500KB)</label>
                  <div style="display: flex; gap: 12px; align-items: center; margin-top: 5px;">
                    <input type="file" id="regPhoto" accept="image/png, image/jpeg, image/jpg" style="display:none;">
                    <button type="button" class="reg-photo-btn" onclick="document.getElementById('regPhoto').click()" style="padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px; color: #fff; cursor: pointer; font-weight: 700; transition: all 0.3s ease;">
                      📷 Choose Image
                    </button>
                    <div id="regPhotoPreviewWrap" style="display:none; position: relative;">
                      <img id="regPhotoPreview" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid #a78bfa;" />
                      <button type="button" id="regPhotoRemoveBtn" style="position: absolute; top: -5px; right: -5px; width: 18px; height: 18px; border-radius: 50%; background: #ef4444; border: none; color: #fff; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">✕</button>
                    </div>
                  </div>
                  <span class="reg-err" id="regPhotoErr">Profile photo is required.</span>
                </div>

                <button type="submit" id="regSubmitBtn" class="reg-btn" disabled>
                  <span class="btn-text">Submit Registration ⚡</span>
                  <div class="reg-btn-loader" id="regSubmitLoader"></div>
                </button>
              </form>
            </div>
          </div>

          <!-- ==================== LOGIN VIEW ==================== -->
          <div class="reg-view-container" id="viewLogin" style="display:none;">
            <div class="reg-header">
              <div class="reg-icon-wrapper">
                <span class="reg-icon-gem">🔑</span>
                <div class="reg-icon-ring"></div>
              </div>
              <h2>Student Portal Login</h2>
              <p>Access your profile on this device using Phone Number or Email and Password</p>
            </div>

            <div class="reg-body">
              <form id="studentLoginForm" onsubmit="return false;">
                <!-- Phone Number or Email -->
                <div class="reg-form-group">
                  <label for="loginPhone">Phone Number or Email *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">👤</span>
                    <input type="text" id="loginPhone" placeholder="Enter phone number or email..." autocomplete="off">
                  </div>
                </div>

                <!-- Password -->
                <div class="reg-form-group">
                  <label for="loginPassword">Password *</label>
                  <div class="reg-input-wrap">
                    <span class="reg-input-icon">🔒</span>
                    <input type="password" id="loginPassword" placeholder="Enter your password..." autocomplete="off">
                    <button type="button" class="reg-eye-btn" onclick="window.togglePasswordVisibility('loginPassword', this)">👁️</button>
                  </div>
                </div>

                <div style="text-align: right; margin-bottom: 20px;">
                  <a href="javascript:void(0)" onclick="window.switchRegTab('recovery')" class="forgot-pass-link">Forgot Password?</a>
                </div>

                <button type="button" id="loginSubmitBtn" class="reg-btn" disabled>
                  <span class="btn-text">Sign In ⚡</span>
                  <div class="reg-btn-loader" id="loginSubmitLoader"></div>
                </button>
              </form>
            </div>
          </div>

          <!-- ==================== RECOVERY VIEW ==================== -->
          <div class="reg-view-container" id="viewRecovery" style="display:none;">
            <div class="reg-header">
              <div class="reg-icon-wrapper">
                <span class="reg-icon-gem">🔄</span>
                <div class="reg-icon-ring"></div>
              </div>
              <h2>Reset Password</h2>
              <p id="recoveryDesc">Verify your registered details to set a new password</p>
            </div>

            <div class="reg-body">
              <form id="studentRecoveryForm" onsubmit="return false;">
                <!-- Step 1 fields: Verification -->
                <div id="recoveryStepVerify">
                  <!-- Phone Number or Email -->
                  <div class="reg-form-group">
                    <label for="recoveryIdentifier">Phone Number or Email *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">📞</span>
                      <input type="text" id="recoveryIdentifier" placeholder="Enter phone or email..." autocomplete="off">
                    </div>
                  </div>

                  <!-- Full Name -->
                  <div class="reg-form-group">
                    <label for="recoveryName">Full Name *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">👤</span>
                      <input type="text" id="recoveryName" placeholder="Enter matching full name..." autocomplete="off">
                    </div>
                  </div>

                  <!-- Date of Birth -->
                  <div class="reg-form-group">
                    <label for="recoveryDOB">Date of Birth *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">📅</span>
                      <input type="text" id="recoveryDOB" placeholder="YYYY-MM-DD" autocomplete="off">
                    </div>
                  </div>

                  <button type="button" id="recoveryVerifyBtn" class="reg-btn">
                    <span class="btn-text">Verify Details ⚡</span>
                    <div class="reg-btn-loader" id="recoveryVerifyLoader"></div>
                  </button>
                </div>

                <!-- Step 2 fields: Reset (Initially Hidden) -->
                <div id="recoveryStepReset" style="display:none;">
                  <!-- New Password -->
                  <div class="reg-form-group">
                    <label for="recoveryNewPassword">New Password * (Min 6 Characters)</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">🔒</span>
                      <input type="password" id="recoveryNewPassword" placeholder="Create new password..." autocomplete="off">
                      <button type="button" class="reg-eye-btn" onclick="window.togglePasswordVisibility('recoveryNewPassword', this)">👁️</button>
                    </div>
                  </div>

                  <!-- Confirm New Password -->
                  <div class="reg-form-group">
                    <label for="recoveryConfirmPassword">Confirm New Password *</label>
                    <div class="reg-input-wrap">
                      <span class="reg-input-icon">🛡️</span>
                      <input type="password" id="recoveryConfirmPassword" placeholder="Confirm new password..." autocomplete="off">
                      <button type="button" class="reg-eye-btn" onclick="window.togglePasswordVisibility('recoveryConfirmPassword', this)">👁️</button>
                    </div>
                  </div>

                  <button type="button" id="recoveryResetBtn" class="reg-btn">
                    <span class="btn-text">Update Password 🔑</span>
                    <div class="reg-btn-loader" id="recoveryResetLoader"></div>
                  </button>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                  <a href="javascript:void(0)" onclick="window.switchRegTab('login')" class="forgot-pass-link">← Back to Login</a>
                </div>
              </form>
            </div>
          </div>

          <div class="reg-footer">
            <p>🔒 Lifetime Device Activation Mapped via Secure Fingerprint</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('reg-gate-active');

    // Switch to initial tab
    window.switchRegTab(initialTab);

    // Bind validations
    setupFormValidations(preselectedSemester);
  }

  // Window utilities for tabs & password toggles
  window.switchRegTab = function (tab) {
    const viewRegister = document.getElementById('viewRegister');
    const viewLogin = document.getElementById('viewLogin');
    const viewRecovery = document.getElementById('viewRecovery');
    const tabRegister = document.getElementById('tabBtnRegister');
    const tabLogin = document.getElementById('tabBtnLogin');
    const regTabsHeader = document.getElementById('regTabsHeader');

    if (!viewRegister || !viewLogin || !viewRecovery) return;

    // Reset views
    viewRegister.style.display = 'none';
    viewLogin.style.display = 'none';
    viewRecovery.style.display = 'none';

    if (tabRegister) tabRegister.classList.remove('active');
    if (tabLogin) tabLogin.classList.remove('active');
    if (regTabsHeader) regTabsHeader.style.display = 'flex';

    if (tab === 'register') {
      viewRegister.style.display = 'block';
      if (tabRegister) tabRegister.classList.add('active');
    } else if (tab === 'login') {
      viewLogin.style.display = 'block';
      if (tabLogin) tabLogin.classList.add('active');
    } else if (tab === 'recovery') {
      viewRecovery.style.display = 'block';
      if (regTabsHeader) regTabsHeader.style.display = 'none';
    }
  };

  window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🔒';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  };

  window.showRegistrationModal = showRegistrationModal;
  window.triggerStudentLoginPopup = function () {
    showRegistrationModal(false, 'login');
  };

  function setupFormValidations(preselectedSemester = '') {
    function setFormInputsDisabled(formId, disabled) {
      const container = document.getElementById(formId);
      if (!container) return;
      const inputs = container.querySelectorAll('input, select, button:not(.reg-eye-btn)');
      inputs.forEach(el => {
        if (disabled) {
          el.setAttribute('disabled', 'true');
          el.style.opacity = '0.6';
          el.style.cursor = 'not-allowed';
        } else {
          el.removeAttribute('disabled');
          el.style.opacity = '';
          el.style.cursor = '';
        }
      });
    }

    const nameInput = document.getElementById('regName');
    const emailInput = document.getElementById('regEmail');
    const phoneInput = document.getElementById('regPhone');
    const dobInput = document.getElementById('regDOB');
    const passInput = document.getElementById('regPassword');
    const confirmPassInput = document.getElementById('regConfirmPassword');
    const semSelect = document.getElementById('regSemester');
    const collSelect = document.getElementById('regCollege');
    const submitBtn = document.getElementById('regSubmitBtn');
    const progressBar = document.getElementById('regProgressFill');

    const errName = document.getElementById('regNameErr');
    const errEmail = document.getElementById('regEmailErr');
    const errPhone = document.getElementById('regPhoneErr');
    const errDOB = document.getElementById('regDOBErr');
    const errPass = document.getElementById('regPasswordErr');
    const errConfirmPass = document.getElementById('regConfirmPasswordErr');
    const errPhoto = document.getElementById('regPhotoErr');

    const validity = {
      name: false,
      email: true, // Default to true because it is optional
      phone: false,
      dob: false,
      password: false,
      confirmPassword: false,
      semester: false,
      college: false,
      photo: false
    };

    if (preselectedSemester && semSelect) {
      semSelect.value = preselectedSemester;
      validity.semester = true;
      semSelect.closest('.reg-input-wrap').style.borderColor = '#10b981';
      updateFormState();
    }

    function validateName() {
      const val = nameInput.value.trim();
      validity.name = val.length >= 3;
      if (val.length > 0 && !validity.name) {
        errName.classList.add('visible');
        nameInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
      } else {
        errName.classList.remove('visible');
        nameInput.closest('.reg-input-wrap').style.borderColor = validity.name ? '#10b981' : '';
      }
      updateFormState();
    }

    let emailDebounce = null;
    function validateEmail() {
      const email = emailInput.value.trim();
      if (email === '') {
        validity.email = true;
        errEmail.classList.remove('visible');
        emailInput.closest('.reg-input-wrap').style.borderColor = '';
        updateFormState();
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidFormat = emailRegex.test(email);
      validity.email = isValidFormat;

      if (!isValidFormat) {
        errEmail.textContent = "Please enter a valid email address.";
        errEmail.classList.add('visible');
        emailInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
        updateFormState();
        return;
      }

      errEmail.classList.remove('visible');
      emailInput.closest('.reg-input-wrap').style.borderColor = '';

      clearTimeout(emailDebounce);
      emailDebounce = setTimeout(() => {
        if (typeof firebase === 'undefined' || !firebase.database) return;
        firebase.database().ref('students').orderByChild('email').equalTo(email).once('value')
          .then(snapshot => {
            if (snapshot.exists()) {
              validity.email = false;
              errEmail.textContent = "Account with this email already exists.";
              errEmail.classList.add('visible');
              emailInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
            } else {
              validity.email = true;
              errEmail.classList.remove('visible');
              emailInput.closest('.reg-input-wrap').style.borderColor = '#10b981';
            }
            updateFormState();
          });
      }, 400);
    }

    let phoneDebounce = null;
    function validatePhone() {
      const phone = phoneInput.value.trim();
      const cleanVal = phone.replace(/\D/g, '');
      phoneInput.value = cleanVal;

      const isValidFormat = cleanVal.length === 10;
      validity.phone = isValidFormat;

      if (cleanVal.length > 0 && !isValidFormat) {
        errPhone.textContent = "Phone number must be exactly 10 digits.";
        errPhone.classList.add('visible');
        phoneInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
        updateFormState();
        return;
      }

      errPhone.classList.remove('visible');
      phoneInput.closest('.reg-input-wrap').style.borderColor = '';

      if (isValidFormat) {
        clearTimeout(phoneDebounce);
        phoneDebounce = setTimeout(() => {
          if (typeof firebase === 'undefined' || !firebase.database) return;
          firebase.database().ref('students').orderByChild('phone').equalTo(cleanVal).once('value')
            .then(snapshot => {
              if (snapshot.exists()) {
                validity.phone = false;
                errPhone.textContent = "Account with this phone number already exists.";
                errPhone.classList.add('visible');
                phoneInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
              } else {
                validity.phone = true;
                errPhone.classList.remove('visible');
                phoneInput.closest('.reg-input-wrap').style.borderColor = '#10b981';
              }
              updateFormState();
            });
        }, 400);
      } else {
        updateFormState();
      }
    }

    function validateDOB() {
      const val = dobInput.value.trim();
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      let isValid = false;
      if (datePattern.test(val)) {
        const parts = val.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          if (date <= new Date()) {
            isValid = true;
          }
        }
      }
      validity.dob = isValid;
      if (!isValid) {
        errDOB.textContent = val === '' ? 'Date of birth is required.' : 'Enter a valid date in YYYY-MM-DD format.';
        errDOB.classList.add('visible');
        dobInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
      } else {
        errDOB.classList.remove('visible');
        dobInput.closest('.reg-input-wrap').style.borderColor = '#10b981';
      }
      updateFormState();
    }

    function validatePassword() {
      const val = passInput.value;
      validity.password = val.length >= 6;
      if (val.length > 0 && !validity.password) {
        errPass.classList.add('visible');
        passInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
      } else {
        errPass.classList.remove('visible');
        passInput.closest('.reg-input-wrap').style.borderColor = validity.password ? '#10b981' : '';
      }
      validateConfirmPassword();
      updateFormState();
    }

    function validateConfirmPassword() {
      const passVal = passInput.value;
      const confirmVal = confirmPassInput.value;
      validity.confirmPassword = confirmVal === passVal && confirmVal.length >= 6;

      if (confirmVal.length > 0 && !validity.confirmPassword) {
        errConfirmPass.classList.add('visible');
        confirmPassInput.closest('.reg-input-wrap').style.borderColor = '#ef4444';
      } else {
        errConfirmPass.classList.remove('visible');
        confirmPassInput.closest('.reg-input-wrap').style.borderColor = validity.confirmPassword ? '#10b981' : '';
      }
      updateFormState();
    }

    function validateSelects() {
      validity.semester = semSelect.value !== '';
      semSelect.closest('.reg-input-wrap').style.borderColor = validity.semester ? '#10b981' : '';

      validity.college = collSelect.value !== '';
      collSelect.closest('.reg-input-wrap').style.borderColor = validity.college ? '#10b981' : '';

      updateFormState();
    }

    // Photo selection / compression handler
    let selectedPhotoBase64 = '';
    const photoInput = document.getElementById('regPhoto');
    const photoPreviewWrap = document.getElementById('regPhotoPreviewWrap');
    const photoPreview = document.getElementById('regPhotoPreview');
    const photoRemoveBtn = document.getElementById('regPhotoRemoveBtn');

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
          alert('Invalid image format. Select WebP, JPG, or PNG.');
          photoInput.value = '';
          return;
        }

        if (file.size > 1 * 1024 * 1024) {
          alert('Image size must be 1 MB or less.');
          photoInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
          const img = new Image();
          img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 150;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');
            
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 150, 150);
            
            selectedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.8);
            
            if (photoPreview) photoPreview.src = selectedPhotoBase64;
            if (photoPreviewWrap) photoPreviewWrap.style.display = 'block';
            if (errPhoto) errPhoto.classList.remove('visible');
            validity.photo = true;
            updateFormState();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (photoRemoveBtn) {
      photoRemoveBtn.addEventListener('click', () => {
        selectedPhotoBase64 = '';
        if (photoInput) photoInput.value = '';
        if (photoPreviewWrap) photoPreviewWrap.style.display = 'none';
        validity.photo = false;
        updateFormState();
      });
    }

    function updateFormState() {
      const fields = [
        validity.name, validity.email, 
        validity.phone, validity.dob, validity.password, 
        validity.confirmPassword, validity.semester, 
        validity.college, validity.photo
      ];
      const countValid = fields.filter(Boolean).length;
      const pct = (countValid / fields.length) * 100;
      if (progressBar) progressBar.style.width = pct + '%';

      const isValid = countValid === fields.length;
      submitBtn.disabled = !isValid;
    }

    if (nameInput) nameInput.addEventListener('input', validateName);
    if (emailInput) emailInput.addEventListener('input', validateEmail);
    if (phoneInput) phoneInput.addEventListener('input', validatePhone);

    // Hybrid Mobile Native / Desktop Flatpickr Setup
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      if (dobInput) {
        const dobIcon = dobInput.previousElementSibling; // The 📅 span
        if (dobIcon) {
          dobIcon.style.cursor = 'pointer';
          
          // Inject hidden native picker if it doesn't exist yet
          let dobNative = document.getElementById('regDOBNative');
          if (!dobNative) {
            dobNative = document.createElement('input');
            dobNative.type = 'date';
            dobNative.id = 'regDOBNative';
            dobNative.style.cssText = 'position: absolute; opacity: 0; width: 0; height: 0; border: none; padding: 0; margin: 0; pointer-events: none;';
            dobNative.max = new Date().toISOString().split('T')[0];
            dobInput.parentNode.appendChild(dobNative);
          }
          
          dobIcon.addEventListener('click', () => {
            if (typeof dobNative.showPicker === 'function') {
              dobNative.showPicker();
            } else {
              dobNative.click();
            }
          });
          
          dobNative.addEventListener('change', () => {
            dobInput.value = dobNative.value;
            validateDOB();
          });
        }
      }
    } else {
      // Bind Flatpickr date picker dynamically for desktop
      loadFlatpickr(() => {
        if (window.flatpickr) {
          window.flatpickr("#regDOB", {
            dateFormat: "Y-m-d",
            maxDate: "today",
            theme: "dark",
            allowInput: true,
            disableMobile: true,
            onChange: function(selectedDates, dateStr) {
              validity.dob = dateStr !== '';
              if (dobInput) {
                dobInput.value = dateStr;
              }
              validateDOB();
            },
            onClose: function(selectedDates, dateStr) {
              validateDOB();
            }
          });
        }
      });
    }

    if (dobInput) {
      // Auto-format typing to YYYY-MM-DD
      dobInput.addEventListener('input', (e) => {
        if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') {
          validateDOB();
          return;
        }
        let val = dobInput.value.replace(/\D/g, '');
        let formatted = '';
        if (val.length > 0) {
          formatted += val.substring(0, 4);
        }
        if (val.length > 4) {
          formatted += '-' + val.substring(4, 6);
        }
        if (val.length > 6) {
          formatted += '-' + val.substring(6, 8);
        }
        dobInput.value = formatted;
        validateDOB();
      });
      dobInput.addEventListener('change', validateDOB);
      dobInput.addEventListener('blur', validateDOB);
    }
    if (passInput) passInput.addEventListener('input', validatePassword);
    if (confirmPassInput) confirmPassInput.addEventListener('input', validateConfirmPassword);
    if (semSelect) semSelect.addEventListener('change', validateSelects);
    if (collSelect) collSelect.addEventListener('change', validateSelects);

    // Form Registration Submit Action
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        if (submitBtn.disabled) return;
        if (navigator.vibrate) navigator.vibrate(30);

        submitBtn.classList.add('loading');
        const loader = document.getElementById('regSubmitLoader');
        if (loader) loader.style.display = 'block';
        setFormInputsDisabled('studentRegistrationForm', true);

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passInput.value;
        const dob = dobInput.value;
        const sem = semSelect.value;
        const coll = collSelect.value;
        const deviceId = getOrCreateDeviceId();
        const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const sessionToken = 'SESS_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

        try {
          if (typeof firebase === 'undefined' || !firebase.database) {
            throw new Error("Cloud database not loaded");
          }

          // Check unique constraints once more in parallel (skip empty email lookup)
          const eCheck = email ? firebase.database().ref('students').orderByChild('email').equalTo(email).once('value') : Promise.resolve(null);
          const pCheck = firebase.database().ref('students').orderByChild('phone').equalTo(phone).once('value');

          const [eSnap, pSnap] = await Promise.all([eCheck, pCheck]);

          if (eSnap && eSnap.exists()) throw new Error("Account with this email already exists");
          if (pSnap.exists()) throw new Error("Account with this phone number already exists");

          const studentId = 'STU_' + Date.now();
          const studentRecord = {
            name: name,
            email: email,
            phone: phone,
            password: password,
            dob: dob,
            photo: selectedPhotoBase64,
            semester: sem,
            college: coll,
            deviceId: deviceId,
            registeredAt: Date.now(),
            lastActive: Date.now(),
            lastLogin: Date.now(),
            totalSessions: 1,
            totalVisits: 1,
            isElitePlusUser: window.location.pathname.includes('elite') || false,
            deviceType: deviceType,
            appVersion: '2.2.0',
            batchesEnrolled: [sem]
          };

          // Write records
          await firebase.database().ref(`students/${studentId}`).set(studentRecord);

          // Write session mapping
          await firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).set({
            sessionToken: sessionToken,
            lastLogin: Date.now(),
            deviceType: deviceType,
            userAgent: navigator.userAgent
          });

          // Update totalEnrolled stat
          firebase.database().ref('site_stats/totalEnrolled').transaction(curr => (curr || 0) + 1);

          // Save local keys
          localStorage.setItem(STORAGE_KEY, 'true');
          localStorage.setItem(DATA_KEY, JSON.stringify(studentRecord));
          localStorage.setItem('student_id', studentId);
          localStorage.setItem('student_session_token', sessionToken);
          localStorage.setItem('userName', name);
          
          setCookie(STORAGE_KEY, 'true', 365);
          setCookie('userName', name, 365);
          sessionStorage.setItem('welcomeShownThisSession', 'true');

          // Auto enroll logic
          let enrolled = [];
          try {
            enrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
          } catch(e) {}
          if (!enrolled.includes(sem)) {
            enrolled.push(sem);
            localStorage.setItem('enrolledBatches', JSON.stringify(enrolled));
          }

          logStudentActivity(studentId, 'Registration Complete', {
            college: coll,
            semester: sem
          });

          if (navigator.vibrate) navigator.vibrate([40, 40, 100]);

          const card = document.querySelector('.reg-card');
          card.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div class="success-checkmark">
                <div class="check-icon">
                  <span class="icon-line line-tip"></span>
                  <span class="icon-line line-long"></span>
                  <div class="icon-circle"></div>
                  <div class="icon-fix"></div>
                </div>
              </div>
              <h2 style="margin-top:24px; color:#10b981; font-weight:800; font-size:1.6rem;">Registration Successful!</h2>
              <p style="color:var(--text-secondary); margin-top:8px;">Welcome ${name} to BCA STORE workspace.</p>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:24px;">Unlocking study resources...</p>
            </div>
          `;

          setTimeout(() => {
            const overlay = document.getElementById('studentRegOverlay');
            if (overlay) {
              overlay.classList.add('reg-fade-out');
              setTimeout(() => {
                overlay.remove();
                document.body.classList.remove('reg-gate-active');
                window.location.reload();
              }, 500);
            }
          }, 2000);

        } catch (err) {
          console.error("Submission failed:", err);
          submitBtn.classList.remove('loading');
          if (loader) loader.style.display = 'none';
          setFormInputsDisabled('studentRegistrationForm', false);
          
          const card = document.querySelector('.reg-card');
          if (card) {
            card.classList.add('shake-card');
            setTimeout(() => card.classList.remove('shake-card'), 500);
          }

          alert(err.message || "Registration failed");
        }
      });
    }

    // === LOGIN VALIDATION & SUBMISSION ===
    const loginPhone = document.getElementById('loginPhone');
    const loginPass = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginSubmitBtn');
    const loginLoader = document.getElementById('loginSubmitLoader');

    function validateLoginForm() {
      if (!loginPhone || !loginPass) return;
      const userVal = loginPhone.value.trim();
      const passVal = loginPass.value.trim();
      if (loginBtn) {
        loginBtn.disabled = !(userVal.length >= 3 && passVal.length >= 1);
      }
    }

    if (loginPhone) loginPhone.addEventListener('input', validateLoginForm);
    if (loginPass) loginPass.addEventListener('input', validateLoginForm);

    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        if (loginBtn.disabled) return;
        if (navigator.vibrate) navigator.vibrate(30);

        loginBtn.classList.add('loading');
        if (loginLoader) loginLoader.style.display = 'block';
        setFormInputsDisabled('studentLoginForm', true);

        const identifier = loginPhone.value.trim();
        const password = loginPass.value.trim();
        const deviceId = getOrCreateDeviceId();
        const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const sessionToken = 'SESS_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

        try {
          if (typeof firebase === 'undefined' || !firebase.database) {
            throw new Error("Cloud database offline");
          }

          let snapshot;
          if (identifier.includes('@')) {
            snapshot = await firebase.database().ref('students').orderByChild('email').equalTo(identifier).once('value');
          } else if (/^\d{10}$/.test(identifier)) {
            snapshot = await firebase.database().ref('students').orderByChild('phone').equalTo(identifier).once('value');
          } else {
            throw new Error("Please enter a valid registered email or 10-digit phone number.");
          }

          if (!snapshot.exists()) {
            throw new Error("No student registered with these details");
          }

          let matchedStudent = null;
          let studentId = null;
          snapshot.forEach(child => {
            const data = child.val();
            if (!data.password || data.password === password) {
              matchedStudent = data;
              studentId = child.key;
            }
          });

          if (!matchedStudent) {
            throw new Error("Incorrect password. Please try again.");
          }

          // Self-heal/Upgrade legacy account password
          if (!matchedStudent.password) {
            matchedStudent.password = password;
            await firebase.database().ref(`students/${studentId}`).update({ password: password });
          }

          // Write active session token mapping
          await firebase.database().ref(`students/${studentId}/active_sessions/${deviceId}`).set({
            sessionToken: sessionToken,
            lastLogin: Date.now(),
            deviceType: deviceType,
            userAgent: navigator.userAgent
          });

          const localEnrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
          const localElite = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
          
          const mergedEnrolled = Array.from(new Set([...localEnrolled, ...(matchedStudent.batchesEnrolled || [])]));
          const mergedElite = Array.from(new Set([...localElite, ...(matchedStudent.batchesEliteEnrolled || [])]));

          localStorage.setItem('enrolledBatches', JSON.stringify(mergedEnrolled));
          localStorage.setItem('enrolledEliteBatches', JSON.stringify(mergedElite));

          matchedStudent.batchesEnrolled = mergedEnrolled;
          matchedStudent.batchesEliteEnrolled = mergedElite;

          // Save locally
          localStorage.setItem(STORAGE_KEY, 'true');
          localStorage.setItem(DATA_KEY, JSON.stringify(matchedStudent));
          localStorage.setItem('student_id', studentId);
          localStorage.setItem('student_session_token', sessionToken);
          localStorage.setItem('userName', matchedStudent.name);
          
          setCookie(STORAGE_KEY, 'true', 365);
          setCookie('userName', matchedStudent.name, 365);
          sessionStorage.setItem('welcomeShownThisSession', 'true');

          // Update firebase
          await firebase.database().ref(`students/${studentId}`).update({
            batchesEnrolled: mergedEnrolled,
            batchesEliteEnrolled: mergedElite,
            lastLogin: Date.now(),
            lastActive: Date.now(),
            totalSessions: (matchedStudent.totalSessions || 0) + 1
          });

          logStudentActivity(studentId, 'Login Complete', {
            identifier: identifier
          });

          if (navigator.vibrate) navigator.vibrate([40, 40, 100]);

          const card = document.querySelector('.reg-card');
          card.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div class="success-checkmark">
                <div class="check-icon">
                  <span class="icon-line line-tip"></span>
                  <span class="icon-line line-long"></span>
                  <div class="icon-circle"></div>
                  <div class="icon-fix"></div>
                </div>
              </div>
              <h2 style="margin-top:24px; color:#10b981; font-weight:800; font-size:1.6rem;">Login Successful!</h2>
              <p style="color:var(--text-secondary); margin-top:8px;">Welcome back, ${matchedStudent.name}.</p>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:24px;">Restoring your workspace...</p>
            </div>
          `;

          setTimeout(() => {
            const overlay = document.getElementById('studentRegOverlay');
            if (overlay) {
              overlay.classList.add('reg-fade-out');
              setTimeout(() => {
                overlay.remove();
                document.body.classList.remove('reg-gate-active');
                window.location.reload();
              }, 500);
            }
          }, 2000);

        } catch (e) {
          console.error("Login failed:", e);
          loginBtn.classList.remove('loading');
          if (loginLoader) loginLoader.style.display = 'none';
          setFormInputsDisabled('studentLoginForm', false);

          const card = document.querySelector('.reg-card');
          if (card) {
            card.classList.add('shake-card');
            setTimeout(() => card.classList.remove('shake-card'), 500);
          }
          alert(e.message || "Login failed");
        }
      });
    }

    // === FORGOT PASSWORD RECOVERY UPGRADE ===
    const recoveryIdentifier = document.getElementById('recoveryIdentifier');
    const recoveryName = document.getElementById('recoveryName');
    const recoveryDOB = document.getElementById('recoveryDOB');
    const recoveryVerifyBtn = document.getElementById('recoveryVerifyBtn');
    const recoveryVerifyLoader = document.getElementById('recoveryVerifyLoader');

    const recoveryNewPassword = document.getElementById('recoveryNewPassword');
    const recoveryConfirmPassword = document.getElementById('recoveryConfirmPassword');
    const recoveryResetBtn = document.getElementById('recoveryResetBtn');
    const recoveryResetLoader = document.getElementById('recoveryResetLoader');

    // Setup Date of Birth pickers for password recovery DOB input
    if (isMobile) {
      if (recoveryDOB) {
        const dobIcon = recoveryDOB.previousElementSibling;
        if (dobIcon) {
          dobIcon.style.cursor = 'pointer';
          let dobNative = document.getElementById('recoveryDOBNative');
          if (!dobNative) {
            dobNative = document.createElement('input');
            dobNative.type = 'date';
            dobNative.id = 'recoveryDOBNative';
            dobNative.style.cssText = 'position: absolute; opacity: 0; width: 0; height: 0; border: none; padding: 0; margin: 0; pointer-events: none;';
            dobNative.max = new Date().toISOString().split('T')[0];
            recoveryDOB.parentNode.appendChild(dobNative);
          }
          dobIcon.addEventListener('click', () => {
            if (typeof dobNative.showPicker === 'function') {
              dobNative.showPicker();
            } else {
              dobNative.click();
            }
          });
          dobNative.addEventListener('change', () => {
            recoveryDOB.value = dobNative.value;
          });
        }
      }
    } else {
      loadFlatpickr(() => {
        if (window.flatpickr && recoveryDOB) {
          window.flatpickr("#recoveryDOB", {
            dateFormat: "Y-m-d",
            maxDate: "today",
            theme: "dark",
            allowInput: true,
            disableMobile: true,
            onChange: function(selectedDates, dateStr) {
              recoveryDOB.value = dateStr;
            }
          });
        }
      });
    }

    if (recoveryDOB) {
      recoveryDOB.addEventListener('input', (e) => {
        if (e.inputType === 'deleteContentBackward' || e.inputType === 'deleteContentForward') return;
        let val = recoveryDOB.value.replace(/\D/g, '');
        let formatted = '';
        if (val.length > 0) formatted += val.substring(0, 4);
        if (val.length > 4) formatted += '-' + val.substring(4, 6);
        if (val.length > 6) formatted += '-' + val.substring(6, 8);
        recoveryDOB.value = formatted;
      });
    }

    function checkRecoveryLock() {
      const attempts = parseInt(localStorage.getItem('rec_failed_attempts') || '0', 10);
      const lockTime = parseInt(localStorage.getItem('rec_lock_timestamp') || '0', 10);
      const now = Date.now();
      
      if (attempts >= 5 && lockTime > 0) {
        const diffMinutes = (now - lockTime) / (1000 * 60);
        if (diffMinutes < 15) {
          const remainingMin = Math.ceil(15 - diffMinutes);
          return remainingMin;
        } else {
          localStorage.removeItem('rec_failed_attempts');
          localStorage.removeItem('rec_lock_timestamp');
        }
      }
      return 0;
    }

    if (recoveryVerifyBtn) {
      recoveryVerifyBtn.addEventListener('click', async () => {
        const remaining = checkRecoveryLock();
        if (remaining > 0) {
          alert(`Too many failed attempts. Password recovery is locked for ${remaining} more minute(s).`);
          return;
        }

        const identifier = recoveryIdentifier.value.trim();
        const nameVal = recoveryName.value.trim();
        const dobVal = recoveryDOB.value.trim();

        if (!identifier || !nameVal || !dobVal) {
          alert("Please fill in Phone Number/Email, Full Name, and Date of Birth.");
          return;
        }

        recoveryVerifyBtn.classList.add('loading');
        if (recoveryVerifyLoader) recoveryVerifyLoader.style.display = 'block';
        setFormInputsDisabled('studentRecoveryForm', true);

        try {
          if (typeof firebase === 'undefined' || !firebase.database) {
            throw new Error("Cloud database offline");
          }

          let snapshot;
          if (identifier.includes('@')) {
            snapshot = await firebase.database().ref('students').orderByChild('email').equalTo(identifier).once('value');
          } else if (/^\d{10}$/.test(identifier)) {
            snapshot = await firebase.database().ref('students').orderByChild('phone').equalTo(identifier).once('value');
          } else {
            throw new Error("Please enter a valid registered email or 10-digit phone number.");
          }

          if (!snapshot.exists()) {
            throw new Error("No student record found with these details");
          }

          let matchedStudentKey = null;
          let matchedStudentData = null;
          
          snapshot.forEach(child => {
            const data = child.val();
            const cleanDbName = (data.name || '').replace(/\s+/g, ' ').trim().toLowerCase();
            const cleanInputName = nameVal.replace(/\s+/g, ' ').trim().toLowerCase();
            const cleanDbDob = (data.dob || '').trim();
            const cleanInputDob = dobVal.trim();
            
            if (cleanDbName === cleanInputName && cleanDbDob === cleanInputDob) {
              matchedStudentKey = child.key;
              matchedStudentData = data;
            }
          });

          if (!matchedStudentKey) {
            throw new Error("Incorrect details. Full Name or Date of Birth mismatch.");
          }

          // Found! Reset lock and transition to Step 2
          localStorage.removeItem('rec_failed_attempts');
          localStorage.removeItem('rec_lock_timestamp');
          window._matchedRecoveryStudentKey = matchedStudentKey;

          document.getElementById('recoveryStepVerify').style.display = 'none';
          document.getElementById('recoveryStepReset').style.display = 'block';
          document.getElementById('recoveryDesc').textContent = 'Enter your new password below';

          recoveryVerifyBtn.classList.remove('loading');
          if (recoveryVerifyLoader) recoveryVerifyLoader.style.display = 'none';
          setFormInputsDisabled('studentRecoveryForm', false);

        } catch (e) {
          console.error("Recovery verification failed:", e);
          recoveryVerifyBtn.classList.remove('loading');
          if (recoveryVerifyLoader) recoveryVerifyLoader.style.display = 'none';
          setFormInputsDisabled('studentRecoveryForm', false);

          const card = document.querySelector('.reg-card');
          if (card) {
            card.classList.add('shake-card');
            setTimeout(() => card.classList.remove('shake-card'), 500);
          }

          // Lockout increment
          let attempts = parseInt(localStorage.getItem('rec_failed_attempts') || '0', 10);
          attempts++;
          localStorage.setItem('rec_failed_attempts', attempts);
          const fingerprint = getOrCreateDeviceId();

          if (attempts >= 5) {
            localStorage.setItem('rec_lock_timestamp', Date.now());
            if (typeof firebase !== 'undefined' && firebase.database) {
              firebase.database().ref('audit_logs/password_recoveries').push({
                status: 'locked',
                timestamp: Date.now(),
                deviceFingerprint: fingerprint,
                inputIdentifier: identifier,
                inputName: nameVal,
                inputDOB: dobVal
              });
            }
            alert("Too many failed attempts. Password recovery is locked for 15 minutes.");
          } else {
            if (typeof firebase !== 'undefined' && firebase.database) {
              firebase.database().ref('audit_logs/password_recoveries').push({
                status: 'failed',
                timestamp: Date.now(),
                deviceFingerprint: fingerprint,
                inputIdentifier: identifier,
                inputName: nameVal,
                inputDOB: dobVal
              });
            }
            alert(e.message || "Verification failed. Details do not match.");
          }
        }
      });
    }

    if (recoveryResetBtn) {
      recoveryResetBtn.addEventListener('click', async () => {
        const matchedKey = window._matchedRecoveryStudentKey;
        if (!matchedKey) {
          alert("Session expired. Please verify your details again.");
          return;
        }

        const newPass = recoveryNewPassword.value;
        const confirmPass = recoveryConfirmPassword.value;

        if (!newPass || !confirmPass) {
          alert("Please fill in both password fields.");
          return;
        }

        if (newPass.length < 6) {
          alert("New password must be at least 6 characters.");
          return;
        }

        if (newPass !== confirmPass) {
          alert("Passwords do not match.");
          return;
        }

        recoveryResetBtn.classList.add('loading');
        if (recoveryResetLoader) recoveryResetLoader.style.display = 'block';
        setFormInputsDisabled('studentRecoveryForm', true);

        try {
          if (typeof firebase === 'undefined' || !firebase.database) {
            throw new Error("Cloud database offline");
          }

          await firebase.database().ref(`students/${matchedKey}`).update({
            password: newPass
          });

          // Log success audit log
          const fingerprint = getOrCreateDeviceId();
          await firebase.database().ref('audit_logs/password_recoveries').push({
            status: 'success',
            studentId: matchedKey,
            timestamp: Date.now(),
            deviceFingerprint: fingerprint
          });

          if (navigator.vibrate) navigator.vibrate([40, 40, 100]);

          const card = document.querySelector('.reg-card');
          card.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
              <div class="success-checkmark">
                <div class="check-icon">
                  <span class="icon-line line-tip"></span>
                  <span class="icon-line line-long"></span>
                  <div class="icon-circle"></div>
                  <div class="icon-fix"></div>
                </div>
              </div>
              <h2 style="margin-top:24px; color:#10b981; font-weight:800; font-size:1.6rem;">Password Updated!</h2>
              <p style="color:var(--text-secondary); margin-top:8px;">Your password has been changed successfully.</p>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:24px;">Workspace ready. Signing in...</p>
            </div>
          `;

          setTimeout(() => {
            const overlay = document.getElementById('studentRegOverlay');
            if (overlay) {
              overlay.classList.add('reg-fade-out');
              setTimeout(() => {
                overlay.remove();
                document.body.classList.remove('reg-gate-active');
                window.location.reload();
              }, 500);
            }
          }, 2000);

        } catch (e) {
          console.error("Password reset failed:", e);
          recoveryResetBtn.classList.remove('loading');
          if (recoveryResetLoader) recoveryResetLoader.style.display = 'none';
          setFormInputsDisabled('studentRecoveryForm', false);
          alert(e.message || "Failed to update password");
        }
      });
    }
  }

  // Processes pending enrollments after registration/login
  function processPendingEnrollments() {
    const isRegistered = localStorage.getItem(STORAGE_KEY) === 'true';
    if (!isRegistered) return;

    let needsSync = false;

    // 1. Process pending standard semester enrollment
    const pendingStd = localStorage.getItem('pendingStandardEnrollment');
    if (pendingStd) {
      let enrolled = [];
      try {
        enrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
      } catch (e) {}
      if (!enrolled.includes(pendingStd)) {
        enrolled.push(pendingStd);
        localStorage.setItem('enrolledBatches', JSON.stringify(enrolled));
        
        // Sync to student record in Firebase if possible
        const studentId = localStorage.getItem('student_id');
        if (studentId && typeof firebase !== 'undefined' && firebase.database) {
          firebase.database().ref(`students/${studentId}`).update({
            batchesEnrolled: enrolled
          });
          
          // Increment global enrollment counter
          firebase.database().ref('site_stats/totalEnrolled').transaction(curr => (curr || 0) + 1);
        }
        needsSync = true;
      }
      localStorage.removeItem('pendingStandardEnrollment');
    }

    // 2. Process pending Elite batch enrollment
    const pendingElite = localStorage.getItem('pendingEliteEnrollment');
    if (pendingElite) {
      let eliteEnrolled = [];
      try {
        eliteEnrolled = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
      } catch (e) {}
      if (!eliteEnrolled.includes(pendingElite)) {
        eliteEnrolled.push(pendingElite);
        localStorage.setItem('enrolledEliteBatches', JSON.stringify(eliteEnrolled));

        // Sync to student record in Firebase if possible
        const studentId = localStorage.getItem('student_id');
        if (studentId && typeof firebase !== 'undefined' && firebase.database) {
          firebase.database().ref(`students/${studentId}`).update({
            batchesEliteEnrolled: eliteEnrolled
          });
        }
        needsSync = true;
      }
      localStorage.removeItem('pendingEliteEnrollment');
    }

    if (needsSync) {
      syncVisitorWithMergedEnrollments();
    }
  }

  function syncVisitorWithMergedEnrollments() {
    const deviceId = getOrCreateDeviceId();
    const visitorId = localStorage.getItem('visitorId') || deviceId;
    if (visitorId && typeof firebase !== 'undefined' && firebase.database) {
      let enrolled = [];
      let elite = [];
      try {
        enrolled = JSON.parse(localStorage.getItem('enrolledBatches') || '[]');
        elite = JSON.parse(localStorage.getItem('enrolledEliteBatches') || '[]');
      } catch (e) {}
      const allEnrolled = [...enrolled, ...elite];
      const name = localStorage.getItem('userName') || 'Student';
      firebase.database().ref(`visitors/${visitorId}`).update({
        name: name,
        enrolled: allEnrolled,
        lastActive: Date.now()
      });
    }
  }

  // Inject Registration Overlay CSS Stylesheet
  function injectStyles() {
    if (document.getElementById('studentRegStyles')) return;
    const style = document.createElement('style');
    style.id = 'studentRegStyles';
    style.textContent = `
      .reg-overlay {
        position: fixed; inset: 0;
        background: rgba(10, 10, 15, 0.9);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        display: flex; align-items: center; justify-content: center;
        z-index: 999999; padding: 20px;
        animation: regFadeIn 0.4s ease;
      }
      .reg-overlay.reg-blocker {
        background: linear-gradient(135deg, #05070a 0%, #000000 100%) !important;
        backdrop-filter: none;
      }
      .reg-card {
        background: rgba(22, 24, 32, 0.7);
        backdrop-filter: blur(40px);
        -webkit-backdrop-filter: blur(40px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        width: 100%; max-width: 960px;
        max-height: 90vh;
        display: flex; flex-direction: row;
        padding: 0; position: relative;
        box-shadow: 0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
        overflow: hidden;
      }
      .reg-card-left {
        width: 45%;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        padding: 48px;
        display: flex; flex-direction: column; justify-content: center;
        position: relative; overflow: hidden;
      }
      .brand-logo { font-size: 3rem; margin-bottom: 24px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5)); }
      .reg-brand-content { position: relative; z-index: 2; }
      .reg-brand-content h2 { font-size: 2.2rem; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 16px; font-family: 'Plus Jakarta Sans', sans-serif; background: linear-gradient(135deg, #fff 30%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .reg-brand-content p { color: #94a3b8; font-size: 1.05rem; line-height: 1.6; margin-bottom: 32px; }
      .brand-features { list-style: none; padding: 0; margin: 0; }
      .brand-features li { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: #e2e8f0; font-weight: 600; font-size: 0.95rem; }
      .brand-features li span { font-size: 1.2rem; }

      .reg-card-right {
        width: 55%;
        padding: 36px;
        display: flex; flex-direction: column;
        max-height: 90vh;
      }
      .reg-view-container {
        flex: 1; overflow-y: auto; overflow-x: hidden;
        padding-right: 8px; margin-right: -8px; /* scrollbar offset */
      }
      .reg-view-container::-webkit-scrollbar { width: 6px; }
      .reg-view-container::-webkit-scrollbar-track { background: transparent; }
      .reg-view-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
      .reg-view-container::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }

      .reg-card::before {
        content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
        background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent, rgba(255,255,255,0.05));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none;
      }
      .reg-glow { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.2; pointer-events: none; z-index: 0; }
      .reg-glow-1 { width: 300px; height: 300px; background: #8b5cf6; top: -100px; left: -100px; }
      .reg-glow-2 { width: 300px; height: 300px; background: #3b82f6; bottom: -100px; right: -100px; }
      .reg-grid-bg { position: absolute; inset: 0; opacity: 0.05; pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 24px 24px; z-index: 0; }

      .reg-close-btn {
        position: absolute; top: 20px; right: 20px;
        background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8; width: 36px; height: 36px; border-radius: 50%;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 1rem; transition: all 0.2s; z-index: 10;
      }
      .reg-close-btn:hover {
        background: rgba(255, 255, 255, 0.15); color: #fff; transform: scale(1.05);
      }
      .reg-tabs {
        display: flex; background: rgba(0, 0, 0, 0.3); padding: 5px; flex-shrink: 0;
        border-radius: 14px; margin-bottom: 24px; border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .reg-tab-btn {
        flex: 1; background: transparent; border: none; color: #64748b;
        padding: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer;
        border-radius: 10px; transition: all 0.3s ease;
      }
      .reg-tab-btn.active {
        background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        color: #fff; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        border: 1px solid rgba(139, 92, 246, 0.5);
      }
      .reg-eye-btn {
        position: absolute; right: 14px; background: transparent; border: none;
        color: #64748b; cursor: pointer; font-size: 1.1rem; padding: 0;
        display: flex; align-items: center; justify-content: center; transition: color 0.2s;
      }
      .reg-eye-btn:hover { color: #fff; }
      .forgot-pass-link {
        color: #94a3b8; font-size: 0.85rem; text-decoration: none; font-weight: 600;
        transition: color 0.2s;
      }
      .forgot-pass-link:hover { color: #fff; text-decoration: underline; }
      .recovery-box-success {
        background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);
        border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;
        animation: regScaleUp 0.3s ease;
      }
      .recovery-box-title {
        font-size: 0.8rem; color: #10b981; font-weight: 800; text-transform: uppercase;
        letter-spacing: 0.5px; margin-bottom: 6px;
      }
      .recovery-box-pass {
        font-family: monospace; font-size: 1.3rem; font-weight: 800; color: #fff;
        letter-spacing: 1px; text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
      }
      .reg-header { text-align: center; margin-bottom: 32px; }
      .reg-header h2 {
        font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 1.6rem;
        color: #fff; margin-bottom: 8px; letter-spacing: -0.5px;
      }
      .reg-header p { font-size: 0.9rem; color: #94a3b8; line-height: 1.5; }
      .reg-icon-wrapper {
        position: relative; width: 64px; height: 64px; margin: 0 auto 16px;
        background: rgba(255, 255, 255, 0.05); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
      }
      .reg-icon-gem { font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
      .reg-icon-ring { display: none; }
      @keyframes regSpin { 100% { transform: rotate(360deg); } }
      .reg-progress-track {
        height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px;
        margin-top: 20px; overflow: hidden;
      }
      .reg-progress-fill {
        height: 100%; width: 0%; background: #fff;
        border-radius: 2px; transition: width 0.3s ease;
      }
      .reg-form-group { margin-bottom: 22px; text-align: left; }
      .reg-form-group label {
        display: block; font-size: 0.78rem; font-weight: 700; color: #94a3b8;
        margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.8px;
      }
      .reg-input-wrap {
        position: relative; display: flex; align-items: center;
        background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px; transition: all 0.3s ease;
      }
      .reg-input-icon { position: absolute; left: 16px; font-size: 1.1rem; pointer-events: none; opacity: 1; transition: all 0.3s ease; }
      .reg-input-wrap:focus-within .reg-input-icon { transform: scale(1.1); }
      .reg-input-wrap input, .reg-input-wrap select {
        width: 100%; background: transparent; border: none; outline: none;
        padding: 16px 16px 16px 48px; font-size: 0.95rem; color: #fff;
        font-family: inherit;
      }
      .reg-input-wrap input[type="password"] {
        padding-right: 48px;
      }
      .reg-input-wrap select {
        cursor: pointer; appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat; background-position: right 16px center; background-size: 14px;
        padding-right: 40px;
      }
      .reg-input-wrap select option {
        background: #11131a; color: #fff;
      }
      .reg-input-wrap:focus-within {
        border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05);
        box-shadow: 0 0 0 4px rgba(255,255,255,0.02);
      }
      .reg-form-row {
        display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      }
      .reg-err {
        max-height: 0; opacity: 0; overflow: hidden;
        font-size: 0.75rem; color: #ef4444; font-weight: 600;
        transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, margin-top 0.25s ease;
        margin-top: 0;
      }
      .reg-err.visible {
        max-height: 40px; opacity: 1; margin-top: 6px;
      }
      .reg-btn {
        width: 100%; padding: 16px; border: none; border-radius: 12px;
        background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 10px;
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.35);
        transition: all 0.3s ease; margin-top: 10px;
      }
      .reg-btn:hover:not(:disabled) {
        transform: translateY(-2px); box-shadow: 0 10px 28px rgba(139, 92, 246, 0.5); background: linear-gradient(135deg, #9366f9 0%, #468bf9 100%);
      }
      .reg-btn:disabled {
        opacity: 0.5; cursor: not-allowed; box-shadow: none; background: rgba(255,255,255,0.1); color: #94a3b8;
      }
      .reg-btn-loader {
        display: none; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
        border-top-color: #fff; border-radius: 50%; animation: regSpin 0.8s linear infinite;
      }
      .reg-btn:disabled .reg-btn-loader { border-top-color: #fff; border-color: rgba(255,255,255,0.2) rgba(255,255,255,0.2) #fff rgba(255,255,255,0.2); }
      .reg-footer { text-align: center; margin-top: 28px; font-size: 0.75rem; color: #475569; font-weight: 600; flex-shrink: 0; }
      
      /* Animation Clues */
      @keyframes regFadeIn { from { opacity: 0; } to { opacity: 1; } }
      .reg-fade-out { animation: regFadeOut 0.5s forwards ease; }
      @keyframes regFadeOut { to { opacity: 0; transform: scale(0.95); } }
      .animate-scale-up { animation: regScaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes regScaleUp { from { transform: scale(0.92) translateY(20px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
      .shake-card { animation: regShake 0.4s ease; }
      @keyframes regShake {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-8px); }
        40%, 80% { transform: translateX(8px); }
      }
      
      /* Success animation */
      .success-checkmark {
        width: 80px; height: 80px; margin: 0 auto;
      }
      .success-checkmark .check-icon {
        width: 80px; height: 80px; position: relative; border-radius: 50%;
        box-sizing: content-box; border: 4px solid #4CAF50;
      }
      .success-checkmark .check-icon::before {
        top: 3px; left: -2px; width: 30px; height: 80px; background: transparent;
        position: absolute; content: ''; transform-origin: 100% 50%;
      }
      .success-checkmark .check-icon::after {
        top: 0; left: 30px; width: 60px; height: 80px; background: transparent;
        position: absolute; content: ''; transform-origin: 0 50%;
      }
      .success-checkmark .check-icon .icon-circle {
        top: -4px; left: -4px; height: 80px; width: 80px; border-radius: 50%;
        box-sizing: content-box; border: 4px solid rgba(76, 175, 80, 0.5);
        position: absolute; z-index: 1;
      }
      .success-checkmark .check-icon .icon-line {
        height: 5px; background-color: #4CAF50; display: block;
        position: absolute; z-index: 10; border-radius: 2px;
      }
      .success-checkmark .check-icon .icon-line.line-tip {
        top: 46px; left: 19px; width: 25px; transform: rotate(45deg);
      }
      .success-checkmark .check-icon .icon-line.line-long {
        top: 38px; right: 8px; width: 47px; transform: rotate(-45deg);
      }

      @media (max-width: 768px) {
        .reg-card { flex-direction: column; max-width: 480px; }
        .reg-card-left { display: none; }
        .reg-card-right { width: 100%; padding: 24px; }
      }
    `;
    document.head.appendChild(style);
  }
})();
