import React, { useEffect, useMemo, useState } from 'react';
import {App, Checkbox, Divider, Flex, InputNumber, Spin, Typography} from 'antd';
import type { GroupCompareFilters } from '../../types/groupCompare';
import { useBrandsStore } from '../../stores/brandsStore';
import { useBodyTypesStore } from '../../stores/bodyTypesStore';
import { axiosInstanceAll, baseAuthUrl } from '../../store';
import { useModelStore, type Model } from '../../stores/modelsStore';
import './groupCompare.css';

interface Props {
    value: GroupCompareFilters;
    onChange: (next: GroupCompareFilters) => void;
}

function toggleId(ids: string[], id: string, checked: boolean): string[] {
    if (checked) return ids.includes(id) ? ids : [...ids, id];
    return ids.filter((x) => x !== id);
}

function RangeItem({
    label,
    minKey,
    maxKey,
    value,
    onChange,
}: {
    label: string;
    minKey: keyof GroupCompareFilters;
    maxKey: keyof GroupCompareFilters;
    value: GroupCompareFilters;
    onChange: (next: GroupCompareFilters) => void;
}) {
    const minVal = value[minKey] as number | undefined;
    const maxVal = value[maxKey] as number | undefined;

    const patch = (patch: Partial<GroupCompareFilters>) => onChange({ ...value, ...patch });

    return (
        <div className="group-compare-range-item">
            <Typography.Text className="group-compare-range-title">{label}</Typography.Text>
            <Flex align="center" gap={10} wrap={false}>
                <Flex align="center" gap={6} className="group-compare-range-field">
                    <Typography.Text type="secondary" className="group-compare-range-label">
                        от
                    </Typography.Text>
                    <InputNumber
                        min={0}
                        value={minVal}
                        onChange={(n) => patch({ [minKey]: n ?? undefined })}
                    />
                </Flex>
                <Flex align="center" gap={6} className="group-compare-range-field">
                    <Typography.Text type="secondary" className="group-compare-range-label">
                        до
                    </Typography.Text>
                    <InputNumber
                        min={0}
                        value={maxVal}
                        onChange={(n) => patch({ [maxKey]: n ?? undefined })}
                    />
                </Flex>
            </Flex>
        </div>
    );
}

async function fetchModelsByBrand(brandId: string): Promise<Model[]> {
    const limit = 100; // API: limit must not be greater than 100
    let page = 1;
    const out: Model[] = [];

    while (true) {
        const res = await axiosInstanceAll.get(`${baseAuthUrl}/models`, {
            params: { page, limit, brandId },
            headers: { accept: 'application/json' },
        });

        const body = res.data as {
            data?: Model[];
            meta?: { hasNextPage?: boolean };
        };
        if (Array.isArray(body?.data)) out.push(...body.data);

        if (!body?.meta?.hasNextPage) break;
        page += 1;
    }

    return out;
}

const GroupCompareFiltersPanel: React.FC<Props> = ({ value, onChange }) => {
    const { message } = App.useApp();
    const brands = useBrandsStore((s) => s.brands);
    const brandsLoading = useBrandsStore((s) => s.loading);
    const getBrands = useBrandsStore((s) => s.getBrands);
    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const bodyTypesLoading = useBodyTypesStore((s) => s.loading);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);
    const _ = useModelStore((s) => s.modelsByBrand); // keep store initialized (not used yet)

    const [modelsLoading, setModelsLoading] = useState(false);
    const [modelsByBrandId, setModelsByBrandId] = useState<Record<string, Model[]>>({});

    useEffect(() => {
        Promise.all([
            getBrands({ page: 1, limit: 500 }),
            getBodyTypes({ page: 1, limit: 500 }),
        ]).catch(() => message.error('Не удалось загрузить фильтры'));
    }, [getBrands, getBodyTypes, message]);

    const visibleBrands = brands
        .filter((b) => !b.isHidden)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    const sortedBodyTypes = [...bodyTypes].sort((a, b) =>
        a.name.localeCompare(b.name, 'ru'),
    );

    useEffect(() => {
        const brandIds = value.brandIds;
        if (brandIds.length === 0) {
            setModelsByBrandId({});
            if (value.modelIds.length > 0) onChange({ ...value, modelIds: [] });
            return;
        }

        let cancelled = false;
        setModelsLoading(true);

        Promise.all(
            brandIds.map(async (brandId) => ({
                brandId,
                models: await fetchModelsByBrand(brandId),
            })),
        )
            .then((pairs) => {
                if (cancelled) return;
                const next: Record<string, Model[]> = {};
                for (const p of pairs) next[p.brandId] = p.models;
                setModelsByBrandId(next);
            })
            .catch(() => message.error('Не удалось загрузить модели'))
            .finally(() => !cancelled && setModelsLoading(false));

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.brandIds.join('|')]);

    const mergedVisibleModels = useMemo(() => {
        const map = new Map<string, Model>();
        for (const brandId of value.brandIds) {
            for (const m of modelsByBrandId[brandId] ?? []) {
                if (!m?.id) continue;
                if (!m.isHidden) map.set(m.id, m);
            }
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    }, [modelsByBrandId, value.brandIds]);

    const toggleBrand = (id: string, checked: boolean) => {
        const nextBrandIds = toggleId(value.brandIds, id, checked);
        if (checked) {
            onChange({ ...value, brandIds: nextBrandIds });
            return;
        }
        // При снятии бренда — чистим modelIds, которые к нему относились (когда подгрузим список).
        const removedModels = new Set((modelsByBrandId[id] ?? []).map((m) => m.id));
        const nextModelIds = value.modelIds.filter((mid) => !removedModels.has(mid));
        onChange({ ...value, brandIds: nextBrandIds, modelIds: nextModelIds });
    };

    const toggleModel = (id: string, checked: boolean) => {
        onChange({ ...value, modelIds: toggleId(value.modelIds, id, checked) });
    };

    const toggleBodyType = (id: string, checked: boolean) => {
        onChange({ ...value, bodyTypeIds: toggleId(value.bodyTypeIds, id, checked) });
    };

    return (
        <div className="group-compare-filters">
            <div className="group-compare-filters-row">
                <div className="group-compare-filters-block">
                    <Divider titlePlacement="start" style={{borderColor:'#16182f'}}> Бренды</Divider>

                    {brandsLoading ? (
                        <Spin size="small" />
                    ) : (
                        <div className="group-compare-inline-list">
                            {visibleBrands.map((brand) => (
                                <label key={brand.id} className="group-compare-brand-item">
                                    <Checkbox
                                        checked={value.brandIds.includes(brand.id)}
                                        onChange={(e) => toggleBrand(brand.id, e.target.checked)}
                                    />
                                    {brand.logoUrl ? (
                                        <img
                                            src={brand.logoUrl}
                                            alt=""
                                            className="group-compare-brand-logo"
                                        />
                                    ) : (
                                        <span className="group-compare-brand-logo group-compare-brand-logo--empty" />
                                    )}
                                    <Typography.Text className="group-compare-brand-name">
                                        {brand.name}
                                    </Typography.Text>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <div className="group-compare-filters-block">
                    <Divider titlePlacement="start" style={{borderColor:'#16182f'}}> Модели</Divider>

                    {value.brandIds.length === 0 ? (
                        <Typography.Text type="secondary">
                            Выберите бренд(ы)
                        </Typography.Text>
                    ) : modelsLoading ? (
                        <Spin size="small" />
                    ) : mergedVisibleModels.length === 0 ? (
                        <Typography.Text type="secondary">Нет моделей</Typography.Text>
                    ) : (
                        <div className="group-compare-inline-list">
                            {mergedVisibleModels.map((m) => (
                                <Checkbox
                                    key={m.id}
                                    checked={value.modelIds.includes(m.id)}
                                    onChange={(e) => toggleModel(m.id, e.target.checked)}
                                >
                                    {m.name}
                                </Checkbox>
                            ))}
                        </div>
                    )}
                </div>

                <div className="group-compare-filters-block">

                    <Divider titlePlacement="start" style={{borderColor:'#16182f'}}> Типы кузова</Divider>
                    {bodyTypesLoading ? (
                        <Spin size="small" />
                    ) : (
                        <div className="group-compare-inline-list">
                            {sortedBodyTypes.map((bt) => (
                                <Checkbox
                                    key={bt.id}
                                    checked={value.bodyTypeIds.includes(bt.id)}
                                    onChange={(e) => toggleBodyType(bt.id, e.target.checked)}
                                >
                                    {bt.name}
                                </Checkbox>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="group-compare-filters-row">
                <div className="group-compare-filters-block group-compare-filters-block--wide">
                    <Divider titlePlacement="start" style={{borderColor:'#16182f'}}>  Габариты и объёмы</Divider>
                    <div className="group-compare-range-list">
                        <RangeItem
                            label="Длина, см"
                            minKey="lengthMin"
                            maxKey="lengthMax"
                            value={value}
                            onChange={onChange}
                        />
                        <RangeItem
                            label="Колесная база, см"
                            minKey="wheelbaseMin"
                            maxKey="wheelbaseMax"
                            value={value}
                            onChange={onChange}
                        />
                        <RangeItem
                            label="Высота, см"
                            minKey="heightMin"
                            maxKey="heightMax"
                            value={value}
                            onChange={onChange}
                        />
                        <RangeItem
                            label="Ширина, см"
                            minKey="widthMin"
                            maxKey="widthMax"
                            value={value}
                            onChange={onChange}
                        />
                        <RangeItem
                            label="Багажник, л"
                            minKey="trunkStandardVolumeMin"
                            maxKey="trunkStandardVolumeMax"
                            value={value}
                            onChange={onChange}
                        />
                        <RangeItem
                            label="Багажник, max, л"
                            minKey="trunkMaximumVolumeMin"
                            maxKey="trunkMaximumVolumeMax"
                            value={value}
                            onChange={onChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupCompareFiltersPanel;
