// One-time generator for data/pricing.xlsx — the builder-editable sheet of
// per-sqft rates. After generation, the xlsx itself is the source of truth;
// new catalog options should be added there as new rows (matching the
// <categoryOrGroupId>__<optionOrItemId> key convention).
// Usage: node scripts/generate-pricing-sheet.mjs
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";

const ROWS = [
  ["roof__other-timberline", "Roof Color", "Other GAF Timberline Colors", 400],
  ["siding-sides-rear__other-alside", "Siding (Sides & Rear)", "Other Alside Vinyl Colors", 350],
  ["siding-sides-rear__hardieplank-all-sides", "Siding (Sides & Rear)", "Hardieplank on All Sides", 55000],
  ["windows__black-white", "Windows", "Black Exterior / White Interior", 850],
  ["front-door__builder-black", "Front Door Color", "Black", 100],
  ["front-door__iron-ore", "Front Door Color", "Iron Ore", 100],
  ["front-door__barn-red", "Front Door Color", "Designer Red", 100],
  ["front-door__natural-stain", "Front Door Color", "Natural Stain Finish", 250],
  ["garage-door__black-doors", "Garage Door Style", "Black Doors", 300],
  ["garage-door__coachman-doors", "Garage Door Style", "Coachman Doors", 1200],
  ["cabinets__shaker-greige", "Kitchen Cabinets", "Shaker — Greige", 400],
  ["cabinets__slab-walnut", "Kitchen Cabinets", "Slab — Natural Walnut", 1700],
  ["countertops__other-tbd", "Countertops", "Other — Price TBD", "TBD"],
  ["flooring__flooring-stain", "Flooring", "Flooring Stain", 500],
  ["plumbing__polished-nickel", "Plumbing Fixtures", "Polished Nickel Package", 200],
  ["plumbing__brushed-brass", "Plumbing Fixtures", "Brushed Brass Package", 450],
  ["paint__designer-palette", "Paint & Trim", "Designer Palette — Custom", 400],
  ["ceiling-features__trim-panel-foyer-stairwell", "Trim Upgrades", "Trim Panel Package — Foyer Stairwell", 6400],
  ["ceiling-features__trim-panel-dining-room", "Trim Upgrades", "Trim Panel Package — Dining Room", 4500],
  ["ceiling-features__crown-moulding-upstairs", "Trim Upgrades", "Crown Moulding — Upstairs", 4600],
  ["covered-deck__deck-1", "Covered Deck", "Covered Deck — Option 1", 90000],
  ["covered-deck__deck-2", "Covered Deck", "Covered Deck — Option 2", 110000],
  ["technology__sonos", "Technology & Smart Home", "Sonos Sound Package", 15000],
  ["technology__tech-package", "Technology & Smart Home", "Technology Package", 5000],
  ["technology__security", "Technology & Smart Home", "Home Security Package", 25000],
  ["technology__ev-charger", "Technology & Smart Home", "EV Charging Station", 7500],
  ["technology__generator", "Technology & Smart Home", "22kW Generac Generator", 16500],
  ["future-planning__basement-prep", "Future Planning", "Prep for Future Finished Basement", 7500],
  ["future-planning__energy-efficiency-package", "Future Planning", "Energy Efficiency Package", 12000],
];

const ARIAL = { name: "Arial", size: 10 };
const wb = new ExcelJS.Workbook();

const sheet = wb.addWorksheet("Per SqFt Rates", { views: [{ state: "frozen", ySplit: 1 }] });
sheet.columns = [
  { header: "Option Key (do not edit)", key: "key", width: 44 },
  { header: "Section", key: "section", width: 26 },
  { header: "Option", key: "option", width: 38 },
  { header: "Current Flat Price ($)", key: "flat", width: 20 },
  { header: "Price per Sq Ft ($) — fill in to override", key: "rate", width: 34 },
];

for (const [key, section, option, flat] of ROWS) {
  sheet.addRow({ key, section, option, flat, rate: null });
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
  } else {
    const flatCell = row.getCell(4);
    if (typeof flatCell.value === "number") flatCell.numFmt = "$#,##0";
    const rateCell = row.getCell(5);
    rateCell.numFmt = "$#,##0.00";
    // Blue = editable input, per standard spreadsheet conventions.
    rateCell.font = { ...ARIAL, color: { argb: "FF0000FF" } };
    rateCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7DC" } };
  }
});

const help = wb.addWorksheet("Instructions");
help.columns = [{ width: 100 }];
const LINES = [
  "HOW THIS SHEET WORKS",
  "",
  "Fill in the 'Price per Sq Ft' column (the highlighted one) for any option whose price",
  "should scale with house size. Leave it blank for options that keep their flat price.",
  "",
  "When a rate is filled in, the website computes that option's price for each buyer as:",
  "    price = rate x the buyer's house size (sq ft)",
  "You enter each buyer's house size on the Builder Dashboard (the password-protected page).",
  "If a buyer has no house size entered yet, per-sqft options show 'Price TBD' in their portal.",
  "",
  "The 'Current Flat Price' column is for reference only — changing it here does NOT change",
  "the website. Flat prices live in the app itself; ask to have those changed.",
  "",
  "Do not edit the 'Option Key' column — it's how rows are matched to website options.",
  "",
  "Not listed here: ceiling heights (fixed per-floor prices) and the coffered/tray ceilings",
  "(priced per room with a quantity picker, not by house size).",
  "",
  "After saving changes, the file needs to be published (committed and pushed) before the",
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
