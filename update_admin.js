const fs = require('fs');
let html = fs.readFileSync('admin.html', 'utf8');

const startStyle = html.indexOf('<style>');
const endStyle = html.indexOf('</style>') + 8;
const styleContent = html.substring(startStyle, endStyle);

const startGate = html.indexOf('<div class="admin-login-gate" id="adminLoginGate">');
const endGate = html.indexOf('<!-- ==================== ADMIN PANEL ==================== -->');
const gateContent = html.substring(startGate, endGate);

if (styleContent.includes('New Login UI Variables') && gateContent.length > 0) {
    let newStyle = `  <style>
    /* Admin Login CSS - Matching Main Website Theme */
    #navbar, .admin-extras { display: none !important; }
    
    body.login-active {
        overflow: hidden;
        height: 100vh;
        width: 100vw;
        background: var(--bg) !important;
    }
    
    .admin-login-gate {
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    }

    .admin-auth-wrapper {
        width: 100%;
        max-width: 420px;
        animation: slideUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .admin-auth-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .admin-auth-icon {
        width: 64px;
        height: 64px;
        background: var(--primary-light);
        color: var(--primary);
        border-radius: var(--radius);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1.5rem;
        font-size: 2rem;
    }

    .admin-auth-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--text);
        margin-bottom: 0.5rem;
    }

    .admin-auth-subtitle {
        color: var(--text-muted);
        font-size: 0.95rem;
    }

    .admin-auth-card {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        padding: 2.5rem 2rem;
    }

    .admin-input-group {
        margin-bottom: 1.25rem;
        position: relative;
    }

    .admin-input-label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text);
    }

    .admin-input-wrapper {
        position: relative;
    }

    .admin-input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
    }
    
    .admin-input-action {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.3s ease;
    }

    .admin-input-action:hover {
        color: var(--primary);
    }

    .admin-input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.75rem;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text);
        font-size: 0.95rem;
        transition: all 0.3s ease;
    }

    .admin-input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-light);
    }

    .admin-auth-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        margin-top: 1.5rem;
    }

    .admin-checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: var(--text-muted);
        cursor: pointer;
    }

    .admin-checkbox {
        accent-color: var(--primary);
        width: 1rem;
        height: 1rem;
    }

    .admin-auth-btn {
        width: 100%;
        padding: 1rem;
        background: var(--primary);
        color: #fff;
        border: none;
        border-radius: var(--radius-sm);
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .admin-auth-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--shadow-hover);
    }

    .admin-error-msg {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;
        padding: 0.75rem;
        border-radius: var(--radius-sm);
        font-size: 0.85rem;
        margin-bottom: 1.5rem;
        display: none;
        align-items: center;
        gap: 0.5rem;
    }

    .admin-btn-loader {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin-auth 0.8s linear infinite;
        display: none;
    }

    @keyframes spin-auth {
        to { transform: rotate(360deg); }
    }

    .record-row-new {
        animation: highlightRow 3s ease-out;
    }
    @keyframes highlightRow {
        0% { background-color: rgba(16, 185, 129, 0.2); }
        100% { background-color: transparent; }
    }

    @media (max-width: 640px) {
        .admin-auth-card {
            padding: 2rem 1.5rem;
        }
        .admin-auth-title {
            font-size: 1.5rem;
        }
    }
  </style>`;

    let newGate = `<div class="admin-login-gate" id="adminLoginGate">
  <div class="admin-auth-wrapper">
    <div class="admin-auth-header">
      <div class="admin-auth-icon">
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
      </div>
      <h1 class="admin-auth-title">Admin Console</h1>
      <p class="admin-auth-subtitle">Sign in to manage BCA Study Hub</p>
    </div>

    <div class="admin-auth-card">
      <div class="admin-error-msg" id="loginError">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span id="errorText"></span>
      </div>

      <div class="admin-input-group">
        <label for="adminEmail" class="admin-input-label">Email Address</label>
        <div class="admin-input-wrapper">
          <svg class="admin-input-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"></path></svg>
          <input type="email" id="adminEmail" class="admin-input" placeholder="admin@domain.com" required>
        </div>
      </div>

      <div class="admin-input-group">
        <label for="adminPassword" class="admin-input-label">Password</label>
        <div class="admin-input-wrapper">
          <svg class="admin-input-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          <input type="password" id="adminPassword" class="admin-input" placeholder="••••••••" required>
          <button type="button" onclick="togglePassView()" class="admin-input-action">
            <svg id="eye-open" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <svg id="eye-closed" class="hidden" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>
          </button>
        </div>
      </div>

      <div class="admin-auth-footer">
        <label class="admin-checkbox-label">
          <input type="checkbox" class="admin-checkbox">
          <span>Remember me</span>
        </label>
      </div>

      <button id="loginBtn" onclick="adminLogin()" class="admin-auth-btn">
        <span id="btn-text">Access Dashboard</span>
        <div id="btnLoader" class="admin-btn-loader"></div>
      </button>
    </div>

    <p style="text-align: center; margin-top: 2rem; font-size: 0.85rem; color: var(--text-muted);">
      &copy; 2026 BCA STORE. All rights reserved.<br>
      Developed with 🖤 by <a href="developer.html" style="color: var(--primary); font-weight: 600; text-decoration: none;">VISHAL</a>
    </p>
  </div>
</div>
\n`;

    html = html.replace(styleContent, newStyle);
    html = html.replace(gateContent, newGate);
    fs.writeFileSync('admin.html', html);
    console.log('Successfully updated admin.html');
} else {
    console.log('Could not find the target sections. Style:', styleContent.includes('New Login UI Variables'), 'Gate Length:', gateContent.length);
}
