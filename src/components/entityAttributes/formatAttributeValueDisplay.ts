import type { Attribute, AttributeOption } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { pickIdString } from '../../utils/pickIdString';

function optionLabel(options: AttributeOption[] | undefined, optionId: string): string {
    if (!optionId || !options?.length) return '—';
    const found = options.find((o) => o.id === optionId);
    return found?.value?.trim() || '—';
}

export function formatAttributeValueDisplay(
    attribute: Attribute,
    value: EntityAttributeValue | undefined,
): string {
    if (!value) return '—';

    switch (attribute.type) {
        case 'TEXT':
            return value.valueText?.trim() || '—';
        case 'NUMBER':
            if (value.valueNumber == null) return '—';
            return attribute.unit?.trim()
                ? `${value.valueNumber} ${attribute.unit}`
                : String(value.valueNumber);
        case 'BOOLEAN':
            if (value.valueBoolean == null) return '—';
            return value.valueBoolean ? 'Да' : 'Нет';
        case 'SELECT': {
            const id = pickIdString(value.optionId);
            return optionLabel(attribute.options, id);
        }
        case 'RANGE': {
            const from = value.rangeFrom;
            const to = value.rangeTo;
            if (from == null && to == null) return '—';
            const unit = attribute.unit?.trim();
            const suffix = unit ? ` ${unit}` : '';
            if (from != null && to != null) return `${from} – ${to}${suffix}`;
            if (from != null) return `от ${from}${suffix}`;
            if (to != null) return `до ${to}${suffix}`;
            return '—';
        }
        default:
            return '—';
    }
}
