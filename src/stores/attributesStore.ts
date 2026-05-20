import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import type {
    Attribute,
    AttributesListMeta,
    AttributesQuery,
    CreateAttributePayload,
    UpdateAttributePayload,
} from '../types/attributes';

interface AttributesListResponse {
    data?: Attribute[];
    meta?: AttributesListMeta;
}

interface AttributesState {
    attributes: Attribute[];
    meta: AttributesListMeta | null;
    attributesObj: AttributesQuery;
    currentAttribute: Attribute | null;
    loading: boolean;

    getAttributes: (override?: Partial<AttributesQuery>) => Promise<void>;
    getAttributeById: (id: string) => Promise<Attribute>;
    createAttribute: (payload: CreateAttributePayload) => Promise<Attribute>;
    updateAttributeById: (id: string, payload: UpdateAttributePayload) => Promise<Attribute>;
    deleteAttributeById: (id: string) => Promise<void>;
}

export const useAttributesStore = create<AttributesState>((set, get) => ({
    attributes: [],
    meta: null,
    attributesObj: {
        limit: 20,
        page: 1,
    },
    currentAttribute: null,
    loading: false,

    getAttributes: async (override) => {
        const attributesObj = { ...get().attributesObj, ...override };
        set({ attributesObj, loading: true });
        const queryString = qs.stringify(attributesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/attributes?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as AttributesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                attributes: list,
                meta,
                attributesObj: {
                    page: meta?.page ?? attributesObj.page,
                    limit: meta?.limit ?? attributesObj.limit,
                    category: attributesObj.category,
                },
                loading: false,
            });
        } catch {
            set({ attributes: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить характеристики');
        }
    },

    createAttribute: async (payload) => {
        try {
            const res = await axiosInstanceAll.post(`${baseAuthUrl}/attributes`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            await get().getAttributes();
            return res.data as Attribute;
        } catch {
            throw new Error('Не удалось создать характеристику');
        }
    },

    updateAttributeById: async (id, payload) => {
        try {
            const res = await axiosInstanceAll.put(
                `${baseAuthUrl}/attributes/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            await get().getAttributes();
            return res.data as Attribute;
        } catch {
            throw new Error('Не удалось обновить характеристику');
        }
    },

    deleteAttributeById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/attributes/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentAttribute:
                    s.currentAttribute?.id === id ? null : s.currentAttribute,
            }));
            await get().getAttributes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить характеристику');
        }
    },

    getAttributeById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/attributes/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentAttribute = res.data as Attribute;
            set({ loading: false, currentAttribute });
            return currentAttribute;
        } catch {
            set({ loading: false, currentAttribute: null });
            throw new Error('Не удалось получить характеристику');
        }
    },
}));
