import React, { useState, useMemo, useRef, useEffect } from "react";
import DashboardLayout from "../ui/pagelayout";

/* -------------------------------------------------------------------------- */
/*  Palette (Slack-like)                                                      */
/* -------------------------------------------------------------------------- */
const C = {
  side: "#1d1d1f", // dark grey
  sideHover: "#2b2b2e",
  sideText: "#c4c6c5",
  active: "#d13843", // raspberry hue
  text: "#1d1d1f",
  sub: "#6b6f6e",
  line: "#dfe3e1",
  link: "#d13843",
  tint: "#fbe8ea", // light raspberry tint
  mist: "#F2F4F3", // mist
  online: "#2bac76",
  badge: "#d13843",
};

/* -------------------------------------------------------------------------- */
/*  Static data (UI only)                                                     */
/* -------------------------------------------------------------------------- */
const ME = "u0";

const USERS = {
  u0: { name: "Admin", color: "#4a154b" },
  u1: { name: "Anjali Menon", color: "#e8912d", online: true },
  u2: { name: "Rahul Nair", color: "#2eb67d", online: true },
  u3: { name: "Sneha Pillai", color: "#36c5f0" },
  u4: { name: "Arun Kumar", color: "#e01e5a", online: true },
  u5: { name: "Divya Raj", color: "#7c3aed" },
  u6: { name: "Vishnu S", color: "#0b7a75", online: true },
  u7: { name: "Meera Das", color: "#c2410c" },
  u8: { name: "Joseph Thomas", color: "#1d4ed8" },
};

const INITIAL = [
  /* ---------------------------- channels (teams) --------------------------- */
  {
    id: "c-general",
    kind: "channel",
    name: "general",
    topic: "Company-wide updates and chatter",
    members: ["u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"],
    unread: 0,
    messages: [
      { day: "Yesterday" },
      {
        id: 1,
        user: "u2",
        time: "9:02 AM",
        text: "Good morning everyone! Reminder: the quarterly town hall is on Friday at 4 PM.",
        reactions: [
          { e: "👍", n: 6 },
          { e: "🎉", n: 2 },
        ],
      },
      {
        id: 2,
        user: "u7",
        time: "9:10 AM",
        text: "Will the recording be shared for those on leave?",
        replies: 2,
      },
      { day: "Today" },
      {
        id: 3,
        user: "u3",
        time: "8:55 AM",
        text: "Cafeteria menu for this week is up on the notice board 🍛",
      },
    ],
  },
  {
    id: "c-hr",
    kind: "channel",
    name: "hr-team",
    topic: "Everything HR: leave, attendance, policies",
    members: ["u0", "u1", "u2", "u3"],
    unread: 4,
    messages: [
      { day: "Today" },
      {
        id: 1,
        user: "u2",
        time: "9:30 AM",
        text: "Payroll cut-off is tomorrow, please finalize attendance.",
      },
      {
        id: 2,
        user: "u3",
        time: "9:45 AM",
        text: "Attendance for the Kochi office is done ✅",
        reactions: [{ e: "✅", n: 1 }],
      },
      {
        id: 3,
        user: "u3",
        time: "9:46 AM",
        text: "Sharing the exceptions sheet too.",
        file: { name: "attendance_exceptions_oct.xlsx", size: "42 KB" },
      },
      {
        id: 4,
        user: ME,
        time: "10:02 AM",
        text: "Thanks Sneha. Trivandrum will be done by 3 PM.",
      },
      {
        id: 5,
        user: "u2",
        time: "10:15 AM",
        text: "Great. I'll start processing after that.",
        replies: 1,
      },
    ],
  },
  {
    id: "c-eng",
    kind: "channel",
    name: "engineering",
    topic: "Builds, releases and code reviews",
    members: ["u0", "u6", "u7", "u4"],
    unread: 0,
    messages: [
      { day: "Yesterday" },
      {
        id: 1,
        user: "u6",
        time: "6:10 PM",
        text: "Deployment went through without issues.",
        reactions: [{ e: "🚀", n: 3 }],
      },
      { id: 2, user: "u7", time: "6:12 PM", text: "Nice work everyone 👏" },
      { id: 3, user: ME, time: "6:20 PM", text: "Thanks team!" },
    ],
  },
  {
    id: "c-ann",
    kind: "channel",
    name: "announcements",
    topic: "Official company announcements",
    members: ["u0", "u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8"],
    unread: 1,
    messages: [
      { day: "Tuesday" },
      {
        id: 1,
        user: "u3",
        time: "11:00 AM",
        text: "Diwali holiday notice draft is ready for review.",
        file: { name: "diwali_notice_2026.pdf", size: "128 KB" },
      },
      {
        id: 2,
        user: ME,
        time: "11:30 AM",
        text: "Looks good. Please publish it.",
        reactions: [{ e: "👍", n: 2 }],
      },
    ],
  },
  {
    id: "c-pay",
    kind: "channel",
    private: true,
    name: "payroll-ops",
    topic: "Private: payroll processing",
    members: ["u0", "u2", "u3"],
    unread: 0,
    messages: [
      { day: "Monday" },
      {
        id: 1,
        user: "u2",
        time: "2:15 PM",
        text: "October payroll draft is ready for approval.",
      },
    ],
  },
  /* --------------------------- direct messages ----------------------------- */
  {
    id: "d-1",
    kind: "dm",
    with: "u1",
    unread: 2,
    messages: [
      { day: "Yesterday" },
      {
        id: 1,
        user: "u1",
        time: "4:15 PM",
        text: "Hi, did you get a chance to review my leave request?",
      },
      {
        id: 2,
        user: ME,
        time: "4:20 PM",
        text: "Yes, looking at it now. Will update you shortly.",
      },
      { day: "Today" },
      { id: 3, user: "u1", time: "10:40 AM", text: "Sure, thanks!" },
      {
        id: 4,
        user: "u1",
        time: "10:42 AM",
        text: "Also, can I work from home on Friday?",
      },
    ],
  },
  {
    id: "d-4",
    kind: "dm",
    with: "u4",
    unread: 0,
    messages: [
      { day: "Today" },
      {
        id: 1,
        user: ME,
        time: "9:50 AM",
        text: "Arun, the new laptop has been approved.",
      },
      {
        id: 2,
        user: "u4",
        time: "9:58 AM",
        text: "Awesome, thank you so much!",
        reactions: [{ e: "🙌", n: 1 }],
      },
    ],
  },
  {
    id: "d-5",
    kind: "dm",
    with: "u5",
    unread: 0,
    messages: [
      { day: "Yesterday" },
      {
        id: 1,
        user: "u5",
        time: "2:05 PM",
        text: "Please share the offer letter template.",
      },
      {
        id: 2,
        user: ME,
        time: "2:30 PM",
        text: "Sent it to your email just now.",
      },
    ],
  },
  {
    id: "d-8",
    kind: "dm",
    with: "u8",
    unread: 0,
    messages: [
      { day: "Monday" },
      {
        id: 1,
        user: "u8",
        time: "3:40 PM",
        text: "Is the insurance enrollment still open?",
      },
      { id: 2, user: ME, time: "3:55 PM", text: "Yes, until the 15th." },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Icons                                                                     */
/* -------------------------------------------------------------------------- */
const Svg = ({ children, size = 16, className = "", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
);
const I = {
  hash: (
    <path d="M9.4 3 8.700 7H5v2h3.300l-.7 4H4v2h3.300l-.7 4h2l.7-4h4l-.7 4h2l.7-4H19v-2h-3.300l.7-4H20V7h-3.300l.7-4h-2l-.7 4h-4l.7-4Zm-.4 6h4l-.7 4h-4Z" />
  ),
  lock: (
    <path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9Z" />
  ),
  caret: <path d="M8 5l8 7-8 7Z" />,
  plus: <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z" />,
  search: (
    <path d="M15.500 14h-.8l-.3-.3a6.500 6.500 0 1 0-.7.7l.3.3v.8l5 5 1.500-1.500Zm-6 0a4.500 4.500 0 1 1 0-9 4.500 4.500 0 0 1 0 9Z" />
  ),
  back: (
    <path d="M12 4l1.400 1.400L7.800 11H20v2H7.800l5.600 5.600L12 20l-8-8Z" />
  ),
  smile: (
    <path d="M9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 6.500c2 0 3.700-1.200 4.400-3H7.600c.7 1.800 2.400 3 4.400 3ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
  ),
  reply: (
    <path d="M10 9V5l-7 7 7 7v-4.100c5 0 8.500 1.600 11 5.100-1-5-4-10-11-11Z" />
  ),
  more: (
    <path d="M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
  ),
  at: (
    <path d="M12 2a10 10 0 1 0 5 18.600l-1-1.700A8 8 0 1 1 20 12v1.500a1.500 1.500 0 0 1-3 0V12a5 5 0 1 0-1.500 3.600A3.500 3.500 0 0 0 22 13.500V12A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
  ),
  clip: (
    <path d="M16.500 6.500v9.800a4.500 4.500 0 0 1-9 0V5.800a3 3 0 0 1 6 0v9.500a1.500 1.500 0 0 1-3 0V6.500H9.100v8.800a3 3 0 0 0 6 0V5.800a4.500 4.500 0 0 0-9 0v10.500a6 6 0 0 0 12 0V6.500Z" />
  ),
  send: <path d="M2 21l21-9L2 3v7l15 2-15 2Z" />,
  file: (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-1 7V3.500L18.500 9Z" />
  ),
  users: (
    <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.300 0-7 1.200-7 3.500V19h14v-2.500C15 14.200 10.300 13 8 13Zm8 0c-.3 0-.6 0-1 .1 1.200.9 2 2 2 3.400V19h6v-2.500c0-2.300-4.700-3.500-7-3.500Z" />
  ),
};

/* -------------------------------------------------------------------------- */
/*  Small pieces                                                              */
/* -------------------------------------------------------------------------- */
const initials = (n = "") =>
  n
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function UserAvatar({ id, size = 36 }) {
  const u = USERS[id];
  return (
    <div
      style={{
        width: size,
        height: size,
        background: u.color,
        fontSize: size * 0.38,
      }}
      className="flex shrink-0 items-center justify-center rounded-[6px] font-semibold text-white"
    >
      {initials(u.name)}
    </div>
  );
}

function Presence({ online, bg = C.side }) {
  return online ? (
    <span
      className="inline-block h-[9px] w-[9px] rounded-full"
      style={{ background: C.online }}
    />
  ) : (
    <span
      className="inline-block h-[9px] w-[9px] rounded-full border-[1.5px]"
      style={{ borderColor: C.sideText, background: "transparent" }}
    />
  );
}

const titleOf = (c) => (c.kind === "dm" ? USERS[c.with].name : c.name);

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                   */
/* -------------------------------------------------------------------------- */
function SectionHeader({ label, open, onToggle, onAdd }) {
  return (
    <div className="group mt-3 flex items-center justify-between px-4 py-1">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[15px] hover:text-white"
        style={{ color: C.sideText }}
      >
        <Svg
          size={10}
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          {I.caret}
        </Svg>
        {label}
      </button>
      <button
        onClick={onAdd}
        className="rounded p-0.5 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
        style={{ color: C.sideText }}
        aria-label={`Add to ${label}`}
      >
        <Svg size={14}>{I.plus}</Svg>
      </button>
    </div>
  );
}

function SidebarRow({ active, unread, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[28px] w-full items-center gap-2 px-4 text-left text-[15px] transition"
      style={{
        background: active ? C.active : "transparent",
        color: active ? "#fff" : unread ? "#fff" : C.sideText,
        fontWeight: unread && !active ? 700 : 400,
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = C.sideHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
      {unread > 0 && !active && (
        <span
          className="ml-auto rounded-full px-1.5 text-[12px] font-bold leading-[18px] text-white"
          style={{ background: C.badge }}
        >
          {unread}
        </span>
      )}
    </button>
  );
}

function Sidebar({ convos, activeId, onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState({ channels: true, dms: true });

  const match = (c) =>
    !q.trim() || titleOf(c).toLowerCase().includes(q.trim().toLowerCase());
  const channels = convos.filter((c) => c.kind === "channel" && match(c));
  const dms = convos.filter((c) => c.kind === "dm" && match(c));

  return (
    <div className="flex h-full flex-col" style={{ background: C.side }}>
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <div className="text-[17px] font-bold text-white">REBS Workspace</div>
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: C.online }}
          title="Connected"
        />
      </div>

      <div className="px-3 py-2.5">
        <div
          className="flex h-[30px] items-center gap-2 rounded-md px-2.5"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Svg size={15} className="text-white/80">
            {I.search}
          </Svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a channel or person"
            className="w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/70"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <SectionHeader
          label="Channels"
          open={open.channels}
          onToggle={() => setOpen((o) => ({ ...o, channels: !o.channels }))}
          onAdd={() => {}}
        />
        {open.channels && (
          <>
            {channels.map((c) => (
              <SidebarRow
                key={c.id}
                active={c.id === activeId}
                unread={c.unread}
                onClick={() => onSelect(c.id)}
              >
                <Svg size={15} className="shrink-0 opacity-80">
                  {c.private ? I.lock : I.hash}
                </Svg>
                <span className="truncate">{c.name}</span>
              </SidebarRow>
            ))}
            <button
              className="flex h-[28px] w-full items-center gap-2 px-4 text-[15px] hover:bg-[#2b2b2e]"
              style={{ color: C.sideText }}
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-white/15">
                <Svg size={12}>{I.plus}</Svg>
              </span>
              Add channels
            </button>
          </>
        )}

        <SectionHeader
          label="Direct messages"
          open={open.dms}
          onToggle={() => setOpen((o) => ({ ...o, dms: !o.dms }))}
          onAdd={() => {}}
        />
        {open.dms && (
          <>
            {dms.map((c) => (
              <SidebarRow
                key={c.id}
                active={c.id === activeId}
                unread={c.unread}
                onClick={() => onSelect(c.id)}
              >
                <Presence online={USERS[c.with].online} />
                <span className="truncate">{USERS[c.with].name}</span>
              </SidebarRow>
            ))}
            <button
              className="flex h-[28px] w-full items-center gap-2 px-4 text-[15px] hover:bg-[#2b2b2e]"
              style={{ color: C.sideText }}
            >
              <span className="flex h-[18px] w-[18px] items-center justify-center rounded bg-white/15">
                <Svg size={12}>{I.plus}</Svg>
              </span>
              Add teammates
            </button>
          </>
        )}

        {channels.length + dms.length === 0 && (
          <div className="px-4 py-6 text-[14px]" style={{ color: C.sideText }}>
            Nothing matches “{q}”.
          </div>
        )}
      </div>

      {/* current user */}
      <div
        className="flex shrink-0 items-center gap-2.5 border-t px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <UserAvatar id={ME} size={30} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold text-white">
            {USERS[ME].name}
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: C.sideText }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: C.online }}
            />{" "}
            Active
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Message row                                                               */
/* -------------------------------------------------------------------------- */
function Message({ m, head, onReact }) {
  const u = USERS[m.user];
  return (
    <div className="group relative flex gap-2.5 px-5 py-[3px] hover:bg-[#F2F4F3]">
      <div className="w-9 shrink-0 pt-0.5">
        {head ? (
          <UserAvatar id={m.user} />
        ) : (
          <span
            className="hidden pt-1 text-right text-[11px] group-hover:block"
            style={{ color: C.sub }}
          >
            {m.time.replace(/ (AM|PM)/, "")}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {head && (
          <div className="flex items-baseline gap-2">
            <span
              className="text-[15px] font-bold hover:underline"
              style={{ color: C.text }}
            >
              {u.name}
            </span>
            <span className="text-[12px]" style={{ color: C.sub }}>
              {m.time}
            </span>
          </div>
        )}
        <div
          className="whitespace-pre-wrap break-words text-[15px] leading-[22px]"
          style={{ color: C.text }}
        >
          {m.text}
        </div>

        {m.file && (
          <div
            className="mt-1.5 flex w-fit items-center gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: C.line }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[#fbe8ea]"
              style={{ color: C.link }}
            >
              <Svg size={20}>{I.file}</Svg>
            </span>
            <div>
              <div className="text-[14px] font-bold" style={{ color: C.link }}>
                {m.file.name}
              </div>
              <div className="text-[12px]" style={{ color: C.sub }}>
                {m.file.size}
              </div>
            </div>
          </div>
        )}

        {m.reactions?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {m.reactions.map((r) => (
              <button
                key={r.e}
                onClick={() => onReact(m.id, r.e)}
                className="flex items-center gap-1 rounded-full border px-2 py-[1px] text-[13px]"
                style={
                  r.mine
                    ? { background: C.tint, borderColor: C.link, color: C.link }
                    : {
                        background: C.mist,
                        borderColor: "transparent",
                        color: C.sub,
                      }
                }
              >
                <span>{r.e}</span>
                <span className="font-medium">{r.n}</span>
              </button>
            ))}
          </div>
        )}

        {m.replies > 0 && (
          <button
            className="mt-1 flex items-center gap-2 text-[13px] hover:underline"
            style={{ color: C.link }}
          >
            <span className="font-bold">
              {m.replies} {m.replies === 1 ? "reply" : "replies"}
            </span>
            <span style={{ color: C.sub }}>View thread</span>
          </button>
        )}
      </div>

      {/* hover toolbar */}
      <div
        className="absolute -top-3.5 right-5 hidden items-center rounded-lg border bg-white px-0.5 py-0.5 shadow-sm group-hover:flex"
        style={{ borderColor: C.line, color: C.sub }}
      >
        <button
          onClick={() => onReact(m.id, "👍")}
          title="React"
          className="rounded p-1.5 hover:bg-[#F2F4F3]"
        >
          <Svg size={17}>{I.smile}</Svg>
        </button>
        <button
          title="Reply in thread"
          className="rounded p-1.5 hover:bg-[#F2F4F3]"
        >
          <Svg size={17}>{I.reply}</Svg>
        </button>
        <button title="More" className="rounded p-1.5 hover:bg-[#F2F4F3]">
          <Svg size={17}>{I.more}</Svg>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Conversation pane                                                         */
/* -------------------------------------------------------------------------- */
function Pane({ convo, onBack, onSend, onReact }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const isDm = convo.kind === "dm";
  const title = titleOf(convo);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [convo.id, convo.messages.length]);
  useEffect(() => setText(""), [convo.id]);

  function submit() {
    if (!text.trim()) return;
    onSend(convo.id, text.trim());
    setText("");
  }

  const members = convo.members || [];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* header */}
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: C.line }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onBack}
            className="mr-1 md:hidden"
            style={{ color: C.sub }}
            aria-label="Back"
          >
            <Svg size={20}>{I.back}</Svg>
          </button>
          {isDm ? (
            <>
              <UserAvatar id={convo.with} size={26} />
              <span
                className="truncate text-[17px] font-black"
                style={{ color: C.text }}
              >
                {title}
              </span>
              <Presence online={USERS[convo.with].online} />
            </>
          ) : (
            <>
              <Svg size={17} style={{ color: C.text }}>
                {convo.private ? I.lock : I.hash}
              </Svg>
              <span
                className="truncate text-[17px] font-black"
                style={{ color: C.text }}
              >
                {title}
              </span>
            </>
          )}
        </div>

        {!isDm && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center sm:flex">
              {members.slice(0, 3).map((id, i) => (
                <div
                  key={id}
                  className="rounded-[7px] border-2 border-white"
                  style={{ marginLeft: i ? -8 : 0 }}
                >
                  <UserAvatar id={id} size={24} />
                </div>
              ))}
            </div>
            <button
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] hover:bg-[#F2F4F3]"
              style={{ borderColor: C.line, color: C.sub }}
            >
              <Svg size={14}>{I.users}</Svg> {members.length}
            </button>
          </div>
        )}
      </div>
      {!isDm && convo.topic && (
        <div
          className="shrink-0 truncate border-b px-5 py-1.5 text-[13px]"
          style={{ borderColor: C.line, color: C.sub }}
        >
          {convo.topic}
        </div>
      )}

      {/* messages */}
      <div className="flex-1 overflow-y-auto pb-2 pt-3">
        {/* intro */}
        <div className="px-5 pb-4 pt-2">
          {isDm ? (
            <div className="flex items-center gap-3">
              <UserAvatar id={convo.with} size={56} />
              <div>
                <div
                  className="text-[20px] font-black"
                  style={{ color: C.text }}
                >
                  {title}
                </div>
                <div className="text-[14px]" style={{ color: C.sub }}>
                  This is the start of your direct message history with{" "}
                  <b>{title}</b>.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[22px] font-black" style={{ color: C.text }}>
                {convo.private ? "🔒" : "#"} {title}
              </div>
              <div className="mt-1 text-[14px]" style={{ color: C.sub }}>
                This is the beginning of the{" "}
                <b>
                  {convo.private ? "🔒" : "#"} {title}
                </b>{" "}
                channel. {convo.topic}.
              </div>
            </>
          )}
        </div>

        {convo.messages.map((m, i) => {
          if (m.day)
            return (
              <div key={`d${i}`} className="relative my-3 flex justify-center">
                <div
                  className="absolute left-0 right-0 top-1/2 border-t"
                  style={{ borderColor: C.line }}
                />
                <span
                  className="relative rounded-full border bg-white px-3 py-[3px] text-[12.5px] font-bold"
                  style={{ borderColor: C.line, color: C.text }}
                >
                  {m.day}
                </span>
              </div>
            );
          const prev = convo.messages[i - 1];
          const head = !prev || prev.day || prev.user !== m.user;
          return (
            <Message
              key={m.id}
              m={m}
              head={head}
              onReact={(id, e) => onReact(convo.id, id, e)}
            />
          );
        })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="shrink-0 px-5 pb-4">
        <div
          className="rounded-lg border focus-within:border-[#1d1d1f]"
          style={{ borderColor: "#b9bdbb" }}
        >
          <div
            className="flex items-center gap-0.5 rounded-t-lg bg-[#F2F4F3] px-2 py-1"
            style={{ color: C.sub }}
          >
            {[
              ["B", "font-black"],
              ["I", "italic font-serif"],
              ["S", "line-through"],
            ].map(([l, cls]) => (
              <button
                key={l}
                className={`h-7 w-7 rounded text-[14px] hover:bg-[#dfe3e1] ${cls}`}
              >
                {l}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-[#cfd3d1]" />
            <button className="rounded p-1.5 hover:bg-[#dfe3e1] text-[13px] font-bold">
              &lt;/&gt;
            </button>
          </div>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={
              isDm
                ? `Message ${title}`
                : `Message ${convo.private ? "🔒" : "#"}${title}`
            }
            className="block max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[#8a8e8d]"
            style={{ color: C.text }}
          />
          <div
            className="flex items-center justify-between px-2 pb-1.5"
            style={{ color: C.sub }}
          >
            <div className="flex items-center gap-0.5">
              <button
                className="rounded p-1.5 hover:bg-[#F2F4F3]"
                aria-label="Attach file"
              >
                <Svg size={18}>{I.clip}</Svg>
              </button>
              <button
                className="rounded p-1.5 hover:bg-[#F2F4F3]"
                aria-label="Emoji"
              >
                <Svg size={18}>{I.smile}</Svg>
              </button>
              <button
                className="rounded p-1.5 hover:bg-[#F2F4F3]"
                aria-label="Mention"
              >
                <Svg size={18}>{I.at}</Svg>
              </button>
            </div>
            <button
              onClick={submit}
              disabled={!text.trim()}
              aria-label="Send message"
              className="flex items-center rounded-md px-2.5 py-1.5 text-white transition disabled:cursor-not-allowed"
              style={{
                background: text.trim() ? C.active : "#dfe3e1",
                color: text.trim() ? "#fff" : "#9a9e9d",
              }}
            >
              <Svg size={16}>{I.send}</Svg>
            </button>
          </div>
        </div>
        <div
          className="mt-1 px-1 text-right text-[11.5px]"
          style={{ color: C.sub }}
        >
          <b>Enter</b> to send · <b>Shift + Enter</b> for a new line
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */
// Full screen height. If DashboardLayout adds padding around the page, subtract it here, e.g. "calc(100dvh - 2rem)".
const CHAT_HEIGHT = "100dvh";

function Chat() {
  const [convos, setConvos] = useState(INITIAL);
  const [activeId, setActiveId] = useState("c-hr");
  const active = convos.find((c) => c.id === activeId) || null;

  const select = (id) => {
    setActiveId(id);
    setConvos((p) => p.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  // Local state only: nothing is sent anywhere.
  const send = (id, text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setConvos((p) =>
      p.map((c) => {
        if (c.id !== id) return c;
        const base = c.messages.some((m) => m.day === "Today")
          ? c.messages
          : [...c.messages, { day: "Today" }];
        return {
          ...c,
          messages: [...base, { id: Date.now(), user: ME, time, text }],
        };
      }),
    );
  };

  const react = (cid, mid, emoji) => {
    setConvos((p) =>
      p.map((c) =>
        c.id !== cid
          ? c
          : {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== mid) return m;
                const list = m.reactions || [];
                const ex = list.find((r) => r.e === emoji);
                let next;
                if (!ex) next = [...list, { e: emoji, n: 1, mine: true }];
                else if (ex.mine)
                  next = list
                    .map((r) =>
                      r.e === emoji ? { ...r, n: r.n - 1, mine: false } : r,
                    )
                    .filter((r) => r.n > 0);
                else
                  next = list.map((r) =>
                    r.e === emoji ? { ...r, n: r.n + 1, mine: true } : r,
                  );
                return { ...m, reactions: next };
              }),
            },
      ),
    );
  };

  return (
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      <div className="w-full">
        <div
          className="flex min-h-[480px] overflow-hidden rounded-lg border shadow-sm"
          style={{ height: CHAT_HEIGHT, borderColor: C.line }}
        >
          <aside
            className={`${active ? "hidden md:block" : "block"} w-full shrink-0 md:w-[260px]`}
          >
            <Sidebar convos={convos} activeId={activeId} onSelect={select} />
          </aside>

          <section
            className={`${active ? "block" : "hidden md:block"} min-w-0 flex-1`}
          >
            {active && (
              <Pane
                key={active.id}
                convo={active}
                onBack={() => setActiveId(null)}
                onSend={send}
                onReact={react}
              />
            )}
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Chat;
