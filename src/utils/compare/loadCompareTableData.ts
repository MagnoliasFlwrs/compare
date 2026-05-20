import { baseAuthUrl } from '../../store';
import type { Brand } from '../../stores/brandsStore';
import type { CarPrice } from '../../stores/carPricesStore';
import { getCarPriceCellKey } from '../../stores/carPricesStore';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Specification } from '../../stores/specificationStore';
import type { Trim } from '../../stores/trimsStore';
import type { Attribute } from '../../types/attributes';
import type { CompareSideSelection } from '../../types/compare';
import type { Generation } from '../../types/generation';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { fetchAllPages } from '../paginatedFetch';
import { listEntityAttributeValues } from '../entityAttributeValuesApi';
import { pickIdString } from '../pickIdString';

export type CompareTableSide = {
    selection: CompareSideSelection;
    brand: Brand | null;
    modelName: string;
    generation: Generation | null;
    generationLabel: string;
    trims: Trim[];
    powertrains: Powertrain[];
    priceByCell: Record<string, CarPrice>;
    specification: Specification | null;
    trimAttributes: Attribute[];
    specAttributes: Attribute[];
    valuesByTrimId: Record<string, Record<string, EntityAttributeValue>>;
    specValuesByAttributeId: Record<string, EntityAttributeValue>;
};

function generationLabel(g: Generation): string {
    const years = `${g.yearFrom}–${g.yearTo || '…'}`;
    return `#${g.number}${g.restyling ? ` (${g.restyling})` : ''} · ${years}`;
}

function formatPowertrainLabel(p: Powertrain): string {
    const parts = [p.name?.trim()].filter(Boolean);
    if (p.engine) parts.push(p.engine);
    if (p.enginePower) parts.push(`${p.enginePower} л.с.`);
    return parts.length > 0 ? parts.join(' ') : `Агрегат`;
}

export { formatPowertrainLabel };

async function loadValuesMap(
    resource: 'trims' | 'specifications',
    entityIds: string[],
): Promise<Record<string, Record<string, EntityAttributeValue>>> {
    const result: Record<string, Record<string, EntityAttributeValue>> = {};
    await Promise.all(
        entityIds.map(async (entityId) => {
            const list = await listEntityAttributeValues(resource, entityId);
            const byAttr: Record<string, EntityAttributeValue> = {};
            for (const v of list) {
                const attrId = pickIdString(v.attributeId);
                if (attrId) byAttr[attrId] = v;
            }
            result[entityId] = byAttr;
        }),
    );
    return result;
}

export async function loadCompareTableSide(
    selection: CompareSideSelection,
): Promise<CompareTableSide> {
    const [brandList, generations, trimAttrs, specAttrs] = await Promise.all([
        fetchAllPages<Brand>(`${baseAuthUrl}/brands`, {}),
        fetchAllPages<Generation>(`${baseAuthUrl}/generations`, {
            modelId: selection.modelId,
        }),
        fetchAllPages<Attribute>(`${baseAuthUrl}/attributes`, { category: 'TRIM' }),
        fetchAllPages<Attribute>(`${baseAuthUrl}/attributes`, { category: 'SPECIFICATION' }),
    ]);

    const brand =
        brandList.find((b) => b.id === selection.brandId && !b.isHidden) ?? null;

    let generation: Generation | null = null;
    const sortedGens = generations.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
    if (selection.generationId) {
        generation = sortedGens.find((g) => g.id === selection.generationId) ?? null;
    } else if (sortedGens.length > 0) {
        generation = sortedGens[0];
    }

    if (!generation) {
        return {
            selection,
            brand,
            modelName: selection.modelName,
            generation: null,
            generationLabel: '',
            trims: [],
            powertrains: [],
            priceByCell: {},
            specification: null,
            trimAttributes: trimAttrs,
            specAttributes: specAttrs,
            valuesByTrimId: {},
            specValuesByAttributeId: {},
        };
    }

    const genLabel =
        selection.generationLabel ?? generationLabel(generation);

    const [trimsRaw, powertrainsRaw, specifications, allPrices] = await Promise.all([
        fetchAllPages<Trim>(`${baseAuthUrl}/trims`, {
            filter: { generationId: generation.id },
        }),
        fetchAllPages<Powertrain>(`${baseAuthUrl}/powertrains`, {
            filter: { generationId: generation.id },
        }),
        fetchAllPages<Specification>(`${baseAuthUrl}/specifications`, {
            filter: { generationId: generation.id },
        }),
        fetchAllPages<CarPrice>(`${baseAuthUrl}/car-prices`, {}),
    ]);

    let trims = trimsRaw.filter((t) => !t.isHidden).sort((a, b) => a.order - b.order);
    let powertrains = powertrainsRaw
        .filter((p) => !p.isHidden)
        .sort((a, b) => a.order - b.order);

    if (selection.trimId) {
        trims = trims.filter((t) => t.id === selection.trimId);
    }
    if (selection.powertrainId) {
        powertrains = powertrains.filter((p) => p.id === selection.powertrainId);
    }

    const trimIds = new Set(trims.map((t) => t.id));
    const powertrainIds = new Set(powertrains.map((p) => p.id));
    const priceByCell: Record<string, CarPrice> = {};
    for (const price of allPrices) {
        if (trimIds.has(price.trimId) && powertrainIds.has(price.powertrainId)) {
            priceByCell[getCarPriceCellKey(price.powertrainId, price.trimId)] = price;
        }
    }

    const visibleSpecs = specifications.filter((s) => !s.isHidden);
    const specification = visibleSpecs[0] ?? null;

    const valuesByTrimId = await loadValuesMap(
        'trims',
        trims.map((t) => t.id),
    );

    let specValuesByAttributeId: Record<string, EntityAttributeValue> = {};
    if (specification) {
        const specMap = await loadValuesMap('specifications', [specification.id]);
        specValuesByAttributeId = specMap[specification.id] ?? {};
    }

    return {
        selection,
        brand,
        modelName: selection.modelName,
        generation,
        generationLabel: genLabel,
        trims,
        powertrains,
        priceByCell,
        specification,
        trimAttributes: trimAttrs,
        specAttributes: specAttrs,
        valuesByTrimId,
        specValuesByAttributeId,
    };
}
