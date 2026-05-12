import React, { useEffect, useMemo, useState } from 'react';
import { KeyOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { App, Avatar, Button, Dropdown, Form, Input, Layout, Modal, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { canAccessUsersAdmin, useAuth } from '../store';

function displayFioFromJwt(user: unknown): string | null {
    if (!user || typeof user !== 'object') return null;
    const u = user as Record<string, unknown>;
    const from =
        u.fullName ??
        u.name ??
        u.fio ??
        u.displayName ??
        u.username ??
        u.email;
    if (typeof from === 'string' && from.trim()) return from.trim();
    return null;
}

const MainLayout = () => {
    const navigate = useNavigate();
    const { message } = App.useApp();
    const logout = useAuth((s) => s.logout);
    const user = useAuth((s) => s.user);
    const selfUser = useAuth((s) => s.selfUser);
    const fetchSelfUser = useAuth((s) => s.fetchSelfUser);
    const changeOwnPassword = useAuth((s) => s.changeOwnPassword);
    const showUsersAdmin = canAccessUsersAdmin(user);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);
    const [form] = Form.useForm<{ oldPassword: string; newPassword: string; confirm: string }>();

    useEffect(() => {
        fetchSelfUser()
    }, []);

    const fio = useMemo(() => {
        if (selfUser?.username) return selfUser.username;
        return displayFioFromJwt(user) ?? 'Не указано';
    }, [selfUser, user]);

    const menuItems: MenuProps['items'] = useMemo(
        () => [
            {
                key: 'fio',
                label: (
                    <div style={{ maxWidth: 260, padding: '4px 0' }}>
                        <div style={{ fontWeight: 500, marginTop: 2 }}>{fio}</div>
                    </div>
                ),
                disabled: true,
            },
            { type: 'divider' },
            {
                key: 'password',
                icon: <KeyOutlined />,
                label: 'Сменить пароль',
            },
            {
                key: 'logout',
                danger: true,
                icon: <LogoutOutlined />,
                label: 'Выйти',
            },
        ],
        [fio],
    );

    const onMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'password') {
            form.resetFields();
            setPasswordModalOpen(true);
            return;
        }
        if (key === 'logout') {
            logout();
            navigate('/login', { replace: true });
        }
    };

    const onPasswordSubmit = async (values: {
        oldPassword: string;
        newPassword: string;
        confirm: string;
    }) => {
        setPasswordSubmitting(true);
        try {
            await changeOwnPassword({
                oldPassword: values.oldPassword,
                newPassword: values.newPassword,
            });
            message.success('Пароль изменён');
            setPasswordModalOpen(false);
            form.resetFields();
        } catch {
            message.error('Не удалось сменить пароль. Проверьте текущий пароль.');
        } finally {
            setPasswordSubmitting(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Layout.Header
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#fff',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Typography.Text strong>My Compare</Typography.Text>
                    {showUsersAdmin ? (
                        <Link to="/manage-users">Пользователи</Link>
                    ) : null}
                    <Link to="/news">Новости</Link>
                    <Link to="/brands">Бренды</Link>
                </div>
                <Dropdown
                    menu={{ items: menuItems, onClick: onMenuClick }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <Avatar
                        size={28}
                        icon={<UserOutlined />}
                        style={{
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            color: '#33415e',
                            border: '1px solid rgba(51, 65, 94, 0.35)',
                        }}
                    />
                </Dropdown>
            </Layout.Header>
            <Layout.Content style={{ padding: '24px 50px' }}>
                <Outlet />
            </Layout.Content>

            <Modal
                title="Сменить пароль"
                open={passwordModalOpen}
                onCancel={() => {
                    setPasswordModalOpen(false);
                    form.resetFields();
                }}
                footer={null}
                destroyOnHidden
            >
                <Form form={form} layout="vertical" onFinish={onPasswordSubmit}>
                    <Form.Item
                        label="Текущий пароль"
                        name="oldPassword"
                        rules={[{ required: true, message: 'Введите текущий пароль' }]}
                    >
                        <Input.Password autoComplete="current-password" />
                    </Form.Item>
                    <Form.Item
                        label="Новый пароль"
                        name="newPassword"
                        rules={[{ required: true, message: 'Введите новый пароль' }]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                        label="Повторите новый пароль"
                        name="confirm"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Подтвердите пароль' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Пароли не совпадают'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" loading={passwordSubmitting} block>
                            Сохранить
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default MainLayout;
