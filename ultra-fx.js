(function initUltraFX() {
  // Only run on homepage (index.html or root)
  const isHomePage = window.location.pathname === '/' || 
                     window.location.pathname.endsWith('index.html') ||
                     window.location.pathname.endsWith('/');

  const canvas = document.createElement('canvas');
  canvas.id = 'ultraBgCanvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '-1'; 
  canvas.style.pointerEvents = 'none'; 
  document.body.prepend(canvas);

  const ctx2d = canvas.getContext('2d');
  
  let width, height;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // NO FPS Counter - removed as requested

  // Mouse Interaction (subtle, only on desktop)
  let mouse = { x: -1000, y: -1000, radius: 100 };
  if (window.innerWidth > 768) {
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener('mouseout', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });
  }

  // Dramatically reduced particle count: ~75% fewer than before
  // Mobile: very minimal, Desktop: elegant and minimal
  const isMobile = window.innerWidth <= 768;
  const particleCount = isMobile
    ? Math.min(8, Math.floor(window.innerWidth * window.innerHeight / 80000))
    : Math.min(18, Math.floor(window.innerWidth * window.innerHeight / 60000)); 

  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.4; // Much slower, more elegant
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 1.5 + 0.8; // Smaller, more elegant
      // More subtle opacity
      const alpha = isMobile ? (Math.random() * 0.2 + 0.08) : (Math.random() * 0.3 + 0.1);
      this.color = `rgba(139, 92, 246, ${alpha})`; 
      this.connectColor = `rgba(139, 92, 246,`; // will append opacity
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges smoothly
      if (this.x < -10) this.x = width + 10;
      if (this.x > width + 10) this.x = -10;
      if (this.y < -10) this.y = height + 10;
      if (this.y > height + 10) this.y = -10;

      // Gentle mouse interaction (desktop only)
      if (!isMobile) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distSq = dx * dx + dy * dy;
        let radiusSq = mouse.radius * mouse.radius;
        
        if (distSq < radiusSq) {
          let distance = Math.sqrt(distSq);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let force = (mouse.radius - distance) / mouse.radius;
          this.vx -= forceDirectionX * force * 0.15; // Very gentle
          this.vy -= forceDirectionY * force * 0.15;
        }
      }

      // Gentle friction
      this.vx *= 0.995;
      this.vy *= 0.995;
      
      // Minimum drift speed
      const speedSq = this.vx * this.vx + this.vy * this.vy;
      if (speedSq < 0.02) {
         this.vx += (Math.random() - 0.5) * 0.08;
         this.vy += (Math.random() - 0.5) * 0.08;
      }
    }
    
    draw() {
      ctx2d.beginPath();
      ctx2d.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx2d.fillStyle = this.color;
      ctx2d.fill();
    }
  }

  let particles = [];
  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }
  initParticles();

  // Ambient gradient orbs - very subtle, GPU-accelerated via CSS
  // These are the beautiful ambient glows
  const connectDistanceSq = isMobile ? (60 * 60) : (100 * 100);

  function animate(timestamp) {
    ctx2d.clearRect(0, 0, width, height);

    // Draw particles
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }

    // Draw connections - only on desktop with very low opacity
    if (!isMobile) {
      ctx2d.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distSq = dx * dx + dy * dy;
          
          if (distSq < connectDistanceSq) {
            let distance = Math.sqrt(distSq);
            let opacity = (1 - (distance / 100)) * 0.15; // Very subtle connections
            ctx2d.beginPath();
            ctx2d.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx2d.moveTo(particles[i].x, particles[i].y);
            ctx2d.lineTo(particles[j].x, particles[j].y);
            ctx2d.stroke();
          }
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate(performance.now());
})();
