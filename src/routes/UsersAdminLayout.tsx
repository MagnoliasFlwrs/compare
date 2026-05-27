import React, { useEffect, useMemo, useState } from 'react';
import { AppstoreOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, ConfigProvider, Flex, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useUsersAdminStore, type UsersAdminRow } from '../stores/usersAdminStore';
import { useBrandsStore } from '../stores/brandsStore';

function extractServerError(e: unknown, fallback: string): string {
    if (axios.isAxiosError(e)) {
        const data = e.response?.data as unknown;
        if (data && typeof data === 'object') {
            const obj = data as Record<string, unknown>;
            const msg = obj.message ?? obj.error ?? obj.detail;
            if (typeof msg === 'string' && msg.trim()) return msg;
            if (Array.isArray(msg) && msg.length) return msg.join(', ');
        }
        if (typeof data === 'string' && data.trim()) return data;
        if (e.response?.status) return `${fallback} (HTTP ${e.response.status})`;
    }
    return fallback;
}

const UsersAdminLayout = () => {
    const { message } = App.useApp();
    const users = useUsersAdminStore((s) => s.users);
    const total = useUsersAdminStore((s) => s.total);
    const page = useUsersAdminStore((s) => s.page);
    const limit = useUsersAdminStore((s) => s.limit);
    const loading = useUsersAdminStore((s) => s.loading);
    const fetchUsers = useUsersAdminStore((s) => s.fetchUsers);
    const setPage = useUsersAdminStore((s) => s.setPage);
    const createUser = useUsersAdminStore((s) => s.createUser);
    const deleteUser = useUsersAdminStore((s) => s.deleteUser);
    const assignUserBrands = useUsersAdminStore((s) => s.assignUserBrands);

    const brands = useBrandsStore((s) => s.brands);
    const brandsLoading = useBrandsStore((s) => s.loading);
    const getBrands = useBrandsStore((s) => s.getBrands);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [form] = Form.useForm<{ username: string; password: string }>();

    const [brandsUser, setBrandsUser] = useState<UsersAdminRow | null>(null);
    const [brandsSubmitting, setBrandsSubmitting] = useState(false);
    const [brandsForm] = Form.useForm<{ brandIds: string[] }>();

    const fixedBrandIds = useMemo(() => {
        const list = brandsUser?.brands ?? [];
        return Array.from(new Set(list.map((b) => b.brandId))).filter(Boolean);
    }, [brandsUser]);

    useEffect(() => {
        void fetchUsers().catch(() => {
            message.error('Не удалось загрузить пользователей');
        });
        void getBrands({ page: 1, limit: 500 }).catch(() => {
            message.error('Не удалось загрузить бренды');
        });
    }, []);

    useEffect(() => {
        if (!brandsUser) return;
        brandsForm.setFieldsValue({ brandIds: fixedBrandIds });
    }, [brandsUser, fixedBrandIds, brandsForm]);

    const brandOptions = useMemo(
        () =>
            brands.map((b) => ({
                value: b.id,
                label: b.name,
            })),
        [brands],
    );

    const columns: ColumnsType<UsersAdminRow> = [
        {
            title: 'Пользователь',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 200,
            align: 'center',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<AppstoreOutlined />}
                        aria-label="Бренды"
                        title="Добавить бренды"
                        onClick={() => {
                            brandsForm.resetFields();
                            setBrandsUser(record);
                        }}
                    />
                    <Popconfirm
                        title="Удалить пользователя?"
                        description={`${record.username} будет удалён.`}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={async () => {
                            try {
                                await deleteUser(record.id);
                                message.success('Пользователь удалён');
                            } catch {
                                message.error('Не удалось удалить пользователя');
                            }
                        }}
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} aria-label="Удалить" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const onBrandsSubmit = async (values: { brandIds: string[] }) => {
        if (!brandsUser) return;
        const ids = (values.brandIds ?? []).map((s) => s.trim()).filter(Boolean);
        if (ids.length === 0) {
            message.warning('Укажите хотя бы один ID бренда');
            return;
        }
        setBrandsSubmitting(true);
        try {
            await assignUserBrands(brandsUser.id, ids);
            message.success('Бренды назначены');
            setBrandsUser(null);
            brandsForm.resetFields();
        } catch (e) {
            message.error(extractServerError(e, 'Не удалось назначить бренды'));
        } finally {
            setBrandsSubmitting(false);
        }
    };

    const onAddSubmit = async (values: { username: string; password: string }) => {
        setAddSubmitting(true);
        try {
            await createUser(values);
            message.success('Пользователь добавлен');
            setAddOpen(false);
            form.resetFields();
        } catch {
            message.error('Не удалось создать пользователя');
        } finally {
            setAddSubmitting(false);
        }
    };

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Пользователи
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
                    Добавить
                </Button>
            </Flex>

            <ConfigProvider locale={ruRU}>
                <Table<UsersAdminRow>
                    rowKey="id"
                    columns={columns}
                    dataSource={users}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50],
                        showTotal: (t) => `Всего: ${t}`,
                        onChange: (p, ps) => {
                            setPage(p);
                            void fetchUsers({ page: p, limit: ps }).catch(() => {
                                message.error('Не удалось загрузить пользователей');
                            });
                        },
                    }}
                />
            </ConfigProvider>

            <Modal
                title={brandsUser ? `Бренды: ${brandsUser.username}` : 'Бренды'}
                open={!!brandsUser}
                onCancel={() => {
                    setBrandsUser(null);
                    brandsForm.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={brandsForm} layout="vertical" onFinish={onBrandsSubmit}>
                    <Form.Item
                        label="Бренды"
                        name="brandIds"
                        rules={[{ required: true, message: 'Выберите бренды' }]}
                    >
                        <Select
                            mode="multiple"
                            showSearch
                            optionFilterProp="label"
                            placeholder="Бренд"
                            options={brandOptions}
                            loading={brandsLoading}
                            style={{ width: '100%' }}
                            onChange={(next) => {
                                // Уже заданные бренды нельзя убрать: только добавляем новые.
                                const chosen = (next ?? []).map(String);
                                const merged = Array.from(
                                    new Set([...fixedBrandIds, ...chosen]),
                                );
                                brandsForm.setFieldsValue({ brandIds: merged });
                            }}
                        />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button
                                onClick={() => {
                                    setBrandsUser(null);
                                    brandsForm.resetFields();
                                }}
                            >
                                Отмена
                            </Button>
                            <Button type="primary" htmlType="submit" loading={brandsSubmitting}>
                                Сохранить
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Новый пользователь"
                open={addOpen}
                onCancel={() => {
                    setAddOpen(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={onAddSubmit}>
                    <Form.Item
                        label="Имя пользователя"
                        name="username"
                        rules={[{ required: true, message: 'Введите имя пользователя' }]}
                    >
                        <Input autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                        label="Пароль"
                        name="password"
                        rules={[{ required: true, message: 'Введите пароль' }]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                            <Button onClick={() => setAddOpen(false)}>Отмена</Button>
                            <Button type="primary" htmlType="submit" loading={addSubmitting}>
                                Создать
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </Flex>
    );
};

export default UsersAdminLayout;
