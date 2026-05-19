import { create } from 'zustand';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import { fetchAllPages } from '../utils/paginatedFetch';
import type { Powertrain } from './powertrainStore';
import type { Trim } from './trimsStore';

export interface CarPrice {
    id: string;
    powertrainId: string;
    trimId: string;
    price: number;
}

export interface CarPricesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface CarPricesListResponse {
    data?: CarPrice[];
    meta?: CarPricesListMeta;
}

export interface CarPricesQuery {
    limit: number;
    page: number;
    powertrainId?: string;
    trimId?: string;
}

export interface CreateCarPricePayload {
    powertrainId: string;
    trimId: string;
    price: number;
}

export interface UpdateCarPricePayload {
    price: number;
}

export type CarPriceMatrixData = {
    trims: Trim[];
    powertrains: Powertrain[];
    priceByCell: Record<string, CarPrice>;
};

function cellKey(powertrainId: string, trimId: string): string {
    return `${powertrainId}:${trimId}`;
}

export function getCarPriceCellKey(powertrainId: string, trimId: string): string {
    return cellKey(powertrainId, trimId);
}

interface CarPricesState {
    loading: boolean;
    saving: boolean;

    fetchMatrixForGeneration: (generationId: string) => Promise<CarPriceMatrixData>;
    createCarPrice: (payload: CreateCarPricePayload) => Promise<CarPrice>;
    updateCarPriceById: (id: string, payload: UpdateCarPricePayload) => Promise<CarPrice>;
    deleteCarPriceById: (id: string) => Promise<void>;
}

export const useCarPricesStore = create<CarPricesState>((set, get) => ({
    loading: false,
    saving: false,

    fetchMatrixForGeneration: async (generationId) => {
        set({ loading: true });
        try {
            const [trims, powertrains, allPrices] = await Promise.all([
                fetchAllPages<Trim>(`${baseAuthUrl}/trims`, {
                    filter: { generationId },
                }),
                fetchAllPages<Powertrain>(`${baseAuthUrl}/powertrains`, {
                    filter: { generationId },
                }),
                fetchAllPages<CarPrice>(`${baseAuthUrl}/car-prices`, {}),
            ]);

            const trimIds = new Set(trims.map((t) => t.id));
            const powertrainIds = new Set(powertrains.map((p) => p.id));

            const sortedTrims = [...trims].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            const sortedPowertrains = [...powertrains].sort(
                (a, b) => (a.order ?? 0) - (b.order ?? 0),
            );

            const priceByCell: Record<string, CarPrice> = {};
            for (const price of allPrices) {
                if (!trimIds.has(price.trimId) || !powertrainIds.has(price.powertrainId)) {
                    continue;
                }
                priceByCell[cellKey(price.powertrainId, price.trimId)] = price;
            }

            set({ loading: false });
            return {
                trims: sortedTrims,
                powertrains: sortedPowertrains,
                priceByCell,
            };
        } catch {
            set({ loading: false });
            throw new Error('Не удалось загрузить данные для матрицы цен');
        }
    },

    createCarPrice: async (payload) => {
        set({ saving: true });
        try {
            const res = await axiosInstanceAll.post(`${baseAuthUrl}/car-prices`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ saving: false });
            return res.data as CarPrice;
        } catch {
            set({ saving: false });
            throw new Error('Не удалось создать цену');
        }
    },

    updateCarPriceById: async (id, payload) => {
        set({ saving: true });
        try {
            const res = await axiosInstanceAll.put(
                `${baseAuthUrl}/car-prices/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ saving: false });
            return res.data as CarPrice;
        } catch {
            set({ saving: false });
            throw new Error('Не удалось обновить цену');
        }
    },

    deleteCarPriceById: async (id) => {
        set({ saving: true });
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/car-prices/${encodeURIComponent(id)}`, {
                headers: { accept: '*/*' },
            });
            set({ saving: false });
        } catch {
            set({ saving: false });
            throw new Error('Не удалось удалить цену');
        }
    },
}));
