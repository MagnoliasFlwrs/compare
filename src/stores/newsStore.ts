import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface News {
    id: string;
    text: string;
    brandId: string;
    createdAt: string;
}

export interface NewsListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface NewsListResponse {
    data?: News[];
    meta?: NewsListMeta;
}

export interface NewsQuery {
    limit: number;
    page: number;
    filter?: {
        brandId: string;
    };
}

export interface NewsUpdatePayload {
    brandId: string;
    text: string;
}

interface NewsState {
    news: News[];
    meta: NewsListMeta | null;
    newsObj: NewsQuery;
    currentNews: News | null;
    loading: boolean;

    getNews: (override?: Partial<Pick<NewsQuery, 'page' | 'limit' | 'filter'>>) => Promise<void>;
    createNews: (brandId: string, text: string) => Promise<void>;
    updateNewsById: (id: string, payload: NewsUpdatePayload) => Promise<void>;
    deleteNewsById: (id: string) => Promise<void>;
    getNewsById: (id: string) => Promise<News>;
    filterByBrand: (value: string) => void;
    resetFilter: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
    news: [],
    meta: null,
    newsObj: {
        limit: 20,
        page: 1,
    },
    currentNews: null,
    loading: false,

    getNews: async (override) => {
        const newsObj = { ...get().newsObj, ...override };
        set({ newsObj, loading: true });
        const queryString = qs.stringify(newsObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/news?${queryString}`, {
                headers: { accept: 'application/json' },
            });
            const body = res.data as NewsListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                news: list,
                meta,
                newsObj: {
                    ...newsObj,
                    page: meta?.page ?? newsObj.page,
                    limit: meta?.limit ?? newsObj.limit,
                    filter: newsObj.filter,
                },
                loading: false,
            });
        } catch {
            set({ news: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить новости');
        }
    },

    createNews: async (brandId, text) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(
                `${baseAuthUrl}/news`,
                { brandId, text },
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getNews();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать новость');
        }
    },

    updateNewsById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(`${baseAuthUrl}/news/${encodeURIComponent(id)}`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getNews();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить новость');
        }
    },

    deleteNewsById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(`${baseAuthUrl}/news/${encodeURIComponent(id)}`, {
                headers: { accept: '*/*' },
            });
            set((s) => ({
                loading: false,
                currentNews: s.currentNews?.id === id ? null : s.currentNews,
            }));
            await get().getNews();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить новость');
        }
    },

    getNewsById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/news/${encodeURIComponent(id)}`, {
                headers: { accept: 'application/json' },
            });
            const currentNews = res.data as News;
            set({ loading: false, currentNews });
            return currentNews;
        } catch {
            set({ loading: false, currentNews: null });
            throw new Error('Не удалось получить новость');
        }
    },

    filterByBrand: (value) =>
        set((state) => ({
            newsObj: {
                ...state.newsObj,
                page: 1,
                filter: { brandId: value },
            },
        })),

    resetFilter: () =>
        set((state) => ({
            newsObj: {
                limit: state.newsObj.limit,
                page: 1,
            },
        })),
}));
