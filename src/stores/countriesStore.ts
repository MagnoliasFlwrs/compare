import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface Country {
    id: string;
    name: string;
}

export interface CountriesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface CountriesListResponse {
    data?: Country[];
    meta?: CountriesListMeta;
}

export interface CountriesQuery {
    limit: number;
    page: number;
}

export interface CountryPayload {
    name: string;
}

interface CountriesState {
    countries: Country[];
    meta: CountriesListMeta | null;
    countriesObj: CountriesQuery;
    currentCountry: Country | null;
    loading: boolean;

    getCountries: (override?: Partial<CountriesQuery>) => Promise<void>;
    getCountryById: (id: string) => Promise<Country>;
    createCountry: (payload: CountryPayload) => Promise<void>;
    updateCountryById: (id: string, payload: CountryPayload) => Promise<void>;
    deleteCountryById: (id: string) => Promise<void>;
}

export const useCountriesStore = create<CountriesState>((set, get) => ({
    countries: [],
    meta: null,
    countriesObj: {
        limit: 20,
        page: 1,
    },
    currentCountry: null,
    loading: false,

    getCountries: async (override) => {
        const countriesObj = { ...get().countriesObj, ...override };
        set({ countriesObj, loading: true });
        const queryString = qs.stringify(countriesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/countries?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as CountriesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                countries: list,
                meta,
                countriesObj: {
                    page: meta?.page ?? countriesObj.page,
                    limit: meta?.limit ?? countriesObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ countries: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить страны');
        }
    },

    createCountry: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/countries`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getCountries();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать страну');
        }
    },

    updateCountryById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/countries/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getCountries();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить страну');
        }
    },

    deleteCountryById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/countries/${encodeURIComponent(id)}`, {
                headers: { accept: '*/*' },
            });
            set((s) => ({
                loading: false,
                currentCountry: s.currentCountry?.id === id ? null : s.currentCountry,
            }));
            await get().getCountries();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить страну');
        }
    },

    getCountryById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/countries/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentCountry = res.data as Country;
            set({ loading: false, currentCountry });
            return currentCountry;
        } catch {
            set({ loading: false, currentCountry: null });
            throw new Error('Не удалось получить страну');
        }
    },
}));
