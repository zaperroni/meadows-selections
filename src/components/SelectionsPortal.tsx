"use client";

import { useState } from "react";
import {
  House,
  Check,
  MessageCircle,
  Send,
  PenTool,
  CircleCheckBig,
  ArrowUpRight,
  X,
} from "lucide-react";
import {
  CATEGORIES,
  UPGRADE_GROUPS,
  fmt,
  INK,
  PAPER,
  CARD,
  LINE,
  PINE,
  PINE_DARK,
  BRASS,
  MUTED,
  display,
  body,
  mono,
  type Category,
  type CategoryOption,
  type FloorGroup,
  type FloorsUpgradeGroup,
  type UpgradeGroup,
  type UpgradeToggleItem,
  type UpgradeQuantityItem,
  type ActiveEntity,
} from "@/lib/catalog";
import { chooseSelection, setUpgradeSelection, addNote, signSelections } from "@/lib/actions";
import type {
  Buyer,
  SelectionsMap,
  UpgradeSelectionsMap,
  NotesMap,
  NoteEntry,
  PricingMap,
} from "@/lib/types";
import OptionSwatch from "@/components/OptionSwatch";

// Quantity items are encoded as "itemId:count" alongside plain "itemId" toggle
// entries in the same string[] the DB stores per group — no schema change needed.
function decodeUpgradeEntries(entries: string[]) {
  const toggles = new Set<string>();
  const quantities: Record<string, number> = {};
  for (const entry of entries) {
    const idx = entry.lastIndexOf(":");
    if (idx > -1) {
      const count = Number(entry.slice(idx + 1));
      if (Number.isFinite(count) && count > 0) quantities[entry.slice(0, idx)] = count;
    } else {
      toggles.add(entry);
    }
  }
  return { toggles, quantities };
}

function encodeUpgradeEntries(toggles: Set<string>, quantities: Record<string, number>): string[] {
  const entries = Array.from(toggles);
  for (const [id, count] of Object.entries(quantities)) {
    if (count > 0) entries.push(`${id}:${count}`);
  }
  return entries;
}

function formatSignedAt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface Props {
  buyer: Buyer;
  initialSelections: SelectionsMap;
  initialUpgradeSelections: UpgradeSelectionsMap;
  initialNotes: NotesMap;
  // From data/pricing.xlsx: "<categoryOrGroupId>__<optionOrItemId>" → prices.
  pricing: PricingMap;
}

export default function SelectionsPortal({
  buyer,
  initialSelections,
  initialUpgradeSelections,
  initialNotes,
  pricing,
}: Props) {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const [selections, setSelections] = useState<SelectionsMap>(initialSelections);
  const [upgradeSelections, setUpgradeSelections] = useState<UpgradeSelectionsMap>(
    initialUpgradeSelections
  );
  const [notes, setNotes] = useState<NotesMap>(initialNotes);
  const [draft, setDraft] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [signerName, setSignerName] = useState(buyer.signer_name ?? "");
  const [agreed, setAgreed] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(
    buyer.signed_at ? formatSignedAt(buyer.signed_at) : null
  );

  const active: ActiveEntity =
    CATEGORIES.find((c) => c.id === activeId) ??
    (UPGRADE_GROUPS.find((g) => g.id === activeId) as ActiveEntity);
  const madeCount = Object.keys(selections).length;

  const sqft = buyer.sqft;

  // Resolve a price from the sheet, falling back to the app's built-in price.
  // Per-sqft rate wins (→ null if no house size yet); then an explicit "TBD";
  // then a flat-price override; then the built-in fallback.
  // Returns null when the price can't be shown yet ("Price TBD").
  const priceFor = (key: string, fallbackFlat: number, builtinTBD: boolean): number | null => {
    const p = pricing[key];
    if (p?.perSqft != null) return sqft ? Math.round(p.perSqft * sqft) : null;
    if (p?.tbd) return null;
    if (p?.flat != null) return p.flat;
    if (builtinTBD) return null;
    return fallbackFlat;
  };
  // Flat-only lookup for structural/per-room prices (no per-sqft, never TBD).
  const flatFor = (key: string, fallback: number): number =>
    pricing[key]?.flat ?? fallback;

  const optionCost = (catId: string, opt: CategoryOption): number | null =>
    opt.included ? 0 : priceFor(`${catId}__${opt.id}`, opt.upgradeCost ?? 0, !!opt.priceTBD);
  const optionIsTBD = (catId: string, opt: CategoryOption) =>
    !opt.included && optionCost(catId, opt) === null;

  const toggleItemPrice = (groupId: string, item: UpgradeToggleItem): number | null =>
    priceFor(`${groupId}__${item.id}`, item.price, false);

  const quantityUnitPrice = (groupId: string, item: UpgradeQuantityItem): number =>
    flatFor(`${groupId}__${item.id}`, item.pricePerUnit);

  const lineFor = (cat: Category) => {
    const chosenId = selections[cat.id];
    const chosen: CategoryOption | null = chosenId
      ? cat.options.find((o) => o.id === chosenId) ?? null
      : null;
    const upgrade = chosen ? optionCost(cat.id, chosen) ?? 0 : 0;
    return { chosen, upgrade };
  };

  const totals = CATEGORIES.reduce(
    (acc, cat) => {
      const { upgrade } = lineFor(cat);
      acc.upgrades += upgrade;
      return acc;
    },
    { upgrades: 0 }
  );

  const floorLineFor = (group: FloorsUpgradeGroup, floor: FloorGroup) => {
    const key = `${group.id}__${floor.id}`;
    const chosenId = selections[key];
    const chosen = chosenId ? floor.options.find((o) => o.id === chosenId) ?? null : null;
    const upgrade =
      chosen && !chosen.included
        ? flatFor(`${group.id}__${chosen.id}`, chosen.upgradeCost ?? 0)
        : 0;
    return { chosen, upgrade, key };
  };

  const upgradeGroupTotal = (group: UpgradeGroup) => {
    if (group.floors) {
      return group.floors.reduce((sum, floor) => sum + floorLineFor(group, floor).upgrade, 0);
    }
    const sel = upgradeSelections[group.id] || [];
    const { toggles, quantities } = decodeUpgradeEntries(sel);
    return group.items.reduce((sum, item) => {
      if (item.kind === "quantity")
        return sum + quantityUnitPrice(group.id, item) * (quantities[item.id] || 0);
      return sum + (toggles.has(item.id) ? toggleItemPrice(group.id, item) ?? 0 : 0);
    }, 0);
  };

  const allUpgradesTotal = UPGRADE_GROUPS.reduce((sum, g) => sum + upgradeGroupTotal(g), 0);
  const grandUpgradesTotal = totals.upgrades + allUpgradesTotal;
  const hasTBDSelected =
    CATEGORIES.some((cat) => {
      const { chosen } = lineFor(cat);
      return chosen !== null && optionIsTBD(cat.id, chosen);
    }) ||
    UPGRADE_GROUPS.some((group) => {
      if (group.floors) return false;
      const { toggles } = decodeUpgradeEntries(upgradeSelections[group.id] || []);
      return group.items.some(
        (item) =>
          item.kind !== "quantity" &&
          toggles.has(item.id) &&
          toggleItemPrice(group.id, item) === null
      );
    });

  const upgradesSummary = grandUpgradesTotal > 0 && hasTBDSelected
    ? `+${fmt(grandUpgradesTotal)} in upgrades + price TBD items`
    : grandUpgradesTotal > 0
    ? `+${fmt(grandUpgradesTotal)} in upgrades`
    : hasTBDSelected
    ? "Upgrades selected — price TBD"
    : "No upgrades selected";

  const choose = (catId: string, optId: string) => {
    if (signedAt) return;
    const prevValue = selections[catId];
    setSelections((s) => ({ ...s, [catId]: optId }));
    chooseSelection(buyer.token, catId, optId).catch((err) => {
      console.error(err);
      window.alert("Couldn't save that selection — please try again.");
      setSelections((s) => {
        const next = { ...s };
        if (prevValue === undefined) delete next[catId];
        else next[catId] = prevValue;
        return next;
      });
    });
  };

  const toggleUpgrade = (groupId: string, itemId: string, type?: "single" | "multi") => {
    if (signedAt) return;
    const prev = upgradeSelections[groupId] || [];
    const next =
      type === "single"
        ? prev[0] === itemId
          ? []
          : [itemId]
        : prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];

    setUpgradeSelections((s) => ({ ...s, [groupId]: next }));
    setUpgradeSelection(buyer.token, groupId, next).catch((err) => {
      console.error(err);
      window.alert("Couldn't save that upgrade — please try again.");
      setUpgradeSelections((s) => ({ ...s, [groupId]: prev }));
    });
  };

  const setQuantity = (groupId: string, itemId: string, quantity: number) => {
    if (signedAt) return;
    const prev = upgradeSelections[groupId] || [];
    const { toggles, quantities } = decodeUpgradeEntries(prev);
    const nextQuantities = { ...quantities };
    if (quantity > 0) nextQuantities[itemId] = quantity;
    else delete nextQuantities[itemId];
    const next = encodeUpgradeEntries(toggles, nextQuantities);

    setUpgradeSelections((s) => ({ ...s, [groupId]: next }));
    setUpgradeSelection(buyer.token, groupId, next).catch((err) => {
      console.error(err);
      window.alert("Couldn't save that upgrade — please try again.");
      setUpgradeSelections((s) => ({ ...s, [groupId]: prev }));
    });
  };

  const sendNote = () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    const categoryId = active.id;
    const entry: NoteEntry = { author: "buyer", text, time: "Just now" };
    setNotes((n) => ({ ...n, [categoryId]: [...(n[categoryId] || []), entry] }));
    setDraft("");
    addNote(buyer.token, categoryId, "buyer", text).catch((err) => console.error(err));
  };

  const canSign = signerName.trim().length > 1 && agreed && !signedAt;
  const sign = async () => {
    if (!canSign) return;
    try {
      const iso = await signSelections(buyer.token, signerName.trim());
      setSignedAt(formatSignedAt(iso));
    } catch (err) {
      console.error(err);
      window.alert("Couldn't submit your signature — please try again.");
    }
  };

  return (
    <div style={{ background: PAPER, minHeight: "100%", fontFamily: body, color: INK }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ background: PINE_DARK, color: "#EFEADE" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-sm"
            style={{ background: BRASS }}
          >
            <House size={18} color={PINE_DARK} />
          </div>
          <div>
            <div style={{ fontFamily: display, fontSize: 18, lineHeight: 1.1, color: "#F3EFE4" }}>
              {buyer.community} · Lot {buyer.lot}
            </div>
            <div style={{ fontSize: 12, color: "#C7C2B4" }}>
              Selections for the {buyer.family_name} family
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div style={{ fontFamily: mono, fontSize: 11, color: "#C7C2B4" }}>
              {madeCount} of {CATEGORIES.length} selected
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: "#F3EFE4" }}>
              {upgradesSummary}
            </div>
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm"
            style={{
              background: signedAt ? "#4A4742" : BRASS,
              color: signedAt ? "#F3EFE4" : PINE_DARK,
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {signedAt ? <CircleCheckBig size={16} /> : <PenTool size={16} />}
            {signedAt ? "View signed selections" : "Review & sign"}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <div
          className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 py-3 md:w-64 md:min-h-[calc(100vh-72px)] md:border-r"
          style={{ borderColor: LINE }}
        >
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const { chosen, upgrade } = lineFor(cat);
            const isActive = cat.id === activeId;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className="flex shrink-0 md:shrink items-center gap-3 px-3 py-2.5 text-left"
                style={{
                  background: isActive ? CARD : "transparent",
                  borderLeft: isActive ? `3px solid ${PINE}` : "3px solid transparent",
                  borderRadius: 2,
                  minWidth: 180,
                }}
              >
                <Icon size={16} color={isActive ? PINE : MUTED} />
                <div className="flex-1">
                  <div style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}>
                    {cat.name}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: MUTED }}>
                    {chosen
                      ? chosen.name.split("—")[0].trim()
                      : cat.optional
                      ? "Optional — not chosen"
                      : "Not yet chosen"}
                  </div>
                </div>
                {chosen && (
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 10.5,
                      color: optionIsTBD(cat.id, chosen) || upgrade > 0 ? BRASS : PINE,
                    }}
                  >
                    {optionIsTBD(cat.id, chosen) ? "TBD" : upgrade > 0 ? `+${fmt(upgrade)}` : "Incl."}
                  </span>
                )}
              </button>
            );
          })}

          <div
            className="hidden md:block mt-4 mb-1 px-3"
            style={{ fontFamily: mono, fontSize: 10, color: MUTED, letterSpacing: 1 }}
          >
            HOME UPGRADES
          </div>

          {UPGRADE_GROUPS.map((group) => {
            const Icon = group.icon;
            const groupTotal = upgradeGroupTotal(group);
            const isActive = group.id === activeId;
            const statusText = group.floors
              ? (() => {
                  const upgraded = group.floors.filter(
                    (f) => floorLineFor(group, f).upgrade > 0
                  ).length;
                  return upgraded > 0
                    ? `${upgraded} floor${upgraded > 1 ? "s" : ""} upgraded`
                    : "Standard 8' throughout";
                })()
              : (upgradeSelections[group.id] || []).length > 0
              ? `${(upgradeSelections[group.id] || []).length} selected`
              : "None selected";
            return (
              <button
                key={group.id}
                onClick={() => setActiveId(group.id)}
                className="flex shrink-0 md:shrink items-center gap-3 px-3 py-2.5 text-left"
                style={{
                  background: isActive ? CARD : "transparent",
                  borderLeft: isActive ? `3px solid ${PINE}` : "3px solid transparent",
                  borderRadius: 2,
                  minWidth: 180,
                }}
              >
                <Icon size={16} color={isActive ? PINE : MUTED} />
                <div className="flex-1">
                  <div style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 500 }}>
                    {group.name}
                  </div>
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: MUTED }}>
                    {statusText}
                  </div>
                </div>
                {groupTotal > 0 && (
                  <span style={{ fontFamily: mono, fontSize: 10.5, color: BRASS }}>
                    +{fmt(groupTotal)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-3xl">
          <div className="mb-1" style={{ fontFamily: mono, fontSize: 11, color: MUTED, letterSpacing: 1 }}>
            {active.room.toUpperCase()}
          </div>
          <h1
            className="flex flex-wrap items-baseline gap-2"
            style={{ fontFamily: display, fontSize: 30, marginBottom: 6 }}
          >
            {active.name}
            {active.optional && (
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: MUTED,
                  border: `1px solid ${LINE}`,
                  borderRadius: 20,
                  padding: "2px 8px",
                }}
              >
                optional
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13.5, color: MUTED, maxWidth: 520, marginBottom: 20 }}>
            {active.note}
          </p>

          {/* Options grid (categories) */}
          {active.options && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {active.options.map((opt) => {
                const isChosen = selections[active.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => choose(active.id, opt.id)}
                    disabled={!!signedAt}
                    className="text-left p-3 relative"
                    style={{
                      background: CARD,
                      border: `1.5px solid ${isChosen ? PINE : LINE}`,
                      borderRadius: 4,
                      opacity: signedAt && !isChosen ? 0.55 : 1,
                    }}
                  >
                    {isChosen && (
                      <div
                        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ background: PINE }}
                      >
                        <Check size={12} color="#fff" />
                      </div>
                    )}
                    <OptionSwatch photoKey={`${active.id}__${opt.id}`} swatch={opt.swatch} />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{opt.name}</div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>
                      {opt.desc}
                    </div>
                    <div
                      className="inline-block px-2 py-0.5"
                      style={{
                        fontFamily: mono,
                        fontSize: 11.5,
                        borderRadius: 20,
                        background: opt.included ? "#E7E4DA" : "#F3E9D8",
                        color: opt.included ? PINE : BRASS,
                      }}
                    >
                      {(() => {
                        if (opt.included) return "Complimentary";
                        const cost = optionCost(active.id, opt);
                        return cost === null ? "Price TBD" : `+${fmt(cost)} upgrade`;
                      })()}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Per-floor selector (ceiling height) */}
          {active.floors && (
            <div className="flex flex-col gap-5 mb-6">
              {active.floors.map((floor) => (
                <div key={floor.id}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                    {floor.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {floor.options.map((opt) => {
                      const { key, chosen } = floorLineFor(active, floor);
                      const isChosen = chosen !== null && chosen.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => choose(key, opt.id)}
                          disabled={!!signedAt}
                          className="px-3.5 py-2"
                          style={{
                            borderRadius: 20,
                            border: `1.5px solid ${isChosen ? PINE : LINE}`,
                            background: isChosen ? PINE : CARD,
                            opacity: signedAt && !isChosen ? 0.55 : 1,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: isChosen ? "#F3EFE4" : INK,
                            }}
                          >
                            {opt.name}
                          </span>{" "}
                          <span
                            style={{
                              fontFamily: mono,
                              fontSize: 11,
                              color: isChosen ? "#D6D2C6" : MUTED,
                            }}
                          >
                            {opt.included
                              ? "(standard)"
                              : `(+${fmt(flatFor(`${active.id}__${opt.id}`, opt.upgradeCost ?? 0))})`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle / quantity list (home upgrade packages) */}
          {active.items && (
            <div className="flex flex-col gap-3 mb-6">
              {active.items.map((item) => {
                const sel = upgradeSelections[active.id] || [];

                if (item.kind === "quantity") {
                  const { quantities } = decodeUpgradeEntries(sel);
                  const qty = quantities[item.id] || 0;
                  const unitPrice = quantityUnitPrice(active.id, item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3"
                      style={{
                        background: CARD,
                        border: `1.5px solid ${qty > 0 ? PINE : LINE}`,
                        borderRadius: 4,
                        opacity: signedAt && qty === 0 ? 0.55 : 1,
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                          <span style={{ fontFamily: mono, fontSize: 13, color: BRASS }}>
                            {fmt(unitPrice)} / {item.unit}
                            {qty > 0 ? ` — ${fmt(unitPrice * qty)} total` : ""}
                          </span>
                        </div>
                        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(active.id, item.id, Math.max(0, qty - 1))}
                          disabled={!!signedAt || qty === 0}
                          className="flex h-7 w-7 items-center justify-center"
                          style={{ border: `1.5px solid ${LINE}`, borderRadius: 3, fontSize: 16, lineHeight: 1 }}
                        >
                          −
                        </button>
                        <span style={{ fontFamily: mono, fontSize: 14, minWidth: 16, textAlign: "center" }}>
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(active.id, item.id, qty + 1)}
                          disabled={!!signedAt}
                          className="flex h-7 w-7 items-center justify-center"
                          style={{ border: `1.5px solid ${LINE}`, borderRadius: 3, fontSize: 16, lineHeight: 1 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                }

                const isChosen = sel.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleUpgrade(active.id, item.id, active.type)}
                    disabled={!!signedAt}
                    className="flex items-start gap-3 p-3 text-left"
                    style={{
                      background: CARD,
                      border: `1.5px solid ${isChosen ? PINE : LINE}`,
                      borderRadius: 4,
                      opacity: signedAt && !isChosen ? 0.55 : 1,
                    }}
                  >
                    <div
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
                      style={{
                        border: `1.5px solid ${isChosen ? PINE : LINE}`,
                        borderRadius: active.type === "single" ? "50%" : 3,
                        background: isChosen ? PINE : "transparent",
                      }}
                    >
                      {isChosen && <Check size={12} color="#fff" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
                        <span style={{ fontFamily: mono, fontSize: 13, color: BRASS }}>
                          {(() => {
                            const cost = toggleItemPrice(active.id, item);
                            if (cost === null) return "Price TBD";
                            return `+${fmt(cost)}${item.unit ? ` ${item.unit}` : ""}`;
                          })()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selection status (categories) */}
          {active.options && (
            <div className="mb-8">
              {(() => {
                const { chosen, upgrade } = lineFor(active);
                return (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 3 }}
                  >
                    {!chosen ? (
                      <span style={{ fontFamily: mono, fontSize: 12, color: MUTED }}>
                        No selection made yet{active.optional ? " — optional" : ""}
                      </span>
                    ) : chosen.included ? (
                      <>
                        <CircleCheckBig size={15} color={PINE} />
                        <span style={{ fontFamily: mono, fontSize: 12, color: PINE }}>
                          Complimentary selection — no added cost
                        </span>
                      </>
                    ) : optionIsTBD(active.id, chosen) ? (
                      <>
                        <ArrowUpRight size={15} color={BRASS} />
                        <span style={{ fontFamily: mono, fontSize: 12, color: BRASS }}>
                          Upgrade selected — price to be determined
                        </span>
                      </>
                    ) : (
                      <>
                        <ArrowUpRight size={15} color={BRASS} />
                        <span style={{ fontFamily: mono, fontSize: 12, color: BRASS }}>
                          Upgrade selected — +{fmt(upgrade)}
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Group subtotal (upgrade packages) */}
          {(active.items || active.floors) && (
            <div className="mb-8">
              {(() => {
                const groupTotal = upgradeGroupTotal(active);
                const selCount = active.floors
                  ? active.floors.filter((f) => floorLineFor(active, f).upgrade > 0).length
                  : (upgradeSelections[active.id] || []).length;
                const label = active.floors
                  ? `${selCount} floor${selCount === 1 ? "" : "s"} upgraded`
                  : `${selCount} item${selCount === 1 ? "" : "s"} selected`;
                return (
                  <div
                    className="flex items-center gap-2 px-3 py-2.5"
                    style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 3 }}
                  >
                    {groupTotal > 0 ? (
                      <>
                        <ArrowUpRight size={15} color={BRASS} />
                        <span style={{ fontFamily: mono, fontSize: 12, color: BRASS }}>
                          {label} — +{fmt(groupTotal)}
                        </span>
                      </>
                    ) : (
                      <span style={{ fontFamily: mono, fontSize: 12, color: MUTED }}>
                        No upgrades selected in this group
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Notes thread */}
          <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={15} color={MUTED} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                Questions on {active.name}
              </span>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {(notes[active.id] || []).length === 0 && (
                <div style={{ fontSize: 12.5, color: MUTED, fontStyle: "italic" }}>
                  No questions yet on this selection — ask away, it goes straight to the builder.
                </div>
              )}
              {(notes[active.id] || []).map((n, i) => (
                <div
                  key={i}
                  className="max-w-[85%] px-3 py-2"
                  style={{
                    alignSelf: n.author === "buyer" ? "flex-end" : "flex-start",
                    background: n.author === "buyer" ? PINE : CARD,
                    color: n.author === "buyer" ? "#F3EFE4" : INK,
                    border: n.author === "buyer" ? "none" : `1px solid ${LINE}`,
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 13 }}>{n.text}</div>
                  <div style={{ fontFamily: mono, fontSize: 10, marginTop: 3, opacity: 0.7 }}>
                    {n.author === "buyer" ? "You" : "Builder"} · {n.time}
                  </div>
                </div>
              ))}
            </div>
            {!signedAt && (
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendNote()}
                  placeholder="Ask a question about this selection…"
                  className="flex-1 px-3 py-2 text-sm outline-none"
                  style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 3 }}
                />
                <button
                  onClick={sendNote}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm"
                  style={{ background: PINE, color: "#F3EFE4", borderRadius: 3, fontWeight: 500 }}
                >
                  <Send size={14} /> Send
                </button>
              </div>
            )}
          </div>

          <p
            className="mt-10"
            style={{ fontSize: 11.5, color: MUTED, fontStyle: "italic", maxWidth: 520 }}
          >
            Pricing and selection availability are subject to change at any time
            without notice.
          </p>
        </div>
      </div>

      {/* Review & Sign modal */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-30 flex items-start md:items-center justify-center p-4 overflow-y-auto"
          style={{ background: "rgba(36,32,28,0.55)" }}
        >
          <div className="w-full max-w-lg my-6" style={{ background: CARD, borderRadius: 4 }}>
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${LINE}` }}
            >
              <div style={{ fontFamily: display, fontSize: 19 }}>
                {signedAt ? "Signed selections" : "Review your selections"}
              </div>
              <button onClick={() => setReviewOpen(false)}>
                <X size={18} color={MUTED} />
              </button>
            </div>

            <div className="px-5 py-4 max-h-80 overflow-y-auto">
              {CATEGORIES.map((cat) => {
                const { chosen, upgrade } = lineFor(cat);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: `1px solid ${LINE}` }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: MUTED }}>
                        {chosen
                          ? chosen.name
                          : cat.optional
                          ? "Optional — skipped"
                          : "Not yet selected"}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: mono,
                        fontSize: 12.5,
                        color: !chosen ? MUTED : optionIsTBD(cat.id, chosen) || upgrade > 0 ? BRASS : PINE,
                      }}
                    >
                      {!chosen
                        ? "—"
                        : optionIsTBD(cat.id, chosen)
                        ? "Price TBD"
                        : upgrade > 0
                        ? `+${fmt(upgrade)}`
                        : "Included"}
                    </div>
                  </div>
                );
              })}

              <div
                className="mt-3 mb-1 pt-3"
                style={{ borderTop: `1px solid ${LINE}`, fontFamily: mono, fontSize: 11, color: MUTED, letterSpacing: 1 }}
              >
                HOME UPGRADES
              </div>
              {allUpgradesTotal === 0 && (
                <div style={{ fontSize: 12.5, color: MUTED, fontStyle: "italic", padding: "6px 0" }}>
                  No upgrade packages selected.
                </div>
              )}
              {UPGRADE_GROUPS.flatMap((group) => {
                if (group.floors) {
                  return group.floors
                    .map((floor) => ({ floor, ...floorLineFor(group, floor) }))
                    .filter((f) => f.upgrade > 0)
                    .map((f) => (
                      <div
                        key={`${group.id}-${f.floor.id}`}
                        className="flex items-center justify-between py-2"
                        style={{ borderBottom: `1px solid ${LINE}` }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {f.floor.name} — {f.chosen?.name} Ceiling
                          </div>
                          <div style={{ fontSize: 12, color: MUTED }}>{group.name}</div>
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 12.5, color: BRASS }}>
                          +{fmt(f.upgrade)}
                        </div>
                      </div>
                    ));
                }
                const sel = upgradeSelections[group.id] || [];
                const { toggles, quantities } = decodeUpgradeEntries(sel);
                return group.items
                  .filter((item) =>
                    item.kind === "quantity" ? (quantities[item.id] || 0) > 0 : toggles.has(item.id)
                  )
                  .map((item) => {
                    const qty = item.kind === "quantity" ? quantities[item.id] || 0 : 0;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-2"
                        style={{ borderBottom: `1px solid ${LINE}` }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {item.name}
                            {item.kind === "quantity" ? ` × ${qty} ${item.unit}${qty === 1 ? "" : "s"}` : ""}
                          </div>
                          <div style={{ fontSize: 12, color: MUTED }}>{group.name}</div>
                        </div>
                        <div style={{ fontFamily: mono, fontSize: 12.5, color: BRASS }}>
                          {(() => {
                            if (item.kind === "quantity")
                              return `+${fmt(quantityUnitPrice(group.id, item) * qty)}`;
                            const cost = toggleItemPrice(group.id, item);
                            return cost === null ? "Price TBD" : `+${fmt(cost)}`;
                          })()}
                        </div>
                      </div>
                    );
                  });
              })}

              <div className="flex items-center justify-between pt-3">
                <div style={{ fontSize: 14, fontWeight: 700 }}>Total upgrades</div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: grandUpgradesTotal > 0 || hasTBDSelected ? BRASS : MUTED,
                  }}
                >
                  {grandUpgradesTotal > 0 && hasTBDSelected
                    ? `+${fmt(grandUpgradesTotal)} + price TBD items`
                    : grandUpgradesTotal > 0
                    ? `+${fmt(grandUpgradesTotal)}`
                    : hasTBDSelected
                    ? "Price TBD items selected"
                    : "None selected"}
                </div>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
              <p style={{ fontSize: 11.5, color: MUTED, fontStyle: "italic", marginBottom: 12 }}>
                Pricing and selection availability are subject to change at any
                time without notice.
              </p>
              {signedAt ? (
                <div className="flex items-center gap-2" style={{ color: PINE }}>
                  <CircleCheckBig size={18} />
                  <span style={{ fontSize: 13 }}>
                    Signed by <strong>{signerName}</strong> on {signedAt}
                  </span>
                </div>
              ) : (
                <>
                  <label style={{ fontSize: 12, color: MUTED }}>Full name</label>
                  <input
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Type your full name"
                    className="w-full px-3 py-2 mt-1 mb-3 text-sm outline-none"
                    style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 3 }}
                  />
                  <label className="flex items-start gap-2 mb-4" style={{ fontSize: 12.5 }}>
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5"
                    />
                    I approve these selections and any upgrade costs shown above.
                  </label>
                  <button
                    onClick={sign}
                    disabled={!canSign}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                    style={{
                      background: canSign ? PINE : LINE,
                      color: canSign ? "#F3EFE4" : MUTED,
                      borderRadius: 3,
                      fontWeight: 600,
                    }}
                  >
                    <PenTool size={15} /> Sign & submit selections
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
