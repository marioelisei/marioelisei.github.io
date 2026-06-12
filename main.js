// ── SCROLL TO SECTION ──
  const NAV_HEIGHT = 56;
  function scrollToSection(id) {
    const anchor = document.getElementById(id);
    if (!anchor) return;
    const top = anchor.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  // ── SETTINGS DROPDOWN ──
  function toggleSettings() {
    document.getElementById('settingsDropdown').classList.toggle('open');
  }
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.nav-settings')) {
      document.getElementById('settingsDropdown').classList.remove('open');
    }
  });
  // ── FLOATING ARROW ──
  const sections = [
    document.querySelector('.hero'),
    document.getElementById('about'),
    document.getElementById('featured'),
    document.getElementById('work'),
    document.getElementById('contact')
  ].filter(Boolean);
  const floatArrow = document.getElementById('floatArrow');
  let scrollTimer;

  function getCurrentSectionIndex() {
    const scrollY = window.scrollY + 80;
    let current = -1;
    sections.forEach((sec, i) => {
      if (sec && sec.getBoundingClientRect().top + window.scrollY <= scrollY) {
        current = i;
      }
    });
    return current;
  }

  function goToPrevSection() {
    const idx = getCurrentSectionIndex();
    if (idx > 0) {
      const target = sections[idx - 1];
      const top = target.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  window.addEventListener('scroll', function() {
    // Close settings
    document.getElementById('settingsDropdown').classList.remove('open');

    // Show/hide arrow
    const atTop = window.scrollY < 100;
    if (atTop) {
      floatArrow.classList.remove('visible');
    } else {
      floatArrow.classList.add('visible');
      // Fade out while actively scrolling
      floatArrow.style.opacity = '0.3';
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        floatArrow.style.opacity = '';
      }, 500);
    }
  }, { passive: true });

  // ── THEME ──
  let currentTheme = 'system';
  function setTheme(theme) {
    currentTheme = theme;
    document.querySelectorAll('.settings-option[id^="opt-"]').forEach(b => b.classList.remove('active'));
    document.getElementById('opt-' + theme).classList.add('active');
    if (theme === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
  // Init: follow system
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  document.documentElement.setAttribute('data-theme', 'dark');
  prefersDark.addEventListener('change', () => { if (currentTheme === 'system') setTheme('system'); });

  // ── LANGUAGE ──
  let currentLang = 'en';
  function setLang(lang) {
    currentLang = lang;
    document.querySelectorAll('[data-en]').forEach(el => {
      const val = el.getAttribute('data-' + lang);
      if (!val) return;
      if (el.tagName === 'P' || el.tagName === 'H2') {
        el.innerHTML = val;
      } else if (el.querySelector('span:not(.status-dots):not(.status-text)') && el.tagName === 'A') {
        el.querySelector('span').textContent = val;
      } else if (!el.classList.contains('status-text') && !el.classList.contains('status-dots')) {
        el.textContent = val;
      }
    });
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    document.getElementById('settingsDropdown').classList.remove('open');
    requestAnimationFrame(syncJustifiedWidths);
  }

  // Alinha o fim do parágrafo com o fim do botão VIEW WORK
  function syncHeroDescWidth() {
    const desc = document.querySelector('.hero-desc');
    const row  = document.querySelector('.hero-cta-row');
    if (!desc || !row) return;
    if (window.innerWidth <= 860) { desc.style.maxWidth = ''; return; }
    desc.style.maxWidth = row.offsetWidth + 'px';
  }

  // Alinha o fim do parágrafo ABOUT com a ponta do foguete 🚀 do heading
  function syncAboutBodyWidth() {
    const body    = document.querySelector('.about-body');
    const heading = document.querySelector('.about-heading');
    if (!body || !heading) return;
    if (window.innerWidth <= 900) { body.style.maxWidth = ''; return; }
    const rocket = heading.querySelector('b');
    if (!rocket) return;
    const w = rocket.getBoundingClientRect().right - body.getBoundingClientRect().left;
    if (w > 0) body.style.maxWidth = w + 'px';
  }

  function syncJustifiedWidths() { syncHeroDescWidth(); syncAboutBodyWidth(); }
  window.addEventListener('load', syncJustifiedWidths);
  window.addEventListener('resize', syncJustifiedWidths);

  // Animated dots
  const dots = document.querySelectorAll('.status-dots span');
  let d = 0, growing = true;
  setInterval(() => {
    dots.forEach((dot, i) => dot.classList.toggle('on', i <= d));
    if (growing) { d++; if (d >= dots.length - 1) growing = false; }
    else { d--; if (d <= 0) growing = true; }
  }, 400);

  function filterCards(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const cards = document.querySelectorAll('.card');
    cards.forEach(c => {
      const show = cat === 'all' || c.dataset.cat === cat;
      c.style.display = show ? 'block' : 'none';
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.stack-item, .card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

// Função compartilhada para criar o grid animado
function createAmbientGrid(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const CELL = 20;
  const RADIUS = 180;       // raio reduzido, difusão mantida via smoothstep
  const MAX_OPACITY = 0.55;
  const BASE_OPACITY = 0.05;
  const LERP = 0.06;        // 0 = sem arrasto, 1 = instantâneo — 0.06 ≈ arrasto suave

  // Posição real do mouse (atualizada instantaneamente)
  let target = { x: -9999, y: -9999 };
  // Posição interpolada (segue o target com delay)
  let current = { x: -9999, y: -9999 };
  let W, H, rafId;

  function resize() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
  }

  function draw() {
    // Lerp — interpola current em direção a target
    current.x += (target.x - current.x) * LERP;
    current.y += (target.y - current.y) * LERP;

    ctx.clearRect(0, 0, W, H);

    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;

    for (let c = 0; c <= cols; c++) {
      const x = c * CELL;
      for (let r = 0; r <= rows; r++) {
        const y = r * CELL;
        const dist = Math.hypot(current.x - x, current.y - y);
        // Falloff suave quadrático (smoothstep) — mais difuso que linear
        const nd = Math.min(dist / RADIUS, 1);
        const t = 1 - nd * nd * (3 - 2 * nd); // smoothstep
        const op = BASE_OPACITY + (MAX_OPACITY - BASE_OPACITY) * t;

        if (c < cols) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + CELL, y);
          ctx.strokeStyle = `rgba(124,107,255,${op})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        if (r < rows) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + CELL);
          ctx.strokeStyle = `rgba(124,107,255,${op})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    rafId = requestAnimationFrame(draw);
  }

  window.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    target.x = e.clientX - rect.left;
    target.y = e.pageY - (rect.top + window.scrollY);
  });

  window.addEventListener('mouseleave', function() {
    target = { x: -9999, y: -9999 };
  });

  window.addEventListener('resize', resize);

  resize();
  draw();
}

createAmbientGrid('ambient-grid');
createAmbientGrid('ambient-grid-contact');

// ── EmailJS config — preencha suas chaves depois ──
const EMAILJS_PUBLIC_KEY  = 'Mox_YTlcm_R9nVa3w';
const EMAILJS_SERVICE_ID  = 'service_5tl4j65';
const EMAILJS_TEMPLATE_ID = 'template_sc5k8tf';

emailjs.init(EMAILJS_PUBLIC_KEY);

function openFigmaModal() {
  document.getElementById('figmaModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Inicializa o grid do modal na primeira abertura, força resize nas seguintes
  if (!window._figmaGridInit) {
    window._figmaGridInit = true;
    createAmbientGrid('ambient-grid-modal');
  } else {
    const c = document.getElementById('ambient-grid-modal');
    if (c) { c.width = c.offsetWidth; c.height = c.offsetHeight; }
  }
}
function closeFigmaModal() {
  document.getElementById('figmaModal').classList.remove('open');
  document.body.style.overflow = '';
  // Reset form
  setTimeout(() => {
    document.getElementById('figmaForm').style.display = 'flex';
    document.getElementById('figmaSuccess').style.display = 'none';
    document.getElementById('figmaForm').reset();
    const btn = document.querySelector('#figmaForm .figma-submit');
    btn.innerHTML = '<i class="ti ti-send"></i> Send request';
    btn.disabled = false;
  }, 300);
}
// Fechar ao clicar fora do modal
document.getElementById('figmaModal').addEventListener('click', function(e) {
  if (e.target === this) closeFigmaModal();
});
// Fechar com ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeFigmaModal();
});

function submitFigmaForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.figma-submit');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  const params = {
    from_name:    document.getElementById('f-name').value,
    from_email:   document.getElementById('f-email').value,
    company:      document.getElementById('f-company').value,
    linkedin:     document.getElementById('f-linkedin').value || '—',
    reason:       document.getElementById('f-reason').value   || '—',
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
    .then(() => {
      document.getElementById('figmaForm').style.display = 'none';
      document.getElementById('figmaSuccess').style.display = 'block';
      setTimeout(() => closeFigmaModal(), 6000);
    })
    .catch((err) => {
      console.error('EmailJS error:', err);
      const msg = err?.text || err?.message || err?.status || JSON.stringify(err);
      btn.innerHTML = '<i class="ti ti-send"></i> Error: ' + msg;
      btn.disabled = false;
    });
}
