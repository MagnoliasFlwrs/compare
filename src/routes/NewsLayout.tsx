import React, { useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    Card,
    ConfigProvider,
    Flex,
    Form,
    Image,
    Input,
    Modal,
    Pagination,
    Popconfirm,
    Select,
    Space,
    Table,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { useBrandsStore } from '../stores/brandsStore';
import { useNewsStore, type News } from '../stores/newsStore';
import { useAuth } from '../store';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

function formatNewsDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return iso;
    }
}

type NewsFormValues = {
    brandId: string;
    text: string;
};

const NewsLayout = () => {
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const brands = useBrandsStore((s) => s.brands);
    const brandsLoading = useBrandsStore((s) => s.loading);
    const getBrands = useBrandsStore((s) => s.getBrands);

    const news = useNewsStore((s) => s.news);
    const meta = useNewsStore((s) => s.meta);
    const newsObj = useNewsStore((s) => s.newsObj);
    const newsLoading = useNewsStore((s) => s.loading);
    const getNews = useNewsStore((s) => s.getNews);
    const createNews = useNewsStore((s) => s.createNews);
    const updateNewsById = useNewsStore((s) => s.updateNewsById);
    const deleteNewsById = useNewsStore((s) => s.deleteNewsById);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editNews, setEditNews] = useState<News | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [addForm] = Form.useForm<NewsFormValues>();
    const [editForm] = Form.useForm<NewsFormValues>();

    const brandById = useMemo(() => {
        const m = new Map<string, (typeof brands)[0]>();
        for (const b of brands) m.set(b.id, b);
        return m;
    }, [brands]);

    useEffect(() => {
        const load = async () => {
            try {
                await Promise.all([
                    getNews(),
                    getBrands({ page: 1, limit: 500 }),
                ]);
            } catch {
                message.error('Не удалось загрузить данные');
            }
        };
        void load();
    }, []);

    const brandOptions = useMemo(
        () =>
            brands.map((b) => ({
                value: b.id,
                label: b.name,
            })),
        [brands],
    );

    const openEdit = (record: News) => {
        setEditNews(record);
        editForm.setFieldsValue({
            brandId: record.brandId,
            text: record.text,
        });
    };

    const onAddSubmit = async (values: NewsFormValues) => {
        setAddSubmitting(true);
        try {
            await createNews(values.brandId, values.text.trim());
            message.success('Новость создана');
            setAddOpen(false);
            addForm.resetFields();
        } catch {
            message.error('Не удалось создать новость');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: NewsFormValues) => {
        if (!editNews) return;
        setEditSubmitting(true);
        try {
            await updateNewsById(editNews.id, {
                brandId: values.brandId,
                text: values.text.trim(),
            });
            message.success('Новость обновлена');
            setEditNews(null);
            editForm.resetFields();
        } catch {
            message.error('Не удалось обновить новость');
        } finally {
            setEditSubmitting(false);
        }
    };

    const adminColumns: ColumnsType<News> = [
        {
            title: 'Дата создания',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (v: string) => formatNewsDate(v),
        },
        {
            title: 'Бренд',
            key: 'brand',
            width: 200,
            render: (_, record) => brandById.get(record.brandId)?.name ?? record.brandId,
        },
        {
            title: 'Текст',
            dataIndex: 'text',
            key: 'text',
            ellipsis: true,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button type="link"  onClick={() => openEdit(record)}>
                        <EditOutlined />
                    </Button>
                    <Popconfirm
                        title="Удалить новость?"
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={async () => {
                            try {
                                await deleteNewsById(record.id);
                                message.success('Новость удалена');
                            } catch {
                                message.error('Не удалось удалить новость');
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

    const newsFormFields = (
        <>
            <Form.Item label="Бренд" name="brandId" rules={[{ required: true, message: 'Выберите бренд' }]}>
                <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder="Бренд"
                    options={brandOptions}
                    loading={brandsLoading}
                />
            </Form.Item>
            <Form.Item label="Текст" name="text" rules={[{ required: true, message: 'Введите текст' }]}>
                <Input.TextArea rows={5} placeholder="Текст новости" />
            </Form.Item>
        </>
    );

    if (isAdmin) {
        return (
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        Новости
                    </Typography.Title>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                        Добавить новость
                    </Button>
                </Flex>

                <ConfigProvider locale={ruRU}>
                    <Table<News>
                        rowKey="id"
                        columns={adminColumns}
                        dataSource={news}
                        loading={newsLoading}
                        pagination={{
                            current: meta?.page ?? newsObj.page,
                            pageSize: meta?.limit ?? newsObj.limit,
                            total: meta?.itemCount ?? 0,
                            showSizeChanger: true,
                            pageSizeOptions: [10, 20, 50],
                            showTotal: (t) => `Всего: ${t}`,
                            onChange: (p, ps) => {
                                void getNews({ page: p, limit: ps }).catch(() => {
                                    message.error('Не удалось загрузить новости');
                                });
                            },
                        }}
                    />
                </ConfigProvider>

                <Modal
                    title="Новая новость"
                    open={addOpen}
                    onCancel={() => {
                        setAddOpen(false);
                        addForm.resetFields();
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form form={addForm} layout="vertical" onFinish={onAddSubmit}>
                        {newsFormFields}
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
                    title={editNews ? `Редактирование новости` : 'Редактирование'}
                    open={!!editNews}
                    onCancel={() => {
                        setEditNews(null);
                        editForm.resetFields();
                    }}
                    footer={null}
                    destroyOnHidden
                >
                    <Form form={editForm} layout="vertical" onFinish={onEditSubmit}>
                        {newsFormFields}
                        <Form.Item style={{ marginBottom: 0 }}>
                            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <Button
                                    onClick={() => {
                                        setEditNews(null);
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
            <Typography.Title level={4} style={{ margin: 0 }}>
                Новости
            </Typography.Title>
            {newsLoading && news.length === 0 ? (
                <Typography.Text type="secondary">Загрузка…</Typography.Text>
            ) : (
                <ConfigProvider locale={ruRU}>
                    <Flex vertical gap={16}>
                        {news.map((item) => {
                            const brand = brandById.get(item.brandId);
                            const logoSrc = brand?.logoUrl;
                            return (
                                <Card key={item.id} size="small">
                                    <Flex gap={16} align="flex-start" wrap="wrap">
                                        <Image
                                            src={logoSrc}
                                            alt=""
                                            width={56}
                                            height={56}
                                            preview={false}
                                            style={{ objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                                            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect fill='%23f0f0f0' width='56' height='56'/%3E%3C/svg%3E"
                                        />
                                        <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                                            <Typography.Text strong>{brand?.name ?? 'Бренд'}</Typography.Text>
                                            <Typography.Text type="secondary">
                                                {formatNewsDate(item.createdAt)}
                                            </Typography.Text>
                                            <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                                                {item.text}
                                            </Typography.Paragraph>
                                        </Flex>
                                    </Flex>
                                </Card>
                            );
                        })}
                        {(meta?.itemCount ?? 0) > 0 ? (
                            <Pagination
                                hideOnSinglePage
                                style={{ alignSelf: 'flex-end' }}
                                current={meta?.page ?? newsObj.page}
                                pageSize={meta?.limit ?? newsObj.limit}
                                total={meta?.itemCount ?? 0}
                                showSizeChanger
                                pageSizeOptions={[10, 20, 50]}
                                showTotal={(t) => `Всего: ${t}`}
                                onChange={(p, ps) => {
                                    void getNews({ page: p, limit: ps }).catch(() => {
                                        message.error('Не удалось загрузить новости');
                                    });
                                }}
                            />
                        ) : null}
                    </Flex>
                </ConfigProvider>
            )}
        </Flex>
    );
};

export default NewsLayout;
