import "server-only";
import path from "node:path";
import { stat } from "node:fs/promises";
import ExcelJS from "exceljs";

const SHEET_PATH = path.join(process.cwd(), "data", "pricing.xlsx");

let cache: { mtimeMs: number; rates: Record<string, number> } | null = null;

// Reads the builder-maintained per-sqft rate sheet. Keys are
// "<categoryOrGroupId>__<optionOrItemId>" (same convention as photo filenames);
// a positive rate means that option's price = rate × the buyer's sqft.
export async function readSqftRates(): Promise<Record<string, number>> {
  try {
    const { mtimeMs } = await stat(SHEET_PATH);
    if (cache && cache.mtimeMs === mtimeMs) return cache.rates;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(SHEET_PATH);
    const sheet = workbook.worksheets[0];
    const rates: Record<string, number> = {};
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = String(row.getCell(1).value ?? "").trim();
      const raw = row.getCell(5).value;
      const rate =
        typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
      if (key && Number.isFinite(rate) && rate > 0) rates[key] = rate;
    });

    cache = { mtimeMs, rates };
    return rates;
  } catch (err) {
    console.error("Could not read data/pricing.xlsx — per-sqft pricing disabled:", err);
    return {};
  }
}
