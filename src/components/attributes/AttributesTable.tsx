import React from 'react';
import { DeleteOutlined, EditOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Attribute } from '../../types/attributes';
import type { AttributesListMeta } from '../../types/attributes';
import {
    ADVANTAGE_LABELS,
    CATEGORY_LABELS,
    TYPE_LABELS,
} from './attributeLabels';

interface Props {
    data: Attribute[];
    loading: boolean;
    meta: AttributesListMeta | null;
    page: number;
    limit: number;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (record: Attribute) => void;
    onManageOptions: (record: Attribute) => void;
    onDelete: (record: Attribute) => Promise<void>;
}

const AttributesTable: React.FC<Props> = ({
    data,
    loading,
    meta,
    page,
    limit,
    onPageChange,
    onEdit,
    onManageOptions,
    onDelete,
}) => {
    const columns: ColumnsType<Attribute> = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Блок',
            dataIndex: 'category',
            key: 'category',
            width: 180,
            render: (c: Attribute['category']) => (
                <Tag>{CATEGORY_LABELS[c] ?? c}</Tag>
            ),
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            width: 160,
            render: (t: Attribute['type']) => TYPE_LABELS[t] ?? t,
        },
        {
            title: 'Единица',
            dataIndex: 'unit',
            key: 'unit',
            width: 100,
            render: (u: string) => u?.trim() || '—',
        },
        {
            title: 'Преимущество',
            dataIndex: 'advantageType',
            key: 'advantageType',
            width: 150,
            render: (a: Attribute['advantageType']) => ADVANTAGE_LABELS[a] ?? a,
        },
        {
            title: 'Значений',
            key: 'optionsCount',
            width: 90,
            align: 'center',
            render: (_, r) =>
                r.type === 'SELECT' ? (r.options?.length ?? 0) : '—',
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 160,
            render: (_, record) => (
                <Space>
                    {record.type === 'SELECT' ? (
                        <Tooltip title="Значения">
                            <Button
                                type="link"
                                aria-label="Значения"
                                onClick={() => onManageOptions(record)}
                            >
                                <UnorderedListOutlined />
                            </Button>
                        </Tooltip>
                    ) : null}
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
            <Table<Attribute>
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{
                    current: meta?.page ?? page,
                    pageSize: meta?.limit ?? limit,
                    total: meta?.itemCount ?? 0,
                    showSizeChanger: true,
                    pageSizeOptions: [10, 20, 50, 100],
                    showTotal: (t) => `Всего: ${t}`,
                    onChange: (p, ps) => onPageChange(p, ps),
                }}
            />
        </ConfigProvider>
    );
};

export default AttributesTable;
