import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Segmented, Typography } from 'antd';
import type { Attribute, AttributeCategory } from '../types/attributes';
import { useAttributesStore } from '../stores/attributesStore';
import AttributesTable from '../components/attributes/AttributesTable';
import AttributeFormModal from '../components/attributes/AttributeFormModal';
import { CATEGORY_LABELS } from '../components/attributes/attributeLabels';

type CategoryFilter = 'ALL' | AttributeCategory;

const ManageAttributesLayout: React.FC = () => {
    const { message } = App.useApp();

    const attributes = useAttributesStore((s) => s.attributes);
    const meta = useAttributesStore((s) => s.meta);
    const attributesObj = useAttributesStore((s) => s.attributesObj);
    const loading = useAttributesStore((s) => s.loading);
    const getAttributes = useAttributesStore((s) => s.getAttributes);
    const deleteAttributeById = useAttributesStore((s) => s.deleteAttributeById);

    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [formOpen, setFormOpen] = useState(false);
    const [formEditing, setFormEditing] = useState<Attribute | null>(null);
    const load = (page = attributesObj.page, limit = attributesObj.limit) => {
        const category = categoryFilter === 'ALL' ? undefined : categoryFilter;
        getAttributes({ page, limit, category }).catch(() => {
            message.error('Не удалось загрузить дополнительные характеристики');
        });
    };

    useEffect(() => {
        load(1);
    }, [categoryFilter]);

    const openCreateForm = () => {
        setFormEditing(null);
        setFormOpen(true);
    };

    const openEditForm = (attribute: Attribute) => {
        setFormEditing(attribute);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setFormEditing(null);
    };

    const onDelete = async (record: Attribute) => {
        try {
            await deleteAttributeById(record.id);
            message.success('Характеристика удалена');
        } catch {
            message.error('Не удалось удалить характеристику');
        }
    };

    const defaultCategoryForAdd: AttributeCategory | undefined =
        categoryFilter === 'ALL' ? undefined : categoryFilter;

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Дополнительные характеристики
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
                    Добавить характеристику
                </Button>
            </Flex>

            <Segmented<CategoryFilter>
                value={categoryFilter}
                onChange={(v) => setCategoryFilter(v)}
                options={[
                    { label: 'Все', value: 'ALL' },
                    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
                        label,
                        value: value as AttributeCategory,
                    })),
                ]}
            />

            <AttributesTable
                data={attributes}
                loading={loading}
                meta={meta}
                page={attributesObj.page}
                limit={attributesObj.limit}
                onPageChange={(page, limit) => load(page, limit)}
                onEdit={openEditForm}
                onDelete={onDelete}
            />

            <AttributeFormModal
                open={formOpen}
                editing={formEditing}
                defaultCategory={defaultCategoryForAdd}
                onClose={closeForm}
                onSaved={() => load()}
            />
        </Flex>
    );
};

export default ManageAttributesLayout;
