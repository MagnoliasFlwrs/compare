import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import type {
    EntityAttributeValueListItem,
    EntityAttributeValuesListMeta,
} from '../types/entityAttributeValue';
import type { EntityAttributeValuesListQuery } from '../utils/entityAttributeValuesApi';
import {
    defaultEntityValuesObj,
    fetchAllEntityValues,
    fetchEntityValuesListPage,
} from '../utils/entityValuesStoreHelpers';
import { sortByOrder } from '../utils/sortByOrder';

export interface Trim {
    id: string;
    isHidden: boolean;
    generationId: string;
    name: string;
    order: number;
}

export interface TrimsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface TrimsListResponse {
    data?: Trim[];
    meta?: TrimsListMeta;
}

export interface TrimsQuery {
    limit: number;
    page: number;
    generationId?: string;
}

export interface CreateTrimPayload {
    isHidden: boolean;
    generationId: string;
    name: string;
    order: number;
}

export interface UpdateTrimPayload {
    isHidden: boolean;
    name: string;
    order: number;
}

/** Body POST /trims/value — задать значение характеристики для комплектации. */
export interface SetTrimValuePayload {
    attributeId: string;
    trimId: string;
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

/** Body PUT /trims/value/:id — обновить значение характеристики для комплектации. */
export interface UpdateTrimValuePayload {
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

interface TrimsState {
    trims: Trim[];
    meta: TrimsListMeta | null;
    trimsObj: TrimsQuery;
    currentTrim: Trim | null;
    loading: boolean;

    getTrims: (override?: Partial<Pick<TrimsQuery, 'page' | 'limit' | 'generationId'>>) => Promise<void>;
    getTrimById: (id: string) => Promise<Trim>;
    createTrim: (payload: CreateTrimPayload) => Promise<void>;
    updateTrimById: (id: string, payload: UpdateTrimPayload) => Promise<void>;
    deleteTrimById: (id: string) => Promise<void>;
    filterByGeneration: (value: string) => void;
    resetFilter: () => void;

    setTrimValue: (payload: SetTrimValuePayload) => Promise<void>;
    updateTrimValueById: (id: string, payload: UpdateTrimValuePayload) => Promise<void>;
    deleteTrimValueById: (id: string) => Promise<void>;

    /** GET /trims/value/list */
    entityValues: EntityAttributeValueListItem[];
    entityValuesMeta: EntityAttributeValuesListMeta | null;
    entityValuesObj: EntityAttributeValuesListQuery;
    entityValuesLoading: boolean;
    getTrimValuesList: (
        override?: Partial<Pick<EntityAttributeValuesListQuery, 'page' | 'limit' | 'trimId'>>,
    ) => Promise<void>;
    fetchAllTrimValues: (trimId: string) => Promise<void>;
    filterTrimValuesByTrimId: (trimId: string) => void;
    resetTrimValuesFilter: () => void;
}

export const useTrimsStore = create<TrimsState>((set, get) => ({
    trims: [],
    meta: null,
    trimsObj: {
        limit: 20,
        page: 1,
    },
    currentTrim: null,
    loading: false,

    entityValues: [],
    entityValuesMeta: null,
    entityValuesObj: defaultEntityValuesObj('trims'),
    entityValuesLoading: false,

    getTrims: async (override) => {
        const trimsObj = { ...get().trimsObj, ...override };
        set({ trimsObj, loading: true });
        const queryString = qs.stringify(trimsObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/trims?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as TrimsListResponse;
            const list = sortByOrder(Array.isArray(body?.data) ? body.data : []);
            const meta = body?.meta ?? null;
            set({
                trims: list,
                meta,
                trimsObj: {
                    page: meta?.page ?? trimsObj.page,
                    limit: meta?.limit ?? trimsObj.limit,
                    generationId: trimsObj.generationId,
                },
                loading: false,
            });
        } catch {
            set({ trims: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить комплектации');
        }
    },

    createTrim: async (payload) => {
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/trims`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            await get().getTrims();
        } catch {
            throw new Error('Не удалось создать комплектацию');
        }
    },

    updateTrimById: async (id, payload) => {
        try {
            await axiosInstanceAll.put(`${baseAuthUrl}/trims/${encodeURIComponent(id)}`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            await get().getTrims();
        } catch {
            throw new Error('Не удалось обновить комплектацию');
        }
    },

    deleteTrimById: async (id) => {
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/trims/${encodeURIComponent(id)}`, {
                headers: { accept: '*/*' },
            });
            set((s) => ({
                currentTrim: s.currentTrim?.id === id ? null : s.currentTrim,
            }));
            await get().getTrims();
        } catch {
            throw new Error('Не удалось удалить комплектацию');
        }
    },

    getTrimById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/trims/${encodeURIComponent(id)}`, {
                headers: { accept: 'application/json' },
            });
            const currentTrim = res.data as Trim;
            set({ loading: false, currentTrim });
            return currentTrim;
        } catch {
            set({ loading: false, currentTrim: null });
            throw new Error('Не удалось получить комплектацию');
        }
    },

    filterByGeneration: (value) =>
        set((state) => ({
            trimsObj: {
                ...state.trimsObj,
                page: 1,
                generationId: value,
            },
        })),

    resetFilter: () =>
        set((state) => ({
            trimsObj: {
                limit: state.trimsObj.limit,
                page: 1,
            },
        })),

    setTrimValue: async (payload) => {
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/trims/value`, payload, {
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
            });
        } catch {
            throw new Error('Не удалось задать значение характеристики');
        }
    },

    updateTrimValueById: async (id, payload) => {
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/trims/value/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: '*/*', 'Content-Type': 'application/json' },
                },
            );
        } catch {
            throw new Error('Не удалось обновить значение характеристики');
        }
    },

    deleteTrimValueById: async (id) => {
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/trims/value/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
        } catch {
            throw new Error('Не удалось удалить значение характеристики');
        }
    },

    getTrimValuesList: async (override) => {
        const entityValuesObj = { ...get().entityValuesObj, ...override };
        set({ entityValuesObj, entityValuesLoading: true });
        try {
            const { data, meta } = await fetchEntityValuesListPage('trims', entityValuesObj);
            set({
                entityValues: data,
                entityValuesMeta: meta,
                entityValuesObj: {
                    page: meta?.page ?? entityValuesObj.page,
                    limit: meta?.limit ?? entityValuesObj.limit,
                    trimId: entityValuesObj.trimId,
                },
                entityValuesLoading: false,
            });
        } catch {
            set({ entityValues: [], entityValuesMeta: null, entityValuesLoading: false });
            throw new Error('Не удалось загрузить значения характеристик комплектации');
        }
    },

    fetchAllTrimValues: async (trimId) => {
        const entityValuesObj = { ...get().entityValuesObj, page: 1, limit: 100, trimId };
        set({ entityValuesObj, entityValuesLoading: true });
        try {
            const list = await fetchAllEntityValues('trims', trimId);
            set({
                entityValues: list,
                entityValuesMeta: null,
                entityValuesObj,
                entityValuesLoading: false,
            });
        } catch {
            set({ entityValues: [], entityValuesMeta: null, entityValuesLoading: false });
            throw new Error('Не удалось загрузить значения характеристик комплектации');
        }
    },

    filterTrimValuesByTrimId: (trimId) =>
        set((state) => ({
            entityValuesObj: {
                ...state.entityValuesObj,
                page: 1,
                trimId,
            },
        })),

    resetTrimValuesFilter: () =>
        set({
            entityValuesObj: defaultEntityValuesObj('trims'),
            entityValues: [],
            entityValuesMeta: null,
        }),
}));
