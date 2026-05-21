import React from 'react';
import { Typography } from 'antd';

interface Props {
    label: string;
    value?: string | number | null;
}

const DimChip: React.FC<Props> = ({ label, value }) => (
    <Typography.Text
        style={{
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
        }}
    >
        <span
            style={{
                flex: '0 0 110px',
                width: 90,
            }}
        >
            {label}:
        </span>
        <span
            style={{
                display: 'inline-block',
                minWidth: 44,
                padding: '2px 10px',
                textAlign: 'center',
                border: '1px dashed var(--app-gray-300)',
                background: 'var(--app-gray-50)',
                borderRadius: 2,
            }}
        >
            {value ?? '—'}
        </span>
    </Typography.Text>
);

export default DimChip;
