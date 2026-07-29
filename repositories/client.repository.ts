import { db } from "@/db";
import { sql } from "kysely";
import type { NewClient, ClientUpdate } from "@/db/types";

export const clientRepository = {
  async list(params: { search?: string; limit?: number; offset?: number }) {
    let query = db
      .selectFrom("client")
      .selectAll()
      .where("deleted_at", "is", null);

    if (params.search) {
      const tokens = params.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
      for (const token of tokens) {
        query = query.where("name_parts", "@>", [token] as unknown as string[]);
      }
    }

    const total = await db
      .selectFrom("client")
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
      .selectFrom("client")
      .selectAll()
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .executeTakeFirst();
  },

  async findByNdisNumber(ndisNumber: string) {
    return db
      .selectFrom("client")
      .selectAll()
      .where("ndis_number", "=", ndisNumber)
      .where("deleted_at", "is", null)
      .execute();
  },

  async create(input: NewClient) {
    return db
      .insertInto("client")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();
  },

  async update(id: number, input: ClientUpdate) {
    return db
      .updateTable("client")
      .set({ ...input, updated_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },

  async softDelete(id: number) {
    return db
      .updateTable("client")
      .set({ deleted_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },
};
