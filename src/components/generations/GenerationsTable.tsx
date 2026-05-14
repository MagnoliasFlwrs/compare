import React from 'react';
import {
    DeleteOutlined,
    EditOutlined,
    MenuOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { Button, ConfigProvider, Dropdown, Popconfirm, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import { useParams } from 'react-router-dom';
import type { Generation, GenerationsListMeta, GenerationsQuery } from '../../types/generation';
import { getGenerationMenuItems } from './generationMenu';

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
    const { id: brandId, modelId } = useParams<{ id: string; modelId: string }>();
    const canOpenMenu = Boolean(brandId && modelId);

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
            width: 240,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Изображения">
                        <Button
                            type="link"
                            aria-label="Изображения"
                            onClick={() => onOpenImages(record)}
                        >
                            <PictureOutlined />
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
                        title="Удалить поколение?"
                        description={`#${record.number}`}
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
                    {canOpenMenu ? (
                        <Dropdown
                            menu={{
                                items: getGenerationMenuItems(brandId!, modelId!, record.id),
                            }}
                            trigger={['click']}
                        >
                            <Tooltip title="Разделы поколения">
                                <Button
                                    type="link"
                                    aria-label="Разделы поколения"
                                    onClick={(e) => e.preventDefault()}
                                >
                                    <MenuOutlined />
                                </Button>
                            </Tooltip>
                        </Dropdown>
                    ) : null}
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
