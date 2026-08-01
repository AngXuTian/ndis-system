import { z } from 'zod';

export const invoiceItemDraftSchema = z.object({
  id: z.number().optional(),
  support_item_id: z.number().optional().nullable(),
  category_id: z.number().optional().nullable(),
  rate_set_id: z.number().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  unit: z.union([z.number(), z.string()]).optional().nullable(),
  input_rate: z.union([z.number(), z.string()]).optional().nullable(),
  max_rate: z.union([z.number(), z.string()]).optional().nullable(),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
});

export const invoiceItemCompleteSchema = z.object({
  id: z.number().optional(),
  support_item_id: z.number({ message: 'Support Item is required' }),
  category_id: z.number({ message: 'Support Category is required' }),
  rate_set_id: z.number().optional().nullable(),
  start_date: z.string({ message: 'Service Start Date is required' }).min(1, 'Service Start Date is required'),
  end_date: z.string({ message: 'Service End Date is required' }).min(1, 'Service End Date is required'),
  unit: z.union([z.number(), z.string()]),
  input_rate: z.union([z.number(), z.string()]),
  max_rate: z.union([z.number(), z.string()]).optional().nullable(),
  amount: z.union([z.number(), z.string()]).optional().nullable(),
});

// Draft schema allows every field to be null or empty
export const invoiceDraftSchema = z.object({
  client_id: z.number().optional().nullable(),
  provider_id: z.number().optional().nullable(),
  invoice_number: z.string().trim().optional().nullable(),
  invoice_date: z.string().optional().nullable(),
  expected_amount: z.union([z.number(), z.string()]).optional().nullable(),
  status: z.literal('drafted'),
  items: z.array(invoiceItemDraftSchema).default([]),
});

export const invoiceCompleteSchema = z.object({
  client_id: z.number({ message: 'Participant is required' }),
  provider_id: z.number({ message: 'Provider is required' }),
  invoice_number: z.string().trim().min(1, 'Invoice Number is required'),
  invoice_date: z.string().min(1, 'Invoice Date is required'),
  expected_amount: z.union([z.number(), z.string()]),
  status: z.literal('completed'),
  items: z.array(invoiceItemCompleteSchema).default([]),
});

export type InvoiceInput = z.infer<typeof invoiceDraftSchema> | z.infer<typeof invoiceCompleteSchema>;