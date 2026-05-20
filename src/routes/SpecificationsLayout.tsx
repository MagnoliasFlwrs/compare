import React, { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Flex, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import {
    useSpecificationStore,
    type Specification,
} from '../stores/specificationStore';
import { useAuth } from '../store';
import { useBrandsStore } from '../stores/brandsStore';
import { useModelStore } from '../stores/modelsStore';
import { useGenerationStore } from '../stores/generationStore';
import SpecificationsTable from '../components/specifications/SpecificationsTable';
import SpecificationsGrid from '../components/specifications/SpecificationsGrid';
import SpecificationFormModal, {
    type SpecificationFormValues,
} from '../components/specifications/SpecificationFormModal';
import EntityAttributesModal from '../components/entityAttributes/EntityAttributesModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

/**
 * Бэк отдаёт countryId/bodyTypeId в GET как объект ({}), а в POST/PUT ожидает строку.
 * При предзаполнении формы редактирования аккуратно извлекаем строковый id,
 * иначе подсовываем пусто и пользователь сам введёт UUID.
 */
function pickIdString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        for (const key of ['id', 'value', 'uuid']) {
            const candidate = v[key];
            if (typeof candidate === 'string') return candidate;
        }
    }
    return '';
}

const SpecificationsLayout = () => {
    const { id: brandId, modelId, generationId } = useParams<{
        id: string;
        modelId: string;
        generationId: string;
    }>();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const specifications = useSpecificationStore((s) => s.specifications);
    const meta = useSpecificationStore((s) => s.meta);
    const specificationsObj = useSpecificationStore((s) => s.specificationsObj);
    const loading = useSpecificationStore((s) => s.loading);
    const getSpecifications = useSpecificationStore((s) => s.getSpecifications);
    const createSpecification = useSpecificationStore((s) => s.createSpecification);
    const updateSpecificationById = useSpecificationStore(
        (s) => s.updateSpecificationById,
    );
    const deleteSpecificationById = useSpecificationStore(
        (s) => s.deleteSpecificationById,
    );
    const filterByGeneration = useSpecificationStore((s) => s.filterByGeneration);
    const resetFilter = useSpecificationStore((s) => s.resetFilter);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editSpec, setEditSpec] = useState<Specification | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [attrsSpec, setAttrsSpec] = useState<Specification | null>(null);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getSpecifications({ page: 1, filter: { generationId } }).catch(() => {
            message.error('Не удалось загрузить характеристики');
        });
        return () => {
            // Чистим фильтр стора, чтобы следующая страница (другая генерация)
            // не унаследовала старый filter.generationId в первом запросе.
            resetFilter();
        };
    }, [generationId]);

    useEffect(() => {
        if (brandId) getBrandById(brandId).catch(() => {});
    }, [brandId, getBrandById]);

    useEffect(() => {
        if (modelId) getModelById(modelId).catch(() => {});
    }, [modelId, getModelById]);

    useEffect(() => {
        if (generationId) getGenerationById(generationId).catch(() => {});
    }, [generationId, getGenerationById]);

    const onAddSubmit = async (values: SpecificationFormValues) => {
        if (!generationId) return;
        setAddSubmitting(true);
        try {
            await createSpecification({
                generationId,
                ...values,
            });
            message.success('Характеристика создана');
            setAddOpen(false);
        } catch {
            message.error('Не удалось создать характеристику');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: SpecificationFormValues) => {
        if (!editSpec) return;
        setEditSubmitting(true);
        try {
            await updateSpecificationById(editSpec.id, values);
            message.success('Характеристика обновлена');
            setEditSpec(null);
        } catch {
            message.error('Не удалось обновить характеристику');
        } finally {
            setEditSubmitting(false);
        }
    };

    const onDelete = async (record: Specification) => {
        try {
            await deleteSpecificationById(record.id);
            message.success('Характеристика удалена');
        } catch {
            message.error('Не удалось удалить характеристику');
        }
    };

    const onPageChange = (page: number, limit: number) => {
        if (!generationId) return;
        getSpecifications({ page, limit, filter: { generationId } }).catch(() => {
            message.error('Не удалось загрузить характеристики');
        });
    };

    const editInitialValues = useMemo<SpecificationFormValues | undefined>(
        () =>
            editSpec
                ? {
                      name: editSpec.name,
                      isHidden: editSpec.isHidden,
                      length: editSpec.length,
                      width: editSpec.width,
                      height: editSpec.height,
                      wheelbase: editSpec.wheelbase,
                      clearance: editSpec.clearance,
                      tank: editSpec.tank,
                      trunkStandardVolume: editSpec.trunkStandardVolume,
                      trunkMaximumVolume: editSpec.trunkMaximumVolume,
                      countryId: pickIdString(editSpec.countryId),
                      bodyTypeId: pickIdString(editSpec.bodyTypeId),
                      warranty: editSpec.warranty ?? '',
                  }
                : undefined,
        [editSpec],
    );

    const enc = encodeURIComponent;
    const breadcrumb = brandId && modelId && generationId ? (
        <Breadcrumb
            items={[
                { title: <Link to="/brands">Бренды</Link> },
                {
                    title: (
                        <Link to={`/brands/${enc(brandId)}`}>
                            {currentBrand?.name ?? 'Бренд'}
                        </Link>
                    ),
                },
                {
                    title: (
                        <Link to={`/brands/${enc(brandId)}/${enc(modelId)}`}>
                            {currentModel?.name ?? 'Модель'}
                        </Link>
                    ),
                },
                {
                    title: currentGeneration
                        ? `Поколение #${currentGeneration.number}`
                        : 'Поколение',
                },
                { title: 'Базовые характеристики' },
            ]}
        />
    ) : null;

    const header = (
        <Flex vertical gap={8}>
            {breadcrumb}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Базовые характеристики
                </Typography.Title>
                {isAdmin ? (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAddOpen(true)}
                    >
                        Добавить
                    </Button>
                ) : null}
            </Flex>
        </Flex>
    );

    if (isAdmin) {
        return (
            <Flex vertical gap={16}>
                {header}

                <SpecificationsTable
                    data={specifications}
                    loading={loading}
                    meta={meta}
                    query={specificationsObj}
                    onPageChange={onPageChange}
                    onEdit={setEditSpec}
                    onManageAttributes={setAttrsSpec}
                    onDelete={onDelete}
                />

                <SpecificationFormModal
                    key="spec-add"
                    title="Новая характеристика"
                    open={addOpen}
                    submitting={addSubmitting}
                    submitText="Создать"
                    seedKey="add"
                    onCancel={() => setAddOpen(false)}
                    onSubmit={onAddSubmit}
                />

                <SpecificationFormModal
                    key={editSpec?.id ?? 'spec-edit'}
                    title={editSpec ? `Редактирование: ${editSpec.name}` : 'Редактирование'}
                    open={!!editSpec}
                    submitting={editSubmitting}
                    submitText="Сохранить"
                    seedKey={editSpec?.id}
                    initialValues={editInitialValues}
                    onCancel={() => setEditSpec(null)}
                    onSubmit={onEditSubmit}
                />

                <EntityAttributesModal
                    open={!!attrsSpec}
                    resource="specifications"
                    entityId={attrsSpec?.id ?? null}
                    entityLabel={attrsSpec?.name ?? ''}
                    onClose={() => setAttrsSpec(null)}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            {header}
            <SpecificationsGrid specifications={specifications} loading={loading} />
        </Flex>
    );
};

export default SpecificationsLayout;
