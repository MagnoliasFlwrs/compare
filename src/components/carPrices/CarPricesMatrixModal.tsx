import React, { useCallback, useEffect, useState } from 'react';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
    App,
    Button,
    Flex,
    Form,
    InputNumber,
    Modal,
    Popconfirm,
    Spin,
    Typography,
} from 'antd';
import type { Generation } from '../../types/generation';
import {
    getCarPriceCellKey,
    useCarPricesStore,
    type CarPrice,
    type CarPriceMatrixData,
} from '../../stores/carPricesStore';
import type { Powertrain } from '../../stores/powertrainStore';
import type { Trim } from '../../stores/trimsStore';

interface Props {
    generation: Generation | null;
    modelName?: string;
    onClose: () => void;
}

type EditTarget = {
    powertrain: Powertrain;
    trim: Trim;
    existing: CarPrice | null;
};

function formatPowertrainLabel(p: Powertrain): string {
    const parts = [p.name?.trim()].filter(Boolean);
    if (p.engine) parts.push(p.engine);
    if (p.enginePower) parts.push(`${p.enginePower} л.с.`);
    return parts.length > 0 ? parts.join(' · ') : `Агрегат ${p.id.slice(0, 8)}`;
}

function formatPrice(value: number): string {
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(value);
}

const CarPricesMatrixModal: React.FC<Props> = ({ generation, modelName, onClose }) => {
    const { message } = App.useApp();
    const open = Boolean(generation);

    const matrixLoading = useCarPricesStore((s) => s.loading);
    const saving = useCarPricesStore((s) => s.saving);
    const fetchMatrixForGeneration = useCarPricesStore((s) => s.fetchMatrixForGeneration);
    const createCarPrice = useCarPricesStore((s) => s.createCarPrice);
    const updateCarPriceById = useCarPricesStore((s) => s.updateCarPriceById);
    const deleteCarPriceById = useCarPricesStore((s) => s.deleteCarPriceById);

    const [matrix, setMatrix] = useState<CarPriceMatrixData | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
    const [editForm] = Form.useForm<{ price: number }>();

    const loadMatrix = useCallback(async () => {
        if (!generation) return;
        setLoadError(false);
        try {
            const data = await fetchMatrixForGeneration(generation.id);
            setMatrix(data);
        } catch {
            setLoadError(true);
            setMatrix(null);
            message.error('Не удалось загрузить матрицу цен');
        }
    }, [generation, fetchMatrixForGeneration, message]);

    useEffect(() => {
        if (!open || !generation) {
            setMatrix(null);
            setEditTarget(null);
            setLoadError(false);
            return;
        }
        loadMatrix();
    }, [open, generation?.id, loadMatrix]);

    const openEdit = (powertrain: Powertrain, trim: Trim) => {
        const key = getCarPriceCellKey(powertrain.id, trim.id);
        const existing = matrix?.priceByCell[key] ?? null;
        setEditTarget({ powertrain, trim, existing });
        editForm.setFieldsValue({ price: existing?.price ?? undefined });
    };

    const closeEdit = () => {
        setEditTarget(null);
        editForm.resetFields();
    };

    const onSavePrice = async (values: { price: number }) => {
        if (!editTarget) return;
        const price = Number(values.price);
        if (Number.isNaN(price) || price < 0) {
            message.warning('Введите корректную цену');
            return;
        }

        const key = getCarPriceCellKey(editTarget.powertrain.id, editTarget.trim.id);

        try {
            let saved: CarPrice;
            if (editTarget.existing) {
                saved = await updateCarPriceById(editTarget.existing.id, { price });
                message.success('Цена обновлена');
            } else {
                saved = await createCarPrice({
                    powertrainId: editTarget.powertrain.id,
                    trimId: editTarget.trim.id,
                    price,
                });
                message.success('Цена добавлена');
            }

            setMatrix((prev) =>
                prev
                    ? {
                          ...prev,
                          priceByCell: { ...prev.priceByCell, [key]: saved },
                      }
                    : prev,
            );
            closeEdit();
        } catch {
            message.error(
                editTarget.existing ? 'Не удалось обновить цену' : 'Не удалось добавить цену',
            );
        }
    };

    const onDeletePrice = async (cell: CarPrice, key: string) => {
        try {
            await deleteCarPriceById(cell.id);
            setMatrix((prev) => {
                if (!prev) return prev;
                const priceByCell = { ...prev.priceByCell };
                delete priceByCell[key];
                return { ...prev, priceByCell };
            });
            if (editTarget?.existing?.id === cell.id) {
                closeEdit();
            }
            message.success('Цена удалена');
        } catch {
            message.error('Не удалось удалить цену');
        }
    };

    const title = generation
        ? `Цены · Поколение #${generation.number}${modelName ? ` · ${modelName}` : ''}`
        : 'Цены';

    const trims = matrix?.trims ?? [];
    const powertrains = matrix?.powertrains ?? [];
    const priceByCell = matrix?.priceByCell ?? {};

    return (
        <>
            <Modal
                title={title}
                open={open}
                onCancel={onClose}
                footer={null}
                width="min(96vw, 1200px)"
                destroyOnClose
                styles={{ body: { paddingTop: 12 } }}
            >
                {matrixLoading ? (
                    <Flex justify="center" style={{ padding: 48 }}>
                        <Spin tip="Загрузка матрицы…" />
                    </Flex>
                ) : loadError ? (
                    <Flex vertical gap={12} align="center" style={{ padding: 24 }}>
                        <Typography.Text type="danger">
                            Не удалось загрузить данные
                        </Typography.Text>
                        <Button onClick={() => loadMatrix()}>Повторить</Button>
                    </Flex>
                ) : trims.length === 0 || powertrains.length === 0 ? (
                    <Typography.Text type="secondary">
                        {trims.length === 0 && powertrains.length === 0
                            ? 'Добавьте комплектации и силовые агрегаты для этого поколения.'
                            : trims.length === 0
                              ? 'Нет комплектаций — добавьте их в разделе «Комплектации».'
                              : 'Нет силовых агрегатов — добавьте их в разделе «Силовые агрегаты».'}
                    </Typography.Text>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: 13,
                                minWidth: trims.length * 120 + 220,
                            }}
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 2,
                                            background: 'var(--app-gray-50)',
                                            border: '1px solid #f0f0f0',
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            minWidth: 200,
                                        }}
                                    />
                                    {trims.map((trim) => (
                                        <th
                                            key={trim.id}
                                            style={{
                                                border: '1px solid #f0f0f0',
                                                padding: '8px 10px',
                                                textAlign: 'center',
                                                background: 'var(--app-gray-50)',
                                                fontWeight: 600,
                                                verticalAlign: 'bottom',
                                            }}
                                        >
                                            {trim.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {powertrains.map((pt) => (
                                    <tr key={pt.id}>
                                        <td
                                            style={{
                                                position: 'sticky',
                                                left: 0,
                                                zIndex: 1,
                                                background: 'var(--app-white)',
                                                border: '1px solid #f0f0f0',
                                                padding: '10px 12px',
                                                fontWeight: 500,
                                                maxWidth: 220,
                                            }}
                                        >
                                            {formatPowertrainLabel(pt)}
                                        </td>
                                        {trims.map((trim) => {
                                            const key = getCarPriceCellKey(pt.id, trim.id);
                                            const cell = priceByCell[key];
                                            return (
                                                <td
                                                    key={trim.id}
                                                    style={{
                                                        border: '1px solid #f0f0f0',
                                                        padding: 8,
                                                        textAlign: 'center',
                                                        verticalAlign: 'middle',
                                                        background: 'var(--app-gray-50)',
                                                    }}
                                                >
                                                    {cell ? (
                                                        <Flex
                                                            align="center"
                                                            justify="center"
                                                            gap={6}
                                                            wrap="wrap"
                                                        >
                                                            <Typography.Text strong>
                                                                {formatPrice(cell.price)}
                                                            </Typography.Text>
                                                            <Button
                                                                type="text"
                                                                size="small"
                                                                icon={<EditOutlined />}
                                                                aria-label="Изменить цену"
                                                                onClick={() =>
                                                                    openEdit(pt, trim)
                                                                }
                                                            />
                                                            <Popconfirm
                                                                title="Удалить цену?"
                                                                description={formatPrice(
                                                                    cell.price,
                                                                )}
                                                                okText="Удалить"
                                                                cancelText="Отмена"
                                                                okButtonProps={{ danger: true }}
                                                                onConfirm={() =>
                                                                    onDeletePrice(cell, key)
                                                                }
                                                            >
                                                                <Button
                                                                    type="text"
                                                                    size="small"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    aria-label="Удалить цену"
                                                                    loading={saving}
                                                                />
                                                            </Popconfirm>
                                                        </Flex>
                                                    ) : (
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            onClick={() => openEdit(pt, trim)}
                                                        >
                                                            Добавить
                                                        </Button>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td
                                        style={{
                                            border: 'none',
                                            padding: '10px 0 0',
                                        }}
                                    />
                                    {trims.map((trim) => (
                                        <td
                                            key={`foot-${trim.id}`}
                                            style={{
                                                border: 'none',
                                                padding: '10px 4px 0',
                                                textAlign: 'center',
                                                fontSize: 12,
                                                color: 'rgba(0,0,0,0.45)',
                                            }}
                                        >
                                            {trim.name}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Modal>

            <Modal
                title={
                    editTarget
                        ? editTarget.existing
                            ? 'Изменить цену'
                            : 'Добавить цену'
                        : ''
                }
                open={!!editTarget}
                onCancel={closeEdit}
                footer={null}
                destroyOnClose
                width={400}
            >
                {editTarget ? (
                    <>
                        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                            {formatPowertrainLabel(editTarget.powertrain)}
                            <br />
                            {editTarget.trim.name}
                        </Typography.Paragraph>
                        <Form form={editForm} layout="vertical" onFinish={onSavePrice}>
                            <Form.Item
                                label="Цена"
                                name="price"
                                rules={[
                                    { required: true, message: 'Введите цену' },
                                    {
                                        type: 'number',
                                        min: 0,
                                        message: 'Цена не может быть отрицательной',
                                    },
                                ]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    formatter={(v) =>
                                        `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
                                    }
                                    parser={(v) => Number((v ?? '').replace(/\s/g, ''))}
                                />
                            </Form.Item>
                            <Form.Item style={{ marginBottom: 0 }}>
                                <Flex justify="flex-end" gap={8}>
                                    <Button onClick={closeEdit}>Отмена</Button>
                                    <Button type="primary" htmlType="submit" loading={saving}>
                                        Сохранить
                                    </Button>
                                </Flex>
                            </Form.Item>
                        </Form>
                    </>
                ) : null}
            </Modal>
        </>
    );
};

export default CarPricesMatrixModal;
