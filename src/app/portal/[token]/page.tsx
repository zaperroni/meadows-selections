import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readSqftRates } from "@/lib/pricing";
import SelectionsPortal from "@/components/SelectionsPortal";
import type { Buyer, SelectionsMap, UpgradeSelectionsMap, NotesMap } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatNoteTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: buyer } = await supabaseAdmin
    .from("buyers")
    .select("id, token, community, lot, family_name, sqft, signer_name, signed_at")
    .eq("token", token)
    .single();

  if (!buyer) notFound();

  const [{ data: selectionRows }, { data: upgradeRows }, { data: noteRows }, sqftRates] =
    await Promise.all([
      supabaseAdmin
        .from("selections")
        .select("category_key, option_id")
        .eq("buyer_id", buyer.id),
      supabaseAdmin
        .from("upgrade_selections")
        .select("group_id, item_ids")
        .eq("buyer_id", buyer.id),
      supabaseAdmin
        .from("notes")
        .select("category_id, author, text, created_at")
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: true }),
      readSqftRates(),
    ]);

  const initialSelections: SelectionsMap = {};
  for (const row of selectionRows ?? []) {
    initialSelections[row.category_key] = row.option_id;
  }

  const initialUpgradeSelections: UpgradeSelectionsMap = {};
  for (const row of upgradeRows ?? []) {
    initialUpgradeSelections[row.group_id] = row.item_ids;
  }

  const initialNotes: NotesMap = {};
  for (const row of noteRows ?? []) {
    const entry = { author: row.author as "buyer" | "builder", text: row.text, time: formatNoteTime(row.created_at) };
    if (!initialNotes[row.category_id]) initialNotes[row.category_id] = [];
    initialNotes[row.category_id].push(entry);
  }

  return (
    <SelectionsPortal
      buyer={buyer as Buyer}
      initialSelections={initialSelections}
      initialUpgradeSelections={initialUpgradeSelections}
      initialNotes={initialNotes}
      sqftRates={sqftRates}
    />
  );
}
