'use client';

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Switch, Button, Space } from 'antd';
import { Selectable } from 'kysely';
import { Provider } from '@/db/types';
import { ProviderInput } from '@/validations/provider.validation';

interface ProviderFormProps {
  open: boolean;
  editingProvider: Selectable<Provider> | null;
  onCancel: () => void;
  onSubmit: (values: ProviderInput) => Promise<void>;
  loading?: boolean;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({
  open,
  editingProvider,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<ProviderInput>();

  useEffect(() => {
    if (open) {
      if (editingProvider) {
        form.setFieldsValue({
          abn: editingProvider.abn,
          name: editingProvider.name,
          email: editingProvider.email ?? '',
          phone_number: editingProvider.phone_number ?? '',
          address: editingProvider.address ?? '',
          unit_building: editingProvider.unit_building ?? '',
          is_active: editingProvider.deactivated_at === null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          abn: '',
          name: '',
          email: '',
          phone_number: '',
          address: '',
          unit_building: '',
          is_active: true,
        });
      }
    }
  }, [open, editingProvider, form]);

  return (
    <Drawer
      title={editingProvider ? 'Edit Provider' : 'Add Provider'}
      placement="right"
      styles={{ wrapper: { width: 520 } }}
      onClose={onCancel}
      open={open}
      destroyOnClose
      extra={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={loading}>
            Save
          </Button>
        </Space>
      }
    >
      <Form<ProviderInput>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="abn"
          label="ABN"
          rules={[
            { required: true, message: 'ABN is required' },
            { pattern: /^\d{1,11}$/, message: 'ABN must be digits only and max 11 digits' },
          ]}
        >
          <Input placeholder="e.g. 73628557755" maxLength={11} />
        </Form.Item>

        <Form.Item
          name="name"
          label="Provider Name"
          rules={[{ required: true, message: 'Provider name is required' }]}
        >
          <Input placeholder="e.g. Serenity Life Balance Advisory Pty Ltd" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email' },
          ]}
        >
          <Input placeholder="contact@provider.com" />
        </Form.Item>

        <Form.Item
          name="phone_number"
          label="Phone Number"
          rules={[
            {
              validator: (_, value) => {
                if (!value || /^\d{3,16}$/.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Phone number must contain 3 to 16 digits'));
              },
            },
          ]}
        >
          <Input placeholder="0390000000" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Address is required' }]}
        >
          <Input placeholder="123 Business Rd" />
        </Form.Item>

        <Form.Item name="unit_building" label="Unit / Building">
          <Input placeholder="Suite 101" />
        </Form.Item>

        <Form.Item name="is_active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};