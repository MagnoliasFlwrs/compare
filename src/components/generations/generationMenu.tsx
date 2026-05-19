import React from 'react';
import type { MenuProps } from 'antd';
import { Link } from 'react-router-dom';

export type GenerationSectionLink = {
    key: string;
    label: string;
    to: string;
};

export function getGenerationBasePath(
    brandId: string,
    modelId: string,
    generationId: string,
): string {
    const enc = encodeURIComponent;
    return `/brands/${enc(brandId)}/${enc(modelId)}/${enc(generationId)}`;
}

/** Сводная страница характеристик для пользователя. */
export function getGenerationCharacteristicsLink(
    brandId: string,
    modelId: string,
    generationId: string,
): string {
    return `${getGenerationBasePath(brandId, modelId, generationId)}/characteristics`;
}

/** Базовый путь поколения и разделы — один источник для меню и списка ссылок. */
export const getGenerationSectionLinks = (
    brandId: string,
    modelId: string,
    generationId: string,
): GenerationSectionLink[] => {
    const base = getGenerationBasePath(brandId, modelId, generationId);
    return [
        { key: 'trims', label: 'Комплектации', to: `${base}/trims` },
        { key: 'specifications', label: 'Базовые характеристики', to: `${base}/specifications` },
        { key: 'powertrain', label: 'Силовые агрегаты', to: `${base}/powertrain` },
    ];
};

/**
 * Пункты Dropdown для админской таблицы.
 */
export const getGenerationMenuItems = (
    brandId: string,
    modelId: string,
    generationId: string,
): NonNullable<MenuProps['items']> =>
    getGenerationSectionLinks(brandId, modelId, generationId).map((item) => ({
        key: item.key,
        label: <Link to={item.to}>{item.label}</Link>,
    }));
