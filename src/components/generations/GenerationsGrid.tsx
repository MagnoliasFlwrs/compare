import React, { useEffect } from 'react';
import { Card, Col, Dropdown, Image, Row, Skeleton, Space, Typography } from 'antd';
import { useParams } from 'react-router-dom';
import type { Generation } from '../../types/generation';
import { useGenerationStore } from '../../stores/generationStore';
import { resolveImageUrl } from './utils';
import { getGenerationMenuItems } from './generationMenu';

interface Props {
    generations: Generation[];
    loading: boolean;
}

interface GenerationCardProps {
    generation: Generation;
    brandId?: string;
    modelId?: string;
}

const GenerationCard: React.FC<GenerationCardProps> = ({ generation, brandId, modelId }) => {
    const images = useGenerationStore(
        (s) => s.imagesByGenerationId[generation.id],
    );
    const imagesLoading = useGenerationStore(
        (s) => s.imagesByGenerationIdLoading[generation.id],
    );
    const loadImagesForGeneration = useGenerationStore(
        (s) => s.loadImagesForGeneration,
    );

    useEffect(() => {
        // Грузим картинки только если их ещё нет в кэше.
        if (images === undefined) {
            loadImagesForGeneration(generation.id).catch(() => {});
        }
    }, [generation.id, images, loadImagesForGeneration]);

    const urls = (images ?? [])
        .map((img) => resolveImageUrl(img.imageUrl))
        .filter((u): u is string => Boolean(u));

    const renderGallery = () => {
        if (imagesLoading && (images?.length ?? 0) === 0) {
            return <Skeleton.Image active style={{ width: '100%', height: 160 }} />;
        }
        if (urls.length === 0) {
            return (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Нет изображений
                </Typography.Text>
            );
        }

        const [cover, ...rest] = urls;

        return (
            <Image.PreviewGroup>
                <div
                    style={{
                        width: '100%',
                        height: 180,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: 'rgba(0,0,0,0.04)',
                    }}
                >
                    <Image
                        src={cover}
                        alt={`Поколение #${generation.number}`}
                        width="100%"
                        height={180}
                        style={{ objectFit: 'cover', display: 'block' }}
                        preview={{ mask: 'Открыть галерею' }}
                    />
                </div>

                {rest.length > 0 ? (
                    <Space size={6} wrap style={{ marginTop: 8 }}>
                        {rest.map((src) => (
                            <Image
                                key={src}
                                src={src}
                                width={48}
                                height={48}
                                style={{
                                    objectFit: 'cover',
                                    borderRadius: 4,
                                    display: 'block',
                                }}
                            />
                        ))}
                    </Space>
                ) : null}
            </Image.PreviewGroup>
        );
    };

    const canOpenMenu = Boolean(brandId && modelId);

    const body = (
        <div style={canOpenMenu ? { cursor: 'pointer' } : undefined}>
            <Typography.Text strong>Поколение #{generation.number}</Typography.Text>
            <Typography.Paragraph style={{ marginBottom: 0 }} type="secondary">
                Рестайлинг: {generation.restyling || '—'}
            </Typography.Paragraph>
            <Typography.Text>
                Годы выпуска: {generation.yearFrom}–{generation.yearTo}
            </Typography.Text>
        </div>
    );

    return (
        <Card
            cover={<div style={{ padding: 12, paddingBottom: 0 }}>{renderGallery()}</div>}
        >
            {canOpenMenu ? (
                <Dropdown
                    menu={{
                        items: getGenerationMenuItems(brandId!, modelId!, generation.id),
                    }}
                    trigger={['click', 'hover']}
                >
                    {body}
                </Dropdown>
            ) : (
                body
            )}
        </Card>
    );
};

const GenerationsGrid: React.FC<Props> = ({ generations, loading }) => {
    const { id: brandId, modelId } = useParams<{ id: string; modelId: string }>();

    if (loading) {
        return <Typography.Text type="secondary">Загрузка…</Typography.Text>;
    }
    return (
        <Row gutter={[16, 16]}>
            {generations.map((g) => (
                <Col xs={24} sm={12} md={8} lg={6} key={g.id}>
                    <GenerationCard generation={g} brandId={brandId} modelId={modelId} />
                </Col>
            ))}
        </Row>
    );
};

export default GenerationsGrid;
