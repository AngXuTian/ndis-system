import { db } from "@/db";
import { sql } from "kysely";
import type { NewRateSet, RateSetUpdate } from "@/db/types";

export const rateSetRepository = {
  async list(params: { limit?: number; offset?: number }) {
    const total = await db
      .selectFrom("rate_set")
      .select(db.fn.countAll<number>().as("count"))
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const rows = await db
      .selectFrom("rate_set")
      .selectAll()
      .where("deleted_at", "is", null)
      .orderBy("start_date", "desc")
      .limit(params.limit ?? 20)
      .offset(params.offset ?? 0)
      .execute();

    return { rows, total: Number(total?.count ?? 0) };
  },

  async findById(id: number) {
    return db
      .selectFrom("rate_set")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
  },

  async create(input: NewRateSet) {
    return db.insertInto("rate_set").values(input).returningAll().executeTakeFirstOrThrow();
  },

  async update(id: number, input: RateSetUpdate) {
    return db
      .updateTable("rate_set")
      .set({ ...input, updated_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },

  async softDelete(id: number) {
    return db
      .updateTable("rate_set")
      .set({ deleted_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },

  async summary(id: number) {
    const categoryCount = await db
      .selectFrom("rate_set_category")
      .select(db.fn.countAll<number>().as("count"))
      .where("rate_set_id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const itemCount = await db
      .selectFrom("rate_set_support_item")
      .select(db.fn.countAll<number>().as("count"))
      .where("rate_set_id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const priceCount = await db
      .selectFrom("rate_set_support_item_price")
      .select(db.fn.countAll<number>().as("count"))
      .where("rate_set_id", "=", id)
      .executeTakeFirst();

    return {
      categories: Number(categoryCount?.count ?? 0),
      supportItems: Number(itemCount?.count ?? 0),
      prices: Number(priceCount?.count ?? 0),
    };
  },
};