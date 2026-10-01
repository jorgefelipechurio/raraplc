# Architecture

High-level design of RaraPLC: what is on each board, how the boards connect, and where the AI sits. Part numbers and pin assignments live in the KiCad schematics; this page explains the shape of the system and the reasons behind it.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/system-architecture-dark.png">
  <img alt="RaraPLC system architecture: main board, legacy plant on the left, ROS 2 host, technician device, Claude and Acervus on the right" src="assets/diagrams/system-architecture-light.png">
</picture>

Editable source: [`assets/diagrams/system-architecture.svg`](assets/diagrams/system-architecture.svg).

## The three sides

**Plant / legacy side (left).** Field wiring and fieldbuses that a plant already has: 24 V digital I/O, 4–20 mA and 0–10 V analog, Modbus RTU/TCP, OPC-UA, CAN. RaraPLC has to fit into this world without a gateway in between.

**The PLC (centre).** One main board (stage 1). A motion HAT stacked on top is stage 2. Hard real-time logic runs here and only here.

**Robotics + AI side (right).** A Linux host runs the heavy ROS 2 stack (MoveIt, Nav2, perception) and talks to the PLC through micro-ROS. The AI layer never touches the PLC directly: it reaches the board only through a technician's device, and keeps its memory in Acervus, a static per-machine archive.

## Main board

| Block | What it is | Why |
|---|---|---|
| MCU | STM32H743ZIT6 (LQFP-144), Cortex-M7 480 MHz, FPU | The 144-pin package frees ports F/G: all 8 analog inputs go to ADC3 on port F, physically away from Ethernet RMII and SPI noise. Same chip as the Nucleo-H743ZI used for Prototype 0. Full rationale: [`WHY_STM32H7.md`](WHY_STM32H7.md) |
| Power | 24 V input with fuse, P-FET ideal diode, TVS and common-mode choke → 5 V buck → 3.3 V buck, plus a separate LDO for the analog reference | Reverse polarity and surges are normal in a cabinet; the analog domain gets its own clean rail |
| Digital inputs | 16 DI, opto-isolated (TLP2361), 4–30 V with a constant-current LED drive, low threshold (~3 V), firmware debounce (3 ms, or 0 ms for encoder channels) | Isolation plus compatibility with 5 V TTL/NPN encoders: any input can count pulses |
| Digital outputs | 16 DO, low-side 2 A, two independent V-rails, flyback + TVS per channel, readback of output and rail voltage; fast enough (~60 ns switching) to drive STEP/DIR of external stepper drivers | Valves, contactors and open-loop stepper axes from the same outputs; every channel protected and diagnosable |
| Analog inputs | 8 AI, 4–20 mA / 0–10 V per channel, PTC + burden + clamp | Mode selectable per channel; protected against miswiring |
| Temp & weight | 2× MAX31856 thermocouple + HX711 load cell, footprints left unpopulated (DNP) | Populate only if the machine needs it; reuses header resources so a future HAT can take over |
| Storage | QSPI NOR 16 MB (LittleFS), FRAM, RTC with rechargeable backup cell | Programs and config survive power loss; retained variables without wear-out |
| Comms | Ethernet 100BASE-T (Modbus TCP, OPC-UA, micro-ROS), 2× RS-485 (Modbus RTU), CAN FD, USB-C (CLI + DFU) | Speak to old and new equipment on the same board |
| Local HMI | 3.5" SPI touch display, LVGL faceplates | Operators see the machine state without a laptop |
| Expansion | 40-pin HAT header, Raspberry Pi pinout | Stack RaraPLC boards, or use the add-ons on a plain Raspberry Pi |

### Firmware shape

Barebone FreeRTOS, no OS layer above it. The runtime runs a deterministic scan cycle, and every output passes through an **execution auditor** written in plain C (range, rate limit, interlocks) before it reaches a pin. New logic is loaded into the inactive flash bank, signed, self-tested at boot and rolled back automatically if the self-test fails (A/B OTA). The ROM DFU bootloader stays reachable over USB-C as a last-resort recovery path, so the board cannot be bricked by a bad image.

## Stage 2: RARA.MB motion HAT

The second stage of the project is a HAT that stacks on the 40-pin header to drive six closed-loop stepper axes, read joint gauges for cobots, and control end effectors over IO-Link. The current focus is the main board; RARA.MB will be documented once the PLC is up and running.

## How the boards identify themselves

Every add-on describes itself so the runtime, and an LLM, can tell what is attached before enabling any driver. A board that is not recognized stays disabled and is reported on the CLI and the display. See [`SELF_DESCRIBING_ADDONS.md`](SELF_DESCRIBING_ADDONS.md).

## Where the AI sits

- **Writing logic:** a technician describes intent in plain language; Claude drafts EARS requirements; a separate critic audits them with HAZOP guide words; only then is the confirmed spec compiled into data for the fixed C runtime. The model never writes C that runs in the control loop. See [`AI_WORKFLOW.md`](AI_WORKFLOW.md).
- **Live diagnosis:** RARA Bridge, a local app on the technician's laptop or phone, connected to the board by USB. See [`SUPPORT_BRIDGE.md`](SUPPORT_BRIDGE.md).
- **Memory:** Acervus, one repo-like archive per machine, fed by closed sessions. See [`ACERVUS.md`](ACERVUS.md).

## Open hardware / open source boundary

Hardware (schematics, PCB, BOM, 3D files) is licensed under CERN-OHL-S v2. Firmware is licensed under MIT. The two live in separate folders with separate LICENSE files so each can be reused under its own terms.
