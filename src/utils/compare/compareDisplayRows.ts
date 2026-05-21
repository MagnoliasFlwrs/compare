/**
 * Построение и выравнивание строк характеристик таблицы:
 * базовые (specifications) + комплектации (trims), фильтр «оставить преимущества».
 */
import type { Attribute } from '../../types/attributes';
import type { CompareTableSide } from './loadCompareTableData';
import type { CompareBlockUiState } from '../../types/compare';
import { cellBeatsOpponents, comparableScore } from './compareAdvantage';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import type { Specification } from '../../stores/specificationStore';
import {
    findSpecBuiltInField,
    SPEC_BUILTIN_FIELDS,
    specBuiltInComparableValue,
    specBuiltInRowKey,
    type SpecBuiltInFieldKey,
} from './specificationCompareFields';

export type CharRowDef =
    | {
          kind: 'trim-attribute';
          key: string;
          name: string;
          isBase: false;
          attribute: Attribute;
      }
    | {
          kind: 'spec-attribute';
          key: string;
          name: string;
          isBase: true;
          attribute: Attribute;
      }
    | {
          kind: 'spec-field';
          key: string;
          name: string;
          isBase: true;
          fieldKey: SpecBuiltInFieldKey;
      };

export type AlignedCharRow = {
    key: string;
    name: string;
    isBase: boolean;
};

export function charRowKey(attributeId: string, isBase: boolean): string {
    return `${isBase ? 'base' : 'trim'}:${attributeId}`;
}

export function resolveActiveSpecification(
    data: CompareTableSide,
    ui: CompareBlockUiState,
): Specification | null {
    if (data.specifications.length === 0) return null;
    const preferred = ui.selectedSpecificationId;
    if (preferred) {
        const found = data.specifications.find((s) => s.id === preferred);
        if (found) return found;
    }
    return data.specifications[0];
}

export function buildCharacteristicRows(
    data: CompareTableSide,
    ui: CompareBlockUiState,
): CharRowDef[] {
    const rows: CharRowDef[] = [];

    // Базовые характеристики — из specifications (встроенные поля + values)
    if (ui.showBaseCharacteristics) {
        const spec = resolveActiveSpecification(data, ui);
        if (spec) {
            for (const field of SPEC_BUILTIN_FIELDS) {
                rows.push({
                    kind: 'spec-field',
                    key: specBuiltInRowKey(field.key),
                    name: field.label,
                    isBase: true,
                    fieldKey: field.key,
                });
            }
            const specId = spec.id;
            for (const a of data.specAttributesBySpecId[specId] ?? []) {
                rows.push({
                    kind: 'spec-attribute',
                    key: charRowKey(a.id, true),
                    name: a.name,
                    isBase: true,
                    attribute: a,
                });
            }
        }
    }

    for (const a of data.trimAttributes) {
        rows.push({
            kind: 'trim-attribute',
            key: charRowKey(a.id, false),
            name: a.name,
            isBase: false,
            attribute: a,
        });
    }

    return rows.sort((x, y) => x.name.localeCompare(y.name, 'ru'));
}

function rowBeatsOpponents(
    row: CharRowDef,
    data: CompareTableSide,
    ui: CompareBlockUiState,
    visibleTrimIds: string[],
    getOpponentValues: (attributeId: string) => (EntityAttributeValue | undefined)[],
    getOpponentSpecFieldValues: (
        fieldKey: SpecBuiltInFieldKey,
    ) => (EntityAttributeValue | undefined)[],
): boolean {
    const spec = resolveActiveSpecification(data, ui);
    if (!spec) return false;

    if (row.kind === 'spec-field') {
        const field = findSpecBuiltInField(row.fieldKey);
        if (!field || field.advantageType === 'NONE') return false;
        const myVal = specBuiltInComparableValue(spec, row.fieldKey);
        if (!myVal) return false;
        const opponents = getOpponentSpecFieldValues(row.fieldKey);
        return opponents.some((opp) => {
            const myScore = comparableScore(
                {
                    id: row.fieldKey,
                    name: row.name,
                    type: 'NUMBER',
                    category: 'SPECIFICATION',
                    advantageType: field.advantageType,
                    unit: '',
                },
                myVal,
            );
            const oppScore = comparableScore(
                {
                    id: row.fieldKey,
                    name: row.name,
                    type: 'NUMBER',
                    category: 'SPECIFICATION',
                    advantageType: field.advantageType,
                    unit: '',
                },
                opp,
            );
            if (myScore == null || oppScore == null) return false;
            return field.advantageType === 'LESS_IS_BETTER'
                ? myScore < oppScore
                : myScore > oppScore;
        });
    }

    if (row.kind === 'spec-attribute') {
        const myVal = data.specValuesBySpecId[spec.id]?.[row.attribute.id];
        return cellBeatsOpponents(row.attribute, myVal, getOpponentValues(row.attribute.id));
    }

    if (visibleTrimIds.length === 0) return true;
    return visibleTrimIds.some((trimId) => {
        const myVal = data.valuesByTrimId[trimId]?.[row.attribute.id];
        return cellBeatsOpponents(row.attribute, myVal, getOpponentValues(row.attribute.id));
    });
}

export function filterDisplayRows(
    rows: CharRowDef[],
    data: CompareTableSide,
    ui: CompareBlockUiState,
    visibleTrimIds: string[],
    getOpponentValues: (attributeId: string) => (EntityAttributeValue | undefined)[],
    getOpponentSpecFieldValues: (
        fieldKey: SpecBuiltInFieldKey,
    ) => (EntityAttributeValue | undefined)[],
): CharRowDef[] {
    if (!ui.keepAdvantages) return rows;

    return rows.filter((row) =>
        rowBeatsOpponents(
            row,
            data,
            ui,
            visibleTrimIds,
            getOpponentValues,
            getOpponentSpecFieldValues,
        ),
    );
}

/** Общий порядок строк характеристик для синхронного hover и выравнивания. */
export function buildAlignedCharRows(
    leftRows: CharRowDef[],
    rightRows: CharRowDef[],
): AlignedCharRow[] {
    const map = new Map<string, AlignedCharRow>();
    for (const r of [...leftRows, ...rightRows]) {
        if (!map.has(r.key)) {
            map.set(r.key, {
                key: r.key,
                name: r.name,
                isBase: r.isBase,
            });
        }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}
