import React from 'react';
import { Button, Form, Input, Modal, Space } from 'antd';
import type { CloneGenerationFormValues } from '../../types/generation';

interface Props {
    open: boolean;
    submitting: boolean;
    onCancel: () => void;
    onSubmit: (values: CloneGenerationFormValues) => Promise<void> | void;
}

const GenerationCloneModal: React.FC<Props> = ({ open, submitting, onCancel, onSubmit }) => {
    const [form] = Form.useForm<CloneGenerationFormValues>();

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="Клонировать поколение"
            open={open}
            onCancel={handleCancel}
            footer={null}
            destroyOnHidden
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                initialValues={{ mode: 'ALL' }}
            >
                <Form.Item
                    label="Исходное поколение (ID)"
                    name="fromGenerationId"
                    rules={[{ required: true, message: 'Укажите ID' }]}
                >
                    <Input placeholder="UUID" />
                </Form.Item>
                <Form.Item
                    label="Целевое поколение (ID)"
                    name="toGenerationId"
                    rules={[{ required: true, message: 'Укажите ID' }]}
                >
                    <Input placeholder="UUID" />
                </Form.Item>
                <Form.Item
                    label="Режим"
                    name="mode"
                    rules={[{ required: true, message: 'Укажите режим' }]}
                >
                    <Input placeholder="ALL" />
                </Form.Item>
                <Form.Item
                    label="Сущность (ID)"
                    name="entityId"
                    rules={[{ required: true, message: 'Укажите ID' }]}
                >
                    <Input placeholder="UUID" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0 }}>
                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCancel}>Отмена</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Клонировать
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default GenerationCloneModal;
