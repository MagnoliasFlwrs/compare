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
import SpecificationsLayout from "./routes/SpecificationsLayout";
import PowertrainLayout from "./routes/PowertrainLayout";
import TrimsLayout from "./routes/TrimsLayout";
import ManageCountriesLayout from "./routes/ManageCountriesLayout";
import ManageBodyTypesLayout from "./routes/ManageBodyTypesLayout";
import ManageDriveTypesLayout from "./routes/ManageDriveTypesLayout";
import ManageEngineTypesLayout from "./routes/ManageEngineTypesLayout";
import ManageTransmissionTypesLayout from "./routes/ManageTransmissionTypesLayout";

function isAdminUser(user: unknown): boolean {
    if (!user || typeof user !== 'object') return false;
    return (user as { role?: unknown }).role === 'ADMIN';
}

const AppRoutes = () => {
    const isAuth = useAuth((state) => state.isAuth);
    const user = useAuth((state) => state.user);
    const isAdmin = isAdminUser(user);

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
            path: 'brands/:id/:modelId/:generationId/trims',
            element: <TrimsLayout />,
            errorElement: <ErrorPage />,
        },
        {
            path: 'brands/:id/:modelId/:generationId/powertrain',
            element: <PowertrainLayout />,
            errorElement: <ErrorPage />,
        },
        {
            path: 'brands/:id/:modelId/:generationId/specifications',
            element: <SpecificationsLayout />,
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
        ...(isAdmin
            ? [
                  {
                      path: 'manage-countries',
                      element: <ManageCountriesLayout />,
                      errorElement: <ErrorPage />,
                  },
                  {
                      path: 'manage-body-types',
                      element: <ManageBodyTypesLayout />,
                      errorElement: <ErrorPage />,
                  },
                  {
                      path: 'manage-drive-types',
                      element: <ManageDriveTypesLayout />,
                      errorElement: <ErrorPage />,
                  },
                  {
                      path: 'manage-engine-types',
                      element: <ManageEngineTypesLayout />,
                      errorElement: <ErrorPage />,
                  },
                  {
                      path: 'manage-transmission-types',
                      element: <ManageTransmissionTypesLayout />,
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
