import React from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type {
    Specification,
    SpecificationsListMeta,
    SpecificationsQuery,
} from '../../stores/specificationStore';

interface Props {
    data: Specification[];
    loading: boolean;
    meta: SpecificationsListMeta | null;
    query: SpecificationsQuery;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (record: Specification) => void;
    onDelete: (record: Specification) => Promise<void>;
}

const SpecificationsTable: React.FC<Props> = ({
    data,
    loading,
    meta,
    query,
    onPageChange,
    onEdit,
    onDelete,
}) => {
    const columns: ColumnsType<Specification> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Габариты, мм (Д×Ш×В)',
            key: 'dimensions',
            width: 180,
            render: (_, r) => `${r.length}×${r.width}×${r.height}`,
        },
        {
            title: 'Колёсная база',
            dataIndex: 'wheelbase',
            key: 'wheelbase',
            width: 130,
        },
        {
            title: 'Клиренс',
            dataIndex: 'clearance',
            key: 'clearance',
            width: 100,
        },
        {
            title: 'Бак, л',
            dataIndex: 'tank',
            key: 'tank',
            width: 90,
        },
        {
            title: 'Багажник, л',
            key: 'trunk',
            width: 140,
            render: (_, r) => `${r.trunkStandardVolume} / ${r.trunkMaximumVolume}`,
        },
        {
            title: 'Гарантия',
            dataIndex: 'warranty',
            key: 'warranty',
            ellipsis: true,
        },
        {
            title: 'Скрыта',
            key: 'isHidden',
            width: 90,
            render: (_, record) =>
                record.isHidden ? <Tag color="default">Да</Tag> : <Tag color="green">Нет</Tag>,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 140,
            render: (_, record) => (
                <Space>
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
                        title="Удалить характеристику?"
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
            <Table<Specification>
                rowKey="id"
                columns={columns}
                dataSource={data}
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

export default SpecificationsTable;
