import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Flex, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { useTrimsStore, type Trim } from '../stores/trimsStore';
import { useAuth } from '../store';
import { useBrandsStore } from '../stores/brandsStore';
import { useModelStore } from '../stores/modelsStore';
import { useGenerationStore } from '../stores/generationStore';
import TrimsTable from '../components/trims/TrimsTable';
import TrimsGrid from '../components/trims/TrimsGrid';
import TrimFormModal from '../components/trims/TrimFormModal';
import EntityAttributesModal from '../components/entityAttributes/EntityAttributesModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

const TrimsLayout = () => {
    const { id: brandId, modelId, generationId } = useParams<{
        id: string;
        modelId: string;
        generationId: string;
    }>();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const trims = useTrimsStore((s) => s.trims);
    const meta = useTrimsStore((s) => s.meta);
    const trimsObj = useTrimsStore((s) => s.trimsObj);
    const loading = useTrimsStore((s) => s.loading);
    const getTrims = useTrimsStore((s) => s.getTrims);
    const deleteTrimById = useTrimsStore((s) => s.deleteTrimById);
    const filterByGeneration = useTrimsStore((s) => s.filterByGeneration);
    const resetFilter = useTrimsStore((s) => s.resetFilter);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);

    const [formOpen, setFormOpen] = useState(false);
    const [formEditing, setFormEditing] = useState<Trim | null>(null);
    const [attrsTrim, setAttrsTrim] = useState<Trim | null>(null);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getTrims({ page: 1, generationId }).catch(() => {
            message.error('Не удалось загрузить комплектации');
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

    const openEditForm = (trim: Trim) => {
        setFormEditing(trim);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setFormEditing(null);
    };

    const onDelete = async (record: Trim) => {
        try {
            await deleteTrimById(record.id);
            message.success('Комплектация удалена');
        } catch {
            message.error('Не удалось удалить комплектацию');
        }
    };

    const onPageChange = (page: number, limit: number) => {
        if (!generationId) return;
        getTrims({ page, limit, generationId }).catch(() => {
            message.error('Не удалось загрузить комплектации');
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
                { title: 'Комплектации' },
            ]}
        />
    ) : null;

    const header = (
        <Flex vertical gap={8}>
            {breadcrumb}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Комплектации
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

                <TrimsTable
                    data={trims}
                    loading={loading}
                    meta={meta}
                    query={trimsObj}
                    onPageChange={onPageChange}
                    onEdit={openEditForm}
                    onManageAttributes={setAttrsTrim}
                    onDelete={onDelete}
                />

                <TrimFormModal
                    open={formOpen}
                    editing={formEditing}
                    generationId={generationId ?? null}
                    defaultOrder={trims.length}
                    onClose={closeForm}
                />

                <EntityAttributesModal
                    open={!!attrsTrim}
                    resource="trims"
                    entityId={attrsTrim?.id ?? null}
                    entityLabel={attrsTrim?.name ?? ''}
                    onClose={() => setAttrsTrim(null)}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            {header}
            <TrimsGrid trims={trims} loading={loading} />
        </Flex>
    );
};

export default TrimsLayout;
