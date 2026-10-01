/**
 * @file    rara_io.c
 * @brief   Digital I/O process image for RaraPLC Rev 1.0.
 *
 * SPDX-License-Identifier: MIT
 */
#include "rara_io.h"
#include "rara_board_pins.h"
#include "rara_encoder.h"

void rara_io_init(void)
{
    __HAL_RCC_GPIOA_CLK_ENABLE();
    __HAL_RCC_GPIOB_CLK_ENABLE();
    __HAL_RCC_GPIOD_CLK_ENABLE();
    __HAL_RCC_GPIOE_CLK_ENABLE();
    __HAL_RCC_GPIOF_CLK_ENABLE();
    __HAL_RCC_GPIOG_CLK_ENABLE();

    GPIO_InitTypeDef g = {0};

    /* Outputs first, driven low, so no channel glitches on at boot. */
    g.Mode  = GPIO_MODE_OUTPUT_PP;
    g.Pull  = GPIO_NOPULL;
    g.Speed = GPIO_SPEED_FREQ_HIGH;          /* STEP/DIR capable */
    for (unsigned i = 0; i < RARA_DO_COUNT; i++) {
        HAL_GPIO_WritePin(RARA_DO[i].port, RARA_DO[i].pin, GPIO_PIN_RESET);
        g.Pin = RARA_DO[i].pin;
        HAL_GPIO_Init(RARA_DO[i].port, &g);
    }

    /* Inputs. Encoder channels are re-configured as timer AF by rara_encoder_init(). */
    g.Mode  = GPIO_MODE_INPUT;
    g.Speed = GPIO_SPEED_FREQ_LOW;
    for (unsigned i = 0; i < RARA_DI_COUNT; i++) {
        g.Pin = RARA_DI[i].pin;
        HAL_GPIO_Init(RARA_DI[i].port, &g);
    }
}

void rara_io_read_inputs(rara_image_t *img)
{
    uint16_t di = 0u;
    for (unsigned i = 0; i < RARA_DI_COUNT; i++) {
        if (HAL_GPIO_ReadPin(RARA_DI[i].port, RARA_DI[i].pin) == GPIO_PIN_SET) {
            di |= (uint16_t)(1u << i);
        }
    }
    img->di = di;   /* TODO: per-channel debounce (3 ms default, 0 ms on encoder channels) */

    for (unsigned e = 0; e < RARA_ENC_COUNT; e++) {
        img->enc[e] = rara_encoder_position((rara_enc_id_t)e);
    }
}

void rara_io_write_outputs(const rara_image_t *img)
{
    for (unsigned i = 0; i < RARA_DO_COUNT; i++) {
        GPIO_PinState s = (img->dq & (1u << i)) ? GPIO_PIN_SET : GPIO_PIN_RESET;
        HAL_GPIO_WritePin(RARA_DO[i].port, RARA_DO[i].pin, s);
    }
}

__attribute__((weak)) void rara_logic_scan(rara_image_t *img)
{
    (void)img;
}

__attribute__((weak)) bool rara_auditor_check(rara_image_t *img)
{
    (void)img;
    return true;
}
