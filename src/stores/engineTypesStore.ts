import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface EngineType {
    id: string;
    name: string;
}

export interface EngineTypesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface EngineTypesListResponse {
    data?: EngineType[];
    meta?: EngineTypesListMeta;
}

export interface EngineTypesQuery {
    limit: number;
    page: number;
}

export interface EngineTypePayload {
    name: string;
}

interface EngineTypesState {
    engineTypes: EngineType[];
    meta: EngineTypesListMeta | null;
    engineTypesObj: EngineTypesQuery;
    currentEngineType: EngineType | null;
    loading: boolean;

    getEngineTypes: (override?: Partial<EngineTypesQuery>) => Promise<void>;
    getEngineTypeById: (id: string) => Promise<EngineType>;
    createEngineType: (payload: EngineTypePayload) => Promise<void>;
    updateEngineTypeById: (id: string, payload: EngineTypePayload) => Promise<void>;
    deleteEngineTypeById: (id: string) => Promise<void>;
}

export const useEngineTypesStore = create<EngineTypesState>((set, get) => ({
    engineTypes: [],
    meta: null,
    engineTypesObj: {
        limit: 20,
        page: 1,
    },
    currentEngineType: null,
    loading: false,

    getEngineTypes: async (override) => {
        const engineTypesObj = { ...get().engineTypesObj, ...override };
        set({ engineTypesObj, loading: true });
        const queryString = qs.stringify(engineTypesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/engine-types?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as EngineTypesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                engineTypes: list,
                meta,
                engineTypesObj: {
                    page: meta?.page ?? engineTypesObj.page,
                    limit: meta?.limit ?? engineTypesObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ engineTypes: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить типы двигателя');
        }
    },

    createEngineType: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/engine-types`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getEngineTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать тип двигателя');
        }
    },

    updateEngineTypeById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/engine-types/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getEngineTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить тип двигателя');
        }
    },

    deleteEngineTypeById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/engine-types/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentEngineType:
                    s.currentEngineType?.id === id ? null : s.currentEngineType,
            }));
            await get().getEngineTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить тип двигателя');
        }
    },

    getEngineTypeById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/engine-types/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentEngineType = res.data as EngineType;
            set({ loading: false, currentEngineType });
            return currentEngineType;
        } catch {
            set({ loading: false, currentEngineType: null });
            throw new Error('Не удалось получить тип двигателя');
        }
    },
}));
