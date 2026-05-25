import type { Attribute, AttributeOption } from './attributes';

/** Запись значения доп. характеристики на сущности (trim / specification / powertrain). */
export interface EntityAttributeValue {
    id: string;
    attributeId: unknown;
    attribute?: Attribute;
    optionId?: unknown;
    option?: AttributeOption;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

/** Элемент GET /{resource}/value/list (значение + вложенный attribute). */
export type EntityAttributeValueListItem = EntityAttributeValue;

export interface EntityAttributeValuesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

export interface EntityAttributeValuesListResponse {
    data?: EntityAttributeValueListItem[];
    meta?: EntityAttributeValuesListMeta;
}

export type EntityValueResource = 'trims' | 'specifications' | 'powertrains';
