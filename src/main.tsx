import React, { Suspense } from 'react';
import './index.css';
import 'antd/dist/reset.css';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, Spin } from 'antd';
import { canAccessUsersAdmin, useAuth } from './store';
import LoginLayout from "./routes/LoginLayout";
import ErrorPage from "./routes/ErrorPage";
import MainLayout from "./routes/MainLayout";
import UsersAdminLayout from "./routes/UsersAdminLayout";
import NewsLayout from "./routes/NewsLayout";
import BrandsLayout from "./routes/BrandsLayout";
import BrandPage from "./components/brands/BrandPage";
import GenerationsLayout from "./routes/GenerationsLayout";


const AppRoutes = () => {
    const isAuth = useAuth((state) => state.isAuth);
    const user = useAuth((state) => state.user);

    const mainChildren = [
        {
            index: true as const,
            element: <p>index</p>,
        },
        {
            path: 'news',
            element: <NewsLayout />,
            errorElement: <ErrorPage />,
        },
        {
            path: 'brands/:id/:modelId',
            element: <GenerationsLayout />,
            errorElement: <ErrorPage />,
        },
        {
            path: 'brands/:id',
            element: <BrandPage />,
            errorElement: <ErrorPage />,
        },
        {
            path: 'brands',
            element: <BrandsLayout />,
            errorElement: <ErrorPage />,
        },
        ...(canAccessUsersAdmin(user)
            ? [
                  {
                      path: 'manage-users',
                      element: <UsersAdminLayout />,
                      errorElement: <ErrorPage />,
                  },
              ]
            : []),
    ];

    const unauthRoutes = [
        {
            path: '/login',
            element: <LoginLayout />,
            errorElement: <ErrorPage />,
        },
        {
            path: '*',
            element: <Navigate to="/login" replace />,
        },
    ];

    const authRoutes = [
        {
            path: '/login',
            element: <LoginLayout />,
            errorElement: <ErrorPage />,
        },

        {
            path: '/',
            element: <MainLayout />,
            errorElement: <ErrorPage />,
            children: mainChildren,
        },
        {
            path: '*',
            element: <ErrorPage />,
        },
    ];

    const allRoutes = isAuth ? authRoutes : unauthRoutes;
    const router = createBrowserRouter(allRoutes);

    return <RouterProvider router={router} />;
};

const container = document.getElementById('root');

if (!container) {
    throw new Error('Root element not found');
}

const root = createRoot(container);

const contentStyle = {
    padding: 50,
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
};

root.render(
    <ConfigProvider
        theme={{
            token: {
                colorPrimary: '#33415e',
            },
        }}
    >
        <AntdApp>
            <Suspense
                fallback={
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100vh',
                        }}
                    >
                        <Spin tip="Загрузка..." size="large">
                            <div style={contentStyle}></div>
                        </Spin>
                    </div>
                }
            >
                <AppRoutes />
            </Suspense>
        </AntdApp>
    </ConfigProvider>,
);
