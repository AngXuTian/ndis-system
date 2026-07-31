'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Space, message, Popconfirm, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Selectable } from 'kysely';
import { Client } from '@/db/types';
import { ClientInput } from '@/validations/client.validation';
import { ClientForm } from '@/modules/client/ClientForm';

type StatusFilterType = 'ALL' | 'ACTIVE' | 'INACTIVE';

interface GenderOption {
  id: number;
  label: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export default function ClientsPage(): React.ReactElement {
  const [clients, setClients] = useState<Selectable<Client>[]>([]);
  const [genders, setGenders] = useState<GenderOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filters
  const [searchText, setSearchText] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<number | 'ALL'>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Selectable<Client> | null>(null);

  const fetchData = async (): Promise<void> => {
    setLoading(true);
    try {
      const [clientRes, genderRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/genders'),
      ]);

      const clientJson: ApiResponse<Selectable<Client>[]> = await clientRes.json();
      const genderJson: ApiResponse<GenderOption[]> = await genderRes.json();

      if (clientJson.data) setClients(clientJson.data);
      if (genderJson.data) setGenders(genderJson.data);
    } catch {
      message.error('Failed to load participants data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = (): void => {
    setEditingClient(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (record: Selectable<Client>): void => {
    setEditingClient(record);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Participant deleted successfully');
        fetchData();
      } else {
        message.error('Failed to delete participant');
      }
    } catch {
      message.error('An error occurred during deletion');
    }
  };

  const handleSubmit = async (values: ClientInput): Promise<void> => {
    setSubmitting(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json: ApiResponse<Selectable<Client>> = await res.json();

      if (res.ok) {
        message.success(editingClient ? 'Participant updated' : 'Participant created');
        setIsDrawerOpen(false);
        fetchData();
      } else {
        message.error(json.error?.message || 'Operation failed');
      }
    } catch {
      message.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper map for gender ID to label lookup
  const genderMap = new Map(genders.map((g) => [g.id, g.label]));

  // Filter clients by Searchbar, Gender, Region, Active
  const filteredData = clients.filter((item) => {
    const query = searchText.toLowerCase().trim();
    const matchesSearch =
      (item.first_name?.toLowerCase() ?? '').includes(query) ||
      (item.last_name?.toLowerCase() ?? '').includes(query) ||
      (item.ndis_number?.toLowerCase() ?? '').includes(query) ||
      (item.email?.toLowerCase() ?? '').includes(query);

    const matchesGender =
      selectedGender === 'ALL' || item.gender_id === selectedGender;

    const matchesRegion =
      selectedRegion === 'ALL' || item.pricing_region === selectedRegion;

    const isActive = item.deactivated_at === null;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && isActive) ||
      (statusFilter === 'INACTIVE' && !isActive);

    return matchesSearch && matchesGender && matchesRegion && matchesStatus;
  });

  const columns: ColumnsType<Selectable<Client>> = [
    {
      title: 'First Name',
      dataIndex: 'first_name',
      key: 'first_name',
    },
    {
      title: 'Last Name',
      dataIndex: 'last_name',
      key: 'last_name',
    },
    {
      title: 'Gender',
      dataIndex: 'gender_id',
      key: 'gender_id',
      render: (val: number) => genderMap.get(val) ?? val,
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dob',
      key: 'dob',
      render: (val: string | Date | null) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'NDIS Number',
      dataIndex: 'ndis_number',
      key: 'ndis_number',
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
      title: 'Pricing Region',
      dataIndex: 'pricing_region',
      key: 'pricing_region',
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
            title="Are you sure you want to delete this participant?"
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
          <h1 className="text-xl font-bold">Participants</h1>
          <p className="text-gray-500 text-sm">Manage participant profiles, contact details, and pricing regions.</p>
        </div>
        <Space>
          <Tooltip title="Refresh Data">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
            >
              Refresh
            </Button>
          </Tooltip>
          <Button type="primary" onClick={handleOpenAdd}>
            Add Participant
          </Button>
        </Space>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Search</label>
            <Input
              placeholder="Search First/Last Name, NDIS, Email"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-64"
              allowClear
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Gender</label>
            <Select<number | 'ALL'>
              value={selectedGender}
              onChange={(val) => setSelectedGender(val)}
              className="w-40"
            >
              <Select.Option value="ALL">All genders</Select.Option>
              {genders.map((g) => (
                <Select.Option key={g.id} value={g.id}>
                  {g.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Pricing Region</label>
            <Select<string | 'ALL'>
              value={selectedRegion}
              onChange={(val) => setSelectedRegion(val)}
              className="w-44"
            >
              <Select.Option value="ALL">All regions</Select.Option>
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
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Active</label>
            <Select<StatusFilterType>
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              className="w-40"
            >
              <Select.Option value="ALL">All statuses</Select.Option>
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="INACTIVE">Inactive</Select.Option>
            </Select>
          </div>
        </div>

        <Table<Selectable<Client>>
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showTotal: (total) => `Total: ${total}` }}
        />
      </div>

      <ClientForm
        open={isDrawerOpen}
        editingClient={editingClient}
        genders={genders}
        onCancel={() => setIsDrawerOpen(false)}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}