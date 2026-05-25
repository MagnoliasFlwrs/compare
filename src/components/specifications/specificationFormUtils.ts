import type { Specification } from '../../stores/specificationStore';
import { pickIdString } from '../../utils/pickIdString';
import {
    formatWarrantyString,
    parseWarrantyString,
    type WarrantyFormFields,
} from './warrantyFormUtils';

export type SpecificationFormValues = {
    name: string;
    isPublished: boolean;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    countryId: string;
    bodyTypeId: string;
} & WarrantyFormFields;

export const SPECIFICATION_FORM_DEFAULTS: SpecificationFormValues = {
    name: '',
    isPublished: true,
    length: 0,
    width: 0,
    height: 0,
    wheelbase: 0,
    clearance: 0,
    tank: 0,
    trunkStandardVolume: 0,
    trunkMaximumVolume: 0,
    countryId: '',
    bodyTypeId: '',
    warrantyKind: 'years',
    warrantyYears: null,
    warrantyKm: null,
};

export function specificationToFormValues(spec: Specification): SpecificationFormValues {
    return {
        name: spec.name,
        isPublished: !spec.isHidden,
        length: spec.length,
        width: spec.width,
        height: spec.height,
        wheelbase: spec.wheelbase,
        clearance: spec.clearance,
        tank: spec.tank,
        trunkStandardVolume: spec.trunkStandardVolume,
        trunkMaximumVolume: spec.trunkMaximumVolume,
        countryId: pickIdString(spec.countryId),
        bodyTypeId: pickIdString(spec.bodyTypeId),
        ...parseWarrantyString(spec.warranty ?? ''),
    };
}

export function normalizeSpecificationFormValues(
    values: SpecificationFormValues,
): {
    isHidden: boolean;
    name: string;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    countryId: string;
    bodyTypeId: string;
    warranty: string;
} {
    return {
        name: values.name.trim(),
        isHidden: !values.isPublished,
        length: Number(values.length ?? 0),
        width: Number(values.width ?? 0),
        height: Number(values.height ?? 0),
        wheelbase: Number(values.wheelbase ?? 0),
        clearance: Number(values.clearance ?? 0),
        tank: Number(values.tank ?? 0),
        trunkStandardVolume: Number(values.trunkStandardVolume ?? 0),
        trunkMaximumVolume: Number(values.trunkMaximumVolume ?? 0),
        countryId: (values.countryId ?? '').trim(),
        bodyTypeId: (values.bodyTypeId ?? '').trim(),
        warranty: formatWarrantyString(values),
    };
}
