import React, { useEffect, useMemo, useState } from 'react';
import { App, Button, Form, Input, InputNumber, Modal, Space, Switch } from 'antd';
import type { Trim } from '../../stores/trimsStore';
import { useTrimsStore } from '../../stores/trimsStore';
import {
    normalizeTrimFormValues,
    TRIM_FORM_DEFAULTS,
    trimToFormValues,
    type TrimFormValues,
} from './trimFormUtils';

export type { TrimFormValues };

interface Props {
    open: boolean;
    /** При open: null — создание, объект — редактирование. */
    editing: Trim | null;
    generationId: string | null;
    defaultOrder?: number;
    onClose: () => void;
    onSaved?: () => void;
}

const TrimFormModal: React.FC<Props> = ({
    open,
    editing,
    generationId,
    defaultOrder = 0,
    onClose,
    onSaved,
}) => {
    const { message } = App.useApp();
    const createTrim = useTrimsStore((s) => s.createTrim);
    const updateTrimById = useTrimsStore((s) => s.updateTrimById);

    const [form] = Form.useForm<TrimFormValues>();
    const [submitting, setSubmitting] = useState(false);

    const isEdit = editing !== null;

    const title = useMemo(
        () =>
            isEdit
                ? `Редактирование: ${editing.name}`
                : 'Новая комплектация',
        [isEdit, editing],
    );

    const submitText = isEdit ? 'Сохранить' : 'Создать';

    useEffect(() => {
        if (!open) {
            form.resetFields();
            return;
        }
        if (editing) {
            form.setFieldsValue(trimToFormValues(editing));
        } else {
            form.setFieldsValue(TRIM_FORM_DEFAULTS(defaultOrder));
        }
    }, [open, editing, defaultOrder, form]);

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    const onCreate = async (values: TrimFormValues) => {
        if (!generationId) return;
        setSubmitting(true);
        try {
            const payload = normalizeTrimFormValues(values);
            await createTrim({ generationId, ...payload });
            message.success('Комплектация создана');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось создать комплектацию');
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdate = async (values: TrimFormValues) => {
        if (!editing) return;
        setSubmitting(true);
        try {
            await updateTrimById(editing.id, normalizeTrimFormValues(values));
            message.success('Комплектация обновлена');
            handleCancel();
            onSaved?.();
        } catch {
            message.error('Не удалось обновить комплектацию');
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
        >
            <Form form={form} layout="vertical" onFinish={onSubmit}>
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

export default TrimFormModal;
