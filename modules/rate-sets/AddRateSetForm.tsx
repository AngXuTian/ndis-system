'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, DatePicker, Switch, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs, { Dayjs } from 'dayjs';

interface AddRateSetFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  description?: string;
  start_date: Dayjs;
  end_date?: Dayjs;
  active: boolean;
}

export const AddRateSetForm: React.FC<AddRateSetFormProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        start_date: dayjs(),
        active: true,
      });
      setFileList([]);
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('start_date', values.start_date ? dayjs(values.start_date).format('YYYY-MM-DD') : '');
      formData.append('end_date', values.end_date ? dayjs(values.end_date).format('YYYY-MM-DD') : '');
      formData.append('active', String(values.active ?? true));

      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('file', fileList[0].originFileObj);
      }

      const res = await fetch('/api/rate-sets', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (res.ok) {
        message.success('Rate set created successfully');
        onSuccess();
      } else {
        message.error(json.error?.message || 'Failed to create rate set');
      }
    } catch {
      message.error('Please complete all required fields');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Add Rate Set"
      placement="right"
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        wrapper: { width: 440 },
        body: { padding: '24px' },
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleSubmit} loading={submitting}>
            Save
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={<span className="text-red-500">* Name</span>}
          rules={[{ required: true, message: 'Name is required' }]}
        >
          <Input placeholder="e.g., November 2025" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea
            rows={3}
            placeholder="e.g., NDIS Pricing Arrangements and Price Limits effective from 24 November 2025"
          />
        </Form.Item>

        <Form.Item
          name="start_date"
          label={<span className="text-red-500">* Start Date</span>}
          rules={[{ required: true, message: 'Start date is required' }]}
        >
          <DatePicker className="w-full" placeholder="Select date" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="end_date" label="End Date">
          <DatePicker className="w-full" placeholder="Select date" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item name="active" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload NDIS Pricing Arrangements and Price Limits Excel
          </label>
          <Upload
            accept=".xlsx, .xls"
            maxCount={1}
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([{ uid: '-1', name: file.name, status: 'done', originFileObj: file }]);
              return false;
            }}
            onRemove={() => setFileList([])}
          >
            <Button icon={<UploadOutlined />}>Select File</Button>
          </Upload>
        </div>
      </Form>
    </Drawer>
  );
};