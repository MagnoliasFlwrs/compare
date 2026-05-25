import React from 'react';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Space, Typography } from 'antd';

const AttributeOptionsFormList: React.FC = () => (
    <>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            Значения для выбора (поле «Преимущество» — порядок сравнения: 0, 1, 2…)
        </Typography.Text>
        <Form.List name="options">
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...rest }) => (
                        <Space
                            key={key}
                            align="baseline"
                            style={{ display: 'flex', marginBottom: 8 }}
                        >
                            <Form.Item name={[name, 'id']} hidden>
                                <Input />
                            </Form.Item>
                            <Form.Item
                                {...rest}
                                name={[name, 'value']}
                                rules={[{ required: true, message: 'Введите значение' }]}
                                style={{ flex: 1, marginBottom: 0 }}
                            >
                                <Input placeholder="Значение" />
                            </Form.Item>
                            <Form.Item
                                {...rest}
                                name={[name, 'order']}
                                rules={[{ required: true, message: 'Укажите порядок' }]}
                                style={{ width: 100, marginBottom: 0 }}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    placeholder="Прем."
                                />
                            </Form.Item>
                            {fields.length > 1 ? (
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            ) : null}
                        </Space>
                    ))}
                    <Form.Item>
                        <Button
                            type="dashed"
                            onClick={() => add({ value: '', order: fields.length })}
                            block
                            icon={<PlusOutlined />}
                        >
                            Добавить значение
                        </Button>
                    </Form.Item>
                </>
            )}
        </Form.List>
    </>
);

export default AttributeOptionsFormList;
