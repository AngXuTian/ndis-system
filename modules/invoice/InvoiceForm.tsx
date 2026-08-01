'use client';

import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, DatePicker, Button, Space, Card, message } from 'antd';
import { PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface OptionItem {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  category_name?: string;
  item_name?: string;
}

interface InvoiceFormProps {
  open: boolean;
  editingInvoiceId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  open,
  editingInvoiceId,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();

  const [clients, setClients] = useState<OptionItem[]>([]);
  const [providers, setProviders] = useState<OptionItem[]>([]);
  const [categories, setCategories] = useState<OptionItem[]>([]);
  const [supportItems, setSupportItems] = useState<OptionItem[]>([]);

  const [submittingAction, setSubmittingAction] = useState<'drafted' | 'completed' | null>(null);
  const [derivedTotalAmount, setDerivedTotalAmount] = useState<number | null>(0);
  
  // Track if current invoice status is completed
  const [isCompletedStatus, setIsCompletedStatus] = useState<boolean>(false);

  useEffect(() => {
    async function loadDropdownsAndData() {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/providers'),
        ]);

        const cJson = await cRes.json();
        const pJson = await pRes.json();

        if (cJson.data) setClients(cJson.data);
        if (pJson.data) setProviders(pJson.data);

        // Fetch invoice details if editing
        if (editingInvoiceId) {
          const invRes = await fetch(`/api/invoices/${editingInvoiceId}`);
          const invJson = await invRes.json();
          if (invJson.data) {
            const record = invJson.data;
            
            // Check if status is completed
            setIsCompletedStatus(record.status === 'completed');

            form.setFieldsValue({
              client_id: record.client_id,
              provider_id: record.provider_id,
              invoice_number: record.invoice_number,
              invoice_date: record.invoice_date ? dayjs(record.invoice_date) : null,
              expected_amount: record.expected_amount !== null ? String(record.expected_amount) : '',
              items: (record.items || []).map((item: any) => ({
                id: item.id,
                start_date: item.start_date ? dayjs(item.start_date) : null,
                end_date: item.end_date ? dayjs(item.end_date) : null,
                category_id: item.category_id,
                support_item_id: item.support_item_id,
                max_rate: item.max_rate !== null ? String(item.max_rate) : '',
                unit: item.unit !== null ? String(item.unit) : '1',
                input_rate: item.input_rate !== null ? String(item.input_rate) : '',
                amount: item.amount !== null ? String(item.amount) : '0.00',
              })),
            });
            calculateAmounts();
          }
        } else {
          setIsCompletedStatus(false);
          form.resetFields();
          form.setFieldsValue({
            invoice_date: dayjs(),
            items: [],
          });
          setDerivedTotalAmount(0);
        }
      } catch {
        message.error('Failed to load initial data');
      }
    }

    if (open) {
      loadDropdownsAndData();
    }
  }, [open, editingInvoiceId, form]);

  const calculateAmounts = () => {
    const items = form.getFieldValue('items') || [];
    if (items.length === 0) {
      setDerivedTotalAmount(0);
      return;
    }

    let sum = 0;
    let hasValidRate = false;

    const updatedItems = items.map((item: any) => {
      if (item) {
        const unitVal = parseFloat(item.unit || 0);
        const rateVal = parseFloat(item.input_rate || 0);
        if (item.input_rate !== undefined && item.input_rate !== null && item.input_rate !== '') {
          hasValidRate = true;
        }
        const itemAmt = Number((unitVal * rateVal).toFixed(2));
        sum += itemAmt;
        return { ...item, amount: itemAmt.toFixed(2) };
      }
      return item;
    });

    setDerivedTotalAmount(hasValidRate ? Number(sum.toFixed(2)) : 0);
    form.setFieldsValue({ items: updatedItems });
  };

  const handleSave = async (targetStatus: 'drafted' | 'completed') => {
    setSubmittingAction(targetStatus);
    try {
      if (targetStatus === 'completed') {
        // Enforce strict frontend form validations for completion
        const values = await form.validateFields();

        const payload = {
          ...values,
          expected_amount: values.expected_amount !== undefined && values.expected_amount !== '' ? parseFloat(values.expected_amount) : 0,
          status: 'completed',
          invoice_date: values.invoice_date ? dayjs(values.invoice_date).format('YYYY-MM-DD') : '',
          items: (values.items || []).map((item: any) => ({
            ...item,
            unit: item.unit ? parseFloat(item.unit) : 0,
            input_rate: item.input_rate ? parseFloat(item.input_rate) : 0,
            amount: item.amount ? parseFloat(item.amount) : 0,
            start_date: item.start_date ? dayjs(item.start_date).format('YYYY-MM-DD') : null,
            end_date: item.end_date ? dayjs(item.end_date).format('YYYY-MM-DD') : null,
          })),
        };

        const url = editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : '/api/invoices';
        const method = editingInvoiceId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (res.ok) {
          message.success('Invoice saved successfully');
          onSuccess();
        } else {
          message.error(json.error?.message || 'Failed to save invoice');
        }
      } else {
        // Save as Draft: Read raw values without triggering form.validateFields()
        const rawValues = form.getFieldsValue();

        const payload = {
          client_id: rawValues.client_id ?? null,
          provider_id: rawValues.provider_id ?? null,
          invoice_number: rawValues.invoice_number ? String(rawValues.invoice_number).trim() : null,
          invoice_date: rawValues.invoice_date ? dayjs(rawValues.invoice_date).format('YYYY-MM-DD') : null,
          expected_amount: rawValues.expected_amount !== undefined && rawValues.expected_amount !== '' && rawValues.expected_amount !== null
            ? parseFloat(rawValues.expected_amount)
            : null,
          status: 'drafted',
          items: (rawValues.items || []).map((item: any) => ({
            ...item,
            unit: item?.unit ? parseFloat(item.unit) : null,
            input_rate: item?.input_rate ? parseFloat(item.input_rate) : null,
            amount: item?.amount ? parseFloat(item.amount) : null,
            start_date: item?.start_date ? dayjs(item.start_date).format('YYYY-MM-DD') : null,
            end_date: item?.end_date ? dayjs(item.end_date).format('YYYY-MM-DD') : null,
          })),
        };

        const url = editingInvoiceId ? `/api/invoices/${editingInvoiceId}` : '/api/invoices';
        const method = editingInvoiceId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (res.ok) {
          message.success('Invoice saved as draft');
          onSuccess();
        } else {
          message.error(json.error?.message || 'Failed to save draft');
        }
      }
    } catch {
      if (targetStatus === 'completed') {
        message.error('Please complete required fields before saving.');
      }
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <Drawer
      title={editingInvoiceId ? 'Edit Invoice' : 'Add Invoice'}
      placement="right"
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{
        wrapper: { width: '100%' },
        body: { padding: '24px 32px' },
      }}
      extra={
        <Space>
          <Button onClick={onClose} disabled={submittingAction !== null}>
            Cancel
          </Button>

          {/* Hide 'Save as Draft' if current invoice status is 'completed' */}
          {!isCompletedStatus && (
            <Button
              onClick={() => handleSave('drafted')}
              loading={submittingAction === 'drafted'}
              disabled={submittingAction === 'completed'}
            >
              Save as Draft
            </Button>
          )}

          <Button
            type="primary"
            onClick={() => handleSave('completed')}
            loading={submittingAction === 'completed'}
            disabled={submittingAction === 'drafted'}
          >
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onValuesChange={calculateAmounts}>
        {/* Header Meta Info */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <Form.Item name="client_id" label={<span className="text-red-500">* Participant</span>}>
            <Select placeholder="Select participant" allowClear>
              {clients.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="provider_id" label={<span className="text-red-500">* Provider</span>}>
            <Select placeholder="Select provider" allowClear>
              {providers.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="invoice_number" label={<span className="text-red-500">* Invoice Number</span>}>
            <Input placeholder="Invoice Number" />
          </Form.Item>

          <Form.Item name="invoice_date" label={<span className="text-red-500">* Invoice Date</span>}>
            <DatePicker className="w-full" placeholder="Select date" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="expected_amount" label={<span className="text-red-500">* Expected Amount</span>}>
            <Input type="number" placeholder="0.00" step="0.01" min="0" />
          </Form.Item>

          <Form.Item label="Amount">
            <Input
              value={derivedTotalAmount !== null ? `$${derivedTotalAmount.toFixed(2)}` : '$0.00'}
              disabled
              className="bg-gray-100 font-semibold text-gray-700"
            />
          </Form.Item>
        </div>

        {/* Dynamic Items List */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              <h2 className="text-lg font-bold mb-4">Items ({fields.length})</h2>

              {fields.map(({ key, name, ...restField }) => (
                <Card key={key} className="mb-4 shadow-sm border-gray-200" size="small">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-gray-700">#{name + 1}</span>
                    <Space>
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          const currentItems = form.getFieldValue('items');
                          add({ ...currentItems[name] });
                        }}
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                          remove(name);
                          calculateAmounts();
                        }}
                      />
                    </Space>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-2">
                    <Form.Item
                      {...restField}
                      name={[name, 'start_date']}
                      label={<span className="text-red-500">* Service Start Date</span>}
                    >
                      <DatePicker className="w-full" placeholder="Select date" format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'end_date']}
                      label={<span className="text-red-500">* Service End Date</span>}
                    >
                      <DatePicker className="w-full" placeholder="Select date" format="DD/MM/YYYY" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'category_id']}
                      label={<span className="text-red-500">* Support Category</span>}
                    >
                      <Select placeholder="Select category">
                        {categories.map((cat) => (
                          <Select.Option key={cat.id} value={cat.id}>
                            {cat.category_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'support_item_id']}
                      label={<span className="text-red-500">* Support Item</span>}
                    >
                      <Select placeholder="Select item">
                        {supportItems.map((si) => (
                          <Select.Option key={si.id} value={si.id}>
                            {si.item_name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <Form.Item {...restField} name={[name, 'max_rate']} label="Max Rate">
                      <Input placeholder="No Limit" disabled className="bg-gray-100" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      label={<span className="text-red-500">* Unit</span>}
                    >
                      <Input type="number" step="0.01" min="0" placeholder="1.00" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'input_rate']}
                      label={<span className="text-red-500">* Invoiced Rate</span>}
                    >
                      <Input type="number" step="0.01" min="0" placeholder="0.00" />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'amount']} label="Invoiced Amount">
                      <Input
                        value={`$${(
                          Number(parseFloat(form.getFieldValue(['items', name, 'unit']) || '0')) *
                          Number(parseFloat(form.getFieldValue(['items', name, 'input_rate']) || '0'))
                        ).toFixed(2)}`}
                        disabled
                        className="bg-gray-100 font-semibold"
                      />
                    </Form.Item>
                  </div>
                </Card>
              ))}

              <Button type="dashed" onClick={() => add({ unit: '1' })} icon={<PlusOutlined />} className="mt-2">
                Add Item
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Drawer>
  );
};