import { db } from '@/db';
import { sql, Selectable } from 'kysely';
import { Invoice } from '@/db/types';

export class InvoiceRepository {
  async list() {
    return await this.findAll(); 
  }


  async findAll(): Promise<any[]> {
    return await db
      .selectFrom('invoice')
      .leftJoin('client', 'client.id', 'invoice.client_id')
      .leftJoin('provider', 'provider.id', 'invoice.provider_id')
      .selectAll('invoice')
      .select([
        'client.first_name as client_first_name',
        'client.last_name as client_last_name',
        'provider.name as provider_name',
      ])
      .where('invoice.deleted_at', 'is', null)
      .orderBy('invoice.id', 'desc')
      .execute();
  }

  async findById(id: number): Promise<any> {
    const invoice = await db
      .selectFrom('invoice')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!invoice) return undefined;

    const items = await db
      .selectFrom('invoice_item')
      .selectAll()
      .where('invoice_id', '=', id)
      .where('deleted_at', 'is', null)
      .orderBy('sort_order', 'asc')
      .execute();

    return { ...invoice, items };
  }

  async checkInvoiceNumberUnique(providerId: number | null | undefined, invoiceNumber: string | null | undefined, excludeInvoiceId?: number): Promise<boolean> {
    if (!providerId || !invoiceNumber) return true;

    let query = db
      .selectFrom('invoice')
      .select('id')
      .where('provider_id', '=', providerId)
      .where('invoice_number', '=', invoiceNumber)
      .where('deleted_at', 'is', null);

    if (excludeInvoiceId) {
      query = query.where('id', '!=', excludeInvoiceId);
    }

    const existing = await query.executeTakeFirst();
    return !existing;
  }

  async findMatchingRateSets(startDate: string, endDate: string): Promise<any[]> {
    return await db
      .selectFrom('rate_set')
      .selectAll()
      .where('deactivated_at', 'is', null)
      .where('deleted_at', 'is', null)
      .where('start_date', '<=', new Date(endDate))
      .where((eb) =>
        eb.or([
          eb('end_date', 'is', null),
          eb('end_date', '>=', new Date(startDate)),
        ])
      )
      .execute();
  }

  async findMaxRatePrice(
    rateSetId: number,
    supportItemId: number,
    startDate: string,
    pricingRegion: string
  ): Promise<number | null> {
    const priceRecord = await db
      .selectFrom('rate_set_support_item_price')
      .selectAll()
      .where('rate_set_id', '=', rateSetId)
      .where('support_item_id', '=', supportItemId)
      .where('start_date', '<=', new Date(startDate))
      .where((eb) =>
        eb.or([
          eb('pricing_region_code', '=', pricingRegion),
          eb('pricing_region_code', 'is', null),
        ])
      )
      .orderBy('start_date', 'desc')
      .orderBy('end_date', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();

    return priceRecord && priceRecord.unit_price ? Number(priceRecord.unit_price) : null;
  }

  async saveInvoice(payload: any, id?: number): Promise<Selectable<Invoice>> {
    return await db.transaction().execute(async (trx) => {
      let invoiceRecord: Selectable<Invoice>;

      if (id) {
        invoiceRecord = await trx
          .updateTable('invoice')
          .set({
            client_id: payload.client_id ?? null,
            provider_id: payload.provider_id ?? null,
            invoice_number: payload.invoice_number,
            invoice_date: payload.invoice_date ? new Date(payload.invoice_date) : null,
            status: payload.status,
            amount: payload.amount !== null ? String(payload.amount.toFixed(2)) : null,
            expected_amount: payload.expected_amount !== null ? String(payload.expected_amount.toFixed(2)) : null,
            updated_at: sql`now()`,
          })
          .where('id', '=', id)
          .returningAll()
          .executeTakeFirstOrThrow();

        // Soft-delete old line items
        await trx
          .updateTable('invoice_item')
          .set({ deleted_at: sql`now()` })
          .where('invoice_id', '=', id)
          .execute();
      } else {
        invoiceRecord = await trx
          .insertInto('invoice')
          .values({
            client_id: payload.client_id ?? null,
            provider_id: payload.provider_id ?? null,
            invoice_number: payload.invoice_number,
            invoice_date: payload.invoice_date ? new Date(payload.invoice_date) : null,
            status: payload.status,
            amount: payload.amount !== null ? String(payload.amount.toFixed(2)) : null,
            expected_amount: payload.expected_amount !== null ? String(payload.expected_amount.toFixed(2)) : null,
            updated_at: sql`now()`,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
      }

      // Insert line items
      if (payload.items && payload.items.length > 0) {
        await trx
          .insertInto('invoice_item')
          .values(
            payload.items.map((item: any, idx: number) => ({
              invoice_id: invoiceRecord.id,
              support_item_id: item.support_item_id ?? null,
              category_id: item.category_id ?? null,
              rate_set_id: item.rate_set_id ?? null,
              start_date: item.start_date ? new Date(item.start_date) : null,
              end_date: item.end_date ? new Date(item.end_date) : null,
              unit: item.unit !== undefined && item.unit !== null ? String(Number(item.unit).toFixed(2)) : null,
              input_rate: item.input_rate !== undefined && item.input_rate !== null ? String(Number(item.input_rate).toFixed(2)) : null,
              max_rate: item.max_rate !== undefined && item.max_rate !== null ? String(Number(item.max_rate).toFixed(2)) : null,
              amount: item.amount !== undefined && item.amount !== null ? String(Number(item.amount).toFixed(2)) : null,
              sort_order: idx + 1,
              created_at: sql`now()`,
              updated_at: sql`now()`,
            }))
          )
          .execute();
      }

      return invoiceRecord;
    });
  }

  async softDelete(id: number): Promise<void> {
    await db
      .updateTable('invoice')
      .set({ deleted_at: sql`now()`, updated_at: sql`now()` })
      .where('id', '=', id)
      .execute();
  }
}

export const invoiceRepository = new InvoiceRepository();