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

  // Cache img rects so mousemove never forces a layout read
  let introRect  = introPhoto ? introPhoto.getBoundingClientRect() : null;
  let imgData    = [];

  const cacheRects = () => {
    introRect = introPhoto ? introPhoto.getBoundingClientRect() : null;
    imgData   = imgs.map(img => {
      const raw = img.getBoundingClientRect();
      const par = img.parentElement.getBoundingClientRect();
      return {
        top:    Math.max(NAV_H, raw.top,    par.top),
        bottom: Math.min(raw.bottom, par.bottom),
        left:   Math.max(raw.left,   par.left),
        right:  Math.min(raw.right,  par.right),
      };
    });
  };

  cacheRects();
  window.addEventListener('load',   cacheRects);
  window.addEventListener('scroll', cacheRects, { passive: true });
  window.addEventListener('resize', cacheRects);
  imgs.forEach(img => { if (!img.complete) img.addEventListener('load', cacheRects); });

  // project-cover and project-thumbs: use native mouseenter/mouseleave
  // (nothing overlaps them, so native events are instant and reliable)
  let overEventZone = false;

  let mouseX = -200, mouseY = -200, rafPending = false, onPhotoZone = false, onNavZone = false;

  function checkIntroRect(cx, cy) {
    if (!introRect) return false;
    return cx >= introRect.left && cx <= introRect.right &&
           cy >= introRect.top  && cy <= introRect.bottom;
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

  // pe-link zones: show nav cursor (→), hide blend-mode layers
  Array.from(document.querySelectorAll('.pe-link')).forEach(link => {
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
      for (const d of imgData) {
        if (d.right <= d.left || d.bottom <= d.top) continue;
        if (cx >= d.left && cx <= d.right && cy >= d.top && cy <= d.bottom) { overImg = true; break; }
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

// Alt-layout sticky scroll panel switching
(function () {
  var panels      = document.querySelectorAll('.alt-text-panel');
  var scrollItems = document.querySelectorAll('.alt-scroll-item');
  if (!panels.length || !scrollItems.length) return;

  var panelsWrapper = document.querySelector('.alt-panels-wrapper');
  var isDesktop     = false;

  // Move panels into sticky container (desktop)
  function activateDesktop() {
    if (!panelsWrapper) return;
    panels.forEach(function (panel) {
      panel.classList.remove('active');
      panelsWrapper.appendChild(panel);
    });
    if (panels[0]) panels[0].classList.add('active');
    cacheItemTops();
    onScroll();
  }

  // Move panels back between images (mobile)
  function activateMobile() {
    panels.forEach(function (panel) {
      var idx  = panel.dataset.panel;
      var item = document.querySelector('.alt-scroll-item[data-index="' + idx + '"]');
      if (item) item.parentNode.insertBefore(panel, item.nextSibling);
    });
  }

  var NAV_HEIGHT   = 60;
  var currentIndex = -1;
  var itemTops     = [];

  function cacheItemTops() {
    itemTops = Array.from(scrollItems).map(function (item) {
      var top = 0, el = item;
      while (el) { top += el.offsetTop; el = el.offsetParent; }
      return top;
    });
  }

  function setActive(index) {
    if (index === currentIndex) return;
    currentIndex = index;
    panels.forEach(function (panel, i) {
      panel.classList.toggle('active', i === index);
    });
  }

  function onScroll() {
    var trigger = window.scrollY + NAV_HEIGHT + 2;
    var active  = 0;
    itemTops.forEach(function (top, i) { if (top <= trigger) active = i; });
    var item = scrollItems[active];
    var panelIdx = (item && item.dataset.panelIndex !== undefined)
      ? parseInt(item.dataset.panelIndex, 10)
      : active;
    setActive(Math.min(panelIdx, panels.length - 1));
  }

  // Respond to viewport width crossing the breakpoint
  function checkBreakpoint() {
    var nowDesktop = window.innerWidth > 860;
    if (nowDesktop === isDesktop) {
      if (isDesktop) cacheItemTops(); // recalc on resize within desktop
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
  checkBreakpoint();
})();

