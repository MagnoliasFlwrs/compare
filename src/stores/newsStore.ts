import {create} from "zustand";
import {axiosInstanceAll, baseAuthUrl} from "../store";
import qs from 'qs';


export const useNewsStore = create((set, get) => ({
    news: [],
    newsObj: {
        limit:20,
        page: 1,
    },
    currentNews: null,

    getNews: async () => {
        const queryString = qs.stringify(get().newsObj, {
            arrayFormat: 'indices',
        });

        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}/news?${queryString}`, {
                headers: { accept: 'application/json' },
            });

            set({ news: res.data, loading: false });
        } catch {
            set({ loading: false });
            throw new Error('Не удалось загрузить бренды');
        }
    },

    filterByBrand: (value) =>
        set((state) => ({
            newsObj: {
                ...state.newsObj,
                filter: {
                    brandId: value,
                },
            },
        })),
    resetFilter: () => set((state) => ({
        newsObj: {
            limit:20,
            page: 1,
        },
    }))
}));