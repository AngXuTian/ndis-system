import { invoiceRepository } from '@/repositories/invoice.repository';
import { invoiceDraftSchema, invoiceCompleteSchema } from '@/validations/invoice.validation';
import { db } from '@/db';

export class InvoiceService {
  async getAllInvoices() {
    return await invoiceRepository.findAll();
  }

  async getInvoiceById(id: number) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('INVOICE_NOT_FOUND');
    }
    return invoice;
  }

  async saveInvoice(rawInput: any, id?: number) {
    const isCompleted = rawInput.status === 'completed';

    // 1. Validate input payload
    const validated = isCompleted
      ? invoiceCompleteSchema.parse(rawInput)
      : invoiceDraftSchema.parse(rawInput);

    // 2. Enforce Unique Invoice Number per Provider (when provider_id is set)
    if (validated.provider_id) {
      const isUnique = await invoiceRepository.checkInvoiceNumberUnique(
        validated.provider_id,
        validated.invoice_number,
        id
      );
      if (!isUnique) {
        throw new Error(`Invoice number "${validated.invoice_number}" already exists for this provider.`);
      }
    }

    // Determine client pricing region for max_rate lookup
    let pricingRegion = 'VIC';
    if (validated.client_id) {
      const client = await db
        .selectFrom('client')
        .select('pricing_region')
        .where('id', '=', validated.client_id)
        .executeTakeFirst();
      if (client?.pricing_region) pricingRegion = client.pricing_region;
    }

    let derivedTotalAmount: number | null = null;
    const processedItems = [];

    // 3. Process line items if available
    if (validated.items && validated.items.length > 0) {
      let runningTotal = 0;
      let hasValidItemRates = false;

      for (const item of validated.items) {
        let rateSetId = item.rate_set_id ?? null;
        let maxRate = item.max_rate ?? null;
        let itemAmount = 0;

        // Calculate item amount if unit and input_rate are provided
        if (
          item.unit !== null &&
          item.unit !== undefined &&
          item.input_rate !== null &&
          item.input_rate !== undefined
        ) {
          hasValidItemRates = true;
          itemAmount = Number((Number(item.unit) * Number(item.input_rate)).toFixed(2));
          runningTotal += itemAmount;
        }

        // Rate set resolution via date range
        if (item.start_date && item.end_date) {
          const matchingRateSets = await invoiceRepository.findMatchingRateSets(
            item.start_date,
            item.end_date
          );

          if (matchingRateSets.length > 1) {
            if (isCompleted) {
              throw new Error(
                `Multiple overlapping rate sets found for date range ${item.start_date} - ${item.end_date}.`
              );
            }
          } else if (matchingRateSets.length === 1) {
            rateSetId = matchingRateSets[0].id;
          }
        }

        // Lookup max_rate
        if (rateSetId && item.support_item_id && item.start_date) {
          const foundMaxRate = await invoiceRepository.findMaxRatePrice(
            rateSetId,
            item.support_item_id,
            item.start_date,
            pricingRegion
          );
          if (foundMaxRate !== null) maxRate = foundMaxRate;
        }

        processedItems.push({
          ...item,
          rate_set_id: rateSetId,
          max_rate: maxRate,
          amount: itemAmount,
        });
      }

      if (hasValidItemRates) {
        derivedTotalAmount = Number(runningTotal.toFixed(2));
      } else {
        derivedTotalAmount = 0.00;
      }
    } else {
      // If no items exist, derived amount defaults to 0.00
      derivedTotalAmount = 0.00;
    }

    // 4. Completed validation check (if expected_amount is specified and items exist)
    if (isCompleted && processedItems.length > 0 && validated.expected_amount !== null && validated.expected_amount !== undefined) {
      const expected = Number(Number(validated.expected_amount).toFixed(2));
      if (derivedTotalAmount !== null && expected !== derivedTotalAmount) {
        throw new Error(
          `Expected Amount ($${expected.toFixed(2)}) does not match calculated Item Total ($${derivedTotalAmount.toFixed(2)}).`
        );
      }
    }

    const payload = {
      ...validated,
      amount: derivedTotalAmount,
      items: processedItems,
    };

    return await invoiceRepository.saveInvoice(payload, id);
  }

  async deleteInvoice(id: number) {
    await this.getInvoiceById(id);
    return await invoiceRepository.softDelete(id);
  }
}

export const invoiceService = new InvoiceService();