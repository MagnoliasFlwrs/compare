import React, { useEffect } from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Modal, Select, Space, Typography } from 'antd';
import type { Attribute, AttributeFormValues } from '../../types/attributes';
import {
    ADVANTAGE_OPTIONS,
    CATEGORY_OPTIONS,
    TYPE_OPTIONS,
} from './attributeLabels';

interface Props {
    title: string;
    open: boolean;
    submitting: boolean;
    submitText: string;
    /** Редактирование: категория и тип только для чтения. */
    editing?: Attribute | null;
    defaultCategory?: AttributeFormValues['category'];
    onCancel: () => void;
    onSubmit: (values: AttributeFormValues) => Promise<void> | void;
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
    title,
    open,
    submitting,
    submitText,
    editing,
    defaultCategory,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<AttributeFormValues>();
    const type = Form.useWatch('type', form);
    const isSelect = type === 'SELECT';
    const isEdit = Boolean(editing);

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }
        if (editing) {
            form.setFieldsValue({
                name: editing.name,
                category: editing.category,
                type: editing.type,
                unit: editing.unit ?? '',
                advantageType: editing.advantageType,
                options: undefined,
            });
        } else {
            form.setFieldsValue({
                ...DEFAULT_VALUES,
                category: defaultCategory ?? DEFAULT_VALUES.category,
                options: [{ value: '', order: 0 }],
            });
        }
    }, [open, editing, defaultCategory, form]);

    return (
        <Modal title={title} open={open} onCancel={onCancel} footer={null} destroyOnHidden width={560}>
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
                    <Select options={ADVANTAGE_OPTIONS} placeholder="Преимущество" />
                </Form.Item>

                {isSelect && !isEdit ? (
                    <>
                        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                            Значения для выбора (поле «Преимущество» — порядок сравнения: 0, 1, 2…)
                        </Typography.Text>
                        <Form.List name="options">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...rest }) => (
                                        <Space
                                            key={key}
                                            align="baseline"
                                            style={{ display: 'flex', marginBottom: 8 }}
                                        >
                                            <Form.Item
                                                {...rest}
                                                name={[name, 'value']}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Введите значение',
                                                    },
                                                ]}
                                                style={{ flex: 1, marginBottom: 0 }}
                                            >
                                                <Input placeholder="Значение" />
                                            </Form.Item>
                                            <Form.Item
                                                {...rest}
                                                name={[name, 'order']}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: 'Укажите порядок',
                                                    },
                                                ]}
                                                style={{ width: 100, marginBottom: 0 }}
                                            >
                                                <InputNumber
                                                    min={0}
                                                    style={{ width: '100%' }}
                                                    placeholder="Прем."
                                                />
                                            </Form.Item>
                                            {fields.length > 1 ? (
                                                <MinusCircleOutlined onClick={() => remove(name)} />
                                            ) : null}
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add({ value: '', order: fields.length })}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            Добавить значение
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </>
                ) : isSelect && isEdit ? (
                    <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        Значения для выбора редактируются отдельно — кнопка «Значения» в таблице.
                    </Typography.Paragraph>
                ) : null}

                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Отмена</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {submitText}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AttributeFormModal;
