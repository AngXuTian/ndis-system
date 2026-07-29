"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Input, Button, Space, Tag } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";

interface InvoiceRow {
  id: number;
  invoice_number: string | null;
  invoice_date: string | null;
  amount: string | null;
  expected_amount: string | null;
  status: "drafted" | "completed";
  client_first_name: string | null;
  client_last_name: string | null;
  provider_name: string | null;
}

export default function InvoicesPage() {
  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/invoices?${params}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<InvoiceRow> = [
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Link href="/invoices/new">
          <Button type="primary">Add Invoice</Button>
        </Link>
      </div>

      <Space className="mb-4">
        <Input.Search
          placeholder="Search by invoice number"
          onSearch={(v) => {
            setPage(1);
            setSearch(v);
          }}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      <Table<InvoiceRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ current: page, pageSize: 20, total, onChange: setPage }}
      />
    </div>
  );
}