import React, { useState } from "react";
import {
  AddRow,
  COLORS,
  ConvoRow,
  Icon,
  Section,
  UserAvatar,
  iconOf,
} from "./chat_shared";

// Modal: create a channel (name + pick people)
function ChannelPicker({ people, loading, onlineIds, onCreate, onClose }) {
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => new Set());
  const [saving, setSaving] = useState(false);

  const s = q.trim().toLowerCase();
  const list = people.filter((p) => !s || p.name.toLowerCase().includes(s));
  const canCreate = name.trim().length > 0 && picked.size > 0 && !saving;

  const toggle = (uuid) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });

  const submit = async () => {
    if (!canCreate) return;
    setSaving(true);
    const ok = await onCreate({
      name: name.trim(),
      employeeUuids: [...picked],
    });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-[440px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: COLORS.line }}
        >
          <div
            className="text-[17px] font-medium"
            style={{ color: COLORS.text }}
          >
            Create channel
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 hover:bg-[#F2F4F3]"
            style={{ color: COLORS.sub }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="space-y-2 px-4 py-3">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
            maxLength={80}
            className="h-9 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[#1d1d1f]"
            style={{ borderColor: "#b9bdbb", color: COLORS.text }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people to add"
            className="h-9 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[#1d1d1f]"
            style={{ borderColor: "#b9bdbb", color: COLORS.text }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          {loading && (
            <div
              className="px-4 py-3 text-[14px]"
              style={{ color: COLORS.sub }}
            >
              Loading people…
            </div>
          )}
          {!loading && list.length === 0 && (
            <div
              className="px-4 py-3 text-[14px]"
              style={{ color: COLORS.sub }}
            >
              No one found.
            </div>
          )}
          {list.map((p) => {
            const on = picked.has(String(p.uuid));
            return (
              <button
                key={p.uuid}
                onClick={() => toggle(String(p.uuid))}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[#F2F4F3]"
              >
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border text-[12px] text-white"
                  style={{
                    borderColor: on ? COLORS.active : "#b9bdbb",
                    background: on ? COLORS.active : "#fff",
                  }}
                >
                  {on ? "✓" : ""}
                </span>
                <UserAvatar
                  user={p}
                  size={30}
                  online={onlineIds.has(String(p.uuid))}
                />
                <div className="min-w-0">
                  <div
                    className="truncate text-[15px] font-medium"
                    style={{ color: COLORS.text }}
                  >
                    {p.name}
                  </div>
                  {(p.designation || p.department) && (
                    <div
                      className="truncate text-[12.5px]"
                      style={{ color: COLORS.sub }}
                    >
                      {[p.designation, p.department]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between border-t px-4 py-3"
          style={{ borderColor: COLORS.line }}
        >
          <span className="text-[13px]" style={{ color: COLORS.sub }}>
            {picked.size} selected
          </span>
          <button
            onClick={submit}
            disabled={!canCreate}
            className="h-9 rounded-md px-4 text-[14px] font-medium text-white disabled:opacity-50"
            style={{ background: COLORS.active }}
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * "Channels" sidebar section.
 * channels = already filtered list of conversations with kind === "channel".
 */
export default function Channels({
  channels,
  activeId,
  onSelect,
  onlineIds,
  people,
  peopleLoading,
  onLoadPeople,
  onCreateChannel,
  open,
  onToggle,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = () => {
    onLoadPeople();
    setPickerOpen(true);
  };

  return (
    <>
      <Section
        label="Channels"
        open={open}
        onToggle={onToggle}
        addLabel="Add channel"
        onAdd={openPicker}
      >
        {channels.map((c) => (
          <ConvoRow
            key={c.id}
            convo={c}
            activeId={activeId}
            onSelect={onSelect}
            lead={
              <Icon
                name={iconOf(c)}
                size={15}
                className="shrink-0 opacity-80"
              />
            }
          />
        ))}
        <AddRow label="Add channels" onClick={openPicker} />
      </Section>

      {pickerOpen && (
        <ChannelPicker
          people={people}
          loading={peopleLoading}
          onlineIds={onlineIds}
          onClose={() => setPickerOpen(false)}
          onCreate={onCreateChannel}
        />
      )}
    </>
  );
}
