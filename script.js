// On a manual refresh, start at the top instead of restoring the previous
// scroll position. Only affects reloads with no #hash, so back/forward
// restoration and #section deep-links keep working.
(function () {
  if (!('scrollRestoration' in history)) return;
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var isReload = nav ? nav.type === 'reload'
                     : (performance.navigation && performance.navigation.type === 1);
  if (isReload && !location.hash) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    window.addEventListener('load', function () { window.scrollTo(0, 0); });
  }
})();

// Custom cursor (pointer devices only)
if (window.matchMedia('(pointer: fine)').matches) {
  const diff  = document.createElement('div');
  diff.id = 'cursor-diff';   diff.className = 'cursor-layer';
  const scr   = document.createElement('div');
  scr.id  = 'cursor-screen'; scr.className  = 'cursor-layer';
  const white = document.createElement('div');
  white.id = 'cursor-white'; white.className = 'cursor-layer';
  document.body.appendChild(diff);
  document.body.appendChild(scr);
  document.body.appendChild(white);

  const photoCursor = document.createElement('div');
  photoCursor.id = 'cursor-photo';
  photoCursor.textContent = '↓';
  document.body.appendChild(photoCursor);

  const navCursor = document.createElement('div');
  navCursor.id = 'cursor-nav';
  navCursor.textContent = '→';
  document.body.appendChild(navCursor);

  const introPhoto   = document.querySelector('.intro-photo');
  const eventZones   = [
    document.querySelector('.alt-cover'),
    ...Array.from(document.querySelectorAll('.project-thumb'))
  ].filter(Boolean);

  const imgs = Array.from(document.querySelectorAll('img'));
  const R = 16;
  const NAV_H = 60;

  // Cache img rects in DOCUMENT coordinates so neither scroll nor mousemove
  // ever forces a layout read — only load / resize / image-decode refresh them.
  let introRect  = null;   // { left, right, top, bottom } in document space
  let imgData    = [];     // same, per content image

  const cacheRects = () => {
    const sy = window.scrollY, sx = window.scrollX;
    if (introPhoto) {
      const r = introPhoto.getBoundingClientRect();
      introRect = { left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy };
    } else {
      introRect = null;
    }
    imgData = imgs.map(img => {
      const raw = img.getBoundingClientRect();
      const par = img.parentElement.getBoundingClientRect();
      return {
        top:    Math.max(raw.top + sy,    par.top + sy),
        bottom: Math.min(raw.bottom + sy, par.bottom + sy),
        left:   Math.max(raw.left + sx,   par.left + sx),
        right:  Math.min(raw.right + sx,  par.right + sx),
      };
    });
  };

  cacheRects();
  window.addEventListener('load',   cacheRects);
  window.addEventListener('resize', cacheRects);
  imgs.forEach(img => { if (!img.complete) img.addEventListener('load', cacheRects); });

  // project-cover and project-thumbs: use native mouseenter/mouseleave
  // (nothing overlaps them, so native events are instant and reliable)
  let overEventZone = false;

  let mouseX = -200, mouseY = -200, rafPending = false, onPhotoZone = false, onNavZone = false;

  function checkIntroRect(cx, cy) {
    if (!introRect) return false;
    const sx = window.scrollX, sy = window.scrollY;
    return cx >= introRect.left - sx && cx <= introRect.right - sx &&
           cy >= introRect.top  - sy && cy <= introRect.bottom - sy;
  }

  function setZone(active) {
    if (active === onPhotoZone) return;
    onPhotoZone = active;
    if (active) {
      diff.style.opacity  = '0';
      scr.style.opacity   = '0';
      white.style.opacity = '0';
      photoCursor.classList.add('active');
    } else {
      diff.style.opacity  = '';
      scr.style.opacity   = '';
      photoCursor.classList.remove('active');
    }
  }

  // event-based zones: instant, no computation needed
  eventZones.forEach(zone => {
    zone.addEventListener('mouseenter', () => { overEventZone = true; setZone(true); });
    zone.addEventListener('mouseleave', () => {
      overEventZone = false;
      if (!checkIntroRect(mouseX, mouseY)) setZone(false);
    });
  });

  // pe-link zones + See More project cards: show nav cursor (→), hide blend-mode layers
  Array.from(document.querySelectorAll('.pe-link, .project-card a:not(.project-link)')).forEach(link => {
    link.addEventListener('mouseenter', () => {
      onNavZone = true;
      diff.style.opacity  = '0';
      scr.style.opacity   = '0';
      white.style.opacity = '0';
      navCursor.classList.add('active');
    });
    link.addEventListener('mouseleave', () => {
      onNavZone = false;
      diff.style.opacity  = '';
      scr.style.opacity   = '';
      navCursor.classList.remove('active');
    });
  });

  document.addEventListener('mousemove', e => {
    const cx = e.clientX, cy = e.clientY;
    mouseX = cx; mouseY = cy;

    // Positions use GPU-composited transforms — safe and instant in mousemove
    const pos = `translate3d(${cx}px,${cy}px,0)`;
    diff.style.transform  = pos;
    scr.style.transform   = pos;
    white.style.transform = pos;
    photoCursor.style.translate = `${cx}px ${cy}px`;
    navCursor.style.translate = `${cx}px ${cy}px`;

    // intro-photo zone check (rect-based, nothing overlaps it event-wise)
    if (!overEventZone) setZone(checkIntroRect(cx, cy));

    if (onPhotoZone || onNavZone) return;

    // image-hover check: throttle via rAF (cheap arithmetic but runs every move)
    if (!rafPending) { rafPending = true; requestAnimationFrame(updateWhite); }
  });

  function updateWhite() {
    rafPending = false;
    const cx = mouseX, cy = mouseY;

    // Is the cursor over a content picture? (hero / cover / grid are handled by zones)
    let overImg = false;
    if (cy > NAV_H) {
      const sx = window.scrollX, sy = window.scrollY;
      for (const d of imgData) {
        const l = d.left - sx, r = d.right - sx, t = Math.max(NAV_H, d.top - sy), b = d.bottom - sy;
        if (r <= l || b <= t) continue;
        if (cx >= l && cx <= r && cy >= t && cy <= b) { overImg = true; break; }
      }
    }

    if (overImg) {
      // over a picture: solid blue cursor (no screen blend, no inverting)
      diff.style.opacity  = '0';
      scr.style.opacity   = '0';
      white.style.opacity = '1';
    } else {
      // elsewhere: inverting cursor
      diff.style.opacity  = '';
      scr.style.opacity   = '';
      white.style.opacity = '0';
    }
  }
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').replace(/^#/, '');
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;
    e.preventDefault();
    const start = window.scrollY;
    const end = id ? target.getBoundingClientRect().top + window.scrollY - 60 : 0;
    const duration = 450;
    const startTime = performance.now();
    const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const step = now => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, start + (end - start) * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
});

// Click the title/cover image (↓ cursor) to scroll to the next section
(function () {
  const NAV_H = 60;

  function smoothScrollToY(end) {
    const start = window.scrollY;
    const distance = end - start;
    const duration = 800;
    const startTime = performance.now();
    // easeInOutCubic for a smooth, soft transition
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = now => {
      const progress = Math.min((now - startTime) / duration, 1);
      window.scrollTo(0, start + distance * ease(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function scrollToEl(el) {
    if (!el) return;
    smoothScrollToY(el.getBoundingClientRect().top + window.scrollY - NAV_H);
  }

  // Main page: click anywhere over the title photo area → Projects section.
  // The photo sits behind the text overlay, so we hit-test by coordinates
  // (matching where the ↓ cursor appears) rather than relying on the element.
  const introPhoto = document.querySelector('.intro-photo');
  const projects = document.getElementById('projects');
  if (introPhoto && projects) {
    document.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      const r = introPhoto.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= Math.max(r.top, NAV_H) && e.clientY <= r.bottom) {
        scrollToEl(projects);
      }
    });
  }

  // Project pages: cover image → first content image (sticky scroll section)
  const cover = document.querySelector('.alt-cover');
  const firstContent = document.querySelector('.alt-sticky-wrapper');
  if (cover && firstContent) {
    cover.addEventListener('click', () => scrollToEl(firstContent));
  }
})();

// Project page back button: smart return to the homepage
(function () {
  const back = document.querySelector('.nav-back');
  if (!back) return;
  back.addEventListener('click', e => {
    e.preventDefault();
    let cameFromIndex = false;
    try {
      const ref = new URL(document.referrer, location.href);
      if (ref.origin === location.origin) {
        const page = ref.pathname.split('/').pop();
        if (page === '' || page === 'index.html') cameFromIndex = true;
      }
    } catch (err) {}
    if (cameFromIndex && history.length > 1) {
      // Returns to the homepage at the exact scroll position we left from
      history.back();
    } else {
      // Came from another project (or direct entry): land on the projects section
      location.href = 'index.html#projects';
    }
  });
})();

// Language toggle
const langBtns = document.querySelectorAll('.lang-btn');
const translatables = document.querySelectorAll('[data-en]');

function applyLang(lang) {
  if (lang !== 'de') lang = 'en';
  langBtns.forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.documentElement.lang = lang;
  translatables.forEach(el => {
    const val = el.dataset[lang];
    if (val !== undefined) el.innerHTML = val;
  });
  try { localStorage.setItem('lang', lang); } catch (e) {}
}

langBtns.forEach(btn => {
  btn.addEventListener('click', () => applyLang(btn.dataset.lang));
});

// Persist language across pages: apply the saved choice on load
(function () {
  let saved = 'en';
  try { saved = localStorage.getItem('lang') || 'en'; } catch (e) {}
  applyLang(saved);
})();

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const matches = href === '#' + entry.target.id ||
                        (href === '#' && entry.target.id === 'intro');
        link.classList.toggle('active', matches);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

// Back to top button
const backToTop = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 200);
}, { passive: true });

// Alt-layout scroll behaviour: on desktop the left caption column is pinned
// while the right image column scrolls normally. The caption shows the image
// that is fully in the viewport; when none is (small / large viewports) or
// several are, the one filling the most of the viewport.
(function () {
  var wrapper     = document.querySelector('.alt-sticky-wrapper');
  var panels      = document.querySelectorAll('.alt-text-panel');
  var scrollItems = document.querySelectorAll('.alt-scroll-item');
  if (!wrapper || !panels.length || !scrollItems.length) return;

  var panelsWrapper = document.querySelector('.alt-panels-wrapper');
  var scrollRight   = document.querySelector('.alt-scroll-right');
  var NAV_HEIGHT    = 60;
  var isDesktop     = false;
  var currentIndex  = -1;

  // Document-absolute top/bottom of every image, cached so the scroll handler
  // is pure arithmetic (no getBoundingClientRect per frame → same light scroll
  // feel as the rest of the site).
  var tops = [], bots = [];
  function cacheRects() {
    var y = window.scrollY;
    for (var i = 0; i < scrollItems.length; i++) {
      var r = scrollItems[i].getBoundingClientRect();
      tops[i] = r.top + y;
      bots[i] = r.bottom + y;
    }
  }

  // Which text panel belongs to a given image (images can share a panel)
  function panelIndexFor(itemIndex) {
    if (itemIndex < 0) return -1;
    var item = scrollItems[itemIndex];
    var idx = (item && item.dataset.panelIndex !== undefined)
      ? parseInt(item.dataset.panelIndex, 10)
      : itemIndex;
    return Math.min(idx, panels.length - 1);
  }

  // Trailing space below the last image so the pinned caption column un-pins
  // exactly when the last caption clears the bottom of the last image, instead
  // of lingering in an empty viewport.
  function fitTrailing() {
    if (!isDesktop || !scrollRight) return;
    var p = panels[panelIndexFor(scrollItems.length - 1)];
    if (!p) return;
    var d = p.style.display;
    p.style.display = 'block';
    var h = p.offsetHeight;
    p.style.display = d;
    scrollRight.style.paddingBottom = Math.round(h + 72) + 'px';   // caption height + small gap
  }

  // Desktop: collect every caption into the pinned left column; the right
  // image column stays in normal document flow and scrolls past it.
  function activateDesktop() {
    if (panelsWrapper) {
      panels.forEach(function (panel) {
        panel.classList.remove('active', 'leaving');
        panelsWrapper.appendChild(panel);
      });
    }
    wrapper.classList.add('alt-anim');
    currentIndex = -1;
    fitTrailing();
    cacheRects();
    onScroll();
  }

  // Mobile: revert to the inline flow (panels sit between the images).
  function activateMobile() {
    wrapper.classList.remove('alt-anim');
    if (scrollRight) scrollRight.style.paddingBottom = '';
    panels.forEach(function (panel) {
      panel.classList.remove('active', 'leaving');
      var idx  = panel.dataset.panel;
      var item = document.querySelector('.alt-scroll-item[data-index="' + idx + '"]');
      if (item) item.parentNode.insertBefore(panel, item.nextSibling);
    });
    scrollItems.forEach(function (item) { item.classList.remove('active'); });
  }

  function setActive(index) {
    if (index === currentIndex) return;
    var nextPanel = panelIndexFor(index);
    currentIndex = index;

    // Mark the current image (cosmetic; all images render in normal flow now).
    for (var i = 0; i < scrollItems.length; i++) {
      scrollItems[i].classList.toggle('active', i === index);
    }

    // Show its caption, hard cut, hide the rest.
    panels.forEach(function (panel, i) {
      panel.classList.toggle('active', i === nextPanel);
    });
  }

  // Show the caption of the image that is fully in the viewport. If none is, or
  // several are (small / large viewports), the one covering the most of it.
  function onScroll() {
    if (!isDesktop) return;
    var y = window.scrollY;
    var vpTop = y + NAV_HEIGHT, vpBottom = y + window.innerHeight;
    var vh = window.innerHeight - NAV_HEIGHT;

    var fullCount = 0, onlyFull = -1, bestCov = 0, bestIdx = -1, curVis = 0;
    for (var i = 0; i < scrollItems.length; i++) {
      var vis = Math.min(bots[i], vpBottom) - Math.max(tops[i], vpTop);
      if (vis <= 0) continue;                          // not on screen at all
      if (i === currentIndex) curVis = vis;
      if (vis > bestCov) { bestCov = vis; bestIdx = i; }
      if (tops[i] >= vpTop - 1 && bots[i] <= vpBottom + 1) { fullCount++; onlyFull = i; }
    }
    if (bestIdx < 0) return;                           // nothing visible → keep the current caption

    var target;
    if (fullCount === 1) {
      target = onlyFull;
    } else {
      target = bestIdx;
      // hysteresis in the ambiguous zone so the caption doesn't flicker at the crossover
      if (curVis > 0 && target !== currentIndex && bestCov - curVis < 0.06 * vh) target = currentIndex;
    }
    setActive(target);
  }

  // Respond to viewport width crossing the breakpoint
  function checkBreakpoint() {
    var nowDesktop = window.innerWidth > 860;
    if (nowDesktop === isDesktop) {
      if (isDesktop) { fitTrailing(); cacheRects(); onScroll(); } // re-evaluate on resize
      return;
    }
    isDesktop = nowDesktop;
    currentIndex = -1;
    if (isDesktop) {
      activateDesktop();
    } else {
      activateMobile();
    }
  }

  window.addEventListener('load',   checkBreakpoint);
  window.addEventListener('resize', checkBreakpoint);
  window.addEventListener('scroll', onScroll, { passive: true });
  // Lazy images change the layout below them → refresh the cached positions.
  scrollItems.forEach(function (item) {
    var img = item.querySelector('img');
    if (img) img.addEventListener('load', function () {
      if (isDesktop) { fitTrailing(); cacheRects(); onScroll(); }
    });
  });
  // A language switch changes the last caption's height → refit the trailing space.
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      setTimeout(function () { if (isDesktop) { fitTrailing(); cacheRects(); onScroll(); } }, 0);
    });
  });
  checkBreakpoint();
})();

// Momentum smooth scrolling for the whole page.
// Eases the real scroll position (no transform wrapper), so position: sticky,
// the custom cursor and the anchor smooth-scroll keep working untouched.
// Desktop pointer devices only; mobile keeps native scrolling.
//
// Inside the case-study section it steps: each scroll gesture / key press moves
// exactly one image, which snaps with its top edge on the caption line. Input
// during the glide is ignored, so you can't overscroll or skip images.
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var EASE    = 0.1;                  // lerp per frame: lower = smoother / longer glide
  var target  = window.scrollY;
  var current = window.scrollY;
  var running = false;

  // ── Magnetic snap: case-study image strip ────────────────────────────
  // Scrolling stays completely normal everywhere. When it comes to rest near
  // an image inside the strip, it gently eases the rest of the way so the
  // image's top sits on the caption line. It only ever eases FORWARD in the
  // direction you were scrolling — it never pulls back, so overscrolling just
  // leaves you a little past, no bounce.
  var snapWrapper    = document.querySelector('.alt-sticky-wrapper');
  var snapItems      = snapWrapper ? snapWrapper.querySelectorAll('.alt-scroll-item') : [];
  var panelsWrapperEl = document.querySelector('.alt-panels-wrapper');
  var coverEl        = document.querySelector('.alt-cover');

  var SNAP_EPS     = 2;      // px tolerance for "already aligned"
  var TWEEN_DUR    = 700;    // ms for a magnetic ease — soft start, soft stop
  var SETTLE_DELAY = 90;     // ms of scroll silence before the ease kicks in
  var PULL_FRAC    = 0.6;    // only complete a move once you're >40% into the gap

  var lastScrollY = window.scrollY;
  var scrollDir   = 1;
  var settleTimer = null;
  var committedIndex = -1;
  var rechecked   = false;
  var tweening    = false;
  var tweenFrom   = 0;
  var tweenTo     = 0;
  var tweenStart  = 0;

  function perfNow() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }
  function clamp(v) { return Math.max(0, Math.min(v, maxScroll())); }

  function lineY() {
    return panelsWrapperEl
      ? panelsWrapperEl.getBoundingClientRect().top
      : 60 + 64;
  }
  function snapEnabled() {
    return snapItems.length && snapWrapper.classList.contains('alt-anim');
  }
  // Scroll positions at which each image's top sits on the caption line.
  function computeSnaps(line) {
    var y = window.scrollY;
    var out = [];
    for (var i = 0; i < snapItems.length; i++) {
      var v = clamp(y + snapItems[i].getBoundingClientRect().top - line);
      if (!out.length || Math.abs(v - out[out.length - 1]) > SNAP_EPS) out.push(v);
    }
    return out;
  }
  // Every strip image's top-on-the-line scroll position (index 0 = first image).
  function imgSnaps() {
    if (!snapEnabled()) return null;
    var all = computeSnaps(lineY());
    return all.length ? all : null;
  }
  // Scroll position where the title image's BOTTOM edge sits on the caption
  // line — one gentle snap above the first strip image; from there upward it is
  // ordinary scrolling again.
  function coverBottomY() {
    if (!coverEl) return null;
    return clamp(window.scrollY + coverEl.getBoundingClientRect().bottom - lineY());
  }
  function nextSnap(snaps, from, dir) {
    if (dir > 0) {
      for (var i = 0; i < snaps.length; i++) if (snaps[i] > from + SNAP_EPS) return snaps[i];
    } else {
      for (var j = snaps.length - 1; j >= 0; j--) if (snaps[j] < from - SNAP_EPS) return snaps[j];
    }
    return null;
  }

  function loop() {
    if (tweening) {
      // Time-based eased slide for the magnetic pull: gentle in, gentle out.
      var t = (perfNow() - tweenStart) / TWEEN_DUR;
      if (committedIndex >= 0 && !rechecked && t > 0.6) {
        rechecked = true;                   // re-measure once (lazy image may have shifted things)
        var ss = imgSnaps();
        if (ss && committedIndex < ss.length && Math.abs(ss[committedIndex] - tweenTo) > SNAP_EPS) {
          tweenTo = target = clamp(ss[committedIndex]);
        }
      }
      if (t >= 1) {
        current = target = tweenTo;
        window.scrollTo(0, current);
        running = false; tweening = false; rechecked = false;
        committedIndex = -1;
        return;
      }
      current = tweenFrom + (tweenTo - tweenFrom) * easeInOutCubic(t);
      window.scrollTo(0, current);
      requestAnimationFrame(loop);
      return;
    }

    current += (target - current) * EASE;   // free-scroll momentum
    if (Math.abs(target - current) < 0.4) {
      current = target;
      window.scrollTo(0, current);
      running = false;
      return;
    }
    window.scrollTo(0, current);
    requestAnimationFrame(loop);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(loop); } }
  function stop()  { running = false; tweening = false; committedIndex = -1; }

  // Plain momentum scrolling — no brakes anywhere, the page (intro, the info
  // block with Client / My Tasks, everything) scrolls completely normally.
  function freeScroll(delta) {
    committedIndex = -1;
    tweening = false;
    target = clamp(target + delta);
    var maxGap = window.innerHeight;
    if (target - current >  maxGap) target = current + maxGap;
    if (target - current < -maxGap) target = current - maxGap;
  }

  function commitTween(toY, idx) {
    tweenFrom  = current;
    tweenTo    = clamp(toY);
    tweenStart = perfNow();
    target     = tweenTo;
    committedIndex = idx;
    tweening   = true;
    rechecked  = false;
    start();
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;            // let pinch-to-zoom through
    e.preventDefault();
    if (!running) { current = target = window.scrollY; }
    var unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1);
    freeScroll(e.deltaY * unit);
    start();
    scheduleSettle();
  }, { passive: false });

  // After scrolling goes quiet, ease onto the image you were heading toward —
  // FORWARD only, so overscrolling never bounces back.
  function settle() {
    if (running || !snapEnabled()) return;
    var all = computeSnaps(lineY());
    if (!all.length) return;
    var y = window.scrollY;
    var gap = all.length > 1 ? Math.abs(all[1] - all[0]) : window.innerHeight;
    if (y < all[0] - PULL_FRAC * gap || y > all[all.length - 1] + 4) return;   // outside the strip's span

    var dir = scrollDir, tgt, idx = -1;
    var nx = nextSnap(all, y, dir);
    if (nx != null) {
      tgt = nx; idx = all.indexOf(nx);
    } else if (dir < 0) {
      tgt = coverBottomY();                    // up off the first image → title-image bottom
      if (tgt == null) return;
    } else {
      return;                                  // down off the last image → let it scroll on out
    }

    if (dir > 0 && tgt <= y + SNAP_EPS) return;     // forward only — never pull backward
    if (dir < 0 && tgt >= y - SNAP_EPS) return;
    if (idx >= 0 && Math.abs(tgt - y) > PULL_FRAC * gap) return;  // only finish a move you're well into

    current = y;
    commitTween(tgt, idx);
  }
  function scheduleSettle() {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, SETTLE_DELAY);
  }
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y !== lastScrollY) scrollDir = y > lastScrollY ? 1 : -1;
    lastScrollY = y;
    if (running) return;             // our own glide frames
    scheduleSettle();
  }, { passive: true });

  // Yield to other scroll sources (anchor clicks, cover click, scrollbar drag,
  // keyboard) — they scroll natively; settle() aligns afterwards.
  function release() { stop(); clearTimeout(settleTimer); }
  window.addEventListener('mousedown', release);
  window.addEventListener('keydown', release);
  window.addEventListener('resize', function () { target = clamp(target); });

  // Late-loading images inside the strip shift the snap positions below them.
  if (snapWrapper && window.ResizeObserver) {
    var roTimer = null;
    new ResizeObserver(function () {
      clearTimeout(roTimer);
      roTimer = setTimeout(function () { if (!running) settle(); }, 150);
    }).observe(snapWrapper);
  }
})();


// Mobile burger menu: full-page sheet sliding in from the top
(function () {
  var nav = document.querySelector('nav');
  var navLinks = document.querySelector('.nav-links');
  if (!nav || !navLinks) return;

  var burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', 'Menu');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span><span></span>';
  nav.appendChild(burger);

  var sheet = document.createElement('div');
  sheet.className = 'nav-sheet';
  var ul = document.createElement('ul');
  Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (a) {
    var li = document.createElement('li');
    li.appendChild(a.cloneNode(true));
    ul.appendChild(li);
  });
  sheet.appendChild(ul);
  document.body.appendChild(sheet);

  function setLang() {
    // keep cloned links in the current language
    var lang = document.documentElement.lang === 'de' ? 'de' : 'en';
    ul.querySelectorAll('a[data-' + lang + ']').forEach(function (a) {
      a.textContent = a.dataset[lang];
    });
  }

  function open()  { sheet.classList.add('open');    burger.classList.add('open');    document.body.classList.add('nav-sheet-open');    burger.setAttribute('aria-expanded', 'true'); }
  function close() { sheet.classList.remove('open'); burger.classList.remove('open'); document.body.classList.remove('nav-sheet-open'); burger.setAttribute('aria-expanded', 'false'); }

  burger.addEventListener('click', function () {
    if (sheet.classList.contains('open')) { close(); }
    else { setLang(); open(); }
  });

  // Close on background tap (not on a link)
  sheet.addEventListener('click', function (e) {
    if (e.target === sheet || e.target === ul) close();
  });

  // Link clicks: close, smooth-scroll for same-page anchors
  ul.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      close();
      if (href && href.charAt(0) === '#') {
        e.preventDefault();
        var id = href.slice(1);
        var target = id ? document.getElementById(id) : document.documentElement;
        if (target) {
          var endY = id ? target.getBoundingClientRect().top + window.scrollY - 60 : 0;
          window.scrollTo({ top: endY, behavior: 'smooth' });
        }
      }
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) close();
  });
})();

// ── DISCLAIMER MARQUEE SPEED ────────────────────────────────────────────
// Run the disclaimer band at a constant pixels-per-second pace so it reads
// at the same speed as the homepage marquee on every project page, whatever
// the sentence length. CSS keeps a 28s fallback if this doesn't run.
(function () {
  var SPEED = 300; // px per second — matches the homepage marquee's pace
  var tracks = document.querySelectorAll('.marquee-band--disclaimer .marquee-track');
  if (!tracks.length) return;

  function sync() {
    for (var i = 0; i < tracks.length; i++) {
      var half = tracks[i].scrollWidth / 2;
      if (half > 0) tracks[i].style.animationDuration = (half / SPEED).toFixed(2) + 's';
    }
  }

  sync();
  window.addEventListener('load', sync);
  window.addEventListener('resize', sync);
  // DE/EN swap changes the sentence width, so re-measure after a toggle
  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(sync, 0); });
  });
})();
