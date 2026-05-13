export interface Generation {
    id: string;
    modelId: string;
    number: number;
    restyling: string;
    yearFrom: number;
    yearTo: number;
}

export interface GenerationsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

export interface GenerationsListResponse {
    data?: Generation[];
    meta?: GenerationsListMeta;
}

export interface CreateGenerationPayload {
    modelId: string;
    number: number;
    restyling: string;
    yearFrom: number;
    yearTo: number;
}

export interface UpdateGenerationPayload {
    number: number;
    restyling: string;
    yearFrom: number;
    yearTo: number;
}

export interface CloneGenerationPayload {
    fromGenerationId: string;
    toGenerationId: string;
    mode: string;
    entityId: string;
}

export interface GenerationsQuery {
    page: number;
    limit: number;
}

export interface GenerationImage {
    id: string;
    generationId: string;
    imageId: string;
    imageUrl: unknown;
    order: number;
}

export interface GenerationImagesListResponse {
    data?: GenerationImage[];
    meta?: GenerationsListMeta;
}

export interface CreateGenerationImagePayload {
    generationId: string;
    imageId: string;
    order: number;
}

export interface UpdateGenerationImagePayload {
    order: number;
}

export interface GenerationImagesQuery {
    page: number;
    limit: number;
}

export type GenerationFormValues = {
    number: number;
    restyling: string;
    yearFrom: number;
    yearTo: number;
};

export type CloneGenerationFormValues = {
    fromGenerationId: string;
    toGenerationId: string;
    mode: string;
    entityId: string;
};

export type GenerationImageFormValues = {
    order: number;
};
