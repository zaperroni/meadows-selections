"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteBuyer } from "@/lib/actions";

interface Props {
  token: string;
  familyName: string;
  lot: string;
  community: string;
  signed: boolean;
}

export default function BuyerRow({ token, familyName, lot, community, signed }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

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
    <div className="flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400">
      <Link href={`/portal/${token}`} className="flex-1">
        <div className="font-medium text-zinc-900">
          {familyName} family — Lot {lot}
        </div>
        <div className="text-xs text-zinc-500">{community}</div>
      </Link>
      <div className="flex items-center gap-3">
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
