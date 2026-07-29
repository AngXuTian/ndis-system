import { db } from "@/db";
import { sql } from "kysely";
import type { NewProvider, ProviderUpdate } from "@/db/types";

export const providerRepository = {
  async list(params: { search?: string; limit?: number; offset?: number }) {
    let query = db
      .selectFrom("provider")
      .selectAll()
      .where("deleted_at", "is", null);

    if (params.search) {
      const tokens = params.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        query = query.where("name_parts", "@>", [token] as unknown as string[]);
      }
    }

    const total = await db
      .selectFrom("provider")
      .select(db.fn.countAll<number>().as("count"))
      .where("deleted_at", "is", null)
      .executeTakeFirst();

    const rows = await query
      .orderBy("created_at", "desc")
      .limit(params.limit ?? 20)
      .offset(params.offset ?? 0)
      .execute();

    return { rows, total: Number(total?.count ?? 0) };
  },

  async findById(id: number) {
    return db
      .selectFrom("provider")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
  },

  async findByAbn(abn: string) {
    return db
      .selectFrom("provider")
      .selectAll()
      .where("abn", "=", abn)
      .where("deleted_at", "is", null)
      .execute();
  },

  async create(input: NewProvider) {
    return db
      .insertInto("provider")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(id: number, input: ProviderUpdate) {
    return db
      .updateTable("provider")
      .set({ ...input, updated_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },

  async softDelete(id: number) {
    return db
      .updateTable("provider")
      .set({ deleted_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },
};