import React, { useMemo } from 'react';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import type { Attribute } from '../../types/attributes';
import type { EntityAttributeValue } from '../../types/entityAttributeValue';
import AvailableAttributesTable from './AvailableAttributesTable';
import AssignedAttributesTable from './AssignedAttributesTable';
import type { AssignedAttributeRow } from './entityAttributesTypes';

interface Props {
    attributes: Attribute[];
    assignedByAttributeId: Record<string, EntityAttributeValue>;
    pendingAttributeIds: string[];
    assignedTableData: AssignedAttributeRow[];
    selectedAvailableIds: string[];
    searchName: string;
    onSearchNameChange: (value: string) => void;
    onSelectedAvailableChange: (ids: string[]) => void;
    onAddSelected: () => void;
    onSetValue: (attribute: Attribute, existing: EntityAttributeValue | null) => void;
    onRemovePending: (attributeId: string) => void;
    onDeleteValue: (attributeId: string, value: EntityAttributeValue) => void;
}

const EntityAttributesTablesPanel: React.FC<Props> = ({
    attributes,
    assignedByAttributeId,
    pendingAttributeIds,
    assignedTableData,
    selectedAvailableIds,
    searchName,
    onSearchNameChange,
    onSelectedAvailableChange,
    onAddSelected,
    onSetValue,
    onRemovePending,
    onDeleteValue,
}) => {
    const hiddenAttributeIds = useMemo(() => {
        const ids = new Set(Object.keys(assignedByAttributeId));
        for (const id of pendingAttributeIds) ids.add(id);
        return ids;
    }, [assignedByAttributeId, pendingAttributeIds]);

    return (
        <>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 12, fontSize: 13 }}>
                Слева: чекбоксы и «Добавить» — перенос в заданные без значения; + в строке — сразу
                форма значения. Справа: + — задать или изменить значение.
            </Typography.Paragraph>
            <Flex align="flex-start" gap={16}>
                <AvailableAttributesTable
                    attributes={attributes}
                    hiddenAttributeIds={hiddenAttributeIds}
                    selectedAvailableIds={selectedAvailableIds}
                    searchName={searchName}
                    onSearchNameChange={onSearchNameChange}
                    onSelectionChange={onSelectedAvailableChange}
                    onAddSelected={onAddSelected}
                    onSetValue={(attr) => onSetValue(attr, null)}
                />

                <Flex
                    align="center"
                    justify="center"
                    style={{
                        flex: '0 0 48px',
                        alignSelf: 'center',
                        color: 'var(--app-contrast-blue, #33415e)',
                        paddingTop: 72,
                    }}
                >
                    <Flex vertical align="center" gap={8}>
                        <ArrowRightOutlined style={{ fontSize: 28 }} />
                    
                    </Flex>
                </Flex>

                <AssignedAttributesTable
                    dataSource={assignedTableData}
                    onSetValue={onSetValue}
                    onRemovePending={onRemovePending}
                    onDeleteValue={onDeleteValue}
                />
            </Flex>
        </>
    );
};

export default EntityAttributesTablesPanel;
