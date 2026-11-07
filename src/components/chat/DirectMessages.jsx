import React, { useState } from "react";
import {
  AddRow,
  COLORS,
  ConvoRow,
  Icon,
  Section,
  UserAvatar,
} from "./chat_shared";

// Modal: pick one person to start a direct message
function PeoplePicker({ people, loading, onlineIds, onPick, onClose }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const list = people.filter((p) => !s || p.name.toLowerCase().includes(s));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-[420px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
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
            New message
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

        <div className="px-4 py-3">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people"
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
          {list.map((p) => (
            <button
              key={p.uuid}
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-[#F2F4F3]"
            >
              <UserAvatar
                user={p}
                size={34}
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
                    {[p.designation, p.department].filter(Boolean).join(" · ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * "Direct messages" sidebar section.
 * dms = already filtered list of conversations with kind === "dm".
 */
export default function DirectMessages({
  dms,
  activeId,
  onSelect,
  onlineIds,
  people,
  peopleLoading,
  onLoadPeople,
  onStartDm,
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
        label="Direct messages"
        open={open}
        onToggle={onToggle}
        addLabel="New message"
        onAdd={openPicker}
      >
        {dms.map((c) => (
          <ConvoRow
            key={c.id}
            convo={c}
            activeId={activeId}
            onSelect={onSelect}
            lead={
              <UserAvatar
                user={c.peer}
                size={18}
                online={onlineIds.has(String(c.peer?.uuid))}
                ring={COLORS.side}
              />
            }
          />
        ))}
        <AddRow label="Add teammates" onClick={openPicker} />
      </Section>

      {pickerOpen && (
        <PeoplePicker
          people={people}
          loading={peopleLoading}
          onlineIds={onlineIds}
          onClose={() => setPickerOpen(false)}
          onPick={(person) => {
            setPickerOpen(false);
            onStartDm(person);
          }}
        />
      )}
    </>
  );
}
