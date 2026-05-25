/**
 * Преобразование ответа GET /generations/:id/detailed в структуру для таблицы сравнения:
 * комплектации, агрегаты, цены, базовые specifications и значения атрибутов.
 */
import type { Attribute, AttributeCategory } from '../../types/attributes';
import type { CarPrice } from '../../stores/carPricesStore';
import { getCarPriceCellKey } from '../../stores/carPricesStore';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Specification } from '../../stores/specificationStore';
import type { Trim } from '../../stores/trimsStore';
import type { CompareSideSelection } from '../../types/compare';
import type { Generation } from '../../types/generation';
import type {
    GenerationDetailed,
    GenerationDetailedValue,
} from '../../types/generationDetailed';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { pickIdString } from '../pickIdString';

export function generationLabel(g: Generation): string {
    const years = `${g.yearFrom}–${g.yearTo || '…'}`;
    return `#${g.number}${g.restyling ? ` (${g.restyling})` : ''} · ${years}`;
}

/** Подпись силового агрегата в строке цен (без поля name — только технические данные). */
export function formatPowertrainLabel(p: Powertrain): string {
    const parts: string[] = [];
    if (p.engine) parts.push(p.engine);
    if (p.enginePower) parts.push(`${p.enginePower} л.с.`);
    return parts.length > 0 ? parts.join(' ') : '—';
}

export function detailedValueToEntity(v: GenerationDetailedValue): EntityAttributeValue {
    return {
        id: v.id,
        attributeId: v.attributeId ?? v.attribute?.id,
        optionId: v.optionId ?? v.option?.id,
        option: v.option,
        rangeFrom: v.rangeFrom,
        rangeTo: v.rangeTo,
        valueBoolean: v.valueBoolean,
        valueNumber: v.valueNumber,
        valueText: v.valueText,
    };
}

function collectAttributes(
    values: GenerationDetailedValue[] | undefined,
    category: AttributeCategory,
): Attribute[] {
    const map = new Map<string, Attribute>();
    for (const v of values ?? []) {
        const attr = v.attribute;
        if (attr?.id && attr.category === category) {
            map.set(attr.id, attr);
        }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

function valuesByAttributeId(
    values: GenerationDetailedValue[] | undefined,
): Record<string, EntityAttributeValue> {
    const out: Record<string, EntityAttributeValue> = {};
    for (const v of values ?? []) {
        const attrId = pickIdString(v.attributeId) || v.attribute?.id;
        if (attrId) out[attrId] = detailedValueToEntity(v);
    }
    return out;
}

export type MappedCompareSide = {
    generation: Generation;
    generationLabel: string;
    trims: Trim[];
    powertrains: Powertrain[];
    priceByCell: Record<string, CarPrice>;
    specifications: Specification[];
    specification: Specification | null;
    trimAttributes: Attribute[];
    specAttributesBySpecId: Record<string, Attribute[]>;
    valuesByTrimId: Record<string, Record<string, EntityAttributeValue>>;
    specValuesBySpecId: Record<string, Record<string, EntityAttributeValue>>;
};

/** Одно поколение из detailed → данные для половины таблицы сравнения. */
export function mapGenerationDetailedToCompareSide(
    detailed: GenerationDetailed,
    selection: CompareSideSelection,
): MappedCompareSide {
    const generation: Generation = {
        id: detailed.id,
        modelId: detailed.modelId,
        number: detailed.number,
        restyling: detailed.restyling,
        yearFrom: detailed.yearFrom,
        yearTo: detailed.yearTo,
    };

    let trims = (detailed.trims ?? [])
        .filter((t) => !t.isHidden)
        .sort((a, b) => a.order - b.order);
    let powertrains = (detailed.powertrains ?? [])
        .filter((p) => !p.isHidden)
        .sort((a, b) => a.order - b.order);

    if (selection.trimId) {
        trims = trims.filter((t) => t.id === selection.trimId);
    }
    if (selection.powertrainId) {
        powertrains = powertrains.filter((p) => p.id === selection.powertrainId);
    }

    const powertrainIds = new Set(powertrains.map((p) => p.id));
    const priceByCell: Record<string, CarPrice> = {};

    const valuesByTrimId: Record<string, Record<string, EntityAttributeValue>> = {};
    const trimAttrMap = new Map<string, Attribute>();

    // Цены: trim.prices × выбранные powertrains
    for (const trim of trims) {
        for (const price of trim.prices ?? []) {
            if (
                powertrainIds.has(price.powertrainId) &&
                price.trimId === trim.id
            ) {
                priceByCell[getCarPriceCellKey(price.powertrainId, price.trimId)] = price;
            }
        }
        valuesByTrimId[trim.id] = valuesByAttributeId(trim.values);
        for (const v of trim.values ?? []) {
            if (v.attribute?.category === 'TRIM' && v.attribute.id) {
                trimAttrMap.set(v.attribute.id, v.attribute);
            }
        }
    }

    const visibleSpecs = (detailed.specifications ?? [])
        .filter((s) => !s.isHidden)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    const specifications: Specification[] = visibleSpecs.map(
        ({ values: _v, ...s }) => s,
    );
    const specification = specifications[0] ?? null;

    const specAttributesBySpecId: Record<string, Attribute[]> = {};
    const specValuesBySpecId: Record<string, Record<string, EntityAttributeValue>> = {};

    for (const raw of visibleSpecs) {
        const specAttrMap = new Map<string, Attribute>();
        specValuesBySpecId[raw.id] = valuesByAttributeId(raw.values);
        for (const v of raw.values ?? []) {
            if (v.attribute?.category === 'SPECIFICATION' && v.attribute.id) {
                specAttrMap.set(v.attribute.id, v.attribute);
            }
        }
        specAttributesBySpecId[raw.id] = [...specAttrMap.values()].sort((a, b) =>
            a.name.localeCompare(b.name, 'ru'),
        );
    }

    const trimList: Trim[] = trims.map(({ prices: _p, values: _v, ...t }) => t);
    const powertrainList: Powertrain[] = powertrains.map(({ values: _v, ...p }) => p);

    return {
        generation,
        generationLabel: selection.generationLabel ?? generationLabel(generation),
        trims: trimList,
        powertrains: powertrainList,
        priceByCell,
        specifications,
        specification,
        trimAttributes: [...trimAttrMap.values()].sort((a, b) =>
            a.name.localeCompare(b.name, 'ru'),
        ),
        specAttributesBySpecId,
        valuesByTrimId,
        specValuesBySpecId,
    };
}

/** Несколько поколений (только бренд + модель): объединяем данные из detailed. */
export function mergeGenerationsDetailedToCompareSide(
    detailedList: GenerationDetailed[],
    selection: CompareSideSelection,
): MappedCompareSide {
    if (detailedList.length === 0) {
        throw new Error('Нет поколений для сравнения');
    }
    if (detailedList.length === 1) {
        return mapGenerationDetailedToCompareSide(detailedList[0], selection);
    }

    const sorted = [...detailedList].sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    const synthetic: GenerationDetailed = {
        ...sorted[0],
        trims: sorted.flatMap((d) => d.trims ?? []),
        powertrains: sorted.flatMap((d) => d.powertrains ?? []),
        specifications: sorted.flatMap((d) => d.specifications ?? []),
    };

    return mapGenerationDetailedToCompareSide(synthetic, {
        ...selection,
        generationLabel: selection.generationLabel ?? 'Все поколения',
    });
}
