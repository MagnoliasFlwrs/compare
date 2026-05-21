/** Встроенные поля specification (длина, бак, кузов…) для строк «базовых характеристик». */
import type { AdvantageType } from '../../types/attributes';
import type { Specification } from '../../stores/specificationStore';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { displayNum, resolveReferenceLabel } from '../../components/generationOptions/referenceUtils';

export type SpecBuiltInFieldKey =
    | 'length'
    | 'width'
    | 'height'
    | 'wheelbase'
    | 'clearance'
    | 'tank'
    | 'trunkStandardVolume'
    | 'trunkMaximumVolume'
    | 'bodyType'
    | 'country'
    | 'warranty';

export type SpecBuiltInFieldDef = {
    key: SpecBuiltInFieldKey;
    label: string;
    advantageType: AdvantageType;
};

/** Встроенные поля specification — строки таблицы при включённых базовых характеристиках. */
export const SPEC_BUILTIN_FIELDS: SpecBuiltInFieldDef[] = [
    { key: 'length', label: 'Длина', advantageType: 'NONE' },
    { key: 'width', label: 'Ширина', advantageType: 'NONE' },
    { key: 'height', label: 'Высота', advantageType: 'NONE' },
    { key: 'wheelbase', label: 'Колёсная база', advantageType: 'NONE' },
    { key: 'clearance', label: 'Клиренс', advantageType: 'NONE' },
    { key: 'tank', label: 'Бак', advantageType: 'MORE_IS_BETTER' },
    { key: 'trunkStandardVolume', label: 'Багажник', advantageType: 'MORE_IS_BETTER' },
    { key: 'trunkMaximumVolume', label: 'Багажник, max', advantageType: 'MORE_IS_BETTER' },
    { key: 'bodyType', label: 'Тип кузова', advantageType: 'NONE' },
    { key: 'country', label: 'Производство', advantageType: 'NONE' },
    { key: 'warranty', label: 'Гарантия', advantageType: 'NONE' },
];

export function specBuiltInRowKey(fieldKey: SpecBuiltInFieldKey): string {
    return `base-field:${fieldKey}`;
}

export type SpecFieldRefs = {
    countryNameById: Map<string, string>;
    bodyTypeNameById: Map<string, string>;
};

export function formatSpecBuiltInDisplay(
    spec: Specification,
    fieldKey: SpecBuiltInFieldKey,
    refs: SpecFieldRefs,
): string {
    switch (fieldKey) {
        case 'length':
            return displayNum(spec.length);
        case 'width':
            return displayNum(spec.width);
        case 'height':
            return displayNum(spec.height);
        case 'wheelbase':
            return displayNum(spec.wheelbase);
        case 'clearance':
            return displayNum(spec.clearance);
        case 'tank':
            return displayNum(spec.tank);
        case 'trunkStandardVolume':
            return displayNum(spec.trunkStandardVolume);
        case 'trunkMaximumVolume':
            return displayNum(spec.trunkMaximumVolume);
        case 'bodyType':
            return resolveReferenceLabel(spec.bodyTypeId, refs.bodyTypeNameById);
        case 'country':
            return resolveReferenceLabel(spec.countryId, refs.countryNameById);
        case 'warranty':
            return spec.warranty?.trim() || '—';
        default:
            return '—';
    }
}

/** Значение для сравнения преимуществ (только числовые поля). */
export function specBuiltInComparableValue(
    spec: Specification,
    fieldKey: SpecBuiltInFieldKey,
): EntityAttributeValue | undefined {
    const numKeys: SpecBuiltInFieldKey[] = [
        'length',
        'width',
        'height',
        'wheelbase',
        'clearance',
        'tank',
        'trunkStandardVolume',
        'trunkMaximumVolume',
    ];
    if (!numKeys.includes(fieldKey)) return undefined;
    const raw = spec[fieldKey as keyof Specification];
    if (typeof raw !== 'number') return undefined;
    return { valueNumber: raw };
}

export function findSpecBuiltInField(
    key: SpecBuiltInFieldKey,
): SpecBuiltInFieldDef | undefined {
    return SPEC_BUILTIN_FIELDS.find((f) => f.key === key);
}
