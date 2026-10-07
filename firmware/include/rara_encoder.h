/**
 * @file    rara_encoder.h
 * @brief   Hardware quadrature encoders on the digital inputs (TIM2/TIM3/TIM4).
 *
 * ENC1: D15 (A) + D1 (B) -> TIM2, 32-bit
 * ENC2: D0  (A) + D7 (B) -> TIM3, 16-bit, extended to 32 bits in software
 * ENC3: D5  (A) + D6 (B) -> TIM4, 16-bit, extended to 32 bits in software
 *
 * Encoder channels need the DI software debounce set to 0 ms.
 * While ENC1 is active, SWO on the STDC14 connector is not available (PB3).
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
#ifndef RARA_ENCODER_H
#define RARA_ENCODER_H

#include <stdint.h>
#include "stm32h7xx_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef enum { RARA_ENC1 = 0, RARA_ENC2, RARA_ENC3 } rara_enc_id_t;

HAL_StatusTypeDef rara_encoder_init(rara_enc_id_t id, uint8_t input_filter);

/* Call periodically, at least once per 32768 counts on 16-bit timers. */
void    rara_encoder_update(rara_enc_id_t id);

int32_t rara_encoder_position(rara_enc_id_t id);
void    rara_encoder_reset(rara_enc_id_t id);

#ifdef __cplusplus
}
#endif

#endif /* RARA_ENCODER_H */
