import type { Rule } from 'antd/es/form';

/** Одна цифра после запятой/точки. */
export function oneDecimalRule(label: string): Rule {
    return {
        validator: async (_, value) => {
            if (value == null || value === '') return;
            const n = Number(value);
            if (Number.isNaN(n) || n < 0) {
                throw new Error(`${label}: укажите неотрицательное число`);
            }
            const frac = Math.round((n * 10) % 10);
            const whole = Math.floor(n * 10) / 10;
            if (Math.abs(n - whole) > 1e-9 || frac > 9) {
                throw new Error(`${label}: не более одного знака после запятой`);
            }
        },
    };
}

export const numOfGearsRules: Rule[] = [
    {
        type: 'number',
        min: 0,
        max: 99,
        message: 'От 0 до 99 (не более 2 цифр)',
    },
];

export const enginePowerRules: Rule[] = [
    { required: true, message: 'Укажите мощность' },
    { type: 'number', min: 0, message: 'Мощность не может быть отрицательной' },
];
