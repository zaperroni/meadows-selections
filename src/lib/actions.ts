"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function getBuyerByToken(token: string) {
  const { data, error } = await supabaseAdmin
    .from("buyers")
    .select("id, signed_at")
    .eq("token", token)
    .single();
  if (error || !data) throw new Error("Buyer not found for this link.");
  return data;
}

export async function chooseSelection(
  token: string,
  categoryKey: string,
  optionId: string
) {
  const buyer = await getBuyerByToken(token);
  if (buyer.signed_at) throw new Error("Selections are already signed and locked.");

  const { error } = await supabaseAdmin
    .from("selections")
    .upsert(
      { buyer_id: buyer.id, category_key: categoryKey, option_id: optionId, updated_at: new Date().toISOString() },
      { onConflict: "buyer_id,category_key" }
    );
  if (error) throw new Error(error.message);
}

export async function setUpgradeSelection(
  token: string,
  groupId: string,
  itemIds: string[]
) {
  const buyer = await getBuyerByToken(token);
  if (buyer.signed_at) throw new Error("Selections are already signed and locked.");

  const { error } = await supabaseAdmin
    .from("upgrade_selections")
    .upsert(
      { buyer_id: buyer.id, group_id: groupId, item_ids: itemIds, updated_at: new Date().toISOString() },
      { onConflict: "buyer_id,group_id" }
    );
  if (error) throw new Error(error.message);
}

export async function addNote(
  token: string,
  categoryId: string,
  author: "buyer" | "builder",
  text: string
) {
  const buyer = await getBuyerByToken(token);

  const { error } = await supabaseAdmin.from("notes").insert({
    buyer_id: buyer.id,
    category_id: categoryId,
    author,
    text,
  });
  if (error) throw new Error(error.message);
}

export async function signSelections(token: string, signerName: string) {
  const buyer = await getBuyerByToken(token);
  if (buyer.signed_at) throw new Error("Already signed.");

  const signedAt = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("buyers")
    .update({ signer_name: signerName, signed_at: signedAt })
    .eq("id", buyer.id)
    .is("signed_at", null);
  if (error) throw new Error(error.message);

  return signedAt;
}
