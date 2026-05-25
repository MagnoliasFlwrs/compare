import React, { useMemo } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TableRowSelection } from 'antd/es/table/interface';
import type { Attribute } from '../../types/attributes';
import type { AvailableAttributeRow } from './entityAttributesTypes';
import EntityAttributesTableWrap, {
    ENTITY_ATTRIBUTES_TABLE_SCROLL_Y,
} from './EntityAttributesTableWrap';
import { ENTITY_ATTRIBUTES_TOOLBAR_HEIGHT } from './entityAttributesTableLayout';

interface Props {
    attributes: Attribute[];
    hiddenAttributeIds: Set<string>;
    selectedAvailableIds: string[];
    searchName: string;
    onSearchNameChange: (value: string) => void;
    onSelectionChange: (attributeIds: string[]) => void;
    onAddSelected: () => void;
    /** + в строке — форма значения (сохранение сразу в заданные). */
    onSetValue: (attribute: Attribute) => void;
}

const AvailableAttributesTable: React.FC<Props> = ({
    attributes,
    hiddenAttributeIds,
    selectedAvailableIds,
    searchName,
    onSearchNameChange,
    onSelectionChange,
    onAddSelected,
    onSetValue,
}) => {
    const availableAttributes = useMemo(
        () =>
            [...attributes]
                .filter((a) => !hiddenAttributeIds.has(a.id))
                .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
        [attributes, hiddenAttributeIds],
    );

    const filteredAvailable = useMemo(() => {
        const q = searchName.trim().toLowerCase();
        if (!q) return availableAttributes;
        return availableAttributes.filter((a) => a.name.toLowerCase().includes(q));
    }, [availableAttributes, searchName]);

    const rows: AvailableAttributeRow[] = useMemo(
        () =>
            filteredAvailable.map((attribute) => ({
                key: attribute.id,
                attribute,
            })),
        [filteredAvailable],
    );

    const rowSelection: TableRowSelection<AvailableAttributeRow> = {
        selectedRowKeys: selectedAvailableIds,
        onChange: (keys) => onSelectionChange(keys as string[]),
    };

    const columns: ColumnsType<AvailableAttributeRow> = [
        {
            title: 'Характеристика',
            dataIndex: ['attribute', 'name'],
            key: 'name',
            ellipsis: true,
        },
        {
            title: 'Ед. изм.',
            key: 'unit',
            width: 88,
            render: (_, r) => r.attribute.unit?.trim() || '—',
        },
        {
            title: '',
            key: 'actions',
            width: 48,
            align: 'center',
            render: (_, r) => (
                <Tooltip title="Задать значение">
                    <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSetValue(r.attribute);
                        }}
                    />
                </Tooltip>
            ),
        },
    ];

    const selectedCount = selectedAvailableIds.length;
    const nothingLeft =
        attributes.length > 0 && hiddenAttributeIds.size === attributes.length;

    return (
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                Доступные характеристики
            </Typography.Title>
            <Flex
                gap={8}
                align="center"
                style={{
                    height: ENTITY_ATTRIBUTES_TOOLBAR_HEIGHT,
                    marginBottom: 8,
                    flexShrink: 0,
                }}
            >
                <Input.Search
                    allowClear
                    placeholder="Поиск по названию"
                    value={searchName}
                    onChange={(e) => onSearchNameChange(e.target.value)}
                    style={{ flex: 1 }}
                />
                <Button
                    type="primary"
                    disabled={selectedCount === 0}
                    onClick={onAddSelected}
                >
                    Добавить ({selectedCount})
                </Button>
            </Flex>
            <EntityAttributesTableWrap>
                <Table<AvailableAttributeRow>
                    rowKey="key"
                    columns={columns}
                    dataSource={rows}
                    rowSelection={rowSelection}
                    pagination={false}
                    size="small"
                    scroll={{ y: ENTITY_ATTRIBUTES_TABLE_SCROLL_Y }}
                    locale={{
                        emptyText: nothingLeft
                            ? 'Все характеристики уже в списке заданных'
                            : 'Ничего не найдено',
                    }}
                />
            </EntityAttributesTableWrap>
        </div>
    );
};

export default AvailableAttributesTable;
