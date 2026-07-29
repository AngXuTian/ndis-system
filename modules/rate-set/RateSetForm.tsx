"use client";

import { useState } from "react";
import { Form, Input, DatePicker, Button, message } from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface RateSetFormValues {
  name: string;
  description?: string;
  start_date: dayjs.Dayjs;
  end_date?: dayjs.Dayjs;
}

export function RateSetForm({
  initialValues,
  rateSetId,
}: {
  initialValues?: Partial<{ name: string; description: string; start_date: string; end_date: string | null }>;
  rateSetId?: number;
}) {
  const [form] = Form.useForm<RateSetFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onFinish(values: RateSetFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        start_date: values.start_date.format("YYYY-MM-DD"),
        end_date: values.end_date ? values.end_date.format("YYYY-MM-DD") : null,
      };

      const res = await fetch(rateSetId ? `/api/rate-sets/${rateSetId}` : "/api/rate-sets", {
        method: rateSetId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details) {
          form.setFields(
            Object.entries(json.error.details).map(([field, errs]) => ({
              name: field as keyof RateSetFormValues,
              errors: errs as string[],
            }))
          );
        }
        message.error(json.error?.message ?? "Failed to save rate set");
        return;
      }

      message.success(rateSetId ? "Rate set updated" : "Rate set created");
      router.push(rateSetId ? `/rate-sets/${rateSetId}` : `/rate-sets/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form<RateSetFormValues>
      form={form}
      layout="vertical"
      initialValues={
        initialValues
          ? {
              ...initialValues,
              start_date: initialValues.start_date ? dayjs(initialValues.start_date) : undefined,
              end_date: initialValues.end_date ? dayjs(initialValues.end_date) : undefined,
            }
          : undefined
      }
      onFinish={onFinish}
      className="max-w-xl"
    >
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input placeholder="e.g. NDIS Pricing Arrangements 2026-27" />
      </Form.Item>
      <Form.Item name="description" label="Description">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="start_date" label="Start date" rules={[{ required: true }]}>
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item name="end_date" label="End date (leave blank if open-ended)">
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {rateSetId ? "Save changes" : "Create rate set"}
        </Button>
      </Form.Item>
    </Form>
  );
}