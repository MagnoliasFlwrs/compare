import React from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, RollbackOutlined } from '@ant-design/icons';
import { Button, Flex, Popconfirm, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import { formatAttributeValueDisplay } from './formatAttributeValueDisplay';
import type { AssignedAttributeRow } from './entityAttributesTypes';
import EntityAttributesTableWrap, {
    ENTITY_ATTRIBUTES_TABLE_SCROLL_Y,
} from './EntityAttributesTableWrap';
import { ENTITY_ATTRIBUTES_TOOLBAR_HEIGHT } from './entityAttributesTableLayout';

interface Props {
    dataSource: AssignedAttributeRow[];
    onSetValue: (attribute: Attribute, existing: EntityAttributeValue | null) => void;
    onRemovePending: (attributeId: string) => void;
    onDeleteValue: (attributeId: string, value: EntityAttributeValue) => void;
}

const AssignedAttributesTable: React.FC<Props> = ({
    dataSource,
    onSetValue,
    onRemovePending,
    onDeleteValue,
}) => {
    const columns: ColumnsType<AssignedAttributeRow> = [
        {
            title: 'Характеристика',
            key: 'name',
            ellipsis: true,
            render: (_, r) => r.attribute.name,
        },
        {
            title: 'Значение',
            key: 'value',
            ellipsis: true,
            render: (_, r) =>
                r.kind === 'pending' ? (
                    <Typography.Text type="secondary">—</Typography.Text>
                ) : (
                    formatAttributeValueDisplay(r.attribute, r.value)
                ),
        },
        {
            title: '',
            key: 'actions',
            width: 88,
            align: 'center',
            render: (_, r) =>
                r.kind === 'pending' ? (
                    <Flex gap={4} justify="center">
                        <Tooltip title="Задать значение">
                            <Button
                                type="link"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetValue(r.attribute, null);
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="Вернуть в доступные">
                            <Button
                                type="link"
                                size="small"
                                icon={<RollbackOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemovePending(r.attribute.id);
                                }}
                            />
                        </Tooltip>
                    </Flex>
                ) : (
                    <Flex gap={4} justify="center">
                        <Tooltip title="Изменить значение">
                            <Button
                                type="link"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSetValue(r.attribute, r.value);
                                }}
                            />
                        </Tooltip>
                        <Popconfirm
                            title="Удалить значение?"
                            okText="Удалить"
                            cancelText="Отмена"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => onDeleteValue(r.attribute.id, r.value)}
                        >
                            <Tooltip title="Удалить">
                                <Button
                                    type="link"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Tooltip>
                        </Popconfirm>
                    </Flex>
                ),
        },
    ];

    return (
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
                Заданные характеристики
            </Typography.Title>
            <div
                style={{
                    height: ENTITY_ATTRIBUTES_TOOLBAR_HEIGHT,
                    marginBottom: 8,
                    flexShrink: 0,
                }}
            />
            <EntityAttributesTableWrap>
                <Table<AssignedAttributeRow>
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    rowClassName={(record) =>
                        record.kind === 'pending' ? 'entity-attributes-row--pending' : ''
                    }
                    pagination={false}
                    size="small"
                    scroll={{ y: ENTITY_ATTRIBUTES_TABLE_SCROLL_Y }}
                    locale={{
                        emptyText:
                            'Отметьте слева и «Добавить» или задайте значение кнопкой +',
                    }}
                />
            </EntityAttributesTableWrap>
        </div>
    );
};

export default AssignedAttributesTable;
