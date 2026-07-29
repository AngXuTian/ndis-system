import * as XLSX from "xlsx";

export interface ParsedCatalogueRow {
  itemNumber: string; // Column A
  itemName: string; // Column B
  categoryNumber: string; // Column F
  categoryName: string; // Column H
  unit: string | null; // Column I
  isQuoteRequired: boolean; // Column J
  startDate: string; // Column K, normalized YYYY-MM-DD
  endDate: string | null; // Column L, normalized YYYY-MM-DD or null if open-ended
  prices: Partial<Record<RegionCode, string | null>>; // Columns M-V
  isNf2fSupportProvision: boolean; // Column W
  isProviderTravel: boolean; // Column X
  isShortNoticeCancel: boolean; // Column Y
  isNdiaRequestedReports: boolean; // Column Z
  typeLabel: string | null; // Column AB ("Priced Supports", "Quotable Supports", etc.)
  sheetName: string;
  rowIndex: number;
}

export const REGION_COLUMNS = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
  "REMOTE",
  "VERY_REMOTE",
] as const;
export type RegionCode = (typeof REGION_COLUMNS)[number];

// 0-based column indices matching spec Columns A, F, H, I, J, K, L, M-V, W, X, Y, Z, AB
const COL = {
  itemNumber: 0, // A
  itemName: 1, // B
  categoryNumber: 5, // F
  categoryName: 7, // H
  unit: 8, // I
  quote: 9, // J
  startDate: 10, // K
  endDate: 11, // L
  regionsStart: 12, // M..V (12..21)
  nf2f: 22, // W
  providerTravel: 23, // X
  shortNoticeCancel: 24, // Y
  ndiaRequestedReports: 25, // Z
  type: 27, // AB
};

function isYesLike(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).trim().toLowerCase();
  return s === "yes" || s === "y";
}

function cleanMoney(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.toUpperCase() === "NA") return null;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return num.toFixed(2);
}

/**
 * NDIS catalogue dates are formatted as YYYYMMDD. 99991231 is used as an
 * "open-ended" sentinel and is normalized to null.
 */
function parseNdisDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!s || s.length !== 8) return null;
  if (s === "99991231") return null;
  const year = s.slice(0, 4);
  const month = s.slice(4, 6);
  const day = s.slice(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * A worksheet is treated as a valid catalogue sheet only if its header row
 * matches the expected layout (column A = "Support Item Number"). Some
 * catalogue workbooks include extra non-standard sheets (pivot/summary
 * tabs) that must be skipped rather than misparsed.
 */
function isValidCatalogueSheet(headerRow: unknown[]): boolean {
  const first = String(headerRow?.[0] ?? "").trim().toLowerCase();
  const sixth = String(headerRow?.[COL.categoryNumber] ?? "").trim().toLowerCase();
  return first === "support item number" && sixth.includes("pace");
}

export function parseNdisCatalogue(buffer: Buffer): {
  rows: ParsedCatalogueRow[];
  skippedSheets: string[];
  processedSheets: string[];
} {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const rows: ParsedCatalogueRow[] = [];
  const skippedSheets: string[] = [];
  const processedSheets: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      raw: false,
      defval: null,
    });

    if (raw.length === 0 || !isValidCatalogueSheet(raw[0])) {
      skippedSheets.push(sheetName);
      continue;
    }

    processedSheets.push(sheetName);

    for (let i = 1; i < raw.length; i++) {
      const row = raw[i];
      const itemNumber = String(row[COL.itemNumber] ?? "").trim();
      if (!itemNumber) continue; // skip blank trailing rows

      const startDate = parseNdisDate(row[COL.startDate]);
      if (!startDate) continue; // start date is mandatory to place this row in time

      const prices: Partial<Record<RegionCode, string | null>> = {};
      REGION_COLUMNS.forEach((region, idx) => {
        prices[region] = cleanMoney(row[COL.regionsStart + idx]);
      });

      rows.push({
        itemNumber,
        itemName: String(row[COL.itemName] ?? "").trim(),
        categoryNumber: String(row[COL.categoryNumber] ?? "").trim(),
        categoryName: String(row[COL.categoryName] ?? "").trim(),
        unit: row[COL.unit] ? String(row[COL.unit]).trim() : null,
        isQuoteRequired: isYesLike(row[COL.quote]),
        startDate,
        endDate: parseNdisDate(row[COL.endDate]),
        prices,
        isNf2fSupportProvision: isYesLike(row[COL.nf2f]),
        isProviderTravel: isYesLike(row[COL.providerTravel]),
        isShortNoticeCancel: isYesLike(row[COL.shortNoticeCancel]),
        isNdiaRequestedReports: isYesLike(row[COL.ndiaRequestedReports]),
        typeLabel: row[COL.type] ? String(row[COL.type]).trim() : null,
        sheetName,
        rowIndex: i + 1,
      });
    }
  }

  return { rows, skippedSheets, processedSheets };
}