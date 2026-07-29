import { db } from "@/db";
import { sql } from "kysely";

export interface RateSetMatch {
  rateSetId: number | null;
  multipleMatches: boolean;
}

/**
 * Find the rate_set overlapping the given [startDate, endDate] range.
 * A rate set matches if: rate_set.start_date <= endDate AND
 * (rate_set.end_date IS NULL OR rate_set.end_date >= startDate)
 */
export async function findMatchingRateSet(startDate: Date, endDate: Date): Promise<RateSetMatch> {
  const rows = await db
    .selectFrom("rate_set")
    .select(["id"])
    .where("deleted_at", "is", null)
    .where("start_date", "<=", endDate)
    .where((eb) => eb.or([eb("end_date", "is", null), eb("end_date", ">=", startDate)]))
    .execute();

  if (rows.length === 0) return { rateSetId: null, multipleMatches: false };
  if (rows.length > 1) return { rateSetId: null, multipleMatches: true };
  return { rateSetId: rows[0].id, multipleMatches: false };
}

/**
 * Find the matching rate_set_support_item_price.unit_price for an invoice item.
 * Ranking on multiple matches: latest start_date, then latest (open-ended/NULL
 * treated as furthest-future) end_date, then highest id.
 */
export async function findMatchingPrice(params: {
  rateSetId: number;
  supportItemId: number;
  startDate: Date;
  endDate: Date;
  pricingRegion: string;
}): Promise<{ id: number; unitPrice: string } | null> {
  const row = await db
    .selectFrom("rate_set_support_item_price")
    .select(["id", "unit_price"])
    .where("rate_set_id", "=", params.rateSetId)
    .where("support_item_id", "=", params.supportItemId)
    .where("pricing_region_code", "=", params.pricingRegion)
    .where("start_date", "<=", params.endDate)
    .where((eb) => eb.or([eb("end_date", "is", null), eb("end_date", ">=", params.startDate)]))
    .orderBy("start_date", "desc")
    .orderBy(sql`end_date desc nulls first`)
    .orderBy("id", "desc")
    .limit(1)
    .executeTakeFirst();

  if (!row || row.unit_price === null) return null;
  return { id: row.id, unitPrice: row.unit_price };
}