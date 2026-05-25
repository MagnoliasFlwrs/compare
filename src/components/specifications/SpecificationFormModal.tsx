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
import type { Specification } from '../../stores/specificationStore';
import { useSpecificationStore } from '../../stores/specificationStore';
import { useCountriesStore } from '../../stores/countriesStore';
import { useBodyTypesStore } from '../../stores/bodyTypesStore';
import {
    normalizeSpecificationFormValues,
    SPECIFICATION_FORM_DEFAULTS,
    specificationToFormValues,
    type SpecificationFormValues,
} from './specificationFormUtils';
import { WARRANTY_KIND_OPTIONS, type WarrantyKind } from './warrantyFormUtils';
import './specificationForm.css';

export type { SpecificationFormValues };

interface Props {
    open: boolean;
    editing: Specification | null;
    generationId: string | null;
    onClose: () => void;
    onSaved?: () => void;
}

const numberItem = (
    label: string,
    name: keyof SpecificationFormValues,
    suffix: string,
    span = 12,
) => (
    <Col xs={24} sm={span} key={name}>
        <Form.Item label={label} name={name} className="specification-form__item">
            <InputNumber min={0} style={{ width: '100%' }} addonAfter={suffix} />
        </Form.Item>
    </Col>
);

const WarrantyFields: React.FC = () => {
    const warrantyKind = Form.useWatch('warrantyKind') as WarrantyKind | undefined;

    return (
        <Row gutter={[12, 0]}>
            <Col xs={24} sm={warrantyKind === 'years_or_km' ? 24 : 12}>
                <Form.Item label="Гарантия" name="warrantyKind" className="specification-form__item">
                    <Select options={WARRANTY_KIND_OPTIONS} />
                </Form.Item>
            </Col>
            {warrantyKind === 'years' || warrantyKind === 'years_or_km' ? (
                <Col xs={24} sm={warrantyKind === 'years_or_km' ? 12 : 12}>
                    <Form.Item
                        label={warrantyKind === 'years_or_km' ? 'Годы' : 'Значение'}
                        name="warrantyYears"
                        className="specification-form__item"
                    >
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonAfter="год"
                            placeholder="Например: 3"
                        />
                    </Form.Item>
                </Col>
            ) : null}
            {warrantyKind === 'km' ? (
                <Col xs={24} sm={12}>
                    <Form.Item label="Значение" name="warrantyKm" className="specification-form__item">
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonAfter="тыс. км"
                            placeholder="Например: 100"
                        />
                    </Form.Item>
                </Col>
            ) : null}
            {warrantyKind === 'years_or_km' ? (
                <Col xs={24} sm={12}>
                    <Form.Item label="Тыс. км" name="warrantyKm" className="specification-form__item">
                        <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonAfter="тыс. км"
                            placeholder="Например: 100"
                        />
                    </Form.Item>
                </Col>
            ) : null}
        </Row>
    );
};

const SpecificationFormModal: React.FC<Props> = ({
    open,
    editing,
    generationId,
    onClose,
    onSaved,
}) => {
    const { message } = App.useApp();
    const createSpecification = useSpecificationStore((s) => s.createSpecification);
    const updateSpecificationById = useSpecificationStore((s) => s.updateSpecificationById);

    const [form] = Form.useForm<SpecificationFormValues>();
    const [submitting, setSubmitting] = useState(false);

    const countries = useCountriesStore((s) => s.countries);
    const countriesLoading = useCountriesStore((s) => s.loading);
    const getCountries = useCountriesStore((s) => s.getCountries);

    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const bodyTypesLoading = useBodyTypesStore((s) => s.loading);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);

    const isEdit = editing !== null;

    const title = useMemo(
        () =>
            isEdit
                ? `Редактирование: ${editing.name}`
                : 'Новый вариант кузова',
        [isEdit, editing],
    );

    const submitText = isEdit ? 'Сохранить' : 'Создать';

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }
        if (editing) {
            form.setFieldsValue(specificationToFormValues(editing));
        } else {
            form.setFieldsValue(SPECIFICATION_FORM_DEFAULTS);
        }
    }, [open, editing, form]);

    useEffect(() => {
        if (!open) return;
        if (countries.length === 0) {
            getCountries({ page: 1, limit: 500 }).catch(() => {});
        }
        if (bodyTypes.length === 0) {
            getBodyTypes({ page: 1, limit: 500 }).catch(() => {});
        }
    }, [open, getCountries, getBodyTypes]);

    const countryOptions = useMemo(
        () => countries.map((c) => ({ value: c.id, label: c.name })),
        [countries],
    );
    const bodyTypeOptions = useMemo(
        () => bodyTypes.map((b) => ({ value: b.id, label: b.name })),
        [bodyTypes],
    );

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    const onCreate = async (values: SpecificationFormValues) => {
        if (!generationId) return;
        setSubmitting(true);
        try {
            const payload = normalizeSpecificationFormValues(values);
            await createSpecification({ generationId, ...payload });
            message.success('Вариант кузова создан');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось создать вариант кузова');
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdate = async (values: SpecificationFormValues) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updateSpecificationById(editing.id, normalizeSpecificationFormValues(values));
            message.success('Вариант кузова обновлён');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось обновить вариант кузова');
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
            width={720}
        >
            <Form
                form={form}
                layout="vertical"
            
                className="specification-form--compact"
                onFinish={onSubmit}
            >
                <Form.Item
                    label="Название"
                    name="name"
                    rules={[{ required: true, message: 'Введите название' }]}
                >
                    <Input placeholder="Например: Седан 4 дв." />
                </Form.Item>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Габариты</Typography.Text>
                </Divider>
                <Row gutter={[12, 0]}>
                    {numberItem('Длина', 'length', 'см')}
                    {numberItem('Ширина', 'width', 'см')}
                    {numberItem('Высота', 'height', 'см')}
                    {numberItem('Колёсная база', 'wheelbase', 'см')}
                    {numberItem('Клиренс', 'clearance', 'см')}
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Объёмы</Typography.Text>
                </Divider>
                <Row gutter={[12, 0]}>
                    {numberItem('Бак', 'tank', 'л')}
                    {numberItem('Багажник (стандартный объём)', 'trunkStandardVolume', 'л')}
                    {numberItem('Багажник (максимальный объём)', 'trunkMaximumVolume', 'л')}
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Справочники</Typography.Text>
                </Divider>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Страна"
                            name="countryId"
                            className="specification-form__item"
                            rules={[{ required: true, message: 'Выберите страну' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Выберите страну"
                                options={countryOptions}
                                loading={countriesLoading}
                                optionFilterProp="label"
                                notFoundContent={
                                    countriesLoading ? 'Загрузка…' : 'Стран нет'
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Тип кузова"
                            name="bodyTypeId"
                            className="specification-form__item"
                            rules={[{ required: true, message: 'Выберите тип кузова' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Выберите тип кузова"
                                options={bodyTypeOptions}
                                loading={bodyTypesLoading}
                                optionFilterProp="label"
                                notFoundContent={
                                    bodyTypesLoading ? 'Загрузка…' : 'Типов кузова нет'
                                }
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <WarrantyFields />

                <Form.Item label="Опубликована" name="isPublished" valuePropName="checked">
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

export default SpecificationFormModal;
