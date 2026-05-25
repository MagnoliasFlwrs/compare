import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Breadcrumb, Button, Flex, Typography } from 'antd';
import { Link, useParams } from 'react-router-dom';
import { usePowertrainStore, type Powertrain } from '../stores/powertrainStore';
import { useAuth } from '../store';
import { useBrandsStore } from '../stores/brandsStore';
import { useModelStore } from '../stores/modelsStore';
import { useGenerationStore } from '../stores/generationStore';
import { useDriveTypesStore } from '../stores/driveTypesStore';
import { useEngineTypesStore } from '../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../stores/transmissionTypesStore';
import PowertrainsTable from '../components/powertrain/PowertrainsTable';
import PowertrainsGrid from '../components/powertrain/PowertrainsGrid';
import PowertrainFormModal from '../components/powertrain/PowertrainFormModal';
import EntityAttributesModal from '../components/entityAttributes/EntityAttributesModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

const PowertrainLayout = () => {
    const { id: brandId, modelId, generationId } = useParams<{
        id: string;
        modelId: string;
        generationId: string;
    }>();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const powertrains = usePowertrainStore((s) => s.powertrains);
    const meta = usePowertrainStore((s) => s.meta);
    const powertrainsObj = usePowertrainStore((s) => s.powertrainsObj);
    const loading = usePowertrainStore((s) => s.loading);
    const getPowertrains = usePowertrainStore((s) => s.getPowertrains);
    const deletePowertrainById = usePowertrainStore((s) => s.deletePowertrainById);
    const filterByGeneration = usePowertrainStore((s) => s.filterByGeneration);
    const resetFilter = usePowertrainStore((s) => s.resetFilter);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);

    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);
    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);
    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);

    const [formOpen, setFormOpen] = useState(false);
    const [formEditing, setFormEditing] = useState<Powertrain | null>(null);
    const [attrsPt, setAttrsPt] = useState<Powertrain | null>(null);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getPowertrains({ page: 1, generationId }).catch(() => {
            message.error('Не удалось загрузить силовые агрегаты');
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

    useEffect(() => {
        if (driveTypes.length === 0) {
            getDriveTypes({ page: 1, limit: 500 }).catch(() => {});
        }
        if (engineTypes.length === 0) {
            getEngineTypes({ page: 1, limit: 500 }).catch(() => {});
        }
        if (transmissionTypes.length === 0) {
            getTransmissionTypes({ page: 1, limit: 500 }).catch(() => {});
        }
    }, []);

    const openCreateForm = () => {
        setFormEditing(null);
        setFormOpen(true);
    };

    const openEditForm = (pt: Powertrain) => {
        setFormEditing(pt);
        setFormOpen(true);
    };

    const closeForm = () => {
        setFormOpen(false);
        setFormEditing(null);
    };

    const onDelete = async (record: Powertrain) => {
        try {
            await deletePowertrainById(record.id);
            message.success('Силовой агрегат удалён');
        } catch {
            message.error('Не удалось удалить силовой агрегат');
        }
    };

    const onPageChange = (page: number, limit: number) => {
        if (!generationId) return;
        getPowertrains({ page, limit, generationId }).catch(() => {
            message.error('Не удалось загрузить силовые агрегаты');
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
                { title: 'Силовые агрегаты' },
            ]}
        />
    ) : null;

    const header = (
        <Flex vertical gap={8}>
            {breadcrumb}
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    Силовые агрегаты
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

                <PowertrainsTable
                    data={powertrains}
                    loading={loading}
                    meta={meta}
                    query={powertrainsObj}
                    onPageChange={onPageChange}
                    onEdit={openEditForm}
                    onManageAttributes={setAttrsPt}
                    onDelete={onDelete}
                />

                <PowertrainFormModal
                    open={formOpen}
                    editing={formEditing}
                    generationId={generationId ?? null}
                    defaultOrder={powertrains.length}
                    onClose={closeForm}
                />

                <EntityAttributesModal
                    open={!!attrsPt}
                    resource="powertrains"
                    entityId={attrsPt?.id ?? null}
                    entityLabel={attrsPt?.name ?? ''}
                    onClose={() => setAttrsPt(null)}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            {header}
            <PowertrainsGrid powertrains={powertrains} loading={loading} />
        </Flex>
    );
};

export default PowertrainLayout;
