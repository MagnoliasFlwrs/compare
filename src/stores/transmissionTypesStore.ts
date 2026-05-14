import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface TransmissionType {
    id: string;
    name: string;
}

export interface TransmissionTypesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface TransmissionTypesListResponse {
    data?: TransmissionType[];
    meta?: TransmissionTypesListMeta;
}

export interface TransmissionTypesQuery {
    limit: number;
    page: number;
}

export interface TransmissionTypePayload {
    name: string;
}

interface TransmissionTypesState {
    transmissionTypes: TransmissionType[];
    meta: TransmissionTypesListMeta | null;
    transmissionTypesObj: TransmissionTypesQuery;
    currentTransmissionType: TransmissionType | null;
    loading: boolean;

    getTransmissionTypes: (override?: Partial<TransmissionTypesQuery>) => Promise<void>;
    getTransmissionTypeById: (id: string) => Promise<TransmissionType>;
    createTransmissionType: (payload: TransmissionTypePayload) => Promise<void>;
    updateTransmissionTypeById: (id: string, payload: TransmissionTypePayload) => Promise<void>;
    deleteTransmissionTypeById: (id: string) => Promise<void>;
}

export const useTransmissionTypesStore = create<TransmissionTypesState>((set, get) => ({
    transmissionTypes: [],
    meta: null,
    transmissionTypesObj: {
        limit: 20,
        page: 1,
    },
    currentTransmissionType: null,
    loading: false,

    getTransmissionTypes: async (override) => {
        const transmissionTypesObj = { ...get().transmissionTypesObj, ...override };
        set({ transmissionTypesObj, loading: true });
        const queryString = qs.stringify(transmissionTypesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/transmission-types?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as TransmissionTypesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                transmissionTypes: list,
                meta,
                transmissionTypesObj: {
                    page: meta?.page ?? transmissionTypesObj.page,
                    limit: meta?.limit ?? transmissionTypesObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ transmissionTypes: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить типы КПП');
        }
    },

    createTransmissionType: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/transmission-types`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getTransmissionTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать тип КПП');
        }
    },

    updateTransmissionTypeById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/transmission-types/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getTransmissionTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить тип КПП');
        }
    },

    deleteTransmissionTypeById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/transmission-types/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentTransmissionType:
                    s.currentTransmissionType?.id === id ? null : s.currentTransmissionType,
            }));
            await get().getTransmissionTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить тип КПП');
        }
    },

    getTransmissionTypeById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/transmission-types/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentTransmissionType = res.data as TransmissionType;
            set({ loading: false, currentTransmissionType });
            return currentTransmissionType;
        } catch {
            set({ loading: false, currentTransmissionType: null });
            throw new Error('Не удалось получить тип КПП');
        }
    },
}));
