// app/rate-sets/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Table, Button, Space } from "antd";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";

interface RateSetRow {
  id: number;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
}

export default function RateSetsPage() {
  const [rows, setRows] = useState<RateSetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20" });
      const res = await fetch(`/api/rate-sets?${params}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnsType<RateSetRow> = [
    {
      title: "Name",
      key: "name",
      render: (_, r) => <Link href={`/rate-sets/${r.id}`}>{r.name}</Link>,
    },
    { title: "Start date", dataIndex: "start_date" },
    { title: "End date", dataIndex: "end_date", render: (v) => v ?? "Open-ended" },
    { title: "Description", dataIndex: "description", render: (v) => v ?? "—" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Rate Sets</h1>
        <Link href="/rate-sets/new">
          <Button type="primary">Add Rate Set</Button>
        </Link>
      </div>

      <Space className="mb-4" />

      <Table<RateSetRow>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ current: page, pageSize: 20, total, onChange: setPage }}
      />
    </div>
  );
}