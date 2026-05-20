import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import type {
    AttributeOption,
    AttributesListMeta,
    CreateAttributeOptionPayload,
    UpdateAttributeOptionPayload,
} from '../types/attributes';

interface AttributeOptionsListResponse {
    data?: AttributeOption[];
    meta?: AttributesListMeta;
}

export interface AttributeOptionsQuery {
    limit: number;
    page: number;
    attributeId: string;
}

interface AttributeOptionsState {
    options: AttributeOption[];
    meta: AttributesListMeta | null;
    loading: boolean;

    getOptionsForAttribute: (
        attributeId: string,
        override?: Partial<Pick<AttributeOptionsQuery, 'page' | 'limit'>>,
    ) => Promise<AttributeOption[]>;
    createOption: (payload: CreateAttributeOptionPayload) => Promise<AttributeOption>;
    updateOptionById: (id: string, payload: UpdateAttributeOptionPayload) => Promise<AttributeOption>;
    deleteOptionById: (id: string) => Promise<void>;
}

export const useAttributeOptionsStore = create<AttributeOptionsState>((set) => ({
    options: [],
    meta: null,
    loading: false,

    getOptionsForAttribute: async (attributeId, override) => {
        const query: AttributeOptionsQuery = {
            limit: 100,
            page: 1,
            attributeId,
            ...override,
        };
        set({ loading: true });
        const queryString = qs.stringify(query, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/attribute-options?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as AttributeOptionsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            set({ options: list, meta: body?.meta ?? null, loading: false });
            return list;
        } catch {
            set({ options: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить значения');
        }
    },

    createOption: async (payload) => {
        try {
            const res = await axiosInstanceAll.post(
                `${baseAuthUrl}/attribute-options`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            return res.data as AttributeOption;
        } catch {
            throw new Error('Не удалось создать значение');
        }
    },

    updateOptionById: async (id, payload) => {
        try {
            const res = await axiosInstanceAll.put(
                `${baseAuthUrl}/attribute-options/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            return res.data as AttributeOption;
        } catch {
            throw new Error('Не удалось обновить значение');
        }
    },

    deleteOptionById: async (id) => {
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/attribute-options/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
        } catch {
            throw new Error('Не удалось удалить значение');
        }
    },
}));
