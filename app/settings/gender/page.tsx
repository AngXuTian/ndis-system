'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Gender } from '@/db/types';
import { GenderInput } from '@/validations/gender.validation';
import { CheckCircleFilled } from '@ant-design/icons';
import { GenderForm } from '@/modules/gender/GenderForm';


type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export default function GendersPage(): React.ReactElement {
  const [genders, setGenders] = useState<Gender[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGender, setEditingGender] = useState<Gender | null>(null);

  const fetchGenders = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('/api/genders');
      const json: ApiResponse<Gender[]> = await res.json();
      if (json.data) {
        setGenders(json.data);
      }
    } catch {
      message.error('Failed to load genders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenders();
  }, []);

  const handleOpenAddModal = (): void => {
    setEditingGender(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: Gender): void => {
    setEditingGender(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`/api/genders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Gender deleted successfully');
        fetchGenders();
      } else {
        message.error('Failed to delete gender');
      }
    } catch {
      message.error('An error occurred during deletion');
    }
  };

  const handleSubmit = async (values: GenderInput): Promise<void> => {
    setSubmitting(true);
    try {
      const url = editingGender ? `/api/genders/${editingGender.id}` : '/api/genders';
      const method = editingGender ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success(editingGender ? 'Gender updated' : 'Gender added');
        setIsModalOpen(false);
        fetchGenders();
      } else {
        message.error('Operation failed');
      }
    } catch {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = genders.filter((item: Gender) => {
    const matchesSearch =
      item.label.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase());

    const isActive = item.deactivated_at === null;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Gender> = [
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Active',
      key: 'active',
      render: (_: unknown, record: Gender) =>
        record.deactivated_at === null ? (
          <CheckCircleFilled style={{ color: '#1890ff', fontSize: 16 }} />
        ) : null,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string | undefined) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '-'),
    },
    {
      title: 'Updated At',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (val: string | undefined) => (val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Gender) => (
        <Space size="small">
          <Button size="small" onClick={() => handleOpenEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this gender?"
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
      <div className="bg-white p-6 rounded-md shadow-sm mb-6">
        <h1 className="text-xl font-bold">Genders</h1>
        <p className="text-gray-500 text-sm">Manage gender dropdown values.</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex gap-3 mb-6">
          <Button onClick={fetchGenders}>Refresh</Button>
          <Button type="primary" onClick={handleOpenAddModal}>
            Add Gender
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label, Code</label>
            <Input
              placeholder="Search label or code"
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
              className="w-64"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Active</label>
            <Select<StatusFilterType>
              value={statusFilter}
              onChange={(val: StatusFilterType) => setStatusFilter(val)}
              className="w-48"
            >
              <Select.Option value="ALL">All statuses</Select.Option>
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="INACTIVE">Inactive</Select.Option>
            </Select>
          </div>
        </div>

        <Table<Gender>
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (total: number) => `Total: ${total}` }}
        />
      </div>

      <GenderForm
        open={isModalOpen}
        editingGender={editingGender}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}