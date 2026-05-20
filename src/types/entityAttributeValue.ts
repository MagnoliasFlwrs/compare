/** Запись значения доп. характеристики на сущности (trim / specification / powertrain). */
export interface EntityAttributeValue {
    id: string;
    attributeId: unknown;
    optionId?: unknown;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

export type EntityValueResource = 'trims' | 'specifications' | 'powertrains';
