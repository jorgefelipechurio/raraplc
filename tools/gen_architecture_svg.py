"""Generates docs/assets/diagrams/system-architecture.svg (theme-aware)."""
import pathlib, html
OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "assets" / "diagrams"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1600, 840
els = []

def box(x, y, w, h, title, lines=(), kind="blk"):
    els.append(f'<rect class="{kind}" x="{x}" y="{y}" width="{w}" height="{h}" rx="8"/>')
    ty = y + 26
    els.append(f'<text class="t {kind}-t" x="{x+12}" y="{ty}">{html.escape(title)}</text>')
    for i, l in enumerate(lines):
        els.append(f'<text class="s {kind}-s" x="{x+12}" y="{ty+20+i*17}">{html.escape(l)}</text>')

def group(x, y, w, h, label, kind):
    els.append(f'<rect class="{kind}" x="{x}" y="{y}" width="{w}" height="{h}" rx="14"/>')
    els.append(f'<text class="gl {kind}-l" x="{x+16}" y="{y+24}">{html.escape(label)}</text>')

def wire(d, kind="w", label=None, lx=0, ly=0, anchor="start", end=True, start=False):
    m = ' marker-end="url(#a-%s)"' % kind if end else ""
    m += ' marker-start="url(#a-%s)"' % kind if start else ""
    els.append(f'<path class="{kind}" d="{d}"{m}/>')
    if label:
        els.append(f'<text class="wl {kind}-lab" x="{lx}" y="{ly}" text-anchor="{anchor}">{html.escape(label)}</text>')

# ---- title ----
els.append('<text class="h1" x="40" y="46">RARA PLC — system architecture</text>')
els.append('<text class="h2" x="40" y="70">Main board (stage 1). Legacy plant on the left, robotics and AI on the right. The PLC itself never connects to the internet.</text>')

# ---- columns headers ----
for x, t in ((40, "PLANT / LEGACY SIDE"), (1080, "ROBOTICS + AI SIDE")):
    els.append(f'<text class="col" x="{x}" y="112">{t}</text>')

# ---- main board ----
group(440, 96, 560, 454, "RARA PLC · main board (STM32H743ZIT6, 4-layer)", "g-main")
box(460, 130, 160, 90, "24 V power chain", ("fuse · P-FET ideal diode", "TVS · CM choke", "bucks 5 V / 3.3 V · LDO"))
box(640, 130, 200, 170, "STM32H743ZIT6", ("Cortex-M7 · 480 MHz · FPU", "FreeRTOS runtime", "scan cycle", "+ execution auditor (C)", "OTA A/B banks · signed", "DFU rescue in ROM"), kind="mcu")
box(860, 130, 120, 90, "Storage", ("QSPI NOR 16 MB", "LittleFS", "FRAM · RTC"))
box(460, 230, 160, 70, "Local HMI", ("3.5\" touch · SPI", "LVGL faceplates"))
box(860, 230, 120, 70, "Diagnostics", ("fan · board NTC", "HW fast-stop"))
box(460, 320, 120, 80, "16 DI", ("opto · 4–30 V", "encoder-capable"))
box(590, 320, 120, 80, "16 DO", ("low-side 2 A", "STEP/DIR capable"))
box(720, 320, 120, 80, "8 AI", ("4–20 mA / 0–10 V", "ADC3, own ground"))
box(850, 320, 130, 80, "Temp & weight", ("2× MAX31856", "HX711 (DNP)"))
box(460, 420, 150, 80, "Ethernet", ("100BASE-T · RMII", "Modbus TCP · OPC-UA"))
box(620, 420, 110, 80, "2× RS-485", ("Modbus RTU", "2 ports"))
box(740, 420, 100, 80, "CAN FD", ("TCAN332", "CANopen-ready"))
box(850, 420, 130, 80, "USB-C", ("Cisco-style CLI", "CDC-ACM · DFU"))
els.append('<rect class="hdr" x="460" y="510" width="520" height="28" rx="6"/>')
els.append('<text class="s hdr-t" x="720" y="529" text-anchor="middle">40-pin HAT header · Raspberry Pi pinout · add-ons and the stage-2 motion HAT</text>')

# ---- motion board (stage 2, brief) ----
els.append('<rect class="g-mb" x="440" y="600" width="560" height="96" rx="14"/>')
els.append('<text class="gl g-mb-l" x="456" y="626">STAGE 2 · RARA.MB motion HAT (stacks on the header)</text>')
els.append('<text class="s" x="456" y="652">6 closed-loop stepper axes · joint gauges for cobots</text>')
els.append('<text class="s" x="456" y="672">IO-Link master for end effectors</text>')
wire("M 720 538 L 720 600", "w")
# ---- left column ----
box(40, 130, 320, 100, "Field devices", ("sensors · valves · contactors · heaters", "24 V DI/DO · 4–20 mA · 0–10 V", "thermocouples · load cells"), kind="ext")
box(40, 290, 320, 110, "Legacy plant", ("SCADA · HMI panels · old PLCs", "VFDs · meters · remote I/O", "Modbus TCP/RTU · OPC-UA · CAN"), kind="ext")
wire("M 360 180 L 420 180 L 420 360 L 460 360", "w", "field wiring", 368, 172)
wire("M 360 345 L 400 345 L 400 460 L 460 460", "w", "fieldbus", 368, 337)

# ---- right column ----
box(1080, 130, 480, 100, "Linux host (Raspberry Pi / PC)", ("micro-ROS agent → ROS 2 graph", "MoveIt · Nav2 · perception run here, not on the PLC", "the PLC is the real-time companion node"), kind="ext")
box(1080, 290, 480, 110, "Technician's device", ("RARA Bridge (PWA) · Web Serial / WebUSB", "raw CLI on one panel, Claude's reasoning on the other", "the technician runs every command — Claude only suggests"), kind="ext")
box(1080, 460, 480, 92, "Claude", ("EARS drafting · HAZOP spec audit (generator ↔ critic)", "diagnosis · commissioning · revamping"), kind="ai")
box(1080, 612, 480, 112, "Acervus — machine archive", ("one Libris per machine (repo-like, private per tenant)", "as-built · calibrations · EARS history · board threads", "fed by closed sessions, never by live telemetry", "Ex Libris: printed QR survives a dead machine"), kind="ai")
wire("M 1000 180 L 1080 180", "w", "Ethernet", 1040, 172, "middle")
wire("M 1000 345 L 1080 345", "w", "USB-C · CLI", 1040, 337, "middle")
wire("M 1320 400 L 1320 460", "net", "technician's own data link", 1330, 436, end=True, start=True)
wire("M 1320 552 L 1320 612", "net", "sessions archived on close", 1330, 588, end=True, start=True)

# ---- legend ----
ly = 772
els.append(f'<path class="w" d="M 40 {ly} L 90 {ly}"/><text class="s leg" x="100" y="{ly+5}">electrical / local link</text>')
els.append(f'<path class="net" d="M 290 {ly} L 340 {ly}"/><text class="s leg" x="350" y="{ly+5}">internet link held by the technician\'s device, never by the PLC</text>')
els.append(f'<text class="s leg" x="40" y="{ly+34}">Seed-stage reference. Counts and parts follow the KiCad schematics; RARA.MB is stage 2. Hardware CERN-OHL-S v2.</text>')

CSS = """
:root{--bg:#fbfaf7;--ink:#1d232a;--ink2:#56606b;--line:#c9cfd5;--blk:#ffffff;--main:#f1f4f6;--mb:#f6f1e8;--mbline:#c58a2c;
--mcu:#14594f;--mcut:#ffffff;--mcus:#cfe7e2;--ext:#ffffff;--ai:#e6f3f4;--ailine:#0e7a86;--wire:#46515c;--net:#0e7a86;--hdr:#1d232a;--hdrt:#f3f1ec}
@media (prefers-color-scheme:dark){:root{--bg:#0f1418;--ink:#e6eaee;--ink2:#9aa6b1;--line:#2d3742;--blk:#161d23;--main:#121a20;--mb:#1b1712;--mbline:#e2a23a;
--mcu:#1f7a6d;--mcut:#ffffff;--mcus:#cde9e3;--ext:#161d23;--ai:#0f2a2e;--ailine:#43c9d4;--wire:#9aa6b1;--net:#43c9d4;--hdr:#e6eaee;--hdrt:#0f1418}}
.bg{fill:var(--bg)}
text{font-family:'IBM Plex Sans',Inter,'Segoe UI',Helvetica,Arial,sans-serif;fill:var(--ink)}
.h1{font-size:24px;font-weight:700}.h2{font-size:13.5px;fill:var(--ink2)}
.col{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;letter-spacing:.12em;fill:var(--ink2)}
.t{font-size:14px;font-weight:600}.s{font-size:12px;fill:var(--ink2)}
.gl{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12.5px;font-weight:600}
.g-main{fill:var(--main);stroke:var(--line);stroke-width:1.5}
.g-mb{fill:var(--mb);stroke:var(--mbline);stroke-width:1.5;stroke-dasharray:6 4}.g-mb-l{fill:var(--mbline)}
.blk,.ext,.mb{fill:var(--blk);stroke:var(--line);stroke-width:1.2}.mb{stroke:var(--mbline)}
.mcu{fill:var(--mcu);stroke:none}.mcu-t{fill:var(--mcut);font-size:15px}.mcu-s{fill:var(--mcus)}
.ai{fill:var(--ai);stroke:var(--ailine);stroke-width:1.4}
.hdr{fill:var(--hdr)}.hdr-t{fill:var(--hdrt);font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:11.5px}
.w{stroke:var(--wire);stroke-width:1.6;fill:none}.net{stroke:var(--net);stroke-width:1.8;fill:none;stroke-dasharray:6 5}
.wl{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10.5px;fill:var(--ink2)}.net-lab{fill:var(--net)}
.ah-w{fill:var(--wire)}.ah-net{fill:var(--net)}.leg{font-size:12px}
"""
defs = ''.join(f'<marker id="a-{k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah-{k}" d="M0 0L10 5L0 10z"/></marker>' for k in ("w", "net"))
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" role="img" aria-label="RARA PLC system architecture">'
       f'<title>RARA PLC — system architecture</title><style>{CSS}</style><defs>{defs}</defs>'
       f'<rect class="bg" width="{W}" height="{H}"/>' + "".join(els) + "</svg>")
(OUT / "system-architecture.svg").write_text(svg)
print("ok", len(svg))
