'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, message, Popconfirm } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { AddRateSetForm } from '@/modules/rate-sets/AddRateSetForm';
import { EditRateSetForm } from '@/modules/rate-sets/EditRateSetForm';
import { RateSetRecord } from '@/types/rate-set';

export default function RateSetsPage(): React.ReactElement {
  const [rateSets, setRateSets] = useState<RateSetRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchText, setSearchText] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchRateSets = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await fetch('/api/rate-sets');
      const json = await res.json();
      if (json.data) setRateSets(json.data);
    } catch {
      message.error('Failed to load rate sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateSets();
  }, []);

  const handleOpenEdit = (id: number) => {
    setEditingId(id);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`/api/rate-sets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Rate set deleted successfully');
        fetchRateSets();
      } else {
        message.error('Failed to delete rate set');
      }
    } catch {
      message.error('An error occurred during deletion');
    }
  };

  const filteredData = rateSets.filter((item) => {
    const query = searchText.toLowerCase().trim();
    const matchesSearch =
      (item.name?.toLowerCase() ?? '').includes(query) ||
      (item.description?.toLowerCase() ?? '').includes(query);

    const isActive = !item.deactivated_at;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    let matchesDate = true;
    if (dateRange[0]) {
      matchesDate = matchesDate && dayjs(item.start_date).isAfter(dayjs(dateRange[0]).subtract(1, 'day'));
    }
    if (dateRange[1]) {
      matchesDate = matchesDate && item.end_date !== null && dayjs(item.end_date).isBefore(dayjs(dateRange[1]).add(1, 'day'));
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const columns: ColumnsType<RateSetRecord> = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 180 },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (val) => val ?? '-',
    },
    {
      title: 'Start Date',
      dataIndex: 'start_date',
      key: 'start_date',
      width: 140,
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'End Date',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 140,
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '31/12/9999'),
    },
    {
      title: 'Active',
      key: 'active',
      width: 100,
      align: 'center',
      render: (_, record) =>
        !record.deactivated_at ? (
          <CheckCircleOutlined className="text-blue-500 text-base" />
        ) : (
          <CloseCircleOutlined className="text-gray-400 text-base" />
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => handleOpenEdit(record.id)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this rate set?"
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
        <h1 className="text-2xl font-bold mb-1">Rate Sets</h1>
        <p className="text-gray-500 text-sm m-0">Manage effective date windows and metadata for each rate set.</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex gap-3 mb-6">
          <Button onClick={fetchRateSets} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" onClick={() => setIsAddOpen(true)}>
            Add Rate Set
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Name, Description</label>
            <Input
              placeholder="Search name or description"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
              allowClear
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Period</label>
            <DatePicker.RangePicker
              format="DD/MM/YYYY"
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                } else {
                  setDateRange([null, null]);
                }
              }}
              className="w-64"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Active</label>
            <Select value={statusFilter} onChange={setStatusFilter} className="w-44">
              <Select.Option value="ALL">All statuses</Select.Option>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </div>
        </div>

        <Table<RateSetRecord>
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20, showTotal: (total) => `Total: ${total}` }}
        />
      </div>

      <AddRateSetForm
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          fetchRateSets();
        }}
      />

      <EditRateSetForm
        open={isEditOpen}
        rateSetId={editingId}
        onClose={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          fetchRateSets();
        }}
      />
    </div>
  );
}