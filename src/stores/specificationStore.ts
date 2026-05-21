import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import { fetchAllPages } from '../utils/paginatedFetch';

export interface Specification {
    id: string;
    isHidden: boolean;
    generationId: string;
    name: string;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    /**
     * В POST/PUT отправляем uuid строкой, но GET может возвращать вложенный объект ({}) —
     * не сужаем тип, чтобы не падать на сыром ответе бэка.
     */
    countryId: unknown;
    bodyTypeId: unknown;
    warranty: string;
}

export interface SpecificationsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface SpecificationsListResponse {
    data?: Specification[];
    meta?: SpecificationsListMeta;
}

export interface SpecificationsQuery {
    limit: number;
    page: number;
    generationId?: string;
    bodyTypeId?: string;
    brandId?: string;
}

export interface CreateSpecificationPayload {
    isHidden: boolean;
    generationId: string;
    name: string;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    countryId: string;
    bodyTypeId: string;
    warranty: string;
}

export interface UpdateSpecificationPayload {
    isHidden: boolean;
    name: string;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    countryId: string;
    bodyTypeId: string;
    warranty: string;
}

/** Body POST /specifications/value — задать значение характеристики. */
export interface SetSpecificationValuePayload {
    attributeId: string;
    specificationId: string;
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

/** Body PUT /specifications/value/:id — обновить значение характеристики. */
export interface UpdateSpecificationValuePayload {
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

interface SpecificationState {
    specifications: Specification[];
    meta: SpecificationsListMeta | null;
    specificationsObj: SpecificationsQuery;
    currentSpecification: Specification | null;
    loading: boolean;

    getSpecifications: (
        override?: Partial<
            Pick<SpecificationsQuery, 'page' | 'limit' | 'generationId' | 'bodyTypeId' | 'brandId'>
        >,
    ) => Promise<void>;
    /** Все характеристики поколения (обходит лимит 100 на страницу). */
    fetchAllForGeneration: (generationId: string) => Promise<void>;
    getSpecificationById: (id: string) => Promise<Specification>;
    createSpecification: (payload: CreateSpecificationPayload) => Promise<void>;
    updateSpecificationById: (id: string, payload: UpdateSpecificationPayload) => Promise<void>;
    deleteSpecificationById: (id: string) => Promise<void>;
    filterByGeneration: (value: string) => void;
    resetFilter: () => void;

    setSpecificationValue: (payload: SetSpecificationValuePayload) => Promise<void>;
    updateSpecificationValueById: (
        id: string,
        payload: UpdateSpecificationValuePayload,
    ) => Promise<void>;
    deleteSpecificationValueById: (id: string) => Promise<void>;
}

export const useSpecificationStore = create<SpecificationState>((set, get) => ({
    specifications: [],
    meta: null,
    specificationsObj: {
        limit: 20,
        page: 1,
    },
    currentSpecification: null,
    loading: false,

    getSpecifications: async (override) => {
        const specificationsObj = { ...get().specificationsObj, ...override };
        set({ specificationsObj, loading: true });
        const queryString = qs.stringify(specificationsObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/specifications?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as SpecificationsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                specifications: list,
                meta,
                specificationsObj: {
                    page: meta?.page ?? specificationsObj.page,
                    limit: meta?.limit ?? specificationsObj.limit,
                    generationId: specificationsObj.generationId,
                    bodyTypeId: specificationsObj.bodyTypeId,
                    brandId: specificationsObj.brandId,
                },
                loading: false,
            });
        } catch {
            set({ specifications: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить характеристики');
        }
    },

    fetchAllForGeneration: async (generationId) => {
        const specificationsObj = {
            ...get().specificationsObj,
            page: 1,
            limit: 100,
            generationId,
        };
        set({ specificationsObj, loading: true });
        try {
            const list = await fetchAllPages<Specification>(`${baseAuthUrl}/specifications`, {
                generationId,
            });
            set({
                specifications: list,
                meta: null,
                specificationsObj,
                loading: false,
            });
        } catch {
            set({ specifications: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить характеристики');
        }
    },

    createSpecification: async (payload) => {
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/specifications`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            await get().getSpecifications();
        } catch {
            throw new Error('Не удалось создать характеристику');
        }
    },

    updateSpecificationById: async (id, payload) => {
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/specifications/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            await get().getSpecifications();
        } catch {
            throw new Error('Не удалось обновить характеристику');
        }
    },

    deleteSpecificationById: async (id) => {
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/specifications/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                currentSpecification:
                    s.currentSpecification?.id === id ? null : s.currentSpecification,
            }));
            await get().getSpecifications();
        } catch {
            throw new Error('Не удалось удалить характеристику');
        }
    },

    getSpecificationById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/specifications/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentSpecification = res.data as Specification;
            set({ loading: false, currentSpecification });
            return currentSpecification;
        } catch {
            set({ loading: false, currentSpecification: null });
            throw new Error('Не удалось получить характеристику');
        }
    },

    filterByGeneration: (value) =>
        set((state) => ({
            specificationsObj: {
                ...state.specificationsObj,
                page: 1,
                generationId: value,
            },
        })),

    resetFilter: () =>
        set((state) => ({
            specificationsObj: {
                limit: state.specificationsObj.limit,
                page: 1,
            },
        })),

    setSpecificationValue: async (payload) => {
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/specifications/value`, payload, {
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
            });
        } catch {
            throw new Error('Не удалось задать значение характеристики');
        }
    },

    updateSpecificationValueById: async (id, payload) => {
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/specifications/value/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: '*/*', 'Content-Type': 'application/json' },
                },
            );
        } catch {
            throw new Error('Не удалось обновить значение характеристики');
        }
    },

    deleteSpecificationValueById: async (id) => {
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/specifications/value/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
        } catch {
            throw new Error('Не удалось удалить значение характеристики');
        }
    },
}));
