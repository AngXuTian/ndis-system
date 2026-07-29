"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Input, Button, Space } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";

interface ClientRow {
  id: number;
  first_name: string;
  last_name: string;
  ndis_number: string;
  email: string;
  pricing_region: string;
}

export default function ClientsPage() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/clients?${params}`);
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

  const columns: ColumnsType<ClientRow> = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => (
        <Link href={`/clients/${r.id}`}>
          {r.first_name} {r.last_name}
        </Link>
      ),
    },
    { title: "NDIS Number", dataIndex: "ndis_number" },
    { title: "Email", dataIndex: "email" },
    { title: "Pricing Region", dataIndex: "pricing_region" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Participants</h1>
        <Link href="/clients/new">
          <Button type="primary">Add Participant</Button>
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

      <Table<ClientRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
        }}
      />
    </div>
  );
}
