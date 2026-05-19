import React, { useEffect, useMemo, useRef } from 'react';
import {
    Button,
    Checkbox,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Typography,
} from 'antd';
import { useDriveTypesStore } from '../../stores/driveTypesStore';
import { useEngineTypesStore } from '../../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../../stores/transmissionTypesStore';

export type PowertrainFormValues = {
    name: string;
    isHidden: boolean;
    order: number;
    engine: string;
    engineTypeId: string;
    enginePower: number;
    transmission: string;
    transmissionTypeId: string;
    numOfGears: number;
    driveTypeId: string;
    acceleration: number;
    consumption: number;
    numOfSeats: number;
    note: string;
};

interface Props {
    title: string;
    open: boolean;
    submitting: boolean;
    submitText: string;
    /** Меняется только при смене редактируемой записи — не на каждый ре-рендер родителя */
    seedKey?: string;
    defaultOrder?: number;
    initialValues?: PowertrainFormValues;
    onCancel: () => void;
    onSubmit: (values: PowertrainFormValues) => Promise<void> | void;
}

const DEFAULT_VALUES: PowertrainFormValues = {
    name: '',
    isHidden: false,
    order: 0,
    engine: '',
    engineTypeId: '',
    enginePower: 0,
    transmission: '',
    transmissionTypeId: '',
    numOfGears: 0,
    driveTypeId: '',
    acceleration: 0,
    consumption: 0,
    numOfSeats: 0,
    note: '',
};

const PowertrainFormModal: React.FC<Props> = ({
    title,
    open,
    submitting,
    submitText,
    seedKey = 'add',
    defaultOrder = 0,
    initialValues,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<PowertrainFormValues>();
    const prevOpenRef = useRef(false);
    const lastSeedKeyRef = useRef<string | null>(null);

    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const driveTypesLoading = useDriveTypesStore((s) => s.loading);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);

    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const engineTypesLoading = useEngineTypesStore((s) => s.loading);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);

    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const transmissionTypesLoading = useTransmissionTypesStore((s) => s.loading);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);

    // Заполняем форму только при открытии или смене seedKey (id записи при редактировании).
    // Не зависим от initialValues по ссылке — родитель мог бы передавать новый {} каждый рендер.
    useEffect(() => {
        if (!open) {
            prevOpenRef.current = false;
            lastSeedKeyRef.current = null;
            return;
        }

        const justOpened = !prevOpenRef.current;
        const seedChanged = lastSeedKeyRef.current !== seedKey;
        prevOpenRef.current = true;
        lastSeedKeyRef.current = seedKey;

        if (justOpened || seedChanged) {
            form.setFieldsValue(
                initialValues ?? { ...DEFAULT_VALUES, order: defaultOrder },
            );
        }
    }, [open, seedKey, defaultOrder, initialValues, form]);

    useEffect(() => {
        if (!open) return;
        if (driveTypes.length === 0) {
            getDriveTypes({ page: 1, limit: 500 }).catch(() => {});
        }
        if (engineTypes.length === 0) {
            getEngineTypes({ page: 1, limit: 500 }).catch(() => {});
        }
        if (transmissionTypes.length === 0) {
            getTransmissionTypes({ page: 1, limit: 500 }).catch(() => {});
        }
    }, [open, getDriveTypes, getEngineTypes, getTransmissionTypes]);

    const driveTypeOptions = useMemo(
        () => driveTypes.map((d) => ({ value: d.id, label: d.name })),
        [driveTypes],
    );
    const engineTypeOptions = useMemo(
        () => engineTypes.map((d) => ({ value: d.id, label: d.name })),
        [engineTypes],
    );
    const transmissionTypeOptions = useMemo(
        () => transmissionTypes.map((d) => ({ value: d.id, label: d.name })),
        [transmissionTypes],
    );

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={title}
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose={false}
            width={760}
        >
            <Form<PowertrainFormValues>
                form={form}
                layout="vertical"
                preserve
                onFinish={async (values) => {
                    const payload: PowertrainFormValues = {
                        name: values.name.trim(),
                        isHidden: Boolean(values.isHidden),
                        order: Number(values.order ?? 0),
                        engine: (values.engine ?? '').trim(),
                        engineTypeId: (values.engineTypeId ?? '').trim(),
                        enginePower: Number(values.enginePower ?? 0),
                        transmission: (values.transmission ?? '').trim(),
                        transmissionTypeId: (values.transmissionTypeId ?? '').trim(),
                        numOfGears: Number(values.numOfGears ?? 0),
                        driveTypeId: (values.driveTypeId ?? '').trim(),
                        acceleration: Number(values.acceleration ?? 0),
                        consumption: Number(values.consumption ?? 0),
                        numOfSeats: Number(values.numOfSeats ?? 0),
                        note: (values.note ?? '').trim(),
                    };
                    try {
                        await onSubmit(payload);
                    } catch {
                        form.setFieldsValue(payload);
                    }
                }}
            >
                <Row gutter={12}>
                    <Col xs={24} sm={16}>
                        <Form.Item
                            label="Название"
                            name="name"
                            rules={[{ required: true, message: 'Введите название' }]}
                        >
                            <Input placeholder="Например: 1.6 MPI 6MT FWD" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Порядок" name="order">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Двигатель</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Двигатель (описание)" name="engine">
                            <Input placeholder="Например: 1.6 MPI" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Мощность, л.с." name="enginePower">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Тип двигателя" name="engineTypeId">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Выберите тип двигателя"
                                options={engineTypeOptions}
                                loading={engineTypesLoading}
                                optionFilterProp="label"
                                notFoundContent={
                                    engineTypesLoading ? 'Загрузка…' : 'Типов двигателя нет'
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Трансмиссия и привод</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Коробка передач (описание)" name="transmission">
                            <Input placeholder="Например: 6MT" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Кол-во передач" name="numOfGears">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Тип КПП" name="transmissionTypeId">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Выберите тип КПП"
                                options={transmissionTypeOptions}
                                loading={transmissionTypesLoading}
                                optionFilterProp="label"
                                notFoundContent={
                                    transmissionTypesLoading ? 'Загрузка…' : 'Типов КПП нет'
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Привод" name="driveTypeId">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Выберите тип привода"
                                options={driveTypeOptions}
                                loading={driveTypesLoading}
                                optionFilterProp="label"
                                notFoundContent={
                                    driveTypesLoading ? 'Загрузка…' : 'Типов привода нет'
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Динамика и комфорт</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Разгон 0–100, с" name="acceleration">
                            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Расход, л/100 км" name="consumption">
                            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item label="Мест" name="numOfSeats">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Примечание" name="note">
                    <Input.TextArea rows={3} placeholder="Доп. информация" />
                </Form.Item>

                <Form.Item name="isHidden" valuePropName="checked">
                    <Checkbox>Скрыто</Checkbox>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCancel}>Отмена</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {submitText}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default PowertrainFormModal;
