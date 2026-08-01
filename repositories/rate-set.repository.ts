import { db } from "@/db";
import { sql, Insertable, Updateable } from "kysely";
import type { RateSet } from "@/db/types";

export interface RateSetItemsTableFilters {
  categoryId?: number;
  supportItemId?: number;
  typeId?: number;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface RateSetItemTableRow {
  support_item_id: number;
  item_number: string;
  item_name: string;
  category_number: string;
  category_name: string;
  unit: string | null;
  type_id: number | null;
  type_label: string | null;
  start_date: string | null;
  end_date: string | null;
  region_prices: Record<string, string> | null;
  attributes: Record<string, boolean> | null;
}

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

  async create(input: Insertable<RateSet>) {
    return db.insertInto("rate_set").values(input).returningAll().executeTakeFirstOrThrow();
  },

  async update(id: number, input: Updateable<RateSet>) {
    return db
      .updateTable("rate_set")
      .set({ ...input, updated_at: sql`now()` })
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  },

  async clearRateSetItemsForImport(rateSetId: number, trx = db) {
    await trx
      .deleteFrom("rate_set_support_item_price")
      .where("rate_set_id", "=", rateSetId)
      .execute();
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

  // Options for the filter row above the items table (categories, items,
  // types, and the min/max unit price bounds for the price range slider).
  async filterOptions(rateSetId: number) {
    const categories = await db
      .selectFrom("rate_set_category")
      .select(["id", "category_number", "category_name"])
      .where("rate_set_id", "=", rateSetId)
      .where("deleted_at", "is", null)
      .orderBy("sorting")
      .execute();

    const supportItems = await db
      .selectFrom("rate_set_support_item")
      .select(["id", "item_number", "item_name", "category_id"])
      .where("rate_set_id", "=", rateSetId)
      .where("deleted_at", "is", null)
      .orderBy("sorting")
      .execute();

    const types = await db
      .selectFrom("rate_set_support_item_type")
      .select(["id", "code", "label"])
      .where("deactivated_at", "is", null)
      .orderBy("label")
      .execute();

    const priceRange = await db
      .selectFrom("rate_set_support_item_price")
      .select([
        sql<string | null>`min(unit_price)`.as("min"),
        sql<string | null>`max(unit_price)`.as("max"),
      ])
      .where("rate_set_id", "=", rateSetId)
      .executeTakeFirst();

    return {
      categories,
      supportItems,
      types,
      priceRange: {
        min: priceRange?.min ? Number(priceRange.min) : 0,
        max: priceRange?.max ? Number(priceRange.max) : 0,
      },
    };
  },

  // Pivoted support-item x pricing-region table backing the rate set edit
  // screen. One row per (support_item, type, start_date, end_date) combo,
  // with region prices and boolean attributes aggregated into JSON objects
  // via LATERAL joins rather than one row per region.
  async itemsTable(rateSetId: number, filters: RateSetItemsTableFilters) {
    const conditions = [sql`true`];

    if (filters.categoryId) conditions.push(sql`it.category_id = ${filters.categoryId}`);
    if (filters.supportItemId) conditions.push(sql`it.id = ${filters.supportItemId}`);
    if (filters.typeId) conditions.push(sql`c.type_id = ${filters.typeId}`);
    if (filters.startDate) conditions.push(sql`(c.end_date is null or c.end_date >= ${filters.startDate})`);
    if (filters.endDate) conditions.push(sql`c.start_date <= ${filters.endDate}`);
    if (filters.minPrice != null || filters.maxPrice != null) {
      const priceConditions = [
        sql`p2.support_item_id = it.id`,
        sql`p2.type_id is not distinct from c.type_id`,
        sql`p2.start_date = c.start_date`,
        sql`p2.end_date is not distinct from c.end_date`,
        sql`p2.unit_price is not null`,
      ];
      if (filters.minPrice != null) priceConditions.push(sql`p2.unit_price >= ${filters.minPrice}`);
      if (filters.maxPrice != null) priceConditions.push(sql`p2.unit_price <= ${filters.maxPrice}`);
      conditions.push(sql`exists (select 1 from rate_set_support_item_price p2 where ${sql.join(priceConditions, sql` and `)})`);
    }

    const whereSql = sql.join(conditions, sql` and `);

    const query = sql<RateSetItemTableRow>`
      with items as (
        select si.id, si.item_number, si.item_name, si.unit, si.category_id, si.sorting,
               cat.category_number, cat.category_name, cat.sorting as cat_sorting
        from rate_set_support_item si
        join rate_set_category cat on cat.id = si.category_id
        where si.rate_set_id = ${rateSetId} and si.deleted_at is null
      ),
      combos as (
        select distinct support_item_id, type_id, start_date, end_date
        from rate_set_support_item_price
        where rate_set_id = ${rateSetId}
      )
      select
        it.id as support_item_id,
        it.item_number,
        it.item_name,
        it.category_number,
        it.category_name,
        it.unit,
        c.type_id,
        t.label as type_label,
        c.start_date,
        c.end_date,
        prices.region_prices,
        attrs.attrs as attributes
      from items it
      left join combos c on c.support_item_id = it.id
      left join rate_set_support_item_type t on t.id = c.type_id
      left join lateral (
        select jsonb_object_agg(p.pricing_region_code, p.unit_price) as region_prices
        from rate_set_support_item_price p
        where p.support_item_id = it.id
          and p.type_id is not distinct from c.type_id
          and p.start_date = c.start_date
          and p.end_date is not distinct from c.end_date
      ) prices on true
      left join lateral (
        select jsonb_object_agg(a.attribute_code, a.value) as attrs
        from rate_set_support_item_attribute a
        where a.support_item_id = it.id
      ) attrs on true
      where ${whereSql}
      order by it.cat_sorting, it.sorting, c.start_date desc nulls last
    `;

    const result = await query.execute(db);
    return result.rows;
  },
};