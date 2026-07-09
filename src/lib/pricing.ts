import "server-only";
import path from "node:path";
import { stat } from "node:fs/promises";
import ExcelJS from "exceljs";
import type { PricingMap, OptionPricing } from "@/lib/types";

const SHEET_PATH = path.join(process.cwd(), "data", "pricing.xlsx");

let cache: { mtimeMs: number; pricing: PricingMap } | null = null;

// A money cell is either a number, blank, "n/a" (not applicable), or "TBD".
function parseMoney(raw: ExcelJS.CellValue): { value?: number; tbd?: boolean } {
  if (raw == null || raw === "") return {};
  if (typeof raw === "number") return Number.isFinite(raw) ? { value: raw } : {};
  const str = String(raw).trim();
  if (/tbd/i.test(str)) return { tbd: true };
  if (/n\/?a/i.test(str)) return {};
  const n = Number(str.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && str.replace(/[^0-9.]/g, "") !== "" ? { value: n } : {};
}

// Reads the builder-maintained pricing sheet. Keys are
// "<categoryOrGroupId>__<optionOrItemId>" (same convention as photo filenames).
// Column 4 = Flat Price (overrides the app's built-in price), column 5 =
// Price per Sq Ft (overrides both, computed as rate × the buyer's sqft).
export async function readPricing(): Promise<PricingMap> {
  try {
    const { mtimeMs } = await stat(SHEET_PATH);
    if (cache && cache.mtimeMs === mtimeMs) return cache.pricing;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(SHEET_PATH);
    const sheet = workbook.worksheets[0];
    const pricing: PricingMap = {};
    sheet?.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const key = String(row.getCell(1).value ?? "").trim();
      if (!key) return;
      const flat = parseMoney(row.getCell(4).value);
      const rate = parseMoney(row.getCell(5).value);
      const entry: OptionPricing = {};
      if (flat.value != null) entry.flat = flat.value;
      if (flat.tbd) entry.tbd = true;
      if (rate.value != null && rate.value > 0) entry.perSqft = rate.value;
      if (Object.keys(entry).length) pricing[key] = entry;
    });

    cache = { mtimeMs, pricing };
    return pricing;
  } catch (err) {
    console.error("Could not read data/pricing.xlsx — using built-in prices:", err);
    return {};
  }
}
