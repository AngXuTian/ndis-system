import * as XLSX from 'xlsx';
import { db } from '@/db';
import { sql } from 'kysely';

interface RegionDefinition {
  colIndex: number;
  code: string;
  label: string;
  full_label: string;
}

interface AttributeDefinition {
  colIndex: number;
  code: string;
  label: string;
}

interface ImportResult {
  success: boolean;
  processedRows: number;
}

export class RateSetImportService {
  private normalizeCode(text: string): string {
    return text.trim().toUpperCase().replace(/\s+/g, '_');
  }

  private parseBooleanValue(val: unknown): boolean {
    if (!val) return false;
    const str = String(val).trim().toUpperCase();
    return str === 'YES' || str === 'Y';
  }

  /**
   * NDIS catalogue "Start date" / "End Date" columns are exported as
   * YYYYMMDD, either as a string ("20240701") or a bare number (20240701).
   * They are NOT ISO-8601, so `new Date(String(val))` silently produces
   * an Invalid Date (all fields NaN), which Postgres then rejects with
   * "invalid input syntax for type timestamp with time zone".
   *
   * This also handles the case where `cellDates: true` already converted
   * the cell into a real JS Date (e.g. if a sheet uses a date-formatted
   * cell instead of plain text/number).
   */
  private parseNdisDate(val: unknown): Date | null {
    if (val === undefined || val === null || val === '') return null;

    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }

    const str = String(val).trim();

    // YYYYMMDD (8 digits) - the format actually used in the catalogue
    const match = str.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      // Use UTC to avoid local-timezone shifting the date by a day
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      return isNaN(date.getTime()) ? null : date;
    }

    // Fallback: try native parsing for anything already ISO-ish
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
  }

  async importExcelToRateSet(rateSetId: number, fileBuffer: Buffer): Promise<ImportResult> {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

    // Codes match the primary keys in rate_set_support_item_pricing_region
    const regionalColumns: RegionDefinition[] = [
      { colIndex: 12, code: 'ACT', label: 'ACT', full_label: 'Australian Capital Territory' },
      { colIndex: 13, code: 'NSW', label: 'NSW', full_label: 'New South Wales' },
      { colIndex: 14, code: 'NT', label: 'NT', full_label: 'Northern Territory' },
      { colIndex: 15, code: 'QLD', label: 'QLD', full_label: 'Queensland' },
      { colIndex: 16, code: 'SA', label: 'SA', full_label: 'South Australia' },
      { colIndex: 17, code: 'TAS', label: 'TAS', full_label: 'Tasmania' },
      { colIndex: 18, code: 'VIC', label: 'VIC', full_label: 'Victoria' },
      { colIndex: 19, code: 'WA', label: 'WA', full_label: 'Western Australia' },
      { colIndex: 20, code: 'REMOTE', label: 'Remote', full_label: 'Remote' },
      { colIndex: 21, code: 'VERY REMOTE', label: 'Very Remote', full_label: 'Very Remote' },
    ];

    const attributeColumns: AttributeDefinition[] = [
      { colIndex: 9, code: 'IS_QUOTE_REQUIRED', label: 'Quote' },
      { colIndex: 22, code: 'IS_NF2F_SUPPORT_PROVISION', label: 'Non-Face-to-Face Support Provision' },
      { colIndex: 23, code: 'IS_PROVIDER_TRAVEL', label: 'Provider Travel' },
      { colIndex: 24, code: 'IS_SHORT_NOTICE_CANCEL', label: 'Short Notice Cancellations.' },
      { colIndex: 25, code: 'IS_NDIA_REQUESTED_REPORTS', label: 'NDIA Requested Reports' },
      { colIndex: 26, code: 'IS_IRREGULAR_SIL_SUPPORTS', label: 'Irregular SIL Supports' },
    ];

    let totalRowsProcessed = 0;

    await db.transaction().execute(async (trx) => {
      // 1. Clear existing price records for this rate set to prevent exclusion constraint overlaps
      await trx
        .deleteFrom('rate_set_support_item_price')
        .where('rate_set_id', '=', rateSetId)
        .execute();

      // 2. Safely upsert attribute types
      for (const attr of attributeColumns) {
        await trx
          .insertInto('rate_set_support_item_attribute_type')
          .values({ code: attr.code, label: attr.label })
          .onConflict((oc) =>
            oc.column('code').doUpdateSet({ label: attr.label })
          )
          .execute();
      }

      // 3. Safely upsert pricing regions matching code primary key
      for (const reg of regionalColumns) {
        await trx
          .insertInto('rate_set_support_item_pricing_region')
          .values({ code: reg.code, label: reg.label, full_label: reg.full_label })
          .onConflict((oc) =>
            oc.column('code').doUpdateSet({
              label: reg.label,
              full_label: reg.full_label,
            })
          )
          .execute();
      }

      const categoryMap = new Map<string, number>();
      const typeMap = new Map<string, number>();

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const dataRows = rows.slice(1);

        for (const row of dataRows) {
          if (!row || !row[0]) continue;

          const itemNumber = String(row[0]).trim();
          const itemName = String(row[1] || '').trim();
          const categoryNumber = String(row[5] || row[4] || '').trim();
          const categoryName = String(row[7] || row[6] || '').trim();
          const unit = row[8] ? String(row[8]).trim() : null;
          const startDate = this.parseNdisDate(row[10]) ?? new Date();
          const endDate = this.parseNdisDate(row[11]);
          const rawType = row[27] ? String(row[27]).trim() : null;

          if (!itemNumber || !categoryNumber) continue;

          let categoryId = categoryMap.get(categoryNumber);
          if (!categoryId) {
            const existingCat = await trx
              .selectFrom('rate_set_category')
              .select('id')
              .where('rate_set_id', '=', rateSetId)
              .where('category_number', '=', categoryNumber)
              .executeTakeFirst();

            if (existingCat) {
              categoryId = existingCat.id;
            } else {
              const insertedCat = await trx
                .insertInto('rate_set_category')
                .values({
                  rate_set_id: rateSetId,
                  category_number: categoryNumber,
                  category_name: categoryName || 'Uncategorized',
                  sorting: parseInt(categoryNumber, 10) || 0,
                  updated_at: sql`now()`,
                })
                .returning('id')
                .executeTakeFirstOrThrow();

              categoryId = insertedCat.id;
            }
            categoryMap.set(categoryNumber, categoryId);
          }

          let typeId: number | null = null;
          if (rawType) {
            const typeCode = this.normalizeCode(rawType);
            if (typeMap.has(typeCode)) {
              typeId = typeMap.get(typeCode)!;
            } else {
              const existingType = await trx
                .selectFrom('rate_set_support_item_type')
                .select('id')
                .where('code', '=', typeCode)
                .executeTakeFirst();

              if (existingType) {
                typeId = existingType.id;
              } else {
                const insertedType = await trx
                  .insertInto('rate_set_support_item_type')
                  .values({ code: typeCode, label: rawType })
                  .returning('id')
                  .executeTakeFirstOrThrow();

                typeId = insertedType.id;
              }
              typeMap.set(typeCode, typeId);
            }
          }

          let supportItemId: number;
          const existingItem = await trx
            .selectFrom('rate_set_support_item')
            .select('id')
            .where('rate_set_id', '=', rateSetId)
            .where('category_id', '=', categoryId)
            .where('item_number', '=', itemNumber)
            .executeTakeFirst();

          if (existingItem) {
            await trx
              .updateTable('rate_set_support_item')
              .set({ item_name: itemName, unit: unit, updated_at: sql`now()` })
              .where('id', '=', existingItem.id)
              .execute();

            supportItemId = existingItem.id;
          } else {
            const newItem = await trx
              .insertInto('rate_set_support_item')
              .values({
                rate_set_id: rateSetId,
                category_id: categoryId,
                item_number: itemNumber,
                item_name: itemName,
                unit: unit,
                updated_at: sql`now()`,
              })
              .returning('id')
              .executeTakeFirstOrThrow();

            supportItemId = newItem.id;
          }

          for (const attr of attributeColumns) {
            const boolVal = this.parseBooleanValue(row[attr.colIndex]);
            await trx
              .insertInto('rate_set_support_item_attribute')
              .values({
                support_item_id: supportItemId,
                attribute_code: attr.code,
                value: boolVal,
              })
              .onConflict((oc) =>
                oc.columns(['support_item_id', 'attribute_code']).doUpdateSet({ value: boolVal })
              )
              .execute();
          }

          for (const reg of regionalColumns) {
            const priceVal = row[reg.colIndex];
            if (priceVal !== undefined && priceVal !== null && priceVal !== '') {
              const numericPrice = parseFloat(String(priceVal).replace(/[$,]/g, ''));
              if (!isNaN(numericPrice)) {
                await trx
                  .insertInto('rate_set_support_item_price')
                  .values({
                    rate_set_id: rateSetId,
                    support_item_id: supportItemId,
                    type_id: typeId,
                    pricing_region_code: reg.code,
                    unit_price: String(numericPrice),
                    start_date: startDate,
                    end_date: endDate,
                    updated_at: sql`now()`,
                  })
                  .execute();
              }
            }
          }

          totalRowsProcessed++;
        }
      }
    });

    return { success: true, processedRows: totalRowsProcessed };
  }
}

export const rateSetImportService = new RateSetImportService();