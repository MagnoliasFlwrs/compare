import { create } from 'zustand';
import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';

export interface DriveType {
    id: string;
    name: string;
}

export interface DriveTypesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface DriveTypesListResponse {
    data?: DriveType[];
    meta?: DriveTypesListMeta;
}

export interface DriveTypesQuery {
    limit: number;
    page: number;
}

export interface DriveTypePayload {
    name: string;
}

interface DriveTypesState {
    driveTypes: DriveType[];
    meta: DriveTypesListMeta | null;
    driveTypesObj: DriveTypesQuery;
    currentDriveType: DriveType | null;
    loading: boolean;

    getDriveTypes: (override?: Partial<DriveTypesQuery>) => Promise<void>;
    getDriveTypeById: (id: string) => Promise<DriveType>;
    createDriveType: (payload: DriveTypePayload) => Promise<void>;
    updateDriveTypeById: (id: string, payload: DriveTypePayload) => Promise<void>;
    deleteDriveTypeById: (id: string) => Promise<void>;
}

export const useDriveTypesStore = create<DriveTypesState>((set, get) => ({
    driveTypes: [],
    meta: null,
    driveTypesObj: {
        limit: 20,
        page: 1,
    },
    currentDriveType: null,
    loading: false,

    getDriveTypes: async (override) => {
        const driveTypesObj = { ...get().driveTypesObj, ...override };
        set({ driveTypesObj, loading: true });
        const queryString = qs.stringify(driveTypesObj, {
            arrayFormat: 'indices',
            skipNulls: true,
        });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/drive-types?${queryString}`,
                { headers: { accept: 'application/json' } },
            );
            const body = res.data as DriveTypesListResponse;
            const list = Array.isArray(body?.data) ? body.data : [];
            const meta = body?.meta ?? null;
            set({
                driveTypes: list,
                meta,
                driveTypesObj: {
                    page: meta?.page ?? driveTypesObj.page,
                    limit: meta?.limit ?? driveTypesObj.limit,
                },
                loading: false,
            });
        } catch {
            set({ driveTypes: [], meta: null, loading: false });
            throw new Error('Не удалось загрузить типы привода');
        }
    },

    createDriveType: async (payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.post(`${baseAuthUrl}/drive-types`, payload, {
                headers: { accept: 'application/json', 'Content-Type': 'application/json' },
            });
            set({ loading: false });
            await get().getDriveTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось создать тип привода');
        }
    },

    updateDriveTypeById: async (id, payload) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.put(
                `${baseAuthUrl}/drive-types/${encodeURIComponent(id)}`,
                payload,
                {
                    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
                },
            );
            set({ loading: false });
            await get().getDriveTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось обновить тип привода');
        }
    },

    deleteDriveTypeById: async (id) => {
        set({ loading: true });
        try {
            await axiosInstanceAll.delete(
                `${baseAuthUrl}/drive-types/${encodeURIComponent(id)}`,
                { headers: { accept: '*/*' } },
            );
            set((s) => ({
                loading: false,
                currentDriveType:
                    s.currentDriveType?.id === id ? null : s.currentDriveType,
            }));
            await get().getDriveTypes();
        } catch {
            set({ loading: false });
            throw new Error('Не удалось удалить тип привода');
        }
    },

    getDriveTypeById: async (id) => {
        set({ loading: true });
        try {
            const res = await axiosInstanceAll.get(
                `${baseAuthUrl}/drive-types/${encodeURIComponent(id)}`,
                { headers: { accept: 'application/json' } },
            );
            const currentDriveType = res.data as DriveType;
            set({ loading: false, currentDriveType });
            return currentDriveType;
        } catch {
            set({ loading: false, currentDriveType: null });
            throw new Error('Не удалось получить тип привода');
        }
    },
}));
