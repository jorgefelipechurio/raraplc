#!/usr/bin/env python3
"""RARA PLC diagrams in the Rara Machina visual style (raramachina.com).

Tokens come from the brand guide (second brain, wiki/marca.md), the same
CSS variables raramachina.com uses. Generates SVG (the version the README
shows: GitHub renders it with the viewer's Georgia / Helvetica / Consolas).

    python3 tools/rara_diagrams.py [outdir] [--rings]

--rings adds the internal ring labels (private version for the second brain).
"""
import sys
from xml.sax.saxutils import escape as X

# ---- Rara Machina tokens -------------------------------------------------
TINTA = '#2B2B28'
PAPEL = '#F5F0E6'
COBRE = '#C1622E'
MASCARA = '#1F5C4D'
TINTA_SUAVE = '#6B6555'
PAPEL_BORDE = '#D8D2C2'
CREMA_VERDE = '#9FD9BC'
CARD = '#FBF8F1'  # paper, one step lighter, for cards
SERIF = "Georgia,'Times New Roman',serif"
SANS = "Helvetica,Arial,sans-serif"
MONO = "Consolas,'Courier New',monospace"


class Svg:
    def __init__(self, w, h):
        self.w, self.h, self.o = w, h, []
        self.o.append(
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
            f'viewBox="0 0 {w} {h}">')
        self.o.append(
            '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" '
            'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0,1 L9,5 L0,9" fill="none" stroke="{TINTA_SUAVE}" '
            'stroke-width="1.6"/></marker></defs>')
        self.o.append(f'<rect width="{w}" height="{h}" fill="{PAPEL}"/>')

    def add(self, s):
        self.o.append(s)

    def text(self, x, y, t, size, fam=SANS, fill=TINTA, anchor='start',
             weight='400', spacing=0, italic=False):
        st = ' font-style="italic"' if italic else ''
        ls = f' letter-spacing="{spacing}"' if spacing else ''
        self.add(f'<text x="{x}" y="{y}" font-family="{fam}" font-size="{size}" '
                 f'font-weight="{weight}" fill="{fill}" text-anchor="{anchor}"'
                 f'{ls}{st}>{X(t)}</text>')

    def rect(self, x, y, w, h, fill=CARD, stroke=PAPEL_BORDE, sw=1.5, rx=2):
        self.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
                 f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

    def line(self, x1, y1, x2, y2, stroke=COBRE, sw=1.5, dash=None, arrow=False,
             both=False):
        d = f' stroke-dasharray="{dash}"' if dash else ''
        m = ' marker-end="url(#ar)"' if arrow else ''
        s = ' marker-start="url(#ar)"' if both else ''
        self.add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" '
                 f'stroke-width="{sw}"{d}{m}{s}/>')

    def section(self, x, y, w, num, title, note=None):
        """Site-style section header: copper rule, mono index label."""
        self.line(x, y, x + w, y, COBRE, 1.5)
        self.text(x, y + 26, f'{num} — {title}', 13, MONO, TINTA_SUAVE,
                  weight='700', spacing=3)
        if note:
            self.text(x + w, y + 26, note, 15, SERIF, COBRE, 'end', italic=True)

    def save(self, path):
        self.o.append('</svg>')
        with open(path, 'w', encoding='utf8') as f:
            f.write('\n'.join(self.o))


def card(s, x, y, w, h, title, lines, accent=False, title_color=None):
    s.rect(x, y, w, h, CARD, COBRE if accent else PAPEL_BORDE, 1.8 if accent else 1.5)
    n = len(lines)
    y0 = y + h / 2 - (n * 20) / 2 + 4
    s.text(x + w / 2, y0, title, 21, SERIF, title_color or (COBRE if accent else TINTA),
           'middle')
    for i, t in enumerate(lines):
        s.text(x + w / 2, y0 + 24 + i * 20, t, 14, SANS, TINTA_SUAVE, 'middle')


# ---- Suite ---------------------------------------------------------------
def suite(path):
    W, H = 1200, 820
    s = Svg(W, H)
    L, R = 40, W - 40
    s.text(L, 58, 'RARA PLC', 30, SERIF, COBRE, spacing=8)
    s.text(L, 84, 'THE SUITE · ONE RECORD PER MACHINE, ONE KNOWLEDGE BASE PER USER',
           12, SANS, TINTA_SUAVE, spacing=2.5)

    # 01 each machine
    s.section(L, 120, R - L, '01', 'EACH MACHINE', 'Ex Libris belongs to the machine')
    xs = [110, 470, 890]
    for i, x in enumerate(xs):
        s.text(x + 100, 182, ['MACHINE 1', 'MACHINE 2', 'MACHINE N'][i], 11, MONO,
               TINTA_SUAVE, 'middle', spacing=2)
        card(s, x, 192, 200, 58, 'PLC', ['runs the machine'])
        s.line(x + 100, 250, x + 100, 278, TINTA_SUAVE, 1.4)
        s.text(x + 108, 268, 'I2C', 10, MONO, TINTA_SUAVE, spacing=1)
        card(s, x, 278, 200, 92, 'Ex Libris', ['identity · history', 'program · last good'],
             accent=True)
    s.text(780, 290, '· · ·', 30, SERIF, TINTA_SUAVE, 'middle')

    # 02 the user
    s.section(L, 430, R - L, '02', 'THE USER', 'Acervus belongs to the user')
    ax, ay, aw, ah = 400, 470, 400, 100
    card(s, ax, ay, aw, ah, 'Acervus',
         ['everything your machines taught you,', 'in one place: fixes, patterns, parts, people'],
         accent=True)
    for x, tx in zip(xs, [ax + 70, ax + aw / 2, ax + aw - 70]):
        s.line(x + 100, 370, tx, ay - 4, TINTA_SUAVE, 1.4, arrow=True)
    s.text(ax + aw / 2 + 12, 405, 'signed records', 12, SERIF, TINTA_SUAVE, italic=True)

    # 03 AI access
    s.section(L, 630, R - L, '03', 'AI ACCESS')
    by, bh, bw = 680, 92, 300
    bx = [L + 30, (W - bw) / 2, R - 30 - bw]
    card(s, bx[0], by, bw, bh, 'Rara Bridge', ['Claude + a technician,', 'live support'],
         title_color=MASCARA)
    card(s, bx[1], by, bw, bh, 'MCP', ['the door for AI'], title_color=MASCARA)
    card(s, bx[2], by, bw, bh, 'Claude', ['or any MCP client'], title_color=MASCARA)
    s.line(W / 2, ay + ah + 4, W / 2, by - 4, TINTA_SUAVE, 1.4, arrow=True, both=True)
    s.line(bx[1] + bw + 4, by + bh / 2, bx[2] - 4, by + bh / 2, TINTA_SUAVE, 1.4,
           arrow=True, both=True)
    s.add(f'<path d="M{bx[2] + bw / 2},{by + bh + 4} C{bx[2] + bw / 2},{by + bh + 34} '
          f'{bx[0] + bw / 2},{by + bh + 34} {bx[0] + bw / 2},{by + bh + 6}" fill="none" '
          f'stroke="{TINTA_SUAVE}" stroke-width="1.4" marker-end="url(#ar)" '
          f'marker-start="url(#ar)"/>')
    s.save(path)


# ---- Licensing -----------------------------------------------------------
def licensing(path, rings=False):
    W, H = 1200, 900
    s = Svg(W, H)
    L, R = 40, W - 40
    rg = (lambda t: f'  ·  {t}') if rings else (lambda t: '')
    s.text(L, 58, 'LICENSING BY LAYER', 30, SERIF, COBRE, spacing=6)
    s.text(L, 84, 'OPEN WHERE IT CONNECTS · CLOSED WHERE IT IS COPIED', 12, SANS,
           TINTA_SUAVE, spacing=2.5)

    def box(x, y, w, h, color, tag, title, lines, lic):
        s.rect(x, y, w, h, CARD, PAPEL_BORDE, 1.5)
        s.add(f'<rect x="{x}" y="{y}" width="4" height="{h}" fill="{color}"/>')
        s.text(x + 22, y + 30, tag, 11, MONO, color, weight='700', spacing=2)
        s.text(x + 22, y + 58, title, 19, SERIF, TINTA)
        for i, t in enumerate(lines):
            s.text(x + 22, y + 82 + i * 19, t, 14, SANS, TINTA_SUAVE)
        s.line(x + 22, y + h - 40, x + w - 22, y + h - 40, PAPEL_BORDE, 1)
        s.text(x + 22, y + h - 16, lic.upper(), 12, MONO, color, weight='700', spacing=1.5)

    cw, bh = 545, 150
    cx = [L, R - cw]
    s.section(cx[0], 120, cw, '01', 'OPEN', 'anyone can read, use, build on it')
    s.section(cx[1], 120, cw, '02', 'CLOSED', 'keeps clones out, the service alive')
    rows = [168, 334, 500]
    box(cx[0], rows[0], cw, bh, MASCARA, 'H1 · HARDWARE DOCS',
        'Schematic, pinout, datasheet, 3D model',
        ['Everything you need to wire, mount and repair it.'], 'CC BY-SA 4.0')
    box(cx[0], rows[1], cw, bh, MASCARA, 'S1 · INTERFACE SPECS',
        'I2C & USB protocols, machine.json, MCP spec',
        ['Anyone can talk to Ex Libris, even in closed products.'], 'CC BY 4.0 · Apache-2.0')
    box(cx[0], rows[2], cw, bh, MASCARA, 'S2 · HOST CODE' + rg('RING 1'),
        'Arduino / Zephyr library, local MCP server, CLI',
        ['The code that runs on your PLC and your laptop.'], 'MPL-2.0')
    box(cx[1], rows[0], cw, bh, COBRE, 'H2 · HARDWARE DESIGN',
        'KiCad sources, Gerbers, pick & place, costed BOM',
        ['Shared only with the manufacturer, under NDA.'], 'All rights reserved')
    box(cx[1], rows[1], cw, bh, COBRE, 'S3 · MODULE FIRMWARE' + rg('RING 2'),
        'Bootloader, runtime, crypto', ['Shipped only as a signed binary.'],
        'Proprietary · EULA')
    box(cx[1], rows[2], cw, bh, COBRE, 'S4 · SERVICES' + rg('RING 2'),
        'Acervus, Rara Bridge, remote MCP', ['Hosted by RARA.'],
        'Proprietary · Terms of use')

    s.section(L, 690, R - L, '03', 'ACROSS ALL LAYERS')
    tw = (R - L - 40) / 3
    by = 738
    box(L, by, tw, 140, MASCARA, 'D · YOUR DATA', 'Machine records & knowledge',
        ['Yours. Open formats, always exportable.'], 'Owned by you')
    box(L + tw + 20, by, tw, 140, COBRE, 'S5 · THE SIGNATURE' + rg('RING 3'),
        'Genuine modules only', ['Support and warranty for genuine modules.'],
        'Subscription' if rings else 'Genuine only')
    box(L + 2 * (tw + 20), by, tw, 140, TINTA, 'M · BRAND', 'RARA · Ex Libris · Rara Cat',
        ['"Compatible with RARA Ex Libris" is fine.'], 'Reserved trademark')
    s.save(path)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    out = args[0] if args else 'docs/assets/diagrams'
    rings = '--rings' in sys.argv
    suite(f'{out}/suite.svg')
    licensing(f'{out}/licensing.svg', rings)
    print('ok', out, 'rings' if rings else 'public')
