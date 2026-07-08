"use server";

import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { Buyer } from "@/lib/types";

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

export async function createBuyer(
  familyName: string,
  lot: string,
  community: string
): Promise<Buyer> {
  const trimmedName = familyName.trim();
  const trimmedLot = lot.trim();
  if (!trimmedName || !trimmedLot) throw new Error("Family name and lot are required.");

  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const suffix = randomBytes(5).toString("base64url");
  const token = `${slug || "buyer"}-lot${trimmedLot}-${suffix}`;

  const { data, error } = await supabaseAdmin
    .from("buyers")
    .insert({
      token,
      community: community.trim() || "Meadows at Briarcliff",
      lot: trimmedLot,
      family_name: trimmedName,
    })
    .select("id, token, community, lot, family_name, signer_name, signed_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create buyer.");

  return data;
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
