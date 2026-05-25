import React, { useMemo } from 'react';
import { DeleteOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Trim, TrimsListMeta, TrimsQuery } from '../../stores/trimsStore';
import { sortByOrder } from '../../utils/sortByOrder';

interface Props {
    data: Trim[];
    loading: boolean;
    meta: TrimsListMeta | null;
    query: TrimsQuery;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (record: Trim) => void;
    onManageAttributes: (record: Trim) => void;
    onDelete: (record: Trim) => Promise<void>;
}

const TrimsTable: React.FC<Props> = ({
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

    const columns: ColumnsType<Trim> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Порядок',
            dataIndex: 'order',
            key: 'order',
            width: 110,
            sorter: (a, b) => (a.order ?? 0) - (b.order ?? 0),
        },
        {
            title: 'Опубликована',
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
                        title="Удалить комплектацию?"
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
            <Table<Trim>
                rowKey="id"
                columns={columns}
                dataSource={sortedData}
                loading={loading}
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

export default TrimsTable;
