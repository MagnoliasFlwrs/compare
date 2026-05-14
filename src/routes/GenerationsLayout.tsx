import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Flex, Space } from 'antd';
import { useParams } from 'react-router-dom';
import { useGenerationStore } from '../stores/generationStore';
import { useBrandsStore } from '../stores/brandsStore';
import { useModelStore } from '../stores/modelsStore';
import { uploadFile, useAuth } from '../store';
import type {
    CloneGenerationFormValues,
    Generation,
    GenerationFormValues,
    GenerationImage,
    GenerationImageFormValues,
} from '../types/generation';
import GenerationsBreadcrumb from '../components/generations/GenerationsBreadcrumb';
import GenerationsTable from '../components/generations/GenerationsTable';
import GenerationsGrid from '../components/generations/GenerationsGrid';
import GenerationFormModal from '../components/generations/GenerationFormModal';
import GenerationCloneModal from '../components/generations/GenerationCloneModal';
import GenerationImagesModal from '../components/generations/GenerationImagesModal';
import GenerationImageEditModal from '../components/generations/GenerationImageEditModal';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

const GenerationsLayout = () => {
    const { id: brandId, modelId } = useParams<{ id: string; modelId: string }>();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const generations = useGenerationStore((s) => s.generationsByModel);
    const meta = useGenerationStore((s) => s.meta);
    const generationsByModelObj = useGenerationStore((s) => s.generationsByModelObj);
    const loading = useGenerationStore((s) => s.loading);
    const getGenerationsByModel = useGenerationStore((s) => s.getGenerationsByModel);
    const createGeneration = useGenerationStore((s) => s.createGeneration);
    const updateGeneration = useGenerationStore((s) => s.updateGeneration);
    const deleteGeneration = useGenerationStore((s) => s.deleteGeneration);
    const cloneGeneration = useGenerationStore((s) => s.cloneGeneration);

    const images = useGenerationStore((s) => s.images);
    const imagesLoading = useGenerationStore((s) => s.imagesLoading);
    const getGenerationImages = useGenerationStore((s) => s.getGenerationImages);
    const createGenerationImage = useGenerationStore((s) => s.createGenerationImage);
    const updateGenerationImage = useGenerationStore((s) => s.updateGenerationImage);
    const deleteGenerationImage = useGenerationStore((s) => s.deleteGenerationImage);
    const clearImages = useGenerationStore((s) => s.clearImages);

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);

    const [addOpen, setAddOpen] = useState(false);
    const [addSubmitting, setAddSubmitting] = useState(false);
    const [editGen, setEditGen] = useState<Generation | null>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [cloneOpen, setCloneOpen] = useState(false);
    const [cloneSubmitting, setCloneSubmitting] = useState(false);

    const [imagesGen, setImagesGen] = useState<Generation | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [editImage, setEditImage] = useState<GenerationImage | null>(null);
    const [editImageSubmitting, setEditImageSubmitting] = useState(false);

    useEffect(() => {
        if (!modelId) return;
        getGenerationsByModel(modelId).catch(() => {
            message.error('Не удалось загрузить поколения');
        });
    }, [modelId]);

    useEffect(() => {
        if (!brandId) return;
        getBrandById(brandId).catch(() => {});
    }, [brandId]);

    useEffect(() => {
        if (!modelId) return;
        getModelById(modelId).catch(() => {});
    }, [modelId]);

    const onAddSubmit = async (values: GenerationFormValues) => {
        if (!modelId) return;
        setAddSubmitting(true);
        try {
            await createGeneration({
                modelId,
                number: values.number,
                restyling: (values.restyling ?? '').trim(),
                yearFrom: values.yearFrom,
                yearTo: values.yearTo,
            });
            message.success('Поколение создано');
            setAddOpen(false);
        } catch {
            message.error('Не удалось создать поколение');
        } finally {
            setAddSubmitting(false);
        }
    };

    const onEditSubmit = async (values: GenerationFormValues) => {
        if (!editGen) return;
        setEditSubmitting(true);
        try {
            await updateGeneration(editGen.id, {
                number: values.number,
                restyling: (values.restyling ?? '').trim(),
                yearFrom: values.yearFrom,
                yearTo: values.yearTo,
            });
            message.success('Поколение обновлено');
            setEditGen(null);
        } catch {
            message.error('Не удалось обновить поколение');
        } finally {
            setEditSubmitting(false);
        }
    };

    const onCloneSubmit = async (values: CloneGenerationFormValues) => {
        setCloneSubmitting(true);
        try {
            await cloneGeneration({
                fromGenerationId: values.fromGenerationId.trim(),
                toGenerationId: values.toGenerationId.trim(),
                mode: values.mode.trim(),
                entityId: values.entityId.trim(),
            });
            message.success('Клонирование выполнено');
            setCloneOpen(false);
        } catch {
            message.error('Не удалось клонировать поколение');
        } finally {
            setCloneSubmitting(false);
        }
    };

    const openImages = (record: Generation) => {
        // Сбрасываем картинки предыдущей генерации, чтобы модалка не показывала чужой набор,
        // пока летит запрос за новым.
        clearImages();
        setImagesGen(record);
        getGenerationImages(record.id).catch(() => {
            message.error('Не удалось загрузить изображения');
        });
    };

    const closeImages = () => {
        setImagesGen(null);
        setEditImage(null);
        clearImages();
    };

    const onUploadImage = async (file: File) => {
        if (!imagesGen) return;
        setUploadingImage(true);
        try {
            let imageId: string;
            try {
                const uploaded = await uploadFile(file);
                imageId = uploaded.id;
            } catch {
                message.error('Не удалось загрузить файл');
                return;
            }
            await createGenerationImage({
                generationId: imagesGen.id,
                imageId,
                order: images.length,
            });
            message.success('Изображение добавлено');
        } catch {
            message.error('Не удалось создать изображение');
        } finally {
            setUploadingImage(false);
        }
    };

    const onEditImageSubmit = async (values: GenerationImageFormValues) => {
        if (!editImage) return;
        setEditImageSubmitting(true);
        try {
            await updateGenerationImage(editImage.id, { order: values.order });
            message.success('Изображение обновлено');
            setEditImage(null);
        } catch {
            message.error('Не удалось обновить изображение');
        } finally {
            setEditImageSubmitting(false);
        }
    };

    const onDeleteImage = async (img: GenerationImage) => {
        try {
            await deleteGenerationImage(img.id);
            message.success('Изображение удалено');
        } catch {
            message.error('Не удалось удалить изображение');
        }
    };

    const onDeleteGeneration = async (record: Generation) => {
        try {
            await deleteGeneration(record.id);
            message.success('Поколение удалено');
        } catch {
            message.error('Не удалось удалить поколение');
        }
    };
    
    const header = (
        <GenerationsBreadcrumb
            brandId={brandId}
            brandName={currentBrand?.name}
            modelName={currentModel?.name}
        />
    );

    if (isAdmin) {
        return (
            <Flex vertical gap={16}>
                <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                    {header}
                    <Space wrap>
                        <Button onClick={() => setCloneOpen(true)}>Клонировать</Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setAddOpen(true)}
                        >
                            Добавить поколение
                        </Button>
                    </Space>
                </Flex>

                <GenerationsTable
                    data={generations}
                    loading={loading}
                    meta={meta}
                    query={generationsByModelObj}
                    onPageChange={(p, ps) => {
                        if (!modelId) return;
                        getGenerationsByModel(modelId, { page: p, limit: ps }).catch(() => {
                            message.error('Не удалось загрузить поколения');
                        });
                    }}
                    onEdit={setEditGen}
                    onDelete={onDeleteGeneration}
                    onOpenImages={openImages}
                />

                <GenerationFormModal
                    title="Новое поколение"
                    open={addOpen}
                    submitting={addSubmitting}
                    submitText="Создать"
                    onCancel={() => setAddOpen(false)}
                    onSubmit={onAddSubmit}
                />

                <GenerationFormModal
                    title={editGen ? `Редактирование: #${editGen.number}` : 'Редактирование'}
                    open={!!editGen}
                    initialValues={
                        editGen
                            ? {
                                  number: editGen.number,
                                  restyling: editGen.restyling,
                                  yearFrom: editGen.yearFrom,
                                  yearTo: editGen.yearTo,
                              }
                            : undefined
                    }
                    submitting={editSubmitting}
                    submitText="Сохранить"
                    onCancel={() => setEditGen(null)}
                    onSubmit={onEditSubmit}
                />

                <GenerationImagesModal
                    generation={imagesGen}
                    images={images}
                    loading={imagesLoading}
                    uploading={uploadingImage}
                    onClose={closeImages}
                    onUpload={onUploadImage}
                    onEditImage={setEditImage}
                    onDeleteImage={onDeleteImage}
                />

                <GenerationImageEditModal
                    image={editImage}
                    submitting={editImageSubmitting}
                    onCancel={() => setEditImage(null)}
                    onSubmit={onEditImageSubmit}
                />

                <GenerationCloneModal
                    open={cloneOpen}
                    submitting={cloneSubmitting}
                    onCancel={() => setCloneOpen(false)}
                    onSubmit={onCloneSubmit}
                />
            </Flex>
        );
    }

    return (
        <Flex vertical gap={16}>
            {header}
            <GenerationsGrid generations={generations} loading={loading} />
        </Flex>
    );
};

export default GenerationsLayout;
