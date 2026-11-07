import React, { useState } from "react";
import {
  AddRow,
  COLORS,
  ConvoRow,
  Icon,
  Section,
  iconOf,
} from "./chat_shared";

// Modal: create a team (name + choose a department, everyone in it is added)
function TeamPicker({ departments, onCreate, onClose }) {
  const [name, setName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [saving, setSaving] = useState(false);
  const canCreate = name.trim().length > 0 && deptId !== "" && !saving;

  const submit = async () => {
    if (!canCreate) return;
    setSaving(true);
    const ok = await onCreate({ name: name.trim(), departmentId: deptId });
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-[420px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
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
            Create team
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
            placeholder="Team name"
            maxLength={80}
            className="h-9 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[#1d1d1f]"
            style={{ borderColor: "#b9bdbb", color: COLORS.text }}
          />
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="h-9 w-full rounded-md border bg-white px-2 text-[14px] outline-none focus:border-[#1d1d1f]"
            style={{ borderColor: "#b9bdbb", color: COLORS.text }}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex justify-end border-t px-4 py-3"
          style={{ borderColor: COLORS.line }}
        >
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
 * "Teams" sidebar section.
 * teams = already filtered list of conversations with kind === "team".
 */
export default function Teams({
  teams,
  activeId,
  onSelect,
  departments,
  onLoadDepartments,
  onCreateTeam,
  open,
  onToggle,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = () => {
    onLoadDepartments?.();
    setPickerOpen(true);
  };

  return (
    <>
      <Section
        label="Teams"
        open={open}
        onToggle={onToggle}
        addLabel="Add team"
        onAdd={openPicker}
      >
        {teams.map((c) => (
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
        <AddRow label="Create team" onClick={openPicker} />
      </Section>

      {pickerOpen && (
        <TeamPicker
          departments={departments}
          onClose={() => setPickerOpen(false)}
          onCreate={onCreateTeam}
        />
      )}
    </>
  );
}
