import type {
    EntityAttributeValueListItem,
    EntityAttributeValuesListMeta,
    EntityValueResource,
} from '../types/entityAttributeValue';
import {
    ENTITY_VALUE_CONFIG,
    getEntityAttributeValuesListPage,
    listEntityAttributeValues,
    type EntityAttributeValuesListQuery,
} from './entityAttributeValuesApi';

export type EntityValuesStoreSlice = {
    entityValues: EntityAttributeValueListItem[];
    entityValuesMeta: EntityAttributeValuesListMeta | null;
    entityValuesObj: EntityAttributeValuesListQuery;
    entityValuesLoading: boolean;
};

export const defaultEntityValuesObj = (
    resource: EntityValueResource,
): EntityAttributeValuesListQuery => ({
    limit: 20,
    page: 1,
});

export async function fetchEntityValuesListPage(
    resource: EntityValueResource,
    obj: EntityAttributeValuesListQuery,
): Promise<{ data: EntityAttributeValueListItem[]; meta: EntityAttributeValuesListMeta | null }> {
    const { entityIdKey } = ENTITY_VALUE_CONFIG[resource];
    const entityId = obj[entityIdKey as keyof EntityAttributeValuesListQuery];
    if (!entityId || typeof entityId !== 'string') {
        return { data: [], meta: null };
    }
    return getEntityAttributeValuesListPage(resource, obj);
}

export async function fetchAllEntityValues(
    resource: EntityValueResource,
    entityId: string,
): Promise<EntityAttributeValueListItem[]> {
    return listEntityAttributeValues(resource, entityId);
}
