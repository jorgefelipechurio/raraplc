/**
 * @file    rara_encoder.c
 * @brief   Quadrature encoder driver (x4 mode) for RaraPLC Rev 1.0.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
#include "rara_encoder.h"

typedef struct {
    TIM_TypeDef  *tim;
    GPIO_TypeDef *port_a; uint16_t pin_a;
    GPIO_TypeDef *port_b; uint16_t pin_b;
    uint8_t       af;
    uint8_t       is32;
    uint8_t       di_a, di_b;   /* logical terminal numbers, for debounce config */
} rara_enc_cfg_t;

static const rara_enc_cfg_t ENC_CFG[3] = {
    { TIM2, GPIOA, GPIO_PIN_15, GPIOB, GPIO_PIN_3, GPIO_AF1_TIM2, 1u, 15u, 1u },
    { TIM3, GPIOB, GPIO_PIN_4,  GPIOB, GPIO_PIN_5, GPIO_AF2_TIM3, 0u,  0u, 7u },
    { TIM4, GPIOB, GPIO_PIN_6,  GPIOB, GPIO_PIN_7, GPIO_AF2_TIM4, 0u,  5u, 6u },
};

static TIM_HandleTypeDef htim[3];
static uint16_t          last16[3];
static int32_t           pos[3];

static void enc_clocks_enable(rara_enc_id_t id)
{
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    switch (id) {
    case RARA_ENC1: __HAL_RCC_TIM2_CLK_ENABLE(); break;
    case RARA_ENC2: __HAL_RCC_TIM3_CLK_ENABLE(); break;
    case RARA_ENC3: __HAL_RCC_TIM4_CLK_ENABLE(); break;
    default: break;
    }
}

HAL_StatusTypeDef rara_encoder_init(rara_enc_id_t id, uint8_t input_filter)
{
    if ((unsigned)id >= 3u) { return HAL_ERROR; }
    const rara_enc_cfg_t *c = &ENC_CFG[id];

    enc_clocks_enable(id);

    /* PA15/PB3/PB4 leave reset as JTAG pins; the AF setting below releases them.
     * SWD (PA13/PA14) keeps working. */
    GPIO_InitTypeDef g = {0};
    g.Mode      = GPIO_MODE_AF_PP;
    g.Pull      = GPIO_NOPULL;
    g.Speed     = GPIO_SPEED_FREQ_LOW;
    g.Alternate = c->af;
    g.Pin = c->pin_a; HAL_GPIO_Init(c->port_a, &g);
    g.Pin = c->pin_b; HAL_GPIO_Init(c->port_b, &g);

    TIM_HandleTypeDef *h = &htim[id];
    h->Instance               = c->tim;
    h->Init.Prescaler         = 0u;
    h->Init.CounterMode       = TIM_COUNTERMODE_UP;
    h->Init.Period            = c->is32 ? 0xFFFFFFFFu : 0xFFFFu;
    h->Init.ClockDivision     = TIM_CLOCKDIVISION_DIV1;
    h->Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;

    TIM_Encoder_InitTypeDef e = {0};
    e.EncoderMode  = TIM_ENCODERMODE_TI12;          /* x4: both edges of A and B */
    e.IC1Polarity  = TIM_ICPOLARITY_RISING;
    e.IC1Selection = TIM_ICSELECTION_DIRECTTI;
    e.IC1Prescaler = TIM_ICPSC_DIV1;
    e.IC1Filter    = input_filter & 0x0Fu;          /* tune on the bench, start at 4-6 */
    e.IC2Polarity  = TIM_ICPOLARITY_RISING;
    e.IC2Selection = TIM_ICSELECTION_DIRECTTI;
    e.IC2Prescaler = TIM_ICPSC_DIV1;
    e.IC2Filter    = input_filter & 0x0Fu;

    if (HAL_TIM_Encoder_Init(h, &e) != HAL_OK) { return HAL_ERROR; }

    rara_encoder_reset(id);
    return HAL_TIM_Encoder_Start(h, TIM_CHANNEL_ALL);
}

void rara_encoder_update(rara_enc_id_t id)
{
    if ((unsigned)id >= 3u) { return; }
    if (ENC_CFG[id].is32) {
        pos[id] = (int32_t)__HAL_TIM_GET_COUNTER(&htim[id]);
    } else {
        uint16_t now = (uint16_t)__HAL_TIM_GET_COUNTER(&htim[id]);
        pos[id] += (int16_t)(uint16_t)(now - last16[id]);   /* signed wrap-around delta */
        last16[id] = now;
    }
}

int32_t rara_encoder_position(rara_enc_id_t id)
{
    if ((unsigned)id >= 3u) { return 0; }
    rara_encoder_update(id);
    return pos[id];
}

void rara_encoder_reset(rara_enc_id_t id)
{
    if ((unsigned)id >= 3u) { return; }
    __HAL_TIM_SET_COUNTER(&htim[id], 0u);
    last16[id] = 0u;
    pos[id]    = 0;
}
