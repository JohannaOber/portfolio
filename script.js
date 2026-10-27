// On a manual refresh, always start at the top instead of restoring the
// previous scroll position or jumping to a lingering #hash (e.g. from the
// project pages' back arrow). Fresh navigation to a #section link (not a
// reload) still jumps there as expected; only reloads are forced to top.
(function () {
  if (!('scrollRestoration' in history)) return;
  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var isReload = nav ? nav.type === 'reload'
                     : (performance.navigation && performance.navigation.type === 1);
  if (isReload) {
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    window.addEventListener('load', function () { window.scrollTo(0, 0); });
  }
})();

// Project pages: the menu lists this page's own steps (Challenge, Research,
// Design, ...) instead of the homepage sections; a click jumps to that step.
// Built first thing, so the smooth scroll, the language toggle and the
// mobile menu all pick up the new links.
const stepPage = document.body.classList.contains('alt-page');
(function () {
  if (!stepPage) return;
  const list = document.querySelector('nav .nav-links');
  const labels = document.querySelectorAll('.alt-panel-label');
  if (!list || !labels.length) return;
  const clean = t => (t || '').replace(/^\s*\d+\s+/, '').trim(); // "01 Research" → "Research"
  list.innerHTML = '';
  labels.forEach((label, i) => {
    const step = label.closest('.alt-block, .alt-text-section') || label;
    if (!step.id) step.id = 'step-' + (i + 1);
    // Desktop shows inactive steps as dots: the name sits in a span that
    // opens for the active step, plus a small hover label for the dots
    const a = document.createElement('a');
    a.href = '#' + step.id;
    const en = clean(label.dataset.en || label.textContent);
    const de = clean(label.dataset.de || label.dataset.en || label.textContent);
    a.setAttribute('aria-label', en);
    // Chapter title (the step's heading), shown in the cursor caption
    const heading = step.querySelector('.alt-panel-heading');
    if (heading) {
      a.dataset.titleEn = heading.dataset.en || heading.textContent.trim();
      a.dataset.titleDe = heading.dataset.de || a.dataset.titleEn;
    }
    ['step-label', 'step-tip'].forEach(cls => {
      const span = document.createElement('span');
      span.className = cls;
      span.dataset.en = en;
      span.dataset.de = de;
      span.textContent = en;
      a.appendChild(span);
    });
    const li = document.createElement('li');
    li.appendChild(a);
    list.appendChild(li);
  });
  list.classList.add('nav-links--steps');
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

  // Homepage marquee: a purple triangle tilted 30° left, hinting it can be dragged
  const bandCursor = document.createElement('div');
  bandCursor.id = 'cursor-band';
  bandCursor.appendChild(document.createElement('span'));
  document.body.appendChild(bandCursor);
  // Draggable things: the marquee bands and the homepage headline's parts
  const bandZones = Array.from(document.querySelectorAll('.marquee-band, #intro .slogan-wrap > .hero-display .hl-part'));

  const caption = document.createElement('div');
  caption.id = 'cursor-caption';
  caption.setAttribute('aria-hidden', 'true');
  document.body.appendChild(caption);

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

  // Zones that swap the small cursor for a big one: photo zones (↓) and
  // links to projects (→). A zone counts as hovered once about 30% of the
  // small cursor circle overlaps it, i.e. the centre is within HIT px of it.
  const CURSOR_R = 21;
  const HIT = Math.round(CURSOR_R * 0.32); // 30% of the circle's area overlaps
  // ("More Projects" keeps the normal round cursor)
  // Project cards count as a whole (image and the white text part)
  const navZones = Array.from(document.querySelectorAll('.pe-link, .project-card'));
  // A thumbnail inside a project link is a link (→), never a photo zone (↓)
  const photoZones = eventZones.filter(el => !navZones.some(n => n.contains(el)));

  let mouseX = -200, mouseY = -200, rafPending = false, zoneRaf = false, onPhotoZone = false, onNavZone = false;

  function near(r, cx, cy) {
    return r.width > 0 && cx >= r.left - HIT && cx <= r.right + HIT &&
           cy >= r.top - HIT && cy <= r.bottom + HIT;
  }

  function checkIntroRect(cx, cy) {
    if (!introRect) return false;
    const sx = window.scrollX, sy = window.scrollY;
    return cx >= introRect.left - sx - HIT && cx <= introRect.right - sx + HIT &&
           cy >= introRect.top  - sy - HIT && cy <= introRect.bottom - sy + HIT;
  }

  function hideSmall() {
    diff.style.opacity  = '0';
    scr.style.opacity   = '0';
    white.style.opacity = '0';
  }
  function showSmall() {
    diff.style.opacity  = '';
    scr.style.opacity   = '';
  }

  function setZone(active) {
    if (active === onPhotoZone) return;
    onPhotoZone = active;
    if (active) { hideSmall(); photoCursor.classList.add('active'); }
    else { if (!onNavZone) showSmall(); photoCursor.classList.remove('active'); }
  }

  function setNav(active) {
    if (active === onNavZone) return;
    onNavZone = active;
    if (active) { hideSmall(); navCursor.classList.add('active'); }
    else { if (!onPhotoZone) showSmall(); navCursor.classList.remove('active'); }
  }

  let onBandZone = false, bandTimer = null;
  function setBand(active) {
    if (active === onBandZone) return;
    onBandZone = active;
    // A purple circle takes the round cursor's place and flows into the
    // triangle; on leave it flows back into a circle, then hands over again
    clearTimeout(bandTimer);
    if (active) {
      document.body.classList.add('cursor-on-band');
      bandCursor.classList.add('active');
      void bandCursor.offsetWidth; // start the morph from the circle
      bandCursor.classList.add('triangle');
    } else {
      bandCursor.classList.remove('triangle');
      bandTimer = setTimeout(() => {
        bandCursor.classList.remove('active');
        document.body.classList.remove('cursor-on-band');
      }, 350);
    }
  }

  function updateZones() {
    zoneRaf = false;
    const cx = mouseX, cy = mouseY;
    // Editing the headline (its parts, the selection frame and handles, the
    // open colour palette and a margin around it) always shows the triangle,
    // never the photo's big arrow cursor
    const near40 = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect(), M = 40;
      return cx >= r.left - M && cx <= r.right + M && cy >= r.top - M && cy <= r.bottom + M;
    };
    // Close to a resize handle (24px, the magnetic grab range): the handle
    // lights up and grows, so it's clear a press will take it
    document.querySelectorAll('.hl-select.open .hl-handle').forEach(h => {
      const r = h.getBoundingClientRect();
      h.classList.toggle('near', Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2)) < 24);
    });
    if (near40(document.querySelector('.hl-palette.open')) ||
        near40(document.querySelector('.hl-select.open')) ||
        document.querySelector('.hl-select.resizing')) {
      setBand(true); setNav(false); setZone(false);
      return;
    }
    if (bandZones.length) {
      const overBand = cy > NAV_H && bandZones.some(z => {
        const r = z.getBoundingClientRect();
        const M = z.classList.contains('hl-part') ? 16 : 0; // a little slack around the headline parts
        return cx >= r.left - M && cx <= r.right + M && cy >= r.top - M && cy <= r.bottom + M;
      });
      // Keep the triangle while a drag that started on a band is still going
      setBand(overBand || bandZones.some(z => z.classList.contains('dragging')));
      if (onBandZone) { setNav(false); setZone(false); return; }
    }
    const overNav = cy > NAV_H && navZones.some(el => near(el.getBoundingClientRect(), cx, cy));
    const overPhoto = !overNav && cy > NAV_H &&
      (checkIntroRect(cx, cy) || photoZones.some(el => near(el.getBoundingClientRect(), cx, cy)));
    setNav(overNav);
    setZone(overPhoto);
    if (!onPhotoZone && !onNavZone && !onBandZone && !rafPending) { rafPending = true; requestAnimationFrame(updateWhite); }
  }

  function scheduleZones() {
    if (!zoneRaf) { zoneRaf = true; requestAnimationFrame(updateZones); }
  }

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
    bandCursor.style.translate = `${cx}px ${cy}px`;
    caption.style.translate = `${cx}px ${cy}px`;

    // Project step dots: the section name (Challenge, Research, ...) in a purple caption beside the cursor
    const step = e.target.closest && e.target.closest('.nav-links--steps a');
    if (step) {
      const label = step.querySelector('.step-label');
      const text = (label && label.textContent) || '';
      if (caption.textContent !== text) caption.textContent = text;
    }
    caption.classList.toggle('active', !!step);
    // Project step dots: the round cursor stays, but shrinks to a solid
    // purple point, showing they can be clicked
    document.body.classList.toggle('cursor-on-step', !!step);

    scheduleZones();
  });

  // Content moves under a resting cursor while scrolling
  window.addEventListener('scroll', scheduleZones, { passive: true });

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

// Purple wave hover (headline circle, homepage marquee triangle): shortly after the cursor
// enters, a purple copy of the text shows through a wavy circle that grows in
// ripples and follows the cursor. Holding still lets it keep swelling, moving
// shrinks it back a little; on leave it shrinks away (pointer devices only).
// `layer` is the purple copy, absolutely covering `wrap`.
function purpleWave(wrap, layer, size, opts) {
  opts = opts || {};
  const DELAY = 250;      // ms of hover before the circle appears
  const GROW = opts.grow || 0.9;   // s until the circle reaches its size
  const SHRINK = 0.35;    // s to disappear after leaving
  const POINTS = 72;      // outline resolution of the wavy circle

  const STILL = 0.15;     // s without movement that counts as holding still
  const SWELL = opts.swell || 0.55; // growth per second while holding still (x base size)
  // Optional triangle shape: equilateral, one corner pointing at opts.tilt (rad)
  const TRI = opts.shape === 'triangle';
  const TILT = opts.tilt || -Math.PI / 2;
  const SETTLE = 2.5;     // how fast the extra size melts away while moving

  let rect = null, timer = null, raf = null;
  let active = false, startT = 0, leaveT = 0, leaveR = 0;
  let x = 0, y = 0, tx = 0, ty = 0, r = 0;
  let extra = 0, lastMove = 0, lastT = 0;

  function targetRadius() {
    // Big enough to light up a few letters, scaled with the text size
    return Math.max(opts.minR != null ? opts.minR : 110, layer.offsetHeight * size);
  }

  function maxExtra() {
    // Holding still long enough lets the circle cover the whole layer
    return Math.hypot(layer.offsetWidth, layer.offsetHeight) / targetRadius();
  }

  function frame(now) {
    const t = now / 1000;
    const dt = lastT ? Math.min((now - lastT) / 1000, 0.05) : 0;
    lastT = now;
    if (active) {
      // Holding still: the circle keeps swelling; moving: it melts back
      // (opts.fillTime: spread to the full size in that many seconds instead)
      const swell = opts.fillTime ? maxExtra() / opts.fillTime : SWELL;
      if ((now - lastMove) / 1000 > STILL) extra = Math.min(extra + swell * dt, maxExtra());
      else extra *= Math.exp(-SETTLE * dt);
      // Grows with a damped ripple: overshoots slightly, then settles in waves
      const e = Math.min((now - startT) / 1000 / GROW, 1);
      const ease = 1 - Math.pow(1 - e, 3);
      const ripple = 1 + 0.12 * Math.sin(e * Math.PI * 3) * (1 - e);
      r = targetRadius() * (ease * ripple + extra);
    } else {
      const e = Math.min((now - leaveT) / 1000 / SHRINK, 1);
      r = leaveR * (1 - e * e);
    }

    // Follow the cursor smoothly
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;

    if (r <= 0.5 && !active) {
      layer.style.clipPath = 'circle(0px at 0 0)';
      raf = null;
      lastT = 0;
      return;
    }

    // Wavy outline: two slow sine waves travelling around the edge
    const pts = [];
    for (let i = 0; i < POINTS; i++) {
      const a = (i / POINTS) * Math.PI * 2;
      let wave = 1 + 0.06 * Math.sin(5 * a + t * 2.4) + 0.04 * Math.sin(3 * a - t * 1.6);
      if (TRI) {
        // Distance to the edge of a triangle with circumradius 1 at angle a
        const k = ((a - TILT) % (2 * Math.PI / 3) + 2 * Math.PI / 3) % (2 * Math.PI / 3);
        wave *= 0.5 / Math.cos(k - Math.PI / 3);
      }
      pts.push((x + Math.cos(a) * r * wave).toFixed(1) + 'px ' + (y + Math.sin(a) * r * wave).toFixed(1) + 'px');
    }
    layer.style.clipPath = 'polygon(' + pts.join(',') + ')';
    raf = requestAnimationFrame(frame);
  }

  function run() { if (!raf) raf = requestAnimationFrame(frame); }

  // Start / follow / end, in viewport coordinates (used by hover, touch and autoplay)
  function enter(cx, cy, delay) {
    rect = wrap.getBoundingClientRect();
    tx = x = cx - rect.left;
    ty = y = cy - rect.top;
    clearTimeout(timer);
    timer = setTimeout(() => {
      active = true;
      extra = 0;
      startT = lastMove = performance.now();
      run();
    }, delay == null ? DELAY : delay);
  }
  function move(cx, cy) {
    if (!rect) rect = wrap.getBoundingClientRect();
    tx = cx - rect.left;
    ty = cy - rect.top;
    lastMove = performance.now();
  }
  function leave() {
    clearTimeout(timer);
    if (active) {
      active = false;
      leaveT = performance.now();
      leaveR = r;
      run();
    }
    rect = null;
  }

  if (opts.hover !== false) {
    wrap.addEventListener('mouseenter', e => enter(e.clientX, e.clientY));
    wrap.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    wrap.addEventListener('mouseleave', leave);
  }

  // The cached rect goes stale if the page scrolls while hovering
  window.addEventListener('scroll', () => { rect = null; }, { passive: true });

  return { enter, move, leave, isFull: () => active && extra >= maxExtra() - 0.01 };
}

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Mouse: hover effects. Touch: the headline plays on its own, the band reacts to the finger
  const fine = window.matchMedia('(pointer: fine)').matches;

  // Headline: same text in both languages, so the copy needs no translation attributes
  const wrap = document.querySelector('#intro .slogan-wrap');
  const headline = wrap && wrap.querySelector('.hero-display');
  if (headline) {
    const layer = headline.cloneNode(true);
    layer.removeAttribute('data-en');
    layer.removeAttribute('data-de');
    layer.classList.add('headline-purple-layer');
    layer.setAttribute('aria-hidden', 'true');
    wrap.appendChild(layer);
    let wave, waveOn = false;
    if (fine) {
      // Triangle cursor over the headline, so the purple patch is a wavy
      // triangle too (tilted like the cursor, as on the marquee bands)
      wave = purpleWave(wrap, layer, 1.25, { shape: 'triangle', tilt: -Math.PI * 2 / 3, hover: false });
      // The wave follows exactly where the triangle cursor shows: over any of
      // the three parts (plus a little slack), wherever they have been moved,
      // also over the photo; it rests while a part is dragged or scaled
      window.addEventListener('mousemove', e => {
        const busy = wrap.classList.contains('dragging') || document.querySelector('.hl-select.resizing');
        const over = !busy && Array.from(headline.querySelectorAll('.hl-part')).some(p => {
          const r = p.getBoundingClientRect(), M = 16;
          return e.clientX >= r.left - M && e.clientX <= r.right + M && e.clientY >= r.top - M && e.clientY <= r.bottom + M;
        });
        if (over && !waveOn) { waveOn = true; wave.enter(e.clientX, e.clientY); }
        else if (!over && waveOn) { waveOn = false; wave.leave(); }
        if (over) wave.move(e.clientX, e.clientY);
      }, { passive: true });
    } else {
      // Touch screens: no hover, so a small purple patch appears somewhere in
      // the headline and slowly spreads until the whole text is purple, rests,
      // fades back, and starts again elsewhere (only while on screen)
      wave = purpleWave(wrap, layer, 0.25, { hover: false, minR: 18, grow: 2, fillTime: 14 });
      let visible = false, loop = null;
      const start = () => {
        const r = wrap.getBoundingClientRect();
        wave.enter(r.left + r.width * (0.15 + Math.random() * 0.7),
                   r.top + r.height * (0.25 + Math.random() * 0.5), 0);
        loop = setInterval(() => {
          if (!wave.isFull()) return;
          clearInterval(loop);
          loop = setTimeout(() => {
            wave.leave();
            loop = setTimeout(() => { if (visible) start(); else loop = null; }, 1500);
          }, 2500);
        }, 200);
      };
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible && !loop) loop = setTimeout(start, 1200);
      }).observe(wrap);
    }

    // Editing works with mouse and touch alike (tap = select, drag = move)
    // Drag the headline's three parts ("UX/UI", "&", "Product Designer")
    // anywhere within the intro: the cursor turns into the triangle over
    // them (see the custom cursor), the purple wave rests while dragging,
    // and each part stays where it is dropped. The purple copy's parts
    // move along, so the wave keeps lighting up the right letters.
    const intro = document.getElementById('intro') || document.body;
    const parts = Array.from(headline.querySelectorAll('.hl-part'));
    const copies = Array.from(layer.querySelectorAll('.hl-part'));
    const off = parts.map(() => ({ x: 0, y: 0, s: 1 }));
    let drag = null;
    wrap.addEventListener('dragstart', e => e.preventDefault());
    wrap.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const i = parts.indexOf(e.target.closest('.hl-part'));
      if (i < 0) return;
      const w = parts[i].getBoundingClientRect(), b = intro.getBoundingClientRect();
      const o = off[i];
      drag = {
        i, x: e.clientX, y: e.clientY, sx: o.x, sy: o.y,
        // how far this part may move before leaving the intro area
        minX: o.x + (b.left - w.left), maxX: o.x + (b.right - w.right),
        minY: o.y + (b.top + 60 - w.top), maxY: o.y + (b.bottom - w.bottom)
      };
      if (fine) { wave.leave(); waveOn = false; } // comes back with the next move
      if (palettePart && palettePart !== parts[i]) closePalette();
      wrap.classList.add('dragging');
      parts[i].classList.add('dragging');
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const o = off[drag.i];
      o.x = Math.min(drag.maxX, Math.max(drag.minX, drag.sx + e.clientX - drag.x));
      o.y = Math.min(drag.maxY, Math.max(drag.minY, drag.sy + e.clientY - drag.y));
      parts[drag.i].style.translate = copies[drag.i].style.translate = o.x + 'px ' + o.y + 'px';
      if (palettePart === parts[drag.i]) { placeFrame(); placePalette(); }
    });
    window.addEventListener('pointerup', e => {
      if (!drag) return;
      const moved = Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3;
      const part = parts[drag.i];
      part.classList.remove('dragging');
      drag = null;
      wrap.classList.remove('dragging');
      // A drag is not a click: swallow the click that follows the release,
      // so dropping onto the photo doesn't scroll to the next section
      if (moved) window.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
      else openPalette(part, e.clientX, e.clientY);
    });

    // A plain click on a part opens a small colour palette for that part
    // Black to reset, then lilac tones from light to deep around the accent
    const COLORS = [
      ['#0a0a0a', 'Black'], ['#d9c2fa', 'Pale lilac'], ['#c7a3f6', 'Light lilac'],
      ['#b281f1', 'Lilac'], ['#9257e0', 'Violet'], ['#6a35b5', 'Deep violet']
    ];
    const palette = document.createElement('div');
    palette.className = 'hl-palette';
    palette.setAttribute('role', 'dialog');
    palette.setAttribute('aria-label', 'Choose a colour');
    COLORS.forEach(([c, name]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.style.background = c;
      b.dataset.color = c;
      b.setAttribute('aria-label', name);
      palette.appendChild(b);
    });
    document.body.appendChild(palette);
    let palettePart = null;
    // Editor-style selection: a thin purple frame with four corner handles
    // around the clicked part; dragging a handle scales the part
    const frame = document.createElement('div');
    frame.className = 'hl-select';
    frame.setAttribute('aria-hidden', 'true');
    ['nw', 'ne', 'sw', 'se'].forEach(k => {
      const h = document.createElement('span');
      h.className = 'hl-handle hl-handle--' + k;
      frame.appendChild(h);
    });
    document.body.appendChild(frame);
    let palX = 0, palY = 0; // click point the palette hangs from (viewport)
    function placeFrame() {
      if (!palettePart) return;
      const r = palettePart.getBoundingClientRect(), P = 6;
      frame.style.left = (r.left - P + window.scrollX) + 'px';
      frame.style.top = (r.top - P + window.scrollY) + 'px';
      frame.style.width = (r.width + 2 * P) + 'px';
      frame.style.height = (r.height + 2 * P) + 'px';
    }
    function placePalette() {
      if (!palettePart) return;
      // Centred below the click point, but always clear of the frame
      const r = palettePart.getBoundingClientRect();
      const pw = palette.offsetWidth;
      const cx = Math.min(Math.max(palX, r.left), r.right);
      const left = Math.min(Math.max(8, cx - pw / 2), document.documentElement.clientWidth - pw - 8);
      palette.style.left = (left + window.scrollX) + 'px';
      palette.style.top = (Math.max(palY + 26, r.bottom + 14) + window.scrollY) + 'px';
    }
    function openPalette(part, cx, cy) {
      if (palettePart) palettePart.classList.remove('selected');
      palettePart = part;
      part.classList.add('selected');
      palX = cx; palY = cy;
      palette.querySelectorAll('button').forEach(b =>
        b.classList.toggle('current', b.dataset.color === (part.dataset.color || '#0a0a0a')));
      placeFrame();
      frame.classList.add('open');
      palette.classList.add('open');
      placePalette();
    }
    function closePalette() {
      if (palettePart) palettePart.classList.remove('selected');
      palette.classList.remove('open');
      frame.classList.remove('open');
      palettePart = null;
    }

    // Resize from a corner: the part scales around its centre
    let resize = null;
    // Handles are magnetic: a press within 24px of one grabs it, wherever the
    // cursor's shape points (runs first, before the part drag or anything else)
    const nearHandle = (x, y) => Array.from(frame.querySelectorAll('.hl-handle')).find(h => {
      const r = h.getBoundingClientRect();
      return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) < 24;
    });
    window.addEventListener('pointerdown', e => {
      if (!palettePart || !frame.classList.contains('open') || e.button !== 0) return;
      if (!nearHandle(e.clientX, e.clientY)) return;
      e.preventDefault();
      e.stopPropagation();
      const i = parts.indexOf(palettePart);
      const r = palettePart.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      resize = { i, cx, cy, d0: Math.hypot(e.clientX - cx, e.clientY - cy) || 1, s0: off[i].s };
      frame.classList.add('resizing');
      if (fine) { wave.leave(); waveOn = false; } // comes back with the next move
    }, true);
    window.addEventListener('pointermove', e => {
      if (!resize) return;
      const d = Math.hypot(e.clientX - resize.cx, e.clientY - resize.cy);
      const sc = Math.min(3, Math.max(0.35, resize.s0 * d / resize.d0));
      off[resize.i].s = sc;
      parts[resize.i].style.scale = copies[resize.i].style.scale = sc;
      placeFrame();
      placePalette();
    });
    window.addEventListener('pointerup', () => {
      if (!resize) return;
      resize = null;
      frame.classList.remove('resizing');
      // the click that ends a resize must not reach the photo below
      window.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); }, { capture: true, once: true });
    });
    window.addEventListener('resize', () => { placeFrame(); placePalette(); });
    palette.addEventListener('click', e => {
      // A click between the swatches takes the nearest one (the triangle
      // cursor's point is its centre, so aiming with the tip lands beside)
      let b = e.target.closest('button');
      if (!b) {
        let best = Infinity;
        palette.querySelectorAll('button').forEach(btn => {
          const r = btn.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          if (d < best) { best = d; b = btn; }
        });
      }
      if (!b || !palettePart) return;
      const c = b.dataset.color;
      palettePart.dataset.color = c;
      palettePart.style.color = c === '#0a0a0a' ? '' : c;
      closePalette();
    });
    document.addEventListener('pointerdown', e => {
      // (switching the language keeps the selection)
      if (palettePart && !palette.contains(e.target) && !e.target.closest('.hl-part, .hl-select, .lang-toggle')) closePalette();
    });
    // A click in the margin around the open palette just closes it; it must
    // not reach the photo below (which would scroll to the next section)
    window.addEventListener('click', e => {
      if (!palette.classList.contains('open') || palette.contains(e.target)) return;
      if (e.target.closest('.hl-part, .hl-select')) return; // the click that opened it, or a handle
      const r = palette.getBoundingClientRect(), M = 40;
      if (e.clientX >= r.left - M && e.clientX <= r.right + M && e.clientY >= r.top - M && e.clientY <= r.bottom + M) {
        e.stopPropagation(); e.preventDefault(); closePalette();
      }
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePalette(); });

    // Mobile (no hover to discover it): "Product Designer" starts out selected,
    // frame and handles showing, as a hint that the headline can be edited.
    // Placed once the headline has faded in; the palette opens on a tap.
    if (window.matchMedia('(max-width: 720px), (pointer: coarse)').matches && parts[2]) {
      const preselect = () => {
        if (palettePart) return;
        palettePart = parts[2];
        parts[2].classList.add('selected');
        placeFrame();
        frame.classList.add('open');
      };
      setTimeout(preselect, 1400);
      window.addEventListener('resize', () => { if (palettePart && !palette.classList.contains('open')) placeFrame(); });
      // the bio's length changes with the language; keep the frame on its part
      document.addEventListener('langchange', () => requestAnimationFrame(() => { placeFrame(); placePalette(); }));
    }
    wrap.addEventListener('click', e => { if (e.target.closest('.hl-part')) e.stopPropagation(); });
  }

  // Marquee bands (homepage and the project pages' disclaimers): purple
  // triangle, hover brake and drag
  document.querySelectorAll('.marquee-band').forEach(band => {
  const track = band.querySelector('.marquee-track');
  if (track) {
    // Purple copy of the running track, revealed through a wavy triangle that
    // grows under the triangle cursor (tilted 30° left like the cursor), a
    // little slower than the headline's circle
    const layer = document.createElement('div');
    layer.className = 'marquee-purple-layer';
    layer.setAttribute('aria-hidden', 'true');
    const copy = track.cloneNode(true);
    const orig = track.getAnimations ? track.getAnimations()[0] : null;
    if (orig && orig.currentTime != null) copy.style.animationDelay = (-orig.currentTime / 1000) + 's';
    layer.appendChild(copy);
    band.appendChild(layer);
    const sync = () => {
      const a = track.getAnimations()[0], b = copy.getAnimations()[0];
      if (a && b && a.startTime != null) { copy.style.animationDelay = ''; b.startTime = a.startTime; b.playbackRate = a.playbackRate; }
    };
    requestAnimationFrame(() => requestAnimationFrame(sync));
    window.addEventListener('load', sync);
    const bandWave = purpleWave(band, layer, 0.9, { shape: 'triangle', tilt: -Math.PI * 2 / 3, grow: 1.5, swell: 0.3, hover: fine });

    // Hover brake: the band eases down to a slower pace, like a little
    // resistance under the cursor, and picks up speed again on leave
    const SLOW = 0.4;
    let rate = 1, target = 1, brakeRaf = null;
    const anims = () => [track, copy].map(el => el.getAnimations()[0]).filter(Boolean);
    const brake = () => {
      rate += (target - rate) * 0.06;
      if (Math.abs(target - rate) < 0.005) rate = target;
      anims().forEach(a => { a.playbackRate = rate; });
      brakeRaf = rate === target ? null : requestAnimationFrame(brake);
    };
    const setTarget = v => { target = v; if (!brakeRaf) brakeRaf = requestAnimationFrame(brake); };
    if (fine) {
      band.addEventListener('mouseenter', () => { if (!dragging) setTarget(SLOW); });
      band.addEventListener('mouseleave', () => { if (!dragging) setTarget(1); });
    }

    // Drag: grab the band and push it left or right; on release it glides on
    // with the throw's momentum, then picks up its own pace again
    const half = () => track.scrollWidth / 2;            // one loop = half the track
    const dur = () => { const a = anims()[0]; return a ? a.effect.getTiming().duration : 28000; };
    let dragging = false, lastX = 0, vel = 0, glideRaf = null;
    const shift = dx => {
      // Moving the text by dx px = moving the animation clock by -dx/half of a loop
      const d = dur(), dt = -dx / half() * d;
      anims().forEach(a => { a.currentTime = (((a.currentTime + dt) % d) + d) % d + d; });
    };
    // Mouse and touch: on a touch screen the purple triangle follows the finger
    let touchDrag = false;
    band.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // No preventDefault here: it would also swallow the mousemove events
      // that move the custom cursor, leaving it behind while dragging
      touchDrag = e.pointerType !== 'mouse';
      if (touchDrag) bandWave.enter(e.clientX, e.clientY, 0);
      dragging = true; lastX = e.clientX; vel = 0;
      cancelAnimationFrame(glideRaf);
      band.classList.add('dragging');
      setTarget(0);
    });
    band.addEventListener('dragstart', e => e.preventDefault());
    window.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      vel = Math.max(-40, Math.min(40, vel * 0.6 + dx * 0.4)); // cap the throw
      shift(dx);
      if (touchDrag) bandWave.move(e.clientX, e.clientY);
    });
    // pointercancel: the browser took over the touch to scroll the page
    const release = () => {
      if (!dragging) return;
      dragging = false;
      band.classList.remove('dragging');
      if (touchDrag) bandWave.leave();
      const over = fine && band.matches(':hover');
      setTarget(over ? SLOW : 1);
      const glide = () => {
        vel *= 0.94;
        if (Math.abs(vel) < 0.2) return;
        shift(vel);
        glideRaf = requestAnimationFrame(glide);
      };
      glideRaf = requestAnimationFrame(glide);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
  }
  });
})();

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').replace(/^#/, '');
    const target = id ? document.getElementById(id) : document.documentElement;
    if (!target) return;
    e.preventDefault();
    const start = window.scrollY;
    // Land on the section's heading (just under the nav), not the top of the
    // section box, which has large top padding above the visible title.
    const anchor = id ? (target.querySelector(':scope > h2, :scope > h3') || target) : null;
    const end = id ? anchor.getBoundingClientRect().top + window.scrollY - 60 - 16 : 0;
    const duration = 450;
    const startTime = performance.now();
    // Menu or back-to-top click: move the active line right away, ignore sections passed on the way
    if ((link.closest('nav') || link.id === 'back-to-top') && typeof setActiveNav === 'function') {
      setActiveNav(id || 'intro');
      navLockUntil = startTime + duration + 150;
    }
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

  function scrollToEl(el, extraOffset) {
    if (!el) return;
    smoothScrollToY(el.getBoundingClientRect().top + window.scrollY - NAV_H - (extraOffset || 0));
  }

  // Main page: click anywhere over the title photo area → Projects section.
  // The photo sits behind the text overlay, so we hit-test by coordinates
  // (matching where the ↓ cursor appears) rather than relying on the element.
  const introPhoto = document.querySelector('.intro-photo');
  const projects = document.getElementById('projects');
  if (introPhoto && projects) {
    document.addEventListener('click', e => {
      if (e.target.closest('a, button')) return;
      // Editing the headline (parts, frame, palette) never scrolls the page
      if (e.target.closest('.hl-part, .hl-select, .hl-palette')) return;
      const r = introPhoto.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= Math.max(r.top, NAV_H) && e.clientY <= r.bottom) {
        // Land on the "Projects" heading just under the nav, not the padded
        // top of the section box.
        scrollToEl(projects.querySelector(':scope > h2') || projects, 16);
      }
    });
  }

  // Project pages: cover image → first content image
  const cover = document.querySelector('.alt-cover');
  const firstContent = document.querySelector('.alt-block');
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
  document.dispatchEvent(new Event('langchange'));
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
const navLogo = document.querySelector('.nav-logo');

// While a menu click scrolls the page, the clicked item stays active, so the
// line goes straight there instead of stopping at every section passed
let navLockUntil = 0;

function setActiveNav(id) {
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + id || (href === '#' && id === 'intro'));
  });
  // No nav tab active (e.g. still on the intro) — highlight the logo instead
  // (homepage only; on project pages the logo links home and stays black)
  if (navLogo && !stepPage) {
    const anyActive = Array.from(navLinks).some(link => link.classList.contains('active'));
    navLogo.classList.toggle('active', !anyActive);
  }
  moveNavIndicator();
  updateStepRail();
}

// Mobile project pages: a vertical column of dots at the top left, under
// the logo, showing where in the process one is. The current step's dot is
// purple and its name shows briefly beside it; a tap jumps to that step.
let stepRail = null, stepRailTimer = null;
if (document.body.classList.contains('alt-page') && navLinks.length) {
  stepRail = document.createElement('div');
  stepRail.className = 'step-rail';
  navLinks.forEach((link, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', link.getAttribute('aria-label') || link.textContent);
    b.addEventListener('click', () => {
      // show the tapped step's name right away, then jump there
      const label = link.querySelector('.step-label');
      const name = stepRail.querySelector('.step-rail-name');
      name.textContent = label ? label.textContent : link.textContent;
      name.style.top = (b.offsetTop + b.offsetHeight / 2) + 'px';
      name.classList.add('show');
      clearTimeout(stepRailTimer);
      stepRailTimer = setTimeout(() => name.classList.remove('show'), 1600);
      navLinks[i].click();
    });
    stepRail.appendChild(b);
  });
  const name = document.createElement('span');
  name.className = 'step-rail-name';
  stepRail.appendChild(name);
  document.body.appendChild(stepRail);
}
function updateStepRail() {
  if (!stepRail) return;
  const dots = stepRail.querySelectorAll('button');
  let current = -1;
  navLinks.forEach((l, i) => {
    const on = l.classList.contains('active');
    dots[i].classList.toggle('active', on);
    if (on) current = i;
  });
  stepRail.classList.toggle('visible', current >= 0);
  if (current < 0) return;
  const label = navLinks[current].querySelector('.step-label');
  const name = stepRail.querySelector('.step-rail-name');
  name.textContent = label ? label.textContent : navLinks[current].textContent;
  // Name next to the current dot, shown for a moment
  name.style.top = (dots[current].offsetTop + dots[current].offsetHeight / 2) + 'px';
  name.classList.add('show');
  clearTimeout(stepRailTimer);
  stepRailTimer = setTimeout(() => name.classList.remove('show'), 1600);
}

const sectionObserver = new IntersectionObserver(entries => {
  if (performance.now() < navLockUntil) return;
  entries.forEach(entry => {
    if (entry.isIntersecting) setActiveNav(entry.target.id);
  });
}, { rootMargin: '-40% 0px -55% 0px' });

// Sliding purple line under the logo / active menu item (homepage; the
// project pages' step menu marks the current step with a purple dot instead)
const navBar = document.querySelector('nav');
let navIndicator = null;
if (navBar && navLogo && navLinks.length && navLogo.getAttribute('href') === '#') {
  navIndicator = document.createElement('span');
  navIndicator.className = 'nav-indicator';
  navIndicator.setAttribute('aria-hidden', 'true');
  navBar.appendChild(navIndicator);
  navBar.classList.add('has-indicator');
}

// The line glides to the new item: soft start, soft landing (ease-in-out)
const NAV_LINE_MS = 550;
let navLineAnim = null, stepChase = null; // stepChase: pending line draw on step pages

function moveNavIndicator(instant) {
  if (!navIndicator) return;
  const target = Array.from(navLinks).find(l => l.classList.contains('active')) ||
                 (navLogo.classList.contains('active') ? navLogo : null);
  // Hidden menu items (mobile burger menu): no line unless it sits under the logo
  if (!target || !target.offsetWidth) { navIndicator.classList.remove('ready'); return; }
  const nr = navBar.getBoundingClientRect();
  const tr = target.getBoundingClientRect();
  // Menu links carry their underline at the bottom edge; the logo has no padding, so 3px below it
  const x1 = tr.left - nr.left, w1 = tr.width;
  // Menu items: the underline level. JO: the bottom edge of its letters
  // (its box has ~6px of line spacing below them), so the line runs into it
  const lineY = el => el.getBoundingClientRect().bottom - nr.top - 2;
  const y1 = target === navLogo ? tr.bottom - nr.top - 6 : lineY(target);

  // Step menu: one calm change at a time. The line fades out, the old word
  // closes to a dot while the new one opens, then the line draws in under it
  if (stepPage) {
    if (navLineAnim) { navLineAnim.cancel(); navLineAnim = null; }
    clearTimeout(stepChase);
    const place = draw => {
      const n = navBar.getBoundingClientRect();
      const t = target.getBoundingClientRect();
      navIndicator.style.transform = `translate(${t.left - n.left}px, ${t.bottom - n.top - 2}px)`;
      navIndicator.style.width = t.width + 'px';
      navIndicator.classList.add('ready');
      if (draw) navLineAnim = navIndicator.animate(
        [{ width: '0px' }, { width: t.width + 'px' }],
        { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    };
    if (instant) { place(false); return; }
    navIndicator.classList.remove('ready');
    stepChase = setTimeout(() => place(true), 480); // after the words have swapped
    return;
  }

  if (!navIndicator.classList.contains('ready')) instant = true; // first placement: no slide in from the corner
  const fromLogo = navIndicator.classList.contains('at-logo');
  const toLogo = target === navLogo;
  navIndicator.classList.toggle('at-logo', toLogo);

  // Start from wherever the line is right now, even mid-animation
  const cr = navIndicator.getBoundingClientRect();
  const x0 = cr.left - nr.left, w0 = cr.width, y0 = cr.top - nr.top;
  if (navLineAnim) navLineAnim.cancel();

  navIndicator.style.transform = `translate(${x1}px, ${y1}px)`;
  navIndicator.style.width = w1 + 'px';
  navIndicator.classList.add('ready');
  if (instant || (Math.abs(x1 - x0) < 1 && Math.abs(w1 - w0) < 1)) return;

  // Leaving the logo the line stays hidden for the first 30% of the way, then
  // shows up quickly; heading back it stays fully visible until the last 8%,
  // where it runs into the JO
  const at = (k, op) => ({
    transform: `translate(${x0 + (x1 - x0) * k}px, ${y0 + (y1 - y0) * k}px)`,
    width: (w0 + (w1 - w0) * k) + 'px', opacity: op, offset: k
  });
  const frames = fromLogo && !toLogo ? [at(0, 0), at(0.3, 0), at(0.38, 1), at(1, 1)]
               : toLogo && !fromLogo ? [at(0, 1), at(0.92, 1), at(1, 0)]
               : [at(0, 1), at(1, 1)];
  navLineAnim = navIndicator.animate(frames, {
    // The way between JO and the menu is much longer than between two menu
    // items, so it gets more time to feel as calm as the other moves
    duration: fromLogo !== toLogo ? 950 : NAV_LINE_MS,
    easing: 'cubic-bezier(0.65, 0, 0.35, 1)'
  });
  navLineAnim.onfinish = () => { navLineAnim = null; };
}

window.addEventListener('resize', () => moveNavIndicator(true));
// The large JO is there from the start; transitions only after the first paint
requestAnimationFrame(() => requestAnimationFrame(() => {
  const n = document.querySelector('nav.no-anim');
  if (n) n.classList.remove('no-anim');
}));
if (document.fonts) document.fonts.ready.then(() => moveNavIndicator(true));

sections.forEach(s => sectionObserver.observe(s));

// Project pages: the active step is the last one whose top has passed 40% of
// the viewport (also across the gaps between steps); above the first step and
// from "See More" on, no step is active and the line hides
if (stepPage && navLinks.length) {
  const steps = Array.from(navLinks).map(l => document.getElementById(l.getAttribute('href').slice(1)));
  const more = document.querySelector('.project-more');
  let stepRaf = null, current;
  const updateStep = () => {
    stepRaf = null;
    if (performance.now() < navLockUntil) return;
    const line = window.innerHeight * 0.4;
    let id = 'none';
    steps.forEach(st => { if (st && st.getBoundingClientRect().top <= line) id = st.id; });
    if (more && more.getBoundingClientRect().top <= line) id = 'none';
    if (id !== current) { current = id; setActiveNav(id); }
  };
  window.addEventListener('scroll', () => { if (!stepRaf) stepRaf = requestAnimationFrame(updateStep); }, { passive: true });
  updateStep();
}

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


// Mobile burger menu: sheet sliding in from the top, as tall as its items
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
    // (project step links carry their text on an inner span)
    ul.querySelectorAll('[data-' + lang + ']').forEach(function (a) {
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

  // Tap on the page below the sheet: just close the menu, don't follow anything there
  document.addEventListener('click', function (e) {
    if (!sheet.classList.contains('open')) return;
    if (sheet.contains(e.target) || nav.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    close();
  }, true);

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
  // Mobile: half the pace, so the long sentence stays readable on a small screen
  var mobile = window.matchMedia('(max-width: 860px)');
  var tracks = document.querySelectorAll('.marquee-band--disclaimer .marquee-track');
  if (!tracks.length) return;

  function sync() {
    for (var i = 0; i < tracks.length; i++) {
      var half = tracks[i].scrollWidth / 2;
      var speed = mobile.matches ? SPEED / 2 : SPEED;
      if (half > 0) tracks[i].style.animationDuration = (half / speed).toFixed(2) + 's';
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

// Multi-image gallery blocks: hover shows a left/right nav-cursor arrow
// depending on which half of the strip the pointer is over; a click scrolls
// exactly one image over in that direction.
(function () {
  var galleries = document.querySelectorAll('.alt-gallery');
  if (!galleries.length) return;

  var navCursor = document.getElementById('cursor-nav');
  var diff  = document.getElementById('cursor-diff');
  var scr   = document.getElementById('cursor-screen');
  var white = document.getElementById('cursor-white');

  galleries.forEach(function (gallery) {
    var track = gallery.querySelector('.alt-gallery-track');
    if (!track) return;

    function dirFor(e) {
      var r = gallery.getBoundingClientRect();
      return (e.clientX - r.left) < r.width / 2 ? -1 : 1;
    }

    gallery.addEventListener('mouseenter', function () {
      if (diff)  diff.style.opacity = '0';
      if (scr)   scr.style.opacity = '0';
      if (white) white.style.opacity = '0';
      if (navCursor) navCursor.classList.add('active');
    });

    gallery.addEventListener('mousemove', function (e) {
      if (!navCursor) return;
      navCursor.textContent = dirFor(e) < 0 ? '←' : '→';
    });

    gallery.addEventListener('mouseleave', function () {
      if (diff)  diff.style.opacity = '';
      if (scr)   scr.style.opacity = '';
      if (navCursor) {
        navCursor.classList.remove('active');
        navCursor.textContent = '→';
      }
    });

    // Custom eased scroll (native "smooth" feels abrupt/linear in most browsers)
    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function smoothScrollBy(delta) {
      var start = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      var end = Math.max(0, Math.min(start + delta, max));
      var dist = end - start;
      var duration = 600;
      var startTime = null;
      function step(ts) {
        if (startTime === null) startTime = ts;
        var t = Math.min((ts - startTime) / duration, 1);
        track.scrollLeft = start + dist * easeInOutCubic(t);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    gallery.addEventListener('click', function (e) {
      var item = track.querySelector('.alt-gallery-item');
      var step = item ? item.getBoundingClientRect().width : track.clientWidth;
      var gap  = parseFloat(getComputedStyle(track).gap) || 0;
      smoothScrollBy(dirFor(e) * (step + gap));
    });
  });
})();

// Projects overview page: category filter
(function () {
  var filters = document.querySelectorAll('.project-filter');
  var cards = document.querySelectorAll('.projects-grid .project-card');
  var count = document.querySelector('.project-count');
  if (!filters.length) return;

  // "10 Projects" at the right end of the filter row: number of cards shown.
  // Keeps data-en/data-de in sync so the language toggle shows the right text.
  function updateCount() {
    if (!count) return;
    var n = 0;
    cards.forEach(function (card) { if (card.style.display !== 'none') n++; });
    count.dataset.en = n + (n === 1 ? ' Project' : ' Projects');
    count.dataset.de = n + (n === 1 ? ' Projekt' : ' Projekte');
    count.textContent = document.documentElement.lang === 'de' ? count.dataset.de : count.dataset.en;
  }
  updateCount();

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var filter = btn.dataset.filter;
      cards.forEach(function (card) {
        var cats = (card.dataset.category || '').split(' ');
        var show = filter === 'all' || cats.indexOf(filter) !== -1;
        card.style.display = show ? '' : 'none';
      });
      updateCount();
    });
  });
})();

// "←" nav-back on subpages: always one step back in the click history.
// Falls back to the homepage when the page was opened directly (no
// same-origin page to return to).
(function () {
  document.querySelectorAll('.nav-back').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var sameOrigin = false;
      try { sameOrigin = new URL(document.referrer).origin === location.origin; } catch (err) {}
      if (sameOrigin && history.length > 1) history.back();
      else location.href = 'index.html';
    });
  });
})();

// Meta strip topics (mobile): a tag that doesn't fit on the line moves to the next line
// as a whole, without the separator dot in front of it
(function () {
  var lists = document.querySelectorAll('.alt-meta-strip .alt-intro-tags');
  if (!lists.length) return;
  var mobile = window.matchMedia('(max-width: 860px)');

  function update() {
    lists.forEach(function (list) {
      var tags = list.querySelectorAll(':scope > span');
      list.querySelectorAll('br.tag-br').forEach(function (br) { br.remove(); });
      tags.forEach(function (t) { t.classList.remove('tag-wrapped'); });
      if (!mobile.matches) return; // desktop keeps its normal wrapping
      // One tag at a time, so each break is measured after the ones before it.
      // The <br> keeps the tag on its new line once its dot is gone
      for (var i = 1; i < tags.length; i++) {
        if (tags[i].offsetTop > tags[i - 1].offsetTop) {
          tags[i].classList.add('tag-wrapped');
          var br = document.createElement('br');
          br.className = 'tag-br';
          list.insertBefore(br, tags[i]);
        }
      }
    });
  }

  update();
  window.addEventListener('resize', update);
  document.addEventListener('langchange', update);
  if (document.fonts) document.fonts.ready.then(update);
})();

// Scroll reveal: images and text rise softly into place when they enter the view.
// Elements already on screen at load stay as they are; several entering together
// follow each other with a short stagger
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var SELECTOR = [
    '#projects > h2', '#resume > h2', '#profile > h2', '.project-more-heading',
    '.project-card', '.more-projects-link',
    '.tab-nav', '.resume-item',
    '.profile-ph1', '.profile-text', '.profile-pair--second',
    '.alt-meta-strip', '.alt-block-image', '.alt-block-image-pair', '.alt-block-video',
    '.alt-block-text', '.alt-panel-label', '.alt-panel-heading', '.alt-panel-body-pair',
    '.alt-panel-body', '.alt-media-row',
    '.contact-card'
  ].join(',');

  // A wrapper with display: contents (mobile project blocks) has no box to move,
  // so its children animate on their own instead
  var all = Array.prototype.slice.call(document.querySelectorAll(SELECTOR)).filter(function (el) {
    return getComputedStyle(el).display !== 'contents';
  });
  // Animate the outermost match only, never an element inside another one
  var items = all.filter(function (el) {
    for (var p = el.parentElement; p; p = p.parentElement) {
      if (all.indexOf(p) !== -1) return false;
    }
    return true;
  });

  // Title content (homepage header, project intro, projects overview) fades in
  // on load, one after the other, wherever it sits
  var heroes = Array.prototype.slice.call(document.querySelectorAll([
    '.slogan-wrap', '.intro-id h1', '.intro-bio', '.intro-photo',
    '.projects-overview-title', '.project-filters',
    '.alt-cover', '.alt-intro-title', '.alt-intro-lead', '.alt-meta-strip'
  ].join(',')));

  var vh = window.innerHeight;
  items = items.filter(function (el) {
    if (heroes.indexOf(el) !== -1) return false;
    var r = el.getBoundingClientRect();
    return r.top > vh * 0.9; // below the first screen
  });

  // Start hidden without animating there (reveal-init switches the transition off)
  items.concat(heroes).forEach(function (el) { el.classList.add('reveal', 'reveal-init'); });
  if (items.length || heroes.length) void document.body.offsetWidth;
  items.concat(heroes).forEach(function (el) { el.classList.remove('reveal-init'); });

  // Drop the classes once done, so the element's own transitions (hover etc.) apply again
  function done(e) {
    if (e.target !== this || e.propertyName !== 'transform') return;
    this.classList.remove('reveal', 'is-visible');
    this.style.removeProperty('--reveal-delay');
    this.removeEventListener('transitionend', done);
  }

  // Stagger across callbacks too: each reveal starts at least STEP after the
  // previous one, so elements arriving in quick succession flow one after another
  var STEP = 110, MAX_DELAY = 450, nextStart = 0;
  var io = new IntersectionObserver(function (entries) {
    var now = performance.now();
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = Math.min(Math.max(0, nextStart - now), MAX_DELAY);
      nextStart = now + delay + STEP;
      el.style.setProperty('--reveal-delay', (delay / 1000).toFixed(2) + 's');
      el.addEventListener('transitionend', done);
      el.classList.add('is-visible');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -5% 0px' });

  items.forEach(function (el) { io.observe(el); });

  heroes.forEach(function (el, i) {
    el.style.setProperty('--reveal-delay', (0.1 + i * 0.12) + 's');
    el.addEventListener('transitionend', done);
  });
  requestAnimationFrame(function () {
    heroes.forEach(function (el) { el.classList.add('is-visible'); });
  });
})();

// Projects overview filters: a purple line glides to the active filter with
// the same soft ease-in-out as the menu line
(function () {
  var bar = document.querySelector('.project-filters');
  if (!bar) return;
  var filters = Array.prototype.slice.call(bar.querySelectorAll('.project-filter'));
  if (!filters.length) return;
  var line = document.createElement('span');
  line.className = 'filter-line';
  line.setAttribute('aria-hidden', 'true');
  bar.appendChild(line);
  bar.classList.add('has-line');
  var anim = null, placed = false;

  function move(instant) {
    var f = bar.querySelector('.project-filter.active');
    if (!f) return;
    var b = bar.getBoundingClientRect(), r = f.getBoundingClientRect();
    // Sits where the button's own 2px bottom border would be
    var x1 = r.left - b.left, y1 = r.bottom - b.top - 2, w1 = r.width;
    var c = line.getBoundingClientRect();
    var x0 = c.left - b.left, y0 = c.top - b.top, w0 = c.width;
    if (anim) anim.cancel();
    line.style.transform = 'translate(' + x1 + 'px,' + y1 + 'px)';
    line.style.width = w1 + 'px';
    if (instant || !placed) { placed = true; return; }
    anim = line.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px)', width: w0 + 'px' },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px)', width: w1 + 'px' }
    ], { duration: 550, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
  }

  // Follow the active class, whoever sets it (filter clicks)
  new MutationObserver(function () { move(false); })
    .observe(bar, { attributes: true, subtree: true, attributeFilter: ['class'] });
  window.addEventListener('resize', function () { move(true); });
  if (document.fonts) document.fonts.ready.then(function () { move(true); });
  move(true);
})();

// Project cards: the whole box opens the project, not just the image
document.querySelectorAll('.project-card').forEach(function (card) {
  var link = card.querySelector('a[href]');
  if (!link) return;
  card.addEventListener('click', function (e) {
    if (e.target.closest('a')) return; // the image link handles itself
    if (e.metaKey || e.ctrlKey) window.open(link.href, '_blank');
    else window.location.href = link.href;
  });
});
