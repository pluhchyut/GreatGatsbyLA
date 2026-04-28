// App entry. Builds the scrolling DOM from poem.js, initializes the Three.js
// stage, and uses Locomotive Scroll as the primary motion layer. Native scroll
// remains as a fallback so the chapter blending still works if smooth mode is
// unavailable.

import { Stage } from './scene.js';
import { sections } from './poem.js';

const CHAPTER_INFO = {
  shoreline: { roman: 'I', name: 'shoreline', code: 'SH-01' },
  parties: { roman: 'II', name: 'parties', code: 'PT-02' },
  invention: { roman: 'III', name: 'invention', code: 'IN-03' },
  longing: { roman: 'IV', name: 'longing', code: 'LG-04' },
  past: { roman: 'V', name: 'past', code: 'PS-05' },
  fade: { roman: 'VI', name: 'fade', code: 'FD-06' },
};

const VISUAL_KEYS = [
  'greenLight',
  'goldParticles',
  'mansion',
  'artDeco',
  'vortex',
  'boat',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildDom() {
  const root = document.getElementById('scroll-container');
  let lineIdx = 0;
  let entryIdx = 0;

  sections.forEach((s, i) => {
    const chapter = CHAPTER_INFO[s.chapter];
    if (s.type === 'hero') {
      const el = document.createElement('section');
      el.className = 'hero';
      el.dataset.scene = s.scene;
      el.dataset.chapter = s.chapter;
      el.innerHTML = `
        <div class="hero-interface hero-interface--top">
          <span>boot sector // west egg</span>
          <span>${chapter.code}</span>
        </div>
        <div class="hero-eyebrow">F. Scott Fitzgerald · 1925</div>
        <h1 class="hero-title">The Green<span class="amp">&</span>Light</h1>
        <div class="hero-subtitle">a poem for Jay Gatsby</div>
        <div class="hero-flourish"></div>
        <div class="hero-interface hero-interface--bottom">
          <span>procedural chapter artifact</span>
          <span>smooth scroll / six scenes / one canvas</span>
        </div>
        <div class="hero-scroll-cue">scroll</div>
      `;
      root.appendChild(el);
      return;
    }

    if (s.type === 'line') {
      lineIdx += 1;
      entryIdx += 1;
      const el = document.createElement('section');
      el.className = 'poem-section';
      el.dataset.scene = s.scene;
      el.dataset.chapter = s.chapter;
      el.dataset.entryId = String(entryIdx);
      el.dataset.shot = s.shot;
      el.dataset.transition = s.transition;

      let html;
      if (lineIdx === 1) {
        const match = s.text.match(/^(.)(.*)$/);
        html = `<span class="drop">${match[1]}</span>${match[2]}`;
      } else {
        html = s.text;
      }

      el.innerHTML = `
        <div class="poem-shell">
          <div class="poem-meta reveal">
            <span>${String(entryIdx).padStart(2, '0')}</span>
            <span>${chapter.code}</span>
            <span>${chapter.name}</span>
          </div>
          <p class="poem-line reveal">${html}</p>
        </div>
      `;
      root.appendChild(el);
      return;
    }

    if (s.type === 'end') {
      const el = document.createElement('section');
      el.className = 'end-section';
      el.dataset.scene = s.scene;
      el.dataset.chapter = s.chapter;
      el.innerHTML = `
        <div class="end-mark reveal">${s.text}</div>
        <div class="end-credit reveal">poem &amp; visuals · in memory of Jay Gatsby</div>
      `;
      root.appendChild(el);
    }
  });
}

function boot() {
  buildDom();

  const scrollRoot = document.getElementById('scroll-container');
  const stage = new Stage(document.getElementById('three-canvas'));
  const sectionEls = Array.from(document.querySelectorAll('[data-scene]'));
  const progressFill = document.getElementById('progress-fill');
  const chapterRoman = document.getElementById('chapter-roman');
  const chapterName = document.getElementById('chapter-name');
  const chapterCode = document.getElementById('chapter-code');
  const systemCode = document.getElementById('system-code');
  const loaderStatus = document.getElementById('loader-status');
  const shotTitle = document.getElementById('shot-title');
  const shotTransition = document.getElementById('shot-transition');

  const sectionsByScene = Object.fromEntries(
    VISUAL_KEYS.map((key) => [key, sectionEls.filter((el) => el.dataset.scene === key)]),
  );
  const reveals = Array.from(document.querySelectorAll('.reveal'));

  let lastChapterKey = '';
  let lastBeatId = '';
  let lastY = 0;
  let lastTime = performance.now();
  let velocityEMA = 0;
  let locomotive = null;
  let smoothY = 0;
  let smoothSpeed = 0;
  let smoothDirection = 1;
  let smoothLimit = 0;

  const bootMessages = [
    'bootrom // west egg archive // preparing scene memory',
    'native scroll // calibrating chapter drift',
    'three canvas // resolving water, fog, and gold',
    'signal stable // awaiting reader input',
  ];
  let bootIndex = 0;
  const bootTicker = window.setInterval(() => {
    bootIndex = (bootIndex + 1) % bootMessages.length;
    if (loaderStatus) loaderStatus.textContent = bootMessages[bootIndex];
  }, 950);

  function initLocomotive() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || typeof window.LocomotiveScroll !== 'function' || !scrollRoot) return;

    locomotive = new window.LocomotiveScroll({
      el: scrollRoot,
      smooth: true,
      lerp: window.innerWidth < 720 ? 0.12 : 0.08,
      multiplier: window.innerWidth < 720 ? 0.9 : 1.0,
      getDirection: true,
      getSpeed: true,
      reloadOnContextChange: true,
      smartphone: { smooth: false },
      tablet: { smooth: true, breakpoint: 1024 },
    });

    locomotive.on('scroll', (args) => {
      smoothY = args.scroll.y;
      smoothSpeed = (args.speed ?? 0) * 2.4;
      smoothDirection = args.direction === 'up' ? -1 : 1;
      smoothLimit = args.limit?.y ?? smoothLimit;
    });

    window.setTimeout(() => locomotive?.update(), 120);
    window.addEventListener('resize', () => locomotive?.update());
    window.addEventListener('beforeunload', () => locomotive?.destroy(), { once: true });
  }

  function measureAll() {
    const vh = window.innerHeight;
    const center = vh * 0.5;
    const states = Object.fromEntries(
      VISUAL_KEYS.map((key) => [key, { intensity: 0, progress: 0, distance: Infinity }]),
    );
    let activeSection = sectionEls[0] || null;
    let activeDistance = Infinity;

    VISUAL_KEYS.forEach((key) => {
      const els = sectionsByScene[key];
      let bestInfluence = 0;
      let bestProgress = 0;
      let bestDistance = Infinity;

      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(elCenter - center);
        const influence = clamp(1 - distance / (vh * 0.95), 0, 1) ** 2.0;
        const localProgress = clamp((center - rect.top) / Math.max(rect.height, vh * 0.7), 0, 1);

        if (distance < activeDistance) {
          activeDistance = distance;
          activeSection = el;
        }

        if (influence > bestInfluence) {
          bestInfluence = influence;
          bestProgress = localProgress;
          bestDistance = distance;
        }
      });

      states[key].intensity = bestInfluence;
      states[key].progress = bestProgress;
      states[key].distance = bestDistance;
    });

    const dominantKey = activeSection?.dataset.scene || 'greenLight';
    const chapterKey = activeSection?.dataset.chapter || 'shoreline';
    const activeRect = activeSection?.getBoundingClientRect();
    const activeProgress = activeRect
      ? clamp((center - activeRect.top) / Math.max(activeRect.height, vh * 0.7), 0, 1)
      : 0;

    stage.setSceneStates(states, dominantKey);
    stage.setActiveBeat({
      scene: dominantKey,
      chapter: chapterKey,
      shot: activeSection?.dataset.shot || '',
      transition: activeSection?.dataset.transition || '',
      progress: activeProgress,
      entryId: activeSection?.dataset.entryId || '',
    });

    if (chapterKey !== lastChapterKey) {
      const info = CHAPTER_INFO[chapterKey];
      if (info) {
        if (chapterRoman) chapterRoman.textContent = info.roman;
        if (chapterName) chapterName.textContent = info.name;
        if (chapterCode) chapterCode.textContent = info.code;
        if (systemCode) systemCode.textContent = `${info.code} // ${info.name}`;
      }
      lastChapterKey = chapterKey;
    }

    if (activeSection?.dataset.entryId && activeSection.dataset.entryId !== lastBeatId) {
      if (shotTitle) shotTitle.textContent = activeSection?.dataset.shot || '';
      if (shotTransition) shotTransition.textContent = activeSection?.dataset.transition || '';
      lastBeatId = activeSection.dataset.entryId;
    }

    reveals.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.bottom > vh * 0.22 && rect.top < vh * 0.82;
      el.classList.toggle('is-inview', inView);
    });

    const y = locomotive ? smoothY : (window.scrollY || document.documentElement.scrollTop || 0);
    const limit = locomotive
      ? Math.max(1, smoothLimit || scrollRoot.scrollHeight - vh)
      : Math.max(1, document.documentElement.scrollHeight - vh);
    const progress = clamp(y / limit, 0, 1);
    const now = performance.now();
    const dt = Math.max(16, now - lastTime);
    const inst = locomotive ? smoothSpeed : ((y - lastY) / dt) * 16.0;
    velocityEMA = velocityEMA * 0.82 + inst * 0.18;
    const direction = locomotive ? smoothDirection : (inst >= 0 ? 1 : -1);

    stage.setScrollMetrics({ progress, velocity: velocityEMA, direction });
    if (progressFill) progressFill.style.transform = `scaleY(${progress})`;

    lastY = y;
    lastTime = now;
  }

  function rafLoop() {
    measureAll();
    requestAnimationFrame(rafLoop);
  }
  requestAnimationFrame(rafLoop);

  initLocomotive();

  // Hide loader when load fires (or on a fallback timer in case `load` was
  // already past by the time this script attached).
  const hideLoader = () => {
    window.clearInterval(bootTicker);
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    locomotive?.update();
  };
  if (document.readyState === 'complete') {
    setTimeout(hideLoader, 500);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, 500), { once: true });
    setTimeout(hideLoader, 4000); // ultimate fallback
  }

  window.addEventListener('resize', () => measureAll());
}

boot();
