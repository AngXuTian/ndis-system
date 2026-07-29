import { db } from "@/db";
import { sql } from "kysely";
import { equalsDecimal } from "@/lib/money";
import {
  parseNdisCatalogue,
  REGION_COLUMNS,
  type ParsedCatalogueRow,
} from "@/modules/rate-set/ndis-catalogue-parser";

export interface ImportSummary {
  processedSheets: string[];
  skippedSheets: string[];
  categories: { inserted: number; updated: number; reactivated: number; deactivated: number };
  supportItems: { inserted: number; updated: number; reactivated: number; deactivated: number };
  attributes: { inserted: number; updated: number };
  prices: { inserted: number; updated: number; deleted: number; unchanged: number };
}

const ATTRIBUTE_FIELD_MAP = [
  ["IS_QUOTE_REQUIRED", "isQuoteRequired"],
  ["IS_NF2F_SUPPORT_PROVISION", "isNf2fSupportProvision"],
  ["IS_PROVIDER_TRAVEL", "isProviderTravel"],
  ["IS_SHORT_NOTICE_CANCEL", "isShortNoticeCancel"],
  ["IS_NDIA_REQUESTED_REPORTS", "isNdiaRequestedReports"],
] as const;

function slugifyTypeCode(label: string): string {
  return label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

export async function importNdisCatalogue(rateSetId: number, fileBuffer: Buffer): Promise<ImportSummary> {
  const { rows, skippedSheets, processedSheets } = parseNdisCatalogue(fileBuffer);

  const summary: ImportSummary = {
    processedSheets,
    skippedSheets,
    categories: { inserted: 0, updated: 0, reactivated: 0, deactivated: 0 },
    supportItems: { inserted: 0, updated: 0, reactivated: 0, deactivated: 0 },
    attributes: { inserted: 0, updated: 0 },
    prices: { inserted: 0, updated: 0, deleted: 0, unchanged: 0 },
  };

  const targetCategories = new Map<string, { category_number: string; category_name: string; sorting: number }>();
  const targetItems = new Map<
    string,
    { category_number: string; item_number: string; item_name: string; unit: string | null; sorting: number }
  >();
  const rowsByItemKey = new Map<string, ParsedCatalogueRow[]>();

  let categorySortCounter = 0;
  let itemSortCounter = 0;
  const seenCategorySort = new Set<string>();

  for (const row of rows) {
    if (!row.categoryNumber || !row.itemNumber) continue;

    if (!targetCategories.has(row.categoryNumber)) {
      targetCategories.set(row.categoryNumber, {
        category_number: row.categoryNumber,
        category_name: row.categoryName,
        sorting: seenCategorySort.has(row.categoryNumber) ? 0 : categorySortCounter++,
      });
      seenCategorySort.add(row.categoryNumber);
    }

    const itemKey = `${row.categoryNumber}::${row.itemNumber}`;
    if (!targetItems.has(itemKey)) {
      targetItems.set(itemKey, {
        category_number: row.categoryNumber,
        item_number: row.itemNumber,
        item_name: row.itemName,
        unit: row.unit,
        sorting: itemSortCounter++,
      });
    }

    if (!rowsByItemKey.has(itemKey)) rowsByItemKey.set(itemKey, []);
    rowsByItemKey.get(itemKey)!.push(row);
  }

  await db.transaction().execute(async (trx) => {
    // ---- Categories ----
    const existingCategories = await trx
      .selectFrom("rate_set_category")
      .selectAll()
      .where("rate_set_id", "=", rateSetId)
      .execute();

    const existingCategoryByNumber = new Map(existingCategories.map((c) => [c.category_number, c]));
    const categoryIdByNumber = new Map<string, number>();

    for (const [categoryNumber, target] of targetCategories) {
      const existing = existingCategoryByNumber.get(categoryNumber);

      if (!existing) {
        const inserted = await trx
          .insertInto("rate_set_category")
          .values({
            rate_set_id: rateSetId,
            category_number: target.category_number,
            category_name: target.category_name,
            sorting: target.sorting,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        categoryIdByNumber.set(categoryNumber, inserted.id);
        summary.categories.inserted++;
        continue;
      }

      categoryIdByNumber.set(categoryNumber, existing.id);

      const changed =
        existing.category_name !== target.category_name ||
        existing.sorting !== target.sorting ||
        existing.deleted_at !== null ||
        existing.deactivated_at !== null;

      if (changed) {
        await trx
          .updateTable("rate_set_category")
          .set({
            category_name: target.category_name,
            sorting: target.sorting,
            deleted_at: null,
            deactivated_at: null,
            updated_at: sql`now()`,
          })
          .where("id", "=", existing.id)
          .execute();

        if (existing.deleted_at !== null || existing.deactivated_at !== null) {
          summary.categories.reactivated++;
        } else {
          summary.categories.updated++;
        }
      }
    }

    for (const existing of existingCategories) {
      if (!targetCategories.has(existing.category_number) && !existing.deactivated_at && !existing.deleted_at) {
        await trx
          .updateTable("rate_set_category")
          .set({ deactivated_at: sql`now()`, updated_at: sql`now()` })
          .where("id", "=", existing.id)
          .execute();
        summary.categories.deactivated++;
      }
    }

    // ---- Support items ----
    const existingItems = await trx
      .selectFrom("rate_set_support_item")
      .selectAll()
      .where("rate_set_id", "=", rateSetId)
      .execute();

    const existingItemByKey = new Map(
      existingItems.map((i) => [`${i.category_id}::${i.item_number}`, i])
    );
    const itemIdByKey = new Map<string, number>();

    for (const [itemKey, target] of targetItems) {
      const categoryId = categoryIdByNumber.get(target.category_number);
      if (!categoryId) continue;

      const dbKey = `${categoryId}::${target.item_number}`;
      const existing = existingItemByKey.get(dbKey);

      if (!existing) {
        const inserted = await trx
          .insertInto("rate_set_support_item")
          .values({
            rate_set_id: rateSetId,
            category_id: categoryId,
            item_number: target.item_number,
            item_name: target.item_name,
            unit: target.unit,
            sorting: target.sorting,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        itemIdByKey.set(itemKey, inserted.id);
        summary.supportItems.inserted++;
        continue;
      }

      itemIdByKey.set(itemKey, existing.id);

      const changed =
        existing.item_name !== target.item_name ||
        existing.unit !== target.unit ||
        existing.sorting !== target.sorting ||
        existing.deleted_at !== null ||
        existing.deactivated_at !== null;

      if (changed) {
        await trx
          .updateTable("rate_set_support_item")
          .set({
            item_name: target.item_name,
            unit: target.unit,
            sorting: target.sorting,
            deleted_at: null,
            deactivated_at: null,
            updated_at: sql`now()`,
          })
          .where("id", "=", existing.id)
          .execute();

        if (existing.deleted_at !== null || existing.deactivated_at !== null) {
          summary.supportItems.reactivated++;
        } else {
          summary.supportItems.updated++;
        }
      }
    }

    for (const existing of existingItems) {
      const stillPresent = [...targetItems.values()].some((t) => {
        const categoryId = categoryIdByNumber.get(t.category_number);
        return categoryId === existing.category_id && t.item_number === existing.item_number;
      });
      if (!stillPresent && !existing.deactivated_at && !existing.deleted_at) {
        await trx
          .updateTable("rate_set_support_item")
          .set({ deactivated_at: sql`now()`, updated_at: sql`now()` })
          .where("id", "=", existing.id)
          .execute();
        summary.supportItems.deactivated++;
      }
    }

    // ---- Attributes: last row per item wins ----
    for (const [itemKey, itemRows] of rowsByItemKey) {
      const supportItemId = itemIdByKey.get(itemKey);
      if (!supportItemId) continue;
      const lastRow = itemRows[itemRows.length - 1];

      const existingAttrs = await trx
        .selectFrom("rate_set_support_item_attribute")
        .selectAll()
        .where("support_item_id", "=", supportItemId)
        .execute();
      const existingAttrByCode = new Map(existingAttrs.map((a) => [a.attribute_code, a]));

      for (const [code, field] of ATTRIBUTE_FIELD_MAP) {
        const value = lastRow[field];
        const existing = existingAttrByCode.get(code);

        if (!existing) {
          await trx
            .insertInto("rate_set_support_item_attribute")
            .values({ support_item_id: supportItemId, attribute_code: code, value })
            .execute();
          summary.attributes.inserted++;
        } else if (existing.value !== value) {
          await trx
            .updateTable("rate_set_support_item_attribute")
            .set({ value })
            .where("id", "=", existing.id)
            .execute();
          summary.attributes.updated++;
        }
      }
    }

    // ---- Types: upsert by slugified code ----
    const typeIdByCode = new Map<string, number>();
    const distinctTypeLabels = new Set(
      rows.map((r) => r.typeLabel).filter((t): t is string => Boolean(t))
    );
    for (const label of distinctTypeLabels) {
      const code = slugifyTypeCode(label);
      const existing = await trx
        .selectFrom("rate_set_support_item_type")
        .selectAll()
        .where("code", "=", code)
        .executeTakeFirst();

      if (existing) {
        typeIdByCode.set(code, existing.id);
      } else {
        const inserted = await trx
          .insertInto("rate_set_support_item_type")
          .values({ code, label })
          .returningAll()
          .executeTakeFirstOrThrow();
        typeIdByCode.set(code, inserted.id);
      }
    }

    // ---- Prices: one row per (item, region, date range). No soft-delete
    // column exists on this table, so missing rows are hard-deleted — safe
    // because invoice_item copies max_rate at creation time rather than
    // holding a price_id FK, so historical invoices are unaffected.
    const existingPrices = await trx
      .selectFrom("rate_set_support_item_price")
      .selectAll()
      .where("rate_set_id", "=", rateSetId)
      .execute();

    const priceKey = (p: {
      support_item_id: number;
      type_id: number | null;
      pricing_region_code: string | null;
      start_date: unknown;
      end_date: unknown;
    }) =>
      [
        p.support_item_id,
        p.type_id ?? "null",
        p.pricing_region_code ?? "null",
        new Date(p.start_date as string).toISOString().slice(0, 10),
        p.end_date ? new Date(p.end_date as string).toISOString().slice(0, 10) : "null",
      ].join("::");

    const existingPriceByKey = new Map(existingPrices.map((p) => [priceKey(p), p]));
    const targetPriceKeys = new Set<string>();

    for (const [itemKey, itemRows] of rowsByItemKey) {
      const supportItemId = itemIdByKey.get(itemKey);
      if (!supportItemId) continue;

      for (const row of itemRows) {
        const typeId = row.typeLabel ? typeIdByCode.get(slugifyTypeCode(row.typeLabel)) ?? null : null;

        for (const region of REGION_COLUMNS) {
          const unitPrice = row.prices[region] ?? null;

          const candidateKey = [
            supportItemId,
            typeId ?? "null",
            region,
            row.startDate,
            row.endDate ?? "null",
          ].join("::");
          targetPriceKeys.add(candidateKey);

          const existing = existingPriceByKey.get(candidateKey);
          // Compare numerically, not by string equality — Postgres returns
          // numeric(24,4) as "75.8200" while the parser produces "75.82".
          const pricesEqual =
            existing !== undefined &&
            ((existing.unit_price === null && unitPrice === null) ||
              (existing.unit_price !== null &&
                unitPrice !== null &&
                equalsDecimal(existing.unit_price, unitPrice)));

          if (!existing) {
            await trx
              .insertInto("rate_set_support_item_price")
              .values({
                rate_set_id: rateSetId,
                support_item_id: supportItemId,
                type_id: typeId,
                pricing_region_code: region,
                unit_price: unitPrice,
                start_date: row.startDate,
                end_date: row.endDate,
              })
              .execute();
            summary.prices.inserted++;
          } else if (!pricesEqual) {
            await trx
              .updateTable("rate_set_support_item_price")
              .set({ unit_price: unitPrice, updated_at: sql`now()` })
              .where("id", "=", existing.id)
              .execute();
            summary.prices.updated++;
          } else {
            summary.prices.unchanged++;
          }
        }
      }
    }

    for (const existing of existingPrices) {
      if (!targetPriceKeys.has(priceKey(existing))) {
        await trx.deleteFrom("rate_set_support_item_price").where("id", "=", existing.id).execute();
        summary.prices.deleted++;
      }
    }
  });

  return summary;
}