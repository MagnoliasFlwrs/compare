import qs from 'qs';
import { axiosInstanceAll, baseAuthUrl } from '../store';
import type { AttributeCategory } from '../types/attributes';
import type {
    EntityAttributeValue,
    EntityAttributeValueListItem,
    EntityAttributeValuesListMeta,
    EntityAttributeValuesListResponse,
    EntityValueResource,
} from '../types/entityAttributeValue';
import { fetchAllPages } from './paginatedFetch';
import { pickIdString } from './pickIdString';

export const ENTITY_VALUE_CONFIG: Record<
    EntityValueResource,
    { category: AttributeCategory; entityIdKey: string }
> = {
    trims: { category: 'TRIM', entityIdKey: 'trimId' },
    specifications: { category: 'SPECIFICATION', entityIdKey: 'specificationId' },
    powertrains: { category: 'POWERTRAIN', entityIdKey: 'powertrainId' },
};

function valuesUrl(resource: EntityValueResource): string {
    return `${baseAuthUrl}/${resource}/value`;
}

export function entityValuesListUrl(resource: EntityValueResource): string {
    return `${valuesUrl(resource)}/list`;
}

export type SetEntityAttributeValuePayload = {
    attributeId: string;
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
};

export type UpdateEntityAttributeValuePayload = Omit<
    SetEntityAttributeValuePayload,
    'attributeId'
>;

export type EntityAttributeValuesListQuery = {
    limit: number;
    page: number;
    trimId?: string;
    specificationId?: string;
    powertrainId?: string;
};

/** Одна страница GET /{resource}/value/list. */
export async function getEntityAttributeValuesListPage(
    resource: EntityValueResource,
    query: EntityAttributeValuesListQuery,
): Promise<{ data: EntityAttributeValueListItem[]; meta: EntityAttributeValuesListMeta | null }> {
    const queryString = qs.stringify(query, { arrayFormat: 'indices', skipNulls: true });
    const res = await axiosInstanceAll.get(
        `${entityValuesListUrl(resource)}?${queryString}`,
        { headers: { accept: 'application/json' } },
    );
    const body = res.data as EntityAttributeValuesListResponse;
    return {
        data: Array.isArray(body?.data) ? body.data : [],
        meta: body?.meta ?? null,
    };
}

/** Все значения сущности (обход пагинации, лимит 100 на страницу). */
export async function listEntityAttributeValues(
    resource: EntityValueResource,
    entityId: string,
): Promise<EntityAttributeValueListItem[]> {
    const { entityIdKey } = ENTITY_VALUE_CONFIG[resource];
    return fetchAllPages<EntityAttributeValueListItem>(entityValuesListUrl(resource), {
        [entityIdKey]: entityId,
    });
}

/** Словарь attributeId → значение из списка API. */
export function entityAttributeValuesToMap(
    items: EntityAttributeValueListItem[],
): Record<string, EntityAttributeValue> {
    const out: Record<string, EntityAttributeValue> = {};
    for (const item of items) {
        const attrId = pickIdString(item.attributeId) || item.attribute?.id;
        if (attrId) out[attrId] = item;
    }
    return out;
}

/** POST /{resource}/value — задать значение. */
export async function createEntityAttributeValue(
    resource: EntityValueResource,
    entityId: string,
    payload: SetEntityAttributeValuePayload,
): Promise<EntityAttributeValue | null> {
    const { entityIdKey } = ENTITY_VALUE_CONFIG[resource];
    const res = await axiosInstanceAll.post(
        valuesUrl(resource),
        { ...payload, [entityIdKey]: entityId },
        { headers: { accept: 'application/json', 'Content-Type': 'application/json' } },
    );
    if (res.data && typeof res.data === 'object' && 'id' in res.data) {
        return res.data as EntityAttributeValue;
    }
    return null;
}

/** PUT /{resource}/value/:id */
export async function updateEntityAttributeValue(
    resource: EntityValueResource,
    valueId: string,
    payload: UpdateEntityAttributeValuePayload,
): Promise<EntityAttributeValue | null> {
    const res = await axiosInstanceAll.put(
        `${valuesUrl(resource)}/${encodeURIComponent(valueId)}`,
        payload,
        { headers: { accept: 'application/json', 'Content-Type': 'application/json' } },
    );
    if (res.data && typeof res.data === 'object' && 'id' in res.data) {
        return res.data as EntityAttributeValue;
    }
    return null;
}

/** DELETE /{resource}/value/:id */
export async function deleteEntityAttributeValue(
    resource: EntityValueResource,
    valueId: string,
): Promise<void> {
    await axiosInstanceAll.delete(`${valuesUrl(resource)}/${encodeURIComponent(valueId)}`, {
        headers: { accept: '*/*' },
    });
}
