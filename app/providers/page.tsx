'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, message, Popconfirm, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Selectable } from 'kysely';
import { Provider } from '@/db/types';
import { ProviderInput } from '@/validations/provider.validation';
import { ProviderForm } from '@/modules/provider/ProviderForm';

type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export default function ProvidersPage(): React.ReactElement {
  const [providers, setProviders] = useState<Selectable<Provider>[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingProvider, setEditingProvider] = useState<Selectable<Provider> | null>(null);

  const fetchProviders = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('/api/providers');
      const json: ApiResponse<Selectable<Provider>[]> = await res.json();
      if (json.data) setProviders(json.data);
    } catch {
      message.error('Failed to load providers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleOpenAdd = (): void => {
    setEditingProvider(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (record: Selectable<Provider>): void => {
    setEditingProvider(record);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Provider deleted successfully');
        fetchProviders();
      } else {
        message.error('Failed to delete provider');
      }
    } catch {
      message.error('An error occurred during deletion');
    }
  };

  const handleSubmit = async (values: ProviderInput): Promise<void> => {
    setSubmitting(true);
    try {
      const url = editingProvider ? `/api/providers/${editingProvider.id}` : '/api/providers';
      const method = editingProvider ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json: ApiResponse<Selectable<Provider>> = await res.json();

      if (res.ok) {
        message.success(editingProvider ? 'Provider updated' : 'Provider created');
        setIsDrawerOpen(false);
        fetchProviders();
      } else {
        message.error(json.error?.message || 'Operation failed');
      }
    } catch {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter search by ABN, Name, Email and Status
  const filteredData = providers.filter((item) => {
    const query = searchText.toLowerCase().trim();
    const matchesSearch =
      (item.abn?.toLowerCase() ?? '').includes(query) ||
      (item.name?.toLowerCase() ?? '').includes(query) ||
      (item.email?.toLowerCase() ?? '').includes(query);

    const isActive = item.deactivated_at === null;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Selectable<Provider>> = [
    {
      title: 'ABN',
      dataIndex: 'abn',
      key: 'abn',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (val: string | null) => val ?? '-',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (val: string | null) => val ?? '-',
    },
    {
      title: 'Unit/Building',
      dataIndex: 'unit_building',
      key: 'unit_building',
      render: (val: string | null) => val ?? '-',
    },
    {
      title: 'Active',
      key: 'active',
      render: (_, record) =>
        record.deactivated_at === null ? (
          <CheckCircleFilled style={{ color: '#1890ff', fontSize: 16 }} />
        ) : (
          <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => handleOpenEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this provider?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-md shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Providers</h1>
          <p className="text-gray-500 text-sm">Manage NDIS service providers and ABN details.</p>
        </div>
        <Space>
          <Tooltip title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchProviders}
              loading={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Button type="primary" onClick={handleOpenAdd}>
            Add Provider
          </Button>
        </Space>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <Input
              placeholder="Search ABN, Name, Email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
              allowClear
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Active</label>
            <Select<StatusFilterType>
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-48"
            >
              <Select.Option value="ALL">All statuses</Select.Option>
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="INACTIVE">Inactive</Select.Option>
            </Select>
          </div>
        </div>

        <Table<Selectable<Provider>>
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showTotal: (total) => `Total: ${total}` }}
        />
      </div>

      <ProviderForm
        open={isDrawerOpen}
        editingProvider={editingProvider}
        onCancel={() => setIsDrawerOpen(false)}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}