import type {
    AdvantageType,
    AttributeCategory,
    AttributeType,
} from '../../types/attributes';

export const CATEGORY_LABELS: Record<AttributeCategory, string> = {
    TRIM: 'Комплектации',
    SPECIFICATION: 'Базовые характеристики',
    POWERTRAIN: 'Силовые агрегаты',
};

export const TYPE_LABELS: Record<AttributeType, string> = {
    TEXT: 'Свободный ввод',
    NUMBER: 'Число',
    BOOLEAN: 'Да / нет',
    SELECT: 'Выбор из значений',
    RANGE: 'От / до',
};

export const ADVANTAGE_LABELS: Record<AdvantageType, string> = {
    MORE_IS_BETTER: 'Больше — лучше',
    LESS_IS_BETTER: 'Меньше — лучше',
    ENUM_ORDER: 'По порядку вариантов (для выбора из значений)',
    NONE: 'Без преимущества',
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
}));

export const ADVANTAGE_OPTIONS = Object.entries(ADVANTAGE_LABELS).map(([value, label]) => ({
    value,
    label,
}));
