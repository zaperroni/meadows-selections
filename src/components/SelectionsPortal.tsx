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
  type ActiveEntity,
} from "@/lib/catalog";
import { chooseSelection, setUpgradeSelection, addNote, signSelections } from "@/lib/actions";
import type { Buyer, SelectionsMap, UpgradeSelectionsMap, NotesMap, NoteEntry } from "@/lib/types";

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
}

export default function SelectionsPortal({
  buyer,
  initialSelections,
  initialUpgradeSelections,
  initialNotes,
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

  const lineFor = (cat: Category) => {
    const chosenId = selections[cat.id];
    const chosen: CategoryOption | null = chosenId
      ? cat.options.find((o) => o.id === chosenId) ?? null
      : null;
    const upgrade = chosen && !chosen.included ? chosen.upgradeCost ?? 0 : 0;
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
    const upgrade = chosen && !chosen.included ? chosen.upgradeCost ?? 0 : 0;
    return { chosen, upgrade, key };
  };

  const upgradeGroupTotal = (group: UpgradeGroup) => {
    if (group.floors) {
      return group.floors.reduce((sum, floor) => sum + floorLineFor(group, floor).upgrade, 0);
    }
    const sel = upgradeSelections[group.id] || [];
    return group.items
      .filter((i) => sel.includes(i.id))
      .reduce((sum, i) => sum + i.price, 0);
  };

  const allUpgradesTotal = UPGRADE_GROUPS.reduce((sum, g) => sum + upgradeGroupTotal(g), 0);
  const grandUpgradesTotal = totals.upgrades + allUpgradesTotal;

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

  const sendNote = () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    const categoryId = active.id;
    const entry: NoteEntry = { author: "buyer", text, time: "Just now" };
    setNotes((n) => ({ ...n, [categoryId]: [...(n[categoryId] || []), entry] }));
    setDraft("");
    addNote(buyer.token, categoryId, "buyer", text).catch((err) => console.error(err));

    setTimeout(() => {
      const replyText =
        "Got it — logged against this selection, we'll follow up here shortly.";
      setNotes((n) => ({
        ...n,
        [categoryId]: [...(n[categoryId] || []), { author: "builder", text: replyText, time: "Just now" }],
      }));
      addNote(buyer.token, categoryId, "builder", replyText).catch((err) => console.error(err));
    }, 1100);
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
            <div style={{ fontSize: 12, color: "#B9C2B6" }}>
              Selections for the {buyer.family_name} family
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <div style={{ fontFamily: mono, fontSize: 11, color: "#B9C2B6" }}>
              {madeCount} of {CATEGORIES.length} selected
            </div>
            <div style={{ fontFamily: mono, fontSize: 13, color: "#F3EFE4" }}>
              {grandUpgradesTotal > 0 ? `+${fmt(grandUpgradesTotal)} in upgrades` : "No upgrades selected"}
            </div>
          </div>
          <button
            onClick={() => setReviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm"
            style={{
              background: signedAt ? "#5C6E5F" : BRASS,
              color: PINE_DARK,
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
                      color: upgrade > 0 ? BRASS : PINE,
                    }}
                  >
                    {upgrade > 0 ? `+${fmt(upgrade)}` : "Incl."}
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
                    <div
                      className="h-20 w-full mb-3"
                      style={{ background: opt.swatch, borderRadius: 3 }}
                    />
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
                        background: opt.included ? "#E4EAE1" : "#F3E9D8",
                        color: opt.included ? PINE : BRASS,
                      }}
                    >
                      {opt.included ? "Complimentary" : `+${fmt(opt.upgradeCost ?? 0)} upgrade`}
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
                              color: isChosen ? "#D8DED4" : MUTED,
                            }}
                          >
                            {opt.included ? "(standard)" : `(+${fmt(opt.upgradeCost ?? 0)})`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Toggle list (home upgrade packages) */}
          {active.items && (
            <div className="flex flex-col gap-3 mb-6">
              {active.items.map((item) => {
                const sel = upgradeSelections[active.id] || [];
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
                          +{fmt(item.price)}{item.unit ? ` ${item.unit}` : ""}
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
                        color: !chosen ? MUTED : upgrade > 0 ? BRASS : PINE,
                      }}
                    >
                      {!chosen ? "—" : upgrade > 0 ? `+${fmt(upgrade)}` : "Included"}
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
                return group.items
                  .filter((item) => sel.includes(item.id))
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2"
                      style={{ borderBottom: `1px solid ${LINE}` }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{group.name}</div>
                      </div>
                      <div style={{ fontFamily: mono, fontSize: 12.5, color: BRASS }}>
                        +{fmt(item.price)}
                      </div>
                    </div>
                  ));
              })}

              <div className="flex items-center justify-between pt-3">
                <div style={{ fontSize: 14, fontWeight: 700 }}>Total upgrades</div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: grandUpgradesTotal > 0 ? BRASS : MUTED,
                  }}
                >
                  {grandUpgradesTotal > 0 ? `+${fmt(grandUpgradesTotal)}` : "None selected"}
                </div>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: `1px solid ${LINE}` }}>
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
