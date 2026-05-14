import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface BodyType {
    id: string;
    name: string;
}

export interface BodyTypesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface BodyTypesListResponse {
    data?: BodyType[];
    meta?: BodyTypesListMeta;
}

export interface BodyTypesQuery {
    limit: number;
    page: number;
}

export interface BodyTypePayload {
    name: string;
}

interface BodyTypesState {
    bodyTypes: BodyType[];
    meta: BodyTypesListMeta | null;
    bodyTypesObj: BodyTypesQuery;
    currentBodyType: BodyType | null;
    loading: boolean;

    getBodyTypes: (override?: Partial<BodyTypesQuery>) => Promise<void>;
    getBodyTypeById: (id: string) => Promise<BodyType>;
    createBodyType: (payload: BodyTypePayload) => Promise<void>;
    updateBodyTypeById: (id: string, payload: BodyTypePayload) => Promise<void>;
    deleteBodyTypeById: (id: string) => Promise<void>;
}

export const useBodyTypesStore = create<BodyTypesState>((set, get) => ({
    bodyTypes: [],
    meta: null,
    bodyTypesObj: {
        limit: 20,
        page: 1,
    },
    currentBodyType: null,
    loading: false,

    getBodyTypes: async (override) => {
        const bodyTypesObj = { ...get().bodyTypesObj, ...override };
        set({ bodyTypesObj, loading: true });
        const queryString = qs.stringify(bodyTypesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/body-types?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as BodyTypesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                bodyTypes: list,
                meta,
                bodyTypesObj: {
                    page: meta?.page ?? bodyTypesObj.page,
                    limit: meta?.limit ?? bodyTypesObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ bodyTypes: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить типы кузова');
        }
    },

    createBodyType: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/body-types`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getBodyTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать тип кузова');
        }
    },

    updateBodyTypeById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/body-types/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getBodyTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить тип кузова');
        }
    },

    deleteBodyTypeById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/body-types/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentBodyType: s.currentBodyType?.id === id ? null : s.currentBodyType,
            }));
            await get().getBodyTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить тип кузова');
        }
    },

    getBodyTypeById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/body-types/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentBodyType = res.data as BodyType;
            set({ loading: false, currentBodyType });
            return currentBodyType;
        } catch {
            set({ loading: false, currentBodyType: null });
            throw new Error('Не удалось получить тип кузова');
        }
    },
}));
