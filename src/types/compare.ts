/**
 * Типы и состояние UI для модуля сравнения (/compare, /compare/result).
 * CompareNavigateState передаётся через react-router location.state.
 */

/** Выбор автомобиля на экране сравнения (передаётся в result через location.state). */
export type CompareSideSelection = {
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    generationId?: string;
    generationLabel?: string;
    powertrainId?: string;
    powertrainLabel?: string;
    trimId?: string;
    trimLabel?: string;
};

export type CompareNavigateState = {
    left: CompareSideSelection;
    right: CompareSideSelection;
};

/** Черновик в форме выбора (до перехода к сравнению). */
export type CompareSideDraft = {
    brandId?: string;
    brandName?: string;
    modelId?: string;
    modelName?: string;
    generationId?: string;
    generationLabel?: string;
    powertrainId?: string;
    powertrainLabel?: string;
    trimId?: string;
    trimLabel?: string;
};

export function isCompareSideReady(side: CompareSideDraft): boolean {
    return Boolean(side.brandId && side.modelId);
}

export type CompareBlockUiState = {
    keepAdvantages: boolean;
    showBaseCharacteristics: boolean;
    hiddenTrimIds: Set<string>;
    /** Активная базовая спецификация (вариант кузова), если их несколько. */
    selectedSpecificationId?: string;
};

export function draftToSelection(side: CompareSideDraft): CompareSideSelection {
    return {
        brandId: side.brandId!,
        brandName: side.brandName ?? '',
        modelId: side.modelId!,
        modelName: side.modelName ?? '',
        generationId: side.generationId,
        generationLabel: side.generationLabel,
        powertrainId: side.powertrainId,
        powertrainLabel: side.powertrainLabel,
        trimId: side.trimId,
        trimLabel: side.trimLabel,
    };
}
