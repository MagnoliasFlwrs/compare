import type { Attribute, AttributeOption } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { pickIdString } from '../pickIdString';

export type CompareOutcome = 'left' | 'right' | 'equal' | 'none';

function optionOrder(options: AttributeOption[] | undefined, optionId: string): number | null {
    if (!optionId || !options?.length) return null;
    const found = options.find((o) => o.id === optionId);
    return found != null ? found.order : null;
}

/** Числовое «качество» значения для сравнения (больше = лучше внутри шкалы). */
export function comparableScore(
    attribute: Attribute,
    value: EntityAttributeValue | undefined,
): number | null {
    if (!value || attribute.advantageType === 'NONE') return null;

    switch (attribute.type) {
        case 'NUMBER':
            return value.valueNumber ?? null;
        case 'BOOLEAN':
            if (value.valueBoolean == null) return null;
            return value.valueBoolean ? 1 : 0;
        case 'SELECT': {
            const id = pickIdString(value.optionId);
            return optionOrder(attribute.options, id);
        }
        case 'RANGE': {
            const from = value.rangeFrom;
            const to = value.rangeTo;
            if (from == null && to == null) return null;
            if (from != null && to != null) return (from + to) / 2;
            return from ?? to ?? null;
        }
        case 'TEXT':
            return value.valueText?.trim() ? 1 : null;
        default:
            return null;
    }
}

export function compareValues(
    attribute: Attribute,
    left: EntityAttributeValue | undefined,
    right: EntityAttributeValue | undefined,
): CompareOutcome {
    if (attribute.advantageType === 'NONE') return 'none';

    const leftScore = comparableScore(attribute, left);
    const rightScore = comparableScore(attribute, right);

    if (leftScore == null && rightScore == null) return 'none';
    if (leftScore == null) return 'right';
    if (rightScore == null) return 'left';
    if (leftScore === rightScore) return 'equal';

    const leftBetter =
        attribute.advantageType === 'LESS_IS_BETTER'
            ? leftScore < rightScore
            : leftScore > rightScore;

    return leftBetter ? 'left' : 'right';
}

/** Первое значение лучше второго по правилам атрибута. */
export function valueBeats(
    attribute: Attribute,
    value: EntityAttributeValue | undefined,
    other: EntityAttributeValue | undefined,
): boolean {
    return compareValues(attribute, value, other) === 'left';
}

/** Ячейка лучше всех значений с другой стороны. */
export function cellBeatsOpponents(
    attribute: Attribute,
    cellValue: EntityAttributeValue | undefined,
    opponentValues: (EntityAttributeValue | undefined)[],
): boolean {
    if (attribute.advantageType === 'NONE' || !cellValue) return false;
    const opponents = opponentValues.filter(Boolean) as EntityAttributeValue[];
    if (opponents.length === 0) return false;
    return opponents.every((opp) => valueBeats(attribute, cellValue, opp));
}
