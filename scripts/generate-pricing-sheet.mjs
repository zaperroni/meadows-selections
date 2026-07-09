// One-time generator for data/pricing.xlsx — the builder-editable sheet of
// ALL upgrade prices. After generation, the xlsx itself is the source of truth:
// edit "Flat Price" to change a price, or fill "Price per Sq Ft" to make a
// price scale with house size. New catalog options should be added here as new
// rows (key = <categoryOrGroupId>__<optionOrItemId>).
// Usage: node scripts/generate-pricing-sheet.mjs
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";

// [key, section, option, flatPrice, perSqftEligible]
// perSqftEligible=false → the per-sqft cell shows "n/a" (structural / per-room
// prices that don't scale with house size).
const ROWS = [
  ["roof__other-timberline", "Roof Color", "Other GAF Timberline Colors", 400, true],
  ["siding-sides-rear__other-alside", "Siding (Sides & Rear)", "Other Alside Vinyl Colors", 350, true],
  ["siding-sides-rear__hardieplank-all-sides", "Siding (Sides & Rear)", "Hardieplank on All Sides", 55000, true],
  ["windows__black-white", "Windows", "Black Exterior / White Interior", 850, true],
  ["front-door__builder-black", "Front Door Color", "Black", 100, true],
  ["front-door__iron-ore", "Front Door Color", "Iron Ore", 100, true],
  ["front-door__barn-red", "Front Door Color", "Designer Red", 100, true],
  ["front-door__natural-stain", "Front Door Color", "Natural Stain Finish", 250, true],
  ["garage-door__black-doors", "Garage Door Style", "Black Doors", 300, true],
  ["garage-door__coachman-doors", "Garage Door Style", "Coachman Doors", 1200, true],
  ["cabinets__shaker-greige", "Kitchen Cabinets", "Shaker — Greige", 400, true],
  ["cabinets__slab-walnut", "Kitchen Cabinets", "Slab — Natural Walnut", 1700, true],
  ["countertops__other-tbd", "Countertops", "Other — Price TBD", "TBD", false],
  ["flooring__flooring-stain", "Flooring", "Flooring Stain", 500, true],
  ["plumbing__polished-nickel", "Plumbing Fixtures", "Polished Nickel Package", 200, true],
  ["plumbing__brushed-brass", "Plumbing Fixtures", "Brushed Brass Package", 450, true],
  ["paint__designer-palette", "Paint & Trim", "Designer Palette — Custom", 400, true],
  ["ceiling-height__9ft", "Ceiling Height (per floor)", "9' Ceiling", 19850, false],
  ["ceiling-height__10ft", "Ceiling Height (per floor)", "10' Ceiling", 38500, false],
  ["ceiling-features__coffered", "Trim Upgrades", "Coffered Ceiling (per room)", 6500, false],
  ["ceiling-features__tray", "Trim Upgrades", "Tray Ceiling with Light Rail (per room)", 9900, false],
  ["ceiling-features__trim-panel-foyer-stairwell", "Trim Upgrades", "Trim Panel Package — Foyer Stairwell", 6400, true],
  ["ceiling-features__trim-panel-dining-room", "Trim Upgrades", "Trim Panel Package — Dining Room", 4500, true],
  ["ceiling-features__crown-moulding-upstairs", "Trim Upgrades", "Crown Moulding — Upstairs", 4600, true],
  ["covered-deck__deck-1", "Covered Deck", "Covered Deck — Option 1", 90000, true],
  ["covered-deck__deck-2", "Covered Deck", "Covered Deck — Option 2", 110000, true],
  ["technology__sonos", "Technology & Smart Home", "Sonos Sound Package", 15000, true],
  ["technology__tech-package", "Technology & Smart Home", "Technology Package", 5000, true],
  ["technology__security", "Technology & Smart Home", "Home Security Package", 25000, true],
  ["technology__ev-charger", "Technology & Smart Home", "EV Charging Station", 7500, true],
  ["technology__generator", "Technology & Smart Home", "22kW Generac Generator", 16500, true],
  ["future-planning__basement-prep", "Future Planning", "Prep for Future Finished Basement", 7500, true],
  ["future-planning__energy-efficiency-package", "Future Planning", "Energy Efficiency Package", 12000, true],
];

const ARIAL = { name: "Arial", size: 10 };
const INPUT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7DC" } };
const wb = new ExcelJS.Workbook();

const sheet = wb.addWorksheet("Prices", { views: [{ state: "frozen", ySplit: 1 }] });
sheet.columns = [
  { header: "Option Key (do not edit)", key: "key", width: 46 },
  { header: "Section", key: "section", width: 26 },
  { header: "Option", key: "option", width: 40 },
  { header: "Flat Price ($) — edit to change", key: "flat", width: 26 },
  { header: "Price per Sq Ft ($) — fill in to scale with house size", key: "rate", width: 40 },
];

for (const [key, section, option, flat, perSqftEligible] of ROWS) {
  sheet.addRow({ key, section, option, flat, rate: perSqftEligible ? null : "n/a" });
}

sheet.eachRow((row, n) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { ...ARIAL };
  });
  if (n === 1) {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { ...ARIAL, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF243830" } };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
    row.height = 30;
    return;
  }

  const flatCell = row.getCell(4);
  if (typeof flatCell.value === "number") flatCell.numFmt = "$#,##0";
  // Blue = editable input, per standard spreadsheet conventions.
  flatCell.font = { ...ARIAL, color: { argb: "FF0000FF" } };
  flatCell.fill = INPUT_FILL;

  const rateCell = row.getCell(5);
  if (rateCell.value === "n/a") {
    rateCell.font = { ...ARIAL, color: { argb: "FF999999" }, italic: true };
    rateCell.alignment = { horizontal: "center" };
  } else {
    rateCell.numFmt = "$#,##0.00";
    rateCell.font = { ...ARIAL, color: { argb: "FF0000FF" } };
    rateCell.fill = INPUT_FILL;
  }
});

const help = wb.addWorksheet("Instructions");
help.columns = [{ width: 100 }];
const LINES = [
  "HOW THIS SHEET WORKS",
  "",
  "This is the single place to set every upgrade price. Two editable columns:",
  "",
  "  • Flat Price — the option's price. Edit it to change what buyers are charged.",
  "  • Price per Sq Ft — leave blank for a flat price, OR fill it in to make the",
  "    price scale with house size. When filled, it OVERRIDES the flat price and",
  "    the website computes:  price = rate x the buyer's house size (sq ft).",
  "",
  "You enter each buyer's house size on the Builder Dashboard (the password page).",
  "If a per-sqft option has no house size entered for a buyer, it shows 'Price TBD'",
  "in their portal until you add one.",
  "",
  "Cells marked 'n/a' in the Price per Sq Ft column are structural or per-room",
  "prices (ceiling heights, coffered/tray ceilings) that don't scale with house",
  "size — set their Flat Price only.",
  "",
  "'TBD' in a Flat Price cell means the buyer sees 'Price TBD' (e.g. the custom",
  "countertop option). Replace it with a number once a price is known.",
  "",
  "Do not edit the 'Option Key' column — it's how rows are matched to website options.",
  "",
  "After saving changes, the file must be published (committed and pushed) before the",
  "live site picks it up — just ask to 'publish the new pricing'.",
];
LINES.forEach((text, i) => {
  const cell = help.getCell(i + 1, 1);
  cell.value = text;
  cell.font = i === 0 ? { ...ARIAL, bold: true, size: 12 } : { ...ARIAL };
});

mkdirSync("data", { recursive: true });
await wb.xlsx.writeFile("data/pricing.xlsx");
console.log(`Wrote data/pricing.xlsx with ${ROWS.length} option rows.`);
