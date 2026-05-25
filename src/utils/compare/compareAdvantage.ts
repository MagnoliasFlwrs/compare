/**
 * Сравнение значений атрибутов для фильтра «оставить преимущества».
 *
 * Типы преимущества (advantageType):
 * - MORE_IS_BETTER — число/диапазон/boolean: больше score лучше;
 * - LESS_IS_BETTER — меньше score лучше (разгон, расход);
 * - ENUM_ORDER — только смысл для SELECT: score = order варианта, больший order = «последний» = лучше;
 * - NONE — сравнение отключено.
 */
import type { AdvantageType, Attribute, AttributeOption } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { pickIdString } from '../pickIdString';

export type CompareOutcome = 'left' | 'right' | 'equal' | 'none';

function optionOrder(options: AttributeOption[] | undefined, optionId: string): number | null {
    if (!optionId || !options?.length) return null;
    const found = options.find((o) => o.id === optionId);
    return found != null ? found.order : null;
}

/** Левое значение строго лучше правого при заданных score и типе преимущества. */
function leftScoreBeatsRight(
    advantageType: AdvantageType,
    leftScore: number,
    rightScore: number,
): boolean {
    switch (advantageType) {
        case 'LESS_IS_BETTER':
            return leftScore < rightScore;
        case 'MORE_IS_BETTER':
            return leftScore > rightScore;
        case 'ENUM_ORDER':
            // SELECT: больший order варианта = «последний» = лучше; для чисел — как MORE_IS_BETTER.
            return leftScore > rightScore;
        case 'NONE':
        default:
            return false;
    }
}

/**
 * Числовая шкала для сравнения.
 * SELECT + ENUM_ORDER: order выбранного варианта (0 … n, последний = лучший).
 */
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
            // В справочнике для SELECT — ENUM_ORDER; старые записи с MORE/LESS тоже сравниваем по order.
            if (
                attribute.advantageType !== 'ENUM_ORDER' &&
                attribute.advantageType !== 'MORE_IS_BETTER' &&
                attribute.advantageType !== 'LESS_IS_BETTER'
            ) {
                return null;
            }
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

    const leftBetter = leftScoreBeatsRight(attribute.advantageType, leftScore, rightScore);

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
