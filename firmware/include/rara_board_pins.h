/**
 * @file    rara_board_pins.h
 * @brief   RaraPLC main board Rev 1.0: field terminal -> STM32H743ZIT6 pin map.
 *
 * Source of truth: PCB nets of RARAPLC_1.0.kicad_pcb, traced pad by pad from each
 * terminal to the MCU pin (numbering of 2026-10-01). Each terminal block reads
 * right-to-left, in increasing order, when the board is seen from the front.
 *
 * SPDX-License-Identifier: MIT
 */
#ifndef RARA_BOARD_PINS_H
#define RARA_BOARD_PINS_H

#include "stm32h7xx_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    GPIO_TypeDef *port;
    uint16_t      pin;
} rara_pin_t;

#define RARA_DI_COUNT  16u
#define RARA_DO_COUNT  16u
#define RARA_AI_COUNT   8u
#define RARA_ENC_COUNT  3u

extern const rara_pin_t RARA_DI[RARA_DI_COUNT];

extern const rara_pin_t RARA_DO[RARA_DO_COUNT];

extern const rara_pin_t RARA_AI[RARA_AI_COUNT];

#ifdef __cplusplus
}
#endif

#endif /* RARA_BOARD_PINS_H */
