/** Состояние фильтров на странице группового сравнения. */
export type GroupCompareFilters = {
    brandIds: string[];
    modelIds: string[];
    bodyTypeIds: string[];
    lengthMin?: number;
    lengthMax?: number;
    wheelbaseMin?: number;
    wheelbaseMax?: number;
    heightMin?: number;
    heightMax?: number;
    widthMin?: number;
    widthMax?: number;
    trunkStandardVolumeMin?: number;
    trunkStandardVolumeMax?: number;
    trunkMaximumVolumeMin?: number;
    trunkMaximumVolumeMax?: number;
};

export function emptyGroupCompareFilters(): GroupCompareFilters {
    return {
        brandIds: [],
        modelIds: [],
        bodyTypeIds: [],
    };
}
