import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface Brand {
    id: string;
    name: string;
    isHidden: boolean;
    logoId: string | null;
    logoUrl?: string;
}

export interface BrandsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface BrandsListResponse {
    data?: Brand[];
    meta?: BrandsListMeta;
}

export interface BrandPayload {
    name: string;
    logoId: string;
    isHidden: boolean;
}

export interface BrandsQuery {
    page: number;
    limit: number;
}

interface BrandsState {
    brands: Brand[];
    meta: BrandsListMeta | null;
    brandsObj: BrandsQuery;
    loading: boolean;
    currentBrand: Brand | null;
    currentLoading: boolean;

    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    clearCurrent: () => void;

    getBrands: (override?: Partial<BrandsQuery>) => Promise<void>;
    getBrandById: (id: string) => Promise<Brand>;
    createBrand: (payload: BrandPayload) => Promise<void>;
    updateBrand: (id: string, payload: BrandPayload) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
}

export const useBrandsStore = create<BrandsState>((set, get) => ({
    brands: [],
    meta: null,
    brandsObj: {
        page: 1,
        limit: 20,
    },
    loading: false,
    currentBrand: null,
    currentLoading: false,

    setPage: (page) =>
        set((s) => ({
            brandsObj: { ...s.brandsObj, page },
        })),

    setLimit: (limit) =>
        set((s) => ({
            brandsObj: { ...s.brandsObj, limit },
        })),

    clearCurrent: () => set({ currentBrand: null }),

    getBrands: async (override) => {
        const brandsObj = { ...get().brandsObj, ...override };
        set({ brandsObj, loading: true });
        const queryString = qs.stringify(brandsObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/brands?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as BrandsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                brands: list,
                meta,
                brandsObj: {
                    page: meta?.page ?? brandsObj.page,
                    limit: meta?.limit ?? brandsObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ brands: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить бренды');
        }
    },

    getBrandById: async (id) => {
        set({ currentLoading: true });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/brands/${encodeURIComponent(id)}`, {
                headers: { accept: 'application/json' },
            });
            const currentBrand = res.data as Brand;
            set({ currentBrand, currentLoading: false });
            return currentBrand;
        } catch {
            set({ currentBrand: null, currentLoading: false });
            throw new Error('Не удалось загрузить бренд');
        }
    },

    createBrand: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/brands`, payload, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            set({ loading: false });
            await get().getBrands();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать бренд');
        }
    },

    updateBrand: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(`${baseAuthUrl}/brands/${encodeURIComponent(id)}`, payload, {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            set({ loading: false });
            await get().getBrands();
            const cur = get().currentBrand;
            if (cur?.id === id) {
                await get().getBrandById(id);
            }
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить бренд');
        }
    },

    deleteBrand: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/brands/${encodeURIComponent(id)}`, {
                headers: { accept: '*/*' },
            });
            set((s) => ({
                loading: false,
                currentBrand: s.currentBrand?.id === id ? null : s.currentBrand,
            }));
            await get().getBrands();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить бренд');
        }
    },
}));
