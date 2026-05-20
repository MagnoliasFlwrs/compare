import React, { useState } from 'react';
import { Button, ConfigProvider, Divider, Flex, Typography } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useNavigate } from 'react-router-dom';
import CarSelectorColumn from '../components/compare/CarSelectorColumn';
import {
    draftToSelection,
    isCompareSideReady,
    type CompareNavigateState,
    type CompareSideDraft,
} from '../types/compare';

const emptySide = (): CompareSideDraft => ({});

const CompareSelectLayout = () => {
    const navigate = useNavigate();
    const [left, setLeft] = useState<CompareSideDraft>(emptySide);
    const [right, setRight] = useState<CompareSideDraft>(emptySide);

    const canCompare = isCompareSideReady(left) && isCompareSideReady(right);

    const onCompare = () => {
        if (!canCompare) return;
        const state: CompareNavigateState = {
            left: draftToSelection(left),
            right: draftToSelection(right),
        };
        navigate('/compare/result', { state });
    };

    return (
        <ConfigProvider locale={ruRU}>
            <Flex vertical gap={32} style={{ maxWidth: 1100, margin: '0 auto' }}>
                <Typography.Title level={3} style={{ margin: 0, textAlign: 'center' }}>
                    Сравнение автомобилей
                </Typography.Title>
                <Typography.Paragraph
                    type="secondary"
                    style={{ margin: 0, textAlign: 'center' }}
                >
                    Выберите бренд и модель для каждого автомобиля. Остальные поля необязательны —
                    без них к сравнению попадут все поколения модели.
                </Typography.Paragraph>

                <Flex
                    gap={0}
                    align="stretch"
                    wrap="wrap"
                    style={{ justifyContent: 'center' }}
                >
                    <div style={{ flex: '1 1 320px', padding: '0 24px' }}>
                        <CarSelectorColumn title="Первый автомобиль" value={left} onChange={setLeft} />
                    </div>
                    <Divider
                        type="vertical"
                        style={{ height: 'auto', minHeight: 280, margin: '0 8px' }}
                    />
                    <div style={{ flex: '1 1 320px', padding: '0 24px' }}>
                        <CarSelectorColumn
                            title="Второй автомобиль"
                            value={right}
                            onChange={setRight}
                        />
                    </div>
                </Flex>

                {canCompare ? (
                    <Flex justify="center">
                        <Button type="primary" size="large" onClick={onCompare}>
                            Перейти к сравнению
                        </Button>
                    </Flex>
                ) : null}
            </Flex>
        </ConfigProvider>
    );
};

export default CompareSelectLayout;
