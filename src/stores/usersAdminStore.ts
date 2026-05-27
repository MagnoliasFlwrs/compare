import { create } from 'zustand';
import { axiosInstanceAll, baseAuthUrl } from '../store';

const usersListPath = '/users';

export interface UsersAdminRow {
    id: string;
    username: string;
    brands?: Array<{ brandId: string; userId: string }>;
}

function isBrandLink(x: unknown): x is { brandId: string; userId: string } {
    if (!x || typeof x !== 'object') return false;
    const obj = x as Record<string, unknown>;
    return typeof obj.brandId === 'string' && typeof obj.userId === 'string';
}

function normalizeUserRow(raw: Record<string, unknown>): UsersAdminRow | null {
    const id = raw.id ?? raw.userId;
    const username = raw.username;
    if (id == null || username == null) return null;
    const brandsRaw = raw.brands;
    const brands = Array.isArray(brandsRaw)
        ? brandsRaw
              .map((b) => {
                  if (!b || typeof b !== 'object') return null;
                  const obj = b as Record<string, unknown>;
                  const brandId = obj.brandId;
                  const userId = obj.userId;
                  if (brandId == null || userId == null) return null;
                  return { brandId: String(brandId), userId: String(userId) };
              })
              .filter(isBrandLink)
        : undefined;
    return { id: String(id), username: String(username), brands };
}

function parseListResponse(data: unknown): { items: UsersAdminRow[]; total: number } {
    if (Array.isArray(data)) {
        const items = data
            .map((row) => (row && typeof row === 'object' ? normalizeUserRow(row as Record<string, unknown>) : null))
            .filter(Boolean) as UsersAdminRow[];
        return { items, total: items.length };
    }
    if (!data || typeof data !== 'object') {
        return { items: [], total: 0 };
    }
    let d = data as Record<string, unknown>;
    const inner = d.data;
    if (Array.isArray(inner)) {
        return parseListResponse(inner);
    }
    if (inner && typeof inner === 'object') {
        d = inner as Record<string, unknown>;
    }
    const rawList = d.items ?? d.data ?? d.users ?? d.results;
    const list = Array.isArray(rawList) ? rawList : [];
    const items = list
        .map((row) => (row && typeof row === 'object' ? normalizeUserRow(row as Record<string, unknown>) : null))
        .filter(Boolean) as UsersAdminRow[];
    const totalRaw = d.total ?? d.totalCount ?? d.count ?? d.totalItems;
    const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || items.length;
    return { items, total };
}

interface UsersAdminState {
    users: UsersAdminRow[];
    total: number;
    page: number;
    limit: number;
    loading: boolean;
    fetchUsers: (override?: { page?: number; limit?: number }) => Promise<void>;
    setPage: (page: number) => void;
    setLimit: (limit: number) => void;
    createUser: (payload: { username: string; password: string }) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    assignUserBrands: (userId: string, brandIds: string[]) => Promise<void>;
}

export const useUsersAdminStore = create<UsersAdminState>((set, get) => ({
    users: [],
    total: 0,
    page: 1,
    limit: 20,
    loading: false,

    setPage: (page) => set({ page }),
    setLimit: (limit) => set({ limit }),

    fetchUsers: async (override) => {
        const { page: curPage, limit: curLimit } = get();
        const page = override?.page ?? curPage;
        const limit = override?.limit ?? curLimit;
        set({ loading: true, page, limit });
        try {
            const res = await axiosInstanceAll.get(`${baseAuthUrl}${usersListPath}`, {
                params: { limit, page },
                headers: { accept: 'application/json' },
            });
            const { items, total } = parseListResponse(res.data);
            set({ users: items, total, loading: false });
        } catch {
            set({ users: [], total: 0, loading: false });
            throw new Error('Не удалось загрузить пользователей');
        }
    },

    createUser: async ({ username, password }) => {
        await axiosInstanceAll.post(
            `${baseAuthUrl}${usersListPath}`,
            { username, password },
            {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            },
        );
        await get().fetchUsers();
    },

    deleteUser: async (id) => {
        await axiosInstanceAll.delete(`${baseAuthUrl}${usersListPath}/${encodeURIComponent(id)}`, {
            headers: { accept: '*/*' },
        });
        await get().fetchUsers();
    },

    assignUserBrands: async (userId, brandIds) => {
        await axiosInstanceAll.post(
            `${baseAuthUrl}${usersListPath}/${encodeURIComponent(userId)}/brands`,
            { brandIds },
            {
                headers: {
                    accept: '*/*',
                    'Content-Type': 'application/json',
                },
            },
        );
        await get().fetchUsers();
    },
}));
