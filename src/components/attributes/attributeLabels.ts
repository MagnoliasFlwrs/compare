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
    ENUM_ORDER: 'По порядку вариантов (Последний = лучший)',
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

const NUMERIC_ADVANTAGE_TYPES: AdvantageType[] = [
    'MORE_IS_BETTER',
    'LESS_IS_BETTER',
    'NONE',
];

const SELECT_ADVANTAGE_TYPES: AdvantageType[] = ['ENUM_ORDER', 'NONE'];

/** Варианты «тип преимущества» в форме в зависимости от типа данных атрибута. */
export function advantageOptionsForAttributeType(type: AttributeType | undefined) {
    const keys = type === 'SELECT' ? SELECT_ADVANTAGE_TYPES : NUMERIC_ADVANTAGE_TYPES;
    return keys.map((value) => ({
        value,
        label: ADVANTAGE_LABELS[value],
    }));
}

/** Для SELECT в справочнике допустимы только ENUM_ORDER и NONE. */
export function normalizeAdvantageTypeForAttribute(
    type: AttributeType,
    advantageType: AdvantageType,
): AdvantageType {
    if (type !== 'SELECT') {
        return advantageType === 'ENUM_ORDER' ? 'MORE_IS_BETTER' : advantageType;
    }
    if (advantageType === 'MORE_IS_BETTER' || advantageType === 'LESS_IS_BETTER') {
        return 'ENUM_ORDER';
    }
    return advantageType;
}
