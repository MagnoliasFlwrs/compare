import React, { useMemo } from 'react';
import { Card, Col, Descriptions, Row, Typography } from 'antd';
import type { Powertrain } from '../../stores/powertrainStore';
import { useDriveTypesStore } from '../../stores/driveTypesStore';
import { useEngineTypesStore } from '../../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../../stores/transmissionTypesStore';

interface Props {
    powertrains: Powertrain[];
    loading: boolean;
}

function pickIdString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        for (const key of ['id', 'value', 'uuid']) {
            const c = v[key];
            if (typeof c === 'string') return c;
        }
    }
    return '';
}

const PowertrainsGrid: React.FC<Props> = ({ powertrains, loading }) => {
    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);

    const driveTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of driveTypes) map.set(d.id, d.name);
        return map;
    }, [driveTypes]);
    const engineTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of engineTypes) map.set(d.id, d.name);
        return map;
    }, [engineTypes]);
    const transmissionTypeNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const d of transmissionTypes) map.set(d.id, d.name);
        return map;
    }, [transmissionTypes]);

    const visible = useMemo(
        () =>
            [...powertrains]
                .filter((p) => !p.isHidden)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [powertrains],
    );

    if (loading) {
        return <Typography.Text type="secondary">Загрузка…</Typography.Text>;
    }
    if (visible.length === 0) {
        return <Typography.Text type="secondary">Силовых агрегатов пока нет.</Typography.Text>;
    }

    return (
        <Row gutter={[16, 16]}>
            {visible.map((p) => {
                const driveId = pickIdString(p.driveTypeId);
                const driveLabel = driveId ? (driveTypeNameById.get(driveId) ?? '—') : '—';
                const engineTypeId = pickIdString(p.engineTypeId);
                const engineTypeLabel = engineTypeId
                    ? (engineTypeNameById.get(engineTypeId) ?? '—')
                    : '—';
                const transmissionTypeId = pickIdString(p.transmissionTypeId);
                const transmissionTypeLabel = transmissionTypeId
                    ? (transmissionTypeNameById.get(transmissionTypeId) ?? '—')
                    : '—';
                return (
                    <Col xs={24} sm={12} md={12} lg={8} key={p.id}>
                        <Card title={p.name}>
                            <Descriptions
                                size="small"
                                column={1}
                                colon
                                labelStyle={{ width: 200 }}
                                items={[
                                    {
                                        key: 'engine',
                                        label: 'Двигатель',
                                        children: p.engine
                                            ? `${p.engine}${
                                                  p.enginePower ? `, ${p.enginePower} л.с.` : ''
                                              }`
                                            : '—',
                                    },
                                    {
                                        key: 'engineType',
                                        label: 'Тип двигателя',
                                        children: engineTypeLabel,
                                    },
                                    {
                                        key: 'tx',
                                        label: 'Коробка передач',
                                        children: p.transmission
                                            ? `${p.transmission}${
                                                  p.numOfGears ? `, ${p.numOfGears} ст.` : ''
                                              }`
                                            : '—',
                                    },
                                    {
                                        key: 'txType',
                                        label: 'Тип КПП',
                                        children: transmissionTypeLabel,
                                    },
                                    {
                                        key: 'drive',
                                        label: 'Привод',
                                        children: driveLabel,
                                    },
                                    {
                                        key: 'acc',
                                        label: 'Разгон 0–100, с',
                                        children: p.acceleration ?? '—',
                                    },
                                    {
                                        key: 'cons',
                                        label: 'Расход, л/100 км',
                                        children: p.consumption ?? '—',
                                    },
                                    {
                                        key: 'seats',
                                        label: 'Мест',
                                        children: p.numOfSeats ?? '—',
                                    },
                                    ...(p.note
                                        ? [
                                              {
                                                  key: 'note',
                                                  label: 'Примечание',
                                                  children: p.note,
                                              },
                                          ]
                                        : []),
                                ]}
                            />
                        </Card>
                    </Col>
                );
            })}
        </Row>
    );
};

export default PowertrainsGrid;
