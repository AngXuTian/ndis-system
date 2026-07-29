"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Input, Button, Space } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";

interface ProviderRow {
  id: number;
  abn: string;
  name: string;
  email: string | null;
  phone_number: string | null;
}

export default function ProvidersPage() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/providers?${params}`);
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

  const columns: ColumnsType<ProviderRow> = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => <Link href={`/providers/${r.id}`}>{r.name}</Link>,
    },
    { title: "ABN", dataIndex: "abn" },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "phone_number" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Providers</h1>
        <Link href="/providers/new">
          <Button type="primary">Add Provider</Button>
        </Link>
      </div>

      <Space className="mb-4">
        <Input.Search
          placeholder="Search by name"
          onSearch={(v) => {
            setPage(1);
            setSearch(v);
          }}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      <Table<ProviderRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ current: page, pageSize: 20, total, onChange: setPage }}
      />
    </div>
  );
}