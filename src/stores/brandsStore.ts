import { create } from 'zustand';
import { axiosInstanceAll, baseAuthUrl } from '../store';

const brandsPath = '/brands';

export interface Brand {
    id: string;
    name: string;
    isHidden: boolean;
    logoId: string | null;
}

export interface BrandPayload {
    name: string;
    logoId: string;
    isHidden: boolean;
}

interface BrandsState {
    brands: Brand[];
    total: number;
    page: number;
    limit: number;
    loading: boolean;
    currentBrand: Brand | null;
    currentLoading: boolean;

    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    clearCurrent: () => void;

    getBrands: (override?: { page?: number; limit?: number }) => Promise<void>;
    getBrandById: (id: string) => Promise<Brand | null>;
    createBrand: (payload: BrandPayload) => Promise<void>;
    updateBrand: (id: string, payload: BrandPayload) => Promise<void>;
    deleteBrand: (id: string) => Promise<void>;
}

export const useBrandsStore = create<BrandsState>((set, get) => ({
    brands: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,
    currentBrand: null,
    currentLoading: false,

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit }),
    clearCurrent: () => set({ currentBrand: null }),

    getBrands: async (override) => {
        const { page: curPage, limit: curLimit } = get();
        const page = override?.page ?? curPage;
        const limit = override?.limit ?? curLimit;
        set({ loading: true, page, limit });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}${brandsPath}`, {
                params: { limit, page },
                headers: { accept: 'application/json' },
            });

            set({ brands: res.data, loading: false });
        } catch {
            set({ brands: [], total: 0, loading: false });
            throw new Error('Не удалось загрузить бренды');
        }
    },

    getBrandById: async (id) => {
        set({ currentLoading: true });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}${brandsPath}/${encodeURIComponent(id)}`, {
                headers: { accept: 'application/json' },
            });
            set({ currentBrand: res.data, currentLoading: false });
            return res.data;
        } catch {
            set({ currentBrand: null, currentLoading: false });
            throw new Error('Не удалось загрузить бренд');
        }
    },

    createBrand: async (payload) => {
        await axiosInstanceAll.post(`${baseAuthUrl}${brandsPath}`, payload, {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        await get().getBrands();
    },

    updateBrand: async (id, payload) => {
        await axiosInstanceAll.put(`${baseAuthUrl}${brandsPath}/${encodeURIComponent(id)}`, payload, {
            headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        await get().getBrands();
        const cur = get().currentBrand;
        if (cur?.id === id) {
            await get().getBrandById(id);
        }
    },

    deleteBrand: async (id) => {
        await axiosInstanceAll.delete(`${baseAuthUrl}${brandsPath}/${encodeURIComponent(id)}`, {
            headers: { accept: '*/*' },
        });
        set((s) => ({
            currentBrand:null,
        }));
        await get().getBrands();
    },
}));
