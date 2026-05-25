import type { Trim } from '../../stores/trimsStore';

export type TrimFormValues = {
    name: string;
    order: number;
    isPublished: boolean;
};

export const TRIM_FORM_DEFAULTS = (defaultOrder = 0): TrimFormValues => ({
    name: '',
    order: defaultOrder,
    isPublished: true,
});

export function trimToFormValues(trim: Trim): TrimFormValues {
    return {
        name: trim.name,
        order: trim.order ?? 0,
        isPublished: !trim.isHidden,
    };
}

export function normalizeTrimFormValues(values: TrimFormValues): {
    name: string;
    order: number;
    isHidden: boolean;
} {
    return {
        name: values.name.trim(),
        order: Number(values.order ?? 0),
        isHidden: !values.isPublished,
    };
}
