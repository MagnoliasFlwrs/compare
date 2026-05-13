import React, { useEffect } from 'react';
import { Button, Form, Input, InputNumber, Modal, Space } from 'antd';
import type { GenerationFormValues } from '../../types/generation';

interface Props {
    title: string;
    open: boolean;
    initialValues?: GenerationFormValues;
    submitting: boolean;
    submitText: string;
    onCancel: () => void;
    onSubmit: (values: GenerationFormValues) => Promise<void> | void;
}

const DEFAULT_VALUES: GenerationFormValues = {
    number: 0,
    restyling: '',
    yearFrom: 0,
    yearTo: 0,
};

const GenerationFormModal: React.FC<Props> = ({
    title,
    open,
    initialValues,
    submitting,
    submitText,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<GenerationFormValues>();

    useEffect(() => {
        if (open) {
            form.setFieldsValue(initialValues ?? DEFAULT_VALUES);
        } else {
            form.resetFields();
        }
    }, [open, initialValues, form]);

    return (
        <Modal title={title} open={open} onCancel={onCancel} footer={null} destroyOnHidden>
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={initialValues ?? DEFAULT_VALUES}
            >
                <Form.Item
                    label="Номер"
                    name="number"
                    rules={[{ required: true, message: 'Укажите номер' }]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item label="Рестайлинг" name="restyling">
                    <Input placeholder="Рестайлинг" />
                </Form.Item>
                <Form.Item
                    label="Год с"
                    name="yearFrom"
                    rules={[{ required: true, message: 'Укажите год' }]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item
                    label="Год по"
                    name="yearTo"
                    rules={[{ required: true, message: 'Укажите год' }]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Отмена</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            {submitText}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default GenerationFormModal;
