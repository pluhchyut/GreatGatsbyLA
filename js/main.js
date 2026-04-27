// App entry. Builds the scrolling DOM from poem.js, sets up Locomotive Scroll,
// initializes the Three.js stage, and wires scroll position to the active visual.

import { Stage } from './scene.js';
import { sections } from './poem.js';

// Roman numerals + chapter names for the top-right marker.
// Tied to which "scene" is currently active.
const CHAPTER_INFO = {
  greenLight:    { roman: 'I',   name: 'longing' },
  goldParticles: { roman: 'II',  name: 'parties' },
  mansion:       { roman: 'III', name: 'the house' },
  artDeco:       { roman: 'IV',  name: 'daisy' },
  vortex:        { roman: 'V',   name: 'collapse' },
  boat:          { roman: 'VI',  name: 'wake' },
};

// ---------- Build DOM ----------
function buildDom() {
  const root = document.getElementById('scroll-container');
  let quoteToggle = false; // alternate quote alignment
  let lineIdx = 0;

  sections.forEach((s, i) => {
    if (s.type === 'hero') {
      const el = document.createElement('section');
      el.className = 'hero';
      el.dataset.scene = s.scene;
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';
      el.innerHTML = `
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
        <div class="hero-scroll-cue">scroll</div>
      `;
      root.appendChild(el);
      return;
    }

    if (s.type === 'line') {
      lineIdx++;
      const el = document.createElement('section');
      el.className = 'poem-section';
      el.dataset.scene = s.scene;
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';

      // First line of the poem gets a drop cap on its first letter
      let html;
      if (lineIdx === 1) {
        const m = s.text.match(/^(.)(.*)$/);
        html = `<span class="drop">${m[1]}</span>${m[2]}`;
      } else {
        html = s.text;
      }

      el.innerHTML = `
        <p class="poem-line" data-scroll data-scroll-class="is-inview"
           data-scroll-repeat data-scroll-speed="${(i % 2 === 0) ? 1 : -1}">
          ${html}
        </p>
      `;
      root.appendChild(el);
      return;
    }

    if (s.type === 'quote') {
      const el = document.createElement('section');
      el.className = 'quote-section' + (quoteToggle ? ' align-right' : '');
      quoteToggle = !quoteToggle;
      el.dataset.scene = s.scene;
      el.dataset.scroll = '';
      el.dataset.scrollSection = '';
      el.innerHTML = `
        <blockquote class="quote-block" data-scroll data-scroll-class="is-inview"
                    data-scroll-repeat data-scroll-speed="2">
          <p class="quote-text">${s.text}</p>
          <span class="quote-cite">${s.cite}</span>
        </blockquote>
      `;
      root.appendChild(el);
      return;
    }

    if (s.type === 'end') {
      const el = document.createElement('section');
      el.className = 'end-section';
      el.dataset.scene = s.scene;
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
      return;
    }
  });
}

// ---------- Boot ----------
function boot() {
  buildDom();

  const stage = new Stage(document.getElementById('three-canvas'));

  // Init Locomotive Scroll
  // eslint-disable-next-line no-undef
  const scroll = new LocomotiveScroll({
    el: document.querySelector('#scroll-container'),
    smooth: true,
    multiplier: 0.85,
    lerp: 0.08,
    smartphone: { smooth: true },
    tablet:     { smooth: true },
  });

  const sectionsEls = Array.from(document.querySelectorAll('[data-scene]'));
  const progressFill = document.getElementById('progress-fill');
  const chapterRoman = document.getElementById('chapter-roman');
  const chapterName  = document.getElementById('chapter-name');

  // Determine which section is "active" (closest to center of viewport)
  // and tell the stage which visual to show.
  let lastSceneKey = null;
  function updateActiveScene() {
    const vh = window.innerHeight;
    const center = vh * 0.45;
    let best = null;
    let bestDist = Infinity;
    sectionsEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elCenter = rect.top + rect.height / 2;
      const d = Math.abs(elCenter - center);
      if (d < bestDist) { bestDist = d; best = el; }
    });
    if (best) {
      const key = best.dataset.scene;
      if (key !== lastSceneKey) {
        stage.setActive(key);
        const info = CHAPTER_INFO[key];
        if (info) {
          chapterRoman.textContent = info.roman;
          chapterName.textContent = info.name;
        }
        lastSceneKey = key;
      }
    }
  }

  scroll.on('scroll', (instance) => {
    const limit = instance.limit?.y || instance.limit || 1;
    const y = instance.scroll?.y ?? 0;
    const p = Math.max(0, Math.min(1, y / limit));
    stage.setScrollProgress(p);
    progressFill.style.height = (p * 100) + '%';
    updateActiveScene();
  });

  // Initial paint
  updateActiveScene();

  // Hide loader once everything is on screen
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('loader').classList.add('hidden');
      // Recompute Locomotive layout once visuals are sized
      scroll.update();
    }, 600);
  });

  window.addEventListener('resize', () => {
    scroll.update();
  });
}

boot();
