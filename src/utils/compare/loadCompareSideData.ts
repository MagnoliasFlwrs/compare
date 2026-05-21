import type { Generation } from '../../types/generation';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Specification } from '../../stores/specificationStore';
import type { CompareSideSelection } from '../../types/compare';
import { loadCompareTableSide } from './loadCompareTableData';

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

/** Обёртка над loadCompareTableSide для старого CompareSidePanel. */
export async function loadCompareSideData(
    selection: CompareSideSelection,
): Promise<CompareSideData> {
    const side = await loadCompareTableSide(selection);

    return {
        selection,
        title: [selection.brandName, selection.modelName].filter(Boolean).join(' · '),
        blocks: side.generation
            ? [
                  {
                      generation: side.generation,
                      imageUrls: [],
                      specifications: side.specification ? [side.specification] : [],
                      powertrains: side.powertrains,
                  },
              ]
            : [],
    };
}
