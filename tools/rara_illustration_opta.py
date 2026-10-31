#!/usr/bin/env python3
"""Hero illustration, Opta version: Opta <-paddle-> Ex Libris <-USB-C-> phone.

The Opta's expansion port is on its right side, so the Ex Libris sits to the
right of the Opta, rotated 90 deg clockwise, with its paddle (J305, 10 edge
fingers) plugged into that port. Same style and 3 px/mm scale as
rara_illustration.py.

    python3 tools/rara_illustration_opta.py [out.svg]
"""
import sys
from rara_diagrams import (Svg, TINTA, PAPEL, COBRE, MASCARA, TINTA_SUAVE,
                           PAPEL_BORDE, SERIF, SANS, MONO)
from rara_illustration import K, W, H, cat, phone, exlibris


def opta(s, x, y):
    """Generic Opta-style DIN module, about 70 x 90 mm, expansion port on the right."""
    w, h = 70 * K, 90 * K
    s.add(f'<rect x="{x + 6}" y="{y + 8}" width="{w}" height="{h}" rx="8" fill="{TINTA}" opacity=".12"/>')
    s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#E7E4DD" stroke="#CFCBC1" stroke-width="1.5"/>')
    # stepped front (raised centre)
    s.add(f'<rect x="{x + 8}" y="{y + 50}" width="{w - 16}" height="{h - 100}" rx="5" fill="#F2F0EB" '
          f'stroke="#D8D2C2" stroke-width="1"/>')
    # terminal rows: inputs on top, relay outputs at the bottom
    for row_y, n in ((y + 8, 10), (y + h - 40, 8)):
        pitch = (w - 24) / n
        s.add(f'<rect x="{x + 12}" y="{row_y}" width="{w - 24}" height="32" rx="2" fill="#5E5B54"/>')
        for k in range(n):
            s.add(f'<circle cx="{x + 12 + (k + .5) * pitch}" cy="{row_y + 12}" r="3.4" fill="#B9B6AD"/>')
            s.add(f'<rect x="{x + 12 + (k + .5) * pitch - 2}" y="{row_y + 21}" width="4" height="6" fill="#8E8B83"/>')
    # status LEDs and labels
    for i in range(4):
        s.add(f'<circle cx="{x + 30 + i * 16}" cy="{y + 160}" r="3.2" fill="{["#53B07A", "#53B07A", "#E0A43A", "#B9B6AD"][i]}"/>')
    s.text(x + 22, y + 82, 'Opta', 22, SERIF, TINTA)
    s.text(x + 22, y + 100, 'runs the machine', 11, SANS, TINTA_SUAVE)
    s.add(f'<rect x="{x + 22}" y="{y + 178}" width="26" height="14" rx="7" fill="#CFCBC1"/>')
    # expansion port on the right side (cover removed)
    px = x + w
    s.add(f'<rect x="{px - 7}" y="{y + 90}" width="9" height="{16 * K + 8}" rx="2" fill="#2A2926"/>')
    return px, y + 90 + (16 * K + 8) / 2


def main(out):
    s = Svg(W, H)
    L, R = 48, W - 48
    s.text(L, 62, 'RARA PLC', 30, SERIF, COBRE, spacing=8)
    s.text(L, 88, 'YOUR PLC · EX LIBRIS · YOUR PHONE', 12, SANS, TINTA_SUAVE, spacing=2.5)
    cat(s, R - 26, 58, 52)

    op_x, op_y = 150, 240
    port_x, port_y = opta(s, op_x, op_y)

    # Ex Libris rotated 90 deg clockwise around its centre: the paddle (bottom edge) points left.
    bw, bh = 72 * K, 47.35 * K
    paddle_centre = 121          # paddle centre, board x (mm)
    tip = 163.35                 # paddle tip, board y (mm)
    insert = 6 * K               # how far the fingers go into the port
    # board centre after rotation, chosen so the paddle tip lands inside the port
    cxg = port_x - insert + (tip - 100 - bh / K / 2) * K
    cyg = port_y - (paddle_centre - 100 - bw / K / 2) * K
    X0, Y0 = cxg - bw / 2, cyg - bh / 2
    s.add(f'<g transform="rotate(90 {cxg} {cyg})">')
    (ux, uy), _ = exlibris(s, X0, Y0, paddle=True)
    s.add('</g>')
    # port drawn again on top so the fingers look inserted
    s.add(f'<rect x="{port_x - 7}" y="{op_y + 90}" width="9" height="{16 * K + 8}" rx="2" fill="#2A2926"/>')
    # USB-C position after rotation
    ugx, ugy = cxg - (uy - cyg), cyg + (ux - cxg)

    ph_x, ph_y = 960, 170
    usb_end = phone(s, ph_x, ph_y, 'Opta')
    px, py = usb_end
    s.add(f'<path d="M{ugx},{ugy} C{ugx + 60},{ugy - 170} {px - 120},{py + 130} {px},{py + 8}" '
          f'fill="none" stroke="{TINTA}" stroke-width="6" stroke-linecap="round"/>')
    s.add(f'<rect x="{px - 9}" y="{py}" width="18" height="16" rx="3" fill="{TINTA}"/>')
    s.text(ugx + 150, ugy + 150, 'USB-C · OTG', 11, MONO, TINTA_SUAVE, weight='700', spacing=1.5)
    s.text(port_x + 10, op_y + h_label(), 'EXPANSION PORT · PADDLE', 11, MONO, COBRE, weight='700', spacing=1.5)

    cap_y = 690
    for x, w, num, title, line in [
            (op_x - 20, 330, '01', 'YOUR PLC', 'runs the machine, exactly as before'),
            (520, 360, '02', 'EX LIBRIS', 'plugs into the Opta’s side port'),
            (ph_x - 20, 300, '03', 'YOUR PHONE', 'reads the record, even with the PLC off')]:
        s.line(x, cap_y, x + w, cap_y, COBRE, 1.5)
        s.text(x, cap_y + 26, f'{num} — {title}', 13, MONO, TINTA_SUAVE, weight='700', spacing=3)
        s.text(x, cap_y + 52, line, 17, SERIF, TINTA, italic=True)
    s.text(R, H - 18, 'Illustration, approximate scale. Arduino and Opta are trademarks of Arduino SA; '
           'Opta is co-developed with Finder. RARA PLC is not affiliated.', 10, SANS, TINTA_SUAVE, 'end')
    s.save(out)


def h_label():
    return 90 * K + 40


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'docs/assets/ex-libris/hero-opta.svg')
