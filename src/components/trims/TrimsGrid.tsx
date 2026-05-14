import React, { useMemo } from 'react';
import { Card, Col, Row, Typography } from 'antd';
import type { Trim } from '../../stores/trimsStore';

interface Props {
    trims: Trim[];
    loading: boolean;
}

const TrimsGrid: React.FC<Props> = ({ trims, loading }) => {
    const visibleTrims = useMemo(
        () =>
            [...trims]
                .filter((t) => !t.isHidden)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [trims],
    );

    if (loading) {
        return <Typography.Text type="secondary">Загрузка…</Typography.Text>;
    }

    if (visibleTrims.length === 0) {
        return <Typography.Text type="secondary">Комплектаций пока нет.</Typography.Text>;
    }

    return (
        <Row gutter={[16, 16]}>
            {visibleTrims.map((t) => (
                <Col xs={24} sm={12} md={8} lg={6} key={t.id}>
                    <Card>
                        <Typography.Text strong>{t.name}</Typography.Text>
                        <Typography.Paragraph
                            style={{ marginBottom: 0 }}
                            type="secondary"
                        >
                            Порядок: {t.order}
                        </Typography.Paragraph>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default TrimsGrid;
