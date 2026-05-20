import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    ConfigProvider,
    Flex,
    Modal,
    Popconfirm,
    Spin,
    Table,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue, EntityValueResource } from '../../types/entityAttributeValue';
import { useAttributesStore } from '../../stores/attributesStore';
import { useAttributeOptionsStore } from '../../stores/attributeOptionsStore';
import { fetchAllPages } from '../../utils/paginatedFetch';
import { baseAuthUrl } from '../../store';
import {
    ENTITY_VALUE_CONFIG,
    createEntityAttributeValue,
    deleteEntityAttributeValue,
    updateEntityAttributeValue,
} from '../../utils/entityAttributeValuesApi';
import { TYPE_LABELS } from '../attributes/attributeLabels';
import { formatAttributeValueDisplay } from './formatAttributeValueDisplay';
import AttributeValueFormModal, {
    type AttributeValueFormValues,
} from './AttributeValueFormModal';

interface Props {
    open: boolean;
    resource: EntityValueResource;
    entityId: string | null;
    entityLabel: string;
    onClose: () => void;
}

type Row = {
    key: string;
    attribute: Attribute;
    assigned: EntityAttributeValue | undefined;
};

/** Собираем отображаемое значение из ответа POST и данных формы. */
function mergeAssignedValue(
    attributeId: string,
    saved: EntityAttributeValue | null,
    form: AttributeValueFormValues,
    attribute: Attribute,
): EntityAttributeValue {
    const id = saved?.id ?? `local-${attributeId}`;
    const base: EntityAttributeValue = {
        id,
        attributeId,
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
    /** Значения, заданные в этой сессии (GET списка value в API нет). */
    const [assignedByAttributeId, setAssignedByAttributeId] = useState<
        Record<string, EntityAttributeValue>
    >({});
    const [formAttribute, setFormAttribute] = useState<Attribute | null>(null);
    const [formExisting, setFormExisting] = useState<EntityAttributeValue | null>(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    const loadAttributes = useCallback(async () => {
        if (!entityId) return;
        setLoading(true);
        try {
            const attrs = await fetchAllPages<Attribute>(`${baseAuthUrl}/attributes`, {
                category,
            });
            setAttributes(attrs);
        } catch {
            message.error('Не удалось загрузить характеристики');
            setAttributes([]);
        } finally {
            setLoading(false);
        }
    }, [entityId, category, message]);

    useEffect(() => {
        if (!open || !entityId) {
            setAttributes([]);
            setAssignedByAttributeId({});
            setFormAttribute(null);
            setFormExisting(null);
            return;
        }
        loadAttributes();
    }, [open, entityId, loadAttributes]);

    const rows: Row[] = useMemo(
        () =>
            [...attributes]
                .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                .map((attribute) => ({
                    key: attribute.id,
                    attribute,
                    assigned: assignedByAttributeId[attribute.id],
                })),
        [attributes, assignedByAttributeId],
    );

    const openForm = async (attribute: Attribute, existing: EntityAttributeValue | null) => {
        let attr = attribute;
        if (attribute.type === 'SELECT' && !(attribute.options?.length ?? 0)) {
            try {
                attr = await getAttributeById(attribute.id);
            } catch {
                try {
                    const opts = await getOptionsForAttribute(attribute.id);
                    attr = { ...attribute, options: opts };
                } catch {
                    message.error('Не удалось загрузить варианты значений');
                    return;
                }
            }
        }
        setFormAttribute(attr);
        setFormExisting(existing);
    };

    const buildPayload = (attr: Attribute, form: AttributeValueFormValues) => {
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
    };

    const onSaveValue = async (formValues: AttributeValueFormValues) => {
        if (!entityId || !formAttribute) return;
        setFormSubmitting(true);
        try {
            if (formExisting?.id && !formExisting.id.startsWith('local-')) {
                const payload = buildPayload(formAttribute, formValues);
                const { attributeId: _omit, ...updateBody } = payload;
                const updated = await updateEntityAttributeValue(
                    resource,
                    formExisting.id,
                    updateBody,
                );
                const merged = mergeAssignedValue(
                    formAttribute.id,
                    updated ?? formExisting,
                    formValues,
                    formAttribute,
                );
                setAssignedByAttributeId((prev) => ({
                    ...prev,
                    [formAttribute.id]: merged,
                }));
                message.success('Значение обновлено');
            } else {
                const saved = await createEntityAttributeValue(
                    resource,
                    entityId,
                    buildPayload(formAttribute, formValues),
                );
                const merged = mergeAssignedValue(
                    formAttribute.id,
                    saved,
                    formValues,
                    formAttribute,
                );
                setAssignedByAttributeId((prev) => ({
                    ...prev,
                    [formAttribute.id]: merged,
                }));
                message.success('Значение задано');
            }
            setFormAttribute(null);
            setFormExisting(null);
        } catch {
            message.error(
                formExisting ? 'Не удалось обновить значение' : 'Не удалось задать значение',
            );
        } finally {
            setFormSubmitting(false);
        }
    };

    const onDeleteValue = async (attributeId: string, value: EntityAttributeValue) => {
        if (!value.id.startsWith('local-')) {
            try {
                await deleteEntityAttributeValue(resource, value.id);
            } catch {
                message.error('Не удалось удалить значение');
                return;
            }
        }
        setAssignedByAttributeId((prev) => {
            const next = { ...prev };
            delete next[attributeId];
            return next;
        });
        message.success('Значение удалено');
    };

    const columns: ColumnsType<Row> = [
        {
            title: 'Характеристика',
            key: 'name',
            ellipsis: true,
            render: (_, r) => r.attribute.name,
        },
        {
            title: 'Тип',
            key: 'type',
            width: 150,
            render: (_, r) => TYPE_LABELS[r.attribute.type] ?? r.attribute.type,
        },
        {
            title: 'Значение',
            key: 'value',
            ellipsis: true,
            render: (_, r) => formatAttributeValueDisplay(r.attribute, r.assigned),
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 120,
            render: (_, r) =>
                r.assigned ? (
                    <Flex gap={4}>
                        <Tooltip title="Изменить">
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => openForm(r.attribute, r.assigned!)}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Удалить значение?"
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onDeleteValue(r.attribute.id, r.assigned!)}
                        >
                            <Button type="link" size="small" danger>
                                Удал.
                            </Button>
                        </Popconfirm>
                    </Flex>
                ) : (
                    <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => openForm(r.attribute, null)}
                    >
                        Задать
                    </Button>
                ),
        },
    ];

    return (
        <>
            <Modal
                title={`Доп. характеристики · ${entityLabel}`}
                open={open && Boolean(entityId)}
                onCancel={onClose}
                footer={null}
                width="min(96vw, 900px)"
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
                            <Table<Row>
                                rowKey="key"
                                columns={columns}
                                dataSource={rows}
                                pagination={false}
                                size="small"
                                scroll={{ y: 400 }}
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
