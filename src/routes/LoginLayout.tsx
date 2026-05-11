import React, { useEffect } from 'react';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store';

type LoginFormValues = {
    login: string;
    password: string;
};

const LoginLayout = () => {
    const navigate = useNavigate();
    const { authUser, isAuth, loading, error, setError } = useAuth((s) => s);

    useEffect(() => {
        if (isAuth) navigate('/', { replace: true });
    }, [isAuth, navigate]);

    const onFinish = async (values: LoginFormValues) => {
        setError(false);
        await authUser(values);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: 24,
                background:
                    'radial-gradient(1200px circle at 20% 10%, rgba(22,119,255,0.18), transparent 40%), radial-gradient(900px circle at 80% 30%, rgba(82,196,26,0.14), transparent 35%), #f5f5f5',
            }}
        >
            <Card
                style={{ width: '100%', maxWidth: 520 }}
                styles={{ body: { padding: 24 } }}
            >
                <Flex vertical gap={16}>
                    <div >
                        <Typography.Title level={3} style={{ textAlign: 'center' }}>
                            Вход
                        </Typography.Title>

                    </div>



                    <Form<LoginFormValues>
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Логин"
                            name="login"
                            rules={[{ required: true, message: 'Введите логин' }]}
                        >
                            <Input
                                placeholder="login"
                                size="large"
                                onChange={() => error && setError(false)}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Пароль"
                            name="password"
                            rules={[{ required: true, message: 'Введите пароль' }]}
                        >
                            <Input.Password
                                placeholder="••••••••"
                                size="large"
                                onChange={() => error && setError(false)}
                            />
                        </Form.Item>

                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                            loading={loading}
                        >
                            Войти
                        </Button>
                    </Form>
                    {error ? (
                        <Alert
                            type="error"
                            showIcon
                            message="Не удалось выполнить вход"
                            description="Проверьте логин/пароль и попробуйте ещё раз."
                        />
                    ) : null}
                </Flex>
            </Card>
        </div>
    );
};

export default LoginLayout;