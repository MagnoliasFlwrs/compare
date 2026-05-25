import type { Powertrain, UpdatePowertrainPayload } from '../../stores/powertrainStore';
import { pickIdString } from '../../utils/pickIdString';

export type PowertrainFormValues = {
    name: string;
    isPublished: boolean;
    order: number;
    engine: string;
    engineTypeId: string;
    enginePower: number | null;
    transmission: string;
    transmissionTypeId: string;
    numOfGears: number | null;
    driveTypeId: string;
    acceleration: number | null;
    consumption: number | null;
    numOfSeats: number | null;
    note: string;
};

function toApiDecimal(value: unknown): string {
    if (value === null || value === undefined || value === '') return '0.0';
    const n = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(n)) return '0.0';
    if (Number.isInteger(n)) return `${n}.0`;
    return String(n);
}

export const powertrainFormDefaults = (defaultOrder = 0): PowertrainFormValues => ({
    name: '',
    isPublished: true,
    order: defaultOrder,
    engine: '',
    engineTypeId: '',
    enginePower: null,
    transmission: '',
    transmissionTypeId: '',
    numOfGears: null,
    driveTypeId: '',
    acceleration: null,
    consumption: null,
    numOfSeats: null,
    note: '',
});

export function powertrainToFormValues(pt: Powertrain): PowertrainFormValues {
    return {
        name: pt.name,
        isPublished: !pt.isHidden,
        order: pt.order ?? 0,
        engine: pt.engine ?? '',
        engineTypeId: pickIdString(pt.engineTypeId),
        enginePower: pt.enginePower ?? null,
        transmission: pt.transmission ?? '',
        transmissionTypeId: pickIdString(pt.transmissionTypeId),
        numOfGears: pt.numOfGears ?? null,
        driveTypeId: pickIdString(pt.driveTypeId),
        acceleration: pt.acceleration ?? null,
        consumption: pt.consumption ?? null,
        numOfSeats: pt.numOfSeats ?? null,
        note: pt.note ?? '',
    };
}

export function normalizePowertrainFormValues(
    values: PowertrainFormValues,
): Omit<UpdatePowertrainPayload, never> {
    return {
        name: values.name.trim(),
        isHidden: !values.isPublished,
        order: Number(values.order ?? 0),
        engine: (values.engine ?? '').trim(),
        engineTypeId: (values.engineTypeId ?? '').trim(),
        enginePower: Number(values.enginePower ?? 0),
        transmission: (values.transmission ?? '').trim(),
        transmissionTypeId: (values.transmissionTypeId ?? '').trim(),
        numOfGears: Number(values.numOfGears ?? 0),
        driveTypeId: (values.driveTypeId ?? '').trim(),
        acceleration: toApiDecimal(values.acceleration),
        consumption: toApiDecimal(values.consumption),
        numOfSeats: Number(values.numOfSeats ?? 0),
        note: (values.note ?? '').trim(),
    };
}
