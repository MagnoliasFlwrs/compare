import React, { useEffect, useMemo, useState } from 'react';
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
import TrimFormModal, { type TrimFormValues } from '../components/trims/TrimFormModal';

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
    const createTrim = useTrimsStore((s) => s.createTrim);
    const updateTrimById = useTrimsStore((s) => s.updateTrimById);
    const deleteTrimById = useTrimsStore((s) => s.deleteTrimById);
    const filterByGeneration = useTrimsStore((s) => s.filterByGeneration);
    const resetFilter = useTrimsStore((s) => s.resetFilter);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editTrim, setEditTrim] = useState<Trim | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);

    useEffect(() => {
        if (!generationId) return;
        filterByGeneration(generationId);
        getTrims({ page: 1, filter: { generationId } }).catch(() => {
            message.error('Не удалось загрузить комплектации');
        });
        return () => {
            // Сбрасываем фильтр стора при уходе со страницы — иначе следующая
            // страница комплектаций откроется с прошлым generationId в запросе.
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

    const onAddSubmit = async (values: TrimFormValues) => {
        if (!generationId) return;
        setAddSubmitting(true);
        try {
            await createTrim({
                generationId,
                name: values.name,
                order: values.order,
                isHidden: values.isHidden,
            });
            message.success('Комплектация создана');
            setAddOpen(false);
        } catch {
            message.error('Не удалось создать комплектацию');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: TrimFormValues) => {
        if (!editTrim) return;
        setEditSubmitting(true);
        try {
            await updateTrimById(editTrim.id, {
                name: values.name,
                order: values.order,
                isHidden: values.isHidden,
            });
            message.success('Комплектация обновлена');
            setEditTrim(null);
        } catch {
            message.error('Не удалось обновить комплектацию');
        } finally {
            setEditSubmitting(false);
        }
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
        getTrims({ page, limit, filter: { generationId } }).catch(() => {
            message.error('Не удалось загрузить комплектации');
        });
    };

    const editInitialValues = useMemo<TrimFormValues | undefined>(
        () =>
            editTrim
                ? {
                      name: editTrim.name,
                      order: editTrim.order,
                      isHidden: editTrim.isHidden,
                  }
                : undefined,
        [editTrim],
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

                <TrimsTable
                    data={trims}
                    loading={loading}
                    meta={meta}
                    query={trimsObj}
                    onPageChange={onPageChange}
                    onEdit={setEditTrim}
                    onDelete={onDelete}
                />

                <TrimFormModal
                    key="trim-add"
                    title="Новая комплектация"
                    open={addOpen}
                    submitting={addSubmitting}
                    submitText="Создать"
                    seedKey="add"
                    defaultOrder={trims.length}
                    onCancel={() => setAddOpen(false)}
                    onSubmit={onAddSubmit}
                />

                <TrimFormModal
                    key={editTrim?.id ?? 'trim-edit'}
                    title={editTrim ? `Редактирование: ${editTrim.name}` : 'Редактирование'}
                    open={!!editTrim}
                    submitting={editSubmitting}
                    submitText="Сохранить"
                    seedKey={editTrim?.id}
                    initialValues={editInitialValues}
                    onCancel={() => setEditTrim(null)}
                    onSubmit={onEditSubmit}
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
