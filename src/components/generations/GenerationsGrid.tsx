import React from 'react';
import { Card, Col, Row, Typography } from 'antd';
import type { Generation } from '../../types/generation';

interface Props {
    generations: Generation[];
    loading: boolean;
}

const GenerationsGrid: React.FC<Props> = ({ generations, loading }) => {
    if (loading) {
        return <Typography.Text type="secondary">Загрузка…</Typography.Text>;
    }
    return (
        <Row gutter={[16, 16]}>
            {generations.map((g) => (
                <Col xs={24} sm={12} md={8} lg={6} key={g.id}>
                    <Card>
                        <Typography.Text strong>#{g.number}</Typography.Text>
                        <Typography.Paragraph style={{ marginBottom: 0 }} type="secondary">
                            {g.restyling || '—'}
                        </Typography.Paragraph>
                        <Typography.Text>
                            {g.yearFrom}–{g.yearTo}
                        </Typography.Text>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default GenerationsGrid;
