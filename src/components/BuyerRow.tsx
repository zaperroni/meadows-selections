"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBuyer, updateBuyerSqft } from "@/lib/actions";

interface Props {
  token: string;
  familyName: string;
  lot: string;
  community: string;
  sqft: number | null;
  signed: boolean;
}

export default function BuyerRow({ token, familyName, lot, community, sqft, signed }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [sqftDraft, setSqftDraft] = useState(sqft ? String(sqft) : "");
  const [savingSqft, setSavingSqft] = useState(false);

  const savedValue = sqft ? String(sqft) : "";
  const sqftDirty = sqftDraft !== savedValue;

  const saveSqft = async () => {
    if (!sqftDirty) return;
    setSavingSqft(true);
    try {
      await updateBuyerSqft(token, sqftDraft ? Number(sqftDraft) : null);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Couldn't save the house size.");
      setSqftDraft(savedValue);
    } finally {
      setSavingSqft(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete ${familyName} — Lot ${lot}? This permanently removes their selections, upgrades, and notes.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteBuyer(token);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Couldn't delete this buyer.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400">
      <Link href={`/portal/${token}`} className="flex-1">
        <div className="font-medium text-zinc-900">
          {familyName} family — Lot {lot}
        </div>
        <div className="text-xs text-zinc-500">{community}</div>
      </Link>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          <input
            value={sqftDraft}
            onChange={(e) => setSqftDraft(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={saveSqft}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            placeholder="—"
            inputMode="numeric"
            disabled={savingSqft}
            className="w-20 rounded border border-zinc-300 bg-white px-2 py-1 text-right text-xs text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50"
          />
          sq ft
        </label>
        <span className="text-xs">
          {signed ? (
            <span className="text-emerald-700">Signed</span>
          ) : (
            <span className="text-zinc-400">In progress</span>
          )}
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}
