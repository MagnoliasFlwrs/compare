import React, { useMemo } from 'react';
import { Card, Col, Descriptions, Row, Typography } from 'antd';
import type { Specification } from '../../stores/specificationStore';
import { sortByOrderThenName } from '../../utils/sortByOrder';

interface Props {
    specifications: Specification[];
    loading: boolean;
}

const SpecificationsGrid: React.FC<Props> = ({ specifications, loading }) => {
    const visible = useMemo(
        () => sortByOrderThenName(specifications.filter((s) => !s.isHidden)),
        [specifications],
    );

    if (loading) {
        return <Typography.Text type="secondary">Загрузка…</Typography.Text>;
    }

    if (visible.length === 0) {
        return <Typography.Text type="secondary">Характеристик пока нет.</Typography.Text>;
    }

    return (
        <Row gutter={[16, 16]}>
            {visible.map((s) => (
                <Col xs={24} sm={12} md={12} lg={8} key={s.id}>
                    <Card title={s.name}>
                        <Descriptions
                            size="small"
                            column={1}
                            colon
                            labelStyle={{ width: 180 }}
                            items={[
                                {
                                    key: 'dim',
                                    label: 'Габариты (Д×Ш×В), мм',
                                    children: `${s.length}×${s.width}×${s.height}`,
                                },
                                {
                                    key: 'wb',
                                    label: 'Колёсная база, мм',
                                    children: s.wheelbase,
                                },
                                {
                                    key: 'cl',
                                    label: 'Клиренс, мм',
                                    children: s.clearance,
                                },
                                {
                                    key: 'tank',
                                    label: 'Объём бака, л',
                                    children: s.tank,
                                },
                                {
                                    key: 'trunk',
                                    label: 'Багажник (станд./макс.), л',
                                    children: `${s.trunkStandardVolume} / ${s.trunkMaximumVolume}`,
                                },
                                ...(s.warranty
                                    ? [
                                          {
                                              key: 'w',
                                              label: 'Гарантия',
                                              children: s.warranty,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default SpecificationsGrid;
