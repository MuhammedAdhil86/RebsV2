import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiCornerUpLeft,
  FiSmile,
  FiTrash2,
  FiMapPin, // NEW
} from "react-icons/fi";
import DeleteConfirmationModal from "../../ui/deletemodal";
import { COLORS, UserAvatar, titleOf } from "./chat_shared";
import MessageFile from "./MessageFile";

export const prefixOf = (c) =>
  c.kind === "team" ? "" : c.private ? "🔒 " : "#";

export const nounOf = (c) => (c.kind === "team" ? "team" : "channel");

// true  = my messages on the LEFT, received messages on the RIGHT
// false = the usual layout (mine on the right)
const MINE_ON_LEFT = true;

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export const dayLabel = (iso) => {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7)
    return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export function withDayDividers(messages = []) {
  const out = [];
  let last = null;
  for (const m of messages) {
    const label = m.createdAt ? dayLabel(m.createdAt) : null;
    if (label && label !== last) {
      out.push({ day: label });
      last = label;
    }
    out.push({ ...m, time: m.createdAt ? timeLabel(m.createdAt) : "" });
  }
  return out;
}

// same emoji list as the message box (ChatTool)
const QUICK_REACTIONS = [
  "😀",
  "😂",
  "😍",
  "🥰",
  "😎",
  "🤔",
  "😅",
  "😭",
  "🙏",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🔥",
  "🎉",
  "❤️",
  "✅",
  "❌",
  "⭐",
  "💯",
  "👀",
  "🤝",
  "💪",
  "😴",
];

// Quote card shown inside a reply bubble. Click it to jump to the original.
function ReplyQuote({ quote, onJump }) {
  return (
    <button
      type="button"
      onClick={() => quote.found && onJump(quote.id)}
      disabled={!quote.found}
      className="mb-1.5 flex w-full min-w-[160px] max-w-[420px] items-stretch overflow-hidden rounded-lg text-left transition hover:brightness-95 disabled:cursor-default"
      style={{ background: "rgba(255,255,255,0.75)" }}
    >
      <span className="w-[3px] shrink-0" style={{ background: COLORS.link }} />
      <span className="min-w-0 px-2.5 py-1.5">
        <span
          className="flex items-center gap-1 text-[12.5px] font-medium"
          style={{ color: COLORS.link }}
        >
          <FiCornerUpLeft size={12} />
          {quote.senderName}
        </span>
        <span
          className={`block truncate text-[13px] ${quote.found ? "" : "italic"}`}
          style={{ color: COLORS.sub }}
        >
          {quote.text}
        </span>
      </span>
    </button>
  );
}

// WhatsApp-style ticks for my messages:
// one grey tick = sent, two grey = delivered, two blue = read
function Ticks({ message }) {
  const read = message.allRead || message.readBy?.length > 0;
  const delivered =
    message.deliveredToAll || message.deliveredTo?.length > 0 || read;
  const color = read ? "#1d9bf0" : COLORS.offline;
  const title = read ? "Read" : delivered ? "Delivered" : "Sent";

  return (
    <svg
      width="16"
      height="11"
      viewBox="0 0 16 11"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M1 5.5 4.5 9 11 1.5" />
      {delivered && <path d="M6.5 8.5 7.5 9.5 14.5 1.5" />}
    </svg>
  );
}

// NEW: "who reacted" text for the chip tooltip
const reactorsTitle = (r) => {
  const names = (r.users ?? []).map((u) => u.name).filter(Boolean);
  if (!names.length) return undefined;
  return `${r.e}  ${names.join(", ")}`;
};

// NEW: "Pinned by NAME · date"
const pinnedLine = (pin) => {
  if (!pin) return "Pinned";
  const who = pin.pinnedByName ? ` by ${pin.pinnedByName}` : "";
  const when = pin.pinnedAt
    ? ` · ${dayLabel(pin.pinnedAt)}, ${timeLabel(pin.pinnedAt)}`
    : "";
  return `Pinned${who}${when}`;
};

function Message({
  message,
  mine,
  quote,
  onJump,
  flash,
  showHeader,
  onReact,
  onReply,
  onDelete,
  canDelete,
  onPin, // NEW
  onUnpin, // NEW
}) {
  const user = message.sender ?? { name: "Unknown" };
  const { file, reactions, replies } = message;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // which side this message sits on
  const alignLeft = mine === MINE_ON_LEFT;

  // close the quick-reaction picker on outside click / Escape
  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setPickerOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setPickerOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pickerOpen]);

  const pending = String(message.id).startsWith("tmp-");

  return (
    <div
      data-mid={message.id}
      className={`group flex gap-2.5 px-5 ${showHeader ? "pt-3" : "pt-[3px]"} ${
        alignLeft ? "" : "flex-row-reverse"
      }`}
    >
      {/* avatar column (empty spacer for follow-up messages) */}
      <div className="w-9 shrink-0">
        {showHeader && <UserAvatar user={user} />}
      </div>

      <div
        className={`flex min-w-0 max-w-[75%] flex-col ${
          alignLeft ? "items-start" : "items-end"
        }`}
      >
        {showHeader && (
          <span
            className="mb-0.5 px-1 text-[13px] font-medium"
            style={{ color: COLORS.text }}
          >
            {user.name}
          </span>
        )}

        <div className="relative max-w-full">
          {/* the bubble */}
          <div
            className={`min-w-[64px] max-w-full rounded-2xl px-3.5 py-2 shadow-sm transition-all duration-300 ${
              alignLeft ? "rounded-tl-md" : "rounded-tr-md"
            } ${pending ? "opacity-70" : ""} ${
              flash ? "ring-2 ring-[#d13843]" : ""
            }`}
            style={{
              background: mine ? COLORS.tint : "#fff",
              border: `1px solid ${mine ? "#f5cdd1" : COLORS.line}`,
            }}
          >
            {/* NEW: pinned line */}
            {message.pinned && (
              <div
                className="mb-1 flex items-center gap-1 text-[11.5px] font-medium"
                style={{ color: COLORS.link }}
              >
                <FiMapPin size={11} />
                <span className="truncate">{pinnedLine(message.pin)}</span>
              </div>
            )}

            {quote && <ReplyQuote quote={quote} onJump={onJump} />}

            {message.text && (
              <div
                className="whitespace-pre-wrap break-words text-[15px] leading-[22px]"
                style={{ color: COLORS.text }}
              >
                {message.text}
              </div>
            )}

            {/* image / voice note / video / document */}
            {file && <MessageFile file={file} />}

            <div
              className="mt-0.5 flex items-center justify-end gap-1 text-[11px] leading-none"
              style={{ color: COLORS.sub }}
            >
              <span>{message.time}</span>
              {mine && !pending && <Ticks message={message} />}
            </div>
          </div>

          {/* who has read my message */}
          {mine && message.readBy?.length > 0 && (
            <div
              className={`mt-1 flex items-center gap-1 ${
                alignLeft ? "justify-start" : "justify-end"
              }`}
            >
              <span className="text-[11px]" style={{ color: COLORS.sub }}>
                Seen by
              </span>
              {message.readBy.slice(0, 3).map((p) => (
                <span key={p.uuid} title={p.name}>
                  <UserAvatar user={p} size={16} />
                </span>
              ))}
              {message.readBy.length > 3 && (
                <span className="text-[11px]" style={{ color: COLORS.sub }}>
                  +{message.readBy.length - 3}
                </span>
              )}
            </div>
          )}

          {reactions?.length > 0 && (
            <div
              className={`mt-1 flex flex-wrap gap-1 ${
                alignLeft ? "justify-start" : "justify-end"
              }`}
            >
              {reactions.map((r) => (
                <button
                  key={r.e}
                  onClick={() => onReact(r.e)}
                  title={reactorsTitle(r)} // NEW
                  className="flex items-center gap-1 rounded-full border px-2 py-[1px] text-[13px]"
                  style={
                    r.mine
                      ? {
                          background: COLORS.tint,
                          borderColor: COLORS.link,
                          color: COLORS.link,
                        }
                      : {
                          background: COLORS.mist,
                          borderColor: "transparent",
                          color: COLORS.sub,
                        }
                  }
                >
                  <span>{r.e}</span>
                  <span className="font-medium">{r.n}</span>
                </button>
              ))}
            </div>
          )}

          {replies > 0 && (
            <button
              className="mt-1 flex items-center gap-2 text-[13px] hover:underline"
              style={{ color: COLORS.link }}
            >
              <span className="font-medium">
                {replies} {replies === 1 ? "reply" : "replies"}
              </span>
              <span style={{ color: COLORS.sub }}>View thread</span>
            </button>
          )}

          {/* hover actions, on the outer edge of the bubble */}
          {!pending && (
            <div
              className={`absolute -top-4 items-center rounded-lg border bg-white px-0.5 py-0.5 shadow-sm group-hover:flex ${
                alignLeft ? "right-0" : "left-0"
              } ${pickerOpen ? "flex" : "hidden"}`}
              style={{ borderColor: COLORS.line, color: COLORS.sub }}
            >
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setPickerOpen((o) => !o)}
                  title="React"
                  aria-label="Add reaction"
                  className="rounded p-1.5 hover:bg-[#F2F4F3]"
                >
                  <FiSmile size={17} />
                </button>
                {pickerOpen && (
                  <div
                    className={`absolute bottom-full z-20 mb-1 w-[264px] rounded-xl border bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)] ${
                      alignLeft ? "right-0" : "left-0"
                    }`}
                    style={{ borderColor: COLORS.line }}
                  >
                    <div className="grid grid-cols-8 gap-0.5">
                      {QUICK_REACTIONS.map((e) => (
                        <button
                          key={e}
                          onClick={() => {
                            setPickerOpen(false);
                            onReact(e);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-[19px] hover:bg-[#F2F4F3]"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => onReply(message)}
                title="Reply"
                aria-label="Reply"
                className="rounded p-1.5 hover:bg-[#F2F4F3]"
              >
                <FiCornerUpLeft size={17} />
              </button>
              {/* NEW: pin / unpin */}
              {(message.pinned ? onUnpin : onPin) && (
                <button
                  onClick={() =>
                    message.pinned ? onUnpin(message) : onPin(message)
                  }
                  title={message.pinned ? "Unpin message" : "Pin message"}
                  aria-label={message.pinned ? "Unpin message" : "Pin message"}
                  className="rounded p-1.5 hover:bg-[#F2F4F3]"
                  style={message.pinned ? { color: COLORS.link } : undefined}
                >
                  <FiMapPin size={17} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(message)}
                  title="Delete message"
                  aria-label="Delete message"
                  className="rounded p-1.5 hover:bg-[#fbe8ea]"
                  style={{ color: COLORS.link }}
                >
                  <FiTrash2 size={17} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Intro({ convo }) {
  const title = titleOf(convo);

  if (convo.kind === "dm") {
    return (
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center gap-3">
          <UserAvatar user={convo.peer} size={56} />
          <div>
            <div
              className="text-[20px] font-medium"
              style={{ color: COLORS.text }}
            >
              {title}
            </div>
            <div className="text-[14px]" style={{ color: COLORS.sub }}>
              This is the start of your direct message history with{" "}
              <span className="font-medium">{title}</span>.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-4 pt-2">
      <div className="text-[22px] font-medium" style={{ color: COLORS.text }}>
        {prefixOf(convo)}
        {title}
      </div>
      <div className="mt-1 text-[14px]" style={{ color: COLORS.sub }}>
        This is the beginning of the{" "}
        <span className="font-medium">
          {prefixOf(convo)}
          {title}
        </span>{" "}
        {nounOf(convo)}.{convo.topic ? ` ${convo.topic}.` : ""}
      </div>
    </div>
  );
}

function DayDivider({ label }) {
  return (
    <div className="relative my-3 flex justify-center">
      <div
        className="absolute left-0 right-0 top-1/2 border-t"
        style={{ borderColor: COLORS.line }}
      />
      <span
        className="relative rounded-full border bg-white px-3 py-[3px] text-[12.5px] font-medium"
        style={{ borderColor: COLORS.line, color: COLORS.text }}
      >
        {label}
      </span>
    </div>
  );
}

export default function ChatViewer({
  convo,
  currentUserId,
  onReact,
  onReply,
  onDelete,
  onPin, // NEW: (convoId, messageId) => void
  onUnpin, // NEW: (convoId, messageId) => void
}) {
  const endRef = useRef(null);
  const scrollRef = useRef(null);
  const flashTimer = useRef(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [flashId, setFlashId] = useState(null);

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    await onDelete(convo.id, toDelete.id);
    setDeleting(false);
    setToDelete(null);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [convo.id, convo.messages.length]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const byId = useMemo(
    () => new Map(convo.messages.map((m) => [String(m.id), m])),
    [convo.messages],
  );

  // Build the quote from the original message when it is loaded
  const resolveQuote = (replyTo) => {
    if (!replyTo) return null;
    const src = byId.get(String(replyTo.id));

    if (!src) {
      return {
        id: replyTo.id,
        found: false,
        senderName: replyTo.senderName || "Message",
        text: replyTo.text || "Original message isn't available",
      };
    }

    const uuid = String(src.sender?.uuid ?? "");
    const senderName =
      uuid && uuid === String(currentUserId)
        ? "You"
        : convo.members.find((m) => m.uuid === uuid)?.name ||
          src.sender?.name ||
          "Message";

    return {
      id: String(src.id),
      found: true,
      senderName,
      text: src.text || (src.file ? `📎 ${src.file.name || "Attachment"}` : ""),
    };
  };

  const jumpTo = (id) => {
    const el = scrollRef.current?.querySelector(`[data-mid="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlashId(String(id));
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 1600);
  };

  return (
    <div
      ref={scrollRef}
      className="chat-main min-h-0 flex-1 overflow-y-auto pb-2 pt-3"
      style={{ background: "#FAFBFA" }}
    >
      <Intro convo={convo} />

      {convo.loading && (
        <div className="px-5 py-2 text-[14px]" style={{ color: COLORS.sub }}>
          Loading messages…
        </div>
      )}

      {withDayDividers(convo.messages).map((m, i, items) => {
        if (m.day) return <DayDivider key={`d${i}`} label={m.day} />;

        const prev = items[i - 1];
        const showHeader =
          !prev || prev.day || prev.sender?.uuid !== m.sender?.uuid;
        const mine =
          !!currentUserId && String(m.sender?.uuid) === String(currentUserId);

        return (
          <Message
            key={m.id}
            message={m}
            mine={mine}
            quote={resolveQuote(m.replyTo)}
            onJump={jumpTo}
            flash={flashId === String(m.id)}
            showHeader={showHeader}
            onReact={(emoji) => onReact(convo.id, m.id, emoji)}
            onReply={onReply}
            onDelete={setToDelete}
            canDelete={mine}
            onPin={onPin ? () => onPin(convo.id, m.id) : undefined}
            onUnpin={onUnpin ? () => onUnpin(convo.id, m.id) : undefined}
          />
        );
      })}

      <div ref={endRef} />

      <DeleteConfirmationModal
        isOpen={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        onConfirm={confirmDelete}
        itemName="this message"
      />
    </div>
  );
}
