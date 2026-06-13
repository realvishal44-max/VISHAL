// ==========================================================================
// PORTFOLIO CLIENT ECOSYSTEM CORE ENGINE
// Dynamic Loader, Style Injection, Interactive Particle Physics, Typing Animator, 3D Parallax Tilt, Analytics logging
// ==========================================================================

let activeBgCanvas = null;
let activeBgAnimFrame = null;
let particleArray = [];
let matrixInterval = null;
let starArray = [];
let mathCaptchaAnswer = null;

document.addEventListener('DOMContentLoaded', () => {
  const dbCheck = setInterval(() => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(dbCheck);
      initClientPortfolio();
    }
  }, 500);
});

// INITIALIZE PORTFOLIO CLIENT
function initClientPortfolio() {
  console.log("🚀 Initializing Developer Portfolio Client Engine...");
  
  // Track traffic views
  logTrafficAnalytics();

  // Load Customizer Config and inject CSS variables first
  db.ref('developer_portfolio/config').on('value', snap => {
    if (snap.exists()) {
      applyCustomizerConfig(snap.val());
    }
  });

  // Load Profile Personal Info
  db.ref('developer_portfolio/profile').on('value', snap => {
    if (snap.exists()) {
      renderClientProfile(snap.val());
    }
  });

  // Load Social Links
  db.ref('developer_portfolio/socials').on('value', snap => {
    if (snap.exists()) {
      renderClientSocials(snap.val());
    }
  });

  // Load Projects Showcase
  db.ref('developer_portfolio/projects').on('value', snap => {
    if (snap.exists()) {
      renderClientProjects(snap.val());
    }
  });

  // Load Contact details
  db.ref('developer_portfolio/contact').on('value', snap => {
    if (snap.exists()) {
      renderClientContact(snap.val());
    }
  });

  // Generate Interactive Math Captcha
  generateMathCaptcha();

  // Load dynamic QR Code
  generatePortfolioQRCode();
}

// ==========================================================================
// 1. TRAFFIC ANALYTICS SYSTEM
// ==========================================================================

function logTrafficAnalytics() {
  if (typeof db === 'undefined' || !db) return;

  // Track unique visitors using local storage visitor key
  let visitorId = localStorage.getItem('portVisitorId');
  const summaryRef = db.ref('developer_portfolio/analytics/summary');

  summaryRef.once('value', snap => {
    let summary = snap.val() || {
      visitors: 0,
      uniqueVisitors: 0,
      views: 0,
      projectViews: 0,
      linkClicks: 0,
      contactSubmissions: 0,
      cvDownloads: 0
    };

    summary.views = (summary.views || 0) + 1; // Always increment views

    if (!visitorId) {
      // New unique visitor
      visitorId = 'V_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('portVisitorId', visitorId);
      
      summary.uniqueVisitors = (summary.uniqueVisitors || 0) + 1;
      summary.visitors = (summary.visitors || 0) + 1;
    } else {
      // Returning session visit (we treat page load after session reset or periodic refresh as session visit)
      const lastVisit = localStorage.getItem('portLastVisit');
      const now = Date.now();
      // If last visit was more than 30 mins ago, count as new session visitor
      if (!lastVisit || (now - parseInt(lastVisit)) > 30 * 60 * 1000) {
        summary.visitors = (summary.visitors || 0) + 1;
      }
      localStorage.setItem('portLastVisit', now.toString());
    }

    summaryRef.set(summary);
  });
}

function trackLinkClickEvent(category, targetName) {
  if (typeof db === 'undefined' || !db) return;
  
  db.ref('developer_portfolio/analytics/summary').once('value', snap => {
    if (snap.exists()) {
      const summary = snap.val();
      summary.linkClicks = (summary.linkClicks || 0) + 1;
      
      if (category === 'Project View') {
        summary.projectViews = (summary.projectViews || 0) + 1;
      } else if (category === 'CV Download') {
        summary.cvDownloads = (summary.cvDownloads || 0) + 1;
      }
      db.ref('developer_portfolio/analytics/summary').set(summary);
    }
  });
}

// ==========================================================================
// 2. THEME CUSTOMIZATION ENGINE
// ==========================================================================

function applyCustomizerConfig(config) {
  let styleEl = document.getElementById('dynamicPortfolioStyles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicPortfolioStyles';
    document.head.appendChild(styleEl);
  }

  // Set default fallbacks
  const theme = config.theme || 'dark';
  const primary = config.primaryColor || '#6366f1';
  const secondary = config.secondaryColor || '#8b5cf6';
  const accent = config.accentColor || '#06b6d4';
  const bg = config.bgColor || '#0f172a';
  const blur = config.glassBlur || '20';
  const opacity = config.glassOpacity || '0.45';
  const font = config.fontFamily || 'Plus Jakarta Sans';
  const animSetting = config.animations || 'active';
  const cardStyle = config.cardStyle || 'glass';

  // Compute Glass Background using HSL/RGBA
  const glassBg = hexToRgba(bg, opacity);
  const borderCol = hexToRgba(primary, '0.15');

  // Load custom font if Orbitron or JetBrains
  if (font === 'Orbitron' && !document.querySelector("link[href*='Orbitron']")) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  } else if (font === 'JetBrains Mono' && !document.querySelector("link[href*='JetBrains']")) {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  let cssRules = `
    .dev-profile-page {
      --color-primary: ${primary} !important;
      --color-secondary: ${secondary} !important;
      --color-accent: ${accent} !important;
      --color-bg: ${bg} !important;
      --color-bg-card: ${glassBg} !important;
      --color-border: ${borderCol} !important;
      font-family: '${font}', sans-serif !important;
    }
  `;

  if (cardStyle === 'neon-border') {
    cssRules += `
      .dev-glass-card {
        border-color: ${hexToRgba(primary, '0.35')} !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 12px ${hexToRgba(primary, '0.2')} !important;
      }
      .dev-glass-card:hover {
        border-color: ${accent} !important;
        box-shadow: 0 15px 35px rgba(0,0,0,0.6), 0 0 25px ${hexToRgba(accent, '0.4')} !important;
      }
    `;
  } else if (cardStyle === 'flat') {
    cssRules += `
      .dev-glass-card {
        background: ${bg} !important;
        border: 2px solid rgba(255,255,255,0.15) !important;
        backdrop-filter: none !important;
        box-shadow: 6px 6px 0px rgba(255,255,255,0.1) !important;
        border-radius: 12px !important;
      }
      .dev-glass-card:hover {
        transform: translate(-3px, -3px) !important;
        box-shadow: 9px 9px 0px ${primary} !important;
        border-color: ${primary} !important;
      }
    `;
  } else {
    // Glass default
    cssRules += `
      .dev-glass-card {
        backdrop-filter: blur(${blur}px) !important;
        -webkit-backdrop-filter: blur(${blur}px) !important;
      }
    `;
  }

  if (animSetting === 'reduced') {
    cssRules += `
      * {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-duration: 0s !important;
        transform: none !important;
      }
    `;
  }

  styleEl.textContent = cssRules;

  // Run selected Background Effect
  initBackgroundEffect(config.bgEffect, bg, primary, accent);
}

function hexToRgba(hex, alpha) {
  let r = 99, g = 102, b = 241;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    let c = hex.substring(1);
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    const val = parseInt(c, 16);
    r = (val >> 16) & 255;
    g = (val >> 8) & 255;
    b = val & 255;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Background effect selectors
function initBackgroundEffect(effect, bgCol, priCol, accCol) {
  // Cancel any running animation loops & remove existing canvas
  if (activeBgAnimFrame) {
    cancelAnimationFrame(activeBgAnimFrame);
    activeBgAnimFrame = null;
  }
  if (matrixInterval) {
    clearInterval(matrixInterval);
    matrixInterval = null;
  }
  const oldCanvas = document.getElementById('portDynamicBgCanvas');
  if (oldCanvas) oldCanvas.remove();

  if (effect === 'none') return;

  // Create Canvas elements
  const canvas = document.createElement('canvas');
  canvas.id = 'portDynamicBgCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '-1';
  canvas.style.pointerEvents = effect === 'particle' ? 'auto' : 'none';
  document.body.appendChild(canvas);

  activeBgCanvas = canvas;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  if (effect === 'particle') {
    initParticlePhysics(ctx, priCol, accCol);
  } else if (effect === 'matrix') {
    initMatrixRain(ctx, accCol);
  } else if (effect === 'stars') {
    initTwinklingStars(ctx, priCol);
  }
}

// 2.1 CANVAS PARTICLE LOGIC WITH MOUSE INTERACTION
function initParticlePhysics(ctx, color1, color2) {
  const canvas = activeBgCanvas;
  particleArray = [];

  const mouse = {
    x: null,
    y: null,
    radius: 120
  };

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.size = Math.random() * 2 + 0.5;
    }
    draw() {
      ctx.fillStyle = color2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      // Edge collisions
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Mouse repulsion physics
      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const ax = (dx / dist) * force * 1.5;
          const ay = (dy / dist) * force * 1.5;
          this.x += ax;
          this.y += ay;
        }
      }

      this.x += this.vx;
      this.y += this.vy;
    }
  }

  const count = Math.min(100, Math.floor((canvas.width * canvas.height) / 13000));
  for (let i = 0; i < count; i++) {
    particleArray.push(new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw lines between nodes
    ctx.strokeStyle = hexToRgba(color1, '0.04');
    ctx.lineWidth = 0.6;
    for (let i = 0; i < particleArray.length; i++) {
      for (let j = i + 1; j < particleArray.length; j++) {
        const dx = particleArray[i].x - particleArray[j].x;
        const dy = particleArray[i].y - particleArray[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particleArray[i].x, particleArray[i].y);
          ctx.lineTo(particleArray[j].x, particleArray[j].y);
          ctx.stroke();
        }
      }
    }

    particleArray.forEach(p => {
      p.update();
      p.draw();
    });

    activeBgAnimFrame = requestAnimationFrame(loop);
  }
  loop();
}

// 2.2 DIGITAL MATRIX RAIN
function initMatrixRain(ctx, color) {
  const canvas = activeBgCanvas;
  const columns = Math.floor(canvas.width / 16) + 1;
  const drops = Array(columns).fill(1);
  const chars = "0101XYZ{}<>/[]+-*%$_$#";

  matrixInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.08)'; // matrix fade color matching slate background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = 'JetBrains Mono, monospace 12px';

    drops.forEach((y, x) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(char, x * 16, y * 16);

      if (y * 16 > canvas.height && Math.random() > 0.985) {
        drops[x] = 0;
      }
      drops[x]++;
    });
  }, 45);
}

// 2.3 TWINKLING SPACE STARS
function initTwinklingStars(ctx, color) {
  const canvas = activeBgCanvas;
  starArray = [];

  class Star {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.4;
      this.alpha = Math.random();
      this.speed = Math.random() * 0.02 + 0.005;
    }
    draw() {
      ctx.fillStyle = hexToRgba(color, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    update() {
      this.alpha += this.speed;
      if (this.alpha <= 0 || this.alpha >= 1) {
        this.speed *= -1;
      }
    }
  }

  for (let i = 0; i < 150; i++) {
    starArray.push(new Star());
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    starArray.forEach(s => {
      s.update();
      s.draw();
    });
    activeBgAnimFrame = requestAnimationFrame(loop);
  }
  loop();
}

// ==========================================================================
// 3. PROFILE DATA RENDER & TYPING ANIMATION
// ==========================================================================

function renderClientProfile(profile) {
  // Check Maintenance Override
  if (profile.status === 'Maintenance') {
    // If not super-admin bypass, redirect or render maintenance view overlay
    const bypass = localStorage.getItem('super_admin_bypass_maint') === 'true';
    if (!bypass) {
      document.body.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background:#0f172a; color:#fff; text-align:center; padding:20px; font-family:'Plus Jakarta Sans', sans-serif;">
          <div style="font-size:4rem; margin-bottom:16px;">⚙️</div>
          <h1 style="font-family:'Orbitron', sans-serif; font-size:2rem; font-weight:900;">PORTFOLIO OFFLINE</h1>
          <p style="color:#94a3b8; max-width:480px; margin-top:8px; line-height:1.6;">The developer portfolio is currently undergoing scheduled updates. Please check back shortly.</p>
          <a href="index.html" class="dev-btn dev-btn-primary" style="margin-top:24px; padding:10px 24px;">🏠 Go to Student Store</a>
        </div>
      `;
      return;
    }
  }

  // Update simple texts
  const mappings = {
    'hero-title': profile.name || 'Vishal Kumar',
    'about-bio': profile.bio || '',
    'education-lbl': profile.education || '',
    'location-lbl': profile.location || ''
  };

  Object.entries(mappings).forEach(([cls, val]) => {
    const el = document.querySelector('.dev-' + cls);
    if (el) el.innerHTML = escapeHtml(val).replace(/\n/g, '<br>');
  });

  // Dynamic Avatar rendering
  const avatars = document.querySelectorAll('.dev-avatar-img');
  avatars.forEach(av => {
    av.src = profile.avatar || 'dev_avatar.png';
    av.alt = (profile.name || 'Vishal Kumar') + ' Avatar';
  });

  // Dynamic CV link
  const cvBtn = document.getElementById('portCvDownloadBtn');
  if (cvBtn) {
    if (profile.cvBase64) {
      cvBtn.href = profile.cvBase64;
      cvBtn.download = profile.cvName || 'Vishal_Kumar_CV.pdf';
      cvBtn.style.display = 'inline-flex';
      
      // Bind Analytics Click download event
      cvBtn.onclick = () => trackLinkClickEvent('CV Download', profile.cvName || 'CV');
    } else {
      cvBtn.style.display = 'none';
    }
  }

  // Setup Dynamic Typing Animation for Designation Tagline
  initTypingAnimation(profile.designation || "Founder of BCA Store | Full Stack Developer");

  // Load Skills grid elements
  renderClientSkills(profile.skills);

  // Load Experience Timeline elements
  renderClientExperience(profile.experience);
}

// Tagline Typewriter Animation
let typeTimeout = null;
function initTypingAnimation(taglineStr) {
  if (typeTimeout) clearTimeout(typeTimeout);

  const el = document.querySelector('.dev-hero-subtitle');
  if (!el) return;

  const roles = taglineStr.split('|').map(r => r.trim()).filter(Boolean);
  if (!roles.length) {
    el.textContent = taglineStr;
    return;
  }

  let roleIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function type() {
    const currentRole = roles[roleIdx];
    
    if (isDeleting) {
      el.textContent = currentRole.substring(0, charIdx - 1);
      charIdx--;
    } else {
      el.textContent = currentRole.substring(0, charIdx + 1);
      charIdx++;
    }

    // Adjust typing speeds
    let speed = isDeleting ? 30 : 60;
    
    if (!isDeleting && charIdx === currentRole.length) {
      // Pause at full word
      speed = 2200;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
      speed = 400; // brief pause before typing next
    }

    typeTimeout = setTimeout(type, speed);
  }
  
  el.innerHTML = '';
  type();
}

function renderClientSkills(skillsObj) {
  const techGrid = document.querySelector('#skills .dev-skills-column:first-child .dev-skills-grid');
  const softGrid = document.querySelector('#skills .dev-skills-column:last-child .dev-skills-grid');
  if (!techGrid || !softGrid) return;

  const tech = (skillsObj && skillsObj.tech) ? skillsObj.tech : [];
  const soft = (skillsObj && skillsObj.soft) ? skillsObj.soft : [];

  techGrid.innerHTML = tech.map(s => `
    <div class="dev-glass-card dev-skill-card">
      <span class="dev-skill-dot dot-cyan"></span>
      <span class="dev-skill-name">${escapeHtml(s)}</span>
    </div>
  `).join('');

  softGrid.innerHTML = soft.map(s => `
    <div class="dev-glass-card dev-skill-card">
      <span class="dev-skill-dot dot-purple"></span>
      <span class="dev-skill-name">${escapeHtml(s)}</span>
    </div>
  `).join('');

  // Setup float hover effects
  setupCardInteractions();
}

function renderClientExperience(expList) {
  const cont = document.getElementById('portExperienceTimelineClient');
  if (!cont) return;

  const list = expList || [];
  if (!list.length) {
    cont.parentElement.style.display = 'none'; // hide if empty
    return;
  }

  cont.parentElement.style.display = 'block';
  cont.innerHTML = list.map((exp, idx) => `
    <div class="dev-glass-card dev-ach-item" style="padding:24px; display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <h4 style="font-weight:800; font-size:1.15rem; color:#fff; display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.4rem;">💼</span> ${escapeHtml(exp.role)} @ <span class="dev-gradient-text" style="font-family:'Orbitron', monospace;">${escapeHtml(exp.company)}</span>
        </h4>
        <span style="font-size:0.8rem; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); padding:4px 10px; border-radius:50px; color:var(--color-accent); font-weight:700; font-family:'Orbitron', monospace;">${escapeHtml(exp.timeline)}</span>
      </div>
      <p style="font-size:0.95rem; color:var(--color-text-muted); line-height:1.5;">${escapeHtml(exp.description)}</p>
    </div>
  `).join('');
}

// ==========================================================================
// 4. SOCIAL LINKS RENDER
// ==========================================================================

function renderClientSocials(socialsObj) {
  const container = document.querySelector('.dev-social-list');
  if (!container) return;

  let list = [];
  Object.entries(socialsObj).forEach(([key, val]) => {
    list.push(val);
  });

  list.sort((a,b) => (a.order || 0) - (b.order || 0));

  const activeSocials = list.filter(item => item.enabled !== false);
  if (!activeSocials.length) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No social platforms active currently.</p>`;
    return;
  }

  container.innerHTML = activeSocials.map(item => {
    const platIcon = getPlatformIcon(item.platform, item.customIcon);
    let itemStyle = 'background:rgba(255,255,255,0.02);';
    if (item.platform === 'GitHub') itemStyle = 'background:rgba(36,41,46,0.1); border-color:rgba(36,41,46,0.2);';
    else if (item.platform === 'LinkedIn') itemStyle = 'background:rgba(0,119,181,0.1); border-color:rgba(0,119,181,0.2);';
    else if (item.platform === 'Instagram') itemStyle = 'background:linear-gradient(45deg, rgba(240,148,51,0.05) 0%, rgba(188,24,136,0.05) 100%); border-color:rgba(188,24,136,0.2);';

    return `
      <a href="${item.url}" target="_blank" onclick="trackLinkClickEvent('Social Link', '${item.platform}')" class="dev-glass-card dev-social-item" style="${itemStyle}">
        <span class="dev-social-icon" style="font-size:1.35rem; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.04); width:36px; height:36px; border-radius:8px;">${platIcon}</span>
        <span>${escapeHtml(item.platform)} Profile</span>
      </a>
    `;
  }).join('');
}

function getPlatformIcon(platform, customIcon) {
  const icons = {
    'GitHub': '🐙', 'LinkedIn': '🔗', 'Instagram': '📸', 'Facebook': '📘',
    'X (Twitter)': '🐦', 'YouTube': '📺', 'Telegram': '✈️', 'Discord': '👾',
    'Behance': '🎨', 'Dribbble': '🏀', 'Medium': '✍️', 'Stack Overflow': '💻',
    'LeetCode': '💡', 'HackerRank': '🏆', 'CodeChef': '👨‍💻', 'Codeforces': '🎯',
    'Personal Website': '🌐'
  };
  return icons[platform] || customIcon || '🔗';
}

// ==========================================================================
// 5. PROJECTS RENDER & SHOWCASE CONTROLLERS
// ==========================================================================

let clientProjectsData = [];

function renderClientProjects(projectsObj) {
  const cont = document.querySelector('.dev-projects-grid');
  if (!cont) return;

  clientProjectsData = [];
  Object.entries(projectsObj).forEach(([key, val]) => {
    clientProjectsData.push(val);
  });

  clientProjectsData.sort((a,b) => (a.order || 0) - (b.order || 0));

  // Build filter button list if not already created
  buildCategoryFilterButtons();

  renderFilteredProjectsList('All');
}

function buildCategoryFilterButtons() {
  const secHeader = document.querySelector('#projects .dev-section-header');
  if (!secHeader) return;

  let filterBar = document.getElementById('portProjectFilterBar');
  if (!filterBar) {
    filterBar = document.createElement('div');
    filterBar.id = 'portProjectFilterBar';
    filterBar.style.cssText = `
      display: flex; gap: 8px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap; margin-top: 15px;
    `;
    secHeader.appendChild(filterBar);
  }

  // Get list of active categories present in project data
  const cats = new Set(clientProjectsData.map(p => p.category || 'Web App'));
  const categoriesList = ['All', ...Array.from(cats)];

  // Inject search bar inside filterBar wrapper
  filterBar.innerHTML = `
    <div style="width:100%; display:flex; justify-content:center; margin-bottom:16px;">
      <div style="position:relative; width:100%; max-width:450px;">
        <span style="position:absolute; left:14px; top:12px; font-size:1rem; color:var(--color-text-muted);">🔍</span>
        <input type="text" id="portProjectSearch" oninput="handleProjectSearchInput(this.value)" placeholder="Search projects by stack tags or titles..." style="width:100%; padding:10px 20px 10px 42px; border-radius:30px; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.3); color:#fff; font-size:0.9rem; outline:none; transition:all 0.3s;" onfocus="this.style.borderColor='var(--color-accent)'" onblur="this.style.borderColor='rgba(255,255,255,0.08)'" />
      </div>
    </div>
    ${categoriesList.map(cat => `
      <button class="portfolio-sub-btn ${cat === 'All' ? 'active' : ''}" onclick="filterProjectsByCategory('${cat}', this)" style="padding:6px 14px; font-size:0.85rem; border-radius:20px;">${cat}</button>
    `).join('')}
  `;
}

let activeCategoryFilter = 'All';
let activeSearchQuery = '';

function filterProjectsByCategory(cat, btn) {
  // Toggle active button classes
  document.querySelectorAll('#portProjectFilterBar .portfolio-sub-btn').forEach(b => {
    b.classList.remove('active');
  });
  if (btn) btn.classList.add('active');

  activeCategoryFilter = cat;
  renderFilteredProjectsList(cat, activeSearchQuery);
}

function handleProjectSearchInput(query) {
  activeSearchQuery = query.toLowerCase().trim();
  renderFilteredProjectsList(activeCategoryFilter, activeSearchQuery);
}

function renderFilteredProjectsList(category, searchQuery = '') {
  const grid = document.querySelector('.dev-projects-grid');
  if (!grid) return;

  const filtered = clientProjectsData.filter(p => {
    if (p.archived) return false; // Hide archived projects
    
    // Category match
    const catMatch = category === 'All' || p.category === category;
    
    // Search query match
    let searchMatch = true;
    if (searchQuery) {
      const title = (p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const tags = (p.tags || []).map(t => t.toLowerCase()).join(' ');
      searchMatch = title.includes(searchQuery) || desc.includes(searchQuery) || tags.includes(searchQuery);
    }
    
    return catMatch && searchMatch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px 0; color:var(--color-text-muted); font-size:1.1rem;">No matching projects found in showcase.</div>`;
    return;
  }

  grid.innerHTML = filtered.map((item, idx) => {
    const numStr = item.number || `PROJECT // 0${idx + 1}`;
    const demoUrl = item.demoLink || '#';
    const isDemoAvailable = demoUrl && demoUrl !== '#';
    const featuredGlow = item.featured ? `box-shadow: 0 0 20px ${hexToRgba(item.featured ? 'var(--color-primary)' : '', '0.15')}` : '';

    // Generate screenshots rotation carousel if images are present
    const imagesList = item.screenshots || [];
    const hasScreenshots = imagesList.length > 0;
    
    return `
      <div class="dev-glass-card dev-project-card project-card-3d" data-id="${item.id}" style="${featuredGlow}; display:flex; flex-direction:column; overflow:hidden;">
        <!-- Logo & Featured badge header -->
        <div style="position:relative; width:100%; padding-bottom:56.25%; background:rgba(0,0,0,0.15)">
          <img class="project-carousel-img" src="${item.thumbnail || 'dev_avatar.png'}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition: opacity 0.5s ease-in-out;" />
          
          <!-- Screenshots mini carousel navigation dot triggers if screenshots are present -->
          ${hasScreenshots ? `
            <div style="position:absolute; bottom:12px; right:12px; display:flex; gap:6px; background:rgba(0,0,0,0.5); padding:4px 8px; border-radius:10px; z-index:10;">
              <span class="carousel-dot active" onclick="switchProjCarousel('${item.id}', -1)" style="width:6px; height:6px; border-radius:50%; background:#fff; cursor:pointer; opacity:1;"></span>
              ${imagesList.map((scr, sIdx) => `
                <span class="carousel-dot" onclick="switchProjCarousel('${item.id}', ${sIdx})" style="width:6px; height:6px; border-radius:50%; background:#fff; cursor:pointer; opacity:0.5;"></span>
              `).join('')}
            </div>
            <!-- Fullscreen trigger overlay icon -->
            <button onclick="openProjectScreenshotViewer('${item.id}')" style="position:absolute; top:12px; right:12px; width:30px; height:30px; background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.15); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; z-index:10; font-size:12px;" title="View Fullscreen Screenshots">🔍</button>
          ` : ''}

          <!-- Project logo overlay icon -->
          ${item.logo ? `<img src="${item.logo}" style="position:absolute; left:16px; bottom:-20px; width:50px; height:50px; border-radius:12px; object-fit:cover; border:2.5px solid var(--color-bg); background:var(--color-bg-card); z-index:5; box-shadow:0 8px 20px rgba(0,0,0,0.4);" />` : ''}
        </div>

        <div style="padding:28px 24px 24px; flex:1; display:flex; flex-direction:column; position:relative; z-index:2;">
          <div class="dev-proj-num" style="font-family:'Orbitron', monospace; font-size:0.75rem; color:var(--color-accent); font-weight:700;">${escapeHtml(numStr)}</div>
          <h3 class="dev-proj-title" style="font-size:1.35rem; font-weight:800; color:#fff; margin-top:6px;">${escapeHtml(item.title)}</h3>
          
          <p class="dev-proj-desc" style="font-size:0.95rem; color:var(--color-text-muted); line-height:1.5; margin-top:10px; flex:1;">${escapeHtml(item.description)}</p>
          
          <!-- Timeline and status -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px; margin-bottom:14px; color:var(--color-text-muted);">
            <span>📅 ${escapeHtml(item.timeline || 'N/A')}</span>
            <span>⭐ ${escapeHtml(item.stats || 'Live')}</span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="dev-proj-tags" style="display:flex; gap:6px; flex-wrap:wrap;">
              ${(item.tags || []).map(t => `<span class="dev-proj-tag" style="font-size:0.7rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:4px; padding:2px 8px; color:var(--color-text-muted);">${escapeHtml(t)}</span>`).join('')}
            </div>
            
            <div style="display:flex; gap:12px; align-items:center;">
              ${item.githubLink ? `<a href="${item.githubLink}" target="_blank" onclick="trackLinkClickEvent('Github Repo', '${item.title}')" style="font-size:1.25rem; text-decoration:none; opacity:0.75; transition:0.3s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.75'" title="GitHub Repository">🐙</a>` : ''}
              
              ${isDemoAvailable ? `
                <a href="${demoUrl}" target="_blank" onclick="trackLinkClickEvent('Project View', '${item.title}')" class="dev-proj-btn" style="font-size:0.9rem; color:var(--color-accent); font-weight:700; text-decoration:none; display:flex; align-items:center; gap:4px;">
                  Open ↗
                </a>
              ` : `
                <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:700;">In Progress</span>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Start 3D Card Hover Tilts
  setupCardInteractions();
}

// Dynamic project carousel screenshot switcher
function switchProjCarousel(projId, screenshotIndex) {
  const card = document.querySelector(`.dev-project-card[data-id="${projId}"]`);
  if (!card) return;

  const proj = clientProjectsData.find(p => p.id === projId);
  if (!proj) return;

  const img = card.querySelector('.project-carousel-img');
  const dots = card.querySelectorAll('.carousel-dot');
  if (!img) return;

  // Fade transition out
  img.style.opacity = '0';
  
  setTimeout(() => {
    if (screenshotIndex === -1) {
      // Load default thumbnail
      img.src = proj.thumbnail || 'dev_avatar.png';
    } else {
      // Load screenshot index
      img.src = proj.screenshots[screenshotIndex];
    }
    img.style.opacity = '1';
  }, 150);

  // Update dots indicator active highlight
  dots.forEach((dot, idx) => {
    dot.style.opacity = '0.5';
    // Offset standard index by 1 since default thumbnail is idx 0
    if (idx === (screenshotIndex + 1)) {
      dot.style.opacity = '1';
    }
  });
}

// Project Screenshots Modal Viewer
function openProjectScreenshotViewer(projId) {
  const proj = clientProjectsData.find(p => p.id === projId);
  if (!proj || !proj.screenshots || !proj.screenshots.length) return;

  let viewer = document.getElementById('portScreenshotViewerOverlay');
  if (!viewer) {
    viewer = document.createElement('div');
    viewer.id = 'portScreenshotViewerOverlay';
    viewer.style.cssText = `
      position: fixed; inset: 0; background: rgba(5,5,10,0.92); backdrop-filter: blur(10px);
      z-index: 1000000; display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; animation: regFadeIn 0.3s ease;
    `;
    document.body.appendChild(viewer);
  }

  viewer.style.display = 'flex';
  
  let currentIdx = 0;
  const updateViewerImage = () => {
    viewer.innerHTML = `
      <button onclick="document.getElementById('portScreenshotViewerOverlay').style.display='none'" style="position:absolute; top:24px; right:24px; background:transparent; border:none; color:#fff; font-size:2rem; cursor:pointer;">✕</button>
      <h3 style="position:absolute; top:24px; left:24px; font-family:'Orbitron',sans-serif; color:#fff;">${escapeHtml(proj.title)} Showcase</h3>
      
      <div style="position:relative; width:90%; max-width:900px; display:flex; align-items:center; justify-content:center;">
        <!-- Left handle -->
        <button id="viewerLeft" style="position:absolute; left:-24px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.5rem; cursor:pointer;">◀</button>
        
        <img src="${proj.screenshots[currentIdx]}" style="max-width:100%; max-height:75vh; border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.6); object-fit:contain; border:1px solid rgba(255,255,255,0.08);" />
        
        <!-- Right handle -->
        <button id="viewerRight" style="position:absolute; right:-24px; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.1); border-radius:50%; width:44px; height:44px; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.5rem; cursor:pointer;">▶</button>
      </div>

      <div style="margin-top:20px; color:#fff; font-weight:700;">Screenshot ${currentIdx + 1} of ${proj.screenshots.length}</div>
    `;

    // Bind navigation buttons
    document.getElementById('viewerLeft').onclick = (e) => {
      e.stopPropagation();
      currentIdx = (currentIdx - 1 + proj.screenshots.length) % proj.screenshots.length;
      updateViewerImage();
    };
    document.getElementById('viewerRight').onclick = (e) => {
      e.stopPropagation();
      currentIdx = (currentIdx + 1) % proj.screenshots.length;
      updateViewerImage();
    };
  };

  updateViewerImage();
}

// ==========================================================================
// 6. CONTACT SECTION & SECURE ANTI-SPAM INQUIRIES
// ==========================================================================

function renderClientContact(contact) {
  // Update footer email social links or footer text
  const emailLink = document.querySelector('.dev-social-item[href^="mailto:"]');
  if (emailLink) {
    emailLink.href = 'mailto:' + (contact.email || '10717vishal@gmail.com');
    emailLink.querySelector('span:last-child').textContent = contact.email || '10717vishal@gmail.com';
  }
}

function generateMathCaptcha() {
  const container = document.getElementById('captchaContainer');
  if (!container) return;

  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  mathCaptchaAnswer = num1 + num2;

  container.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:8px 16px;">
      <span style="font-family:'Orbitron', monospace; font-weight:700; color:var(--color-accent); font-size:0.95rem;">${num1} + ${num2} =</span>
      <input type="number" id="portFormCaptchaAnswer" required placeholder="?" style="width:60px; text-align:center; padding:6px; border:1px solid rgba(255,255,255,0.15); border-radius:6px; background:rgba(0,0,0,0.4); color:#fff; outline:none; font-family:'Orbitron', monospace;" />
      <span style="font-size:0.75rem; color:var(--color-text-muted);">Secure human verification</span>
    </div>
  `;
}

// Submit contact form directly to portfolio inquiries
async function submitDynamicPortfolioContact(event) {
  event.preventDefault();

  const name = document.getElementById('contact-name').value.trim();
  const email = document.getElementById('contact-email').value.trim();
  const subject = document.getElementById('contact-subject').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  const captchaInput = document.getElementById('portFormCaptchaAnswer');

  if (!captchaInput || parseInt(captchaInput.value) !== mathCaptchaAnswer) {
    if (typeof showToast === 'function') {
      showToast('❌ Captcha validation failed. Try again.', 'error');
    } else {
      alert('Captcha validation failed.');
    }
    generateMathCaptcha();
    return;
  }

  if (typeof db === 'undefined' || !db) {
    if (typeof showToast === 'function') {
      showToast('❌ DB connection not ready.', 'error');
    } else {
      alert('DB offline.');
    }
    return;
  }

  const btn = event.target.querySelector('button[type="submit"]');
  const oldText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '⚡ Securing Channel...';

  const inqData = {
    name,
    email,
    subject,
    message,
    status: 'New',
    timestamp: Date.now()
  };

  try {
    // Push new inquiry to portfolio
    await db.ref('developer_portfolio/inquiries').push(inqData);
    
    // Log conversion submit analytic
    db.ref('developer_portfolio/analytics/summary').once('value', snap => {
      if (snap.exists()) {
        const sum = snap.val();
        sum.contactSubmissions = (sum.contactSubmissions || 0) + 1;
        db.ref('developer_portfolio/analytics/summary').set(sum);
      }
    });

    if (typeof showToast === 'function') {
      showToast('🚀 Message delivered securely to Admin!', 'success');
    } else {
      alert('Message sent successfully!');
    }
    
    event.target.reset();
    generateMathCaptcha();
  } catch(e) {
    if (typeof showToast === 'function') {
      showToast('❌ Delivery failed: ' + e.message, 'error');
    } else {
      alert('Failed to send: ' + e.message);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = oldText;
  }
}

// ==========================================================================
// 7. FUTURISTIC COMPONENT UPGRADES & INTERACTIONS
// ==========================================================================

// 3D Parallax hover effect on cards
function setupCardInteractions() {
  const cards = document.querySelectorAll('.project-card-3d');
  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Compute angles based on width/height
      const rx = ((y - rect.height / 2) / (rect.height / 2)) * -10; // max 10 deg tilt
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-8px)`;
      card.style.transition = 'transform 0.05s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      card.style.transition = 'transform 0.4s ease';
    });
  });
}

// Generate dynamic portfolio QR code using public api server
function generatePortfolioQRCode() {
  const container = document.getElementById('portQrCodeContainer');
  if (!container) return;

  const currentUrl = encodeURIComponent(window.location.href);
  const size = 120;
  
  // Use public qrserver api to load image
  container.innerHTML = `
    <div style="background:#fff; border:4px solid #fff; border-radius:12px; width:${size + 8}px; height:${size + 8}px; box-shadow:0 10px 25px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; margin: 0 auto 12px;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${currentUrl}&color=0f172a" style="width:${size}px; height:${size}px;" alt="Portfolio QR Code" />
    </div>
    <span style="font-size:0.75rem; font-family:'Orbitron', monospace; font-weight:700; color:var(--color-accent); text-transform:uppercase; letter-spacing:1px;">Scan Virtual Card</span>
  `;
}

// Export vCard Digital Business Card
function downloadVCardBusinessCard() {
  trackLinkClickEvent('vCard Download', 'Vishal Kumar');

  // Fetch live info
  db.ref('developer_portfolio/profile').once('value', snap => {
    if (!snap.exists()) return;
    const profile = snap.val();

    // Create vCard structure
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:Kumar;Vishal;;;",
      `FN:${profile.name}`,
      `TITLE:${profile.designation}`,
      "ORG:BCA STORE",
      "TEL;TYPE=CELL;TYPE=PREF:+917633865663",
      "EMAIL;TYPE=PREF;TYPE=INTERNET:10717vishal@gmail.com",
      `URL:${window.location.href}`,
      "ADR;TYPE=WORK;TYPE=PREF:;;Motihari;Bihar;;India",
      "REV:" + new Date().toISOString(),
      "END:VCARD"
    ].join("\r\n");

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.name.replace(/\s+/g, '_')}_Business_Card.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (typeof showToast === 'function') {
      showToast('🗂️ Business Card downloaded to contacts!', 'success');
    }
  });
}

// Escape HTML utility helper
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
