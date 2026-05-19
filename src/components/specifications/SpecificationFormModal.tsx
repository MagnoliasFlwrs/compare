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
import { useCountriesStore } from '../../stores/countriesStore';
import { useBodyTypesStore } from '../../stores/bodyTypesStore';

export type SpecificationFormValues = {
    name: string;
    isHidden: boolean;
    length: number;
    width: number;
    height: number;
    wheelbase: number;
    clearance: number;
    tank: number;
    trunkStandardVolume: number;
    trunkMaximumVolume: number;
    countryId: string;
    bodyTypeId: string;
    warranty: string;
};

interface Props {
    title: string;
    open: boolean;
    submitting: boolean;
    submitText: string;
    seedKey?: string;
    initialValues?: SpecificationFormValues;
    onCancel: () => void;
    onSubmit: (values: SpecificationFormValues) => Promise<void> | void;
}

const DEFAULT_VALUES: SpecificationFormValues = {
    name: '',
    isHidden: false,
    length: 0,
    width: 0,
    height: 0,
    wheelbase: 0,
    clearance: 0,
    tank: 0,
    trunkStandardVolume: 0,
    trunkMaximumVolume: 0,
    countryId: '',
    bodyTypeId: '',
    warranty: '',
};

const numberItem = (label: string, name: keyof SpecificationFormValues, span = 12) => (
    <Col xs={24} sm={span} key={name}>
        <Form.Item label={label} name={name}>
            <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
    </Col>
);

const SpecificationFormModal: React.FC<Props> = ({
    title,
    open,
    submitting,
    submitText,
    seedKey = 'add',
    initialValues,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<SpecificationFormValues>();
    const prevOpenRef = useRef(false);
    const lastSeedKeyRef = useRef<string | null>(null);

    const countries = useCountriesStore((s) => s.countries);
    const countriesLoading = useCountriesStore((s) => s.loading);
    const getCountries = useCountriesStore((s) => s.getCountries);

    const bodyTypes = useBodyTypesStore((s) => s.bodyTypes);
    const bodyTypesLoading = useBodyTypesStore((s) => s.loading);
    const getBodyTypes = useBodyTypesStore((s) => s.getBodyTypes);

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
            form.setFieldsValue(initialValues ?? DEFAULT_VALUES);
        }
    }, [open, seedKey, initialValues, form]);

    // Справочники грузим только при открытии модалки.
    // loading не кладём в deps: после ошибки length остаётся 0, loading снова false —
    // и эффект уходит в бесконечный цикл повторных запросов.
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
        onCancel();
    };

    return (
        <Modal
            title={title}
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnClose={false}
            width={720}
        >
            <Form<SpecificationFormValues>
                form={form}
                layout="vertical"
                preserve
                onFinish={async (values) => {
                    await onSubmit({
                        name: values.name.trim(),
                        isHidden: Boolean(values.isHidden),
                        length: Number(values.length ?? 0),
                        width: Number(values.width ?? 0),
                        height: Number(values.height ?? 0),
                        wheelbase: Number(values.wheelbase ?? 0),
                        clearance: Number(values.clearance ?? 0),
                        tank: Number(values.tank ?? 0),
                        trunkStandardVolume: Number(values.trunkStandardVolume ?? 0),
                        trunkMaximumVolume: Number(values.trunkMaximumVolume ?? 0),
                        countryId: (values.countryId ?? '').trim(),
                        bodyTypeId: (values.bodyTypeId ?? '').trim(),
                        warranty: (values.warranty ?? '').trim(),
                    });
                }}
            >
                <Form.Item
                    label="Название"
                    name="name"
                    rules={[{ required: true, message: 'Введите название' }]}
                >
                    <Input placeholder="Например: 1.6 MT базовая" />
                </Form.Item>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Габариты, мм</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    {numberItem('Длина', 'length')}
                    {numberItem('Ширина', 'width')}
                    {numberItem('Высота', 'height')}
                    {numberItem('Колёсная база', 'wheelbase')}
                    {numberItem('Дорожный просвет', 'clearance')}
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Объёмы, л</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    {numberItem('Бак', 'tank')}
                    {numberItem('Багажник (стандарт)', 'trunkStandardVolume')}
                    {numberItem('Багажник (макс.)', 'trunkMaximumVolume')}
                </Row>

                <Divider orientation="left" plain>
                    <Typography.Text type="secondary">Справочники и прочее</Typography.Text>
                </Divider>
                <Row gutter={12}>
                    <Col xs={24} sm={12}>
                        <Form.Item
                            label="Страна"
                            name="countryId"
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

                <Form.Item label="Гарантия" name="warranty">
                    <Input placeholder="Например: 3 года / 100 000 км" />
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

export default SpecificationFormModal;
