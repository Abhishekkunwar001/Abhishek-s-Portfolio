/**
 * ═══════════════════════════════════════════════════
 *  ABHISHEK KUMAR — 3D PORTFOLIO  |  script.js
 *  Vanilla JS + Three.js — No frameworks
 * ═══════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────────────
   0. UTILITY
───────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ─────────────────────────────────────────────────────
   1. LOADING SCREEN
   Fakes progress then hides after Three.js is ready
───────────────────────────────────────────────────── */
function initLoader(onDone) {
  const loader = $('#loader');
  const loaderText = $('.loader-text');
  const msgs = ['Loading assets...', 'Initializing Three.js...', 'Building neural mesh...', 'Ready.'];
  let i = 0;

  const iv = setInterval(() => {
    i++;
    if (loaderText) loaderText.textContent = msgs[Math.min(i, msgs.length - 1)];
    if (i >= msgs.length) {
      clearInterval(iv);
      setTimeout(() => {
        loader.classList.add('done');
        onDone();
      }, 400);
    }
  }, 420);
}

/* ─────────────────────────────────────────────────────
   2. THREE.JS HERO
───────────────────────────────────────────────────── */
function initThreeHero() {
  const canvas = $('#hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // ── Renderer ──────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W(), H());
  renderer.setClearColor(0x000000, 0);

  // ── Scene / Camera ────────────────────────────────
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W() / H(), 0.1, 1000);
  camera.position.set(0, 0, 28);

  // ── Lighting ──────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x38bdf8, 0.3));
  const pLight1 = new THREE.PointLight(0x38bdf8, 1.5, 80);
  pLight1.position.set(20, 20, 10);
  scene.add(pLight1);
  const pLight2 = new THREE.PointLight(0x818cf8, 1.2, 80);
  pLight2.position.set(-20, -10, 15);
  scene.add(pLight2);

  // ── Particle Field ────────────────────────────────
  const PARTICLE_COUNT = 800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const particleSizes = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    particleSizes[i]     = Math.random() * 0.5 + 0.1;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
  const pMat = new THREE.PointsMaterial({
    color: 0x38bdf8, size: 0.18, transparent: true,
    opacity: 0.55, sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Neural-network Lines ──────────────────────────
  // Pick a subset of particles and connect nearby ones
  const lineNodes = [];
  for (let i = 0; i < 60; i++) {
    lineNodes.push(new THREE.Vector3(
      (Math.random() - 0.5) * 60,
      (Math.random() - 0.5) * 45,
      (Math.random() - 0.5) * 30,
    ));
  }
  const lineGeom = new THREE.BufferGeometry();
  const lineVerts = [];
  for (let i = 0; i < lineNodes.length; i++) {
    for (let j = i + 1; j < lineNodes.length; j++) {
      if (lineNodes[i].distanceTo(lineNodes[j]) < 14) {
        lineVerts.push(lineNodes[i].x, lineNodes[i].y, lineNodes[i].z);
        lineVerts.push(lineNodes[j].x, lineNodes[j].y, lineNodes[j].z);
      }
    }
  }
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
  const lineMat = new THREE.LineBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.12 });
  const linesMesh = new THREE.LineSegments(lineGeom, lineMat);
  scene.add(linesMesh);

  // ── Floating Geometric Shapes ─────────────────────
  const shapes = [];

  function makeShape(geometry, color, x, y, z, scale = 1) {
    const mat = new THREE.MeshPhongMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      emissive: color,
      emissiveIntensity: 0.15,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    scene.add(mesh);
    shapes.push(mesh);
    return mesh;
  }

  // Icosahedron (right side)
  makeShape(new THREE.IcosahedronGeometry(3, 0), 0x38bdf8,  14,  4, -5, 1);
  // Torus (top left)
  makeShape(new THREE.TorusGeometry(2.5, 0.5, 10, 30),     0x818cf8, -14, 7, -8, 1);
  // Octahedron (bottom right)
  makeShape(new THREE.OctahedronGeometry(2.2, 0),           0x34d399,  10, -8, -5, 1);
  // Small sphere (far left)
  makeShape(new THREE.SphereGeometry(1.8, 12, 8),           0xfb7185, -10, -4, -6, 1);

  // ── Mouse parallax ────────────────────────────────
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / W() - 0.5) * 2;
    mouseY = (e.clientY / H() - 0.5) * 2;
  });

  // ── Animation loop ────────────────────────────────
  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Smooth mouse follow
    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    // Rotate scene slightly with mouse
    scene.rotation.y = targetX * 0.25;
    scene.rotation.x = -targetY * 0.12;

    // Particles slow drift
    particles.rotation.y = t * 0.012;
    particles.rotation.x = t * 0.006;
    linesMesh.rotation.y = t * 0.008;

    // Float each shape individually
    shapes.forEach((s, i) => {
      s.rotation.x = t * 0.3 * (i % 2 === 0 ? 1 : -1);
      s.rotation.y = t * 0.2 * (i % 3 === 0 ? 1 : -1);
      s.position.y = s.position.y + Math.sin(t * 0.5 + i) * 0.004;
    });

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize handler ────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}

/* ─────────────────────────────────────────────────────
   3. TYPING ANIMATION (Hero)
───────────────────────────────────────────────────── */
function initTyping() {
  const el = $('#typed');
  if (!el) return;

  const phrases = ['AI System Builder', 'Cloud & Backend Developer', 'Machine Learning Enthusiast'];
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const phrase = phrases[pi];
    el.textContent = phrase.slice(0, ci);

    if (!deleting) {
      ci++;
      if (ci > phrase.length) {
        deleting = true;
        setTimeout(tick, 1600);
        return;
      }
    } else {
      ci--;
      if (ci < 0) {
        deleting = false;
        ci = 0;
        pi = (pi + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 50 : 95);
  }
  setTimeout(tick, 900);
}

/* ─────────────────────────────────────────────────────
   4. STICKY NAVBAR
───────────────────────────────────────────────────── */
function initNavbar() {
  const nav     = $('#navbar');
  const burger  = $('#hamburger');
  const links   = $('#nav-links');
  const navItems = $$('.nav-link');

  // Scrolled class
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // Hamburger
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });

  // Close on link click
  $$('.nav-link, .mobile-nav-link').forEach(a => {
    a.addEventListener('click', () => {
      burger.classList.remove('open');
      links.classList.remove('open');
    });
  });

  // Active link via IntersectionObserver
  const sections = $$('section[id]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navItems.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { threshold: 0.35 });
  sections.forEach(s => observer.observe(s));
}

/* ─────────────────────────────────────────────────────
   5. SCROLL PROGRESS BAR
───────────────────────────────────────────────────── */
function initScrollProgress() {
  const bar = $('#scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / max * 100) + '%';
  });
}

/* ─────────────────────────────────────────────────────
   6. SCROLL REVEAL (Intersection Observer)
───────────────────────────────────────────────────── */
function initReveal() {
  const revealEls = $$('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────
   7. SKILL PROGRESS BARS (animate on viewport entry)
───────────────────────────────────────────────────── */
function initSkillBars() {
  const fills = $$('.skill-fill');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const item = e.target.closest('.skill-item');
        const val  = item?.dataset.val;
        if (val) e.target.style.width = val + '%';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  fills.forEach(f => observer.observe(f));
}

/* ─────────────────────────────────────────────────────
   8. RADIAL CANVAS CHARTS
───────────────────────────────────────────────────── */
function initRadialCharts() {
  const configs = [
    { id: 'radial-1', value: 90, color: '#38bdf8' },
    { id: 'radial-2', value: 75, color: '#f59e0b' },
    { id: 'radial-3', value: 80, color: '#fb7185' },
    { id: 'radial-4', value: 78, color: '#a78bfa' },
    { id: 'radial-5', value: 65, color: '#34d399' },
  ];

  configs.forEach(cfg => {
    const canvas = document.getElementById(cfg.id);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 140;
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width  = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2, cy = size / 2, radius = 52;
    const startAngle = -Math.PI / 2;
    let currentVal = 0;
    const targetVal = cfg.value;

    function drawFrame(val) {
      ctx.clearRect(0, 0, size, size);
      const isDark = document.body.getAttribute('data-theme') !== 'light';

      // Track
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
      ctx.lineWidth = 7;
      ctx.stroke();

      // Fill arc
      const endAngle = startAngle + (val / 100) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';

      // Glow
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Animate in when visible
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          observer.unobserve(canvas);
          const start = performance.now();
          const duration = 1300;
          function step(now) {
            const progress = clamp((now - start) / duration, 0, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            drawFrame(eased * targetVal);
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(canvas);
  });
}

/* ─────────────────────────────────────────────────────
   9. STAT COUNTER ANIMATION
───────────────────────────────────────────────────── */
function initCounters() {
  const els = $$('[data-target]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      observer.unobserve(e.target);

      const el      = e.target;
      const target  = parseFloat(el.dataset.target);
      const decimal = parseInt(el.dataset.decimal ?? '0');
      const start   = performance.now();
      const dur     = 1500;

      function step(now) {
        const p = clamp((now - start) / dur, 0, 1);
        const v = (1 - Math.pow(1 - p, 3)) * target;
        el.textContent = v.toFixed(decimal);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimal);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  els.forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────
   10. PROJECT CARDS — 3D TILT EFFECT
───────────────────────────────────────────────────── */
function initProjectTilt() {
  $$('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────────────────────
   11. ACHIEVEMENT CARDS — 3D FLOAT HOVER
───────────────────────────────────────────────────── */
function initAchieveTilt() {
  $$('.achieve-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 6}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─────────────────────────────────────────────────────
   12. PROJECT MODAL
───────────────────────────────────────────────────── */
const PROJECT_DATA = [
  {
    title:  'Weather Web App',
    icon:   '🌤',
    type:   'Web Application',
    desc:   'Real-time weather forecasting application with full async API integration. Fetches live data from OpenWeatherMap API with geolocation support.',
    points: [
      'Asynchronous JS (async/await) for non-blocking API calls',
      '7-day forecast with dynamic weather icons & backgrounds',
      'Geolocation API integration for automatic city detection',
      'Performance optimized — lazy loading and caching strategy',
      'Responsive across desktop, tablet, and mobile',
    ],
    tech: ['JavaScript (ES6+)', 'OpenWeatherMap API', 'CSS3 Animations', 'Geolocation API'],
    github: 'https://github.com/Abhishekkunwar001',
  },
  {
    title:  'Resume Builder Tool',
    icon:   '📄',
    type:   'Productivity Tool',
    desc:   'A dynamic resume generation engine allowing users to fill in structured forms and export a professionally styled resume as a PDF with one click.',
    points: [
      'Live preview updates as user types',
      'Full form validation with descriptive error messages',
      'Multiple template options with clean typography',
      'One-click PDF export via browser print API',
      'Local storage persistence — never lose your data',
    ],
    tech: ['HTML5', 'CSS3', 'Vanilla JavaScript', 'PDF Export API'],
    github: 'https://github.com/Abhishekkunwar001',
  },
  {
    title:  'Rock Paper Scissors (CV)',
    icon:   '✊',
    type:   'Computer Vision',
    desc:   'Real-time hand gesture recognition game using computer vision — no keyboard or mouse needed, just your hand in front of the camera.',
    points: [
      'Real-time hand landmark detection via MediaPipe Hands',
      'Custom gesture classification (rock/paper/scissors) logic',
      'OpenCV for frame capture and overlay rendering',
      'Score tracking and animated win/loss feedback',
      'Runs at ~30 FPS on standard laptop hardware',
    ],
    tech: ['Python', 'OpenCV', 'MediaPipe', 'NumPy'],
    github: 'https://github.com/Abhishekkunwar001',
  },
  {
    title:  'Credit Card Fraud Detection',
    icon:   '🔐',
    type:   'Machine Learning',
    desc:   'End-to-end ML pipeline for detecting fraudulent credit card transactions on highly imbalanced datasets with high precision and recall.',
    points: [
      'SMOTE (Synthetic Minority Oversampling) for class imbalance handling',
      'Feature engineering and correlation analysis on anonymized data',
      'Compared Logistic Regression, Random Forest, and XGBoost models',
      'Achieved 97.8% precision on anomalous transaction detection',
      'Interactive confusion matrix and ROC curve visualization',
    ],
    tech: ['Python', 'scikit-learn', 'SMOTE (imbalanced-learn)', 'Pandas', 'Matplotlib'],
    github: 'https://github.com/Abhishekkunwar001',
  },
];

function initModals() {
  const overlay = $('#project-modal');
  const content = $('#modal-content');
  const closeBtn = $('#modal-close');

  function openModal(id) {
    const d = PROJECT_DATA[id];
    if (!d) return;

    content.innerHTML = `
      <h2>${d.icon} ${d.title}</h2>
      <p class="tl-badge" style="margin-bottom:1rem">${d.type}</p>
      <p>${d.desc}</p>
      <ul>
        ${d.points.map(p => `<li>${p}</li>`).join('')}
      </ul>
      <div class="modal-tags">
        ${d.tech.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="modal-actions">
        <a href="${d.github}" target="_blank" rel="noopener" class="btn btn-outline">
          <i class="fab fa-github"></i> View on GitHub
        </a>
      </div>
    `;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  $$('.modal-trigger').forEach(btn => {
    btn.addEventListener('click', () => openModal(parseInt(btn.dataset.id)));
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ─────────────────────────────────────────────────────
   13. CONTACT FORM
───────────────────────────────────────────────────── */
function initContactForm() {
  const form    = $('#contact-form');
  const success = $('#form-success');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = form.name.value.trim();
    const email = form.email.value.trim();
    const msg   = form.message.value.trim();

    if (!name || !email || !msg) {
      showToast('⚠️ Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('⚠️ Enter a valid email address.');
      return;
    }

    /* ── Plug in EmailJS / Formspree here ──
       e.g. emailjs.send('svcID','tplID',{name,email,message})
    ────────────────────────────────────── */

    success?.classList.remove('hidden');
    form.reset();
    showToast('🚀 Message sent!');
    setTimeout(() => success?.classList.add('hidden'), 5000);
  });
}

/* ─────────────────────────────────────────────────────
   14. TOAST NOTIFICATION
───────────────────────────────────────────────────── */
function showToast(msg) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

/* ─────────────────────────────────────────────────────
   15. THEME TOGGLE (dark / light) with localStorage
───────────────────────────────────────────────────── */
function initThemeToggle() {
  const btn  = $('#theme-toggle');
  const icon = $('#theme-icon');
  const body = document.body;
  const KEY  = 'ak-theme';

  function apply(theme) {
    body.setAttribute('data-theme', theme);
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem(KEY, theme);
  }

  const saved = localStorage.getItem(KEY) || 'dark';
  apply(saved);

  btn.addEventListener('click', () => {
    apply(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });
}

/* ─────────────────────────────────────────────────────
   16. CUSTOM CURSOR
───────────────────────────────────────────────────── */
function initCursor() {
  const dot  = $('#cursor-dot');
  const ring = $('#cursor-ring');
  if (!dot || !ring) return;

  let rx = 0, ry = 0;
  document.addEventListener('mousemove', (e) => {
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    rx += (e.clientX - rx) * 0.14;
    ry += (e.clientY - ry) * 0.14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
  });

  // Lag effect via rAF
  function smoothRing() {
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(smoothRing);
  }
  smoothRing();

  // Hover state
  document.addEventListener('mouseover', (e) => {
    if (e.target.matches('a,button,[role=button],.project-card,.achieve-card,.stat-card')) {
      document.body.classList.add('cursor-hover');
    }
  });
  document.addEventListener('mouseout', () => {
    document.body.classList.remove('cursor-hover');
  });
}

/* ─────────────────────────────────────────────────────
   17. SMOOTH SCROLL for all anchor hrefs
───────────────────────────────────────────────────── */
function initSmoothScroll() {
  const navH = 68;
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─────────────────────────────────────────────────────
   18. FOOTER YEAR
───────────────────────────────────────────────────── */
function initFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // Initialise everything that doesn't need loader
  initThemeToggle();
  initCursor();
  initNavbar();
  initScrollProgress();
  initSmoothScroll();
  initFooterYear();
  initTyping();
  initModals();
  initContactForm();

  // Kick off loader, then reveal animated elements
  initLoader(() => {
    initThreeHero();
    initReveal();
    initSkillBars();
    initCounters();
    initRadialCharts();
    initProjectTilt();
    initAchieveTilt();
  });
});
