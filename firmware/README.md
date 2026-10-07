## Firmware

STM32H743 firmware for RaraPLC.

Scope: HAL/Cube bring-up, RTOS layer, IEC 61131-3-inspired logic runtime, communication stacks (Ethernet, FDCAN), and the STM32CubeIDE / Arduino_Core_STM32 compatible build setup.

Status: seed stage. First skeleton published (C, HAL, FreeRTOS):

| File | What it is |
|---|---|
| `include/rara_board_pins.h`, `src/rara_board_pins.c` | Terminal -> MCU pin map for the Rev 1.0 main board (D0-D15, Y0-Y15, W0-W7) |
| `include/rara_encoder.h`, `src/rara_encoder.c` | 3 hardware quadrature encoders on the DI (TIM2 32-bit, TIM3/TIM4 extended to 32 bits) |
| `include/rara_io.h`, `src/rara_io.c` | Process image, output init (low at boot), logic and auditor hooks |
| `src/main.c` | HAL bring-up and the FreeRTOS scan task (read -> logic -> auditor -> write) |

Clock tree, peripheral init and the FreeRTOS port come from STM32CubeMX / STM32CubeH7.

License: Mozilla Public License 2.0 (see LICENSE in this folder). File-level copyleft: if you distribute modified versions of these files, publish those changes; your own new files (machine logic, add-on modules) can stay under any license.
