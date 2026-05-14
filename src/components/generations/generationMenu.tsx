import React from 'react';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';

/**
 * Общие пункты меню для перехода в разделы одного поколения.
 * Используется и в таблице (контекстное меню по строке), и в гриде карточек.
 */
export const getGenerationMenuItems = (
    brandId: string,
    modelId: string,
    generationId: string,
): NonNullable<MenuProps['items']> => {
    const enc = encodeURIComponent;
    const base = `/brands/${enc(brandId)}/${enc(modelId)}/${enc(generationId)}`;
    return [
        {
            key: 'trims',
            label: <Link to={`${base}/trims`}>Комплектации</Link>,
        },
        {
            key: 'specifications',
            label: <Link to={`${base}/specifications`}>Базовые характеристики</Link>,
        },
        {
            key: 'powertrain',
            label: <Link to={`${base}/powertrain`}>Силовые агрегаты</Link>,
        },
    ];
};
