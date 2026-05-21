import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import type {
    CloneGenerationPayload,
    CreateGenerationImagePayload,
    CreateGenerationPayload,
    Generation,
    GenerationImage,
    GenerationImagesListResponse,
    GenerationImagesQuery,
    GenerationsListMeta,
    GenerationsListResponse,
    GenerationsQuery,
    UpdateGenerationImagePayload,
    UpdateGenerationPayload,
} from '../types/generation';
import type { GenerationDetailed } from '../types/generationDetailed';

interface GenerationsState {
    generationsByModel: Generation[];
    meta: GenerationsListMeta | null;
    generationsByModelObj: GenerationsQuery;
    currentModelId: string | null;
    loading: boolean;
    currentGeneration: Generation | null;
    currentLoading: boolean;

    images: GenerationImage[];
    imagesMeta: GenerationsListMeta | null;
    imagesObj: GenerationImagesQuery;
    currentImagesGenerationId: string | null;
    imagesLoading: boolean;

    // Кэш картинок по generationId — для грида карточек, где каждая карточка
    // тянет свой набор изображений независимо от модалки.
    imagesByGenerationId: Record<string, GenerationImage[]>;
    imagesByGenerationIdLoading: Record<string, boolean>;

    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    clearCurrent: () => void;

    getGenerationsByModel: (modelId: string, override?: Partial<GenerationsQuery>) => Promise<void>;
    getGenerationById: (generationId: string) => Promise<Generation>;
    getGenerationDetailed: (generationId: string) => Promise<GenerationDetailed>;
    createGeneration: (payload: CreateGenerationPayload) => Promise<void>;
    updateGeneration: (generationId: string, payload: UpdateGenerationPayload) => Promise<void>;
    deleteGeneration: (generationId: string) => Promise<void>;
    cloneGeneration: (payload: CloneGenerationPayload) => Promise<void>;

    getGenerationImages: (
        generationId: string,
        override?: Partial<GenerationImagesQuery>,
    ) => Promise<void>;
    getGenerationImageById: (id: string) => Promise<GenerationImage>;
    createGenerationImage: (payload: CreateGenerationImagePayload) => Promise<void>;
    updateGenerationImage: (id: string, payload: UpdateGenerationImagePayload) => Promise<void>;
    deleteGenerationImage: (id: string) => Promise<void>;
    clearImages: () => void;

    loadImagesForGeneration: (generationId: string) => Promise<void>;
}

export const useGenerationStore = create<GenerationsState>((set, get) => ({
    generationsByModel: [],
    meta: null,
    generationsByModelObj: {
        page: 1,
        limit: 20,
    },
    currentModelId: null,
    loading: false,
    currentGeneration: null,
    currentLoading: false,

    images: [],
    imagesMeta: null,
    imagesObj: {
        page: 1,
        limit: 20,
    },
    currentImagesGenerationId: null,
    imagesLoading: false,

    imagesByGenerationId: {},
    imagesByGenerationIdLoading: {},

    setPage: (page) =>
        set((s) => ({
            generationsByModelObj: { ...s.generationsByModelObj, page },
        })),

    setLimit: (limit) =>
        set((s) => ({
            generationsByModelObj: { ...s.generationsByModelObj, limit },
        })),

    clearCurrent: () => set({ currentGeneration: null }),

    getGenerationsByModel: async (modelId, override) => {
        const generationsByModelObj = { ...get().generationsByModelObj, ...override };
        set({ generationsByModelObj, currentModelId: modelId, loading: true });
        const queryString = qs.stringify(
            { ...generationsByModelObj, modelId },
            { arrayFormat: 'indices', skipNulls: true },
        );
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/generations?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as GenerationsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                generationsByModel: list,
                meta,
                generationsByModelObj: {
                    page: meta?.page ?? generationsByModelObj.page,
                    limit: meta?.limit ?? generationsByModelObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ generationsByModel: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить поколения');
        }
    },

    getGenerationById: async (generationId) => {
        set({ currentLoading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/generations/${encodeURIComponent(generationId)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentGeneration = res.data as Generation;
            set({ currentGeneration, currentLoading: false });
            return currentGeneration;
        } catch {
            set({ currentGeneration: null, currentLoading: false });
            throw new Error('Не удалось загрузить поколение');
        }
    },

    getGenerationDetailed: async (generationId) => {
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/generations/${encodeURIComponent(generationId)}/detailed`,
                { headers: { accept: 'application/json' } },
            );
            return res.data as GenerationDetailed;
        } catch {
            throw new Error('Не удалось загрузить данные поколения');
        }
    },

    createGeneration: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/generations`, payload, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            set({ loading: false });
            const modelId = get().currentModelId ?? payload.modelId;
            if (modelId) await get().getGenerationsByModel(modelId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать поколение');
        }
    },

    updateGeneration: async (generationId, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/generations/${encodeURIComponent(generationId)}`,
                payload,
                {
                    headers: {
                        accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            );
            set({ loading: false });
            const modelId = get().currentModelId;
            if (modelId) await get().getGenerationsByModel(modelId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить поколение');
        }
    },

    deleteGeneration: async (generationId) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/generations/${encodeURIComponent(generationId)}`,
                { headers: { accept: '*/*' } },
            );
            set({ loading: false });
            const modelId = get().currentModelId;
            if (modelId) await get().getGenerationsByModel(modelId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить поколение');
        }
    },

    cloneGeneration: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/generations/clone`, payload, {
                headers: {
                    accept: '*/*',
                    'Content-Type': 'application/json',
                },
            });
            set({ loading: false });
            const modelId = get().currentModelId;
            if (modelId) await get().getGenerationsByModel(modelId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось клонировать поколение');
        }
    },

    clearImages: () => set({ images: [], imagesMeta: null, currentImagesGenerationId: null }),

    getGenerationImages: async (generationId, override) => {
        const prevId = get().currentImagesGenerationId;
        const imagesObj = { ...get().imagesObj, ...override };

        // При смене генерации обнуляем массив, чтобы модалка не показывала чужие изображения,
        // пока летит сетевой запрос.
        if (prevId !== generationId) {
            set({
                imagesObj,
                currentImagesGenerationId: generationId,
                imagesLoading: true,
                images: [],
                imagesMeta: null,
            });
        } else {
            set({ imagesObj, currentImagesGenerationId: generationId, imagesLoading: true });
        }

        const queryString = qs.stringify(
            { ...imagesObj, generationId:generationId },
            { arrayFormat: 'indices', skipNulls: true },
        );
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/generation-images?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            // Защита от гонки: если за время запроса юзер уже открыл другую генерацию,
            // не подменяем актуальные данные устаревшим ответом.
            if (get().currentImagesGenerationId !== generationId) return;

            const body = res.data as GenerationImagesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            set({
                images: sorted,
                imagesMeta: meta,
                imagesObj: {
                    page: meta?.page ?? imagesObj.page,
                    limit: meta?.limit ?? imagesObj.limit,
                },
                imagesLoading: false,
            });
        } catch {
            if (get().currentImagesGenerationId !== generationId) return;
            set({ images: [], imagesMeta: null, imagesLoading: false });
            throw new Error('Не удалось загрузить изображения');
        }
    },

    getGenerationImageById: async (id) => {
        const res = await axiosInstanceAll.get(
            `${baseAuthUrl}/generation-images/${encodeURIComponent(id)}`,
            { headers: { accept: 'application/json' } },
        );
        return res.data as GenerationImage;
    },

    createGenerationImage: async (payload) => {
        set({ imagesLoading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/generation-images`, payload, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            set({ imagesLoading: false });
            const generationId = get().currentImagesGenerationId ?? payload.generationId;
            if (generationId) await get().getGenerationImages(generationId);
        } catch {
            set({ imagesLoading: false });
            throw new Error('Не удалось создать изображение');
        }
    },

    updateGenerationImage: async (id, payload) => {
        set({ imagesLoading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/generation-images/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: {
                        accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            );
            set({ imagesLoading: false });
            const generationId = get().currentImagesGenerationId;
            if (generationId) await get().getGenerationImages(generationId);
        } catch {
            set({ imagesLoading: false });
            throw new Error('Не удалось обновить изображение');
        }
    },

    deleteGenerationImage: async (id) => {
        set({ imagesLoading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/generation-images/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set({ imagesLoading: false });
            const generationId = get().currentImagesGenerationId;
            if (generationId) await get().getGenerationImages(generationId);
        } catch {
            set({ imagesLoading: false });
            throw new Error('Не удалось удалить изображение');
        }
    },

    loadImagesForGeneration: async (generationId) => {
        // Если уже грузим именно эту генерацию — не запускаем повторно.
        if (get().imagesByGenerationIdLoading[generationId]) return;

        set((s) => ({
            imagesByGenerationIdLoading: {
                ...s.imagesByGenerationIdLoading,
                [generationId]: true,
            },
        }));

        const queryString = qs.stringify(
            { page: 1, limit: 100, generationId:generationId },
            { arrayFormat: 'indices', skipNulls: true },
        );

        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/generation-images?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as GenerationImagesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const sorted = [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            set((s) => ({
                imagesByGenerationId: {
                    ...s.imagesByGenerationId,
                    [generationId]: sorted,
                },
                imagesByGenerationIdLoading: {
                    ...s.imagesByGenerationIdLoading,
                    [generationId]: false,
                },
            }));
        } catch {
            set((s) => ({
                imagesByGenerationId: {
                    ...s.imagesByGenerationId,
                    [generationId]: [],
                },
                imagesByGenerationIdLoading: {
                    ...s.imagesByGenerationIdLoading,
                    [generationId]: false,
                },
            }));
        }
    },
}));
