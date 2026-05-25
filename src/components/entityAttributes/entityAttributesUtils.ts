import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import type { AttributeValueFormValues } from './AttributeValueFormModal';

export function mergeAssignedValue(
    attributeId: string,
    saved: EntityAttributeValue | null,
    form: AttributeValueFormValues,
    attribute: Attribute,
): EntityAttributeValue {
    const id = saved?.id ?? `local-${attributeId}`;
    const base: EntityAttributeValue = {
        id,
        attributeId,
        attribute,
        ...saved,
    };
    switch (attribute.type) {
        case 'TEXT':
            return { ...base, valueText: form.valueText?.trim() };
        case 'NUMBER':
            return { ...base, valueNumber: form.valueNumber };
        case 'BOOLEAN':
            return { ...base, valueBoolean: form.valueBoolean };
        case 'SELECT':
            return { ...base, optionId: form.optionId };
        case 'RANGE':
            return { ...base, rangeFrom: form.rangeFrom, rangeTo: form.rangeTo };
        default:
            return base;
    }
}

export function resolveAttribute(
    attributeId: string,
    value: EntityAttributeValue | undefined,
    catalog: Attribute[],
): Attribute | undefined {
    if (value?.attribute) return value.attribute;
    return catalog.find((a) => a.id === attributeId);
}

export function buildAttributeValuePayload(attr: Attribute, form: AttributeValueFormValues) {
    const base = { attributeId: attr.id };
    switch (attr.type) {
        case 'TEXT':
            return { ...base, valueText: form.valueText?.trim() };
        case 'NUMBER':
            return { ...base, valueNumber: form.valueNumber };
        case 'BOOLEAN':
            return { ...base, valueBoolean: form.valueBoolean };
        case 'SELECT':
            return { ...base, optionId: form.optionId };
        case 'RANGE':
            return {
                ...base,
                rangeFrom: form.rangeFrom,
                rangeTo: form.rangeTo,
            };
        default:
            return base;
    }
}
