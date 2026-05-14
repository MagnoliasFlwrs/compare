import React, { useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    ConfigProvider,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Space,
    Table,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';

export interface ReferenceItem {
    id: string;
    name: string;
}

export interface ReferenceMeta {
    page: number;
    limit: number;
    itemCount: number;
}

interface Props {
    title: string;
    addTitle: string;
    editTitle: (item: ReferenceItem) => string;
    entityLabelGenitive: string; // "страну", "тип кузова", "тип привода"
    items: ReferenceItem[];
    loading: boolean;
    meta: ReferenceMeta | null;
    page: number;
    limit: number;
    onPageChange: (page: number, limit: number) => void;
    onCreate: (name: string) => Promise<void>;
    onUpdate: (id: string, name: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

type FormValues = { name: string };

const ReferenceAdminPage: React.FC<Props> = ({
    title,
    addTitle,
    editTitle,
    entityLabelGenitive,
    items,
    loading,
    meta,
    page,
    limit,
    onPageChange,
    onCreate,
    onUpdate,
    onDelete,
}) => {
    const { message } = App.useApp();

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [addForm] = Form.useForm<FormValues>();

    const [editItem, setEditItem] = useState<ReferenceItem | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editForm] = Form.useForm<FormValues>();

    useEffect(() => {
        if (editItem) {
            editForm.setFieldsValue({ name: editItem.name });
        }
    }, [editItem, editForm]);

    const onAddFinish = async (values: FormValues) => {
        setAddSubmitting(true);
        try {
            await onCreate(values.name.trim());
            message.success('Создано');
            setAddOpen(false);
            addForm.resetFields();
        } catch {
            message.error(`Не удалось создать ${entityLabelGenitive}`);
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditFinish = async (values: FormValues) => {
        if (!editItem) return;
        setEditSubmitting(true);
        try {
            await onUpdate(editItem.id, values.name.trim());
            message.success('Обновлено');
            setEditItem(null);
            editForm.resetFields();
        } catch {
            message.error(`Не удалось обновить ${entityLabelGenitive}`);
        } finally {
            setEditSubmitting(false);
        }
    };

    const handleDelete = async (record: ReferenceItem) => {
        try {
            await onDelete(record.id);
            message.success('Удалено');
        } catch {
            message.error(`Не удалось удалить ${entityLabelGenitive}`);
        }
    };

    const columns: ColumnsType<ReferenceItem> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Редактировать">
                        <Button
                            type="link"
                            aria-label="Редактировать"
                            onClick={() => setEditItem(record)}
                        >
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Удалить запись?"
                        description={record.name}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDelete(record)}
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
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    {title}
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                    Добавить
                </Button>
            </Flex>

            <ConfigProvider locale={ruRU}>
                <Table<ReferenceItem>
                    rowKey="id"
                    columns={columns}
                    dataSource={items}
                    loading={loading}
                    pagination={{
                        current: meta?.page ?? page,
                        pageSize: meta?.limit ?? limit,
                        total: meta?.itemCount ?? 0,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (t) => `Всего: ${t}`,
                        onChange: (p, ps) => onPageChange(p, ps),
                    }}
                />
            </ConfigProvider>

            <Modal
                title={addTitle}
                open={addOpen}
                onCancel={() => {
                    setAddOpen(false);
                    addForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form<FormValues>
                    form={addForm}
                    layout="vertical"
                    onFinish={onAddFinish}
                    initialValues={{ name: '' }}
                >
                    <Form.Item
                        label="Название"
                        name="name"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Название" />
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
                title={editItem ? editTitle(editItem) : 'Редактирование'}
                open={!!editItem}
                onCancel={() => {
                    setEditItem(null);
                    editForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form<FormValues> form={editForm} layout="vertical" onFinish={onEditFinish}>
                    <Form.Item
                        label="Название"
                        name="name"
                        rules={[{ required: true, message: 'Введите название' }]}
                    >
                        <Input placeholder="Название" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setEditItem(null);
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
        </Flex>
    );
};

export default ReferenceAdminPage;
