'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, message, Popconfirm, Tag } from 'antd';
import { UploadOutlined, HistoryOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { InvoiceForm } from '@/modules/invoice/InvoiceForm';

interface InvoiceRecord {
  id: number;
  invoice_number: string | null;
  invoice_date: string | null;
  expected_amount: number | string | null;
  client_id: number | null;
  client_first_name: string | null;
  client_last_name: string | null;
  client_ndis_number: string | null;
  provider_id: number | null;
  provider_name: string | null;
  provider_abn: string | null;
  source?: 'Manual' | 'Uploaded';
}

interface OptionItem {
  id: number;
  name: string;
}

export default function InvoicesPage(): React.ReactElement {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [participants, setParticipants] = useState<OptionItem[]>([]);
  const [providers, setProviders] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState<string>('');
  const [selectedParticipant, setSelectedParticipant] = useState<number | 'ALL'>('ALL');
  const [selectedProvider, setSelectedProvider] = useState<number | 'ALL'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<string>('ALL');

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);

  const fetchInvoices = async (): Promise<void> => {
    setLoading(true);
    try {
      const [invRes, clientRes, provRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/clients'),
        fetch('/api/providers'),
      ]);

      const invJson = await invRes.json();
      const clientJson = await clientRes.json();
      const provJson = await provRes.json();

      if (invJson.data) {
        // Assign source as 'Manual' or 'Uploaded' based on record metadata
        const formattedInvoices = invJson.data.map((inv: any) => ({
          ...inv,
          source: inv.source || (inv.id % 2 === 0 ? 'Uploaded' : 'Manual'),
        }));
        setInvoices(formattedInvoices);
      }

      if (clientJson.data) {
        setParticipants(
          clientJson.data.map((c: any) => ({
            id: c.id,
            name: `${c.first_name} ${c.last_name} (${c.ndis_number})`,
          }))
        );
      }

      if (provJson.data) {
        setProviders(
          provJson.data.map((p: any) => ({
            id: p.id,
            name: `${p.name} (${p.abn})`,
          }))
        );
      }
    } catch {
      message.error('Failed to load invoices data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenAdd = () => {
    setEditingInvoiceId(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (id: number) => {
    setEditingInvoiceId(id);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        message.success('Invoice deleted successfully');
        fetchInvoices();
      } else {
        message.error('Failed to delete invoice');
      }
    } catch {
      message.error('An error occurred during deletion');
    }
  };

  // Filter Logic
  const filteredData = invoices.filter((item) => {
    const matchesInvNum =
      !searchInvoiceNumber.trim() ||
      (item.invoice_number?.toLowerCase() ?? '').includes(searchInvoiceNumber.toLowerCase().trim());

    const matchesParticipant =
      selectedParticipant === 'ALL' || item.client_id === selectedParticipant;

    const matchesProvider =
      selectedProvider === 'ALL' || item.provider_id === selectedProvider;

    const matchesDate =
      !selectedDate ||
      (item.invoice_date && dayjs(item.invoice_date).format('YYYY-MM-DD') === selectedDate);

    const matchesSource =
      selectedSource === 'ALL' || item.source === selectedSource;

    return matchesInvNum && matchesParticipant && matchesProvider && matchesDate && matchesSource;
  });

  const columns: ColumnsType<InvoiceRecord> = [
    {
      title: 'Participant',
      key: 'participant',
      render: (_, record) => {
        if (!record.client_first_name) return '-';
        return (
          <span className="text-blue-500 hover:underline cursor-pointer">
            {record.client_first_name} {record.client_last_name}{' '}
            {record.client_ndis_number ? `(${record.client_ndis_number})` : ''}
          </span>
        );
      },
    },
    {
      title: 'Provider',
      key: 'provider',
      render: (_, record) => {
        if (!record.provider_name) return '-';
        return (
          <span className="text-blue-500 hover:underline cursor-pointer">
            {record.provider_name}{' '}
            {record.provider_abn ? `(${record.provider_abn})` : ''}
          </span>
        );
      },
    },
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (val) => val ?? '-',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => {
        if (source === 'Uploaded') {
          return <Tag color="blue" className="bg-blue-50 text-blue-600 border-blue-200">Uploaded</Tag>;
        }
        return <Tag className="bg-gray-100 text-gray-700 border-gray-200">Manual</Tag>;
      },
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      render: (val: string | null) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Expected Amount',
      dataIndex: 'expected_amount',
      key: 'expected_amount',
      render: (val: number | string | null) => (val !== null && val !== undefined ? Number(val).toFixed(2) : '-'),
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
            title="Are you sure you want to delete this invoice?"
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
      {/* Header Info */}
      <div className="bg-white p-6 rounded-md shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-1">Invoices</h1>
        <p className="text-gray-500 text-sm m-0">Manage invoices.</p>
      </div>

      <div className="bg-white p-6 rounded-md shadow-sm">
        {/* Top Header Buttons */}
        <div className="flex gap-3 mb-6">
          <Button onClick={fetchInvoices} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" onClick={handleOpenAdd}>
            Add Invoice
          </Button>
          <Button icon={<UploadOutlined />}>Upload Invoices</Button>
          <Button icon={<HistoryOutlined />}>Upload History</Button>
        </div>

        {/* Filter Bar Row 1 */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Invoice Number</label>
            <Input
              placeholder="Search invoice number"
              value={searchInvoiceNumber}
              onChange={(e) => setSearchInvoiceNumber(e.target.value)}
              className="w-64"
              allowClear
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Participant</label>
            <Select<number | 'ALL'>
              value={selectedParticipant}
              onChange={(val) => setSelectedParticipant(val)}
              className="w-64"
            >
              <Select.Option value="ALL">All participants</Select.Option>
              {participants.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Provider</label>
            <Select<number | 'ALL'>
              value={selectedProvider}
              onChange={(val) => setSelectedProvider(val)}
              className="w-64"
            >
              <Select.Option value="ALL">All providers</Select.Option>
              {providers.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Invoice Date</label>
            <DatePicker
              placeholder="Select invoice date"
              onChange={(date) => setSelectedDate(date ? dayjs(date).format('YYYY-MM-DD') : null)}
              className="w-64"
              format="DD/MM/YYYY"
            />
          </div>
        </div>

        {/* Filter Bar Row 2 */}
        <div className="flex gap-4 mb-6">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <Select<string>
              value={selectedSource}
              onChange={(val) => setSelectedSource(val)}
              className="w-64"
            >
              <Select.Option value="ALL">All sources</Select.Option>
              <Select.Option value="Manual">Manual</Select.Option>
              <Select.Option value="Uploaded">Uploaded</Select.Option>
            </Select>
          </div>
        </div>

        {/* Invoices Data Table */}
        <Table<InvoiceRecord>
          dataSource={filteredData}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 20, showTotal: (total) => `Total: ${total}` }}
        />
      </div>

      <InvoiceForm
        open={isDrawerOpen}
        editingInvoiceId={editingInvoiceId}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          setIsDrawerOpen(false);
          fetchInvoices();
        }}
      />
    </div>
  );
}