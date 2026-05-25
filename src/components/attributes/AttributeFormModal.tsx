import React, { useEffect, useMemo, useState } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Spin } from 'antd';
import type { Attribute, AttributeCategory, AttributeFormValues } from '../../types/attributes';
import { useAttributesStore } from '../../stores/attributesStore';
import { useAttributeOptionsStore } from '../../stores/attributeOptionsStore';
import AttributeOptionsFormList from './AttributeOptionsFormList';
import {
    advantageOptionsForAttributeType,
    normalizeAdvantageTypeForAttribute,
    CATEGORY_OPTIONS,
    TYPE_OPTIONS,
} from './attributeLabels';
import { sortByOrder } from '../../utils/sortByOrder';
import { syncAttributeOptions } from './syncAttributeOptions';

interface Props {
    open: boolean;
    /** При open: null — создание, объект — редактирование. */
    editing: Attribute | null;
    defaultCategory?: AttributeCategory;
    onClose: () => void;
    onSaved?: () => void;
}

const DEFAULT_VALUES: AttributeFormValues = {
    name: '',
    category: 'TRIM',
    type: 'TEXT',
    unit: '',
    advantageType: 'MORE_IS_BETTER',
    options: [{ value: '', order: 0 }],
};

const AttributeFormModal: React.FC<Props> = ({
    open,
    editing,
    defaultCategory,
    onClose,
    onSaved,
}) => {
    const { message } = App.useApp();
    const createAttribute = useAttributesStore((s) => s.createAttribute);
    const updateAttributeById = useAttributesStore((s) => s.updateAttributeById);
    const optionsStore = useAttributeOptionsStore();
    const { getOptionsForAttribute, createOption } = optionsStore;

    const [form] = Form.useForm<AttributeFormValues>();
    const [submitting, setSubmitting] = useState(false);
    const [optionsLoading, setOptionsLoading] = useState(false);
    const type = Form.useWatch('type', form);

    const isEdit = editing !== null;
    const isSelect = type === 'SELECT';

    const advantageOptions = useMemo(
        () => advantageOptionsForAttributeType(type),
        [type],
    );

    const title = useMemo(
        () => (isEdit ? `Редактирование: ${editing.name}` : 'Новая характеристика'),
        [isEdit, editing],
    );

    const submitText = isEdit ? 'Сохранить' : 'Создать';

    useEffect(() => {
        if (!open) {
            form.resetFields();
            setOptionsLoading(false);
            return;
        }

        if (!editing) {
            form.setFieldsValue({
                ...DEFAULT_VALUES,
                category: defaultCategory ?? DEFAULT_VALUES.category,
                options: [{ value: '', order: 0 }],
            });
            return;
        }

        let cancelled = false;

        const loadEditForm = async () => {
            form.setFieldsValue({
                name: editing.name,
                category: editing.category,
                type: editing.type,
                unit: editing.unit ?? '',
                advantageType: normalizeAdvantageTypeForAttribute(
                    editing.type,
                    editing.advantageType,
                ),
            });

            if (editing.type !== 'SELECT') return;

            setOptionsLoading(true);
            try {
                const opts = sortByOrder(await getOptionsForAttribute(editing.id));
                if (cancelled) return;
                form.setFieldsValue({
                    options: opts.length
                        ? opts.map((o) => ({ id: o.id, value: o.value, order: o.order }))
                        : [{ value: '', order: 0 }],
                });
            } catch {
                if (!cancelled) {
                    message.error('Не удалось загрузить значения');
                    form.setFieldsValue({ options: [{ value: '', order: 0 }] });
                }
            } finally {
                if (!cancelled) setOptionsLoading(false);
            }
        };

        loadEditForm();

        return () => {
            cancelled = true;
        };
    }, [open, editing, defaultCategory, form, getOptionsForAttribute, message]);

    /** При смене типа на SELECT — ENUM_ORDER; с SELECT — убрать ENUM_ORDER из поля. */
    useEffect(() => {
        if (!open || isEdit) return;
        const current = form.getFieldValue('advantageType');
        const normalized = normalizeAdvantageTypeForAttribute(
            type ?? 'TEXT',
            current ?? DEFAULT_VALUES.advantageType,
        );
        if (normalized !== current) {
            form.setFieldValue('advantageType', normalized);
        }
    }, [type, open, isEdit, form]);

    const onCreate = async (values: AttributeFormValues) => {
        setSubmitting(true);
        try {
            const advantageType = normalizeAdvantageTypeForAttribute(
                values.type,
                values.advantageType,
            );

            const created = await createAttribute({
                name: values.name.trim(),
                category: values.category,
                type: values.type,
                unit: (values.unit ?? '').trim(),
                advantageType,
            });

            if (values.type === 'SELECT' && values.options?.length) {
                for (const opt of values.options) {
                    const value = opt.value?.trim();
                    if (!value) continue;
                    await createOption({
                        attributeId: created.id,
                        value,
                        order: opt.order ?? 0,
                    });
                }
            }

            message.success('Характеристика создана');
            onClose();
            onSaved?.();
        } catch {
            message.error('Не удалось создать характеристику');
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdate = async (values: AttributeFormValues) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updateAttributeById(editing.id, {
                name: values.name.trim(),
                unit: (values.unit ?? '').trim(),
                advantageType: normalizeAdvantageTypeForAttribute(
                    editing.type,
                    values.advantageType,
                ),
            });

            if (editing.type === 'SELECT') {
                await syncAttributeOptions(optionsStore, editing.id, values.options);
            }

            message.success('Характеристика обновлена');
            onClose();
            onSaved?.();
        } catch {
            message.error('Не удалось обновить характеристику');
        } finally {
            setSubmitting(false);
        }
    };

    const onSubmit = isEdit ? onUpdate : onCreate;

    return (
        <Modal title={title} open={open} onCancel={onClose} footer={null} destroyOnHidden width={560}>
            <Spin spinning={optionsLoading}>
                <Form form={form} layout="vertical" onFinish={onSubmit}>
                    <Form.Item
                        label="Название"
                        name="name"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Например: лидар" />
                    </Form.Item>

                    <Form.Item
                        label="Блок"
                        name="category"
                        rules={[{ required: true, message: 'Выберите блок' }]}
                    >
                        <Select
                            options={CATEGORY_OPTIONS}
                            disabled={isEdit}
                            placeholder="Блок"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Тип данных"
                        name="type"
                        rules={[{ required: true, message: 'Выберите тип' }]}
                    >
                        <Select
                            options={TYPE_OPTIONS}
                            disabled={isEdit}
                            placeholder="Тип"
                        />
                    </Form.Item>

                    <Form.Item label="Единица измерения" name="unit">
                        <Input placeholder="Например: л.с., мм (необязательно)" />
                    </Form.Item>

                    <Form.Item
                        label="Тип преимущества"
                        name="advantageType"
                        rules={[{ required: true, message: 'Выберите тип преимущества' }]}
                    >
                        <Select options={advantageOptions} placeholder="Преимущество" />
                    </Form.Item>

                    {isSelect ? <AttributeOptionsFormList /> : null}

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={onClose}>Отмена</Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                disabled={optionsLoading}
                            >
                                {submitText}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default AttributeFormModal;
