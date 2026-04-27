// App entry. Builds the scrolling DOM from poem.js, sets up Locomotive Scroll,
// initializes the Three.js stage, and wires scroll position to scene blending.

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

const SCENE_KEYS = Object.keys(CHAPTER_INFO);

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
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';
      el.innerHTML = `
        <div class="hero-interface hero-interface--top" data-scroll data-scroll-speed="2">
          <span>boot sector // west egg</span>
          <span>${chapter.code}</span>
        </div>
        <div class="hero-eyebrow" data-scroll data-scroll-speed="1">
          F. Scott Fitzgerald · 1925
        </div>
        <h1 class="hero-title" data-scroll data-scroll-speed="-1">
          The Green<span class="amp">&</span>Light
        </h1>
        <div class="hero-subtitle" data-scroll data-scroll-speed="1">
          a poem for Jay Gatsby
        </div>
        <div class="hero-flourish" data-scroll data-scroll-speed="2"></div>
        <div class="hero-interface hero-interface--bottom" data-scroll data-scroll-speed="-1">
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
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';

      let html;
      if (lineIdx === 1) {
        const match = s.text.match(/^(.)(.*)$/);
        html = `<span class="drop">${match[1]}</span>${match[2]}`;
      } else {
        html = s.text;
      }

      el.innerHTML = `
        <div class="poem-shell" data-scroll data-scroll-speed="${i % 2 === 0 ? 1 : -1}">
          <div class="poem-meta" data-scroll data-scroll-class="is-inview" data-scroll-repeat>
            <span>${String(entryIdx).padStart(2, '0')}</span>
            <span>${chapter.code}</span>
            <span>${chapter.name}</span>
          </div>
          <p class="poem-line" data-scroll data-scroll-class="is-inview"
             data-scroll-repeat>
            ${html}
          </p>
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
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';
      el.innerHTML = `
        <div class="end-mark" data-scroll data-scroll-class="is-inview" data-scroll-repeat>
          ${s.text}
        </div>
        <div class="end-credit" data-scroll data-scroll-class="is-inview" data-scroll-repeat>
          poem &amp; visuals · in memory of Jay Gatsby
        </div>
      `;
      root.appendChild(el);
    }
  });
}

function boot() {
  buildDom();

  const stage = new Stage(document.getElementById('three-canvas'));
  const root = document.getElementById('scroll-container');
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
    SCENE_KEYS.map((key) => [key, sectionEls.filter((el) => el.dataset.scene === key)]),
  );

  // eslint-disable-next-line no-undef
  const scroll = new LocomotiveScroll({
    el: root,
    smooth: true,
    lerp: 0.07,
    multiplier: 0.92,
    touchMultiplier: 1.2,
    getDirection: true,
    getSpeed: true,
    smartphone: { smooth: true, multiplier: 1.0 },
    tablet: { smooth: true, multiplier: 0.95 },
  });

  let lastChapterKey = 'shoreline';
  let lastBeatId = '';
  let latestInstance = null;
  let rafPending = false;
  let lastY = 0;
  let lastTime = performance.now();
  const bootMessages = [
    'bootrom // west egg archive // preparing scene memory',
    'locomotive sync // calibrating chapter drift',
    'three canvas // resolving water, fog, and gold',
    'signal stable // awaiting reader input',
  ];
  let bootIndex = 0;
  const bootTicker = window.setInterval(() => {
    bootIndex = (bootIndex + 1) % bootMessages.length;
    loaderStatus.textContent = bootMessages[bootIndex];
  }, 950);

  function measureSceneState() {
    rafPending = false;

    const vh = window.innerHeight;
    const center = vh * 0.5;
    const states = Object.fromEntries(
      SCENE_KEYS.map((key) => [key, { intensity: 0, progress: 0, distance: Infinity }]),
    );
    let activeSection = sectionEls[0] || null;
    let activeDistance = Infinity;

    SCENE_KEYS.forEach((key) => {
      const els = sectionsByScene[key];
      let bestInfluence = 0;
      let bestProgress = 0;
      let bestDistance = Infinity;

      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height * 0.5;
        const distance = Math.abs(elCenter - center);
        const influence = clamp(1 - distance / (vh * 0.95), 0, 1) ** 2.2;
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
      chapterRoman.textContent = info.roman;
      chapterName.textContent = info.name;
      chapterCode.textContent = info.code;
      systemCode.textContent = `${info.code} // ${info.name}`;
      lastChapterKey = chapterKey;
    }

    if (activeSection?.dataset.entryId && activeSection.dataset.entryId !== lastBeatId) {
      shotTitle.textContent = activeSection.dataset.shot || '';
      shotTransition.textContent = activeSection.dataset.transition || '';
      lastBeatId = activeSection.dataset.entryId;
    }
  }

  function syncScrollMetrics(instance) {
    const now = performance.now();
    const y = instance?.scroll?.y ?? 0;
    const limit = instance?.limit?.y || instance?.limit || 1;
    const progress = clamp(y / limit, 0, 1);
    const dt = Math.max(16, now - lastTime);
    const velocity = instance?.speed ?? ((y - lastY) / dt) * 16.0;
    const direction = instance?.direction === 'up' ? -1 : 1;

    stage.setScrollMetrics({ progress, velocity, direction });
    progressFill.style.transform = `scaleY(${progress})`;

    lastY = y;
    lastTime = now;
  }

  function requestMeasure() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(measureSceneState);
  }

  scroll.on('scroll', (instance) => {
    latestInstance = instance;
    syncScrollMetrics(instance);
    requestMeasure();
  });

  requestAnimationFrame(() => {
    latestInstance = scroll.scroll?.instance || latestInstance;
    if (latestInstance) syncScrollMetrics(latestInstance);
    measureSceneState();
  });

  window.addEventListener('load', () => {
    setTimeout(() => {
      window.clearInterval(bootTicker);
      document.getElementById('loader').classList.add('hidden');
      scroll.update();
      latestInstance = scroll.scroll?.instance || latestInstance;
      if (latestInstance) syncScrollMetrics(latestInstance);
      measureSceneState();
    }, 700);
  });

  window.addEventListener('resize', () => {
    scroll.update();
    requestMeasure();
  });
}

boot();
