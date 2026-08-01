'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, DatePicker, Switch, Button, Space, Upload, Select, Slider, Table, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UploadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import dayjs, { Dayjs } from 'dayjs';
import {
  RateSetItemRecord,
  RateSetCategoryOption,
  RateSetSupportItemOption,
  RateSetTypeOption,
  RateSetRecord,
  RateSetItemsApiResponse,
} from '@/types/rate-set';

interface EditRateSetFormProps {
  open: boolean;
  rateSetId: number | null;
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

export const EditRateSetForm: React.FC<EditRateSetFormProps> = ({
  open,
  rateSetId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);

  const [items, setItems] = useState<RateSetItemRecord[]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [categories, setCategories] = useState<RateSetCategoryOption[]>([]);
  const [supportItemsList, setSupportItemsList] = useState<RateSetSupportItemOption[]>([]);
  const [types, setTypes] = useState<RateSetTypeOption[]>([]);

  const [filterCategory, setFilterCategory] = useState<number | 'ALL'>('ALL');
  const [filterSupportItem, setFilterSupportItem] = useState<number | 'ALL'>('ALL');
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | 'ALL'>('ALL');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  useEffect(() => {
    async function loadRateSetData() {
      if (!rateSetId || !open) return;
      setLoadingItems(true);
      try {
        const [rsRes, itemsRes] = await Promise.all([
          fetch(`/api/rate-sets/${rateSetId}`),
          fetch(`/api/rate-sets/${rateSetId}/items`),
        ]);

        const rsJson: { data?: RateSetRecord } = await rsRes.json();
        const itemsJson: { data?: RateSetItemsApiResponse } = await itemsRes.json();

        if (rsJson.data) {
          const rec = rsJson.data;
          form.setFieldsValue({
            name: rec.name,
            description: rec.description || '',
            start_date: rec.start_date ? dayjs(rec.start_date) : dayjs(),
            end_date: rec.end_date ? dayjs(rec.end_date) : undefined,
            active: !rec.deactivated_at,
          });
        }

        if (itemsJson.data) {
          setItems(itemsJson.data.items || []);
          setCategories(itemsJson.data.categories || []);
          setSupportItemsList(itemsJson.data.supportItems || []);
          setTypes(itemsJson.data.types || []);
        }
      } catch {
        message.error('Failed to load rate set details');
      } finally {
        setLoadingItems(false);
      }
    }

    loadRateSetData();
  }, [open, rateSetId, form]);

  const handleSaveHeader = async () => {
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

      const res = await fetch(`/api/rate-sets/${rateSetId}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        message.success('Rate set updated successfully');
        onSuccess();
      } else {
        message.error('Failed to update rate set');
      }
    } catch {
      message.error('Please fix form validation errors');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCat = filterCategory === 'ALL' || item.category_id === filterCategory;
    const matchesItem = filterSupportItem === 'ALL' || item.id === filterSupportItem;
    const matchesType = filterType === 'ALL' || item.type_code === filterType;

    const matchesStart =
      !filterStartDate || (item.start_date && dayjs(item.start_date).format('YYYY-MM-DD') === filterStartDate);
    const matchesEnd =
      !filterEndDate || (item.end_date && dayjs(item.end_date).format('YYYY-MM-DD') === filterEndDate);

    const maxUnitPrice = Math.max(
      item.act || 0,
      item.nsw || 0,
      item.nt || 0,
      item.qld || 0,
      item.sa || 0,
      item.tas || 0,
      item.vic || 0,
      item.wa || 0,
      item.remote || 0,
      item.very_remote || 0
    );

    const matchesPrice = maxUnitPrice >= priceRange[0] && maxUnitPrice <= priceRange[1];

    return matchesCat && matchesItem && matchesType && matchesStart && matchesEnd && matchesPrice;
  });

  const renderBoolIcon = (val: boolean) =>
    val ? (
      <CheckCircleOutlined className="text-blue-500 text-base" />
    ) : (
      <CloseCircleOutlined className="text-blue-400 text-base" />
    );

  const renderPrice = (val: number | null) => (val !== null && val !== undefined ? val.toFixed(2) : '-');

  const columns: ColumnsType<RateSetItemRecord> = [
    { title: 'Support Item Number', dataIndex: 'item_number', key: 'item_number', width: 160 },
    { title: 'Support Item Name', dataIndex: 'item_name', key: 'item_name', width: 280 },
    { title: 'Support Category Number', dataIndex: 'category_number', key: 'category_number', width: 180 },
    { title: 'Support Category Name', dataIndex: 'category_name', key: 'category_name', width: 220 },
    { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80, align: 'center' },
    {
      title: 'Quote',
      dataIndex: 'is_quote_required',
      key: 'is_quote_required',
      width: 80,
      align: 'center',
      render: renderBoolIcon,
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 110,
      render: (val: string | null) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (val: string | null) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    { title: 'ACT', dataIndex: 'act', key: 'act', width: 90, render: renderPrice },
    { title: 'NSW', dataIndex: 'nsw', key: 'nsw', width: 90, render: renderPrice },
    { title: 'NT', dataIndex: 'nt', key: 'nt', width: 90, render: renderPrice },
    { title: 'QLD', dataIndex: 'qld', key: 'qld', width: 90, render: renderPrice },
    { title: 'SA', dataIndex: 'sa', key: 'sa', width: 90, render: renderPrice },
    { title: 'TAS', dataIndex: 'tas', key: 'tas', width: 90, render: renderPrice },
    { title: 'VIC', dataIndex: 'vic', key: 'vic', width: 90, render: renderPrice },
    { title: 'WA', dataIndex: 'wa', key: 'wa', width: 90, render: renderPrice },
    { title: 'Remote', dataIndex: 'remote', key: 'remote', width: 90, render: renderPrice },
    { title: 'Very Remote', dataIndex: 'very_remote', key: 'very_remote', width: 100, render: renderPrice },
    {
      title: 'Non-Face-to-Face Support Provision',
      dataIndex: 'is_nf2f_support_provision',
      key: 'is_nf2f_support_provision',
      width: 220,
      align: 'center',
      render: renderBoolIcon,
    },
    {
      title: 'Provider Travel',
      dataIndex: 'is_provider_travel',
      key: 'is_provider_travel',
      width: 130,
      align: 'center',
      render: renderBoolIcon,
    },
    {
      title: 'Short Notice Cancellations.',
      dataIndex: 'is_short_notice_cancel',
      key: 'is_short_notice_cancel',
      width: 180,
      align: 'center',
      render: renderBoolIcon,
    },
    {
      title: 'NDIA Requested Reports',
      dataIndex: 'is_ndia_requested_reports',
      key: 'is_ndia_requested_reports',
      width: 170,
      align: 'center',
      render: renderBoolIcon,
    },
    {
      title: 'Irregular SIL Supports',
      dataIndex: 'is_irregular_sil_supports',
      key: 'is_irregular_sil_supports',
      width: 160,
      align: 'center',
      render: renderBoolIcon,
    },
    { title: 'Type', dataIndex: 'type_label', key: 'type_label', width: 180 },
  ];

  return (
    <Drawer
      title="Edit Rate Set"
      placement="right"
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        wrapper: { width: '100%' },
        body: { padding: '24px 32px', backgroundColor: '#f9fafb' },
      }}
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSaveHeader} loading={submitting}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <Form.Item name="name" label={<span className="text-red-500">* Name</span>}>
            <Input placeholder="e.g., July 2025" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input placeholder="e.g., NDIS Pricing Arrangements..." allowClear />
          </Form.Item>

          <Form.Item name="start_date" label={<span className="text-red-500">* Start Date</span>}>
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="end_date" label="End Date">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-gray-500 mb-1">
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

        <div className="bg-white p-4 rounded-md shadow-sm mb-6">
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Support Category</label>
              <Select value={filterCategory} onChange={setFilterCategory} className="w-full">
                <Select.Option value="ALL">All Support Categories</Select.Option>
                {categories.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.category_name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Support Item</label>
              <Select value={filterSupportItem} onChange={setFilterSupportItem} className="w-full">
                <Select.Option value="ALL">All Support Items</Select.Option>
                {supportItemsList.map((si) => (
                  <Select.Option key={si.id} value={si.id}>
                    {si.item_name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <DatePicker
                placeholder="Select date"
                onChange={(d) => setFilterStartDate(d ? dayjs(d).format('YYYY-MM-DD') : null)}
                className="w-full"
                format="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <DatePicker
                placeholder="Select date"
                onChange={(d) => setFilterEndDate(d ? dayjs(d).format('YYYY-MM-DD') : null)}
                className="w-full"
                format="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <Select value={filterType} onChange={setFilterType} className="w-full">
                <Select.Option value="ALL">All Types</Select.Option>
                {types.map((t) => (
                  <Select.Option key={t.code} value={t.code}>
                    {t.label}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
            <div className="flex items-center gap-4">
              <Input
                value={priceRange[0].toFixed(2)}
                className="w-32"
                onChange={(e) => setPriceRange([parseFloat(e.target.value) || 0, priceRange[1]])}
              />
              <Slider
                range
                min={0}
                max={10000}
                step={1}
                value={priceRange}
                onChange={(val) => setPriceRange(val as [number, number])}
                className="flex-1"
              />
              <Input
                value={priceRange[1].toFixed(2)}
                className="w-32"
                onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value) || 0])}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-md shadow-sm">
          <Table
            dataSource={filteredItems}
            columns={columns}
            rowKey="id"
            loading={loadingItems}
            scroll={{ x: 'max-content', y: 500 }}
            pagination={{ pageSize: 20, showTotal: (total) => `Total: ${total}` }}
          />
        </div>
      </Form>
    </Drawer>
  );
};