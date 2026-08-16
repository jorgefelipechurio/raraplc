## Architecture

High-level design decisions for RaraPLC. This document will grow as the hardware and firmware mature.

### Core

STM32H743 (Arm Cortex-M7, up to 480 MHz, hardware FPU). Chosen for the combination of raw performance headroom (real-time control loops plus room for on-device AI inference), a mature open toolchain (STM32Cube, Arduino_Core_STM32), and a rich peripheral set (FDCAN, Ethernet, multiple ADCs and timers) suited to industrial I/O.

### Software stack

Firmware builds on ST HAL/Cube and stays compatible with Arduino_Core_STM32, so the same hardware can be programmed through either the vendor toolchain or the open Arduino-style ecosystem. The control logic layer is inspired by IEC 61131-3 concepts (the standard PLC programming model), adapted to run on top of an RTOS.

### AI-assisted workflow

Claude is treated as part of the engineering workflow, not an add-on: reviewing schematics and PCB layout, assisting firmware architecture and code review, and later, once machines are deployed, reasoning over documented I/O maps and wiring to support diagnostics and revamping.

### Open hardware / open source boundary

Hardware (schematics, PCB, BOM, 3D files) is licensed under CERN-OHL-S v2. Firmware is licensed under MIT. The two live in separate folders with separate LICENSE files so each can be reused independently under its own terms.
