import { create } from 'zustand';
import axios from 'axios';
import { persist } from "zustand/middleware";
import {Mutex} from "async-mutex";

export const baseAuthUrl = import.meta.env.VITE_APP_AUTH_URL || 'http://46.16.35.169/api/v1';

/** Пути API (относительно `baseAuthUrl`) */
export const authEndpoints = {
    changeOwnPassword: '/auth/change-own-password',
    usersSelf: '/users/self',
} as const;

export const axiosInstanceAuth = axios.create();
const axiosInstanceAll = axios.create();

// Fix: Add explicit type for refreshTokenPromise
let refreshTokenPromise: Promise<string | null> | null = null;
let isRefreshingToken = false;
let isSignOut = false;
const mutex = new Mutex();

const refreshToken = async (): Promise<string | null> => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            const res = await axios.post(
                `${baseAuthUrl}/auth/refresh`,
                { refreshToken },
                { withCredentials: true },
            );
            if (res.status === 200) {
                if ('accessToken' in res.data) {
                    localStorage.setItem('accessToken', res.data.accessToken);
                }
                if ('refreshToken' in res.data)
                    localStorage.setItem('refreshToken', res.data.refreshToken);
                return res.data.accessToken;
            } else {
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('employee');
                localStorage.removeItem('maintenance');
                localStorage.removeItem('auth');
            }
        } else {
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('employee');
            localStorage.removeItem('maintenance');
            localStorage.removeItem('auth');

        }
        return null;
    } finally {
        isRefreshingToken = false;
    }
};

axiosInstanceAll.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');

        if (accessToken) config.headers['Authorization'] = `Bearer ${accessToken}`;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

axiosInstanceAll.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response && error.response.status === 401 && !isSignOut) {
            const release = await mutex.acquire();
            try {
                if (!isRefreshingToken) {
                    isRefreshingToken = true;

                    if (!refreshTokenPromise) refreshTokenPromise = refreshToken();
                }
                const newAccessToken = await refreshTokenPromise;
                if (newAccessToken) {
                    const originalRequest = error.config;
                    originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axios(originalRequest);
                } else {
                    refreshTokenPromise = null;
                    release();
                }
            } catch (refreshError) {
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('auth');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                refreshTokenPromise = null;
                release();
            }
        }

        return Promise.reject(error);
    },
);

export { axiosInstanceAll };

interface UserData {
    login: string;
    password: string;
}

export interface SelfUser {
    id: string;
    username: string;
}

interface AuthState {
    error: boolean;
    isAuth: boolean;
    loading: boolean;
    accessToken: string | null;
    user: any | null;
    selfUser: SelfUser | null;
    setError: (value: boolean) => void;
    authUser: (userData: UserData) => Promise<any>;
    fetchSelfUser: () => Promise<void>;
    changeOwnPassword: (payload: { oldPassword: string; newPassword: string }) => Promise<void>;
    logout: () => void;
}

type Tokens = { accessToken: string | null; refreshToken: string | null };

function decodeJwtPayload(token: string): any | null {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLen);

    try {
        const json = decodeURIComponent(
            atob(padded)
                .split('')
                .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
                .join(''),
        );
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/** JWT payload из `user`: роль ADMIN и право ManageUsers — доступ к админке пользователей */
export function canAccessUsersAdmin(user: unknown): boolean {
    if (!user || typeof user !== 'object') return false;
    const u = user as { role?: unknown; permissions?: unknown };
    if (u.role !== 'ADMIN') return false;
    if (!Array.isArray(u.permissions)) return false;
    return u.permissions.includes('ManageUsers');
}

function extractTokens(payload: any): Tokens {
    const root = payload?.data ?? payload;
    const accessToken =
        root?.access_token ?? root?.accessToken ?? root?.access_token?.token ?? null;
    const refreshToken =
        root?.refresh_token ?? root?.refreshToken ?? root?.refresh_token?.token ?? null;
    return {
        accessToken: typeof accessToken === 'string' ? accessToken : null,
        refreshToken: typeof refreshToken === 'string' ? refreshToken : null,
    };
}

export const useAuth = create(
    persist<AuthState>(
        (set, get) => ({
            error: false,
            isAuth: false,
            loading: false,
            accessToken: null,
            user: null,
            selfUser: null,
            setError: (value: boolean) => set({ error: value }),
            fetchSelfUser: async () => {

                try {
                    const res = await axiosInstanceAll.get<SelfUser>(
                        `${baseAuthUrl}${authEndpoints.usersSelf}`,
                        { headers: { accept: 'application/json' } },
                    );
                    if (res.status === 200 && res.data) {
                        const id = res.data.id as unknown;
                        const username = res.data.username as unknown;
                        if (id != null && username != null) {
                            set({
                                selfUser: {
                                    id: String(id),
                                    username: String(username),
                                },
                            });
                        }
                    }
                } catch {
                    set({ selfUser: null });
                }
            },
            changeOwnPassword: async ({ oldPassword, newPassword }) => {
                await axiosInstanceAll.patch(
                    `${baseAuthUrl}${authEndpoints.changeOwnPassword}`,
                    { oldPassword, newPassword },
                    {
                        headers: {
                            accept: '*/*',
                            'Content-Type': 'application/json',
                        },
                    },
                );
            },
            authUser: async (userData: UserData) => {
                set({ loading: true, error: false });
                try {
                    const res = await axiosInstanceAuth.post(
                        `${baseAuthUrl}/auth/sign-in`,
                        {
                            username: userData.login,
                            password: userData.password,
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        },
                    );

                    const { accessToken, refreshToken } = extractTokens(res.data);

                    if (res.status === 200 && accessToken) {
                        const user = decodeJwtPayload(accessToken);
                        localStorage.setItem('accessToken', accessToken);
                        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

                        set({
                            isAuth: true,
                            accessToken,
                            user,
                            error: false,
                            loading: false,
                        });
                        void get().fetchSelfUser();
                        return res.data;
                    }

                    set({
                        error: true,
                        loading: false,
                        accessToken: null,
                        isAuth: false,
                    });
                    return res.data;
                } catch (error) {
                    set({
                        error: true,
                        loading: false,
                        accessToken: null,
                        isAuth: false
                    });
                }
            },
            logout: () => {
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('auth');
                set({
                    isAuth: false,
                    accessToken: null,
                    user: null,
                    selfUser: null,
                    error: false,
                    loading: false
                });
            },
        }),
        {
            name: 'auth',
            partialize: (state) => ({
                isAuth: state.isAuth,
                user: state.user,
                accessToken: state.accessToken,
                error: state.error,
            } as any),
            onRehydrateStorage: () => (rehydrated, error) => {
                if (error || !rehydrated?.accessToken) return;
                localStorage.setItem('accessToken', rehydrated.accessToken);
            },
        }
    ),
);