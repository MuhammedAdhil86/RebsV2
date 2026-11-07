import React, { useState } from "react";

export const COLORS = {
  side: "#1d1d1f",
  sideHover: "#2b2b2e",
  sideText: "#c4c6c5",
  active: "#d13843",
  text: "#1d1d1f",
  sub: "#6b6f6e",
  line: "#dfe3e1",
  link: "#d13843",
  tint: "#fbe8ea",
  mist: "#F2F4F3",
  online: "#2bac76",
  offline: "#9a9e9d",
  badge: "#d13843",
};

const ICON_PATHS = {
  hash: "M9.4 3 8.700 7H5v2h3.300l-.7 4H4v2h3.300l-.7 4h2l.7-4h4l-.7 4h2l.7-4H19v-2h-3.300l.7-4H20V7h-3.300l.7-4h-2l-.7 4h-4l.7-4Zm-.4 6h4l-.7 4h-4Z",
  lock: "M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9Z",
  caret: "M8 5l8 7-8 7Z",
  close:
    "M19 6.400 17.600 5 12 10.600 6.400 5 5 6.400 10.600 12 5 17.600 6.400 19 12 13.400 17.600 19 19 17.600 13.400 12Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z",
  search:
    "M15.500 14h-.8l-.3-.3a6.500 6.500 0 1 0-.7.7l.3.3v.8l5 5 1.500-1.500Zm-6 0a4.500 4.500 0 1 1 0-9 4.500 4.500 0 0 1 0 9Z",
  back: "M12 4l1.400 1.400L7.800 11H20v2H7.800l5.600 5.600L12 20l-8-8Z",
  smile:
    "M9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 6.500c2 0 3.700-1.200 4.400-3H7.600c.7 1.800 2.400 3 4.400 3ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
  reply: "M10 9V5l-7 7 7 7v-4.100c5 0 8.500 1.600 11 5.100-1-5-4-10-11-11Z",
  more: "M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  at: "M12 2a10 10 0 1 0 5 18.600l-1-1.700A8 8 0 1 1 20 12v1.500a1.500 1.500 0 0 1-3 0V12a5 5 0 1 0-1.500 3.600A3.500 3.500 0 0 0 22 13.500V12A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  clip: "M16.500 6.500v9.800a4.500 4.500 0 0 1-9 0V5.800a3 3 0 0 1 6 0v9.500a1.500 1.500 0 0 1-3 0V6.500H9.100v8.800a3 3 0 0 0 6 0V5.800a4.500 4.500 0 0 0-9 0v10.500a6 6 0 0 0 12 0V6.500Z",
  send: "M2 21l21-9L2 3v7l15 2-15 2Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-1 7V3.500L18.500 9Z",
  users:
    "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.300 0-7 1.200-7 3.500V19h14v-2.500C15 14.200 10.300 13 8 13Zm8 0c-.3 0-.6 0-1 .1 1.200.9 2 2 2 3.400V19h6v-2.500c0-2.300-4.700-3.500-7-3.500Z",
};

export function Icon({ name, size = 16, className = "", style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const FALLBACK_COLORS = [
  "#e8912d",
  "#2eb67d",
  "#36c5f0",
  "#e01e5a",
  "#7c3aed",
  "#0b7a75",
  "#c2410c",
  "#1d4ed8",
];

const colorFor = (key = "") =>
  FALLBACK_COLORS[
    [...String(key)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
      FALLBACK_COLORS.length
  ];

const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

// online: true / false draws a status dot. Leave it undefined for no dot.
// ring: colour of the border around the dot (match the background behind it).
export function UserAvatar({ user, size = 36, online, ring = "#fff" }) {
  const u = user ?? { name: "?" };
  const box = { width: size, height: size };

  const avatar = u.image ? (
    <img
      src={u.image.replace(/ /g, "%20")}
      alt={u.name}
      style={box}
      className="shrink-0 rounded-[6px] object-cover"
    />
  ) : (
    <div
      style={{
        ...box,
        background: colorFor(u.uuid ?? u.name),
        fontSize: size * 0.38,
      }}
      className="flex shrink-0 items-center justify-center rounded-[6px] font-medium text-white"
    >
      {initials(u.name)}
    </div>
  );

  if (online === undefined) return avatar;

  const dot = Math.max(8, Math.round(size * 0.32));

  return (
    <span className="relative inline-block shrink-0" style={box}>
      {avatar}
      <span
        title={online ? "Active" : "Away"}
        className="absolute rounded-full border-solid"
        style={{
          width: dot,
          height: dot,
          right: -Math.round(dot / 4),
          bottom: -Math.round(dot / 4),
          borderWidth: size < 24 ? 1.5 : 2,
          borderColor: ring,
          background: online ? COLORS.online : COLORS.offline,
        }}
      />
    </span>
  );
}

export const titleOf = (c) =>
  c.kind === "dm" ? (c.peer?.name ?? c.name) : c.name;

export const iconOf = (c) =>
  c.kind === "team" ? "users" : c.private ? "lock" : "hash";

function Section({ label, open, onToggle, addLabel, onAdd, children }) {
  return (
    <div
      className="flex min-h-0 flex-col"
      style={{ flex: open ? "1 1 0%" : "0 0 auto" }}
    >
      <div className="group flex shrink-0 items-center justify-between px-4 py-1.5">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[15px] hover:text-white"
          style={{ color: COLORS.sideText }}
        >
          <Icon
            name="caret"
            size={10}
            className={`transition-transform ${open ? "rotate-90" : ""}`}
          />
          {label}
        </button>
        <button
          onClick={onAdd}
          className="rounded p-0.5 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
          style={{ color: COLORS.sideText }}
          aria-label={addLabel}
        >
          <Icon name="plus" size={14} />
        </button>
      </div>

      {open && (
        <div className="chat-scroll min-h-0 flex-1 overflow-y-auto pb-1">
          {children}
        </div>
      )}
    </div>
  );
}

function Row({ active, unread, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[28px] w-full shrink-0 items-center gap-2 px-4 text-left text-[15px] transition"
      style={{
        background: active ? COLORS.active : "transparent",
        color: active ? "#fff" : unread ? "#fff" : COLORS.sideText,
        fontWeight: unread && !active ? 500 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = COLORS.sideHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
      {unread > 0 && !active && (
        <span
          className="ml-auto rounded-full px-1.5 text-[12px] font-medium leading-[18px] text-white"
          style={{ background: COLORS.badge }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}

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

// Create a channel: name + pick people (same people list as direct messages)
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

// Create a team: name + choose a department (everyone in it is added)
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

function AddRow({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[28px] w-full shrink-0 items-center gap-2 px-4 text-[15px] hover:bg-[#2b2b2e]"
      style={{ color: COLORS.sideText }}
    >
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-white/15">
        <Icon name="plus" size={12} />
      </span>
      {label}
    </button>
  );
}

const NO_ONE = new Set();

export default function ChatSidebar({
  convos,
  activeId,
  loading,
  online = false,
  onlineIds = NO_ONE,
  currentUser,
  onSelect,
  people,
  peopleLoading,
  onLoadPeople,
  onStartDm,
  onCreateChannel,
  departments = [],
  onLoadDepartments,
  onCreateTeam,
}) {
  const [query, setQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [open, setOpen] = useState({ teams: true, channels: true, dms: true });

  const openPicker = () => {
    onLoadPeople();
    setPickerOpen(true);
  };
  const openChannelPicker = () => {
    onLoadPeople();
    setChannelOpen(true);
  };
  const openTeamPicker = () => {
    onLoadDepartments?.();
    setTeamOpen(true);
  };
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const q = query.trim().toLowerCase();
  const match = (c) => !q || titleOf(c).toLowerCase().includes(q);

  const teams = convos.filter((c) => c.kind === "team" && match(c));
  const channels = convos.filter((c) => c.kind === "channel" && match(c));
  const dms = convos.filter((c) => c.kind === "dm" && match(c));

  const renderRow = (c, lead) => (
    <Row
      key={c.id}
      active={c.id === activeId}
      unread={c.unread}
      onClick={() => onSelect(c.id)}
    >
      {lead}
      <span className="truncate">{titleOf(c)}</span>
    </Row>
  );

  const renderIcon = (c) => (
    <Icon name={iconOf(c)} size={15} className="shrink-0 opacity-80" />
  );

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: COLORS.side }}
    >
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b pl-16 pr-4 md:pl-4"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <div className="text-[17px] font-medium text-white">REBS Workspace</div>
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: online ? COLORS.online : COLORS.offline }}
          title={online ? "Connected" : "Reconnecting…"}
        />
      </div>

      <div className="shrink-0 px-3 py-2.5">
        <div
          className="flex h-[30px] items-center gap-2 rounded-md px-2.5"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Icon name="search" size={15} className="text-white/80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a team, channel or person"
            className="w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/70"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Section
          label="Teams"
          open={open.teams}
          onToggle={() => toggle("teams")}
          addLabel="Add team"
          onAdd={openTeamPicker}
        >
          {teams.map((c) => renderRow(c, renderIcon(c)))}
          <AddRow label="Create team" onClick={openTeamPicker} />
        </Section>

        <Section
          label="Channels"
          open={open.channels}
          onToggle={() => toggle("channels")}
          addLabel="Add channel"
          onAdd={openChannelPicker}
        >
          {channels.map((c) => renderRow(c, renderIcon(c)))}
          <AddRow label="Add channels" onClick={openChannelPicker} />
        </Section>

        <Section
          label="Direct messages"
          open={open.dms}
          onToggle={() => toggle("dms")}
          addLabel="New message"
          onAdd={openPicker}
        >
          {dms.map((c) =>
            renderRow(
              c,
              <UserAvatar
                user={c.peer}
                size={18}
                online={onlineIds.has(String(c.peer?.uuid))}
                ring={COLORS.side}
              />,
            ),
          )}
          <AddRow label="Add teammates" onClick={openPicker} />
        </Section>
      </div>

      {loading && (
        <div
          className="px-4 py-3 text-[14px]"
          style={{ color: COLORS.sideText }}
        >
          Loading conversations…
        </div>
      )}
      {!loading && teams.length + channels.length + dms.length === 0 && (
        <div
          className="px-4 py-3 text-[14px]"
          style={{ color: COLORS.sideText }}
        >
          {q ? `Nothing matches “${query}”.` : "No conversations yet."}
        </div>
      )}

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

      {channelOpen && (
        <ChannelPicker
          people={people}
          loading={peopleLoading}
          onlineIds={onlineIds}
          onClose={() => setChannelOpen(false)}
          onCreate={onCreateChannel}
        />
      )}

      {teamOpen && (
        <TeamPicker
          departments={departments}
          onClose={() => setTeamOpen(false)}
          onCreate={onCreateTeam}
        />
      )}

      <div
        className="flex shrink-0 items-center gap-2.5 border-t px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <UserAvatar user={currentUser} size={30} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-white">
            {currentUser?.name}
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: COLORS.sideText }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.online }}
            />{" "}
            Active
          </div>
        </div>
      </div>
    </div>
  );
}
