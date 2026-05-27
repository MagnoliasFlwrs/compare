import { resolveImageUrl } from '../../components/generations/utils';
import { useGenerationStore } from '../../stores/generationStore';
import type { GenerationDetailed } from '../../types/generationDetailed';
import type { CompareSideSelection } from '../../types/compare';
import { mapGenerationDetailedToCompareSide } from './mapGenerationDetailed';
import { resolveGenerationIds } from './loadCompareTableData';
import type { Generation } from '../../types/generation';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Specification } from '../../stores/specificationStore';

export type CompareGenerationBlock = {
    generation: Generation;
    imageUrls: string[];
    specifications: Specification[];
    powertrains: Powertrain[];
};

export type CompareSideData = {
    selection: CompareSideSelection;
    title: string;
    blocks: CompareGenerationBlock[];
};

function detailedImageUrls(detailed: GenerationDetailed): string[] {
    return (detailed.images ?? [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((img) => resolveImageUrl(img.imageUrl))
        .filter((url): url is string => Boolean(url));
}

/** Загрузка данных для карточки группового сравнения (по одному блоку на поколение). */
export async function loadCompareSideData(
    selection: CompareSideSelection,
): Promise<CompareSideData> {
    const title = [selection.brandName, selection.modelName].filter(Boolean).join(' · ');
    const generationIds = await resolveGenerationIds(selection);

    if (generationIds.length === 0) {
        return { selection, title, blocks: [] };
    }

    const getGenerationDetailed = useGenerationStore.getState().getGenerationDetailed;
    const detailedList = await Promise.all(
        generationIds.map((id) => getGenerationDetailed(id)),
    );

    const blocks: CompareGenerationBlock[] = detailedList.map((detailed) => {
        const mapped = mapGenerationDetailedToCompareSide(detailed, selection);
        return {
            generation: mapped.generation,
            imageUrls: detailedImageUrls(detailed),
            specifications: mapped.specifications,
            powertrains: mapped.powertrains,
        };
    });

    return { selection, title, blocks };
}
