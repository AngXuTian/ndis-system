import { invoiceRepository, type ResolvedItem } from "@/repositories/invoice.repository";
import { findMatchingRateSet, findMatchingPrice } from "@/modules/invoice/rate-matching";
import {
  validateInvoiceDraft,
  validateInvoiceComplete,
  hasErrors,
  type InvoiceInput,
  type InvoiceItemInput,
  type ValidationErrors,
} from "@/validations/invoice.validation";
import { multiply2, sum2, isValidDecimal } from "@/lib/money";
import { db } from "@/db";

export class ValidationError extends Error {
  constructor(public errors: ValidationErrors) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

async function getClientPricingRegion(clientId: number | null | undefined): Promise<string | null> {
  if (!clientId) return null;
  const client = await db
    .selectFrom("client")
    .select(["pricing_region"])
    .where("id", "=", clientId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();
  return client?.pricing_region ?? null;
}

/**
 * Resolves one invoice item server-side: matches rate_set by date overlap,
 * matches max_rate via price lookup, computes amount = unit * input_rate.
 * The backend is the sole source of truth — any rate_set_id/max_rate the
 * client sends is ignored and recomputed here.
 */
async function resolveItem(
  item: InvoiceItemInput,
  pricingRegion: string | null,
  itemErrors: ValidationErrors
): Promise<ResolvedItem> {
  let rateSetId: number | null = null;
  const startDate = item.start_date ? new Date(item.start_date) : null;
  const endDate = item.end_date ? new Date(item.end_date) : null;

  if (startDate && endDate) {
    const match = await findMatchingRateSet(startDate, endDate);
    if (match.multipleMatches) {
      (itemErrors["rate_set_id"] ??= []).push(
        "Multiple rate sets match the selected date range"
      );
    } else {
      rateSetId = match.rateSetId;
    }
  }

  const supportItemId = item.support_item_id ?? null;
  const categoryId = item.category_id ?? null;

  let maxRate: string | null = null;
  if (rateSetId && supportItemId && startDate && endDate && pricingRegion) {
    const priceMatch = await findMatchingPrice({
      rateSetId,
      supportItemId,
      startDate,
      endDate,
      pricingRegion,
    });
    maxRate = priceMatch?.unitPrice ?? null;
  }

  const unit = isValidDecimal(item.unit) ? String(item.unit) : null;
  const inputRate = isValidDecimal(item.input_rate) ? String(item.input_rate) : null;
  const amount = unit && inputRate ? multiply2(unit, inputRate) : null;

  return {
    id: item.id,
    rate_set_id: rateSetId,
    category_id: categoryId,
    support_item_id: supportItemId,
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null,
    max_rate: maxRate,
    unit,
    input_rate: inputRate,
    amount,
  };
}

async function resolveAllItems(items: InvoiceItemInput[], pricingRegion: string | null) {
  const errors: ValidationErrors = {};
  const resolved: ResolvedItem[] = [];

  for (let i = 0; i < items.length; i++) {
    const itemErrors: ValidationErrors = {};
    const resolvedItem = await resolveItem(items[i], pricingRegion, itemErrors);
    resolved.push(resolvedItem);
    Object.entries(itemErrors).forEach(([field, msgs]) => {
      errors[`items.${i}.${field}`] = msgs;
    });
  }

  return { resolved, errors };
}

export const invoiceService = {
  async list(params: {
    search?: string;
    clientId?: number;
    providerId?: number;
    page?: number;
    pageSize?: number;
  }) {
    const pageSize = params.pageSize ?? 20;
    const page = params.page ?? 1;
    return invoiceRepository.list({
      search: params.search,
      clientId: params.clientId,
      providerId: params.providerId,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  },

  async get(id: number) {
    return invoiceRepository.findById(id);
  },

  async create(input: InvoiceInput) {
    const status = input.status === "completed" ? "completed" : "drafted";
    return this.save(null, input, status);
  },

  async update(id: number, input: InvoiceInput) {
    const status = input.status === "completed" ? "completed" : "drafted";
    return this.save(id, input, status);
  },

  async save(id: number | null, input: InvoiceInput, status: "drafted" | "completed") {
    // 1. Minimum draft-level fields are always required
    const baseErrors = validateInvoiceDraft(input);

    // 2. Check invoice_number uniqueness per provider
    if (input.invoice_number?.trim()) {
      const existing = await invoiceRepository.findByProviderAndNumber(
        input.provider_id ?? null,
        input.invoice_number.trim()
      );
      const conflict = existing.find((row) => row.id !== id);
      if (conflict) {
        (baseErrors["invoice_number"] ??= []).push(
          "Invoice number must be unique per provider"
        );
      }
    }

    // 3. Resolve items server-side (rate set matching, price lookup, amounts)
    const pricingRegion = await getClientPricingRegion(input.client_id);
    const { resolved, errors: itemErrors } = await resolveAllItems(input.items ?? [], pricingRegion);
    const allErrors: ValidationErrors = { ...baseErrors, ...itemErrors };

    // 4. Recalculate invoice.amount server-side from resolved item amounts
    const itemAmounts = resolved.map((i) => i.amount).filter((a): a is string => a !== null);
    const amount = itemAmounts.length ? sum2(itemAmounts) : null;

    // 5. Full validation only enforced when status = completed
    if (status === "completed") {
      const completeErrors = validateInvoiceComplete({ ...input, items: input.items });
      Object.entries(completeErrors).forEach(([field, msgs]) => {
        allErrors[field] = [...(allErrors[field] ?? []), ...msgs];
      });

      if (
        amount !== null &&
        input.expected_amount !== null &&
        input.expected_amount !== undefined
      ) {
        const expected = Number(input.expected_amount).toFixed(2);
        if (amount !== expected) {
          (allErrors["expected_amount"] ??= []).push(
            "Expected amount must equal the sum of invoice items"
          );
        }
      }

      if (hasErrors(allErrors)) throw new ValidationError(allErrors);
    } else if (hasErrors(baseErrors)) {
      // Draft mode: only the base fields (invoice_number/date/expected_amount)
      // must be valid. Everything else may be incomplete and is still saved.
      throw new ValidationError(baseErrors);
    }

    const invoiceValues = {
      client_id: input.client_id ?? null,
      provider_id: input.provider_id ?? null,
      invoice_number: input.invoice_number!.trim(),
      invoice_date: input.invoice_date!,
      amount,
      expected_amount: input.expected_amount != null ? String(input.expected_amount) : null,
      status,
    };

    const result = id
      ? await invoiceRepository.updateWithItems(id, invoiceValues, resolved)
      : await invoiceRepository.createWithItems(invoiceValues, resolved);

    if (!result) throw new Error("Invoice not found");
    return result;
  },

  async remove(id: number) {
    const deleted = await invoiceRepository.softDelete(id);
    if (!deleted) throw new Error("Invoice not found");
    return deleted;
  },
};