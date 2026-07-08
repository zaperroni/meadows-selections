import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import AddBuyerForm from "@/components/AddBuyerForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: buyers } = await supabaseAdmin
    .from("buyers")
    .select("token, community, lot, family_name, signed_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Builder Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Each buyer gets their own private selections link. Send buyers only
          their individual link — this dashboard itself isn&apos;t private.
        </p>

        <div className="mt-6">
          <AddBuyerForm />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {(!buyers || buyers.length === 0) && (
            <div className="rounded border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
              No buyers yet. Add one above, or from the command line with:{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5">
                npm run seed:buyer -- &quot;Family Name&quot; &quot;Lot #&quot;
              </code>
            </div>
          )}
          {buyers?.map((b) => (
            <Link
              key={b.token}
              href={`/portal/${b.token}`}
              className="flex items-center justify-between rounded border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
            >
              <div>
                <div className="font-medium text-zinc-900">
                  {b.family_name} family — Lot {b.lot}
                </div>
                <div className="text-xs text-zinc-500">{b.community}</div>
              </div>
              <div className="text-xs">
                {b.signed_at ? (
                  <span className="text-emerald-700">Signed</span>
                ) : (
                  <span className="text-zinc-400">In progress</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
