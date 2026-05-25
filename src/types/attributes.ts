export const ATTRIBUTE_CATEGORIES = ['TRIM', 'SPECIFICATION', 'POWERTRAIN'] as const;
export type AttributeCategory = (typeof ATTRIBUTE_CATEGORIES)[number];

export const ATTRIBUTE_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'RANGE'] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const ADVANTAGE_TYPES = [
    'MORE_IS_BETTER',
    'LESS_IS_BETTER',
    'ENUM_ORDER',
    'NONE',
] as const;
export type AdvantageType = (typeof ADVANTAGE_TYPES)[number];

export interface AttributeOption {
    id: string;
    order: number;
    value: string;
}

export interface Attribute {
    id: string;
    name: string;
    category: AttributeCategory;
    type: AttributeType;
    unit: string;
    advantageType: AdvantageType;
    options?: AttributeOption[];
}

export interface AttributesListMeta {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    itemCount: number;
    limit: number;
    page: number;
    pageCount: number;
}

export interface AttributesQuery {
    limit: number;
    page: number;
    category?: AttributeCategory;
}

export interface CreateAttributePayload {
    name: string;
    category: AttributeCategory;
    type: AttributeType;
    unit: string;
    advantageType: AdvantageType;
}

export interface UpdateAttributePayload {
    name: string;
    unit: string;
    advantageType: AdvantageType;
}

export interface CreateAttributeOptionPayload {
    attributeId: string;
    order: number;
    value: string;
}

export interface UpdateAttributeOptionPayload {
    order: number;
    value: string;
}

export type AttributeFormOptionItem = {
    id?: string;
    value: string;
    order: number;
};

export type AttributeFormValues = {
    name: string;
    category: AttributeCategory;
    type: AttributeType;
    unit: string;
    advantageType: AdvantageType;
    options?: AttributeFormOptionItem[];
};
