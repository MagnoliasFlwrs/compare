import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface Model {
    id: string;
    brandId: string;
    name: string;
    isHidden: boolean;
}

export interface ModelsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface ModelsListResponse {
    data?: Model[];
    meta?: ModelsListMeta;
}

export interface CreateModelPayload {
    brandId: string;
    name: string;
    isHidden: boolean;
}

export interface UpdateModelPayload {
    name: string;
    isHidden: boolean;
}

export interface ModelsQuery {
    page: number;
    limit: number;
}

interface ModelsState {
    modelsByBrand: Model[];
    meta: ModelsListMeta | null;
    modelsByBrandObj: ModelsQuery;
    currentBrandId: string | null;
    loading: boolean;
    currentModel: Model | null;
    currentLoading: boolean;

    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    clearCurrent: () => void;

    getModelsByBrand: (brandId: string, override?: Partial<ModelsQuery>) => Promise<void>;
    getModelById: (modelId: string) => Promise<Model>;
    createModel: (payload: CreateModelPayload) => Promise<void>;
    updateModel: (modelId: string, payload: UpdateModelPayload) => Promise<void>;
    deleteModel: (modelId: string) => Promise<void>;
}

export const useModelStore = create<ModelsState>((set, get) => ({
    modelsByBrand: [],
    meta: null,
    modelsByBrandObj: {
        page: 1,
        limit: 20,
    },
    currentBrandId: null,
    loading: false,
    currentModel: null,
    currentLoading: false,

    setPage: (page) =>
        set((s) => ({
            modelsByBrandObj: { ...s.modelsByBrandObj, page },
        })),

    setLimit: (limit) =>
        set((s) => ({
            modelsByBrandObj: { ...s.modelsByBrandObj, limit },
        })),

    clearCurrent: () => set({ currentModel: null }),

    getModelsByBrand: async (brandId, override) => {
        const modelsByBrandObj = { ...get().modelsByBrandObj, ...override };
        set({ modelsByBrandObj, currentBrandId: brandId, loading: true });
        const queryString = qs.stringify(
            { ...modelsByBrandObj, filter: { brandId } },
            { arrayFormat: 'indices', skipNulls: true },
        );
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/models?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as ModelsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                modelsByBrand: list,
                meta,
                modelsByBrandObj: {
                    page: meta?.page ?? modelsByBrandObj.page,
                    limit: meta?.limit ?? modelsByBrandObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ modelsByBrand: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить модели');
        }
    },

    getModelById: async (modelId) => {
        set({ currentLoading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/models/${encodeURIComponent(modelId)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentModel = res.data as Model;
            set({ currentModel, currentLoading: false });
            return currentModel;
        } catch {
            set({ currentModel: null, currentLoading: false });
            throw new Error('Не удалось загрузить модель');
        }
    },

    createModel: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/models`, payload, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            set({ loading: false });
            const brandId = get().currentBrandId ?? payload.brandId;
            if (brandId) await get().getModelsByBrand(brandId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать модель');
        }
    },

    updateModel: async (modelId, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/models/${encodeURIComponent(modelId)}`,
                payload,
                {
                    headers: {
                        accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                },
            );
            set({ loading: false });
            const brandId = get().currentBrandId;
            if (brandId) await get().getModelsByBrand(brandId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить модель');
        }
    },

    deleteModel: async (modelId) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/models/${encodeURIComponent(modelId)}`, {
                headers: { accept: '*/*' },
            });
            set({ loading: false });
            const brandId = get().currentBrandId;
            if (brandId) await get().getModelsByBrand(brandId);
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить модель');
        }
    },
}));
