import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App, ConfigProvider, Flex, Modal, Spin, Typography } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue, EntityValueResource } from '../../types/entityAttributeValue';
import { useAttributesStore } from '../../stores/attributesStore';
import { useAttributeOptionsStore } from '../../stores/attributeOptionsStore';
import { usePowertrainStore } from '../../stores/powertrainStore';
import { useSpecificationStore } from '../../stores/specificationStore';
import { useTrimsStore } from '../../stores/trimsStore';
import { fetchAllPages } from '../../utils/paginatedFetch';
import { baseAuthUrl } from '../../store';
import {
    ENTITY_VALUE_CONFIG,
    createEntityAttributeValue,
    deleteEntityAttributeValue,
    entityAttributeValuesToMap,
    listEntityAttributeValues,
    updateEntityAttributeValue,
} from '../../utils/entityAttributeValuesApi';
import AttributeValueFormModal, {
    type AttributeValueFormValues,
} from './AttributeValueFormModal';
import EntityAttributesTablesPanel from './EntityAttributesTablesPanel';
import type { AssignedAttributeRow } from './entityAttributesTypes';
import { sortByOrder } from '../../utils/sortByOrder';
import { buildAttributeValuePayload, resolveAttribute } from './entityAttributesUtils';

interface Props {
    open: boolean;
    resource: EntityValueResource;
    entityId: string | null;
    entityLabel: string;
    onClose: () => void;
}

const EntityAttributesModal: React.FC<Props> = ({
    open,
    resource,
    entityId,
    entityLabel,
    onClose,
}) => {
    const { message } = App.useApp();
    const category = ENTITY_VALUE_CONFIG[resource].category;

    const getAttributeById = useAttributesStore((s) => s.getAttributeById);
    const getOptionsForAttribute = useAttributeOptionsStore((s) => s.getOptionsForAttribute);

    const [loading, setLoading] = useState(false);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [assignedByAttributeId, setAssignedByAttributeId] = useState<
        Record<string, EntityAttributeValue>
    >({});
    const [pendingAttributeIds, setPendingAttributeIds] = useState<string[]>([]);
    const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
    const [searchName, setSearchName] = useState('');

    const [formAttribute, setFormAttribute] = useState<Attribute | null>(null);
    const [formExisting, setFormExisting] = useState<EntityAttributeValue | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const reloadAssignedValues = useCallback(async () => {
        if (!entityId) return;
        const values = await listEntityAttributeValues(resource, entityId);
        setAssignedByAttributeId(entityAttributeValuesToMap(values));
    }, [entityId, resource]);

    const syncParentEntityValuesList = useCallback(async () => {
        if (!entityId) return;
        if (resource === 'trims') {
            const { entityValuesObj, getTrimValuesList } = useTrimsStore.getState();
            if (entityValuesObj.trimId === entityId) {
                await getTrimValuesList();
            }
            return;
        }
        if (resource === 'specifications') {
            const { entityValuesObj, getSpecificationValuesList } =
                useSpecificationStore.getState();
            if (entityValuesObj.specificationId === entityId) {
                await getSpecificationValuesList();
            }
            return;
        }
        const { entityValuesObj, getPowertrainValuesList } = usePowertrainStore.getState();
        if (entityValuesObj.powertrainId === entityId) {
            await getPowertrainValuesList();
        }
    }, [entityId, resource]);

    const refreshLists = useCallback(async () => {
        try {
            await reloadAssignedValues();
            await syncParentEntityValuesList();
        } catch {
            message.error('Не удалось обновить списки');
        }
    }, [reloadAssignedValues, syncParentEntityValuesList, message]);

    const loadData = useCallback(async () => {
        if (!entityId) return;
        setLoading(true);
        try {
            const [attrs, values] = await Promise.all([
                fetchAllPages<Attribute>(`${baseAuthUrl}/attributes`, { category }),
                listEntityAttributeValues(resource, entityId),
            ]);
            setAttributes(attrs);
            setAssignedByAttributeId(entityAttributeValuesToMap(values));
        } catch {
            message.error('Не удалось загрузить данные');
            setAttributes([]);
            setAssignedByAttributeId({});
        } finally {
            setLoading(false);
        }
    }, [entityId, category, resource, message]);

    useEffect(() => {
        if (!open || !entityId) {
            setAttributes([]);
            setAssignedByAttributeId({});
            setPendingAttributeIds([]);
            setSelectedAvailableIds([]);
            setSearchName('');
            setFormAttribute(null);
            setFormExisting(null);
            return;
        }
        loadData();
    }, [open, entityId, loadData]);

    const assignedIdSet = useMemo(
        () => new Set(Object.keys(assignedByAttributeId)),
        [assignedByAttributeId],
    );

    const assignedTableData: AssignedAttributeRow[] = useMemo(() => {
        const pending: AssignedAttributeRow[] = [];
        for (const id of pendingAttributeIds) {
            if (assignedIdSet.has(id)) continue;
            const attribute = attributes.find((a) => a.id === id);
            if (attribute) pending.push({ key: `pending-${id}`, kind: 'pending', attribute });
        }

        const assigned = Object.entries(assignedByAttributeId)
            .map(([attributeId, value]) => {
                const attribute = resolveAttribute(attributeId, value, attributes);
                if (!attribute) return null;
                return {
                    key: attributeId,
                    kind: 'assigned' as const,
                    attribute,
                    value,
                };
            })
            .filter((r): r is Extract<AssignedAttributeRow, { kind: 'assigned' }> => r != null)
            .sort((a, b) => a.attribute.name.localeCompare(b.attribute.name, 'ru'));

        return [...pending, ...assigned];
    }, [pendingAttributeIds, assignedIdSet, attributes, assignedByAttributeId]);

    const moveToPending = (ids: string[]) => {
        if (ids.length === 0) return;
        setPendingAttributeIds((prev) => {
            const next = [...prev];
            for (const id of ids) {
                if (!next.includes(id)) next.unshift(id);
            }
            return next;
        });
    };

    const handleAddSelected = () => {
        moveToPending(selectedAvailableIds);
        setSelectedAvailableIds([]);
    };

    const openForm = async (attribute: Attribute, existing: EntityAttributeValue | null) => {
        let attr = attribute;
        if (attribute.type === 'SELECT' && !(attribute.options?.length ?? 0)) {
            try {
                attr = await getAttributeById(attribute.id);
            } catch {
                try {
                    const opts = await getOptionsForAttribute(attribute.id);
                    attr = { ...attribute, options: sortByOrder(opts) };
                } catch {
                    message.error('Не удалось загрузить варианты значений');
                    return;
                }
            }
        }
        setFormAttribute(attr);
        setFormExisting(existing);
    };

    const onSaveValue = async (formValues: AttributeValueFormValues) => {
        if (!entityId || !formAttribute) return;
        setFormSubmitting(true);
        try {
            if (formExisting?.id && !formExisting.id.startsWith('local-')) {
                const payload = buildAttributeValuePayload(formAttribute, formValues);
                const { attributeId: _omit, ...updateBody } = payload;
                await updateEntityAttributeValue(resource, formExisting.id, updateBody);
                message.success('Значение обновлено');
            } else {
                await createEntityAttributeValue(
                    resource,
                    entityId,
                    buildAttributeValuePayload(formAttribute, formValues),
                );
                setPendingAttributeIds((prev) =>
                    prev.filter((id) => id !== formAttribute.id),
                );
                message.success('Значение задано');
            }
            setFormAttribute(null);
            setFormExisting(null);
            await refreshLists();
        } catch {
            message.error(
                formExisting ? 'Не удалось обновить значение' : 'Не удалось задать значение',
            );
        } finally {
            setFormSubmitting(false);
        }
    };

    const onDeleteValue = async (_attributeId: string, value: EntityAttributeValue) => {
        if (!value.id.startsWith('local-')) {
            try {
                await deleteEntityAttributeValue(resource, value.id);
            } catch {
                message.error('Не удалось удалить значение');
                return;
            }
        }
        try {
            await refreshLists();
            message.success('Значение удалено');
        } catch {
            message.error('Не удалось обновить списки');
        }
    };

    return (
        <>
            <Modal
                title={`Доп. характеристики · ${entityLabel}`}
                open={open && Boolean(entityId)}
                onCancel={onClose}
                footer={null}
                width="min(96vw, 1280px)"
                destroyOnClose
            >
                {loading ? (
                    <Flex justify="center" style={{ padding: 40 }}>
                        <Spin />
                    </Flex>
                ) : attributes.length === 0 ? (
                    <Typography.Text type="secondary">
                        В справочнике нет характеристик для этого блока. Добавьте их в разделе
                        «Справочники → Доп. характеристики».
                    </Typography.Text>
                ) : (
                    <ConfigProvider locale={ruRU}>
                        <EntityAttributesTablesPanel
                            attributes={attributes}
                            assignedByAttributeId={assignedByAttributeId}
                            assignedTableData={assignedTableData}
                            pendingAttributeIds={pendingAttributeIds}
                            selectedAvailableIds={selectedAvailableIds}
                            searchName={searchName}
                            onSearchNameChange={setSearchName}
                            onSelectedAvailableChange={setSelectedAvailableIds}
                            onAddSelected={handleAddSelected}
                            onSetValue={(attr, existing) => openForm(attr, existing)}
                            onRemovePending={(id) =>
                                setPendingAttributeIds((prev) => prev.filter((x) => x !== id))
                            }
                            onDeleteValue={onDeleteValue}
                        />
                    </ConfigProvider>
                )}
            </Modal>

            <AttributeValueFormModal
                open={Boolean(formAttribute)}
                attribute={formAttribute}
                existing={formExisting}
                submitting={formSubmitting}
                onCancel={() => {
                    setFormAttribute(null);
                    setFormExisting(null);
                }}
                onSubmit={onSaveValue}
            />
        </>
    );
};

export default EntityAttributesModal;
