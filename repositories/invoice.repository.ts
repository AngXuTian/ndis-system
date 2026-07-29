import { db } from "@/db";
import { sql } from "kysely";
import type { NewInvoice, InvoiceUpdate, NewInvoiceItem } from "@/db/types";

export interface ResolvedItem extends Omit<NewInvoiceItem, "invoice_id"> {
  id?: number;
}

export const invoiceRepository = {
  async list(params: {
    search?: string;
    clientId?: number;
    providerId?: number;
    limit?: number;
    offset?: number;
  }) {
    let query = db
      .selectFrom("invoice")
      .leftJoin("client", "client.id", "invoice.client_id")
      .leftJoin("provider", "provider.id", "invoice.provider_id")
      .select([
        "invoice.id",
        "invoice.invoice_number",
        "invoice.invoice_date",
        "invoice.amount",
        "invoice.expected_amount",
        "invoice.status",
        "invoice.client_id",
        "invoice.provider_id",
        "client.first_name as client_first_name",
        "client.last_name as client_last_name",
        "provider.name as provider_name",
      ])
      .where("invoice.deleted_at", "is", null);

    if (params.clientId) query = query.where("invoice.client_id", "=", params.clientId);
    if (params.providerId) query = query.where("invoice.provider_id", "=", params.providerId);
    if (params.search) {
      query = query.where("invoice.invoice_number", "ilike", `%${params.search}%`);
    }

    const totalRow = await db
      .selectFrom("invoice")
      .select(db.fn.countAll<number>().as("count"))
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const rows = await query
      .orderBy("invoice.created_at", "desc")
      .limit(params.limit ?? 20)
      .offset(params.offset ?? 0)
      .execute();

    return { rows, total: Number(totalRow?.count ?? 0) };
  },

  async findById(id: number) {
    const invoice = await db
      .selectFrom("invoice")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    if (!invoice) return null;

    const items = await db
      .selectFrom("invoice_item")
      .selectAll()
      .where("invoice_id", "=", id)
      .where("deleted_at", "is", null)
      .orderBy("sort_order", "asc")
      .orderBy("id", "asc")
      .execute();

    return { invoice, items };
  },

  async findByProviderAndNumber(providerId: number | null, invoiceNumber: string) {
    let query = db
      .selectFrom("invoice")
      .select(["id"])
      .where("deleted_at", "is", null)
      .where(sql`lower(invoice_number)`, "=", invoiceNumber.toLowerCase());

    query = providerId
      ? query.where("provider_id", "=", providerId)
      : query.where("provider_id", "is", null);

    return query.execute();
  },

  async createWithItems(invoiceInput: NewInvoice, items: ResolvedItem[]) {
    return db.transaction().execute(async (trx) => {
      const invoice = await trx
        .insertInto("invoice")
        .values(invoiceInput)
        .returningAll()
        .executeTakeFirstOrThrow();

      const insertedItems = items.length
        ? await trx
            .insertInto("invoice_item")
            .values(
              items.map((item, idx) => ({
                ...item,
                invoice_id: invoice.id,
                sort_order: idx,
              }))
            )
            .returningAll()
            .execute()
        : [];

      return { invoice, items: insertedItems };
    });
  },

  async updateWithItems(id: number, invoiceInput: InvoiceUpdate, items: ResolvedItem[]) {
    return db.transaction().execute(async (trx) => {
      const invoice = await trx
        .updateTable("invoice")
        .set({ ...invoiceInput, updated_at: sql`now()` })
        .where("id", "=", id)
        .where("deleted_at", "is", null)
        .returningAll()
        .executeTakeFirst();

      if (!invoice) return null;

      // Soft-delete existing items then re-insert current set.
      // Simpler and safer than diffing for a first implementation;
      // historical invoice_item rows still exist (deleted_at set), satisfying
      // "historical data must remain intact" as long as invoices aren't hard-deleted.
      await trx
        .updateTable("invoice_item")
        .set({ deleted_at: sql`now()` })
        .where("invoice_id", "=", id)
        .where("deleted_at", "is", null)
        .execute();

      const insertedItems = items.length
        ? await trx
            .insertInto("invoice_item")
            .values(
              items.map((item, idx) => ({
                ...item,
                invoice_id: id,
                sort_order: idx,
              }))
            )
            .returningAll()
            .execute()
        : [];

      return { invoice, items: insertedItems };
    });
  },

  async softDelete(id: number) {
    return db
      .updateTable("invoice")
      .set({ deleted_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },
};