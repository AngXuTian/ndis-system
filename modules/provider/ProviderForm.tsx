"use client";

import { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useRouter } from "next/navigation";

interface ProviderFormValues {
  abn: string;
  name: string;
  email: string;
  phone_number?: string;
  address: string;
  unit_building?: string;
}

export function ProviderForm({
  initialValues,
  providerId,
}: {
  initialValues?: Partial<ProviderFormValues>;
  providerId?: number;
}) {
  const [form] = Form.useForm<ProviderFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function onFinish(values: ProviderFormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(providerId ? `/api/providers/${providerId}` : "/api/providers", {
        method: providerId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details) {
          form.setFields(
            Object.entries(json.error.details).map(([field, errs]) => ({
              name: field as keyof ProviderFormValues,
              errors: errs as string[],
            }))
          );
        }
        message.error(json.error?.message ?? "Failed to save provider");
        return;
      }

      message.success(providerId ? "Provider updated" : "Provider created");
      router.push("/providers");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form<ProviderFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
      className="max-w-xl"
    >
      <Form.Item name="abn" label="ABN" rules={[{ required: true }]}>
        <Input maxLength={11} placeholder="Digits only" />
      </Form.Item>
      <Form.Item name="name" label="Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone_number" label="Phone number">
        <Input placeholder="Digits only, 3-16 digits" />
      </Form.Item>
      <Form.Item name="address" label="Address" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="unit_building" label="Unit / Building">
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {providerId ? "Save changes" : "Create provider"}
        </Button>
      </Form.Item>
    </Form>
  );
}