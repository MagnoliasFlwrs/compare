import { axiosInstanceAll, baseAuthUrl } from '../store';
import type { AttributeCategory } from '../types/attributes';
import type { EntityAttributeValue, EntityValueResource } from '../types/entityAttributeValue';
import { fetchAllPages } from './paginatedFetch';

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

/**
 * Список значений сущности. Бэкенд может не отдавать GET — тогда [].
 * Пробуем плоский query-параметр (trimId / specificationId / powertrainId).
 */
export async function listEntityAttributeValues(
    resource: EntityValueResource,
    entityId: string,
): Promise<EntityAttributeValue[]> {
    const { entityIdKey } = ENTITY_VALUE_CONFIG[resource];
    try {
        return await fetchAllPages<EntityAttributeValue>(valuesUrl(resource), {
            [entityIdKey]: entityId,
        });
    } catch {
        return [];
    }
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
