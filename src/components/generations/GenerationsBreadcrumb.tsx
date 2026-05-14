import React from 'react';
import { Breadcrumb, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

interface Props {
    brandId?: string;
    brandName?: string;
    modelName?: string;
}

const GenerationsBreadcrumb: React.FC<Props> = ({ brandId, brandName, modelName }) => (
    <Flex vertical gap={8}>
        <Breadcrumb
            items={[
                { title: <Link to="/brands">Бренды</Link> },
                ...(brandId
                    ? [
                          {
                              title: (
                                  <Link to={`/brands/${encodeURIComponent(brandId)}`}>
                                      {brandName ?? 'Бренд'}
                                  </Link>
                              ),
                          },
                      ]
                    : []),
                { title: modelName ?? 'Модель' },
            ]}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
            Поколения: {modelName ?? 'Модель'}
        </Typography.Title>
    </Flex>
);

export default GenerationsBreadcrumb;
