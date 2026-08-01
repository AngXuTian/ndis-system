"use client";

import Link from "next/link";
import { Card, Row, Col, Statistic, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TeamOutlined,
  ShopOutlined,
  FileTextOutlined,
  DollarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

export interface RecentInvoiceRow {
  id: number;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: string | null;
  status: "drafted" | "completed";
  client_first_name: string | null;
  client_last_name: string | null;
  provider_name: string | null;
}

const recentInvoiceColumns: ColumnsType<RecentInvoiceRow> = [
  {
    title: "Invoice #",
    key: "invoice_number",
    render: (_, r) => <Link href={`/invoices/${r.id}`}>{r.invoice_number ?? "(draft)"}</Link>,
  },
  {
    title: "Participant",
    key: "client",
    render: (_, r) =>
      r.client_first_name ? `${r.client_first_name} ${r.client_last_name}` : "—",
  },
  { title: "Provider", dataIndex: "provider_name", render: (v) => v ?? "—" },
  { title: "Invoice Date", dataIndex: "invoice_date" },
  { title: "Amount", dataIndex: "amount", render: (v) => (v ? `$${v}` : "—") },
  {
    title: "Status",
    dataIndex: "status",
    render: (status: string) => (
      <Tag color={status === "completed" ? "green" : "orange"}>{status}</Tag>
    ),
  },
];

export function DashboardView({
  counts,
  recentInvoices,
}: {
  counts: { clients: number; providers: number; invoices: number; rateSets: number };
  recentInvoices: RecentInvoiceRow[];
}) {
  const stats = [
    { title: "Participants", value: counts.clients, icon: <TeamOutlined />, href: "/clients", color: "#1677ff" },
    { title: "Providers", value: counts.providers, icon: <ShopOutlined />, href: "/providers", color: "#722ed1" },
    { title: "Invoices", value: counts.invoices, icon: <FileTextOutlined />, href: "/invoices", color: "#13c2c2" },
    { title: "Rate Sets", value: counts.rateSets, icon: <DollarOutlined />, href: "/rate-sets", color: "#52c41a" },
  ];

  const navCards = [
    {
      title: "Participants",
      description: "Manage NDIS participants and their pricing regions.",
      href: "/clients",
      icon: <TeamOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Providers",
      description: "Manage registered NDIS providers.",
      href: "/providers",
      icon: <ShopOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Invoices",
      description: "Create, draft, and complete participant invoices.",
      href: "/invoices",
      icon: <FileTextOutlined style={{ fontSize: 22 }} />,
    },
    {
      title: "Rate Sets",
      description: "Manage NDIS pricing arrangements and import catalogues.",
      href: "/rate-sets",
      icon: <DollarOutlined style={{ fontSize: 22 }} />,
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <Row gutter={16}>
        {stats.map((s) => (
          <Col span={6} key={s.title}>
            <Link href={s.href}>
              <Card hoverable>
                <Statistic
                  title={s.title}
                  value={s.value}
                  prefix={<span style={{ color: s.color }}>{s.icon}</span>}
                />
              </Card>
            </Link>
          </Col>
        ))}
      </Row>

      <div>
        <h2 className="text-base font-medium mb-3">Manage</h2>
        <Row gutter={16}>
          {navCards.map((c) => (
            <Col span={6} key={c.title}>
              <Link href={c.href}>
                <Card hoverable className="h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {c.icon}
                        <span className="font-medium">{c.title}</span>
                      </div>
                      <p className="text-sm text-gray-500">{c.description}</p>
                    </div>
                    <ArrowRightOutlined className="text-gray-400 mt-1" />
                  </div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium">Recent Invoices</h2>
          <Link href="/invoices" className="text-sm">
            View all →
          </Link>
        </div>
        <Table<RecentInvoiceRow>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={recentInvoices}
          columns={recentInvoiceColumns}
        />
      </div>
    </div>
  );
}