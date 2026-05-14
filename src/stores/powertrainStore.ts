import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface Powertrain {
    id: string;
    isHidden: boolean;
    generationId: string;
    name: string;
    order: number;
    // Дальше — поля из POST/PUT payload. В GET-листе они могут не приходить,
    // поэтому все опциональные. id-шники справочников типизируем `unknown`,
    // т.к. бэк иногда возвращает их вложенным объектом ({}).
    engine?: string;
    engineTypeId?: unknown;
    enginePower?: number;
    transmission?: string;
    transmissionTypeId?: unknown;
    numOfGears?: number;
    driveTypeId?: unknown;
    acceleration?: number;
    consumption?: number;
    numOfSeats?: number;
    note?: string;
}

export interface PowertrainsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface PowertrainsListResponse {
    data?: Powertrain[];
    meta?: PowertrainsListMeta;
}

export interface PowertrainsQuery {
    limit: number;
    page: number;
    filter?: {
        generationId?: string;
    };
}

export interface CreatePowertrainPayload {
    isHidden: boolean;
    generationId: string;
    name: string;
    order: number;
    engine: string;
    engineTypeId: string;
    enginePower: number;
    transmission: string;
    transmissionTypeId: string;
    numOfGears: number;
    driveTypeId: string;
    acceleration: number;
    consumption: number;
    numOfSeats: number;
    note: string;
}

export interface UpdatePowertrainPayload {
    isHidden: boolean;
    name: string;
    order: number;
    engine: string;
    engineTypeId: string;
    enginePower: number;
    transmission: string;
    transmissionTypeId: string;
    numOfGears: number;
    driveTypeId: string;
    acceleration: number;
    consumption: number;
    numOfSeats: number;
    note: string;
}

/** Body POST /powertrains/value — задать значение характеристики. */
export interface SetPowertrainValuePayload {
    attributeId: string;
    powertrainId: string;
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

/** Body PUT /powertrains/value/:id — обновить значение характеристики. */
export interface UpdatePowertrainValuePayload {
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

interface PowertrainState {
    powertrains: Powertrain[];
    meta: PowertrainsListMeta | null;
    powertrainsObj: PowertrainsQuery;
    currentPowertrain: Powertrain | null;
    loading: boolean;

    getPowertrains: (
        override?: Partial<Pick<PowertrainsQuery, 'page' | 'limit' | 'filter'>>,
    ) => Promise<void>;
    getPowertrainById: (id: string) => Promise<Powertrain>;
    createPowertrain: (payload: CreatePowertrainPayload) => Promise<void>;
    updatePowertrainById: (id: string, payload: UpdatePowertrainPayload) => Promise<void>;
    deletePowertrainById: (id: string) => Promise<void>;
    filterByGeneration: (value: string) => void;
    resetFilter: () => void;

    setPowertrainValue: (payload: SetPowertrainValuePayload) => Promise<void>;
    updatePowertrainValueById: (
        id: string,
        payload: UpdatePowertrainValuePayload,
    ) => Promise<void>;
    deletePowertrainValueById: (id: string) => Promise<void>;
}

export const usePowertrainStore = create<PowertrainState>((set, get) => ({
    powertrains: [],
    meta: null,
    powertrainsObj: {
        limit: 20,
        page: 1,
    },
    currentPowertrain: null,
    loading: false,

    getPowertrains: async (override) => {
        const powertrainsObj = { ...get().powertrainsObj, ...override };
        set({ powertrainsObj, loading: true });
        const queryString = qs.stringify(powertrainsObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/powertrains?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as PowertrainsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                powertrains: list,
                meta,
                powertrainsObj: {
                    ...powertrainsObj,
                    page: meta?.page ?? powertrainsObj.page,
                    limit: meta?.limit ?? powertrainsObj.limit,
                    filter: powertrainsObj.filter,
                },
                loading: false,
            });
        } catch {
            set({ powertrains: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить силовые агрегаты');
        }
    },

    createPowertrain: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/powertrains`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getPowertrains();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать силовой агрегат');
        }
    },

    updatePowertrainById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/powertrains/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getPowertrains();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить силовой агрегат');
        }
    },

    deletePowertrainById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/powertrains/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentPowertrain:
                    s.currentPowertrain?.id === id ? null : s.currentPowertrain,
            }));
            await get().getPowertrains();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить силовой агрегат');
        }
    },

    getPowertrainById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/powertrains/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentPowertrain = res.data as Powertrain;
            set({ loading: false, currentPowertrain });
            return currentPowertrain;
        } catch {
            set({ loading: false, currentPowertrain: null });
            throw new Error('Не удалось получить силовой агрегат');
        }
    },

    filterByGeneration: (value) =>
        set((state) => ({
            powertrainsObj: {
                ...state.powertrainsObj,
                page: 1,
                filter: { ...(state.powertrainsObj.filter ?? {}), generationId: value },
            },
        })),

    resetFilter: () =>
        set((state) => ({
            powertrainsObj: {
                limit: state.powertrainsObj.limit,
                page: 1,
            },
        })),

    setPowertrainValue: async (payload) => {
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/powertrains/value`, payload, {
                headers: { accept: '*/*', 'Content-Type': 'application/json' },
            });
        } catch {
            throw new Error('Не удалось задать значение характеристики');
        }
    },

    updatePowertrainValueById: async (id, payload) => {
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/powertrains/value/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: '*/*', 'Content-Type': 'application/json' },
                },
            );
        } catch {
            throw new Error('Не удалось обновить значение характеристики');
        }
    },

    deletePowertrainValueById: async (id) => {
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/powertrains/value/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
        } catch {
            throw new Error('Не удалось удалить значение характеристики');
        }
    },
}));
