import React from 'react';
import { Button, ConfigProvider, Flex, Typography } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import CompareTableView from '../components/compare/CompareTableView';
import type { CompareNavigateState } from '../types/compare';

const CompareResultLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as CompareNavigateState | null;
    const isValid = Boolean(state?.left?.brandId && state?.right?.brandId);

    if (!isValid || !state) {
        return <Navigate to="/compare" replace />;
    }

    return (
        <ConfigProvider locale={ruRU}>
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="gap" className="no-print">
                    <Typography.Title level={3} style={{ margin: 0 }}>
                        Сравнение
                    </Typography.Title>
                    <Button onClick={() => navigate('/compare', { state })}>
                        Изменить выбор
                    </Button>
                </Flex>

                <CompareTableView state={state} />

                <Flex justify="center" className="no-print">
                    <Link to="/compare">← Вернуться к выбору автомобилей</Link>
                </Flex>
            </Flex>
        </ConfigProvider>
    );
};

export default CompareResultLayout;
