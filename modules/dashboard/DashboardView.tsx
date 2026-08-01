'use client';

import React, { useEffect, useState } from 'react';
import { Card, Statistic, Row, Col, Table, Tag, message } from 'antd';
import {
  FileTextOutlined,
  UserOutlined,
  ShopOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

interface DashboardStats {
  totalInvoices: number;
  totalParticipants: number;
  totalProviders: number;
  totalAmount: number;
}

export default function DashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalParticipants: 0,
    totalProviders: 0,
    totalAmount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
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

        const invoicesList = invJson.data || [];
        const clientsList = clientJson.data || [];
        const providersList = provJson.data || [];

        const totalSum = invoicesList.reduce((acc: number, item: any) => {
          return acc + (parseFloat(item.expected_amount) || 0);
        }, 0);

        setStats({
          totalInvoices: invoicesList.length,
          totalParticipants: clientsList.length,
          totalProviders: providersList.length,
          totalAmount: totalSum,
        });

        setRecentInvoices(invoicesList.slice(0, 5));
      } catch {
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const columns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      render: (val: string) => val || '-',
    },
    {
      title: 'Participant',
      key: 'participant',
      render: (_: any, record: any) =>
        record.client_first_name
          ? `${record.client_first_name} ${record.client_last_name}`
          : '-',
    },
    {
      title: 'Provider',
      dataIndex: 'provider_name',
      key: 'provider_name',
      render: (val: string) => val || '-',
    },
    {
      title: 'Date',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      render: (val: string) => (val ? dayjs(val).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) =>
        status === 'completed' ? (
          <Tag color="green">Completed</Tag>
        ) : (
          <Tag color="orange">Draft</Tag>
        ),
    },
    {
      title: 'Amount',
      dataIndex: 'expected_amount',
      key: 'expected_amount',
      render: (val: any) => (val !== null && val !== undefined ? `$${Number(val).toFixed(2)}` : '$0.00'),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-6 rounded-md shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm m-0">Overview of NDIS invoicing and records.</p>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Invoices"
              value={stats.totalInvoices}
              prefix={<FileTextOutlined className="text-blue-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Participants"
              value={stats.totalParticipants}
              prefix={<UserOutlined className="text-green-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Providers"
              value={stats.totalProviders}
              prefix={<ShopOutlined className="text-purple-500 mr-2" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="Total Value"
              value={stats.totalAmount}
              precision={2}
              prefix={<DollarOutlined className="text-yellow-500 mr-1" />}
            />
          </Card>
        </Col>
      </Row>

      <div className="bg-white p-6 rounded-md shadow-sm">
        <h2 className="text-lg font-bold mb-4">Recent Invoices</h2>
        <Table
          dataSource={recentInvoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>
    </div>
  );
}