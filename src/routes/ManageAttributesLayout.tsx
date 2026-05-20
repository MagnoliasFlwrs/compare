import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Segmented, Typography } from 'antd';
import type { Attribute, AttributeCategory, AttributeFormValues } from '../types/attributes';
import { useAttributesStore } from '../stores/attributesStore';
import { useAttributeOptionsStore } from '../stores/attributeOptionsStore';
import AttributesTable from '../components/attributes/AttributesTable';
import AttributeFormModal from '../components/attributes/AttributeFormModal';
import AttributeOptionsModal from '../components/attributes/AttributeOptionsModal';
import { CATEGORY_LABELS } from '../components/attributes/attributeLabels';

type CategoryFilter = 'ALL' | AttributeCategory;

const ManageAttributesLayout: React.FC = () => {
    const { message } = App.useApp();

    const attributes = useAttributesStore((s) => s.attributes);
    const meta = useAttributesStore((s) => s.meta);
    const attributesObj = useAttributesStore((s) => s.attributesObj);
    const loading = useAttributesStore((s) => s.loading);
    const getAttributes = useAttributesStore((s) => s.getAttributes);
    const createAttribute = useAttributesStore((s) => s.createAttribute);
    const updateAttributeById = useAttributesStore((s) => s.updateAttributeById);
    const deleteAttributeById = useAttributesStore((s) => s.deleteAttributeById);

    const createOption = useAttributeOptionsStore((s) => s.createOption);

    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editAttr, setEditAttr] = useState<Attribute | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [optionsAttr, setOptionsAttr] = useState<Attribute | null>(null);

    const load = (page = attributesObj.page, limit = attributesObj.limit) => {
        const category = categoryFilter === 'ALL' ? undefined : categoryFilter;
        getAttributes({ page, limit, category }).catch(() => {
            message.error('Не удалось загрузить дополнительные характеристики');
        });
    };

    useEffect(() => {
        load(1);
    }, [categoryFilter]);

    const onCreate = async (values: AttributeFormValues) => {
        setAddSubmitting(true);
        try {
            const created = await createAttribute({
                name: values.name.trim(),
                category: values.category,
                type: values.type,
                unit: (values.unit ?? '').trim(),
                advantageType: values.advantageType,
            });

            if (values.type === 'SELECT' && values.options?.length) {
                for (const opt of values.options) {
                    const value = opt.value?.trim();
                    if (!value) continue;
                    await createOption({
                        attributeId: created.id,
                        value,
                        order: opt.order ?? 0,
                    });
                }
            }

            message.success('Характеристика создана');
            setAddOpen(false);
            load();
        } catch {
            message.error('Не удалось создать характеристику');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onUpdate = async (values: AttributeFormValues) => {
        if (!editAttr) return;
        setEditSubmitting(true);
        try {
            await updateAttributeById(editAttr.id, {
                name: values.name.trim(),
                unit: (values.unit ?? '').trim(),
                advantageType: values.advantageType,
            });
            message.success('Характеристика обновлена');
            setEditAttr(null);
            load();
        } catch {
            message.error('Не удалось обновить характеристику');
        } finally {
            setEditSubmitting(false);
        }
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
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>
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
                onEdit={setEditAttr}
                onManageOptions={setOptionsAttr}
                onDelete={onDelete}
            />

            <AttributeFormModal
                title="Новая характеристика"
                open={addOpen}
                submitting={addSubmitting}
                submitText="Создать"
                defaultCategory={defaultCategoryForAdd}
                onCancel={() => setAddOpen(false)}
                onSubmit={onCreate}
            />

            <AttributeFormModal
                title={editAttr ? `Редактирование: ${editAttr.name}` : 'Редактирование'}
                open={!!editAttr}
                submitting={editSubmitting}
                submitText="Сохранить"
                editing={editAttr}
                onCancel={() => setEditAttr(null)}
                onSubmit={onUpdate}
            />

            <AttributeOptionsModal
                attribute={optionsAttr}
                onClose={() => setOptionsAttr(null)}
            />
        </Flex>
    );
};

export default ManageAttributesLayout;
