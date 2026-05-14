import React, { useEffect } from 'react';
import { Button, Checkbox, Form, InputNumber, Input, Modal, Space } from 'antd';

export type TrimFormValues = {
    name: string;
    order: number;
    isHidden: boolean;
};

interface Props {
    title: string;
    open: boolean;
    submitting: boolean;
    submitText: string;
    initialValues?: TrimFormValues;
    onCancel: () => void;
    onSubmit: (values: TrimFormValues) => Promise<void> | void;
}

const DEFAULT_VALUES: TrimFormValues = {
    name: '',
    order: 0,
    isHidden: false,
};

const TrimFormModal: React.FC<Props> = ({
    title,
    open,
    submitting,
    submitText,
    initialValues,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<TrimFormValues>();

    useEffect(() => {
        if (open) {
            form.setFieldsValue(initialValues ?? DEFAULT_VALUES);
        }
    }, [open, initialValues, form]);

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
            destroyOnHidden
        >
            <Form<TrimFormValues>
                form={form}
                layout="vertical"
                initialValues={initialValues ?? DEFAULT_VALUES}
                onFinish={async (values) => {
                    await onSubmit({
                        name: values.name.trim(),
                        order: Number(values.order ?? 0),
                        isHidden: Boolean(values.isHidden),
                    });
                }}
            >
                <Form.Item
                    label="Название"
                    name="name"
                    rules={[{ required: true, message: 'Введите название' }]}
                >
                    <Input placeholder="Название комплектации" />
                </Form.Item>

                <Form.Item
                    label="Порядок"
                    name="order"
                    rules={[{ required: true, message: 'Введите порядок' }]}
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
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

export default TrimFormModal;
