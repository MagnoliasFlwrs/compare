/**
 * Загрузка одной половины таблицы сравнения (левой или правой):
 * список поколений → getGenerationDetailed → map/merge.
 */
import { baseAuthUrl } from '../../store';
import type { Brand } from '../../stores/brandsStore';
import { useGenerationStore } from '../../stores/generationStore';
import type { CompareSideSelection } from '../../types/compare';
import type { Generation } from '../../types/generation';
import { fetchAllPages } from '../paginatedFetch';
import {
    formatPowertrainLabel,
    mapGenerationDetailedToCompareSide,
    mergeGenerationsDetailedToCompareSide,
} from './mapGenerationDetailed';

export type CompareTableSide = {
    selection: CompareSideSelection;
    brand: Brand | null;
    modelName: string;
    generation: Generation | null;
    generationLabel: string;
    trims: ReturnType<typeof mapGenerationDetailedToCompareSide>['trims'];
    powertrains: ReturnType<typeof mapGenerationDetailedToCompareSide>['powertrains'];
    priceByCell: ReturnType<typeof mapGenerationDetailedToCompareSide>['priceByCell'];
    specifications: ReturnType<typeof mapGenerationDetailedToCompareSide>['specifications'];
    specification: ReturnType<typeof mapGenerationDetailedToCompareSide>['specification'];
    trimAttributes: ReturnType<typeof mapGenerationDetailedToCompareSide>['trimAttributes'];
    specAttributesBySpecId: ReturnType<
        typeof mapGenerationDetailedToCompareSide
    >['specAttributesBySpecId'];
    valuesByTrimId: ReturnType<typeof mapGenerationDetailedToCompareSide>['valuesByTrimId'];
    specValuesBySpecId: ReturnType<
        typeof mapGenerationDetailedToCompareSide
    >['specValuesBySpecId'];
};

export { formatPowertrainLabel };

/** Поколения для загрузки: одно из выбора или все модели, если поколение не указано. */
export async function resolveGenerationIds(selection: CompareSideSelection): Promise<string[]> {
    if (selection.generationId) {
        return [selection.generationId];
    }

    const generations = await fetchAllPages<Generation>(`${baseAuthUrl}/generations`, {
        modelId: selection.modelId,
    });

    return generations
        .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        .map((g) => g.id);
}

const emptySide = (
    selection: CompareSideSelection,
    brand: Brand | null,
): CompareTableSide => ({
    selection,
    brand,
    modelName: selection.modelName,
    generation: null,
    generationLabel: '',
    trims: [],
    powertrains: [],
    priceByCell: {},
    specifications: [],
    specification: null,
    trimAttributes: [],
    specAttributesBySpecId: {},
    valuesByTrimId: {},
    specValuesBySpecId: {},
});

export async function loadCompareTableSide(
    selection: CompareSideSelection,
): Promise<CompareTableSide> {
    const brandList = await fetchAllPages<Brand>(`${baseAuthUrl}/brands`, {});
    const brand =
        brandList.find((b) => b.id === selection.brandId && !b.isHidden) ?? null;

    const generationIds = await resolveGenerationIds(selection);
    if (generationIds.length === 0) {
        return emptySide(selection, brand);
    }

    const getGenerationDetailed = useGenerationStore.getState().getGenerationDetailed;

    const detailedList = await Promise.all(
        generationIds.map((id) => getGenerationDetailed(id)),
    );

    const mapped =
        detailedList.length === 1
            ? mapGenerationDetailedToCompareSide(detailedList[0], selection)
            : mergeGenerationsDetailedToCompareSide(detailedList, selection);

    return {
        selection,
        brand,
        modelName: selection.modelName,
        generation: mapped.generation,
        generationLabel: mapped.generationLabel,
        trims: mapped.trims,
        powertrains: mapped.powertrains,
        priceByCell: mapped.priceByCell,
        specifications: mapped.specifications,
        specification: mapped.specification,
        specAttributesBySpecId: mapped.specAttributesBySpecId,
        trimAttributes: mapped.trimAttributes,
        valuesByTrimId: mapped.valuesByTrimId,
        specValuesBySpecId: mapped.specValuesBySpecId,
    };
}
