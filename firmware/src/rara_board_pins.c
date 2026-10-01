/**
 * @file    rara_board_pins.c
 * @brief   RaraPLC main board Rev 1.0 pin tables (see rara_board_pins.h).
 *
 * SPDX-License-Identifier: MIT
 */
#include "rara_board_pins.h"

/* Digital inputs D0..D15 (TLP2361 opto, 4-30 V). */
const rara_pin_t RARA_DI[RARA_DI_COUNT] = {
    { GPIOB, GPIO_PIN_4  },  /* D0  - TIM3_CH1, ENC2 A          */
    { GPIOB, GPIO_PIN_3  },  /* D1  - TIM2_CH2, ENC1 B (via R107, shares SWO) */
    { GPIOE, GPIO_PIN_5  },  /* D2  */
    { GPIOG, GPIO_PIN_12 },  /* D3  */
    { GPIOG, GPIO_PIN_10 },  /* D4  */
    { GPIOB, GPIO_PIN_6  },  /* D5  - TIM4_CH1, ENC3 A          */
    { GPIOB, GPIO_PIN_7  },  /* D6  - TIM4_CH2, ENC3 B          */
    { GPIOB, GPIO_PIN_5  },  /* D7  - TIM3_CH2, ENC2 B          */
    { GPIOE, GPIO_PIN_3  },  /* D8  */
    { GPIOE, GPIO_PIN_0  },  /* D9  */
    { GPIOD, GPIO_PIN_15 },  /* D10 */
    { GPIOG, GPIO_PIN_8  },  /* D11 */
    { GPIOD, GPIO_PIN_14 },  /* D12 */
    { GPIOE, GPIO_PIN_10 },  /* D13 */
    { GPIOE, GPIO_PIN_11 },  /* D14 */
    { GPIOA, GPIO_PIN_15 },  /* D15 - TIM2_CH1, ENC1 A          */
};

/* Digital outputs Y0..Y15 (low-side 2 A, STEP/DIR capable). */
const rara_pin_t RARA_DO[RARA_DO_COUNT] = {
    { GPIOF, GPIO_PIN_12 },  /* Y0  */
    { GPIOG, GPIO_PIN_7  },  /* Y1  */
    { GPIOG, GPIO_PIN_6  },  /* Y2  */
    { GPIOG, GPIO_PIN_5  },  /* Y3  */
    { GPIOB, GPIO_PIN_8  },  /* Y4  */
    { GPIOF, GPIO_PIN_2  },  /* Y5  */
    { GPIOF, GPIO_PIN_1  },  /* Y6  */
    { GPIOF, GPIO_PIN_0  },  /* Y7  */
    { GPIOG, GPIO_PIN_15 },  /* Y8  */
    { GPIOF, GPIO_PIN_13 },  /* Y9  */
    { GPIOG, GPIO_PIN_4  },  /* Y10 */
    { GPIOF, GPIO_PIN_11 },  /* Y11 */
    { GPIOG, GPIO_PIN_2  },  /* Y12 */
    { GPIOG, GPIO_PIN_3  },  /* Y13 */
    { GPIOG, GPIO_PIN_1  },  /* Y14 */
    { GPIOG, GPIO_PIN_0  },  /* Y15 */
};

/* Analog inputs W0..W7 (ADC3, port F). ADC3 channel numbers come from CubeMX. */
const rara_pin_t RARA_AI[RARA_AI_COUNT] = {
    { GPIOF, GPIO_PIN_9  },  /* W0 */
    { GPIOF, GPIO_PIN_10 },  /* W1 */
    { GPIOF, GPIO_PIN_5  },  /* W2 */
    { GPIOF, GPIO_PIN_6  },  /* W3 */
    { GPIOF, GPIO_PIN_8  },  /* W4 */
    { GPIOF, GPIO_PIN_7  },  /* W5 */
    { GPIOF, GPIO_PIN_3  },  /* W6 */
    { GPIOF, GPIO_PIN_4  },  /* W7 */
};

