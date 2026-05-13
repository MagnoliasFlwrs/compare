import React, { useEffect } from 'react';
import { Button, Form, InputNumber, Modal, Space } from 'antd';
import type { GenerationImage, GenerationImageFormValues } from '../../types/generation';

interface Props {
    image: GenerationImage | null;
    submitting: boolean;
    onCancel: () => void;
    onSubmit: (values: GenerationImageFormValues) => Promise<void> | void;
}

const GenerationImageEditModal: React.FC<Props> = ({
    image,
    submitting,
    onCancel,
    onSubmit,
}) => {
    const [form] = Form.useForm<GenerationImageFormValues>();

    useEffect(() => {
        if (image) {
            form.setFieldsValue({ order: image.order });
        } else {
            form.resetFields();
        }
    }, [image, form]);

    return (
        <Modal
            title={image ? `Изображение #${image.order}` : 'Изображение'}
            open={!!image}
            onCancel={onCancel}
            footer={null}
            destroyOnHidden
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item
                    label="Порядок"
                    name="order"
                    rules={[{ required: true, message: 'Укажите порядок' }]}
                >
                    <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={onCancel}>Отмена</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Сохранить
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default GenerationImageEditModal;
