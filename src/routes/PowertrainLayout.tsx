import React, { useEffect, useMemo, useState } from 'react';
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
import PowertrainFormModal, {
    type PowertrainFormValues,
} from '../components/powertrain/PowertrainFormModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

/** id-шник может приходить строкой или вложенным объектом — аккуратно достаём строковый UUID. */
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
    const createPowertrain = usePowertrainStore((s) => s.createPowertrain);
    const updatePowertrainById = usePowertrainStore((s) => s.updatePowertrainById);
    const deletePowertrainById = usePowertrainStore((s) => s.deletePowertrainById);
    const filterByGeneration = usePowertrainStore((s) => s.filterByGeneration);
    const resetFilter = usePowertrainStore((s) => s.resetFilter);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);

    // Справочники нужны для отображения названий в таблице/карточках.
    // Лениво подгружаем один раз, если пустые.
    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);
    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);
    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editPt, setEditPt] = useState<Powertrain | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getPowertrains({ page: 1, filter: { generationId } }).catch(() => {
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

    const onAddSubmit = async (values: PowertrainFormValues) => {
        if (!generationId) return;
        setAddSubmitting(true);
        try {
            await createPowertrain({
                generationId,
                ...values,
            });
            message.success('Силовой агрегат создан');
            setAddOpen(false);
        } catch {
            message.error('Не удалось создать силовой агрегат');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: PowertrainFormValues) => {
        if (!editPt) return;
        setEditSubmitting(true);
        try {
            await updatePowertrainById(editPt.id, values);
            message.success('Силовой агрегат обновлён');
            setEditPt(null);
        } catch {
            message.error('Не удалось обновить силовой агрегат');
        } finally {
            setEditSubmitting(false);
        }
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
        getPowertrains({ page, limit, filter: { generationId } }).catch(() => {
            message.error('Не удалось загрузить силовые агрегаты');
        });
    };

    const editInitialValues = useMemo<PowertrainFormValues | undefined>(
        () =>
            editPt
                ? {
                      name: editPt.name,
                      isHidden: editPt.isHidden,
                      order: editPt.order ?? 0,
                      engine: editPt.engine ?? '',
                      engineTypeId: pickIdString(editPt.engineTypeId),
                      enginePower: editPt.enginePower ?? 0,
                      transmission: editPt.transmission ?? '',
                      transmissionTypeId: pickIdString(editPt.transmissionTypeId),
                      numOfGears: editPt.numOfGears ?? 0,
                      driveTypeId: pickIdString(editPt.driveTypeId),
                      acceleration: editPt.acceleration ?? 0,
                      consumption: editPt.consumption ?? 0,
                      numOfSeats: editPt.numOfSeats ?? 0,
                      note: editPt.note ?? '',
                  }
                : undefined,
        [editPt],
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

                <PowertrainsTable
                    data={powertrains}
                    loading={loading}
                    meta={meta}
                    query={powertrainsObj}
                    onPageChange={onPageChange}
                    onEdit={setEditPt}
                    onDelete={onDelete}
                />

                <PowertrainFormModal
                    title="Новый силовой агрегат"
                    open={addOpen}
                    submitting={addSubmitting}
                    submitText="Создать"
                    initialValues={{
                        name: '',
                        isHidden: false,
                        order: powertrains.length,
                        engine: '',
                        engineTypeId: '',
                        enginePower: 0,
                        transmission: '',
                        transmissionTypeId: '',
                        numOfGears: 0,
                        driveTypeId: '',
                        acceleration: 0,
                        consumption: 0,
                        numOfSeats: 0,
                        note: '',
                    }}
                    onCancel={() => setAddOpen(false)}
                    onSubmit={onAddSubmit}
                />

                <PowertrainFormModal
                    title={editPt ? `Редактирование: ${editPt.name}` : 'Редактирование'}
                    open={!!editPt}
                    submitting={editSubmitting}
                    submitText="Сохранить"
                    initialValues={editInitialValues}
                    onCancel={() => setEditPt(null)}
                    onSubmit={onEditSubmit}
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
