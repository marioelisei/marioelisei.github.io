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









// === SIDEBAR TOGGLE ===
function toggleChiMenu(btn) {
  const dropdown = btn.nextElementSibling;
  const isOpen = dropdown.classList.contains('open');
  document.querySelectorAll('.chi-dropdown.open').forEach(d => d.classList.remove('open'));
  if (!isOpen) {
    dropdown.classList.add('open');
    setTimeout(() => document.addEventListener('click', function close(e) {
      if (!dropdown.contains(e.target)) { dropdown.classList.remove('open'); document.removeEventListener('click', close); }
    }), 0);
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('chatSidebar');
  const icon = document.getElementById('sidebarCollapseIcon');
  sidebar.classList.toggle('collapsed');
  const isCollapsed = sidebar.classList.contains('collapsed');
  icon.className = isCollapsed
    ? 'ti ti-layout-sidebar-left-expand'
    : 'ti ti-layout-sidebar-left-collapse';
}

// === WANDERER ===
(function() {
  const el = document.querySelector('.wanderer');
  if (!el) return;

  function r(a, b) { return a + Math.random() * (b - a); }

  function getArea() {
    const c = document.querySelector('.chat-main');
    return c ? { W: c.offsetWidth, H: c.offsetHeight } : { W: window.innerWidth, H: window.innerHeight };
  }

  let cx = 80, cy = 80;
  let morphTimer = null;

  function getDmap() { return document.getElementById('wdmap'); }

  // inicia loop de deformação biológica com intensidade sorteada
  function startMorph(delayMs) {
    stopMorph();
    setTimeout(() => {
      const roll = Math.random();
      const maxScale = roll < 0.55 ? r(4,  10)   // sutil
                     : roll < 0.85 ? r(10, 20)   // média
                     :               r(20, 32);  // intensa (rara)
      function pulse() {
        const dmap = getDmap();
        if (dmap) dmap.setAttribute('scale', r(maxScale * 0.35, maxScale).toFixed(1));
        morphTimer = setTimeout(pulse, r(900, 2600));
      }
      pulse();
    }, delayMs);
  }

  function stopMorph() {
    if (morphTimer) { clearTimeout(morphTimer); morphTimer = null; }
    const dmap = getDmap();
    if (dmap) dmap.setAttribute('scale', '3');
  }

  function placeAt(x, y, duration) {
    cx = x; cy = y;
    el.style.transition =
      `left ${duration}s cubic-bezier(0.4,0,0.2,1), top ${duration}s cubic-bezier(0.4,0,0.2,1), opacity 0.8s ease`;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
  }

  function move() {
    const overlay = document.getElementById('chatOverlay');
    if (!overlay || !overlay.classList.contains('visible')) { schedule(); return; }

    const { W, H } = getArea();
    const margin = 60;
    const nx = r(margin, W - margin);
    const ny = r(margin, H - margin);
    const fast = Math.random() < 0.4;
    const dist = Math.hypot(nx - cx, ny - cy);
    const dur  = Math.min(Math.max(0.3, dist / (fast ? 900 : 250)), fast ? 0.5 : 3.5);

    const mode = Math.random();

    if (mode < 0.35) {
      // MODO A — move direto, sem deformação antes ou depois
      stopMorph();
      if (fast) { el.style.opacity = '0.50'; setTimeout(() => { el.style.opacity = '0.3'; }, dur * 1000 + 200); }
      placeAt(nx, ny, dur);
      schedule();

    } else if (mode < 0.58) {
      // MODO B — deforma brevemente, depois move, depois deforma ao chegar
      startMorph(0);
      const preDelay = r(500, 1100);
      setTimeout(() => {
        stopMorph();
        if (fast) { el.style.opacity = '0.50'; setTimeout(() => { el.style.opacity = '0.3'; }, dur * 1000 + 200); }
        placeAt(nx, ny, dur);
        startMorph(dur * 1000 + 120);
        schedule();
      }, preDelay);

    } else if (mode < 0.78) {
      // MODO C — move deformando, para ao chegar
      startMorph(0);
      if (fast) { el.style.opacity = '0.50'; setTimeout(() => { el.style.opacity = '0.3'; }, dur * 1000 + 200); }
      placeAt(nx, ny, dur);
      setTimeout(() => stopMorph(), dur * 1000 + r(300, 900));
      schedule();

    } else {
      // MODO D — move direto, deforma só ao chegar
      stopMorph();
      if (fast) { el.style.opacity = '0.50'; setTimeout(() => { el.style.opacity = '0.3'; }, dur * 1000 + 200); }
      placeAt(nx, ny, dur);
      startMorph(dur * 1000 + 120);
      schedule();
    }
  }

  function schedule() {
    setTimeout(move, r(3000, 10000));
  }

  setTimeout(() => {
    const { W, H } = getArea();
    cx = r(60, W - 60); cy = r(60, H - 60);
    el.style.left    = cx + 'px';
    el.style.top     = cy + 'px';
    el.style.opacity = '0.3';
    startMorph(0);
    schedule();
  }, 2000);
})();

// === SHOOTING STAR ===
(function() {
  const star = document.getElementById('shootingStar');
  if (!star) return;

  function launch() {
    const overlay = document.getElementById('chatOverlay');
    if (!overlay || !overlay.classList.contains('visible')) {
      schedule(); return;
    }

    const W = overlay.offsetWidth;
    const H = overlay.offsetHeight;

    // ponto de partida aleatório nas bordas
    const edge = Math.floor(Math.random() * 4);
    let sx, sy;
    if (edge === 0) { sx = Math.random() * W; sy = 0; }
    else if (edge === 1) { sx = W; sy = Math.random() * H; }
    else if (edge === 2) { sx = Math.random() * W; sy = H; }
    else { sx = 0; sy = Math.random() * H; }

    // direção diagonal oposta
    const tx = (W * 0.3 + Math.random() * W * 0.4 - sx) * (0.4 + Math.random() * 0.4);
    const ty = (H * 0.3 + Math.random() * H * 0.4 - sy) * (0.4 + Math.random() * 0.4);

    const angle = Math.atan2(ty, tx) * (180 / Math.PI);
    const dur = 0.8 + Math.random() * 0.8;

    star.style.cssText = `
      left: ${sx}px; top: ${sy}px;
      --tx: ${tx}px; --ty: ${ty}px;
      --dur: ${dur}s; --angle: ${angle + 180}deg;
    `;
    star.classList.remove('fire');
    void star.offsetWidth;
    star.classList.add('fire');

    schedule();
  }

  function schedule() {
    const delay = 6000 + Math.random() * 12000; // 6–18s de surpresa
    setTimeout(launch, delay);
  }

  // começa após o chat abrir
  setTimeout(schedule, 4000);
})();

// === MCP HOVER ANIMATION — handled via CSS :has() ===

// === SITE / AI TOGGLE ===
let chatSimulated = false;
let simAborted = false;
let promptTimer = null;

// === MOBILE SIDEBAR TOGGLE ===
function toggleMobileSidebar() {
  const sidebar  = document.getElementById('chatSidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  if (!sidebar || !backdrop) return;
  const opening = !sidebar.classList.contains('mobile-open');
  sidebar.classList.toggle('mobile-open', opening);
  backdrop.classList.toggle('open', opening);
  document.body.style.overflow = opening ? 'hidden' : '';
}
function closeMobileSidebar() {
  const sidebar  = document.getElementById('chatSidebar');
  const backdrop = document.getElementById('mobileSidebarBackdrop');
  if (sidebar)  sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
}

// === CHAT FADES ===
(function() {
  const msgs     = document.getElementById('chatMessages');
  const fadeTop  = document.querySelector('.chat-messages-fade-top');
  const fadeBot  = document.querySelector('.chat-messages-fade-bottom');
  if (!msgs || !fadeTop || !fadeBot) return;

  function updateFades() {
    const threshold = 20;
    fadeTop.classList.toggle('fade-visible', msgs.scrollTop > threshold);
    fadeBot.classList.toggle('fade-visible', msgs.scrollTop + msgs.clientHeight < msgs.scrollHeight - threshold);
  }

  msgs.addEventListener('scroll', updateFades, { passive: true });
  window._updateChatFades = updateFades;
})();

function setActiveChip(name) {
  document.querySelectorAll('.agent-chip[data-chip]').forEach(btn => {
    btn.classList.toggle('agent-chip--active', btn.dataset.chip === name);
  });
}

function removeAIPulse() {
  var btn = document.getElementById('toggleAI');
  if (btn) btn.classList.remove('pulse-hint');
  localStorage.setItem('ai-mode-seen', '1');
}

function switchToAI() {
  closeAllGDropdowns();
  removeAIPulse();
  document.getElementById('toggleSite').classList.remove('active');
  document.getElementById('toggleAI').classList.add('active');
  document.getElementById('navModeToggle').classList.add('ai-active');
  document.body.classList.add('ai-mode');
  document.getElementById('navLogoSuffix').textContent = 'ai';
  const uAvatar = document.querySelector('.user-avatar');
  if (uAvatar) uAvatar.src = 'data:image/png;base64,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';

  const nav = document.querySelector('.nav');
  const overlay = document.getElementById('chatOverlay');
  overlay.style.paddingTop = nav.offsetHeight + 'px';
  overlay.classList.add('visible');
  document.body.style.overflow = 'hidden';

  if (!window._aiGridInit) {
    window._aiGridInit = true;
    createAmbientGrid('ambient-grid-ai-modal');
  }

  // reset: mostrar greeting, esconder header + msgs + bottom input
  const greeting = document.getElementById('chatGreeting');
  const msgs     = document.getElementById('chatMessages');
  const header   = document.querySelector('.chat-header');
  const bottomInput = document.querySelector('.chat-input-area');

  if (greeting) greeting.classList.remove('hidden');
  if (msgs) { msgs.classList.remove('visible'); msgs.scrollTop = 0; }
  if (header) header.classList.remove('visible');
  if (bottomInput) bottomInput.classList.add('greeting-hidden');
  setActiveChip(null);

  const gi = document.getElementById('greetingInput');
  if (gi) { gi.value = ''; gi.focus(); }

  // após 5s simular conversa
  if (!chatSimulated) {
    chatSimulated = true;
    setTimeout(startChatSimulation, 3000);
  }
}

function switchToSite() {
  closeAllGDropdowns();
  document.getElementById('toggleAI').classList.remove('active');
  document.getElementById('toggleSite').classList.add('active');
  document.getElementById('navModeToggle').classList.remove('ai-active');
  document.body.classList.remove('ai-mode');
  document.body.removeAttribute('data-chat-theme');
  document.getElementById('chatOverlay').classList.remove('visible');
  document.body.style.overflow = '';
  closeMobileSidebar();
  document.getElementById('navLogoSuffix').textContent = 'eng';
  const uAvatar = document.querySelector('.user-avatar');
  if (uAvatar) uAvatar.src = 'data:image/jpeg;base64,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';
}

function switchChatTheme(btn) {
  const theme = btn.dataset.t;
  document.querySelectorAll('.theme-swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const overlay = document.getElementById('chatOverlay');
  if (theme === 'forest') {
    overlay.removeAttribute('data-theme');
    document.body.removeAttribute('data-chat-theme');
  } else {
    overlay.setAttribute('data-theme', theme);
    document.body.setAttribute('data-chat-theme', theme);
  }
}

function startChatSimulation() {
  closeAllGDropdowns();
  const greeting    = document.getElementById('chatGreeting');
  const msgs        = document.getElementById('chatMessages');
  const header      = document.querySelector('.chat-header');
  const bottomInput = document.querySelector('.chat-input-area');
  if (!greeting || !msgs) return;

  greeting.classList.add('hidden');

  setTimeout(() => {
    if (header) header.classList.add('visible');
    if (bottomInput) bottomInput.classList.remove('greeting-hidden');
    msgs.classList.add('visible');
    msgs.scrollTop = 0;
    document.querySelector('.chat-main')?.classList.add('no-aurora');
    setActiveChip('prompt');

    // Reset all messages to hidden before replaying
    Array.from(msgs.querySelectorAll('.msg')).forEach(m => {
      m.style.opacity = '0';
      m.style.display = 'none';
    });

    setTimeout(() => {
      runTypedSimulation(msgs, () => {
        let greetingTimer = setTimeout(finish, 4000);
        function finish() {
          msgs.removeEventListener('scroll', onUserScroll);
          returnToGreeting();
        }
        function onUserScroll() {
          clearTimeout(greetingTimer);
          greetingTimer = setTimeout(finish, 2000);
        }
        msgs.addEventListener('scroll', onUserScroll);
      });
    }, 400);
  }, 550);
}

// Types HTML content into a bubble character-by-character, skipping over tags instantly
function typeHTML(bubble, html, charsPerStep, stepMs, onDone, scrollContainer) {
  const tokens = [];
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) { tokens.push(html[i++]); continue; }
      tokens.push({ tag: html.slice(i, end + 1) });
      i = end + 1;
    } else {
      tokens.push(html[i++]);
    }
  }

  let built = '';
  let idx = 0;

  function step() {
    if (simAborted) { if (onDone) onDone(); return; }
    let chars = 0;
    while (idx < tokens.length && chars < charsPerStep) {
      const t = tokens[idx++];
      if (typeof t === 'string') { built += t; chars++; }
      else { built += t.tag; }
    }
    bubble.innerHTML = built;
    if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    if (idx < tokens.length) setTimeout(step, stepMs);
    else if (onDone) onDone();
  }
  step();
}

// Types text into the chatInput simulating user typing, then calls onDone
function typeInInput(text, onDone) {
  const input = document.getElementById('chatInput');
  if (!input) { onDone(); return; }
  input.value = '';
  let i = 0;
  function tick() {
    if (simAborted) { input.value = ''; onDone(); return; }
    if (i < text.length) {
      input.value += text[i++];
      setTimeout(tick, 8);
    } else {
      setTimeout(() => { input.value = ''; onDone(); }, 220);
    }
  }
  tick();
}

// Plays through messages one by one: user messages type in input first, AI messages type out in bubble
function runTypedSimulation(container, onComplete) {
  simAborted = false;
  const messages = Array.from(container.querySelectorAll('.msg'));

  // Save original bubble HTML before any typing mutates it
  messages.forEach(m => {
    const b = m.querySelector('.msg-bubble');
    if (b && !b.dataset.orig) b.dataset.orig = b.innerHTML;
  });

  let msgIdx = 0;

  function nextMsg() {
    if (simAborted) return;
    if (msgIdx >= messages.length) { onComplete(); return; }

    const msg = messages[msgIdx++];

    if (msg.classList.contains('msg--ai')) {
      msg.style.display = '';
      requestAnimationFrame(() => {
        msg.style.transition = 'opacity 0.25s ease';
        msg.style.opacity = '1';
      });
      container.scrollTop = container.scrollHeight;
      if (window._updateChatFades) window._updateChatFades();

      const bubble = msg.querySelector('.msg-bubble');
      const originalHTML = bubble.dataset.orig || bubble.innerHTML;
      bubble.innerHTML = '';
      setTimeout(() => {
        const userBubble = msg._userBubble;
        if (userBubble) userBubble.classList.remove('is-thinking');
        typeHTML(bubble, originalHTML, 6, 18, () => {
          setTimeout(nextMsg, 700);
        }, container);
      }, 2500);

    } else {
      const bubbleEl = msg.querySelector('.msg-bubble');
      const text = bubbleEl.textContent.trim();
      const nextMessage = messages[msgIdx];

      typeInInput(text, () => {
        if (simAborted) return;
        msg.style.display = '';
        requestAnimationFrame(() => {
          msg.style.transition = 'opacity 0.25s ease';
          msg.style.opacity = '1';
        });
        container.scrollTop = container.scrollHeight;
        if (window._updateChatFades) window._updateChatFades();

        if (nextMessage && nextMessage.classList.contains('msg--ai')) {
          const userBubble = msg.querySelector('.msg-bubble');
          nextMessage._userBubble = userBubble;
          requestAnimationFrame(() => {
            if (userBubble) userBubble.classList.add('is-thinking');
          });
        }
        setTimeout(nextMsg, 600);
      });
    }
  }

  nextMsg();
}

// ── Chip actions ──

function reloadSimulation() {
  closeAllGDropdowns();
  simAborted = true;
  clearTimeout(promptTimer);
  const msgs        = document.getElementById('chatMessages');
  const greeting    = document.getElementById('chatGreeting');
  const header      = document.querySelector('.chat-header');
  const bottomInput = document.querySelector('.chat-input-area');
  const chatMain    = document.querySelector('.chat-main');

  // Step 1 — fade out messages + header + aurora returns
  msgs.classList.remove('visible');
  if (header) header.classList.remove('visible');
  if (bottomInput) bottomInput.classList.add('greeting-hidden');
  if (chatMain) chatMain.classList.remove('no-aurora');

  // Step 2 — after fade-out (500ms), reset content and show greeting
  setTimeout(() => {
    msgs.querySelectorAll('.msg-bubble[data-orig]').forEach(b => { b.innerHTML = b.dataset.orig; });
    msgs.querySelectorAll('.msg').forEach(m => { m.style.opacity = '0'; m.style.display = 'none'; });
    msgs.scrollTop = 0;

    const title = greeting.querySelector('.greeting-title');
    if (title) title.innerHTML = '<span class="g-muted">Hi, </span><span class="g-name">Mario!</span><span class="g-muted"> Here I am</span>';
    const gi = document.getElementById('greetingInput');
    if (gi) { gi.placeholder = 'How can I help you today?'; gi.value = ''; gi.focus(); }
    greeting.classList.remove('hidden');
    setActiveChip(null);

    // Step 3 — restart simulation after 3s
    setTimeout(() => {
      simAborted = false;
      startChatSimulation();
    }, 3000);
  }, 500);
}

function showPromptMode() {
  closeAllGDropdowns();
  simAborted = true;
  const msgs     = document.getElementById('chatMessages');
  const greeting = document.getElementById('chatGreeting');
  const header   = document.querySelector('.chat-header');
  const bottomInput = document.querySelector('.chat-input-area');
  const chatMain = document.querySelector('.chat-main');

  // Restore all bubbles
  if (msgs) msgs.querySelectorAll('.msg-bubble[data-orig]').forEach(b => { b.innerHTML = b.dataset.orig; });

  greeting.classList.add('hidden');
  if (header) header.classList.add('visible');
  if (bottomInput) bottomInput.classList.remove('greeting-hidden');
  msgs.classList.add('visible');

  // Show all messages instantly
  Array.from(msgs.querySelectorAll('.msg')).forEach(m => {
    m.style.display = '';
    m.style.transition = 'none';
    m.style.opacity = '1';
  });

  // Hide aurora blobs, keep shooting star
  if (chatMain) chatMain.classList.add('no-aurora');

  msgs.scrollTop = 0;
  setActiveChip('prompt');

  // Make user messages navigable
  enableMsgNavigation(msgs);

  // Após 6s, volta automaticamente para o DEMO MODE greeting
  clearTimeout(promptTimer);
  promptTimer = setTimeout(() => returnToGreeting(), 6000);
}

function enableMsgNavigation(container) {
  // Remove any previous listeners
  container.querySelectorAll('.msg--user').forEach(msg => {
    msg.classList.add('navigable');
    const clone = msg.cloneNode(true);
    msg.parentNode.replaceChild(clone, msg);
  });

  container.querySelectorAll('.msg--user.navigable').forEach(msg => {
    msg.addEventListener('click', () => {
      // Smooth scroll to this message
      const offsetTop = msg.offsetTop - 32;
      container.scrollTo({ top: offsetTop, behavior: 'smooth' });

      // Flash highlight
      msg.classList.remove('flash');
      void msg.offsetWidth; // reflow to restart animation
      msg.classList.add('flash');
      setTimeout(() => msg.classList.remove('flash'), 900);
    });
  });
}

function showDemoGreeting() {
  closeAllGDropdowns();
  simAborted = true;
  clearTimeout(promptTimer);
  const msgs     = document.getElementById('chatMessages');
  if (msgs) msgs.querySelectorAll('.msg-bubble[data-orig]').forEach(b => { b.innerHTML = b.dataset.orig; });
  document.querySelector('.chat-main')?.classList.remove('no-aurora');
  returnToGreeting();
}

function returnToGreeting() {
  closeAllGDropdowns();
  const greeting    = document.getElementById('chatGreeting');
  const msgs        = document.getElementById('chatMessages');
  const header      = document.querySelector('.chat-header');
  const bottomInput = document.querySelector('.chat-input-area');

  msgs.classList.remove('visible');
  if (header) header.classList.remove('visible');
  if (bottomInput) bottomInput.classList.add('greeting-hidden');
  document.querySelector('.chat-main')?.classList.remove('no-aurora');

  setTimeout(() => {
    msgs.scrollTop = 0;
    const title = greeting.querySelector('.greeting-title');
    if (title) {
      title.innerHTML =
        '<span class="g-muted">Hi, </span>' +
        '<span class="g-name">Demo Mode</span>' +
        '<span class="g-muted"> is active.</span>';
    }
    const gi = document.getElementById('greetingInput');
    if (gi) {
      gi.placeholder = 'Submit your first prompt to request demo access.';
      gi.value = '';
      gi.focus();
    }
    const ci = document.getElementById('chatInput');
    if (ci) ci.blur();
    greeting.classList.remove('hidden');
    setActiveChip('demo');
  }, 500);
}

function triggerThinkingAndOpen(inputBox) {
  if (!inputBox) { openAIModal(); return; }
  inputBox.classList.add('is-thinking');
  setTimeout(() => {
    inputBox.classList.remove('is-thinking');
    openAIModal();
  }, 1500);
}

function handleGreetingSend() {
  const gi = document.getElementById('greetingInput');
  if (gi && gi.value.trim().length > 0) {
    triggerThinkingAndOpen(gi.closest('.g-input-box'));
  }
}

// === AI DEMO MODAL ===
function openAIModal() {
  clearTimeout(promptTimer);
  document.getElementById('aiDemoModal').classList.add('open');
}

function closeAIModal() {
  document.getElementById('aiDemoModal').classList.remove('open');
  setTimeout(() => {
    document.getElementById('aiDemoForm').style.display = 'flex';
    document.getElementById('aiDemoSuccess').style.display = 'none';
    document.getElementById('aiDemoForm').reset();
    const gi = document.getElementById('greetingInput');
    if (gi) { gi.value = ''; gi.focus(); }
    const ci = document.getElementById('chatInput');
    if (ci) { ci.value = ''; ci.style.height = ''; }
  }, 300);
}

document.getElementById('aiDemoModal').addEventListener('click', function(e) {
  if (e.target === this) closeAIModal();
});

// === GREETING INPUT MONITOR ===
(function() {
  const gi = document.getElementById('greetingInput');
  if (!gi) return;
  gi.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.value.trim().length > 0) triggerThinkingAndOpen(this.closest('.g-input-box'));
    }
  });
})();

// === CHAT INPUT MONITOR ===
(function() {
  const input = document.getElementById('chatInput');
  if (!input) return;

  // Auto-resize textarea
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    // Trigger modal at 80 chars
    if (this.value.length >= 80) {
      this.value = this.value.slice(0, 79);
      triggerThinkingAndOpen(this.closest('.g-input-box'));
    }
  });

  // Trigger modal on Enter
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.value.trim().length > 0) triggerThinkingAndOpen(this.closest('.g-input-box'));
    }
  });
})();

function handleChatSend() {
  const input = document.getElementById('chatInput');
  const box = input ? input.closest('.g-input-box') : null;
  triggerThinkingAndOpen(box);
}

// === AI DEMO FORM SUBMIT ===
function submitAIDemoForm(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.figma-submit');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  const params = {
    from_name:  document.getElementById('ai-name').value,
    from_email: document.getElementById('ai-email').value,
    company:    document.getElementById('ai-company').value || '—',
    reason:     'AI Chat Demo Request',
    linkedin:   '—',
  };

  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params)
    .then(() => {
      document.getElementById('aiDemoForm').style.display = 'none';
      document.getElementById('aiDemoSuccess').style.display = 'block';
      setTimeout(() => closeAIModal(), 6000);
    })
    .catch(() => {
      btn.textContent = 'Error — try again';
      btn.disabled = false;
    });
}

// === G-DROPDOWN SYSTEM ===
function toggleGDropdown(id, btn) {
  const panel = document.getElementById(id);
  const isOpen = panel.classList.contains('open');
  closeAllGDropdowns();
  if (!isOpen) {
    const rect = btn.getBoundingClientRect();
    panel.style.left   = Math.min(rect.left, window.innerWidth - 230) + 'px';
    panel.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
    panel.style.top    = 'auto';
    panel.classList.add('open');
    btn.classList.add('active');
  }
}
function closeAllGDropdowns() {
  document.querySelectorAll('.g-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.g-dropdown-btn').forEach(b => b.classList.remove('active'));
}
function usePromptTemplate(text) {
  ['greetingInput','chatInput'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = text; el.focus(); }
  });
  closeAllGDropdowns();
}
let currentAIModel = 'llama3.2';
function switchAIModel(btn, name) {
  document.querySelectorAll('.g-model-row').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  currentAIModel = name.toLowerCase().replace(/\s+/g,'');
  closeAllGDropdowns();
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.g-dropdown') && !e.target.closest('.g-dropdown-btn')) {
    closeAllGDropdowns();
  }
});

// AI mode pulse — show once, remove on first interaction
if (!localStorage.getItem('ai-mode-seen')) {
  var aiBtn = document.getElementById('toggleAI');
  if (aiBtn) aiBtn.classList.add('pulse-hint');
  aiBtn.addEventListener('mouseenter', removeAIPulse, { once: true });
}
