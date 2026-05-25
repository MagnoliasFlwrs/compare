import type { AttributeFormOptionItem, AttributeOption } from '../../types/attributes';

export type AttributeOptionsSyncStore = {
    getOptionsForAttribute: (attributeId: string) => Promise<AttributeOption[]>;
    createOption: (payload: {
        attributeId: string;
        value: string;
        order: number;
    }) => Promise<unknown>;
    updateOptionById: (
        id: string,
        payload: { value: string; order: number },
    ) => Promise<unknown>;
    deleteOptionById: (id: string) => Promise<void>;
};

export async function syncAttributeOptions(
    store: AttributeOptionsSyncStore,
    attributeId: string,
    formOptions: AttributeFormOptionItem[] | undefined,
): Promise<void> {
    const existing = await store.getOptionsForAttribute(attributeId);
    const valid = (formOptions ?? []).filter((o) => o.value?.trim());
    const keptIds = new Set(
        valid.map((o) => o.id).filter((id): id is string => Boolean(id)),
    );

    for (const opt of existing) {
        if (!keptIds.has(opt.id)) {
            await store.deleteOptionById(opt.id);
        }
    }

    for (const opt of valid) {
        const value = opt.value.trim();
        const order = opt.order ?? 0;
        if (opt.id) {
            await store.updateOptionById(opt.id, { value, order });
        } else {
            await store.createOption({ attributeId, value, order });
        }
    }
}
