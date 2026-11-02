"""Parse an old-layout project page into its parts (blocks, media, raw sections)."""
import re, html as H
from html.parser import HTMLParser

VOID = {'img', 'br', 'source', 'meta', 'link', 'input', 'hr'}


class Node:
    def __init__(s, tag, attrs, start, parent):
        s.tag, s.attrs, s.start, s.end, s.parent, s.kids = tag, dict(attrs), start, start, parent, []

    @property
    def cls(s):
        return (s.attrs.get('class') or '').split()

    def walk(s):
        yield s
        for k in s.kids:
            yield from k.walk()

    def find_all(s, pred):
        return [n for n in s.walk() if pred(n)]


class TreeBuilder(HTMLParser):
    def __init__(s, src):
        super().__init__(convert_charrefs=True)
        s.src = src
        s.lines = [0]
        for m in re.finditer('\n', src):
            s.lines.append(m.end())
        s.root = Node('root', [], 0, None)
        s.cur = s.root

    def off(s):
        l, c = s.getpos()
        return s.lines[l - 1] + c

    def handle_starttag(s, t, a):
        n = Node(t, a, s.off(), s.cur)
        s.cur.kids.append(n)
        if t in VOID:
            n.end = s.off() + len(s.get_starttag_text())
        else:
            s.cur = n

    def handle_startendtag(s, t, a):
        n = Node(t, a, s.off(), s.cur)
        n.end = s.off() + len(s.get_starttag_text())
        s.cur.kids.append(n)

    def handle_endtag(s, t):
        n = s.cur
        while n is not s.root and n.tag != t:
            n = n.parent
        if n is s.root:
            return
        o = s.off()
        n.end = s.src.index('>', o) + 1
        s.cur = n.parent


def norm(t):
    return ' '.join((t or '').split())


def parse(path):
    src = open(path, encoding='utf-8').read()
    tb = TreeBuilder(src)
    tb.feed(src)
    raw = lambda n: src[n.start:n.end]
    has = lambda c: (lambda n: c in n.cls)
    root = tb.root
    body = root.find_all(lambda n: n.tag == 'body')[0]

    def text_of(n):
        return norm(re.sub(r'<[^>]+>', ' ', src[n.start:n.end]).replace('&amp;', '&'))

    def ende(n):
        en = n.attrs.get('data-en')
        de = n.attrs.get('data-de')
        if en is None:
            inner = src[n.start:n.end]
            inner = inner[inner.index('>') + 1:inner.rindex('<')]
            en = inner
        return norm(en), (norm(de) if de is not None else None)

    page = {'src': src, 'body_class': body.attrs.get('class', '')}
    page['title'] = text_of(root.find_all(lambda n: n.tag == 'h1')[0])
    cover = root.find_all(has('alt-cover'))[0]
    page['cover'] = raw(cover.find_all(lambda n: n.tag == 'img')[0])
    tags = root.find_all(has('alt-intro-tags'))
    page['topic'] = [raw(k) for k in tags[0].kids] if tags else []
    ld = root.find_all(has('alt-intro-lead'))
    page['lead'] = ende(ld[0]) if ld else None
    mq = root.find_all(has('marquee-band'))
    page['marquee'] = raw(mq[0]) if mq else ''
    more = root.find_all(lambda n: n.tag == 'section' and 'project-more' in n.cls)
    page['more'] = raw(more[0]) if more else ''

    blocks = []
    for n in body.kids:
        if 'alt-block' in n.cls:
            b = {'media': [], 'bodies': []}
            for m in n.walk():
                if m.tag in ('img', 'video'):
                    b['media'].append(raw(m))
                elif 'alt-panel-label' in m.cls:
                    b['label'] = ende(m)
                elif 'alt-panel-heading' in m.cls:
                    b['heading'] = ende(m)
                elif 'alt-panel-body' in m.cls:
                    b['bodies'].append(ende(m))
            blocks.append(b)
        elif n.tag in ('div', 'section') and blocks and n.find_all(lambda m: m.tag in ('img', 'video')) \
                and 'project-more' not in n.cls:
            blocks[-1]['media'] += [raw(m) for m in n.walk() if m.tag in ('img', 'video')]
    page['blocks'] = blocks
    return page
