"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBuyer } from "@/lib/actions";

export default function AddBuyerForm() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [lot, setLot] = useState("");
  const [community, setCommunity] = useState("Meadows at Briarcliff");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setCreatedLink(null);
    try {
      const buyer = await createBuyer(familyName, lot, community);
      setCreatedLink(`${window.location.origin}/portal/${buyer.token}`);
      setFamilyName("");
      setLot("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded border border-zinc-200 bg-white p-4">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Family name</label>
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="Henderson"
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Lot #</label>
          <input
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            placeholder="14"
            className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Community</label>
          <input
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add buyer"}
        </button>
      </form>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      {createdLink && (
        <div className="mt-3 flex items-center gap-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <span className="truncate">{createdLink}</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(createdLink)}
            className="shrink-0 rounded border border-emerald-300 px-2 py-0.5 text-xs hover:bg-emerald-100"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}
