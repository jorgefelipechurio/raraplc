/**
 * @file    rara_io.h
 * @brief   Process image and scan-cycle hooks for the RaraPLC runtime.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
#ifndef RARA_IO_H
#define RARA_IO_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint16_t di;          /* bit n = Dn            */
    uint16_t dq;          /* bit n = Yn (request)  */
    int32_t  enc[3];      /* ENC1..ENC3 counts      */
    uint32_t scan_count;
} rara_image_t;

void rara_io_init(void);
void rara_io_read_inputs(rara_image_t *img);
void rara_io_write_outputs(const rara_image_t *img);

/* User logic: compiled from the confirmed EARS spec. Weak default does nothing. */
void rara_logic_scan(rara_image_t *img);

/* Execution auditor: last check before outputs reach the pins.
 * Returns false to force all outputs off for this scan. Weak default allows. */
bool rara_auditor_check(rara_image_t *img);

#ifdef __cplusplus
}
#endif

#endif /* RARA_IO_H */
