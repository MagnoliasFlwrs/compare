import React, { useEffect, useState } from 'react';
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
import SpecificationFormModal from '../components/specifications/SpecificationFormModal';
import EntityAttributesModal from '../components/entityAttributes/EntityAttributesModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
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

    const [formOpen, setFormOpen] = useState(false);
    const [formEditing, setFormEditing] = useState<Specification | null>(null);
    const [attrsSpec, setAttrsSpec] = useState<Specification | null>(null);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getSpecifications({ page: 1, generationId }).catch(() => {
            message.error('Не удалось загрузить варианты кузова');
        });
        return () => {
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

    const openCreateForm = () => {
        setFormEditing(null);
        setFormOpen(true);
    };

    const openEditForm = (spec: Specification) => {
        setFormEditing(spec);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setFormEditing(null);
    };

    const onDelete = async (record: Specification) => {
        try {
            await deleteSpecificationById(record.id);
            message.success('Вариант кузова удалён');
        } catch {
            message.error('Не удалось удалить вариант кузова');
        }
    };

    const onPageChange = (page: number, limit: number) => {
        if (!generationId) return;
        getSpecifications({ page, limit, generationId }).catch(() => {
            message.error('Не удалось загрузить варианты кузова');
        });
    };

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
                        onClick={openCreateForm}
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
                    onEdit={openEditForm}
                    onManageAttributes={setAttrsSpec}
                    onDelete={onDelete}
                />

                <SpecificationFormModal
                    open={formOpen}
                    editing={formEditing}
                    generationId={generationId ?? null}
                    onClose={closeForm}
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
