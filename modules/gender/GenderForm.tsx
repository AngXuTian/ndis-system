'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Switch, Button, Space } from 'antd';
import { Selectable } from 'kysely';
import { Gender } from '@/db/types';
import { GenderInput } from '@/validations/gender.validation';

interface GenderFormProps {
  open: boolean;
  editingGender: Selectable<Gender> | null;
  onCancel: () => void;
  onSubmit: (values: GenderInput) => Promise<void>;
  loading?: boolean;
}

export const GenderForm: React.FC<GenderFormProps> = ({
  open,
  editingGender,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm<GenderInput>();

  useEffect(() => {
    if (open) {
      if (editingGender) {
        form.setFieldsValue({
          label: editingGender.label,
          code: editingGender.code,
          is_active: editingGender.deactivated_at === null,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [open, editingGender, form]);

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const labelVal = e.target.value;
      const autoCode = labelVal
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '');

      form.setFieldsValue({ code: autoCode });
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const upperCode = e.target.value.toUpperCase();
    form.setFieldsValue({ code: upperCode });
  };

  const handleOk = () => {
    form.submit();
  };

  return (
    <Drawer
      title={editingGender ? 'Edit Gender' : 'Add Gender'}
      placement="right"
      styles={{ wrapper: { width: 420 } }} // <-- Updated to pass width cleanly via styles.wrapper
      onClose={onCancel}
      open={open}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleOk} loading={loading}>
            Save
          </Button>
        </Space>
      }
    >
      <Form<GenderInput>
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="label"
          label="Label"
          rules={[{ required: true, message: 'Label is required' }]}
        >
          <Input 
            placeholder="e.g. Female" 
            onChange={handleLabelChange} 
          />
        </Form.Item>

        <Form.Item
          name="code"
          label="Code"
          rules={[{ required: true, message: 'Code is required' }]}
        >
          <Input 
            placeholder="e.g. FEMALE" 
            onChange={handleCodeChange} 
          />
        </Form.Item>

        <Form.Item
          name="is_active"
          label="Active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};