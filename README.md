![Rara Cat, mascota de RaraPLC](docs/assets/rara_cat_logo.svg)

# RaraPLC

**Open source industrial PLC built on the STMicroelectronics STM32H743, with an open hardware / open source approach and AI (Claude) integrated into the workflow from day one.**

**New here?** Read [`docs/POSITIONING.md`](docs/POSITIONING.md) for the fast version: what RaraPLC actually is, how it bridges legacy PLC and robotics, and how AI works inside the project. Five-minute read, written for technical partners and evaluators.

## What is RaraPLC

RaraPLC is an open hardware and open source firmware industrial PLC, built around the STM32H743 (Arm Cortex-M7). It is designed around three goals at the same time:

**1) AI in the firmware/software stack.** Claude is used as a working part of the development pipeline: schematic/PCB review, firmware architecture, code generation and review, documentation.

**2) AI in machine commissioning and revamping.** A structured workflow for bringing RaraPLC into new machines or migrating (revamping) legacy machines running old, closed-source PLCs, with Claude assisting the integration engineer end to end.

**3) AI as the knowledge base for installed machines.** Every RaraPLC deployment becomes a documented, queryable source of truth (I/O maps, wiring, logic, history) that Claude can reason over for maintenance, diagnostics and future revamps.

## Why STM32H743

Arm Cortex-M7 core, hardware FPU, up to 2 MB flash / 1 MB RAM: enough headroom for real industrial control loops plus on-device AI inference. Backed by [Arduino_Core_STM32](https://github.com/stm32duino/Arduino_Core_STM32) and the wider STM32duino / STM32Cube ecosystem: mature, actively maintained, open tooling. Rich peripheral set (FDCAN, Ethernet, multiple ADCs/timers) suited to industrial I/O.

## Open hardware, open source

Hardware is released under CERN-OHL-S v2 (see hardware/LICENSE): strongly reciprocal, same spirit as the GPL, for hardware. Firmware is released under the MIT License (see firmware/LICENSE). Components are selected to be sourceable (LCSC part numbers documented alongside every design) and, where possible, in small/standard packages to keep the design manufacturable by small shops and hobbyists alike.

## Project status

Seed stage. This repository is the public entry point for the project: vision, architecture, roadmap, and the firmware skeleton. Hardware design files are being finalized in a private repository and will be published here as they reach a stable, reviewed state: schematics, PCB, BOM and 3D files, transparently, once fabrication-ready.

## Repository structure

firmware/ : STM32H743 firmware (HAL/Cube + Arduino_Core_STM32 compatible)
hardware/ : Schematics, PCB, BOM, 3D files (CERN-OHL-S v2)
docs/ : Architecture, roadmap, design decisions, brand assets
.github/ : Issue/PR templates, community health files

## Roadmap (high level)

Near-term priorities: publish the v0.1 hardware design (schematics and BOM, with LCSC part numbers); ship a firmware skeleton (HAL bring-up, RTOS choice, IEC 61131-3-inspired logic runtime); document a first revamping case study end to end (legacy machine migration); integrate with the STM32Cube / Arduino_Core_STM32 ecosystem and evaluate the ST Partner Program; and build a ROS 2 bridge for robotics/automation integration.

## Contributing

Contributions are welcome, see CONTRIBUTING.md. This project follows the Contributor Covenant (CODE_OF_CONDUCT.md).

## About

Built by [Rara Machina](https://github.com/jorgefelipechurio). RaraPLC is an independent, community-driven project and is not affiliated with or endorsed by STMicroelectronics.
