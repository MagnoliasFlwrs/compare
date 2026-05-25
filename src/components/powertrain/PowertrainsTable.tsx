import React, { useMemo } from 'react';
import { DeleteOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type {
    Powertrain,
    PowertrainsListMeta,
    PowertrainsQuery,
} from '../../stores/powertrainStore';
import { useDriveTypesStore } from '../../stores/driveTypesStore';
import { sortByOrder } from '../../utils/sortByOrder';

interface Props {
    data: Powertrain[];
    loading: boolean;
    meta: PowertrainsListMeta | null;
    query: PowertrainsQuery;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (record: Powertrain) => void;
    onManageAttributes: (record: Powertrain) => void;
    onDelete: (record: Powertrain) => Promise<void>;
}

function pickIdString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        for (const key of ['id', 'value', 'uuid']) {
            const c = v[key];
            if (typeof c === 'string') return c;
        }
    }
    return '';
}

const PowertrainsTable: React.FC<Props> = ({
    data,
    loading,
    meta,
    query,
    onPageChange,
    onEdit,
    onManageAttributes,
    onDelete,
}) => {
    const sortedData = useMemo(() => sortByOrder(data), [data]);

    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const driveTypeNameById = React.useMemo(() => {
        const map = new Map<string, string>();
        for (const d of driveTypes) map.set(d.id, d.name);
        return map;
    }, [driveTypes]);

    const columns: ColumnsType<Powertrain> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Порядок',
            dataIndex: 'order',
            key: 'order',
            width: 90,
        },
        {
            title: 'Двигатель',
            key: 'engine',
            ellipsis: true,
            render: (_, r) =>
                r.enginePower
                    ? `${r.engine ?? ''} · ${r.enginePower} л.с.`.trim()
                    : (r.engine ?? '—'),
        },
        {
            title: 'КПП',
            key: 'transmission',
            ellipsis: true,
            render: (_, r) =>
                r.numOfGears
                    ? `${r.transmission ?? ''} · ${r.numOfGears} ст.`.trim()
                    : (r.transmission ?? '—'),
        },
        {
            title: 'Привод',
            key: 'driveType',
            width: 120,
            render: (_, r) => {
                const id = pickIdString(r.driveTypeId);
                return id ? (driveTypeNameById.get(id) ?? '—') : '—';
            },
        },
        {
            title: '0–100, с',
            dataIndex: 'acceleration',
            key: 'acceleration',
            width: 100,
            render: (v) => (v != null ? v : '—'),
        },
        {
            title: 'Расход',
            dataIndex: 'consumption',
            key: 'consumption',
            width: 100,
            render: (v) => (v != null ? v : '—'),
        },
        {
            title: 'Мест',
            dataIndex: 'numOfSeats',
            key: 'numOfSeats',
            width: 80,
            render: (v) => (v != null ? v : '—'),
        },
        {
            title: 'Опубликован',
            key: 'isPublished',
            width: 110,
            render: (_, record) =>
                record.isHidden ? (
                    <Tag color="default">Нет</Tag>
                ) : (
                    <Tag color="green">Да</Tag>
                ),
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Доп. характеристики">
                        <Button
                            type="link"
                            aria-label="Доп. характеристики"
                            onClick={() => onManageAttributes(record)}
                        >
                            <TagsOutlined />
                        </Button>
                    </Tooltip>
                    <Tooltip title="Редактировать">
                        <Button
                            type="link"
                            aria-label="Редактировать"
                            onClick={() => onEdit(record)}
                        >
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                    <Popconfirm
                        title="Удалить силовой агрегат?"
                        description={record.name}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record)}
                    >
                        <Tooltip title="Удалить">
                            <Button type="link" danger aria-label="Удалить">
                                <DeleteOutlined />
                            </Button>
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider locale={ruRU}>
            <Table<Powertrain>
                rowKey="id"
                columns={columns}
                dataSource={sortedData}
                loading={loading}
                scroll={{ x: 1100 }}
                pagination={{
                    current: meta?.page ?? query.page,
                    pageSize: meta?.limit ?? query.limit,
                    total: meta?.itemCount ?? 0,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50],
                    showTotal: (t) => `Всего: ${t}`,
                    onChange: (p, ps) => onPageChange(p, ps),
                }}
            />
        </ConfigProvider>
    );
};

export default PowertrainsTable;
