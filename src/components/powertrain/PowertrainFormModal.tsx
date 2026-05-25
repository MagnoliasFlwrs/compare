import React, { useEffect, useMemo, useState } from 'react';
import {
    App,
    Button,
    Col,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Switch,
    Typography,
} from 'antd';
import type { Powertrain } from '../../stores/powertrainStore';
import { usePowertrainStore } from '../../stores/powertrainStore';
import { useDriveTypesStore } from '../../stores/driveTypesStore';
import { useEngineTypesStore } from '../../stores/engineTypesStore';
import { useTransmissionTypesStore } from '../../stores/transmissionTypesStore';
import { buildDriveTypeSelectOptions } from './powertrainFormConstants';
import {
    enginePowerRules,
    numOfGearsRules,
    oneDecimalRule,
} from './powertrainFormValidation';
import {
    normalizePowertrainFormValues,
    powertrainFormDefaults,
    powertrainToFormValues,
    type PowertrainFormValues,
} from './powertrainFormUtils';
import '../specifications/specificationForm.css';

export type { PowertrainFormValues };

interface Props {
    open: boolean;
    editing: Powertrain | null;
    generationId: string | null;
    defaultOrder?: number;
    onClose: () => void;
    onSaved?: () => void;
}

const PowertrainFormModal: React.FC<Props> = ({
    open,
    editing,
    generationId,
    defaultOrder = 0,
    onClose,
    onSaved,
}) => {
    const { message } = App.useApp();
    const createPowertrain = usePowertrainStore((s) => s.createPowertrain);
    const updatePowertrainById = usePowertrainStore((s) => s.updatePowertrainById);

    const [form] = Form.useForm<PowertrainFormValues>();
    const [submitting, setSubmitting] = useState(false);

    const driveTypes = useDriveTypesStore((s) => s.driveTypes);
    const driveTypesLoading = useDriveTypesStore((s) => s.loading);
    const getDriveTypes = useDriveTypesStore((s) => s.getDriveTypes);

    const engineTypes = useEngineTypesStore((s) => s.engineTypes);
    const engineTypesLoading = useEngineTypesStore((s) => s.loading);
    const getEngineTypes = useEngineTypesStore((s) => s.getEngineTypes);

    const transmissionTypes = useTransmissionTypesStore((s) => s.transmissionTypes);
    const transmissionTypesLoading = useTransmissionTypesStore((s) => s.loading);
    const getTransmissionTypes = useTransmissionTypesStore((s) => s.getTransmissionTypes);

    const isEdit = editing !== null;

    const title = useMemo(
        () =>
            isEdit
                ? `Редактирование: ${editing.name}`
                : 'Новый силовой агрегат',
        [isEdit, editing],
    );

    const submitText = isEdit ? 'Сохранить' : 'Создать';

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }
        if (editing) {
            form.setFieldsValue(powertrainToFormValues(editing));
        } else {
            form.setFieldsValue(powertrainFormDefaults(defaultOrder));
        }
    }, [open, editing, defaultOrder, form]);

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
        () => buildDriveTypeSelectOptions(driveTypes),
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
        onClose();
    };

    const onCreate = async (values: PowertrainFormValues) => {
        if (!generationId) return;
        setSubmitting(true);
        try {
            const payload = normalizePowertrainFormValues(values);
            await createPowertrain({ generationId, ...payload });
            message.success('Силовой агрегат создан');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось создать силовой агрегат');
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdate = async (values: PowertrainFormValues) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updatePowertrainById(editing.id, normalizePowertrainFormValues(values));
            message.success('Силовой агрегат обновлён');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось обновить силовой агрегат');
        } finally {
            setSubmitting(false);
        }
    };

    const onSubmit = isEdit ? onUpdate : onCreate;

    return (
        <Modal
            title={title}
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
            width={800}
        >
            <Form
                form={form}
                layout="vertical"
            
                className="specification-form--compact"
                onFinish={onSubmit}
            >
                <Row gutter={[12, 0]}>
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
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Двигатель (описание)" name="engine">
                            <Input placeholder="Например: 1.6 MPI" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item
                            label="Мощность двигателя"
                            name="enginePower"
                            rules={enginePowerRules}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                addonAfter="л.с."
                                placeholder="0"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Тип двигателя" name="engineTypeId">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Тип"
                                options={engineTypeOptions}
                                loading={engineTypesLoading}
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Трансмиссия и привод</Typography.Text>
                </Divider>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item label="Коробка передач (описание)" name="transmission">
                            <Input placeholder="Например: 6MT" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Кол-во передач" name="numOfGears" rules={numOfGearsRules}>
                            <InputNumber
                                min={0}
                                max={99}
                                precision={0}
                                style={{ width: '100%' }}
                                placeholder="0–99"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                        <Form.Item label="Тип КПП" name="transmissionTypeId">
                            <Select
                                showSearch
                                allowClear
                                placeholder="Тип КПП"
                                options={transmissionTypeOptions}
                                loading={transmissionTypesLoading}
                                optionFilterProp="label"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Привод"
                            name="driveTypeId"
                            rules={[{ required: true, message: 'Выберите привод' }]}
                        >
                            <Select
                                placeholder="Выберите привод"
                                options={driveTypeOptions}
                                loading={driveTypesLoading}
                                notFoundContent={
                                    driveTypesLoading ? 'Загрузка…' : 'Нет данных справочника'
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Динамика и комфорт</Typography.Text>
                </Divider>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Разгон 0–100"
                            name="acceleration"
                            rules={[oneDecimalRule('Разгон 0–100')]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                precision={1}
                                style={{ width: '100%' }}
                                addonAfter="с"
                                placeholder="0,0"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Расход"
                            name="consumption"
                            rules={[oneDecimalRule('Расход')]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                precision={1}
                                style={{ width: '100%' }}
                                addonAfter="л/100 км"
                                placeholder="0,0"
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Form.Item
                            label="Кол-во мест"
                            name="numOfSeats"
                            rules={[
                                {
                                    type: 'number',
                                    min: 0,
                                    message: 'Не может быть отрицательным',
                                },
                            ]}
                        >
                            <InputNumber
                                min={0}
                                precision={0}
                                style={{ width: '100%' }}
                                placeholder="0"
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Примечание" name="note">
                    <Input.TextArea rows={2} placeholder="Доп. информация" />
                </Form.Item>

                <Form.Item label="Опубликован" name="isPublished" valuePropName="checked">
                    <Switch checkedChildren="Да" unCheckedChildren="Нет" />
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
