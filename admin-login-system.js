/* ============================================================
   PREMIUM ADMIN LOGIN GATE LOGIC (admin-login-system.js)
   ============================================================ */

(function() {
  // References to original admin page methods
  const originalInitAdminPage = window.initAdminPage;

  // Compute SHA-256 hash asynchronously using Web Crypto API
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Dual-tone futuristic bell sound using Web Audio API
  function playSuccessSound() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq, start, duration, volume) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      
      playTone(523.25, 0.0, 0.25, 0.04); // C5
      playTone(659.25, 0.08, 0.35, 0.04); // E5
    } catch (e) {
      console.warn("Success tone playback skipped:", e);
    }
  }

  // Clear all session storage tokens safely
  function clearAdminSession() {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminRememberSession');
    localStorage.removeItem('bypass_maintenance');
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('adminLastActive');
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminSessionActive');
    sessionStorage.removeItem('currentSessionId');
  }

  // Update last active timestamp with throttling (e.g. once every 10 seconds)
  let lastWriteTime = 0;
  function updateLastActiveTime(force = false) {
    const now = Date.now();
    if (force || (now - lastWriteTime > 10000)) { // 10 seconds throttle
      localStorage.setItem('adminLastActive', now.toString());
      lastWriteTime = now;
    }
  }

  let activityListenersAttached = false;
  function setupActivityListeners() {
    if (activityListenersAttached) return;
    activityListenersAttached = true;
    
    const events = ['mousedown', 'keydown', 'mousemove', 'scroll', 'touchstart', 'click'];
    events.forEach(eventName => {
      document.addEventListener(eventName, () => {
        // Only update if session is still valid
        const authDataStr = localStorage.getItem('adminAuth');
        if (authDataStr) {
          updateLastActiveTime();
        }
      }, { passive: true });
    });
  }

  // Validate session state across tabs & page refreshes
  function checkSessionValidity() {
    try {
      // Local development bypass utility
      if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
          new URLSearchParams(window.location.search).get('bypass') === 'true') {
        const authData = {
          token: "dev-bypass-token",
          exp: Date.now() + 86400000,
          role: 'superadmin'
        };
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        localStorage.setItem('bypass_maintenance', 'true');
        sessionStorage.setItem('adminSessionActive', 'true');
        localStorage.setItem('adminRememberSession', 'true');
        localStorage.setItem('adminLastActive', Date.now().toString());
        return true;
      }

      const authDataStr = localStorage.getItem('adminAuth');
      if (!authDataStr) {
        clearAdminSession();
        return false;
      }
      
      const authData = JSON.parse(authDataStr);
      if (!authData || !authData.token || !authData.exp) {
        clearAdminSession();
        return false;
      }
      
      // Check for session expiry
      if (Date.now() > authData.exp) {
        clearAdminSession();
        return false;
      }

      // Respect session-only storage boundary
      const isRemembered = localStorage.getItem('adminRememberSession') === 'true';
      if (!isRemembered) {
        let isActiveSession = sessionStorage.getItem('adminSessionActive') === 'true';
        if (!isActiveSession) {
          // Check if we can restore session due to 10 minutes threshold
          const lastActiveStr = localStorage.getItem('adminLastActive');
          if (lastActiveStr) {
            const lastActive = parseInt(lastActiveStr, 10);
            if (!isNaN(lastActive) && (Date.now() - lastActive < 10 * 60 * 1000)) {
              // Restore active session since they came back within 10 minutes
              sessionStorage.setItem('adminSessionActive', 'true');
              isActiveSession = true;
            }
          }
        }
        if (!isActiveSession) {
          // Tab was closed and 10 minutes have passed, session is expired
          clearAdminSession();
          return false;
        }
      }
      
      // Update last active time and attach listeners if session is valid
      updateLastActiveTime();
      setupActivityListeners();
      
      return true;
    } catch (e) {
      console.error("Session evaluation error:", e);
      clearAdminSession();
      return false;
    }
  }

  // Standardize redirection/display settings for layout elements
  function setDashboardVisibility(visible) {
    const adminPanel = document.getElementById('adminPanel');
    const loginGate = document.getElementById('adminLoginGate');
    const adminExtras = document.getElementById('adminExtras');
    
    if (visible) {
      if (loginGate) {
        loginGate.style.display = 'none';
      }
      if (adminPanel) {
        adminPanel.style.display = 'flex';
        adminPanel.classList.add('adm-shell');
      }
      if (adminExtras) {
        adminExtras.style.display = 'block';
      }
      document.body.classList.remove('login-active');
    } else {
      if (adminPanel) {
        adminPanel.style.display = 'none';
        adminPanel.classList.remove('adm-shell');
      }
      if (loginGate) {
        loginGate.style.display = 'flex';
      }
      if (adminExtras) {
        adminExtras.style.setProperty('display', 'none', 'important');
      }
      document.body.classList.add('login-active');
    }
  }

  // Custom static UI template injector
  function ensureLoginGateMarkup() {
    const loginGate = document.getElementById('adminLoginGate');
    if (!loginGate) return;
    
    // Inject glassmorphic form card and HTML structure if not already populated
    if (loginGate.innerHTML.trim() === "") {
      loginGate.className = "admin-login-gate";
      loginGate.innerHTML = `
        <div class="login-bg-glow-orb orb-indigo"></div>
        <div class="login-bg-glow-orb orb-purple"></div>
        <div class="login-bg-glow-orb orb-cyan"></div>
        
        <div class="login-card-wrapper">
          <div class="login-card" id="loginCard">
            
            <button type="button" id="loginThemeToggle" class="login-theme-toggle" title="Toggle Theme">🌙</button>
            <div class="login-header-logo">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"></path>
              </svg>
            </div>
            
            <h1 class="login-title">Admin <span>Gateway</span></h1>
            <p class="login-subtitle">Provide credential keys to establish access telemetry.</p>
            
            <div class="login-error-container" id="loginErrorAlert">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span id="loginErrorText">Credentials invalid. Please re-enter.</span>
            </div>
            
            <form id="loginGateForm" onsubmit="event.preventDefault();">
              <div class="login-form-group">
                <label class="login-label" for="loginAdminId">Admin ID</label>
                <div class="login-input-container">
                  <svg class="login-input-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path>
                  </svg>
                  <input type="text" id="loginAdminId" class="login-input" placeholder="Enter Admin ID" autocomplete="off" required>
                </div>
              </div>
              
              <div class="login-form-group">
                <label class="login-label" for="loginPassword">Access Password</label>
                <div class="login-input-container">
                  <svg class="login-input-icon" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"></path>
                  </svg>
                  <input type="password" id="loginPassword" class="login-input" placeholder="••••••••" required>
                  <button type="button" id="loginPassToggle" class="login-password-toggle" aria-label="Toggle password view">
                    <svg id="eyeOpenIcon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <svg id="eyeClosedIcon" class="hidden" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"></path>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div class="login-options-row">
                <label class="login-checkbox-label">
                  <input type="checkbox" id="loginRemember" class="login-checkbox">
                  Remember Session
                </label>
                <a href="#" class="login-forgot-link" id="loginForgotBtn">Security Protocols</a>
              </div>
              
              <button type="submit" id="loginSubmitBtn" class="login-btn-submit">
                <span id="loginBtnText">Authorize Connection</span>
              </button>
            </form>
            
            <div class="login-footer">
              BCA STORE Operational Desk &bull; <a href="developer.html" class="login-footer-link">Support Desk</a>
            </div>
            
          </div>
        </div>
      `;
    }
  }

  // Setup UI interactive binds for form input details
  function initLoginGateBinds() {
    const form = document.getElementById('loginGateForm');
    const idInput = document.getElementById('loginAdminId');
    const passInput = document.getElementById('loginPassword');
    const toggleBtn = document.getElementById('loginPassToggle');
    const eyeOpen = document.getElementById('eyeOpenIcon');
    const eyeClosed = document.getElementById('eyeClosedIcon');
    const forgotBtn = document.getElementById('loginForgotBtn');
    
    if (toggleBtn && passInput) {
      toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        if (isPass) {
          eyeOpen.classList.add('hidden');
          eyeClosed.classList.remove('hidden');
        } else {
          eyeOpen.classList.remove('hidden');
          eyeClosed.classList.add('hidden');
        }
      });
    }

    if (forgotBtn) {
      forgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Verification System: Database credential keys are hardcoded statically. Contact system developer Vishal for security overrides.");
      });
    }

    const themeToggle = document.getElementById('loginThemeToggle');
    if (themeToggle) {
      const updateThemeIcon = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeToggle.textContent = isDark ? '☀️' : '🌙';
      };
      updateThemeIcon();
      themeToggle.addEventListener('click', () => {
        if (typeof toggleDarkMode === 'function') {
          toggleDarkMode();
        } else {
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
          localStorage.setItem('darkMode', !isDark);
        }
        updateThemeIcon();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLoginAttempt();
      });
    }
  }

  // Handle Authentication Process
  async function handleLoginAttempt() {
    const card = document.getElementById('loginCard');
    const idInput = document.getElementById('loginAdminId');
    const passInput = document.getElementById('loginPassword');
    const rememberChk = document.getElementById('loginRemember');
    const errorAlert = document.getElementById('loginErrorAlert');
    const errorText = document.getElementById('loginErrorText');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnText = document.getElementById('loginBtnText');
    
    if (!idInput || !passInput || !submitBtn) return;
    
    const idValue = idInput.value.trim();
    const passValue = passInput.value;
    
    // Reset warning alerts
    if (card) card.classList.remove('login-shake');
    if (errorAlert) errorAlert.style.display = 'none';
    
    // Field emptiness verification
    if (!idValue) {
      showLoginError("Admin ID cannot be empty.");
      triggerInputShake(idInput);
      return;
    }
    if (!passValue) {
      showLoginError("Password cannot be empty.");
      triggerInputShake(passInput);
      return;
    }
    
    // Set UI processing loader state
    idInput.disabled = true;
    passInput.disabled = true;
    rememberChk.disabled = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="login-spinner"></div><span>Authenticating...</span>`;
    
    // Simulating secure handshake latency
    await new Promise(r => setTimeout(r, 1100));
    
    try {
      if (!window.db) {
        throw new Error("Telemetry database offline. Connection failed.");
      }
      
      const snapshot = await window.db.ref('admin_credentials').once('value');
      if (!snapshot.exists()) {
        throw new Error("Security policy not found. Contact system developer.");
      }
      
      const creds = snapshot.val();
      const idHashTarget = creds.id_hash;
      const passHashTarget = creds.pass_hash;
      
      if (!idHashTarget || !passHashTarget) {
        throw new Error("Invalid telemetry keys. Contact administrator.");
      }

      const enteredIdHash = await sha256(idValue);
      const enteredPassHash = await sha256(passValue);
      
      if (enteredIdHash === idHashTarget && enteredPassHash === passHashTarget) {
        // Sign-in successful
        
        // Generate Token
        let token = "";
        if (window.AttendanceSecurity && typeof window.AttendanceSecurity.generateJWT === 'function') {
          token = await window.AttendanceSecurity.generateJWT({ username: 'superadmin', role: 'superadmin' });
        } else {
          // Standard JWT structure fallback
          const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
          const payload = btoa(JSON.stringify({ username: "superadmin", role: "superadmin", iat: Math.floor(Date.now()/1000), exp: Math.floor((Date.now()+86400000)/1000) }));
          token = `${header}.${payload}.signature_fallback`;
        }
        
        const authData = {
          token: token,
          exp: Date.now() + 86400000, // 24 hours expiry
          role: 'superadmin'
        };
        
        // Save token to local storage (needed for standalone subpanels)
        localStorage.setItem('adminAuth', JSON.stringify(authData));
        localStorage.setItem('bypass_maintenance', 'true');
        
        if (rememberChk.checked) {
          localStorage.setItem('adminRememberSession', 'true');
        } else {
          localStorage.removeItem('adminRememberSession');
          sessionStorage.setItem('adminSessionActive', 'true');
        }
        
        // Force update last active timestamp and attach listeners immediately upon login
        updateLastActiveTime(true);
        setupActivityListeners();
        
        // Success micro-interactions
        submitBtn.innerHTML = `<span>✓ Telemetry Established</span>`;
        submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        submitBtn.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
        
        playSuccessSound();
        
        // Launch confetti if the canvas script exists
        const canvas = document.getElementById('admConfettiCanvas');
        if (canvas && window.confetti) {
          try {
            const myConfetti = window.confetti.create(canvas, { resize: true });
            myConfetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#6366f1', '#10b981', '#3b82f6', '#ffffff']
            });
          } catch(e) {}
        }
        
        // Fade exit animations before rendering dashboard
        const loginGate = document.getElementById('adminLoginGate');
        if (loginGate) {
          setTimeout(() => {
            loginGate.classList.add('login-gate-fadeout');
            setTimeout(() => {
              setDashboardVisibility(true);
              loginGate.classList.remove('login-gate-fadeout');
              
              // Run actual initialization routine
              if (typeof originalInitAdminPage === 'function') {
                originalInitAdminPage();
              }
            }, 600);
          }, 850);
        } else {
          setDashboardVisibility(true);
          if (typeof originalInitAdminPage === 'function') {
            originalInitAdminPage();
          }
        }
        
      } else {
        // Validation Failed
        throw new Error("Invalid Administrative credentials.");
      }
    } catch(err) {
      // Revert loading state
      idInput.disabled = false;
      passInput.disabled = false;
      rememberChk.disabled = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Authorize Connection</span>`;
      
      showLoginError(err.message || "Failed key matching handshake.");
      
      if (card) {
        card.classList.remove('login-shake');
        void card.offsetWidth; // Trigger layout reflow
        card.classList.add('login-shake');
      }
      
      if (passInput) {
        passInput.value = "";
        passInput.focus();
      }
    }
  }

  function showLoginError(msg) {
    const errorAlert = document.getElementById('loginErrorAlert');
    const errorText = document.getElementById('loginErrorText');
    if (errorAlert && errorText) {
      errorText.textContent = msg;
      errorAlert.style.display = 'flex';
    }
  }

  function triggerInputShake(inputElement) {
    if (!inputElement) return;
    inputElement.classList.add('error-shake');
    setTimeout(() => {
      inputElement.classList.remove('error-shake');
      inputElement.focus();
    }, 500);
  }

  // OVERRIDE switchAdminTab globally to prevent unauthorized routing
  const originalSwitchAdminTab = window.switchAdminTab;
  window.switchAdminTab = function(tab) {
    if (!checkSessionValidity()) {
      console.warn("Security Override: switchAdminTab blocked for unauthenticated session.");
      return;
    }
    if (typeof originalSwitchAdminTab === 'function') {
      originalSwitchAdminTab(tab);
    }
  };

  // OVERRIDE openAdminCommandPalette globally
  const originalOpenAdminCommandPalette = window.openAdminCommandPalette;
  window.openAdminCommandPalette = function(q) {
    if (!checkSessionValidity()) return;
    if (typeof originalOpenAdminCommandPalette === 'function') {
      originalOpenAdminCommandPalette(q);
    }
  };

  // OVERRIDE openAdminSettingsSection globally
  const originalOpenAdminSettingsSection = window.openAdminSettingsSection;
  window.openAdminSettingsSection = function(sec) {
    if (!checkSessionValidity()) return;
    if (typeof originalOpenAdminSettingsSection === 'function') {
      originalOpenAdminSettingsSection(sec);
    }
  };

  // OVERRIDE openAdminAISettings globally
  const originalOpenAdminAISettings = window.openAdminAISettings;
  window.openAdminAISettings = function() {
    if (!checkSessionValidity()) return;
    if (typeof originalOpenAdminAISettings === 'function') {
      originalOpenAdminAISettings();
    }
  };

  // OVERRIDE initAdminPage globally
  window.initAdminPage = function() {
    ensureLoginGateMarkup();
    
    const isSessionActive = checkSessionValidity();
    
    if (isSessionActive) {
      setDashboardVisibility(true);
      
      if (typeof originalInitAdminPage === 'function') {
        originalInitAdminPage();
      }
    } else {
      setDashboardVisibility(false);
      initLoginGateBinds();
    }
  };

  // OVERRIDE adminLogout globally
  window.adminLogout = function() {
    closeAdminWelcomePopup && closeAdminWelcomePopup();
    closeAdminCommandPalette && closeAdminCommandPalette();
    
    if (confirm("Terminate administrative connection and wipe active session?")) {
      clearAdminSession();
      window.location.reload();
    }
  };

  function closeAdminWelcomePopup() {
    if (typeof window.closeAdminWelcomePopup === 'function') {
      window.closeAdminWelcomePopup();
    }
  }

  function closeAdminCommandPalette() {
    if (typeof window.closeAdminCommandPalette === 'function') {
      window.closeAdminCommandPalette();
    }
  }

})();
