import React from 'react';
import { DeleteOutlined, EditOutlined, PictureOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Generation, GenerationsListMeta, GenerationsQuery } from '../../types/generation';

interface Props {
    data: Generation[];
    loading: boolean;
    meta: GenerationsListMeta | null;
    query: GenerationsQuery;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (record: Generation) => void;
    onDelete: (record: Generation) => Promise<void>;
    onOpenImages: (record: Generation) => void;
}

const GenerationsTable: React.FC<Props> = ({
    data,
    loading,
    meta,
    query,
    onPageChange,
    onEdit,
    onDelete,
    onOpenImages,
}) => {
    const columns: ColumnsType<Generation> = [
        {
            title: 'Номер',
            dataIndex: 'number',
            key: 'number',
            width: 90,
        },
        {
            title: 'Рестайлинг',
            dataIndex: 'restyling',
            key: 'restyling',
            ellipsis: true,
        },
        {
            title: 'Годы',
            key: 'years',
            width: 140,
            render: (_, r) => `${r.yearFrom}–${r.yearTo}`,
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 220,
            onCell: () => ({
                onClick: (e) => e.stopPropagation(),
            }),
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        aria-label="Изображения"
                        title="Изображения"
                        onClick={() => onOpenImages(record)}
                    >
                        <PictureOutlined />
                    </Button>
                    <Button type="link" onClick={() => onEdit(record)}>
                        <EditOutlined />
                    </Button>
                    <Popconfirm
                        title="Удалить поколение?"
                        description={`#${record.number}`}
                        okText="Удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => onDelete(record)}
                    >
                        <Button type="link" danger>
                            <DeleteOutlined />
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <ConfigProvider locale={ruRU}>
            <Table<Generation>
                rowKey="id"
                columns={columns}
                dataSource={data}
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

export default GenerationsTable;
