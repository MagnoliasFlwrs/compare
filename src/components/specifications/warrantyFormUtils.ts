export type WarrantyKind = 'years' | 'km' | 'years_or_km';

export type WarrantyFormFields = {
    warrantyKind: WarrantyKind;
    warrantyYears: number | null;
    warrantyKm: number | null;
};

export const WARRANTY_KIND_OPTIONS: { value: WarrantyKind; label: string }[] = [
    { value: 'years', label: 'Годы' },
    { value: 'km', label: 'Тыс. км' },
    { value: 'years_or_km', label: 'Годы или тыс. км' },
];

const YEARS_RE = /^(\d+(?:[.,]\d+)?)\s*год/i;
const KM_RE = /^(\d+(?:[.,]\d+)?)\s*тыс\.?\s*км/i;
const BOTH_RE =
    /^(\d+(?:[.,]\d+)?)\s*год[^/]*\/\s*(\d+(?:[.,]\d+)?)\s*тыс\.?\s*км/i;

function parseNum(raw: string): number | null {
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

/** Разбор сохранённой строки гарантии в поля формы. */
export function parseWarrantyString(warranty: string): WarrantyFormFields {
    const trimmed = warranty?.trim() ?? '';
    if (!trimmed) {
        return { warrantyKind: 'years', warrantyYears: null, warrantyKm: null };
    }

    const both = BOTH_RE.exec(trimmed);
    if (both) {
        return {
            warrantyKind: 'years_or_km',
            warrantyYears: parseNum(both[1]),
            warrantyKm: parseNum(both[2]),
        };
    }

    const km = KM_RE.exec(trimmed);
    if (km) {
        return { warrantyKind: 'km', warrantyYears: null, warrantyKm: parseNum(km[1]) };
    }

    const years = YEARS_RE.exec(trimmed);
    if (years) {
        return { warrantyKind: 'years', warrantyYears: parseNum(years[1]), warrantyKm: null };
    }

    return { warrantyKind: 'years', warrantyYears: null, warrantyKm: null };
}

/** Сборка строки гарантии для API. */
export function formatWarrantyString(fields: WarrantyFormFields): string {
    const years = fields.warrantyYears;
    const km = fields.warrantyKm;

    switch (fields.warrantyKind) {
        case 'years':
            return years != null && years > 0 ? `${years} года` : '';
        case 'km':
            return km != null && km > 0 ? `${km} тыс. км` : '';
        case 'years_or_km': {
            const yPart = years != null && years > 0 ? `${years} года` : '';
            const kPart = km != null && km > 0 ? `${km} тыс. км` : '';
            if (yPart && kPart) return `${yPart} / ${kPart}`;
            return yPart || kPart;
        }
        default:
            return '';
    }
}
