#!/usr/bin/env python3
"""Hero illustration: phone <-USB-C-> Ex Libris <-Grove I2C-> Portenta Machine Control.

Rara Machina style (tokens from tools/rara_diagrams.py). Ex Libris geometry is
taken from RARA-EXLIBRIS-FLAT.kicad_pcb Rev 1.0 (board 72 x 47.35 mm, origin
at 100,100). Everything is drawn at 3 px/mm, so sizes are roughly to scale.

    python3 tools/rara_illustration.py [out.svg]
"""
import sys
from rara_diagrams import (Svg, TINTA, PAPEL, COBRE, MASCARA, TINTA_SUAVE,
                           PAPEL_BORDE, CREMA_VERDE, CARD, SERIF, SANS, MONO)

K = 3.0                     # px per mm
MASK = '#1C1C1A'            # black soldermask
SILK = '#F5F0E6'
W, H = 1440, 800


def cat(s, cx, cy, size, bg=MASCARA):
    """Rara Cat with glasses (from raracat_anteojos.svg, 128 units)."""
    k = size / 128
    s.add(f'<g transform="translate({cx - size / 2},{cy - size / 2}) scale({k})">'
          f'<rect width="128" height="128" rx="10" fill="{bg}"/>'
          f'<g stroke="{PAPEL}" stroke-width="2.6" stroke-linecap="round">'
          '<line x1="12" y1="62.5" x2="34" y2="70"/><line x1="9.5" y1="79" x2="34" y2="79"/>'
          '<line x1="12" y1="95.5" x2="34" y2="88"/><line x1="116" y1="62.5" x2="94" y2="70"/>'
          '<line x1="118.5" y1="79" x2="94" y2="79"/><line x1="116" y1="95.5" x2="94" y2="88"/></g>'
          f'<g fill="{COBRE}"><circle cx="11.5" cy="62.5" r="3"/><circle cx="9.5" cy="79" r="3"/>'
          '<circle cx="11.5" cy="95.5" r="3"/><circle cx="116.5" cy="62.5" r="3"/>'
          '<circle cx="118.5" cy="79" r="3"/><circle cx="116.5" cy="95.5" r="3"/></g>'
          f'<g fill="{PAPEL}"><circle cx="64" cy="77.5" r="34.5"/>'
          '<polygon points="31,20.5 58,41 70,41 97,20.5 90,56 38,56"/></g>'
          f'<g fill="{bg}"><circle cx="51" cy="72" r="5.4"/><circle cx="77" cy="72" r="5.4"/>'
          '<polygon points="58,86 70,86 64,92.5"/></g>'
          f'<g fill="none" stroke="{COBRE}" stroke-width="2.4" stroke-linecap="round">'
          '<circle cx="51" cy="72" r="9.6"/><circle cx="77" cy="72" r="9.6"/>'
          '<path d="M60.4 70.2 Q64 67.4 67.6 70.2"/></g></g>')


# ---------------------------------------------------------------- phone
def phone(s, x, y, host='Portenta MC'):
    w, h = 72 * K, 150 * K
    s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="30" fill="{TINTA}"/>')
    sx, sy, sw, sh = x + 9, y + 12, w - 18, h - 24
    s.add(f'<rect x="{sx}" y="{sy}" width="{sw}" height="{sh}" rx="22" fill="{PAPEL}"/>')
    s.add(f'<rect x="{x + w / 2 - 28}" y="{sy + 10}" width="56" height="14" rx="7" fill="{TINTA}"/>')
    cx = sx + 18
    s.text(cx, sy + 58, 'EX LIBRIS · USB', 10, MONO, TINTA_SUAVE, weight='700', spacing=1.5)
    s.text(cx, sy + 88, 'Pasteurizing', 19, SERIF, TINTA)
    s.text(cx, sy + 110, 'tunnel #2', 19, SERIF, TINTA)
    s.add(f'<rect x="{cx}" y="{sy + 122}" width="52" height="20" rx="10" fill="{MASCARA}"/>')
    s.text(cx + 26, sy + 136, 'RUN', 11, MONO, PAPEL, 'middle', '700', 1)
    s.text(cx + 62, sy + 136, host, 11, SANS, TINTA_SUAVE)
    rows = [('PROGRAM', 'v1.4.2 · signed'), ('LAST GOOD', 'v1.4.1 · ready'),
            ('LAST EVENT', '3 h ago · E-stop reset'), ('I/O MAP', '24 points · signed')]
    yy = sy + 170
    for k, v in rows:
        s.line(cx, yy - 16, sx + sw - 18, yy - 16, PAPEL_BORDE, 1)
        s.text(cx, yy, k, 9, MONO, TINTA_SUAVE, weight='700', spacing=1.2)
        s.text(cx, yy + 17, v, 13, SANS, TINTA)
        yy += 46
    # Claude bubble
    by = sy + sh - 92
    s.add(f'<rect x="{cx - 4}" y="{by}" width="{sw - 28}" height="62" rx="12" fill="{CARD}" '
          f'stroke="{COBRE}" stroke-width="1.4"/>')
    s.text(cx + 8, by + 22, 'CLAUDE', 9, MONO, COBRE, weight='700', spacing=1.5)
    s.text(cx + 8, by + 42, 'Reads this machine’s', 12, SANS, TINTA)
    s.text(cx + 8, by + 56, 'own record.', 12, SANS, TINTA)
    # USB-C port at the bottom
    s.add(f'<rect x="{x + w / 2 - 14}" y="{y + h - 6}" width="28" height="6" rx="3" fill="#55524A"/>')
    return x + w / 2, y + h


# ------------------------------------------------------------- Ex Libris
def exlibris(s, X0, Y0, paddle=False):
    P = lambda x, y: (X0 + (x - 100) * K, Y0 + (y - 100) * K)
    bw, bh = 72 * K, 47.35 * K
    if paddle:
        # Opta paddle (J305): neck with mouse bites + 16 x 14 mm tab, 10 edge fingers, 2 mm pitch
        nx, ny = P(118.5, 147.0)
        s.add(f'<rect x="{nx}" y="{ny}" width="{5 * K}" height="{2.6 * K}" fill="{MASK}"/>')
        tx, ty = P(113, 149.35)
        s.add(f'<rect x="{tx}" y="{ty}" width="{16 * K}" height="{14 * K}" rx="2" fill="{MASK}"/>')
        for n in range(10):
            fx, fy = P(113 + 0.6 + n * 1.6, 158.6)
            s.add(f'<rect x="{fx}" y="{fy}" width="{1.0 * K}" height="{4.4 * K}" rx="1" fill="#C9A14A"/>')
        lx, ly = P(121, 153.4)
        for i, t in enumerate(['OPTA', 'EXPANSION', 'SLOT']):
            s.text(lx, ly + i * 7.5, t, 6, SANS, SILK, 'middle', '700', 0.5)
    # board + soft shadow
    s.add(f'<rect x="{X0 + 5}" y="{Y0 + 7}" width="{bw}" height="{bh}" rx="5" fill="{TINTA}" opacity=".12"/>')
    s.add(f'<rect x="{X0}" y="{Y0}" width="{bw}" height="{bh}" rx="5" fill="{MASK}"/>')
    for hx, hy in [(103.5, 103.5), (168.5, 103.5), (103.5, 143.85), (168.5, 143.85)]:
        px, py = P(hx, hy)
        s.add(f'<circle cx="{px}" cy="{py}" r="{1.6 * K}" fill="{PAPEL}" opacity=".9"/>')
    # display DS501 (panel 29.2 x 26.2 mm once rotated)
    cx, cy = P(140.51, 123.19)
    dw, dh = 29.2 * K, 26.2 * K
    s.add(f'<rect x="{cx - dw / 2}" y="{cy - dh / 2}" width="{dw}" height="{dh}" rx="2" fill="#0E0E0D"/>')
    ax, ay, aw, ah = cx - dw / 2 + 4, cy - dh / 2 + 4, dw - 8, dh - 8
    s.add(f'<rect x="{ax}" y="{ay}" width="{aw}" height="{ah}" fill="#151A19"/>')
    s.text(ax + 4, ay + 11, 'RARA', 8, SERIF, PAPEL, weight='700', spacing=1)
    s.add(f'<rect x="{ax + aw - 20}" y="{ay + 4}" width="17" height="8" rx="2" fill="{MASCARA}"/>')
    s.text(ax + aw - 11.5, ay + 10.5, 'RUN', 5.5, MONO, PAPEL, 'middle', '700')
    for i, wdt in enumerate([44, 30, 36, 26]):
        s.add(f'<rect x="{ax + 4}" y="{ay + 20 + i * 10}" width="{wdt}" height="3" rx="1" fill="{PAPEL}" opacity=".55"/>')
    qx, qy, q = ax + aw - 26, ay + 22, 22
    s.add(f'<rect x="{qx}" y="{qy}" width="{q}" height="{q}" fill="{PAPEL}"/>')
    for (i, j) in [(1, 1), (4, 1), (1, 4), (3, 3), (4, 4), (2, 3), (3, 1), (1, 3)]:
        s.add(f'<rect x="{qx + i * 4}" y="{qy + j * 4}" width="4" height="4" fill="#151A19"/>')
    # J201 push-in terminal block (24 V)
    cx, cy = P(108.76, 111.84)
    s.add(f'<rect x="{cx - 6.5 * K}" y="{cy - 4.6 * K}" width="{13 * K}" height="{9.2 * K}" rx="2" fill="#8E8B83"/>')
    for d in (-1.75, 1.75):
        s.add(f'<rect x="{cx + d * K - 4}" y="{cy - 4.6 * K + 3}" width="8" height="9" rx="1.5" fill="{COBRE}"/>')
        s.add(f'<circle cx="{cx + d * K}" cy="{cy + 2 * K}" r="4" fill="#3E3C37"/>')
    s.text(cx + 7.5 * K, cy - 2, '24V', 7, SANS, SILK, weight='700')
    s.text(cx + 7.5 * K, cy + 9, 'GND', 7, SANS, SILK, weight='700')
    # J501 USB-C (vertical receptacle)
    ux, uy = P(107.31, 135.74)
    s.add(f'<rect x="{ux - 2.2 * K}" y="{uy - 5 * K}" width="{4.4 * K}" height="{10 * K}" rx="{2.2 * K}" fill="#B9B6AD"/>')
    s.add(f'<rect x="{ux - 1.1 * K}" y="{uy - 3.8 * K}" width="{2.2 * K}" height="{7.6 * K}" rx="{1.1 * K}" fill="#2A2926"/>')
    # SW501 PRESENCE
    px, py = P(117.48, 135.8)
    s.add(f'<rect x="{px - 3.1 * K}" y="{py - 3.1 * K}" width="{6.2 * K}" height="{6.2 * K}" rx="2" fill="#5E5B54"/>')
    s.add(f'<circle cx="{px}" cy="{py}" r="{2 * K}" fill="#2F5FA8"/>')
    s.text(px, py + 5.2 * K, 'PRESENCE', 6.5, SANS, SILK, 'middle', '700', 0.5)
    # Grove J303 (pass-through) and J301 (PLC), pads from pin 1 down 6 mm
    grove_out = []
    for gy in (112.895, 127.82):
        gx, gc = P(162.56, gy + 3)
        s.add(f'<rect x="{gx - 3 * K}" y="{gc - 5.2 * K}" width="{6 * K}" height="{10.4 * K}" rx="1.5" fill="#F2EFE8"/>')
        s.add(f'<rect x="{gx - 1.6 * K}" y="{gc - 4.2 * K}" width="{3.2 * K}" height="{8.4 * K}" rx="1" fill="#CFCBC1"/>')
        for n in range(4):
            s.add(f'<rect x="{gx - 1.5}" y="{gc - 3 * K + n * 2 * K - 1.5}" width="3" height="3" fill="#B58A2A"/>')
        for n, lab in enumerate(['I2C SCL', 'I2C SDA', '3V3', 'GND']):
            s.text(gx + 4 * K, gc - 3 * K + n * 2 * K + 2.5, lab, 5.6, SANS, SILK, weight='700')
        grove_out.append((X0 + bw, gc))
    # J302 JST SH (Opta, unused here)
    jx, jy = P(154.78, 105.23)
    s.add(f'<rect x="{jx - 4 * K}" y="{jy - 2 * K}" width="{8 * K}" height="{4 * K}" rx="1" fill="#F2EFE8"/>')
    # LEDs
    for lx, col in [(136.23, '#E0A43A'), (148.77, '#53B07A')]:
        x_, y_ = P(lx, 141.51)
        s.add(f'<rect x="{x_ - 2.4}" y="{y_ - 4.5}" width="4.8" height="9" rx="1" fill="{col}"/>')
    # silk: PORTENTA knockout, logo, name
    kx, ky = P(157.33, 122.83)
    s.add(f'<g transform="translate({kx},{ky}) rotate(90)">'
          f'<rect x="-30" y="-7" width="60" height="12" fill="{SILK}"/>'
          f'<text x="0" y="2.6" font-family="{SANS}" font-size="8" font-weight="700" fill="{MASK}" '
          f'text-anchor="middle" letter-spacing="1">PORTENTA</text></g>')
    cat(s, *P(116.5, 121.5), 9 * K, MASK)
    s.text(P(116.5, 128.6)[0], P(116.5, 128.6)[1], 'EX LIBRIS', 7, SERIF, SILK, 'middle', spacing=1.5)
    s.text(P(116.5, 131.4)[0], P(116.5, 131.4)[1], 'REV 1.0', 5.5, MONO, SILK, 'middle')
    return (ux, uy), grove_out[1]


# --------------------------------------------- Portenta Machine Control
def machine_control(s, x, y):
    w, h = 170 * K, 90 * K
    s.add(f'<rect x="{x + 6}" y="{y + 8}" width="{w}" height="{h}" rx="8" fill="{TINTA}" opacity=".12"/>')
    s.add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="#3B3A36"/>')
    s.add(f'<rect x="{x + 10}" y="{y + 48}" width="{w - 20}" height="{h - 96}" rx="4" fill="#47463F"/>')
    # pluggable terminal rows, top and bottom
    for row_y in (y + 8, y + h - 40):
        n = 0
        bx = x + 18
        for blocks in (8, 8, 6, 8):
            bw = blocks * 3.5 * K
            s.add(f'<rect x="{bx}" y="{row_y}" width="{bw}" height="32" rx="2" fill="#24231F"/>')
            for k in range(blocks):
                s.add(f'<circle cx="{bx + (k + .5) * 3.5 * K}" cy="{row_y + 12}" r="3.4" fill="#8E8B83"/>')
                s.add(f'<rect x="{bx + (k + .5) * 3.5 * K - 2}" y="{row_y + 21}" width="4" height="6" fill="#6B6860"/>')
            bx += bw + 14
            n += 1
    # Portenta H7 window + status LEDs
    s.add(f'<rect x="{x + w - 170}" y="{y + 66}" width="132" height="70" rx="4" fill="#2C2B27" '
          f'stroke="#5A5850" stroke-width="1"/>')
    s.text(x + w - 104, y + 105, 'PORTENTA H7', 9, MONO, '#9C998F', 'middle', '700', 1.5)
    for i in range(5):
        s.add(f'<circle cx="{x + w - 150 + i * 14}" cy="{y + 150}" r="3" fill="{["#53B07A", "#53B07A", "#E0A43A", "#5A5850", "#5A5850"][i]}"/>')
    s.text(x + 26, y + 80, 'Machine Control', 18, SERIF, '#D9D5CB')
    s.text(x + 26, y + 98, 'runs the machine', 11, SANS, '#9C998F')
    # Grove J17 on the front, left side
    gx, gy = x + 40, y + 130
    s.add(f'<rect x="{gx - 3 * K}" y="{gy - 5.2 * K}" width="{6 * K}" height="{10.4 * K}" rx="1.5" fill="#F2EFE8"/>')
    s.add(f'<rect x="{gx - 1.6 * K}" y="{gy - 4.2 * K}" width="{3.2 * K}" height="{8.4 * K}" rx="1" fill="#CFCBC1"/>')
    s.text(gx + 4 * K, gy - 8, 'I2C SCL', 6, SANS, '#D9D5CB', weight='700')
    s.text(gx + 4 * K, gy + 0, 'I2C SDA', 6, SANS, '#D9D5CB', weight='700')
    s.text(gx + 4 * K, gy + 8, '3V3', 6, SANS, '#D9D5CB', weight='700')
    s.text(gx + 4 * K, gy + 16, 'GND', 6, SANS, '#D9D5CB', weight='700')
    return gx, gy


def main(out):
    s = Svg(W, H)
    L, R = 48, W - 48
    s.text(L, 62, 'RARA PLC', 30, SERIF, COBRE, spacing=8)
    s.text(L, 88, 'YOUR PHONE · EX LIBRIS · YOUR PLC', 12, SANS, TINTA_SUAVE, spacing=2.5)
    cat(s, R - 26, 58, 52)

    # positions
    ph_x, ph_y = 96, 170
    ex_x, ex_y = 470, 300
    mc_x, mc_y = 860, 268
    usb_end = phone(s, ph_x, ph_y)
    (ux, uy), grove_ex = exlibris(s, ex_x, ex_y)
    grove_mc = machine_control(s, mc_x, mc_y)

    # USB-C cable: phone bottom -> Ex Libris USB (goes up out of the board)
    px, py = usb_end
    s.add(f'<path d="M{px},{py + 8} C{px},{py + 90} {ux - 40},{uy + 150} {ux},{uy + 12}" fill="none" '
          f'stroke="{TINTA}" stroke-width="6" stroke-linecap="round"/>')
    s.add(f'<rect x="{px - 9}" y="{py}" width="18" height="16" rx="3" fill="{TINTA}"/>')
    s.text(px + 150, py - 10, 'USB-C · OTG', 11, MONO, TINTA_SUAVE, weight='700', spacing=1.5)
    # Grove cable: Ex Libris J301 -> Machine Control J17
    ex_gx = ex_x + (162.56 - 100) * K
    gx, gy = grove_mc
    s.add(f'<path d="M{ex_gx},{grove_ex[1] + 14} C{ex_gx + 20},{grove_ex[1] + 140} '
          f'{gx - 110},{gy + 120} {gx},{gy + 14}" fill="none" stroke="{COBRE}" stroke-width="6" '
          f'stroke-linecap="round"/>')
    s.text((ex_gx + gx) / 2 + 10, gy + 128, 'GROVE · I2C', 11, MONO, COBRE, 'middle', '700', 1.5)

    # captions
    cap_y = 690
    for x, w, num, title, line in [
            (ph_x - 20, 300, '01', 'YOUR PHONE', 'reads the record, even with the PLC off'),
            (ex_x - 10, 330, '02', 'EX LIBRIS', 'the machine’s memory, signed on-chip'),
            (mc_x, 520, '03', 'YOUR PLC', 'runs the machine, exactly as before')]:
        s.line(x, cap_y, x + w, cap_y, COBRE, 1.5)
        s.text(x, cap_y + 26, f'{num} — {title}', 13, MONO, TINTA_SUAVE, weight='700', spacing=3)
        s.text(x, cap_y + 52, line, 17, SERIF, TINTA, italic=True)
    s.text(R, H - 18, 'Illustration, approximate scale. Arduino, Portenta and Machine Control are '
           'trademarks of Arduino SA; RARA PLC is not affiliated.', 10, SANS, TINTA_SUAVE, 'end')
    s.save(out)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'docs/assets/ex-libris/hero.svg')
