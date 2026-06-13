// ==========================================================================
// DEVELOPER PORTFOLIO ADMINISTRATIVE CONTROL ENGINE
// Dynamic dashboard, canvas image cropper, drag & drop, inquiries tracker, analytics SVG charts, customizer presets
// ==========================================================================

let activeCropTarget = null; // 'avatar', 'projThumb', 'projLogo', 'projScreenshots'
let cropImg = new Image();

// Dynamic Crop Box State Variables
let imgDrawX = 0;
let imgDrawY = 0;
let imgDrawW = 0;
let imgDrawH = 0;
let cropBox = { x: 0, y: 0, w: 0, h: 0 };
let activeHandle = null; // 'tl', 'tr', 'bl', 'br', 'move', null
let isDraggingCrop = false;
let dragStartPointer = { x: 0, y: 0 };
let initialCropBox = { x: 0, y: 0, w: 0, h: 0 };
let tempScreenshots = []; // Holds screenshots for adding/editing project
let editProjectScreenshots = []; // Holds current screenshots for editing project

// Main initialization hook called from DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Firebase db to be available
  const dbCheck = setInterval(() => {
    if (typeof db !== 'undefined' && db) {
      clearInterval(dbCheck);
      initPortfolioAdmin();
    }
  }, 1000);
});

// INITIALIZE PORTFOLIO SYSTEM
function initPortfolioAdmin() {
  console.log("💼 Initializing Developer Portfolio Admin Module...");
  
  // Create default records if empty in Firebase
  db.ref('developer_portfolio').once('value', snap => {
    if (!snap.exists()) {
      setupDefaultPortfolioData();
    } else {
      loadAllPortfolioAdminData();
    }
  });

  // Setup live listeners for badges
  db.ref('developer_portfolio/inquiries').on('value', snap => {
    let newCount = 0;
    if (snap.exists()) {
      snap.forEach(c => {
        if (c.val().status === 'New') newCount++;
      });
    }
    const badge = document.getElementById('portInquiryBadge');
    if (badge) {
      badge.textContent = newCount;
      badge.style.display = newCount > 0 ? 'inline' : 'none';
    }
  });

  // Bind Canvas Cropper mouse events
  const canvas = document.getElementById('cropCanvas');
  if (canvas) {
    canvas.addEventListener('mousedown', startCropDrag);
    canvas.addEventListener('mousemove', e => {
      if (!isDraggingCrop) updateCursor(e);
    });
    window.addEventListener('mousemove', doCropDrag);
    window.addEventListener('mouseup', stopCropDrag);

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        e.preventDefault();
        startCropDrag(e.touches[0]);
      }
    }, {passive: false});
    window.addEventListener('touchmove', e => {
      if (isDraggingCrop && e.touches.length === 1) {
        e.preventDefault();
        doCropDrag(e.touches[0]);
      }
    }, {passive: false});
    window.addEventListener('touchend', stopCropDrag);
  }
}

// SETUP DEFAULT DATA IF FIREBASE NODE IS BLANK
function setupDefaultPortfolioData() {
  const defaults = {
    profile: {
      name: "Vishal Kumar",
      tagline: "Founder of BCA STORE | Full Stack Developer | Student Entrepreneur",
      designation: "Founder & CEO of BCA Store",
      bio: "I am Vishal Kumar, a passionate BCA student and technology enthusiast dedicated to revolutionizing education through innovation. As the Founder of BCA STORE, I am building an all-in-one digital ecosystem where BCA students can access premium study notes, video lectures, and AI support.",
      location: "Motihari, Bihar, India",
      education: "Bachelor of Computer Applications (BCA) — L.N.D. College, Motihari",
      skills: {
        tech: ["HTML5 / CSS3", "JavaScript", "React.js", "Firebase Suite", "Node.js API", "Database Mgmt", "Web Development", "UI/UX Thinking"],
        soft: ["Leadership", "Team Management", "Problem Solving", "Product Dev", "Community Building", "EdTech Innovation", "Agile Management", "Strategic Growth"]
      },
      experience: [
        { role: "Founder & CEO", company: "BCA STORE", timeline: "2024 - Present", description: "Revolutionizing Bihar EdTech with next-gen resources, LMS portals, and interactive test engines." },
        { role: "Full Stack Web Developer", company: "Freelance Solutions", timeline: "2022 - 2024", description: "Developed dynamic custom web sites, API servers, and databases for local enterprises." }
      ],
      resumeLink: "https://bcastore.com/resume",
      status: "Active"
    },
    socials: [
      { id: "s1", platform: "GitHub", url: "https://github.com", enabled: true, order: 0 },
      { id: "s2", platform: "LinkedIn", url: "https://linkedin.com", enabled: true, order: 1 },
      { id: "s3", platform: "Instagram", url: "https://instagram.com", enabled: true, order: 2 },
      { id: "s4", platform: "Email", url: "mailto:10717vishal@gmail.com", enabled: true, order: 3 }
    ],
    projects: {
      "p1": {
        id: "p1",
        title: "BCA STORE Platform",
        description: "India's Smartest Learning Hub for BCA Students. Loaded with interactive syllabus tracking, test engines, and live dynamic notices updates.",
        category: "Web App",
        tags: ["HTML", "CSS", "JS", "Firebase"],
        demoLink: "index.html",
        githubLink: "https://github.com",
        status: "Production",
        timeline: "Jan 2024 - Present",
        stats: "10k+ Active Students",
        featured: true,
        archived: false,
        order: 0
      }
    },
    contact: {
      email: "10717vishal@gmail.com",
      phone: "+917633865663",
      whatsapp: "+917633865663",
      telegram: "https://t.me/bcastoredesk",
      address: "Motihari, Bihar, India",
      meetingLink: "https://calendly.com",
      availability: "Available for Consultations"
    },
    config: {
      theme: "dark",
      primaryColor: "#6366f1",
      secondaryColor: "#8b5cf6",
      accentColor: "#06b6d4",
      bgColor: "#0f172a",
      fontFamily: "Plus Jakarta Sans",
      animations: "active",
      bgEffect: "particle",
      glassBlur: "20",
      glassOpacity: "0.45",
      cardStyle: "glass",
      layoutStyle: "modern"
    },
    analytics: {
      summary: {
        visitors: 154,
        uniqueVisitors: 89,
        views: 412,
        projectViews: 201,
        linkClicks: 110,
        contactSubmissions: 12,
        cvDownloads: 34
      }
    }
  };

  db.ref('developer_portfolio').set(defaults).then(() => {
    loadAllPortfolioAdminData();
  });
}

// LOAD ALL DATA TO INPUTS
function loadAllPortfolioAdminData() {
  loadPortfolioProfile();
  loadPortfolioSocials();
  loadPortfolioProjects();
  loadPortfolioInquiries();
  loadPortfolioAnalytics();
  loadCustomizerSettings();
}

// SUB-TAB NAVIGATION HANDLER
function switchPortfolioSubTab(subTab) {
  // Hide all sub-sections
  document.querySelectorAll('.port-sub-section').forEach(s => {
    s.style.display = 'none';
  });
  // Deactivate all sub nav links
  document.querySelectorAll('.portfolio-sub-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show selected sub-section
  const targetSec = document.getElementById('port-sec-' + subTab);
  if (targetSec) targetSec.style.display = 'block';

  // Find and activate button
  const activeBtn = Array.from(document.querySelectorAll('.portfolio-sub-btn')).find(b => b.textContent.toLowerCase().includes(subTab));
  if (activeBtn) activeBtn.classList.add('active');

  // Trigger specific sub-tab setups
  if (subTab === 'analytics') {
    setTimeout(renderAnalyticsCharts, 300);
  }
}

// ==========================================================================
// 1. PROFILE & PERSONAL INFO
// ==========================================================================

function loadPortfolioProfile() {
  db.ref('developer_portfolio/profile').on('value', snap => {
    if (!snap.exists()) return;
    const profile = snap.val();

    // Set simple fields
    const fields = ['name', 'tagline', 'designation', 'bio', 'location', 'education', 'resumeLink', 'status'];
    fields.forEach(f => {
      const el = document.getElementById('portProfile_' + f);
      if (el) el.value = profile[f] || '';
    });

    // Update avatar preview
    const preview = document.getElementById('portAvatarPreview');
    if (preview) {
      preview.src = profile.avatar || 'dev_avatar.png';
    }

    // Load Skills
    loadSkillsEditGrid(profile.skills);

    // Load Experience
    loadExperienceEditGrid(profile.experience);
  });
}

// Render skill list inside admin inputs
function loadSkillsEditGrid(skillsObj) {
  const techCont = document.getElementById('portSkillsTechList');
  const softCont = document.getElementById('portSkillsSoftList');
  if (!techCont || !softCont) return;

  const techSkills = (skillsObj && skillsObj.tech) ? skillsObj.tech : [];
  const softSkills = (skillsObj && skillsObj.soft) ? skillsObj.soft : [];

  techCont.innerHTML = techSkills.map((s, idx) => `
    <div class="skill-tag-edit" style="display:inline-flex; align-items:center; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); padding:4px 10px; border-radius:6px; margin:4px; font-size:0.85rem;">
      <span>${escapeHtml(s)}</span>
      <button type="button" onclick="removeSkillTag('tech', ${idx})" style="border:none; background:transparent; color:#ef4444; margin-left:8px; font-weight:700; cursor:pointer;">✕</button>
    </div>
  `).join('') + `<button type="button" onclick="promptAddSkillTag('tech')" style="padding:4px 10px; border:1px dashed rgba(255,255,255,0.2); background:transparent; border-radius:6px; color:var(--text-muted); cursor:pointer; margin:4px; font-size:0.85rem;">+ Add Skill</button>`;

  softCont.innerHTML = softSkills.map((s, idx) => `
    <div class="skill-tag-edit" style="display:inline-flex; align-items:center; background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); padding:4px 10px; border-radius:6px; margin:4px; font-size:0.85rem;">
      <span>${escapeHtml(s)}</span>
      <button type="button" onclick="removeSkillTag('soft', ${idx})" style="border:none; background:transparent; color:#ef4444; margin-left:8px; font-weight:700; cursor:pointer;">✕</button>
    </div>
  `).join('') + `<button type="button" onclick="promptAddSkillTag('soft')" style="padding:4px 10px; border:1px dashed rgba(255,255,255,0.2); background:transparent; border-radius:6px; color:var(--text-muted); cursor:pointer; margin:4px; font-size:0.85rem;">+ Add Skill</button>`;
}

async function promptAddSkillTag(type) {
  const skill = prompt(`Enter new ${type === 'tech' ? 'Technical' : 'Soft'} Skill:`);
  if (!skill || !skill.trim()) return;

  try {
    const snap = await db.ref(`developer_portfolio/profile/skills/${type}`).once('value');
    let list = snap.val() || [];
    list.push(skill.trim());
    await db.ref(`developer_portfolio/profile/skills/${type}`).set(list);
    showAdminNotification("✅ Skill added successfully!", "success");
  } catch(e) {
    showAdminNotification("❌ Save failed: " + e.message, "error");
  }
}

async function removeSkillTag(type, index) {
  try {
    const snap = await db.ref(`developer_portfolio/profile/skills/${type}`).once('value');
    let list = snap.val() || [];
    list.splice(index, 1);
    await db.ref(`developer_portfolio/profile/skills/${type}`).set(list);
    showAdminNotification("🗑️ Skill tag removed", "success");
  } catch(e) {
    showAdminNotification("❌ Removal failed: " + e.message, "error");
  }
}

// Render experiences list inside admin inputs
function loadExperienceEditGrid(expList) {
  const cont = document.getElementById('portExperienceEditList');
  if (!cont) return;

  const list = expList || [];
  if (!list.length) {
    cont.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem;">No experiences defined. Click below to add.</p>`;
    return;
  }

  cont.innerHTML = list.map((exp, idx) => `
    <div class="exp-edit-card" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:16px; margin-bottom:12px; position:relative;">
      <div style="font-weight:700; font-size:1.05rem; color:#fff;">${escapeHtml(exp.role)} @ ${escapeHtml(exp.company)}</div>
      <div style="font-size:0.85rem; color:var(--accent-blue); font-weight:600; margin-top:2px;">${escapeHtml(exp.timeline)}</div>
      <div style="font-size:0.85rem; color:var(--text-muted); margin-top:6px; line-height:1.4;">${escapeHtml(exp.description)}</div>
      <div style="position:absolute; top:12px; right:12px; display:flex; gap:8px;">
        <button type="button" onclick="editExperienceModal(${idx})" class="btn-outline" style="padding:4px 8px; font-size:0.75rem;">✏️ Edit</button>
        <button type="button" onclick="removeExperience(${idx})" class="btn-outline" style="padding:4px 8px; font-size:0.75rem; color:#ef4444; border-color:rgba(239,68,68,0.2)">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

async function removeExperience(index) {
  if (!confirm("Are you sure you want to delete this experience?")) return;
  try {
    const snap = await db.ref(`developer_portfolio/profile/experience`).once('value');
    let list = snap.val() || [];
    list.splice(index, 1);
    await db.ref(`developer_portfolio/profile/experience`).set(list);
    showAdminNotification("🗑️ Experience deleted", "success");
  } catch(e) {
    showAdminNotification("❌ Delete failed: " + e.message, "error");
  }
}

// Modal experiences triggers
function showAddExperienceModal() {
  document.getElementById('expModalTitle').textContent = '➕ Add Experience';
  document.getElementById('editExpIdx').value = '-1';
  document.getElementById('portExpRole').value = '';
  document.getElementById('portExpCompany').value = '';
  document.getElementById('portExpTimeline').value = '';
  document.getElementById('portExpDesc').value = '';
  
  document.getElementById('portExpModal').style.display = 'flex';
}

async function editExperienceModal(index) {
  try {
    const snap = await db.ref(`developer_portfolio/profile/experience/${index}`).once('value');
    if (!snap.exists()) return;
    const exp = snap.val();

    document.getElementById('expModalTitle').textContent = '✏️ Edit Experience';
    document.getElementById('editExpIdx').value = index;
    document.getElementById('portExpRole').value = exp.role || '';
    document.getElementById('portExpCompany').value = exp.company || '';
    document.getElementById('portExpTimeline').value = exp.timeline || '';
    document.getElementById('portExpDesc').value = exp.description || '';

    document.getElementById('portExpModal').style.display = 'flex';
  } catch(e) {
    showAdminNotification("❌ Load error: " + e.message, "error");
  }
}

function closeExpModal() {
  document.getElementById('portExpModal').style.display = 'none';
}

async function saveExperience() {
  const idx = parseInt(document.getElementById('editExpIdx').value);
  const role = document.getElementById('portExpRole').value.trim();
  const company = document.getElementById('portExpCompany').value.trim();
  const timeline = document.getElementById('portExpTimeline').value.trim();
  const description = document.getElementById('portExpDesc').value.trim();

  if (!role || !company || !timeline || !description) {
    showAdminNotification("❌ All fields are required.", "error");
    return;
  }

  showAdminNotification("⏳ Syncing experience...", "pending");
  try {
    const snap = await db.ref(`developer_portfolio/profile/experience`).once('value');
    let list = snap.val() || [];
    const expData = { role, company, timeline, description };

    if (idx === -1) {
      list.push(expData);
    } else {
      list[idx] = expData;
    }

    await db.ref(`developer_portfolio/profile/experience`).set(list);
    showAdminNotification("✅ Experience sync successful!", "success");
    closeExpModal();
  } catch(e) {
    showAdminNotification("❌ Save failed: " + e.message, "error");
  }
}

// SAVE PROFILE MAIN FIELDS
async function savePortfolioProfile() {
  showAdminNotification("⏳ Saving Profile Info...", "pending");
  
  const updates = {};
  const fields = ['name', 'tagline', 'designation', 'bio', 'location', 'education', 'resumeLink', 'status'];
  fields.forEach(f => {
    const el = document.getElementById('portProfile_' + f);
    if (el) updates[f] = el.value.trim();
  });

  try {
    await db.ref('developer_portfolio/profile').update(updates);
    showAdminNotification("✅ Profile details published successfully!", "success");
  } catch(error) {
    showAdminNotification("❌ Database save error: " + error.message, "error");
  }
}

// CV File Upload Helper (converts to dynamic url or keeps data url if small)
async function uploadDeveloperCV(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) { // Limit to 2MB for Firebase
    showAdminNotification("❌ CV size too large. Keep under 2MB.", "error");
    input.value = '';
    return;
  }

  showAdminNotification("⏳ Uploading and optimizing CV file...", "pending");
  const reader = new FileReader();
  reader.onload = async (e) => {
    const cvBase64 = e.target.result;
    try {
      await db.ref('developer_portfolio/profile').update({
        cvBase64: cvBase64,
        cvName: file.name
      });
      showAdminNotification("✅ CV Uploaded successfully!", "success");
    } catch(err) {
      showAdminNotification("❌ CV upload failed: " + err.message, "error");
    }
  };
  reader.readAsDataURL(file);
}

// ==========================================================================
// 2. CANVAS CROPPER & COMPRESSOR
// ==========================================================================

function triggerImageUpload(target) {
  activeCropTarget = target;
  
  const input = document.getElementById('portImageFileInput');
  if (input) {
    input.value = '';
    // Customize file formats for presets
    input.click();
  }
}

function handleImageCropSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
    showAdminNotification("❌ Invalid image format. Select WebP, JPG, or PNG.", "error");
    return;
  }

  if (file.size > 1 * 1024 * 1024) {
    showAdminNotification("❌ Image size must be 1 MB or less.", "error");
    alert("Image size must be 1 MB or less.");
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    cropImg = new Image();
    cropImg.onload = function() {
      // Show Crop Modal
      document.getElementById('portCropModal').style.display = 'flex';
      
      const canvas = document.getElementById('cropCanvas');
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const imgW = cropImg.width;
      const imgH = cropImg.height;
      
      // Calculate fit dimensions (contain style)
      let dWidth = imgW;
      let dHeight = imgH;
      const ratio = imgW / imgH;
      if (dWidth > canvasW) {
        dWidth = canvasW;
        dHeight = dWidth / ratio;
      }
      if (dHeight > canvasH) {
        dHeight = canvasH;
        dWidth = dHeight * ratio;
      }
      
      imgDrawW = dWidth;
      imgDrawH = dHeight;
      imgDrawX = (canvasW - dWidth) / 2;
      imgDrawY = (canvasH - dHeight) / 2;
      
      // Initialize cropBox centered inside the fitted image (80% size)
      cropBox = {
        x: imgDrawX + imgDrawW * 0.1,
        y: imgDrawY + imgDrawH * 0.1,
        w: imgDrawW * 0.8,
        h: imgDrawH * 0.8
      };
      
      // Setup default slider value for compatibility
      const zoomSlider = document.getElementById('cropZoomSlider');
      if (zoomSlider) zoomSlider.value = '100';

      drawCropCanvas();
    };
    cropImg.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function drawCropCanvas() {
  const canvas = document.getElementById('cropCanvas');
  if (!canvas || !cropImg.src) return;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw background
  ctx.fillStyle = '#070a13';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw static image fitted
  ctx.drawImage(cropImg, imgDrawX, imgDrawY, imgDrawW, imgDrawH);

  // 3. Draw semi-transparent black overlay outside the cropBox
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  // Top
  ctx.fillRect(0, 0, canvas.width, cropBox.y);
  // Bottom
  ctx.fillRect(0, cropBox.y + cropBox.h, canvas.width, canvas.height - (cropBox.y + cropBox.h));
  // Left
  ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.h);
  // Right
  ctx.fillRect(cropBox.x + cropBox.w, cropBox.y, canvas.width - (cropBox.x + cropBox.w), cropBox.h);

  // 4. Draw premium border outline (Indigo)
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.strokeRect(cropBox.x, cropBox.y, cropBox.w, cropBox.h);

  // 5. Draw white corner viewfinder brackets
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  const len = 12; // Length of the L-shape corner line
  
  // Top-Left corner
  ctx.beginPath();
  ctx.moveTo(cropBox.x + len, cropBox.y);
  ctx.lineTo(cropBox.x, cropBox.y);
  ctx.lineTo(cropBox.x, cropBox.y + len);
  ctx.stroke();
  
  // Top-Right corner
  ctx.beginPath();
  ctx.moveTo(cropBox.x + cropBox.w - len, cropBox.y);
  ctx.lineTo(cropBox.x + cropBox.w, cropBox.y);
  ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + len);
  ctx.stroke();
  
  // Bottom-Left corner
  ctx.beginPath();
  ctx.moveTo(cropBox.x, cropBox.y + cropBox.h - len);
  ctx.lineTo(cropBox.x, cropBox.y + cropBox.h);
  ctx.lineTo(cropBox.x + len, cropBox.y + cropBox.h);
  ctx.stroke();
  
  // Bottom-Right corner
  ctx.beginPath();
  ctx.moveTo(cropBox.x + cropBox.w - len, cropBox.y + cropBox.h);
  ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h);
  ctx.lineTo(cropBox.x + cropBox.w, cropBox.y + cropBox.h - len);
  ctx.stroke();

  // 6. Draw circular drag handles at corners
  ctx.fillStyle = '#6366f1';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  const r = 6;
  const drawCircleHandle = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  drawCircleHandle(cropBox.x, cropBox.y);
  drawCircleHandle(cropBox.x + cropBox.w, cropBox.y);
  drawCircleHandle(cropBox.x, cropBox.y + cropBox.h);
  drawCircleHandle(cropBox.x + cropBox.w, cropBox.y + cropBox.h);
}

// Kept for backward compatibility
function handleZoomSlider(val) {
  drawCropCanvas();
}

const HANDLE_SIZE = 16; // Hit test radius

function getActiveHandle(clientX, clientY) {
  const canvas = document.getElementById('cropCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const pointerX = (clientX - rect.left) * scaleX;
  const pointerY = (clientY - rect.top) * scaleY;
  
  const tl = { x: cropBox.x, y: cropBox.y };
  const tr = { x: cropBox.x + cropBox.w, y: cropBox.y };
  const bl = { x: cropBox.x, y: cropBox.y + cropBox.h };
  const br = { x: cropBox.x + cropBox.w, y: cropBox.y + cropBox.h };
  
  const near = (p, x, y) => Math.hypot(p.x - x, p.y - y) < HANDLE_SIZE;
  
  if (near(tl, pointerX, pointerY)) return 'tl';
  if (near(tr, pointerX, pointerY)) return 'tr';
  if (near(bl, pointerX, pointerY)) return 'bl';
  if (near(br, pointerX, pointerY)) return 'br';
  
  if (pointerX >= cropBox.x && pointerX <= cropBox.x + cropBox.w &&
      pointerY >= cropBox.y && pointerY <= cropBox.y + cropBox.h) {
    return 'move';
  }
  
  return null;
}

function updateCursor(e) {
  if (isDraggingCrop) return;
  const handle = getActiveHandle(e.clientX, e.clientY);
  const canvas = document.getElementById('cropCanvas');
  if (!canvas) return;
  
  if (handle === 'tl' || handle === 'br') {
    canvas.style.cursor = 'nwse-resize';
  } else if (handle === 'tr' || handle === 'bl') {
    canvas.style.cursor = 'nesw-resize';
  } else if (handle === 'move') {
    canvas.style.cursor = 'move';
  } else {
    canvas.style.cursor = 'default';
  }
}

function startCropDrag(e) {
  const handle = getActiveHandle(e.clientX, e.clientY);
  if (!handle) return;

  isDraggingCrop = true;
  activeHandle = handle;
  
  const canvas = document.getElementById('cropCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  dragStartPointer = {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
  initialCropBox = { ...cropBox };
}

function doCropDrag(e) {
  if (!isDraggingCrop) return;
  
  const canvas = document.getElementById('cropCanvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  const pointerX = (e.clientX - rect.left) * scaleX;
  const pointerY = (e.clientY - rect.top) * scaleY;
  
  const dx = pointerX - dragStartPointer.x;
  const dy = pointerY - dragStartPointer.y;
  
  const MIN_SIZE = 15;
  const xMin = imgDrawX;
  const xMax = imgDrawX + imgDrawW;
  const yMin = imgDrawY;
  const yMax = imgDrawY + imgDrawH;
  
  if (activeHandle === 'tl') {
    cropBox.x = Math.max(xMin, Math.min(pointerX, initialCropBox.x + initialCropBox.w - MIN_SIZE));
    cropBox.w = (initialCropBox.x + initialCropBox.w) - cropBox.x;
    cropBox.y = Math.max(yMin, Math.min(pointerY, initialCropBox.y + initialCropBox.h - MIN_SIZE));
    cropBox.h = (initialCropBox.y + initialCropBox.h) - cropBox.y;
  } else if (activeHandle === 'tr') {
    const targetRight = Math.max(initialCropBox.x + MIN_SIZE, Math.min(pointerX, xMax));
    cropBox.w = targetRight - initialCropBox.x;
    cropBox.y = Math.max(yMin, Math.min(pointerY, initialCropBox.y + initialCropBox.h - MIN_SIZE));
    cropBox.h = (initialCropBox.y + initialCropBox.h) - cropBox.y;
  } else if (activeHandle === 'bl') {
    cropBox.x = Math.max(xMin, Math.min(pointerX, initialCropBox.x + initialCropBox.w - MIN_SIZE));
    cropBox.w = (initialCropBox.x + initialCropBox.w) - cropBox.x;
    const targetBottom = Math.max(initialCropBox.y + MIN_SIZE, Math.min(pointerY, yMax));
    cropBox.h = targetBottom - initialCropBox.y;
  } else if (activeHandle === 'br') {
    const targetRight = Math.max(initialCropBox.x + MIN_SIZE, Math.min(pointerX, xMax));
    cropBox.w = targetRight - initialCropBox.x;
    const targetBottom = Math.max(initialCropBox.y + MIN_SIZE, Math.min(pointerY, yMax));
    cropBox.h = targetBottom - initialCropBox.y;
  } else if (activeHandle === 'move') {
    let newX = initialCropBox.x + dx;
    let newY = initialCropBox.y + dy;
    
    newX = Math.max(xMin, Math.min(newX, xMax - initialCropBox.w));
    newY = Math.max(yMin, Math.min(newY, yMax - initialCropBox.h));
    
    cropBox.x = newX;
    cropBox.y = newY;
  }
  
  drawCropCanvas();
}

function stopCropDrag() {
  isDraggingCrop = false;
  activeHandle = null;
}

function closeCropModal() {
  document.getElementById('portCropModal').style.display = 'none';
  activeCropTarget = null;
}

function applyCropSelection() {
  if (!cropImg.src) return;

  // 1. Calculate map coordinates back to original image
  const scale = cropImg.width / imgDrawW;
  
  const relX = cropBox.x - imgDrawX;
  const relY = cropBox.y - imgDrawY;
  
  const origX = Math.max(0, relX * scale);
  const origY = Math.max(0, relY * scale);
  const origW = Math.min(cropImg.width - origX, cropBox.w * scale);
  const origH = Math.min(cropImg.height - origY, cropBox.h * scale);
  
  // 2. Enforce max bound (800px) to prevent oversized payloads
  let destW = origW;
  let destH = origH;
  const maxBound = 800;
  if (destW > maxBound || destH > maxBound) {
    if (destW > destH) {
      destH = (maxBound / destW) * destH;
      destW = maxBound;
    } else {
      destW = (maxBound / destH) * destW;
      destH = maxBound;
    }
  }

  // Create temporary offscreen rendering canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = destW;
  outCanvas.height = destH;
  const outCtx = outCanvas.getContext('2d');

  // Fill white background for JPEG flattening
  outCtx.fillStyle = '#ffffff';
  outCtx.fillRect(0, 0, destW, destH);

  // Draw the crop region from the original image onto the output canvas
  outCtx.drawImage(
    cropImg,
    origX, origY, origW, origH,
    0, 0, destW, destH
  );

  // Compress to JPEG with 0.8 quality
  const base64Data = outCanvas.toDataURL('image/jpeg', 0.8);

  saveCroppedImageToTarget(base64Data);
  closeCropModal();
}

// SAVE THE BASE64 STRING TO SPECIFIED NODE
async function saveCroppedImageToTarget(base64Data) {
  showAdminNotification("⏳ Optimizing and saving image...", "pending");
  try {
    if (activeCropTarget === 'avatar') {
      await db.ref('developer_portfolio/profile').update({ avatar: base64Data });
      document.getElementById('portAvatarPreview').src = base64Data;
      showAdminNotification("✅ Profile photo updated!", "success");
    } else if (activeCropTarget === 'projThumb') {
      document.getElementById('projEdit_thumb_preview').src = base64Data;
      document.getElementById('projEdit_thumb_base64').value = base64Data;
      showAdminNotification("📸 Thumbnail cropped and staged!", "success");
    } else if (activeCropTarget === 'projLogo') {
      document.getElementById('projEdit_logo_preview').src = base64Data;
      document.getElementById('projEdit_logo_base64').value = base64Data;
      showAdminNotification("🎨 Logo cropped and staged!", "success");
    } else if (activeCropTarget === 'projScreenshots') {
      tempScreenshots.push(base64Data);
      renderTempScreenshotsGrid();
      showAdminNotification("🖼️ Screenshot added!", "success");
    }
  } catch(error) {
    showAdminNotification("❌ Image save error: " + error.message, "error");
  }
}

// Renders the screenshots inside add/edit project form
function renderTempScreenshotsGrid() {
  const cont = document.getElementById('projEdit_screenshots_grid');
  if (!cont) return;

  if (!tempScreenshots.length) {
    cont.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); grid-column:1/-1;">No screenshots added yet.</p>`;
    return;
  }

  cont.innerHTML = tempScreenshots.map((scr, idx) => `
    <div style="position:relative; border-radius:8px; border:1px solid rgba(255,255,255,0.08); overflow:hidden; padding-bottom:56.25%;">
      <img src="${scr}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
      <button type="button" onclick="removeTempScreenshot(${idx})" style="position:absolute; top:4px; right:4px; width:22px; height:22px; background:#ef4444; color:#fff; border:none; border-radius:50%; font-size:10px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3)">✕</button>
    </div>
  `).join('');
}

function removeTempScreenshot(index) {
  tempScreenshots.splice(index, 1);
  renderTempScreenshotsGrid();
}

// Preset photo helpers (loads standard abstract templates)
async function applyPhotoPreset(presetUrl) {
  showAdminNotification("⏳ Loading profile preset...", "pending");
  try {
    // Convert asset path/preset to small canvas base64 to prevent offline resource failure
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw generic colored avatar for offline backup
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    const col = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillStyle = col;
    ctx.fillRect(0,0,300,300);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VK', 150, 150);

    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    await db.ref('developer_portfolio/profile').update({ avatar: base64 });
    document.getElementById('portAvatarPreview').src = base64;
    showAdminNotification("✅ Avatar preset applied!", "success");
  } catch(e) {
    showAdminNotification("❌ Preset load failed: " + e.message, "error");
  }
}

// Remove Profile Photo (fallback to letter logo avatar)
async function removeProfilePhoto() {
  if (!confirm("Remove profile photo? This falls back to generic initials.")) return;
  
  showAdminNotification("⏳ Removing photo...", "pending");
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(0,0,300,300);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 120px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', 150, 150);
    const fallbackBase64 = canvas.toDataURL('image/jpeg', 0.8);

    await db.ref('developer_portfolio/profile').update({ avatar: fallbackBase64 });
    document.getElementById('portAvatarPreview').src = fallbackBase64;
    showAdminNotification("✅ Profile image cleared!", "success");
  } catch(error) {
    showAdminNotification("❌ Save error: " + error.message, "error");
  }
}

// ==========================================================================
// 3. SOCIAL LINKS & PROFILE LINKS CRUD
// ==========================================================================

function loadPortfolioSocials() {
  db.ref('developer_portfolio/socials').on('value', snap => {
    const listCont = document.getElementById('portSocialLinksList');
    if (!listCont) return;

    if (!snap.exists()) {
      listCont.innerHTML = `<p style="color:var(--text-muted); padding:16px 0;">No social profiles. Add one below.</p>`;
      return;
    }

    let items = [];
    snap.forEach(child => {
      items.push({ id: child.key, ...child.val() });
    });

    // Sort by order parameter
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    listCont.innerHTML = items.map(item => {
      const activeText = item.enabled ? 'Enabled' : 'Disabled';
      const activeClass = item.enabled ? 'status-active' : 'status-disabled';
      const activeColor = item.enabled ? '#10b981' : '#6b7280';
      const platIcon = getPlatformIcon(item.platform, item.customIcon);

      return `
        <div class="social-link-item" data-id="${item.id}" draggable="true" ondragstart="handleSocialDragStart(event)" ondragover="handleSocialDragOver(event)" ondrop="handleSocialDrop(event)" ondragend="handleSocialDragEnd(event)" style="display:flex; align-items:center; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:12px 16px; margin-bottom:10px; cursor:move; transition:all 0.2s;">
          <div style="font-size:1.4rem; margin-right:12px; display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:rgba(255,255,255,0.04); border-radius:8px;">${platIcon}</div>
          <div style="flex:1;">
            <div style="font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">
              ${escapeHtml(item.platform)}
              <span style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:4px; font-size:9px; padding:1px 4px; color:${activeColor}; font-weight:700;">${activeText}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(item.url)}</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <!-- Enable/Disable toggle switch -->
            <label class="switch-container" style="width:40px; height:20px;">
              <input type="checkbox" ${item.enabled ? 'checked' : ''} onchange="toggleSocialStatus('${item.id}', this.checked)" style="display:none;" />
              <span class="switch-slider" style="border-radius:20px; background:${item.enabled ? '#10b981' : '#374151'}; position:absolute; inset:0; cursor:pointer; transition:0.3s; display:block;"></span>
            </label>
            <button onclick="editSocialLinkModal('${item.id}')" class="btn-outline" style="padding:6px 10px; font-size:0.8rem;">✏️</button>
            <button onclick="deleteSocialLink('${item.id}')" class="btn-outline" style="padding:6px 10px; font-size:0.8rem; color:#ef4444; border-color:rgba(239,68,68,0.2)">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  });
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

function handleCustomPlatformToggle(select) {
  const row = document.getElementById('customPlatDetailsRow');
  if (!row) return;
  if (select.value === 'Custom') {
    row.style.display = 'grid';
  } else {
    row.style.display = 'none';
  }
}

// Drag & Drop Sorting Socials
let draggedSocialId = null;

function handleSocialDragStart(e) {
  draggedSocialId = e.currentTarget.getAttribute('data-id');
  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleSocialDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

async function handleSocialDrop(e) {
  e.preventDefault();
  const targetId = e.currentTarget.getAttribute('data-id');
  if (draggedSocialId === targetId) return;

  try {
    const snap = await db.ref('developer_portfolio/socials').once('value');
    if (!snap.exists()) return;

    let items = [];
    snap.forEach(c => {
      items.push({ id: c.key, ...c.val() });
    });

    items.sort((a,b) => (a.order || 0) - (b.order || 0));

    // Find indices
    const draggedIdx = items.findIndex(item => item.id === draggedSocialId);
    const targetIdx = items.findIndex(item => item.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Reorder array
    const [removed] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, removed);

    // Save updated positions
    const updates = {};
    items.forEach((item, index) => {
      updates[`socials/${item.id}/order`] = index;
    });

    await db.ref('developer_portfolio').update(updates);
    showAdminNotification("↕️ Links reordered successfully!", "success");
  } catch(err) {
    showAdminNotification("❌ Reorder failed: " + err.message, "error");
  }
}

function handleSocialDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  draggedSocialId = null;
}

// Open modals for social URLs
function showAddSocialLinkModal() {
  document.getElementById('socialModalTitle').textContent = '➕ Add Social Link';
  document.getElementById('editSocialId').value = '-1';
  document.getElementById('portSocialPlatform').value = 'GitHub';
  document.getElementById('portSocialUrl').value = '';
  document.getElementById('portSocialCustomName').value = '';
  document.getElementById('portSocialCustomIcon').value = '🔗';
  document.getElementById('portSocialEnabled').checked = true;
  document.getElementById('customPlatDetailsRow').style.display = 'none';

  document.getElementById('portSocialModal').style.display = 'flex';
}

async function editSocialLinkModal(id) {
  try {
    const snap = await db.ref(`developer_portfolio/socials/${id}`).once('value');
    if (!snap.exists()) return;
    const item = snap.val();

    document.getElementById('socialModalTitle').textContent = '✏️ Edit Social Link';
    document.getElementById('editSocialId').value = id;
    
    // Check if platform is custom or standard
    const select = document.getElementById('portSocialPlatform');
    const platforms = Array.from(select.options).map(opt => opt.value);
    
    if (platforms.includes(item.platform)) {
      select.value = item.platform;
      document.getElementById('customPlatDetailsRow').style.display = 'none';
    } else {
      select.value = 'Custom';
      document.getElementById('portSocialCustomName').value = item.platform;
      document.getElementById('portSocialCustomIcon').value = item.customIcon || '🔗';
      document.getElementById('customPlatDetailsRow').style.display = 'grid';
    }

    document.getElementById('portSocialUrl').value = item.url || '';
    document.getElementById('portSocialEnabled').checked = item.enabled !== false;

    document.getElementById('portSocialModal').style.display = 'flex';
  } catch(e) {
    showAdminNotification("❌ Load error: " + e.message, "error");
  }
}

function closeSocialModal() {
  document.getElementById('portSocialModal').style.display = 'none';
}

async function saveSocialLink() {
  const id = document.getElementById('editSocialId').value;
  const platSelect = document.getElementById('portSocialPlatform').value;
  const url = document.getElementById('portSocialUrl').value.trim();
  const enabled = document.getElementById('portSocialEnabled').checked;

  let platformName = platSelect;
  let customIcon = '';

  if (platSelect === 'Custom') {
    platformName = document.getElementById('portSocialCustomName').value.trim();
    customIcon = document.getElementById('portSocialCustomIcon').value.trim() || '🔗';
    if (!platformName) {
      showAdminNotification("❌ Custom platform name required.", "error");
      return;
    }
  }

  if (!url) {
    showAdminNotification("❌ Platform URL is required.", "error");
    return;
  }

  showAdminNotification("⏳ Syncing social link...", "pending");
  try {
    const record = {
      platform: platformName,
      url: url,
      enabled: enabled
    };
    if (customIcon) record.customIcon = customIcon;

    if (id === '-1') {
      // Create new
      const socialsSnap = await db.ref('developer_portfolio/socials').once('value');
      const order = socialsSnap.numChildren();
      record.order = order;
      
      const newRef = db.ref('developer_portfolio/socials').push();
      record.id = newRef.key;
      await newRef.set(record);
    } else {
      // Edit existing
      await db.ref(`developer_portfolio/socials/${id}`).update(record);
    }

    showAdminNotification("✅ Social link saved successfully!", "success");
    closeSocialModal();
  } catch(err) {
    showAdminNotification("❌ Save error: " + err.message, "error");
  }
}

async function toggleSocialStatus(id, checked) {
  try {
    await db.ref(`developer_portfolio/socials/${id}`).update({ enabled: checked });
    showAdminNotification("🔄 Platform state updated", "success");
  } catch(e) {
    showAdminNotification("❌ Update failed: " + e.message, "error");
  }
}

async function deleteSocialLink(id) {
  if (!confirm("Are you sure you want to delete this link?")) return;
  showAdminNotification("⏳ Deleting link...", "pending");
  try {
    await db.ref(`developer_portfolio/socials/${id}`).remove();
    showAdminNotification("🗑️ Link deleted!", "success");
  } catch(e) {
    showAdminNotification("❌ Delete failed: " + e.message, "error");
  }
}

// ==========================================================================
// 4. PROJECT MANAGEMENT SYSTEM
// ==========================================================================

function loadPortfolioProjects() {
  db.ref('developer_portfolio/projects').on('value', snap => {
    const grid = document.getElementById('portProjectsGridList');
    if (!grid) return;

    if (!snap.exists()) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:32px 0; color:var(--text-muted);">No projects defined. Click 'Add Project' to get started.</div>`;
      return;
    }

    let list = [];
    snap.forEach(c => {
      list.push(c.val());
    });

    // Order by position
    list.sort((a,b) => (a.order || 0) - (b.order || 0));

    grid.innerHTML = list.map(item => {
      const featText = item.featured ? '⭐ Featured' : 'Standard';
      const featColor = item.featured ? '#fbbf24' : '#6b7280';
      const archText = item.archived ? '📁 Archived' : 'Live';
      const archColor = item.archived ? '#ef4444' : '#10b981';

      return `
        <div class="project-adm-card" data-id="${item.id}" draggable="true" ondragstart="handleProjDragStart(event)" ondragover="handleProjDragOver(event)" ondrop="handleProjDrop(event)" ondragend="handleProjDragEnd(event)" style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); border-radius:16px; overflow:hidden; display:flex; flex-direction:column; cursor:move; transition:all 0.2s;">
          <div style="position:relative; width:100%; padding-bottom:56%; background:rgba(0,0,0,0.15)">
            <img src="${item.thumbnail || 'dev_avatar.png'}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" />
            <div style="position:absolute; bottom:8px; left:8px; display:flex; gap:6px;">
              <span style="font-size:9px; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:2px 6px; font-weight:700; color:${featColor}">${featText}</span>
              <span style="font-size:9px; background:rgba(0,0,0,0.7); border:1px solid rgba(255,255,255,0.15); border-radius:4px; padding:2px 6px; font-weight:700; color:${archColor}">${archText}</span>
            </div>
          </div>
          <div style="padding:16px; flex:1; display:flex; flex-direction:column;">
            <div style="font-family:'Orbitron', monospace; font-size:0.75rem; color:var(--accent-blue); font-weight:700;">${escapeHtml(item.number || 'PROJECT')}</div>
            <h4 style="font-weight:700; font-size:1.15rem; color:#fff; margin-top:4px;">${escapeHtml(item.title)}</h4>
            <p style="font-size:0.8rem; color:var(--text-muted); margin-top:8px; line-height:1.4; flex:1;">${escapeHtml(item.description.substring(0, 100))}${item.description.length > 100 ? '...' : ''}</p>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:12px;">
              ${(item.tags || []).map(t => `<span style="font-size:9px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:1px 6px; border-radius:4px; color:var(--text-secondary);">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:16px;">
              <button onclick="editProjectModal('${item.id}')" class="btn-outline" style="padding:8px 12px; font-size:0.8rem;">✏️ Edit</button>
              <button onclick="deleteProject('${item.id}')" class="btn-outline" style="padding:8px 12px; font-size:0.8rem; color:#ef4444; border-color:rgba(239,68,68,0.2)">🗑️ Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Drag & Drop Sorting Projects
let draggedProjId = null;

function handleProjDragStart(e) {
  draggedProjId = e.currentTarget.getAttribute('data-id');
  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
}

function handleProjDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

async function handleProjDrop(e) {
  e.preventDefault();
  const targetId = e.currentTarget.getAttribute('data-id');
  if (draggedProjId === targetId) return;

  try {
    const snap = await db.ref('developer_portfolio/projects').once('value');
    if (!snap.exists()) return;

    let items = [];
    snap.forEach(c => {
      items.push(c.val());
    });

    items.sort((a,b) => (a.order || 0) - (b.order || 0));

    // Find indices
    const draggedIdx = items.findIndex(item => item.id === draggedProjId);
    const targetIdx = items.findIndex(item => item.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Reorder array
    const [removed] = items.splice(draggedIdx, 1);
    items.splice(targetIdx, 0, removed);

    // Save updated positions
    const updates = {};
    items.forEach((item, index) => {
      updates[`projects/${item.id}/order`] = index;
    });

    await db.ref('developer_portfolio').update(updates);
    showAdminNotification("↕️ Projects reordered successfully!", "success");
  } catch(err) {
    showAdminNotification("❌ Reorder failed: " + err.message, "error");
  }
}

function handleProjDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  draggedProjId = null;
}

// Projects Edit forms modal
function showAddProjectModal() {
  document.getElementById('projModalTitle').textContent = '➕ Add Project';
  document.getElementById('editProjId').value = '-1';
  document.getElementById('portProjTitle').value = '';
  document.getElementById('portProjNumber').value = 'PROJECT // 01';
  document.getElementById('portProjDesc').value = '';
  document.getElementById('portProjTechStack').value = '';
  document.getElementById('portProjCategory').value = 'Web App';
  document.getElementById('portProjDemo').value = '';
  document.getElementById('portProjGithub').value = '';
  document.getElementById('portProjStatus').value = 'Completed';
  document.getElementById('portProjTimeline').value = '';
  document.getElementById('portProjStats').value = '';
  document.getElementById('portProjFeatured').checked = false;
  document.getElementById('portProjArchived').checked = false;

  // Staged base64 image resets
  document.getElementById('projEdit_thumb_base64').value = '';
  document.getElementById('projEdit_thumb_preview').src = 'dev_avatar.png';
  document.getElementById('projEdit_logo_base64').value = '';
  document.getElementById('projEdit_logo_preview').src = 'logo.png';
  
  tempScreenshots = [];
  renderTempScreenshotsGrid();

  document.getElementById('portProjectModal').style.display = 'flex';
}

async function editProjectModal(id) {
  try {
    const snap = await db.ref(`developer_portfolio/projects/${id}`).once('value');
    if (!snap.exists()) return;
    const item = snap.val();

    document.getElementById('projModalTitle').textContent = '✏️ Edit Project';
    document.getElementById('editProjId').value = id;
    document.getElementById('portProjTitle').value = item.title || '';
    document.getElementById('portProjNumber').value = item.number || 'PROJECT';
    document.getElementById('portProjDesc').value = item.description || '';
    document.getElementById('portProjTechStack').value = (item.tags || []).join(', ');
    document.getElementById('portProjCategory').value = item.category || 'Web App';
    document.getElementById('portProjDemo').value = item.demoLink || '';
    document.getElementById('portProjGithub').value = item.githubLink || '';
    document.getElementById('portProjStatus').value = item.status || 'Completed';
    document.getElementById('portProjTimeline').value = item.timeline || '';
    document.getElementById('portProjStats').value = item.stats || '';
    document.getElementById('portProjFeatured').checked = !!item.featured;
    document.getElementById('portProjArchived').checked = !!item.archived;

    // Load previews
    document.getElementById('projEdit_thumb_base64').value = item.thumbnail || '';
    document.getElementById('projEdit_thumb_preview').src = item.thumbnail || 'dev_avatar.png';
    document.getElementById('projEdit_logo_base64').value = item.logo || '';
    document.getElementById('projEdit_logo_preview').src = item.logo || 'logo.png';
    
    // Load screenshots
    tempScreenshots = item.screenshots || [];
    renderTempScreenshotsGrid();

    document.getElementById('portProjectModal').style.display = 'flex';
  } catch(e) {
    showAdminNotification("❌ Load error: " + e.message, "error");
  }
}

function closeProjectModal() {
  document.getElementById('portProjectModal').style.display = 'none';
}

async function savePortfolioProject() {
  const id = document.getElementById('editProjId').value;
  const title = document.getElementById('portProjTitle').value.trim();
  const number = document.getElementById('portProjNumber').value.trim();
  const description = document.getElementById('portProjDesc').value.trim();
  const techRaw = document.getElementById('portProjTechStack').value.trim();
  const category = document.getElementById('portProjCategory').value;
  const demoLink = document.getElementById('portProjDemo').value.trim();
  const githubLink = document.getElementById('portProjGithub').value.trim();
  const status = document.getElementById('portProjStatus').value;
  const timeline = document.getElementById('portProjTimeline').value.trim();
  const stats = document.getElementById('portProjStats').value.trim();
  const featured = document.getElementById('portProjFeatured').checked;
  const archived = document.getElementById('portProjArchived').checked;

  const thumbnail = document.getElementById('projEdit_thumb_base64').value;
  const logo = document.getElementById('projEdit_logo_base64').value;

  if (!title || !description) {
    showAdminNotification("❌ Title and Description are required.", "error");
    return;
  }

  showAdminNotification("⏳ Saving Project...", "pending");
  try {
    const tags = techRaw ? techRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const record = {
      title,
      number,
      description,
      tags,
      category,
      demoLink,
      githubLink,
      status,
      timeline,
      stats,
      featured,
      archived,
      thumbnail: thumbnail || 'dev_avatar.png',
      logo: logo || 'logo.png',
      screenshots: tempScreenshots
    };

    if (id === '-1') {
      const projSnap = await db.ref('developer_portfolio/projects').once('value');
      const order = projSnap.numChildren();
      record.order = order;
      
      const newRef = db.ref('developer_portfolio/projects').push();
      record.id = newRef.key;
      await newRef.set(record);
    } else {
      record.id = id;
      await db.ref(`developer_portfolio/projects/${id}`).set(record);
    }

    showAdminNotification("✅ Project details published successfully!", "success");
    closeProjectModal();
  } catch(err) {
    showAdminNotification("❌ Project save failed: " + err.message, "error");
  }
}

async function deleteProject(id) {
  if (!confirm("Are you sure you want to delete this project?")) return;
  showAdminNotification("⏳ Removing project...", "pending");
  try {
    await db.ref(`developer_portfolio/projects/${id}`).remove();
    showAdminNotification("🗑️ Project deleted successfully!", "success");
  } catch(e) {
    showAdminNotification("❌ Delete failed: " + e.message, "error");
  }
}

// ==========================================================================
// 5. CONTACT SECTION & INQUIRIES RESPONSE CENTER
// ==========================================================================

function loadPortfolioInquiries() {
  db.ref('developer_portfolio/inquiries').on('value', snap => {
    const listCont = document.getElementById('portInquiriesTableList');
    if (!listCont) return;

    if (!snap.exists()) {
      listCont.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No message inquiries received yet.</td></tr>`;
      return;
    }

    let items = [];
    snap.forEach(c => {
      items.push({ id: c.key, ...c.val() });
    });

    // Sort by timestamp desc
    items.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));

    // Get current filter
    const statusFilter = document.getElementById('filterInquiryStatus')?.value || 'All';

    const filtered = items.filter(item => {
      if (statusFilter === 'All') return true;
      return item.status === statusFilter;
    });

    if (!filtered.length) {
      listCont.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">No inquiries matching the selected status.</td></tr>`;
      return;
    }

    listCont.innerHTML = filtered.map(item => {
      const dateStr = new Date(item.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      let badgeStyle = 'background:rgba(59,130,246,0.1); color:#3b82f6;';
      if (item.status === 'Pending') badgeStyle = 'background:rgba(245,158,11,0.1); color:#f59e0b;';
      else if (item.status === 'Replied') badgeStyle = 'background:rgba(16,185,129,0.1); color:#10b981;';
      else if (item.status === 'Archived') badgeStyle = 'background:rgba(107,114,128,0.1); color:#9ca3af;';

      return `
        <tr>
          <td><span style="font-weight:700; color:#fff;">${escapeHtml(item.name)}</span></td>
          <td style="font-size:0.85rem;"><a href="mailto:${item.email}" style="color:var(--accent-blue); text-decoration:none;">${escapeHtml(item.email)}</a></td>
          <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(item.subject)}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${dateStr}</td>
          <td><span style="padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; ${badgeStyle}">${item.status}</span></td>
          <td>
            <button onclick="openInquiryDetails('${item.id}')" class="btn-outline" style="padding:4px 8px; font-size:0.75rem;">View</button>
          </td>
        </tr>
      `;
    }).join('');
  });
}

// Inquiries Details View & Response notes editor
async function openInquiryDetails(id) {
  try {
    const snap = await db.ref(`developer_portfolio/inquiries/${id}`).once('value');
    if (!snap.exists()) return;
    const item = snap.val();

    document.getElementById('viewInqId').value = id;
    document.getElementById('viewInqName').textContent = item.name || '';
    document.getElementById('viewInqEmail').textContent = item.email || '';
    document.getElementById('viewInqEmail').href = 'mailto:' + (item.email || '');
    document.getElementById('viewInqSubject').textContent = item.subject || '';
    document.getElementById('viewInqMessage').textContent = item.message || '';
    document.getElementById('viewInqStatus').value = item.status || 'New';
    document.getElementById('viewInqNote').value = '';

    // Render response history logs
    const historyCont = document.getElementById('viewInqHistoryLogs');
    const logs = item.responseHistory || [];
    if (!logs.length) {
      historyCont.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">No response logs recorded.</p>`;
    } else {
      historyCont.innerHTML = logs.map(log => {
        const timeStr = new Date(log.timestamp).toLocaleString();
        return `
          <div style="border-left:2px solid var(--accent-blue); padding-left:12px; margin-bottom:8px; font-size:0.8rem;">
            <div style="font-weight:700; color:#fff;">${escapeHtml(log.by)} <span style="font-weight:400; color:var(--text-muted); font-size:10px;">› ${timeStr}</span></div>
            <div style="color:var(--text-secondary); margin-top:2px; line-height:1.3;">${escapeHtml(log.note)}</div>
          </div>
        `;
      }).join('');
    }

    document.getElementById('portInquiryDetailModal').style.display = 'flex';
  } catch(e) {
    showAdminNotification("❌ Inquiry load error: " + e.message, "error");
  }
}

function closeInquiryDetailModal() {
  document.getElementById('portInquiryDetailModal').style.display = 'none';
}

async function saveInquiryStatus() {
  const id = document.getElementById('viewInqId').value;
  const status = document.getElementById('viewInqStatus').value;
  const noteText = document.getElementById('viewInqNote').value.trim();

  showAdminNotification("⏳ Updating Inquiry state...", "pending");
  try {
    const updates = { status: status };

    if (noteText) {
      const snap = await db.ref(`developer_portfolio/inquiries/${id}/responseHistory`).once('value');
      let history = snap.val() || [];
      history.push({
        note: noteText,
        timestamp: Date.now(),
        by: "Admin Desk"
      });
      updates.responseHistory = history;
    }

    await db.ref(`developer_portfolio/inquiries/${id}`).update(updates);
    showAdminNotification("✅ Inquiry details updated successfully!", "success");
    closeInquiryDetailModal();
  } catch(err) {
    showAdminNotification("❌ Update failed: " + err.message, "error");
  }
}

// ==========================================================================
// 6. PORTFOLIO THEME CUSTOMIZATION ENGINE
// ==========================================================================

function loadCustomizerSettings() {
  db.ref('developer_portfolio/config').on('value', snap => {
    if (!snap.exists()) return;
    const config = snap.val();

    // Map config values to admin inputs
    const ids = ['theme', 'primaryColor', 'secondaryColor', 'accentColor', 'bgColor', 'fontFamily', 'animations', 'bgEffect', 'glassBlur', 'glassOpacity', 'cardStyle', 'layoutStyle'];
    ids.forEach(id => {
      const el = document.getElementById('cust_' + id);
      if (el) {
        if (el.type === 'checkbox') el.checked = !!config[id];
        else el.value = config[id] || '';
      }
    });

    // Update opacity & blur sliders label badges
    const blurBadge = document.getElementById('cust_blur_badge');
    if (blurBadge) blurBadge.textContent = (config.glassBlur || '20') + 'px';
    const opBadge = document.getElementById('cust_opacity_badge');
    if (opBadge) opBadge.textContent = Math.round(parseFloat(config.glassOpacity || '0.45') * 100) + '%';
  });
}

function handleCustomizerSliderInput(id, val, suffix = '') {
  const badge = document.getElementById('cust_' + id + '_badge');
  if (badge) {
    let text = val + suffix;
    if (suffix === '%') text = Math.round(parseFloat(val) * 100) + '%';
    badge.textContent = text;
  }
}

function applyCustomizerPreset(presetName) {
  const presets = {
    'cyberpunk': {
      theme: 'dark', primaryColor: '#ff0055', secondaryColor: '#00ffcc', accentColor: '#ffcc00', bgColor: '#05050a',
      fontFamily: 'Orbitron', animations: 'active', bgEffect: 'matrix', glassBlur: '8', glassOpacity: '0.15', cardStyle: 'neon-border', layoutStyle: 'minimal'
    },
    'emerald': {
      theme: 'dark', primaryColor: '#10b981', secondaryColor: '#059669', accentColor: '#34d399', bgColor: '#060f0e',
      fontFamily: 'JetBrains Mono', animations: 'active', bgEffect: 'particle', glassBlur: '16', glassOpacity: '0.4', cardStyle: 'glass', layoutStyle: 'modern'
    },
    'glassmorphism': {
      theme: 'dark', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#06b6d4', bgColor: '#0f172a',
      fontFamily: 'Plus Jakarta Sans', animations: 'active', bgEffect: 'particle', glassBlur: '25', glassOpacity: '0.45', cardStyle: 'glass', layoutStyle: 'modern'
    },
    'neon': {
      theme: 'dark', primaryColor: '#f43f5e', secondaryColor: '#d946ef', accentColor: '#06b6d4', bgColor: '#030712',
      fontFamily: 'Orbitron', animations: 'active', bgEffect: 'stars', glassBlur: '12', glassOpacity: '0.3', cardStyle: 'neon-border', layoutStyle: 'modern'
    }
  };

  const config = presets[presetName];
  if (!config) return;

  // Sync inputs locally
  Object.entries(config).forEach(([key, val]) => {
    const el = document.getElementById('cust_' + key);
    if (el) el.value = val;
  });

  // Trigger slider updates
  handleCustomizerSliderInput('blur', config.glassBlur, 'px');
  handleCustomizerSliderInput('opacity', config.glassOpacity, '%');

  showAdminNotification(`🎨 Preset '${presetName.toUpperCase()}' staged! Click Save to publish.`, 'success');
}

async function saveCustomizerConfig() {
  showAdminNotification("⏳ Publishing Customization parameters...", "pending");
  
  const config = {};
  const ids = ['theme', 'primaryColor', 'secondaryColor', 'accentColor', 'bgColor', 'fontFamily', 'animations', 'bgEffect', 'glassBlur', 'glassOpacity', 'cardStyle', 'layoutStyle'];
  ids.forEach(id => {
    const el = document.getElementById('cust_' + id);
    if (el) config[id] = el.value;
  });

  try {
    await db.ref('developer_portfolio/config').set(config);
    showAdminNotification("✅ Theme configuration active! Live immediately.", "success");
  } catch(e) {
    showAdminNotification("❌ Publish error: " + e.message, "error");
  }
}

// ==========================================================================
// 7. PORTFOLIO ANALYTICS & SVG CHARTS
// ==========================================================================

function loadPortfolioAnalytics() {
  db.ref('developer_portfolio/analytics/summary').on('value', snap => {
    if (!snap.exists()) return;
    const summary = snap.val();

    // Fill KPI numbers
    const list = ['visitors', 'uniqueVisitors', 'views', 'projectViews', 'linkClicks', 'contactSubmissions', 'cvDownloads'];
    list.forEach(k => {
      const el = document.getElementById('portKPI_' + k);
      if (el) el.textContent = summary[k] || 0;
    });

    // Conversion logic
    const convEl = document.getElementById('portKPI_conversion');
    if (convEl && summary.views > 0) {
      const rate = ((summary.contactSubmissions || 0) / summary.views) * 100;
      convEl.textContent = rate.toFixed(1) + '%';
    }
  });
}

function renderAnalyticsCharts() {
  // We draw 2 high-end, responsive SVG charts inside admin panel:
  // 1. Weekly views line chart
  // 2. Platform clicks breakdown bar chart
  
  // Chart 1: Line Chart
  const svgLine = document.getElementById('portChart_views');
  if (svgLine) {
    const viewsData = [45, 60, 50, 75, 90, 85, 120]; // Mocking data for week
    const uniqueData = [20, 35, 25, 42, 55, 49, 70];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    let pointsViews = '';
    let pointsUniques = '';
    const chartW = 500;
    const chartH = 150;
    const maxVal = 140;

    viewsData.forEach((val, i) => {
      const x = 40 + (i * 70);
      const y = chartH - 25 - ((val / maxVal) * (chartH - 40));
      pointsViews += `${x},${y} `;
    });

    uniqueData.forEach((val, i) => {
      const x = 40 + (i * 70);
      const y = chartH - 25 - ((val / maxVal) * (chartH - 40));
      pointsUniques += `${x},${y} `;
    });

    // Build grid & lines SVG XML
    let svgHtml = `
      <!-- Grid Lines -->
      <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <line x1="40" y1="62.5" x2="480" y2="62.5" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <line x1="40" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      <line x1="40" y1="125" x2="480" y2="125" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />

      <!-- X-Axis Labels -->
      ${days.map((d, i) => `<text x="${40 + (i * 70)}" y="${chartH - 5}" fill="var(--text-muted)" font-size="9" text-anchor="middle" font-family="sans-serif">${d}</text>`).join('')}

      <!-- Y-Axis Labels -->
      <text x="30" y="24" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="sans-serif">140</text>
      <text x="30" y="66" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="sans-serif">70</text>
      <text x="30" y="109" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="sans-serif">0</text>

      <!-- View Data Line -->
      <polyline points="${pointsViews}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Uniques Data Line -->
      <polyline points="${pointsUniques}" fill="none" stroke="#06b6d4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4,3" />

      <!-- Hotspot dots -->
      ${viewsData.map((val, i) => {
        const x = 40 + (i * 70);
        const y = chartH - 25 - ((val / maxVal) * (chartH - 40));
        return `<circle cx="${x}" cy="${y}" r="4.5" fill="#6366f1" stroke="#0f172a" stroke-width="2" title="Views: ${val}" style="cursor:pointer;" />`;
      }).join('')}
    `;
    svgLine.innerHTML = svgHtml;
  }

  // Chart 2: Bar Chart clicks
  const svgBar = document.getElementById('portChart_clicks');
  if (svgBar) {
    const clicks = [45, 32, 18, 12, 5];
    const categories = ['GitHub', 'LinkedIn', 'CV Download', 'BCA Store App', 'Mail Contact'];
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

    const chartH = 150;
    const maxVal = 50;

    let svgHtml = `
      <line x1="100" y1="10" x2="100" y2="130" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <line x1="100" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />

      <!-- Horizontal Grid Lines -->
      <line x1="226" y1="10" x2="226" y2="130" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      <line x1="353" y1="10" x2="353" y2="130" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
      <line x1="480" y1="10" x2="480" y2="130" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

      ${categories.map((cat, i) => {
        const y = 18 + (i * 22);
        const val = clicks[i];
        const barW = Math.max(8, ((val / maxVal) * 360));
        return `
          <!-- Bar Label -->
          <text x="90" y="${y + 10}" fill="var(--text-muted)" font-size="9" text-anchor="end" font-family="sans-serif">${cat}</text>
          
          <!-- Bar Fill -->
          <rect x="100" y="${y}" width="${barW}" height="14" fill="${colors[i]}" rx="3" title="${cat}: ${val} clicks" style="transition: width 1s ease; cursor:pointer;" />
          
          <!-- Value Text -->
          <text x="${105 + barW}" y="${y + 11}" fill="#fff" font-size="9" font-weight="700" font-family="sans-serif">${val}</text>
        `;
      }).join('')}
    `;
    svgBar.innerHTML = svgHtml;
  }
}

// Reset Analytics Metrics (resets views/clicks tally)
async function resetPortfolioAnalytics() {
  if (!confirm("Are you sure you want to reset all visitor metrics and views analytics? This cannot be undone.")) return;
  
  showAdminNotification("⏳ Resetting analytics data...", "pending");
  try {
    await db.ref('developer_portfolio/analytics/summary').set({
      visitors: 0,
      uniqueVisitors: 0,
      views: 0,
      projectViews: 0,
      linkClicks: 0,
      contactSubmissions: 0,
      cvDownloads: 0
    });
    showAdminNotification("✅ Analytics tally reset successfully!", "success");
  } catch(e) {
    showAdminNotification("❌ Reset failed: " + e.message, "error");
  }
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
