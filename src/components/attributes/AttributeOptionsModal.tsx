import React, { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    ConfigProvider,
    Flex,
    Form,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Space,
    Spin,
    Table,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Attribute, AttributeOption } from '../../types/attributes';
import { useAttributeOptionsStore } from '../../stores/attributeOptionsStore';

type OptionFormValues = { value: string; order: number };

interface Props {
    attribute: Attribute | null;
    onClose: () => void;
}

const AttributeOptionsModal: React.FC<Props> = ({ attribute, onClose }) => {
    const { message } = App.useApp();
    const open = Boolean(attribute);

    const loading = useAttributeOptionsStore((s) => s.loading);
    const getOptionsForAttribute = useAttributeOptionsStore((s) => s.getOptionsForAttribute);
    const createOption = useAttributeOptionsStore((s) => s.createOption);
    const updateOptionById = useAttributeOptionsStore((s) => s.updateOptionById);
    const deleteOptionById = useAttributeOptionsStore((s) => s.deleteOptionById);

    const [options, setOptions] = useState<AttributeOption[]>([]);
    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editOption, setEditOption] = useState<AttributeOption | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [addForm] = Form.useForm<OptionFormValues>();
    const [editForm] = Form.useForm<OptionFormValues>();

    const load = useCallback(async () => {
        if (!attribute) return;
        try {
            const list = await getOptionsForAttribute(attribute.id);
            setOptions(list);
        } catch {
            message.error('Не удалось загрузить значения');
            setOptions([]);
        }
    }, [attribute, getOptionsForAttribute, message]);

    useEffect(() => {
        if (!open) {
            setOptions([]);
            setAddOpen(false);
            setEditOption(null);
            return;
        }
        load();
    }, [open, attribute?.id, load]);

    useEffect(() => {
        if (editOption) {
            editForm.setFieldsValue({
                value: editOption.value,
                order: editOption.order,
            });
        }
    }, [editOption, editForm]);

    const onAdd = async (values: OptionFormValues) => {
        if (!attribute) return;
        setAddSubmitting(true);
        try {
            await createOption({
                attributeId: attribute.id,
                value: values.value.trim(),
                order: values.order,
            });
            message.success('Значение добавлено');
            setAddOpen(false);
            addForm.resetFields();
            await load();
        } catch {
            message.error('Не удалось добавить значение');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEdit = async (values: OptionFormValues) => {
        if (!editOption) return;
        setEditSubmitting(true);
        try {
            await updateOptionById(editOption.id, {
                value: values.value.trim(),
                order: values.order,
            });
            message.success('Значение обновлено');
            setEditOption(null);
            editForm.resetFields();
            await load();
        } catch {
            message.error('Не удалось обновить значение');
        } finally {
            setEditSubmitting(false);
        }
    };

    const onDelete = async (record: AttributeOption) => {
        try {
            await deleteOptionById(record.id);
            message.success('Значение удалено');
            await load();
        } catch {
            message.error('Не удалось удалить значение');
        }
    };

    const columns: ColumnsType<AttributeOption> = [
        { title: 'Значение', dataIndex: 'value', key: 'value', ellipsis: true },
        {
            title: 'Преимущество',
            dataIndex: 'order',
            key: 'order',
            width: 120,
            align: 'center',
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Редактировать">
                        <Button
                            type="link"
                            aria-label="Редактировать"
                            onClick={() => setEditOption(record)}
                        >
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Удалить значение?"
                        description={record.value}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record)}
                    >
                        <Tooltip title="Удалить">
                            <Button type="link" danger aria-label="Удалить">
                                <DeleteOutlined />
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <Modal
                title={attribute ? `Значения: ${attribute.name}` : 'Значения'}
                open={open}
                onCancel={onClose}
                footer={null}
                width={640}
                destroyOnClose
            >
                <Flex vertical gap={12}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAddOpen(true)}
                        style={{ alignSelf: 'flex-start' }}
                    >
                        Добавить значение
                    </Button>
                    {loading ? (
                        <Flex justify="center" style={{ padding: 24 }}>
                            <Spin />
                        </Flex>
                    ) : (
                        <ConfigProvider locale={ruRU}>
                            <Table<AttributeOption>
                                rowKey="id"
                                columns={columns}
                                dataSource={options}
                                pagination={false}
                                size="small"
                            />
                        </ConfigProvider>
                    )}
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Число в колонке «Преимущество» используется при сравнении автомобилей.
                    </Typography.Text>
                </Flex>
            </Modal>

            <Modal
                title="Новое значение"
                open={addOpen}
                onCancel={() => {
                    setAddOpen(false);
                    addForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={addForm} layout="vertical" onFinish={onAdd} initialValues={{ order: 0 }}>
                    <Form.Item
                        label="Значение"
                        name="value"
                        rules={[{ required: true, message: 'Введите значение' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Преимущество (порядок)"
                        name="order"
                        rules={[{ required: true, message: 'Укажите число' }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setAddOpen(false);
                                    addForm.resetFields();
                                }}
                            >
                                Отмена
                            </Button>
                            <Button type="primary" htmlType="submit" loading={addSubmitting}>
                                Создать
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Редактирование значения"
                open={!!editOption}
                onCancel={() => {
                    setEditOption(null);
                    editForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={editForm} layout="vertical" onFinish={onEdit}>
                    <Form.Item
                        label="Значение"
                        name="value"
                        rules={[{ required: true, message: 'Введите значение' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Преимущество (порядок)"
                        name="order"
                        rules={[{ required: true, message: 'Укажите число' }]}
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setEditOption(null);
                                    editForm.resetFields();
                                }}
                            >
                                Отмена
                            </Button>
                            <Button type="primary" htmlType="submit" loading={editSubmitting}>
                                Сохранить
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AttributeOptionsModal;
