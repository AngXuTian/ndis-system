"use client";

import { useEffect, useState } from "react";
import { Form, Select, DatePicker, InputNumber, Input, Button, Space, message, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { InvoiceItemRow, toApiItem } from "@/modules/invoice/InvoiceItemRow";

interface Option {
  id: number;
  label: string;
}

export function InvoiceForm({
  invoiceId,
  initialValues,
}: {
  invoiceId?: number;
  initialValues?: Record<string, unknown>;
}) {
  const [form] = Form.useForm();
  const [clients, setClients] = useState<Option[]>([]);
  const [providers, setProviders] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/clients?pageSize=200")
      .then((r) => r.json())
      .then((res) =>
        setClients(
          (res.data ?? []).map((c: { id: number; first_name: string; last_name: string }) => ({
            id: c.id,
            label: `${c.first_name} ${c.last_name}`,
          }))
        )
      );
    fetch("/api/providers?pageSize=200")
      .then((r) => r.json())
      .then((res) =>
        setProviders((res.data ?? []).map((p: { id: number; name: string }) => ({ id: p.id, label: p.name })))
      );
  }, []);

  async function submit(status: "drafted" | "completed") {
    const values = await form.validateFields().catch(() => form.getFieldsValue());
    setSubmitting(true);
    try {
      const payload = {
        client_id: values.client_id,
        provider_id: values.provider_id,
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date
          ? (values.invoice_date as dayjs.Dayjs).format("YYYY-MM-DD")
          : null,
        expected_amount: values.expected_amount,
        status,
        items: (values.items ?? []).map(toApiItem),
      };

      const res = await fetch(invoiceId ? `/api/invoices/${invoiceId}` : "/api/invoices", {
        method: invoiceId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details) {
          form.setFields(
            Object.entries(json.error.details).map(([field, errs]) => ({
              name: field.split(".").map((p) => (isNaN(Number(p)) ? p : Number(p))),
              errors: errs as string[],
            }))
          );
        }
        message.error(json.error?.message ?? "Failed to save invoice");
        return;
      }

      message.success(status === "completed" ? "Invoice completed" : "Invoice saved as draft");
      router.push("/invoices");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} className="max-w-4xl">
      <div className="grid grid-cols-2 gap-x-6">
        <Form.Item name="client_id" label="Participant">
          <Select
            options={clients.map((c) => ({ value: c.id, label: c.label }))}
            placeholder="Select participant"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="provider_id" label="Provider">
          <Select
            options={providers.map((p) => ({ value: p.id, label: p.label }))}
            placeholder="Select provider"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
        <Form.Item name="invoice_number" label="Invoice number" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="invoice_date" label="Invoice date" rules={[{ required: true }]}>
          <DatePicker className="w-full" />
        </Form.Item>
        <Form.Item name="expected_amount" label="Expected amount" rules={[{ required: true }]}>
          <InputNumber className="w-full" min={0} step={0.01} prefix="$" />
        </Form.Item>
      </div>

      <Divider>Invoice Items</Divider>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map((field) => (
              <InvoiceItemRow key={field.key} field={field} remove={() => remove(field.name)} />
            ))}
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
              Add Item
            </Button>
          </>
        )}
      </Form.List>

      <div className="mt-6">
        <Space>
          <Button onClick={() => submit("drafted")} loading={submitting}>
            Save as Draft
          </Button>
          <Button type="primary" onClick={() => submit("completed")} loading={submitting}>
            Complete Invoice
          </Button>
        </Space>
      </div>
    </Form>
  );
}