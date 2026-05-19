import React, { useEffect, useMemo, useState } from 'react';
import { App, Breadcrumb, Flex, Typography } from 'antd';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../store';
import { useBrandsStore } from '../stores/brandsStore';
import { useModelStore } from '../stores/modelsStore';
import { useGenerationStore } from '../stores/generationStore';
import { useSpecificationStore } from '../stores/specificationStore';
import { usePowertrainStore } from '../stores/powertrainStore';
import { useCountriesStore } from '../stores/countriesStore';
import { useBodyTypesStore } from '../stores/bodyTypesStore';
import { useDriveTypesStore } from '../stores/driveTypesStore';
import { useEngineTypesStore } from '../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../stores/transmissionTypesStore';
import GenerationCharacteristicsView from '../components/generationOptions/GenerationCharacteristicsView';
import { resolveImageUrl } from '../components/generations/utils';

function jwtRole(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') return undefined;
    const r = (user as { role?: unknown }).role;
    return typeof r === 'string' ? r : undefined;
}

const GenerationModelOptionsLayout = () => {
    const { id: brandId, modelId, generationId } = useParams<{
        id: string;
        modelId: string;
        generationId: string;
    }>();
    const { message } = App.useApp();
    const user = useAuth((s) => s.user);
    const isAdmin = jwtRole(user) === 'ADMIN';

    const currentBrand = useBrandsStore((s) => s.currentBrand);
    const getBrandById = useBrandsStore((s) => s.getBrandById);
    const currentModel = useModelStore((s) => s.currentModel);
    const getModelById = useModelStore((s) => s.getModelById);
    const currentGeneration = useGenerationStore((s) => s.currentGeneration);
    const getGenerationById = useGenerationStore((s) => s.getGenerationById);
    const imagesByGenerationId = useGenerationStore((s) => s.imagesByGenerationId);
    const imagesByGenerationIdLoading = useGenerationStore(
        (s) => s.imagesByGenerationIdLoading,
    );
    const loadImagesForGeneration = useGenerationStore((s) => s.loadImagesForGeneration);

    const specifications = useSpecificationStore((s) => s.specifications);
    const specificationsLoading = useSpecificationStore((s) => s.loading);
    const fetchAllSpecifications = useSpecificationStore((s) => s.fetchAllForGeneration);
    const filterSpecificationsByGeneration = useSpecificationStore(
        (s) => s.filterByGeneration,
    );
    const resetSpecificationsFilter = useSpecificationStore((s) => s.resetFilter);

    const powertrains = usePowertrainStore((s) => s.powertrains);
    const powertrainsLoading = usePowertrainStore((s) => s.loading);
    const fetchAllPowertrains = usePowertrainStore((s) => s.fetchAllForGeneration);
    const filterPowertrainsByGeneration = usePowertrainStore((s) => s.filterByGeneration);
    const resetPowertrainsFilter = usePowertrainStore((s) => s.resetFilter);

    const countries = useCountriesStore((s) => s.countries);
    const getCountries = useCountriesStore((s) => s.getCountries);
    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);
    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);
    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);
    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);

    const [selectedSpecId, setSelectedSpecId] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!generationId) return;
        setPageLoading(true);
        filterSpecificationsByGeneration(generationId);
        filterPowertrainsByGeneration(generationId);

        const load = async () => {
            try {
                await Promise.all([
                    fetchAllSpecifications(generationId),
                    fetchAllPowertrains(generationId),
                    loadImagesForGeneration(generationId),
                    countries.length === 0
                        ? getCountries({ page: 1, limit: 500 })
                        : Promise.resolve(),
                    bodyTypes.length === 0
                        ? getBodyTypes({ page: 1, limit: 500 })
                        : Promise.resolve(),
                    driveTypes.length === 0
                        ? getDriveTypes({ page: 1, limit: 500 })
                        : Promise.resolve(),
                    engineTypes.length === 0
                        ? getEngineTypes({ page: 1, limit: 500 })
                        : Promise.resolve(),
                    transmissionTypes.length === 0
                        ? getTransmissionTypes({ page: 1, limit: 500 })
                        : Promise.resolve(),
                ]);
            } catch {
                message.error('Не удалось загрузить характеристики');
            } finally {
                setPageLoading(false);
            }
        };

        load();
        return () => {
            resetSpecificationsFilter();
            resetPowertrainsFilter();
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

    const visibleSpecs = useMemo(
        () => specifications.filter((s) => !s.isHidden),
        [specifications],
    );

    useEffect(() => {
        if (visibleSpecs.length === 0) {
            setSelectedSpecId(null);
            return;
        }
        if (!selectedSpecId || !visibleSpecs.some((s) => s.id === selectedSpecId)) {
            setSelectedSpecId(visibleSpecs[0].id);
        }
    }, [visibleSpecs, selectedSpecId]);

    const countryNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const c of countries) map.set(c.id, c.name);
        return map;
    }, [countries]);

    const bodyTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const b of bodyTypes) map.set(b.id, b.name);
        return map;
    }, [bodyTypes]);

    const driveTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of driveTypes) map.set(d.id, d.name);
        return map;
    }, [driveTypes]);

    const engineTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const e of engineTypes) map.set(e.id, e.name);
        return map;
    }, [engineTypes]);

    const transmissionTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const t of transmissionTypes) map.set(t.id, t.name);
        return map;
    }, [transmissionTypes]);

    const imageUrls = useMemo(() => {
        const images = imagesByGenerationId[generationId ?? ''] ?? [];
        return images
            .map((img) => resolveImageUrl(img.imageUrl))
            .filter((u): u is string => Boolean(u));
    }, [imagesByGenerationId, generationId]);

    const loading =
        pageLoading ||
        specificationsLoading ||
        powertrainsLoading ||
        (generationId ? imagesByGenerationIdLoading[generationId] : false);

    const enc = encodeURIComponent;
    if (isAdmin && brandId && modelId) {
        return (
            <Navigate
                to={`/brands/${encodeURIComponent(brandId)}/${encodeURIComponent(modelId)}`}
                replace
            />
        );
    }

    const breadcrumb = brandId && modelId ? (
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
                { title: 'Характеристики' },
            ]}
        />
    ) : null;

    return (
        <Flex vertical gap={16}>
            {breadcrumb}
            <Typography.Title level={4} style={{ margin: 0 }}>
                {currentModel?.name ?? 'Модель'}
                {currentGeneration
                    ? ` · Поколение #${currentGeneration.number}`
                    : ''}
            </Typography.Title>

            <GenerationCharacteristicsView
                loading={Boolean(loading)}
                specifications={specifications}
                powertrains={powertrains}
                imageUrls={imageUrls}
                countryNameById={countryNameById}
                bodyTypeNameById={bodyTypeNameById}
                driveTypeNameById={driveTypeNameById}
                engineTypeNameById={engineTypeNameById}
                transmissionTypeNameById={transmissionTypeNameById}
                selectedSpecId={selectedSpecId}
                onSelectSpec={setSelectedSpecId}
            />
        </Flex>
    );
};

export default GenerationModelOptionsLayout;
