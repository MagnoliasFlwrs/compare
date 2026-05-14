import React, { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Breadcrumb,
    Button,
    Card,
    Checkbox,
    Col,
    ConfigProvider,
    Flex,
    Form,
    Input,
    Modal,
    Popconfirm,
    Row,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useModelStore, type Model } from '../../stores/modelsStore';
import { useBrandsStore } from '../../stores/brandsStore';
import { useAuth } from '../../store';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

type ModelFormValues = {
    name: string;
    isHidden: boolean;
};

const BrandPage = () => {
    const { id: brandId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const models = useModelStore((s) => s.modelsByBrand);
    const meta = useModelStore((s) => s.meta);
    const modelsByBrandObj = useModelStore((s) => s.modelsByBrandObj);
    const loading = useModelStore((s) => s.loading);
    const getModelsByBrand = useModelStore((s) => s.getModelsByBrand);
    const createModel = useModelStore((s) => s.createModel);
    const updateModel = useModelStore((s) => s.updateModel);
    const deleteModel = useModelStore((s) => s.deleteModel);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editModel, setEditModel] = useState<Model | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [addForm] = Form.useForm<ModelFormValues>();
    const [editForm] = Form.useForm<ModelFormValues>();

    const visibleModels = useMemo(
        () => models.filter((m) => !m.isHidden),
        [models],
    );

    useEffect(() => {
        if (!brandId) return;
        getModelsByBrand(brandId).catch(() => {
            message.error('Не удалось загрузить модели');
        });

        console.log(brandId)
        getBrandById(brandId).catch(() => {});
    }, [brandId]);

    const openEdit = (record: Model) => {
        setEditModel(record);
        editForm.setFieldsValue({
            name: record.name,
            isHidden: record.isHidden,
        });
    };

    const onAddSubmit = async (values: ModelFormValues) => {
        if (!brandId) return;
        setAddSubmitting(true);
        try {
            await createModel({
                brandId,
                name: values.name.trim(),
                isHidden: values.isHidden,
            });
            message.success('Модель создана');
            setAddOpen(false);
            addForm.resetFields();
        } catch {
            message.error('Не удалось создать модель');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: ModelFormValues) => {
        if (!editModel) return;
        setEditSubmitting(true);
        try {
            await updateModel(editModel.id, {
                name: values.name.trim(),
                isHidden: values.isHidden,
            });
            message.success('Модель обновлена');
            setEditModel(null);
            editForm.resetFields();
        } catch {
            message.error('Не удалось обновить модель');
        } finally {
            setEditSubmitting(false);
        }
    };

    const goToGeneration = (modelId: string) => {
        if (!brandId) return;
        navigate(
            `/brands/${encodeURIComponent(brandId)}/${encodeURIComponent(modelId)}`,
        );
    };

    const adminColumns: ColumnsType<Model> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Скрыт',
            key: 'isHidden',
            width: 100,
            render: (_, record) =>
                record.isHidden ? <Tag color="default">Да</Tag> : <Tag color="green">Нет</Tag>,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 180,
            onCell: () => ({
                onClick: (e) => e.stopPropagation(),
            }),
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => openEdit(record)}>
                        <EditOutlined />
                    </Button>
                    <Popconfirm
                        title="Удалить модель?"
                        description={record.name}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={async () => {
                            try {
                                await deleteModel(record.id);
                                message.success('Модель удалена');
                            } catch {
                                message.error('Не удалось удалить модель');
                            }
                        }}
                    >
                        <Button type="link" danger>
                            <DeleteOutlined />
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const header = (
        <Flex vertical gap={8}>
            <Breadcrumb
                items={[
                    { title: <Link to="/brands">Бренды</Link> },
                    { title: currentBrand?.name ?? 'Бренд' },
                ]}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
                {currentBrand?.name ?? 'Бренд'}
            </Typography.Title>
        </Flex>
    );

    if (isAdmin) {
        return (
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    {header}
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                        Добавить модель
                    </Button>
                </Flex>

                <ConfigProvider locale={ruRU}>
                    <Table<Model>
                        rowKey="id"
                        columns={adminColumns}
                        dataSource={models}
                        loading={loading}
                        onRow={(record) => ({
                            onClick: () => goToGeneration(record.id),
                            style: { cursor: 'pointer' },
                        })}
                        pagination={{
                            current: meta?.page ?? modelsByBrandObj.page,
                            pageSize: meta?.limit ?? modelsByBrandObj.limit,
                            total: meta?.itemCount ?? 0,
                            showSizeChanger: true,
                            pageSizeOptions: [10, 20, 50],
                            showTotal: (t) => `Всего: ${t}`,
                            onChange: (p, ps) => {
                                if (!brandId) return;
                                getModelsByBrand(brandId, { page: p, limit: ps }).catch(() => {
                                    message.error('Не удалось загрузить модели');
                                });
                            },
                        }}
                    />
                </ConfigProvider>

                <Modal
                    title="Новая модель"
                    open={addOpen}
                    onCancel={() => {
                        setAddOpen(false);
                        addForm.resetFields();
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form
                        form={addForm}
                        layout="vertical"
                        onFinish={onAddSubmit}
                        initialValues={{ isHidden: false }}
                    >
                        <Form.Item
                            label="Название"
                            name="name"
                            rules={[{ required: true, message: 'Введите название' }]}
                        >
                            <Input placeholder="Название модели" />
                        </Form.Item>
                        <Form.Item name="isHidden" valuePropName="checked">
                            <Checkbox>Скрыто</Checkbox>
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
                    title={editModel ? `Редактирование: ${editModel.name}` : 'Редактирование'}
                    open={!!editModel}
                    onCancel={() => {
                        setEditModel(null);
                        editForm.resetFields();
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form form={editForm} layout="vertical" onFinish={onEditSubmit}>
                        <Form.Item
                            label="Название"
                            name="name"
                            rules={[{ required: true, message: 'Введите название' }]}
                        >
                            <Input placeholder="Название модели" />
                        </Form.Item>
                        <Form.Item name="isHidden" valuePropName="checked">
                            <Checkbox>Скрыто</Checkbox>
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={() => {
                                        setEditModel(null);
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
    }

    return (
        <Flex vertical gap={16}>
            {header}
            {loading ? (
                <Typography.Text type="secondary">Загрузка…</Typography.Text>
            ) : (
                <Row gutter={[16, 16]}>
                    {visibleModels.map((m) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={m.id}>
                            <Card
                                hoverable
                                onClick={() => goToGeneration(m.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Typography.Text strong>{m.name}</Typography.Text>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </Flex>
    );
};

export default BrandPage;
