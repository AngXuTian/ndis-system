'use client';

import React, { useEffect } from 'react';
import { Drawer, Form, Input, Select, DatePicker, Switch, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { Selectable } from 'kysely';
import { Client } from '@/db/types';
import { ClientInput } from '@/validations/client.validation';

interface GenderOption {
  id: number;
  label: string;
}

interface ClientFormProps {
  open: boolean;
  editingClient: Selectable<Client> | null;
  genders: GenderOption[];
  onCancel: () => void;
  onSubmit: (values: ClientInput) => Promise<void>;
  loading?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  editingClient,
  genders,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<any>();

  useEffect(() => {
    if (open) {
      if (editingClient) {
        form.setFieldsValue({
          first_name: editingClient.first_name ?? '',
          last_name: editingClient.last_name ?? '',
          gender_id: editingClient.gender_id,
          dob: editingClient.dob ? dayjs(editingClient.dob) : null,
          ndis_number: editingClient.ndis_number ?? '',
          email: editingClient.email ?? '',
          phone_number: editingClient.phone_number ?? '',
          address: editingClient.address ?? '',
          unit_building: editingClient.unit_building ?? '',
          pricing_region: editingClient.pricing_region ?? 'VIC',
          is_active: editingClient.deactivated_at === null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          first_name: '',
          last_name: '',
          ndis_number: '',
          email: '',
          phone_number: '',
          address: '',
          unit_building: '',
          pricing_region: 'VIC',
          is_active: true,
        });
      }
    }
  }, [open, editingClient, form]);

  const handleFinish = (values: any): void => {
    const formattedValues: ClientInput = {
      ...values,
      dob: values.dob ? dayjs(values.dob).format('YYYY-MM-DD') : '',
    };
    onSubmit(formattedValues);
  };

  return (
    <Drawer
      title={editingClient ? 'Edit Participant' : 'Add Participant'}
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
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="first_name"
          label="First Name"
          rules={[{ required: true, message: 'First name is required' }]}
        >
          <Input placeholder="John" />
        </Form.Item>

        <Form.Item
          name="last_name"
          label="Last Name"
          rules={[{ required: true, message: 'Last name is required' }]}
        >
          <Input placeholder="Doe" />
        </Form.Item>

        <Form.Item
          name="gender_id"
          label="Gender"
          rules={[{ required: true, message: 'Gender is required' }]}
        >
          <Select placeholder="Select gender">
            {genders.map((g) => (
              <Select.Option key={g.id} value={g.id}>
                {g.label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dob"
          label="Date of Birth"
          rules={[{ required: true, message: 'Date of birth is required' }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="ndis_number"
          label="NDIS Number"
          rules={[
            { required: true, message: 'NDIS number is required' },
            { pattern: /^\d{1,16}$/, message: 'NDIS number must be digits only, max 16 digits' },
          ]}
        >
          <Input placeholder="e.g. 4300123456" maxLength={16} />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email is required' },
            { type: 'email', message: 'Invalid email address' },
          ]}
        >
          <Input placeholder="john.doe@example.com" />
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
          <Input placeholder="0400000000" />
        </Form.Item>

        <Form.Item
          name="address"
          label="Address"
          rules={[{ required: true, message: 'Address is required' }]}
        >
          <Input placeholder="123 Main Street" />
        </Form.Item>

        <Form.Item name="unit_building" label="Unit / Building">
          <Input placeholder="Apt 4B" />
        </Form.Item>

        <Form.Item
          name="pricing_region"
          label="Pricing Region"
          rules={[{ required: true, message: 'Pricing region is required' }]}
        >
          <Select placeholder="Select pricing region">
            <Select.Option value="ACT">ACT</Select.Option>
            <Select.Option value="NSW">NSW</Select.Option>
            <Select.Option value="NT">NT</Select.Option>
            <Select.Option value="QLD">QLD</Select.Option>
            <Select.Option value="SA">SA</Select.Option>
            <Select.Option value="TAS">TAS</Select.Option>
            <Select.Option value="VIC">VIC</Select.Option>
            <Select.Option value="WA">WA</Select.Option>
            <Select.Option value="REMOTE">Remote</Select.Option>
            <Select.Option value="VERY REMOTE">Very Remote</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="is_active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};