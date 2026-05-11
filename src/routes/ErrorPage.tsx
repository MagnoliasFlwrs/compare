import React from 'react';
import { Button, Result, Typography } from 'antd';
import {
    isRouteErrorResponse,
    useNavigate,
    useRouteError,
} from 'react-router-dom';

const ErrorPage = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    const isRrError = isRouteErrorResponse(error);
    const isNotFound = !error;

    const status = isRrError ? String(error.status) : isNotFound ? '404' : '500';
    const title = isRrError
        ? error.statusText || 'Ошибка'
        : isNotFound
          ? 'Страница не найдена'
          : 'Что-то пошло не так';

    const details = isRouteErrorResponse(error)
        ? error.data
        : error instanceof Error
          ? error.message
          : undefined;

    return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
            <Result
                status={status as any}
                title={title}
                subTitle={
                    details ? (
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                            {String(details)}
                        </Typography.Paragraph>
                    ) : isNotFound ? (
                        'Проверьте адрес или перейдите на главную.'
                    ) : (
                        'Попробуйте обновить страницу или вернуться назад.'
                    )
                }
                extra={[
                    <Button key="back" onClick={() => navigate(-1)}>
                        Назад
                    </Button>,
                    <Button key="home" type="primary" onClick={() => navigate('/', { replace: true })}>
                        На главную
                    </Button>,

                ]}
            />
        </div>
    );
};

export default ErrorPage;