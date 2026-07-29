"use client";

import { useEffect, useState } from "react";
import { Form, Input, Select, DatePicker, Button, message } from "antd";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface Option {
  id?: number;
  code?: string;
  label: string;
}

interface ClientFormValues {
  first_name: string;
  last_name: string;
  gender_id: number;
  dob: dayjs.Dayjs;
  ndis_number: string;
  email: string;
  phone_number?: string;
  address: string;
  unit_building?: string;
  pricing_region: string;
}

type ClientFormInitialValues = Omit<ClientFormValues, "dob"> & { dob?: string | dayjs.Dayjs };

export function ClientForm({
  initialValues,
  clientId,
}: {
  initialValues?: Partial<ClientFormInitialValues>;
  clientId?: number;
}) {
  const [form] = Form.useForm<ClientFormValues>();
  const [genders, setGenders] = useState<Option[]>([]);
  const [regions, setRegions] = useState<Option[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/genders").then((r) => r.json()).then((res) => setGenders(res.data ?? []));
    fetch("/api/pricing-regions").then((r) => r.json()).then((res) => setRegions(res.data ?? []));
  }, []);

  async function onFinish(values: ClientFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : undefined,
      };

      const res = await fetch(clientId ? `/api/clients/${clientId}` : "/api/clients", {
        method: clientId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.error?.details) {
          form.setFields(
            Object.entries(json.error.details).map(([field, errs]) => ({
              name: field as keyof ClientFormValues,
              errors: errs as string[],
            }))
          );
        }
        message.error(json.error?.message ?? "Failed to save client");
        return;
      }

      message.success(clientId ? "Client updated" : "Client created");
      router.push("/clients");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form<ClientFormValues>
      form={form}
      layout="vertical"
      initialValues={
        initialValues
          ? { ...initialValues, dob: initialValues.dob ? dayjs(initialValues.dob) : undefined }
          : undefined
      }
      onFinish={onFinish}
      className="max-w-xl"
    >
      <Form.Item name="first_name" label="First name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="last_name" label="Last name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="gender_id" label="Gender" rules={[{ required: true }]}>
        <Select
          options={genders.map((g) => ({ value: g.id, label: g.label }))}
          placeholder="Select gender"
        />
      </Form.Item>
      <Form.Item name="dob" label="Date of birth" rules={[{ required: true }]}>
        <DatePicker className="w-full" />
      </Form.Item>
      <Form.Item name="ndis_number" label="NDIS number" rules={[{ required: true }]}>
        <Input maxLength={16} placeholder="Digits only" />
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
      <Form.Item name="pricing_region" label="Pricing region" rules={[{ required: true }]}>
        <Select
          options={regions.map((r) => ({ value: r.code, label: r.label }))}
          placeholder="Select pricing region"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          {clientId ? "Save changes" : "Create client"}
        </Button>
      </Form.Item>
    </Form>
  );
}
