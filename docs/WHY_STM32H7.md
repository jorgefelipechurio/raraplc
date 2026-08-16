# Why STM32H7 is the core

RaraPLC could have been built on a cheaper or more popular chip. This is the reasoning for why it wasn't.

## Real-time determinism, not just speed

The Cortex-M7 core runs up to 480 MHz, with tightly coupled memory (ITCM/DTCM) and a hardware FPU. The control loop that runs the actual machine logic executes deterministically out of tightly coupled memory, so networking, protocol stacks, and whatever else is running elsewhere on the chip cannot introduce jitter into the scan cycle. For an IEC 61131-3-style PLC, that determinism is the requirement, not a nice-to-have.

## Headroom for a stack, not just a loop

RaraPLC does not run embedded Linux. It runs FreeRTOS, barebone, and still needs to fit micro-ROS, an OPC-UA stack, Modbus, CAN, and multiprotocol Ethernet next to the control logic itself. That only works with real headroom: up to 2 MB of flash and roughly 1 MB of on-chip RAM, split across ITCM, DTCM, AXI SRAM, and multiple SRAM banks. A Cortex-M4-class part runs out of that headroom the moment a second protocol stack is added; STM32H7 does not.

## Peripherals that match the I/O surface

Two FDCAN controllers for CAN FD field buses, a native Ethernet MAC for OPC-UA and multiprotocol Ethernet, timers with hardware encoder interfaces for the three closed-loop stepper axes, enough high-resolution ADC channels for analog I/O, and USB, SPI, and parallel/FMC interfaces to drive the 3.5 inch resistive touch HMI without an external display controller. The chip's peripheral set matches RaraPLC's I/O list directly, not the other way around.

## Ecosystem and long-term supply

STM32Cube HAL and STM32CubeMX give a mature, vendor-maintained base to build on; Arduino_Core_STM32 gives the project a second, more accessible entry point for contributors who are not full-time firmware engineers. STMicroelectronics also ships extended-temperature and long-lifecycle variants of the H7 family, which matters for a board meant to sit inside industrial machines for a decade, not a hobbyist project with a two-year horizon.

## What we ruled out

An ESP32-class part has WiFi and Bluetooth built in but no hardware FPU and no real determinism guarantees, which rules it out for the control loop itself. A Cortex-M4 part such as STM32F4 has the determinism but not the RAM or flash headroom to run micro-ROS, OPC-UA, and CAN/Ethernet stacks side by side with control logic. A Linux-capable SoC would make micro-ROS and OPC-UA trivial, but drags in boot time, storage, and a non-deterministic scheduler that a barebone FreeRTOS target avoids entirely. STM32H7 is the point where all three constraints are satisfied on one chip.

## Technical specification, short form

**Core:** Arm Cortex-M7 up to 480 MHz, hardware FPU, L1 cache.

**Memory:** up to 2 MB flash, roughly 1 MB RAM across ITCM, DTCM, AXI SRAM and SRAM banks.

**Networking:** native Ethernet MAC, two FDCAN controllers, multiprotocol stack headroom for OPC-UA, Modbus, and ROS 2 / micro-ROS.

**Motion:** hardware encoder interface timers, three closed-loop stepper axes.

**Display:** enough SPI/FMC bandwidth to drive the 3.5 inch resistive touch HMI directly.

**Tooling:** STM32Cube HAL/CubeMX, Arduino_Core_STM32 compatible.

## See also

Project positioning: `docs/POSITIONING.md`. Roadmap: `docs/ROADMAP.md`. System architecture: `docs/ARCHITECTURE.md`.
