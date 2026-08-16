# Self-describing add-ons and LLM-synthesized drivers

First published: 2026-08-16, as a public record of this concept and its authorship by the RaraPLC project.

## The problem: barebone firmware has no driver model

RaraPLC's firmware is barebone: FreeRTOS and nothing else. There is no Linux kernel underneath it, no device tree, no kernel module loader, no sysfs, no dynamic driver framework of any kind. That is a deliberate choice (see docs/WHY_STM32H7.md): it keeps the firmware small, deterministic, and free of an operating system layer that a plant engineer would need to learn, compile, and maintain.

The tradeoff is that barebone firmware has historically meant every new add-on board needs a driver written by hand, in C, against the specific MCU peripherals it uses, by someone who already knows the part's datasheet and the project's codebase. That is the opposite of Linux, where a new peripheral driver is written once against a stable, documented kernel driver model, such as device tree bindings, subsystem APIs, and sysfs conventions, and is loaded at runtime without touching the rest of the OS.

## The mechanism: self-describing add-ons

Each RaraPLC add-on board carries a self-descriptor: a structured, machine- and LLM-readable specification of what the board is and how to talk to it. The descriptor covers the communication interface such as I2C, SPI, or UART address and timing, the register or command map, the electrical and timing constraints, and the intended behavior of the board in plain language, not just register tables.

The descriptor lives on the add-on itself, for example in a small EEPROM or in the flash of an onboard microcontroller, so a board is self-identifying the moment it is connected. RaraPLC does not need to already know about that add-on in advance to read what it is.

## RaraClaude: the agent that writes the driver

We call the role that reads a self-descriptor and writes the corresponding driver source code RaraClaude. When a new add-on is registered, whether during commissioning of a machine or bring-up of a new board on the bench, RaraClaude reads the descriptor and generates the driver: the register access code, the initialization sequence, and the integration points into the RaraPLC control loop, compiled directly into the barebone firmware image.

This is a deliberate substitute for a runtime driver-loading model. Because there is no OS to load a compiled module into, the driver is synthesized and compiled into the firmware at commissioning or build time, by an LLM reading the add-on's own self-description, instead of by a human engineer reading a datasheet and hand-writing register access code, and instead of by an OS-level driver framework loading a pre-built module.

## Why this differs from a Linux driver

A Linux driver is written once against a stable, documented, OS-level abstraction: the kernel's driver model, device tree bindings, subsystem APIs. The OS then loads it at runtime, and the driver author needs to understand Linux internals, not just the peripheral.

RaraPLC's mechanism has no OS-level abstraction to write against and nothing to load at runtime. The add-on describes itself, an LLM reads that description and writes the driver directly against the bare MCU peripherals, and the result is compiled into the firmware image itself. The self-descriptor plays the role a device tree binding plays in Linux, but the thing consuming it is an LLM synthesizing source code, not a kernel resolving a binding to an existing compiled module.

## Scope of this disclosure

This document describes: the concept of a self-descriptor carried on an add-on board for the purpose of enabling automated, LLM-driven driver synthesis targeting OS-less embedded firmware; the RaraClaude role as the agent performing that synthesis; and the distinction between this mechanism and both hand-written barebone drivers and OS-mediated, Linux-style, driver loading. It is published here, publicly and with a timestamp, as a first-mover disclosure: the intent is that this description constitute prior art, so that this mechanism cannot later be patented by a third party.

## See also

Project positioning: `docs/POSITIONING.md`. Why STM32H7 was chosen as the core: `docs/WHY_STM32H7.md`. System architecture: `docs/ARCHITECTURE.md`.
