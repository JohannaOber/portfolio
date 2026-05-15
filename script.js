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

  const imgs = document.querySelectorAll('img');
  const R = 16;
  const NAV_H = 60;

  document.addEventListener('mousemove', e => {
    const cx = e.clientX, cy = e.clientY;
    const x = cx + 'px', y = cy + 'px';
    diff.style.left  = x; diff.style.top  = y;
    scr.style.left   = x; scr.style.top   = y;
    white.style.left = x; white.style.top = y;

    let found = null;
    if (cy > NAV_H) {
      for (const img of imgs) {
        const raw = img.getBoundingClientRect();
        const par = img.parentElement.getBoundingClientRect();
        // Clip to parent bounds (respects overflow:hidden) and exclude nav
        const top    = Math.max(NAV_H, raw.top,    par.top);
        const bottom = Math.min(raw.bottom, par.bottom);
        const left   = Math.max(raw.left,   par.left);
        const right  = Math.min(raw.right,  par.right);
        if (right <= left || bottom <= top) continue;
        const nx = Math.max(left, Math.min(cx, right));
        const ny = Math.max(top,  Math.min(cy, bottom));
        if (Math.hypot(cx - nx, cy - ny) < R) { found = { top, right, bottom, left }; break; }
      }
    }

    if (found) {
      const pad = 2;
      const t  = Math.max(0, found.top    - cy + R - pad);
      const r  = Math.max(0, cx + R - found.right  - pad);
      const b  = Math.max(0, cy + R - found.bottom - pad);
      const l  = Math.max(0, found.left   - cx + R - pad);
      white.style.clipPath = (t === 0 && r === 0 && b === 0 && l === 0)
        ? 'none'
        : `inset(${t}px ${r}px ${b}px ${l}px)`;
      white.style.opacity  = '1';
    } else {
      white.style.opacity = '0';
    }
  });
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

// Language toggle
const langBtns = document.querySelectorAll('.lang-btn');
const translatables = document.querySelectorAll('[data-en]');

langBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    langBtns.forEach(b => b.classList.toggle('active', b === btn));
    document.documentElement.lang = lang;
    translatables.forEach(el => { el.innerHTML = el.dataset[lang]; });
  });
});

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

// Scroll hint
const scrollHint = document.getElementById('scroll-hint');
if (scrollHint) {
  setTimeout(() => { if (window.scrollY < 50) scrollHint.classList.add('visible'); }, 2000);
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) scrollHint.classList.remove('visible');
  }, { passive: true });
}
