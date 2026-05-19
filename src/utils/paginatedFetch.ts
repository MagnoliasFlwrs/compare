import qs from 'qs';
import { axiosInstanceAll } from '../store';

export interface PaginatedListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

interface PaginatedListResponse<T> {
    data?: T[];
    meta?: PaginatedListMeta;
}

/** Один запрос к пагинированному списку API. */
export async function fetchListPage<T>(
    url: string,
    query: Record<string, unknown>,
): Promise<{ data: T[]; meta: PaginatedListMeta | null }> {
    const queryString = qs.stringify(query, { arrayFormat: 'indices', skipNulls: true });
    const res = await axiosInstanceAll.get(`${url}?${queryString}`, {
        headers: { accept: 'application/json' },
    });
    const body = res.data as PaginatedListResponse<T>;
    return {
        data: Array.isArray(body?.data) ? body.data : [],
        meta: body?.meta ?? null,
    };
}

/** Загружает все страницы (лимит API обычно 100 на страницу). */
export async function fetchAllPages<T>(
    url: string,
    baseQuery: Record<string, unknown>,
    pageSize = 100,
): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    for (;;) {
        const { data, meta } = await fetchListPage<T>(url, {
            ...baseQuery,
            page,
            limit: pageSize,
        });
        all.push(...data);
        if (!meta?.hasNextPage || data.length === 0) break;
        page += 1;
        if (page > 200) break;
    }
    return all;
}
