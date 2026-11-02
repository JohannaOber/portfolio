"""Build project-N-draft.html in the new case-study layout from the old pages."""
import sys, re, html as H
sys.path.insert(0, sys.argv[1])
from parse import parse
from content import P
from de import DE

REPO = '/Users/johanna/Documents/04_Portfolio_Sept2026'
LC = open(f'{REPO}/project-9-draft.html', encoding='utf-8').read()
HEAD = LC[:LC.index('<body')]
NAV = LC[LC.index('  <nav>'):LC.index('</nav>') + 6]
TAIL = LC[LC.index('  <a href="#" id="back-to-top"'):]


def attr(s):
    return H.escape(s, quote=True).replace('&amp;amp;', '&amp;').replace('&#x27;', "'")


def tx(v, tag='span', cls=''):
    """Element with data-en (and data-de when there is a German version)."""
    en, de = (v if isinstance(v, tuple) else (v, None))
    if de is None:
        de = DE.get(en.replace('&amp;', '&'))
    c = f' class="{cls}"' if cls else ''
    d = f' data-de="{attr(de)}"' if de else ''
    return f'<{tag}{c} data-en="{attr(en)}"{d}>{en}</{tag}>'


def strip_num(s):
    return re.sub(r'^\s*\d+\s+', '', s or '')


def lazy(m):
    m = re.sub(r'\s(loading|decoding)="[^"]*"', '', m)
    m = m.replace(' class="alt-block-video"', '')
    return m.replace('<img ', '<img loading="lazy" decoding="async" ', 1)


def step(num, label, card, result=False):
    """Overview card; card is (heading, body) or a list of them (several problems)."""
    cls = 'cs-step cs-step--result' if result else 'cs-step'
    pairs = card if isinstance(card, list) else [card]
    inner = '\n'.join(f"""          {tx(h, 'h3', 'cs-step-heading')}
          {tx(bd, 'p', 'cs-step-body')}""" for h, bd in pairs)
    return f'''        <article class="{cls}">
          <div class="cs-step-top"><span class="cs-step-num">{num}</span>{tx(label, cls='cs-step-label')}</div>
{inner}
        </article>'''


def join_bodies(bodies):
    en = '<br><br>'.join(b[0] for b in bodies)
    de = '<br><br>'.join(b[1] for b in bodies) if all(b[1] for b in bodies) else None
    return en, de


def media_ratio(m):
    """width / height of an <img> or <video> from its file (for equal-height rows)."""
    import subprocess
    src = re.search(r'src="([^"]+)"', m).group(1)
    path = f'{REPO}/{src}'
    if m.lstrip().startswith('<video'):
        q = lambda k: subprocess.run(['mdls', '-raw', '-name', k, path], capture_output=True, text=True).stdout
    else:
        def q(k):
            k = {'kMDItemPixelWidth': 'pixelWidth', 'kMDItemPixelHeight': 'pixelHeight'}[k]
            o = subprocess.run(['sips', '-g', k, path], capture_output=True, text=True).stdout
            return o.split(':')[-1]
    w, h = float(q('kMDItemPixelWidth')), float(q('kMDItemPixelHeight'))
    return round(w / h, 4)


def gallery_html(items):
    """Image strip in rows of two; each item grows by its aspect ratio, so both
    images in a row end up the same height without cropping."""
    rows = [items[i:i + 2] for i in range(0, len(items), 2)]
    out = ['\n  <div class="cs-gallery cs-gallery--rows">']
    for row in rows:
        out.append('    <div class="cs-gallery-row">')
        for m in row:
            out.append(f'      <div class="cs-gallery-item" style="flex: {media_ratio(m)} 1 0">{m}</div>')
        out.append('    </div>')
    out.append('  </div>\n')
    return '\n'.join(out)


def build(n):
    p = parse(f'{REPO}/project-{n}.html')
    c = P[n]
    blocks = p['blocks']
    chal, sol = blocks[0], blocks[-1]
    process = blocks[1:-1]
    title = c.get('title', p['title'])

    # header
    meta = '<span class="cs-dot">·</span>'.join(
        tx(m) if isinstance(m, tuple) else m for m in c['meta'])
    role_items = c.get('role_head') or c['chips'][:4]
    role_line = '<span class="cs-dot">·</span>'.join(tx(r) for r in role_items)
    topic_line = '<span class="cs-dot">·</span>'.join(p['topic'])
    body_cls = p['body_class'] + ' cs-page'
    about = ('\n    ' + tx(p['lead'], 'p', 'cs-about')) if p['lead'] and not c.get('no_about') else ''

    out = [HEAD.replace('<title>Language Coach (draft) · Johanna Ober</title>',
                        f'<title>{title} (draft) · Johanna Ober</title>'),
           f'<body class="{body_cls}">\n\n', NAV, '\n\n',
           f'  <!-- DRAFT: new case-study structure for {title}, not linked yet -->\n\n',
           f'''  <!-- ── HEADER ─────────────────────────────────────────── -->
  <header class="cs-header">
    <p class="cs-meta">{meta}</p>
    <h1 class="cs-title">{title}</h1>
    {tx(c['lead'], 'p', 'cs-lead')}{about}
    <div class="cs-facts">
      <div>
        <span class="cs-facts-label" data-en="My role" data-de="Meine Rolle">My role</span>
        <p>{role_line}</p>
      </div>
      <div>
        <span class="cs-facts-label" data-en="Topic" data-de="Thema">Topic</span>
        <p>{topic_line}</p>
      </div>
    </div>
  </header>

  <!-- ── COVER IMAGE ────────────────────────────────────── -->
  <div class="alt-cover cs-cover{' alt-cover--video' if c.get('cover_html', '').startswith('<video') else ''}">
    {c.get('cover_html') or p['cover']}
  </div>
''']

    # overview
    if c.get('simple'):
        h = c['headings']
        cards = [(h[0], join_bodies(chal['bodies'])),
                 (h[1], c.get('approach_body') or join_bodies(process[0]['bodies'])),
                 (h[2], join_bodies(sol['bodies']))]
        # keep the German heading where the new heading equals the old one
        old = [chal, process[0], sol]
        cards = [((hd, o['heading'][1]) if o['heading'][0] == hd else hd, b)
                 for (hd, b), o in zip(cards, old)]
    else:
        prob = (chal['heading'], join_bodies(chal['bodies'])) if c['problem'] == 'original' else c['problem']
        cards = [prob, c['approach'], c['result']]
    labels = [('Problem', 'Problem'), ('Approach', 'Vorgehen'), ('Result', 'Ergebnis')]
    out.append('''
  <section class="cs-section" id="overview">
    <h2 class="cs-section-title" data-en="Overview" data-de="Überblick">Overview</h2>
    <div class="cs-steps">
''' + '\n'.join(step(f'0{i + 1}', labels[i], cards[i], i == 2) for i in range(3)) + '''
    </div>
  </section>
''')

    # image strip: everything that has no accordion step to live in
    gallery = (chal['media'] + process[0]['media'] + sol['media']) if c.get('simple') \
        else (chal['media'] + sol['media'])
    gallery = [m for m in gallery if not any(x in m for x in c.get('gallery_exclude', []))]
    if 'gallery_override' in c:
        gallery = c['gallery_override']
    # crop single images to a given aspect ratio (e.g. to match the image next to them)
    # swap single gallery items for other markup (e.g. the former cover image)
    for name, html in c.get('gallery_swap', {}).items():
        gallery = [html if name in m else m for m in gallery]
    for name, crop in c.get('gallery_crop', {}).items():
        ratio, pos = crop if isinstance(crop, tuple) else (crop, 'center')
        gallery = [m.replace('<img ', f'<img style="aspect-ratio: {ratio}; object-fit: cover; object-position: {pos}" ', 1)
                   if name in m else m for m in gallery]
    if 'gallery_raw' in c:
        out.append(c['gallery_raw'])
        gallery = []
    if gallery:
        if c.get('equal_height_gallery'):
            out.append(gallery_html([lazy(m) for m in gallery]))
        else:
            out.append('\n  <div class="cs-gallery">\n' + '\n'.join(
                f'    <div class="cs-gallery-item">{lazy(m)}</div>' for m in gallery) + '\n  </div>\n')

    if not c.get('simple'):
        # decisions
        ds = []
        for i, (t, why, trade) in enumerate(c['decisions'], 1):
            tr = f'\n            {tx(trade, "p", "cs-decision-trade")}' if trade else ''
            ds.append(f'''        <div class="cs-decision">
          <span class="cs-num">0{i}</span>
          {tx(t, 'h3', 'cs-decision-title')}
          <div class="cs-decision-text">
            {tx(why, 'p', 'cs-decision-why')}{tr}
          </div>
        </div>''')
        out.append('''
  <section class="cs-section" id="decisions">
    <h2 class="cs-section-title" data-en="Main decisions" data-de="Wichtige Entscheidungen">Main decisions</h2>
    <div class="cs-decisions">
''' + '\n'.join(ds) + '''
    </div>
  </section>
''')
        # accordion: the original steps, word for word
        assert len(c['steps']) == len(process), (n, len(process))
        items = []
        for i, (b, t) in enumerate(zip(process, c['steps']), 1):
            de_t = f"{strip_num(b['label'][1])}: {b['heading'][1]}" if b['label'][1] and b['heading'][1] else None
            mo = c.get('media_override', {})
            items_m = mo[i] if i in mo else [lazy(m) for m in b['media']]
            vids = [m for m in items_m if m.lstrip().startswith('<video')]
            if len(vids) >= 2:  # several videos sit side by side
                items_m = [m for m in items_m if m not in vids] + \
                    ['<div class="cs-media-pair">' + ''.join(vids) + '</div>']
            media = '\n'.join(f'                {m}' for m in items_m)
            img_block = (f'              <div class="cs-acc-image">\n{media}\n              </div>\n'
                         if items_m else '')
            op = ' open' if i == 1 else ''
            items.append(f'''        <div class="cs-acc-item{op}">
          <button type="button" class="cs-acc-head" aria-expanded="{'true' if i == 1 else 'false'}">
            <span class="cs-num">0{i}</span>
            {tx(t if isinstance(t, tuple) else (t, de_t), cls='cs-acc-title')}
            <span class="cs-acc-icon" aria-hidden="true"></span>
          </button>
          <div class="cs-acc-body">
            <div class="cs-acc-inner">
              {tx(c.get('body_override', {}).get(i) or join_bodies(b['bodies']), 'p', 'cs-acc-text')}
{img_block}            </div>
          </div>
        </div>''')
        out.append('''
  <section class="cs-section" id="process">
    <h2 class="cs-section-title" data-en="Full process" data-de="Der ganze Prozess">Full process</h2>
    <div class="cs-accordion">
''' + '\n'.join(items) + '''
    </div>
  </section>
''')

    chips = '\n'.join(f'          {tx(ch, "li")}' for ch in c['chips'])
    out.append(f'''
  <section class="cs-section" id="role">
    <h2 class="cs-section-title" data-en="My role" data-de="Meine Rolle">My role</h2>
    <div class="cs-role">
      {tx(c['role'], 'p', 'cs-role-lead')}
      <ul class="cs-chips">
{chips}
      </ul>
    </div>
  </section>

''')
    if p['marquee']:
        out.append('  <!-- DISCLAIMER MARQUEE -->\n  ' + p['marquee'] + '\n\n')
    out.append('  <!-- ── SEE MORE ─────────────────────────────────────────── -->\n  '
               + p['more'].replace('ELLA – Lifelong', 'ELLA: Lifelong') + '\n\n')
    out.append(TAIL)
    open(f'{REPO}/project-{n}-draft.html', 'w', encoding='utf-8').write(''.join(out))
    print('wrote', n)


for n in P:
    build(n)
