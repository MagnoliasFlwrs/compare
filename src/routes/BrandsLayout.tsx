import React, { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    Card,
    Checkbox,
    ConfigProvider,
    Flex,
    Form,
    Image,
    Input,
    Modal,
    Popconfirm,
    Row,
    Col,
    Space,
    Table,
    Tag,
    Typography,
    Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useBrandsStore, type Brand } from '../stores/brandsStore';
import { uploadFile, useAuth } from '../store';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

type AddBrandFormValues = {
    name: string;
    isHidden: boolean;
};

type EditBrandFormValues = {
    name: string;
    isHidden: boolean;
};

const BrandsLayout = () => {
    const { brandName } = useParams<{ brandName?: string }>();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const brands = useBrandsStore((s) => s.brands);
    const meta = useBrandsStore((s) => s.meta);
    const brandsObj = useBrandsStore((s) => s.brandsObj);
    const loading = useBrandsStore((s) => s.loading);
    const getBrands = useBrandsStore((s) => s.getBrands);
    const createBrand = useBrandsStore((s) => s.createBrand);
    const updateBrand = useBrandsStore((s) => s.updateBrand);
    const deleteBrand = useBrandsStore((s) => s.deleteBrand);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editBrand, setEditBrand] = useState<Brand | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [addForm] = Form.useForm<AddBrandFormValues>();
    const [addLogoFile, setAddLogoFile] = useState<File | null>(null);
    const [editForm] = Form.useForm<EditBrandFormValues>();
    const [editNewLogoFile, setEditNewLogoFile] = useState<File | null>(null);
    const [editLogoCleared, setEditLogoCleared] = useState(false);

    useEffect(() => {
        if (isAdmin && brandName) {
            navigate('/brands', { replace: true });
        }
    }, [isAdmin, brandName, navigate]);

    useEffect(() => {
         getBrands().catch(() => {
            message.error('Не удалось загрузить бренды');
        });
    }, []);

    const decodedSlug = useMemo(() => {
        if (!brandName) return '';
        try {
            return decodeURIComponent(brandName);
        } catch {
            return brandName;
        }
    }, [brandName]);

    const selectedBrand = useMemo(() => {
        if (!decodedSlug) return null;
        return brands.find((b) => b.name.trim() === decodedSlug.trim()) ?? null;
    }, [brands, decodedSlug]);

    const openEdit = (record: Brand) => {
        setEditBrand(record);
        setEditNewLogoFile(null);
        setEditLogoCleared(false);
        editForm.setFieldsValue({
            name: record.name,
            isHidden: record.isHidden,
        });
    };

    const onAddSubmit = async (values: AddBrandFormValues) => {
        if (!addLogoFile) {
            message.error('Выберите файл логотипа');
            return;
        }
        setAddSubmitting(true);
        try {
            let logoId: string;
            try {
                const uploaded = await uploadFile(addLogoFile);
                logoId = uploaded.id;
            } catch {
                message.error('Не удалось загрузить файл');
                return;
            }
            await createBrand({
                name: values.name.trim(),
                logoId,
                isHidden: values.isHidden,
            });
            message.success('Бренд создан');
            setAddOpen(false);
            addForm.resetFields();
            setAddLogoFile(null);
        } catch {
            message.error('Не удалось создать бренд');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: EditBrandFormValues) => {
        if (!editBrand) return;
        setEditSubmitting(true);
        try {
            let logoId: string;
            if (editNewLogoFile) {
                try {
                    const uploaded = await uploadFile(editNewLogoFile);
                    logoId = uploaded.id;
                } catch {
                    message.error('Не удалось загрузить файл');
                    return;
                }
            } else if (editLogoCleared) {
                logoId = '';
            } else {
                logoId = (editBrand.logoId ?? '').trim();
            }

            await updateBrand(editBrand.id, {
                name: values.name.trim(),
                logoId,
                isHidden: values.isHidden,
            });
            message.success('Бренд обновлён');
            setEditBrand(null);
            editForm.resetFields();
            setEditNewLogoFile(null);
            setEditLogoCleared(false);
        } catch {
            message.error('Не удалось обновить бренд');
        } finally {
            setEditSubmitting(false);
        }
    };

    const adminColumns: ColumnsType<Brand> = [
        {
            title: 'Лого',
            key: 'logo',
            width: 88,
            render: (_, record) => (
                <Image
                    src={record.logoUrl}
                    alt=""
                    width={56}
                    height={56}
                    preview={false}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23f0f0f0' width='56' height='56'/%3E%3C/svg%3E"
                />
            ),
        },
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
                    <Button type="link"  onClick={() => openEdit(record)}>
                        <EditOutlined />
                    </Button>
                    <Popconfirm
                        title="Удалить бренд?"
                        description={record.name}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={async () => {
                            try {
                                await deleteBrand(record.id);
                                message.success('Бренд удалён');
                            } catch {
                                message.error('Не удалось удалить бренд');
                            }
                        }}
                    >
                        <Button type="link" danger >
                            <DeleteOutlined />
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];
    console.log(brands);
    if (isAdmin) {
        return (
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Бренды
                    </Typography.Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                        Добавить
                    </Button>
                </Flex>

                <ConfigProvider locale={ruRU}>
                    <Table<Brand>
                        rowKey="id"
                        columns={adminColumns}
                        dataSource={brands}
                        loading={loading}
                        onRow={(record) => {
                            return {
                                onClick: () => navigate(`/brands/${record.id}`),
                                style: { cursor: 'pointer' },
                            }
                        }}
                        pagination={{
                            current: meta?.page ?? brandsObj.page,
                            pageSize: meta?.limit ?? brandsObj.limit,
                            total: meta?.itemCount ?? 0,
                            showSizeChanger: true,
                            pageSizeOptions: [10, 20, 50],
                            showTotal: (t) => `Всего: ${t}`,
                            onChange: (p, ps) => {
                                 getBrands({ page: p, limit: ps }).catch(() => {
                                    message.error('Не удалось загрузить бренды');
                                });
                            },
                        }}
                    />
                </ConfigProvider>

                <Modal
                    title="Новый бренд"
                    open={addOpen}
                    onCancel={() => {
                        setAddOpen(false);
                        addForm.resetFields();
                        setAddLogoFile(null);
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form form={addForm} layout="vertical" onFinish={onAddSubmit} initialValues={{ isHidden: false }}>
                        <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
                            <Input placeholder="Название бренда" />
                        </Form.Item>
                        <Form.Item label="Логотип" required>
                            <Upload
                                maxCount={1}
                                accept="image/*"
                                fileList={
                                    addLogoFile
                                        ? [
                                              {
                                                  uid: '-1',
                                                  name: addLogoFile.name,
                                                  status: 'done' as const,
                                              },
                                          ]
                                        : []
                                }
                                beforeUpload={(file) => {
                                    setAddLogoFile(file);
                                    return false;
                                }}
                                onRemove={() => {
                                    setAddLogoFile(null);
                                }}
                            >
                                <Button type="default">Выбрать файл</Button>
                            </Upload>
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
                                        setAddLogoFile(null);
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
                    title={editBrand ? `Редактирование: ${editBrand.name}` : 'Редактирование'}
                    open={!!editBrand}
                    onCancel={() => {
                        setEditBrand(null);
                        editForm.resetFields();
                        setEditNewLogoFile(null);
                        setEditLogoCleared(false);
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form form={editForm} layout="vertical" onFinish={onEditSubmit}>
                        <Form.Item label="Название" name="name" rules={[{ required: true, message: 'Введите название' }]}>
                            <Input placeholder="Название бренда" />
                        </Form.Item>
                        <Form.Item label="Логотип">
                            <Upload
                                maxCount={1}
                                accept="image/*"
                                fileList={
                                    editNewLogoFile
                                        ? [
                                              {
                                                  uid: 'pending-logo',
                                                  name: editNewLogoFile.name,
                                                  status: 'done' as const,
                                              },
                                          ]
                                        : !editLogoCleared &&
                                            editBrand &&
                                            (editBrand.logoId || editBrand.logoUrl)
                                          ? [
                                                {
                                                    uid: 'current-logo',
                                                    name: 'Текущий логотип',
                                                    status: 'done' as const,
                                                    thumbUrl: editBrand.logoUrl,
                                                },
                                            ]
                                          : []
                                }
                                beforeUpload={(file) => {
                                    setEditNewLogoFile(file);
                                    setEditLogoCleared(false);
                                    return false;
                                }}
                                onRemove={(file) => {
                                    if (file.uid === 'current-logo') {
                                        setEditLogoCleared(true);
                                    }
                                    if (file.uid === 'pending-logo') {
                                        setEditNewLogoFile(null);
                                    }
                                }}
                            >
                                <Button type="default">Выбрать новый файл</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item name="isHidden" valuePropName="checked">
                            <Checkbox>Скрыто</Checkbox>
                        </Form.Item>
                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={() => {
                                        setEditBrand(null);
                                        editForm.resetFields();
                                        setEditNewLogoFile(null);
                                        setEditLogoCleared(false);
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

    /* Пользователь (не ADMIN) */
    if (brandName) {
        return (
            <Flex vertical gap={16}>
                <Link to="/brands">← Ко всем брендам</Link>
                {loading ? (
                    <Typography.Text type="secondary">Загрузка…</Typography.Text>
                ) : selectedBrand ? (
                    <Card
                        style={{ maxWidth: 420 }}
                        cover={
                            selectedBrand.logoUrl ? (
                                <img
                                    alt=""
                                    src={selectedBrand.logoUrl}
                                    style={{ width: '100%', height: 220, objectFit: 'cover' }}
                                />
                            ) : (
                                <div
                                    style={{
                                        height: 220,
                                        background: '#f5f5f5',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Typography.Text type="secondary">Нет изображения</Typography.Text>
                                </div>
                            )
                        }
                    >
                        <Typography.Title level={4} style={{ marginTop: 0 }}>
                            {selectedBrand.name}
                        </Typography.Title>
                    </Card>
                ) : (
                    <Typography.Text type="secondary">
                        Бренд «{decodedSlug}» не найден в текущем списке.
                    </Typography.Text>
                )}
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            <Typography.Title level={4} style={{ margin: 0 }}>
                Бренды
            </Typography.Title>
            {loading ? (
                <Typography.Text type="secondary">Загрузка…</Typography.Text>
            ) : (
                <Row gutter={[16, 16]}>
                    {brands.map((brand) => (
                        <Col xs={24} sm={12} md={8} lg={6} key={brand.id}>
                            <Link
                                to={`/brands/${brand.id}`}
                                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                            >
                                <Card
                                    hoverable
                                    cover={
                                        brand.logoUrl ? (
                                            <img
                                                alt=""
                                                src={brand.logoUrl}
                                                style={{ height: 160, width: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    height: 160,
                                                    background: '#f5f5f5',
                                                    display: 'grid',
                                                    placeItems: 'center',
                                                }}
                                            >
                                                <Typography.Text type="secondary">Нет фото</Typography.Text>
                                            </div>
                                        )
                                    }
                                >
                                    <Typography.Text strong>{brand.name}</Typography.Text>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            )}
        </Flex>
    );
};

export default BrandsLayout;
