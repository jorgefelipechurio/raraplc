# RaraPLC positioning

This is the fast path into what RaraPLC actually is. Five minutes, written for engineers and technical partners evaluating the project.

## Bridge between legacy PLC and robotics

Industrial plants speak IEC 61131-3: ladder, structured text, function blocks, deterministic scan cycles. Robotics speaks ROS 2: nodes, topics, real-time middleware, motion planning. Today those two worlds are usually connected through a gateway, a translator box, or a custom integration that nobody fully documents.

RaraPLC is designed to speak both natively, on the same board. It runs a classic, deterministic control loop for the machine side, and exposes a ROS 2 interface for the robotics side, without an intermediate protocol converter. That makes it a bridge, not just a controller: a single node that a plant engineer and a robotics engineer can both work with directly.

## AI on the loop

AI on the loop is the core idea of the project: Claude is not a chatbot bolted onto the documentation, it is a working part of the engineering loop itself, at three points.

**Commissioning.** When RaraPLC goes into a new machine, whether a new build or a revamp of an old, closed-source PLC, Claude assists end to end: I/O mapping, wiring verification, initial logic scaffolding, and documentation of what was actually installed.

**Debug.** When something breaks, Claude reads traces, logs, and fault codes alongside the engineer, and helps narrow down root cause instead of leaving that entirely to tribal knowledge.

**Control logic development.** Claude participates directly in writing and reviewing the control logic itself, from schematic and PCB review through firmware architecture to the IEC 61131-3-inspired logic that runs on the PLC.

The goal is not automation without a human. It is an engineer working with an AI copilot that has full context on the machine, instead of starting from zero every time.

## An ecosystem, not a board

RaraPLC is not one PCB, or even two once the motion add-on ships. The hardware is the entry point, not the product. The actual project is the combination of open hardware, open firmware, the AI layer that sits on top of both, and the workflows that connect them: commissioning, debugging, control logic development, and documentation.

Inside that ecosystem, AI is the sherpa. It is what a new contributor, a plant engineer doing a revamp, or a partner evaluating the project talks to first, and it is what keeps the community supported as it grows, rather than a static set of files that quietly go stale.

## Technical specification, short form

**Bridges and protocols:** ROS 2, OPC-UA, Modbus, CAN, multiprotocol Ethernet.

**HMI and motion:** built-in 3.5 inch resistive touch display, three encoders, closed-loop stepper control.

**Compute:** STM32H7xx, with headroom to run micro-ROS and an OPC-UA stack alongside the control logic itself.

**Compatibility:** Beremiz graphical editor, OpenPLC.

**Firmware:** barebone, FreeRTOS only, no extra OS layers.

## See also

Project overview and repository structure: `README.md`. Roadmap: `docs/ROADMAP.md`. System architecture: `docs/ARCHITECTURE.md`. How to contribute: `CONTRIBUTING.md`.
 Why STM32H7 was chosen as the core: [`docs/WHY_STM32H7.md`](docs/WHY_STM32H7.md).
 Self-describing add-ons and LLM-synthesized drivers: [`docs/SELF_DESCRIBING_ADDONS.md`](docs/SELF_DESCRIBING_ADDONS.md).
