import type { Attribute, AttributeOption } from './attributes';
import type { CarPrice } from '../stores/carPricesStore';
import type { Powertrain } from '../stores/powertrainStore';
import type { Specification } from '../stores/specificationStore';
import type { Trim } from '../stores/trimsStore';
import type { Generation, GenerationImage } from './generation';

/** Значение доп. характеристики в ответе GET /generations/:id/detailed */
export interface GenerationDetailedValue {
    id: string;
    attributeId: string;
    attribute: Attribute;
    optionId?: unknown;
    option?: AttributeOption;
    rangeFrom?: number;
    rangeTo?: number;
    valueBoolean?: boolean;
    valueNumber?: number;
    valueText?: string;
}

export interface GenerationDetailedTrim extends Trim {
    prices?: CarPrice[];
    values?: GenerationDetailedValue[];
}

export interface GenerationDetailedPowertrain extends Powertrain {
    values?: GenerationDetailedValue[];
}

export interface GenerationDetailedSpecification extends Specification {
    values?: GenerationDetailedValue[];
}

export interface GenerationDetailed extends Generation {
    isHidden?: boolean;
    images?: GenerationImage[];
    powertrains?: GenerationDetailedPowertrain[];
    specifications?: GenerationDetailedSpecification[];
    trims?: GenerationDetailedTrim[];
}
