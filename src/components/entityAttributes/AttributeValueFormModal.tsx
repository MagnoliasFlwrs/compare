import React, { useEffect } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Switch } from 'antd';
import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { pickIdString } from '../../utils/pickIdString';

export type AttributeValueFormValues = {
    valueText?: string;
    valueNumber?: number;
    valueBoolean?: boolean;
    optionId?: string;
    rangeFrom?: number;
    rangeTo?: number;
};

interface Props {
    open: boolean;
    attribute: Attribute | null;
    existing: EntityAttributeValue | null;
    submitting: boolean;
    onCancel: () => void;
    onSubmit: (values: AttributeValueFormValues) => Promise<void>;
}

const AttributeValueFormModal: React.FC<Props> = ({
    open,
    attribute,
    existing,
    submitting,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<AttributeValueFormValues>();

    useEffect(() => {
        if (!open || !attribute) {
            form.resetFields();
            return;
        }
        if (existing) {
            form.setFieldsValue({
                valueText: existing.valueText,
                valueNumber: existing.valueNumber,
                valueBoolean: existing.valueBoolean,
                optionId: pickIdString(existing.optionId) || undefined,
                rangeFrom: existing.rangeFrom,
                rangeTo: existing.rangeTo,
            });
        } else {
            form.setFieldsValue({
                valueBoolean: false,
            });
        }
    }, [open, attribute, existing, form]);

    const renderFields = () => {
        if (!attribute) return null;
        switch (attribute.type) {
            case 'TEXT':
                return (
                    <Form.Item
                        label="Значение"
                        name="valueText"
                        rules={[{ required: true, message: 'Введите значение' }]}
                    >
                        <Input />
                    </Form.Item>
                );
            case 'NUMBER':
                return (
                    <Form.Item
                        label={attribute.unit?.trim() ? `Значение (${attribute.unit})` : 'Значение'}
                        name="valueNumber"
                        rules={[{ required: true, message: 'Введите число' }]}
                    >
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                );
            case 'BOOLEAN':
                return (
                    <Form.Item label="Значение" name="valueBoolean" valuePropName="checked">
                        <Switch checkedChildren="Да" unCheckedChildren="Нет" />
                    </Form.Item>
                );
            case 'SELECT':
                return (
                    <Form.Item
                        label="Значение"
                        name="optionId"
                        rules={[{ required: true, message: 'Выберите значение' }]}
                    >
                        <Select
                            placeholder="Выберите"
                            options={(attribute.options ?? []).map((o) => ({
                                value: o.id,
                                label: o.value,
                            }))}
                        />
                    </Form.Item>
                );
            case 'RANGE':
                return (
                    <>
                        <Form.Item
                            label={
                                attribute.unit?.trim()
                                    ? `От (${attribute.unit})`
                                    : 'От'
                            }
                            name="rangeFrom"
                            rules={[{ required: true, message: 'Укажите нижнюю границу' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                            label={
                                attribute.unit?.trim() ? `До (${attribute.unit})` : 'До'
                            }
                            name="rangeTo"
                            rules={[{ required: true, message: 'Укажите верхнюю границу' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            title={
                attribute
                    ? existing
                        ? `Значение: ${attribute.name}`
                        : `Задать: ${attribute.name}`
                    : ''
            }
            open={open && Boolean(attribute)}
            onCancel={onCancel}
            footer={null}
            destroyOnHidden
            width={440}
        >
            {attribute ? (
                <Form form={form} layout="vertical" onFinish={onSubmit}>
                    {renderFields()}
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={onCancel}>Отмена</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                Сохранить
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            ) : null}
        </Modal>
    );
};

export default AttributeValueFormModal;
