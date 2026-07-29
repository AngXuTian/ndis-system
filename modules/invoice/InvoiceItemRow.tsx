"use client";

import { useEffect, useState } from "react";
import { Select, DatePicker, InputNumber, Button, Row, Col, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { FormListFieldData } from "antd/es/form/FormList";
import { Form } from "antd";
import dayjs from "dayjs";

interface RateSetOption {
  id: number;
  name: string;
}
interface CategoryOption {
  id: number;
  category_number: string;
  category_name: string;
}
interface SupportItemOption {
  id: number;
  category_id: number;
  item_number: string;
  item_name: string;
  unit: string | null;
}

export function InvoiceItemRow({ field, remove }: { field: FormListFieldData; remove: () => void }) {
  const form = Form.useFormInstance();
  const [rateSets, setRateSets] = useState<RateSetOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [supportItems, setSupportItems] = useState<SupportItemOption[]>([]);

  const rateSetId = Form.useWatch(["items", field.name, "rate_set_id"], form);
  const categoryId = Form.useWatch(["items", field.name, "category_id"], form);
  const unit = Form.useWatch(["items", field.name, "unit"], form);
  const inputRate = Form.useWatch(["items", field.name, "input_rate"], form);

  useEffect(() => {
    fetch("/api/rate-sets").then((r) => r.json()).then((res) => setRateSets(res.data ?? []));
  }, []);

  useEffect(() => {
    if (!rateSetId) {
      setCategories([]);
      setSupportItems([]);
      return;
    }
    fetch(`/api/rate-sets/${rateSetId}/categories`)
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []));
    fetch(`/api/rate-sets/${rateSetId}/support-items`)
      .then((r) => r.json())
      .then((res) => setSupportItems(res.data ?? []));
  }, [rateSetId]);

  const filteredSupportItems = categoryId
    ? supportItems.filter((si) => si.category_id === categoryId)
    : supportItems;

  const previewAmount =
    unit != null && inputRate != null ? (Number(unit) * Number(inputRate)).toFixed(2) : null;

  return (
    <div className="border rounded p-4 mb-3 bg-gray-50">
      <Row gutter={12}>
        <Col span={6}>
          <Form.Item name={[field.name, "rate_set_id"]} label="Rate Set" rules={[{ required: true }]}>
            <Select
              options={rateSets.map((rs) => ({ value: rs.id, label: rs.name }))}
              placeholder="Select rate set"
              onChange={() => {
                form.setFieldValue(["items", field.name, "category_id"], undefined);
                form.setFieldValue(["items", field.name, "support_item_id"], undefined);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={[field.name, "category_id"]} label="Category" rules={[{ required: true }]}>
            <Select
              options={categories.map((c) => ({
                value: c.id,
                label: `${c.category_number} — ${c.category_name}`,
              }))}
              placeholder="Select category"
              disabled={!rateSetId}
              onChange={() => form.setFieldValue(["items", field.name, "support_item_id"], undefined)}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            name={[field.name, "support_item_id"]}
            label="Support Item"
            rules={[{ required: true }]}
          >
            <Select
              options={filteredSupportItems.map((si) => ({
                value: si.id,
                label: `${si.item_number} — ${si.item_name}`,
              }))}
              placeholder="Select support item"
              disabled={!rateSetId}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Col>
        <Col span={6} className="flex items-start justify-end pt-1">
          <Button danger type="text" icon={<DeleteOutlined />} onClick={remove}>
            Remove
          </Button>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={6}>
          <Form.Item name={[field.name, "start_date"]} label="Start date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={[field.name, "end_date"]} label="End date" rules={[{ required: true }]}>
            <DatePicker className="w-full" />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name={[field.name, "unit"]} label="Unit" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={0.01} />
          </Form.Item>
        </Col>
        <Col span={5}>
          <Form.Item name={[field.name, "input_rate"]} label="Rate" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} step={0.01} prefix="$" />
          </Form.Item>
        </Col>
        <Col span={3} className="pt-1">
          <Typography.Text type="secondary" className="text-xs block">
            Amount (preview)
          </Typography.Text>
          <Typography.Text strong>{previewAmount ? `$${previewAmount}` : "—"}</Typography.Text>
        </Col>
      </Row>
    </div>
  );
}

export function toApiItem(raw: Record<string, unknown>) {
  return {
    rate_set_id: raw.rate_set_id,
    category_id: raw.category_id,
    support_item_id: raw.support_item_id,
    start_date: raw.start_date ? (raw.start_date as dayjs.Dayjs).startOf("day").toISOString() : null,
    end_date: raw.end_date ? (raw.end_date as dayjs.Dayjs).endOf("day").toISOString() : null,
    unit: raw.unit,
    input_rate: raw.input_rate,
  };
}