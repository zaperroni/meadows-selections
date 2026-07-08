// Creates a buyer row with a unique, hard-to-guess portal link.
// Usage: node --env-file=.env.local scripts/seed-buyer.mjs "Henderson" "14" ["Meadows at Briarcliff"]
// Prints a production link by default; override with APP_BASE_URL=http://localhost:3000 for local testing.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [, , familyName, lot, community = "Meadows at Briarcliff"] = process.argv;

if (!familyName || !lot) {
  console.error('Usage: node --env-file=.env.local scripts/seed-buyer.mjs "Family Name" "Lot #" ["Community"]');
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Did you pass --env-file=.env.local?");
  process.exit(1);
}

const slug = familyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const suffix = randomBytes(5).toString("base64url");
const token = `${slug}-lot${lot}-${suffix}`;

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { data, error } = await supabase
  .from("buyers")
  .insert({ token, community, lot: String(lot), family_name: familyName })
  .select()
  .single();

if (error) {
  console.error("Failed to create buyer:", error.message);
  process.exit(1);
}

const baseUrl = process.env.APP_BASE_URL || "https://meadows-selections.vercel.app";
console.log(`Created buyer: ${data.family_name} — Lot ${data.lot}`);
console.log(`Portal link:   ${baseUrl}/portal/${data.token}`);
