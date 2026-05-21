import React, { useMemo } from 'react';
import { CarOutlined } from '@ant-design/icons';
import { ConfigProvider, Image, Select, Space, Spin, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ruRU from 'antd/locale/ru_RU';
import type { Specification } from '../../stores/specificationStore';
import type { Powertrain } from '../../stores/powertrainStore';
import DimChip from './DimChip';
import { displayNum, resolveReferenceLabel } from './referenceUtils';

interface Props {
    loading: boolean;
    specifications: Specification[];
    powertrains: Powertrain[];
    imageUrls: string[];
    countryNameById: Map<string, string>;
    bodyTypeNameById: Map<string, string>;
    driveTypeNameById: Map<string, string>;
    engineTypeNameById: Map<string, string>;
    transmissionTypeNameById: Map<string, string>;
    selectedSpecId: string | null;
    onSelectSpec: (id: string) => void;
}

function SpecChipBlock({ children }: { children: React.ReactNode }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                flex: '0 0 auto',
            }}
        >
            {children}
        </div>
    );
}

function formatPowertrainRow(
    p: Powertrain,
    maps: {
        drive: Map<string, string>;
        engineType: Map<string, string>;
        transmissionType: Map<string, string>;
    },
) {
    const engineType = resolveReferenceLabel(p.engineTypeId, maps.engineType);
    const motor = [p.engine, engineType !== '—' ? engineType : ''].filter(Boolean).join(' ');
    const txType = resolveReferenceLabel(p.transmissionTypeId, maps.transmissionType);
    const gearbox = [p.transmission, txType !== '—' ? txType : ''].filter(Boolean).join(' ');

    return {
        key: p.id,
        motor: motor || '—',
        power: displayNum(p.enginePower),
        gearbox: gearbox || '—',
        drive: resolveReferenceLabel(p.driveTypeId, maps.drive),
        seats: displayNum(p.numOfSeats),
        note: p.note?.trim() || '—',
        acceleration: displayNum(p.acceleration),
        consumption: displayNum(p.consumption),
    };
}

const galleryBoxStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--app-gray-50)',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
};

const specRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 50,
    alignItems: 'flex-start',
};

const GenerationCharacteristicsView: React.FC<Props> = ({
    loading,
    specifications,
    powertrains,
    imageUrls,
    countryNameById,
    bodyTypeNameById,
    driveTypeNameById,
    engineTypeNameById,
    transmissionTypeNameById,
    selectedSpecId,
    onSelectSpec,
}) => {
    const visibleSpecs = useMemo(
        () =>
            [...specifications]
                .filter((s) => !s.isHidden)
                .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
        [specifications],
    );

    const spec =
        visibleSpecs.find((s) => s.id === selectedSpecId) ?? visibleSpecs[0] ?? null;

    const visiblePowertrains = useMemo(
        () =>
            [...powertrains]
                .filter((p) => !p.isHidden)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [powertrains],
    );

    const tableData = useMemo(
        () =>
            visiblePowertrains.map((p) =>
                formatPowertrainRow(p, {
                    drive: driveTypeNameById,
                    engineType: engineTypeNameById,
                    transmissionType: transmissionTypeNameById,
                }),
            ),
        [
            visiblePowertrains,
            driveTypeNameById,
            engineTypeNameById,
            transmissionTypeNameById,
        ],
    );

    const columns: ColumnsType<(typeof tableData)[number]> = [
        { title: 'Мотор', dataIndex: 'motor', key: 'motor', ellipsis: true },
        { title: 'Мощность', dataIndex: 'power', key: 'power', width: 96, align: 'center' },
        {
            title: 'Коробка передач',
            dataIndex: 'gearbox',
            key: 'gearbox',
            ellipsis: true,
        },
        { title: 'Привод', dataIndex: 'drive', key: 'drive', width: 120 },
        {
            title: 'Кол-во мест',
            dataIndex: 'seats',
            key: 'seats',
            width: 104,
            align: 'center',
        },
        { title: 'Прочее', dataIndex: 'note', key: 'note', ellipsis: true },
        {
            title: 'Разгон 0–100 км/ч',
            dataIndex: 'acceleration',
            key: 'acceleration',
            width: 140,
            align: 'center',
        },
        {
            title: 'Средний расход',
            dataIndex: 'consumption',
            key: 'consumption',
            width: 128,
            align: 'center',
        },
    ];

    const renderGallery = () => {
        if (imageUrls.length === 0) {
            return (
                <div style={galleryBoxStyle}>
                    <CarOutlined style={{ fontSize: 56, color: 'var(--app-gray-400)' }} />
                    <Typography.Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                        Нет изображений
                    </Typography.Text>
                </div>
            );
        }

        const [main, ...thumbs] = imageUrls;

        return (
            <Image.PreviewGroup>
                <div style={galleryBoxStyle}>
                    <Image
                        src={main}
                        alt="Автомобиль"
                        style={{
                            width: '100%',
                            maxWidth: '100%',
                            maxHeight: 200,
                            objectFit: 'contain',
                            display: 'block',
                        }}
                        preview={{ mask: 'Открыть' }}
                    />
                    {thumbs.length > 0 ? (
                        <Space size={6} wrap style={{ marginTop: 8, justifyContent: 'center' }}>
                            {thumbs.map((src) => (
                                <Image
                                    key={src}
                                    src={src}
                                    width={56}
                                    height={42}
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: 4,
                                        display: 'block',
                                    }}
                                />
                            ))}
                        </Space>
                    ) : null}
                </div>
            </Image.PreviewGroup>
        );
    };

    if (loading) {
        return (
            <div style={{ padding: 48, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!spec && visiblePowertrains.length === 0) {
        return (
            <Typography.Text type="secondary">
                Для этого поколения пока нет опубликованных характеристик.
            </Typography.Text>
        );
    }

    const countryLabel = spec
        ? resolveReferenceLabel(spec.countryId, countryNameById)
        : '—';
    const bodyTypeLabel = spec
        ? resolveReferenceLabel(spec.bodyTypeId, bodyTypeNameById)
        : '—';

    return (
        <div>
            {visibleSpecs.length > 1 ? (
                <div style={{ marginBottom: 20 }}>
                    <Typography.Text type="secondary" style={{ marginRight: 8 }}>
                        Вариант кузова:
                    </Typography.Text>
                    <Select
                        style={{ minWidth: 280 }}
                        value={spec?.id}
                        options={visibleSpecs.map((s) => ({ value: s.id, label: s.name }))}
                        onChange={onSelectSpec}
                    />
                </div>
            ) : null}

            {spec ? (
                <div style={specRowStyle}>
                    <div style={{ flex: '0 0 30%', width: '30%', maxWidth: '100%' }}>
                        {renderGallery()}
                    </div>

                    <SpecChipBlock>
                        <DimChip label="Длина" value={spec.length} />
                        <DimChip label="Высота" value={spec.height} />
                        <DimChip label="Ширина" value={spec.width} />
                        <DimChip label="Колёсная база" value={spec.wheelbase} />
                        <DimChip label="Клиренс" value={spec.clearance} />
                    </SpecChipBlock>

                    <SpecChipBlock>
                        <DimChip label="Бак" value={spec.tank} />
                        <DimChip label="Багажник" value={spec.trunkStandardVolume} />
                        <DimChip label="Багажник, max" value={spec.trunkMaximumVolume} />
                        <DimChip label="Тип кузова" value={bodyTypeLabel} />
                    </SpecChipBlock>

                    <SpecChipBlock>
                        <DimChip label="Производство" value={countryLabel} />
                        <DimChip label="Гарантия" value={spec.warranty || '—'} />
                    </SpecChipBlock>
                </div>
            ) : null}

            {visiblePowertrains.length > 0 ? (
                <div style={{ marginTop: 32 }}>
                    <Typography.Title level={5} style={{ marginBottom: 12 }}>
                        Силовые агрегаты
                    </Typography.Title>
                    <ConfigProvider locale={ruRU}>
                        <Table
                            rowKey="key"
                            columns={columns}
                            dataSource={tableData}
                            pagination={false}
                            bordered
                            size="middle"
                            scroll={{ x: 'max-content' }}
                        />
                    </ConfigProvider>
                </div>
            ) : null}
        </div>
    );
};

export default GenerationCharacteristicsView;
