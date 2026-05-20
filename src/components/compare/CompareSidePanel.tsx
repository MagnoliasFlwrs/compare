import React, { useEffect, useMemo, useState } from 'react';
import { App, Divider, Flex, Spin, Typography } from 'antd';
import GenerationCharacteristicsView from '../generationOptions/GenerationCharacteristicsView';
import type { CompareSideData } from '../../utils/compare/loadCompareSideData';
import { useCountriesStore } from '../../stores/countriesStore';
import { useBodyTypesStore } from '../../stores/bodyTypesStore';
import { useDriveTypesStore } from '../../stores/driveTypesStore';
import { useEngineTypesStore } from '../../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../../stores/transmissionTypesStore';

function generationBlockTitle(g: CompareSideData['blocks'][0]['generation']): string {
    const years = `${g.yearFrom}–${g.yearTo || '…'}`;
    return `Поколение #${g.number}${g.restyling ? ` (${g.restyling})` : ''} · ${years}`;
}

interface Props {
    data: CompareSideData | null;
    loading: boolean;
}

const CompareSidePanel: React.FC<Props> = ({ data, loading }) => {
    const { message } = App.useApp();
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

    const [selectedSpecByGen, setSelectedSpecByGen] = useState<Record<string, string>>({});

    useEffect(() => {
        const loadRefs = async () => {
            try {
                await Promise.all([
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
                message.error('Не удалось загрузить справочники');
            }
        };
        loadRefs();
    }, [
        countries.length,
        bodyTypes.length,
        driveTypes.length,
        engineTypes.length,
        transmissionTypes.length,
        getCountries,
        getBodyTypes,
        getDriveTypes,
        getEngineTypes,
        getTransmissionTypes,
        message,
    ]);

    const countryNameById = useMemo(
        () => new Map(countries.map((c) => [c.id, c.name])),
        [countries],
    );
    const bodyTypeNameById = useMemo(
        () => new Map(bodyTypes.map((b) => [b.id, b.name])),
        [bodyTypes],
    );
    const driveTypeNameById = useMemo(
        () => new Map(driveTypes.map((d) => [d.id, d.name])),
        [driveTypes],
    );
    const engineTypeNameById = useMemo(
        () => new Map(engineTypes.map((e) => [e.id, e.name])),
        [engineTypes],
    );
    const transmissionTypeNameById = useMemo(
        () => new Map(transmissionTypes.map((t) => [t.id, t.name])),
        [transmissionTypes],
    );

    if (loading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: 240, flex: 1 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    if (!data || data.blocks.length === 0) {
        return (
            <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center' }}>
                Нет данных для сравнения
            </Typography.Text>
        );
    }

    const subtitleParts = [
        data.selection.generationLabel,
        data.selection.powertrainLabel,
        data.selection.trimLabel,
    ].filter(Boolean);

    return (
        <Flex vertical gap={24} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ textAlign: 'center' }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    {data.title}
                </Typography.Title>
                {subtitleParts.length > 0 ? (
                    <Typography.Text type="secondary">{subtitleParts.join(' · ')}</Typography.Text>
                ) : (
                    <Typography.Text type="secondary">Все поколения</Typography.Text>
                )}
            </div>

            {data.blocks.map((block, idx) => {
                const genId = block.generation.id;
                const specs = block.specifications;
                const selectedSpecId =
                    selectedSpecByGen[genId] ?? (specs.length > 0 ? specs[0].id : null);

                return (
                    <div key={genId}>
                        {data.blocks.length > 1 ? (
                            <>
                                <Typography.Title level={5} style={{ marginTop: 0 }}>
                                    {generationBlockTitle(block.generation)}
                                </Typography.Title>
                                <Divider style={{ margin: '12px 0 16px' }} />
                            </>
                        ) : null}
                        <GenerationCharacteristicsView
                            loading={false}
                            specifications={specs}
                            powertrains={block.powertrains}
                            imageUrls={block.imageUrls}
                            countryNameById={countryNameById}
                            bodyTypeNameById={bodyTypeNameById}
                            driveTypeNameById={driveTypeNameById}
                            engineTypeNameById={engineTypeNameById}
                            transmissionTypeNameById={transmissionTypeNameById}
                            selectedSpecId={selectedSpecId}
                            onSelectSpec={(id) =>
                                setSelectedSpecByGen((prev) => ({ ...prev, [genId]: id }))
                            }
                        />
                        {idx < data.blocks.length - 1 ? (
                            <Divider style={{ margin: '32px 0' }} />
                        ) : null}
                    </div>
                );
            })}
        </Flex>
    );
};

export default CompareSidePanel;
