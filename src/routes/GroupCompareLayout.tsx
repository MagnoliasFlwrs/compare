/** Экран /compare/group — фильтры для подбора автомобилей. */
import React, { useEffect, useMemo, useState } from 'react';
import { ConfigProvider, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import GroupCompareFiltersPanel from '../components/compare/GroupCompareFiltersPanel';
import type { GroupCompareFilters } from '../types/groupCompare';
import { emptyGroupCompareFilters } from '../types/groupCompare';
import {
    useSpecificationStore,
    type Specification,
} from '../stores/specificationStore';
import '../components/compare/groupCompare.css';

const GroupCompareLayout = () => {
    /** Черновик фильтров (меняется сразу при кликах). */
    const [draftFilters, setDraftFilters] = useState(emptyGroupCompareFilters);
    /** Применённые фильтры (только после нажатия «Применить»). */
    const [appliedFilters, setAppliedFilters] = useState<GroupCompareFilters | null>(null);

    const specifications = useSpecificationStore((s) => s.specifications);
    const loading = useSpecificationStore((s) => s.loading);
    const query = useSpecificationStore((s) => s.specificationsObj);
    const getSpecifications = useSpecificationStore((s) => s.getSpecifications);

    useEffect(() => {
        if (!appliedFilters) return;
        const override = filtersToSpecificationsQuery(appliedFilters);
        // API не принимает page=-1 → используем первую страницу.
        getSpecifications({ page: 1, limit: 20, ...override }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters]);

    const columns: ColumnsType<Specification> = useMemo(
        () => [
            {
                title: 'Марка',
                key: 'brand',
                width: 140,
                render: (_, r) => r.generation?.model?.brand?.name ?? '—',
                fixed: 'left',
            },
            {
                title: 'Модель',
                key: 'model',
                width: 160,
                render: (_, r) => r.generation?.model?.name ?? '—',
                fixed: 'left',
            },
            {
                title: 'Длина',
                dataIndex: 'length',
                key: 'length',
                width: 110,
                sorter: (a, b) => (a.length ?? 0) - (b.length ?? 0),
            },
            {
                title: 'Высота',
                dataIndex: 'height',
                key: 'height',
                width: 110,
                sorter: (a, b) => (a.height ?? 0) - (b.height ?? 0),
            },
            {
                title: 'Ширина',
                dataIndex: 'width',
                key: 'width',
                width: 120,
                sorter: (a, b) => (a.width ?? 0) - (b.width ?? 0),
            },
            {
                title: 'Колесная база',
                dataIndex: 'wheelbase',
                key: 'wheelbase',
                width: 140,
                sorter: (a, b) => (a.wheelbase ?? 0) - (b.wheelbase ?? 0),
            },
            {
                title: 'Клиренс',
                dataIndex: 'clearance',
                key: 'clearance',
                width: 120,
                sorter: (a, b) => (a.clearance ?? 0) - (b.clearance ?? 0),
            },
            {
                title: 'Бак',
                dataIndex: 'tank',
                key: 'tank',
                width: 90,
                sorter: (a, b) => (a.tank ?? 0) - (b.tank ?? 0),
            },
            {
                title: 'Багажник',
                dataIndex: 'trunkStandardVolume',
                key: 'trunkStandardVolume',
                width: 130,
                sorter: (a, b) =>
                    (a.trunkStandardVolume ?? 0) - (b.trunkStandardVolume ?? 0),
            },
            {
                title: 'Багажник макс',
                dataIndex: 'trunkMaximumVolume',
                key: 'trunkMaximumVolume',
                width: 150,
                sorter: (a, b) =>
                    (a.trunkMaximumVolume ?? 0) - (b.trunkMaximumVolume ?? 0),
            },
            {
                title: 'Производство',
                key: 'country',
                width: 160,
                render: (_, r) => r.country?.name ?? '—',
            },
            {
                title: 'Тип кузова',
                key: 'bodyType',
                width: 140,
                render: (_, r) => r.bodyType?.name ?? '—',
            },
            {
                title: 'Гарантия',
                dataIndex: 'warranty',
                key: 'warranty',
                width: 180,
                ellipsis: true,
            },
        ],
        [],
    );

    const onApply = () => {
        setAppliedFilters(draftFilters);
    };

    const onReset = () => {
        setDraftFilters(emptyGroupCompareFilters());
        setAppliedFilters(null);
    };

    const tableData = appliedFilters ? specifications : [];
    // meta/query не используем: page=-1, таблица без пагинации

    return (
        <div className="group-compare-page">
            <Typography.Title level={3} style={{ margin: 0, textAlign: 'center' }}>
                Групповое сравнение
            </Typography.Title>
            <GroupCompareFiltersPanel
                value={draftFilters}
                onChange={setDraftFilters}
                onApply={onApply}
                onReset={onReset}
            />

            <div style={{ marginTop: 18 }}>
                <ConfigProvider locale={ruRU}>
                    <Table<Specification>
                        rowKey="id"
                        columns={columns}
                        dataSource={tableData}
                        loading={appliedFilters ? loading : false}
                        scroll={{ x: 1750 }}
                        pagination={false}
                    />
                </ConfigProvider>
            </div>
        </div>
    );
};

function filtersToSpecificationsQuery(filters: GroupCompareFilters) {
    const q: Partial<{
        brandIds: string[];
        modelIds: string[];
        bodyTypeIds: string[];
        lengthMin?: number;
        lengthMax?: number;
        wheelbaseMin?: number;
        wheelbaseMax?: number;
        heightMin?: number;
        heightMax?: number;
        widthMin?: number;
        widthMax?: number;
        trunkStandardVolumeMin?: number;
        trunkStandardVolumeMax?: number;
        trunkMaximumVolumeMin?: number;
        trunkMaximumVolumeMax?: number;
    }> = {
        brandIds: filters.brandIds.length ? filters.brandIds : undefined,
        modelIds: filters.modelIds.length ? filters.modelIds : undefined,
        bodyTypeIds: filters.bodyTypeIds.length ? filters.bodyTypeIds : undefined,
        lengthMin: filters.lengthMin,
        lengthMax: filters.lengthMax,
        wheelbaseMin: filters.wheelbaseMin,
        wheelbaseMax: filters.wheelbaseMax,
        heightMin: filters.heightMin,
        heightMax: filters.heightMax,
        widthMin: filters.widthMin,
        widthMax: filters.widthMax,
        trunkStandardVolumeMin: filters.trunkStandardVolumeMin,
        trunkStandardVolumeMax: filters.trunkStandardVolumeMax,
        trunkMaximumVolumeMin: filters.trunkMaximumVolumeMin,
        trunkMaximumVolumeMax: filters.trunkMaximumVolumeMax,
    };
    return q;
}

export default GroupCompareLayout;
