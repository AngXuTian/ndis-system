import { Kysely } from "kysely";

export type ValidationErrors = Record<string, string[]>;

export interface InvoiceItemInput {
  id?: number;
  rate_set_id?: number | null;
  category_id?: number | null;
  support_item_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  unit?: string | number | null;
  input_rate?: string | number | null;
  max_rate?: string | number | null; // server-derived, checked at completion time
}

export interface InvoiceInput {
  client_id?: number | null;
  provider_id?: number | null;
  invoice_number?: string | null;
  invoice_date?: string | null;
  expected_amount?: string | number | null;
  status?: "drafted" | "completed";
  items?: InvoiceItemInput[];
}

function push(errors: ValidationErrors, field: string, message: string) {
  (errors[field] ??= []).push(message);
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === "";
}

/**
 * Minimum fields required to save ANY invoice, draft or completed.
 * "Draft mode allows incomplete or invalid data to be saved, but must
 * still include: invoice_number, invoice_date, expected_amount"
 */
export function validateInvoiceDraft(input: InvoiceInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (isEmpty(input.invoice_number) || !String(input.invoice_number).trim()) {
    push(errors, "invoice_number", "Invoice number is required");
  }
  if (isEmpty(input.invoice_date)) {
    push(errors, "invoice_date", "Invoice date is required");
  }
  if (isEmpty(input.expected_amount)) {
    push(errors, "expected_amount", "Expected amount is required");
  }

  return errors;
}

/**
 * Full validation enforced only when status = completed.
 */
export function validateInvoiceComplete(input: InvoiceInput): ValidationErrors {
  const errors = validateInvoiceDraft(input);

  if (isEmpty(input.client_id)) push(errors, "client_id", "Participant is required");
  if (isEmpty(input.provider_id)) push(errors, "provider_id", "Provider is required");

  if (!input.items || input.items.length === 0) {
    push(errors, "items", "At least one invoice item is required");
  } else {
    input.items.forEach((item, idx) => {
      const itemErrors = validateInvoiceItemComplete(item);
      Object.entries(itemErrors).forEach(([field, msgs]) => {
        errors[`items.${idx}.${field}`] = msgs;
      });
    });
  }

  return errors;
}

export function validateInvoiceItemComplete(item: InvoiceItemInput): ValidationErrors {
  const errors: ValidationErrors = {};

  if (isEmpty(item.rate_set_id)) push(errors, "rate_set_id", "Rate set is required");
  if (isEmpty(item.category_id)) push(errors, "category_id", "Category is required");
  if (isEmpty(item.support_item_id)) push(errors, "support_item_id", "Support item is required");
  if (isEmpty(item.start_date)) push(errors, "start_date", "Start date is required");
  if (isEmpty(item.end_date)) push(errors, "end_date", "End date is required");
  if (isEmpty(item.unit)) push(errors, "unit", "Unit is required");
  if (isEmpty(item.input_rate)) push(errors, "input_rate", "Input rate is required");
  if (isEmpty(item.max_rate)) push(errors, "max_rate", "No matching price could be found for this item");

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Check overlapping rate sets for a line item
export async function validateRateSetOverlap(
  db: Kysely<any>,
  startDate: string,
  endDate: string
): Promise<number> {
  const matchingRateSets = await db
    .selectFrom('rate_set')
    .select('id')
    .where('start_date', '<=', endDate)
    .where((eb) =>
      eb.or([
        eb('end_date', 'is', null),
        eb('end_date', '>=', startDate),
      ])
    )
    .execute();

  if (matchingRateSets.length === 0) {
    throw new Error(`No matching Rate Set found for date range ${startDate} to ${endDate}.`);
  }

  if (matchingRateSets.length > 1) {
    throw new Error(
      `Multiple (${matchingRateSets.length}) matching Rate Sets found for date range ${startDate} to ${endDate}. Please adjust dates.`
    );
  }

  return matchingRateSets[0].id;
}