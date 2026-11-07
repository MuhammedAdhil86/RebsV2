import React, { useEffect, useRef, useState } from "react";
import { FiCornerUpLeft, FiSmile, FiTrash2 } from "react-icons/fi";
import DeleteConfirmationModal from "../../ui/deletemodal";
import { COLORS, Icon, UserAvatar, titleOf } from "./chat_shared";
import MessageFile from "./MessageFile";

export const prefixOf = (c) =>
  c.kind === "team" ? "" : c.private ? "🔒 " : "#";

export const nounOf = (c) => (c.kind === "team" ? "team" : "channel");

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

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🙏", "👀"];

function Message({
  message,
  showHeader,
  onReact,
  onReply,
  onDelete,
  canDelete,
}) {
  const user = message.sender ?? { name: "Unknown" };
  const { file, reactions, replies, replyTo } = message;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

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
      className={`group relative flex gap-2.5 px-5 py-[3px] hover:bg-[#F2F4F3] ${pickerOpen ? "bg-[#F2F4F3]" : ""}`}
    >
      <div className="w-9 shrink-0 pt-0.5">
        {showHeader ? (
          <UserAvatar user={user} />
        ) : (
          <span
            className="hidden pt-1 text-right text-[11px] group-hover:block"
            style={{ color: COLORS.sub }}
          >
            {message.time.replace(/ (AM|PM)/i, "")}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span
              className="text-[15px] font-medium hover:underline"
              style={{ color: COLORS.text }}
            >
              {user.name}
            </span>
            <span className="text-[12px]" style={{ color: COLORS.sub }}>
              {message.time}
            </span>
          </div>
        )}

        {replyTo && (
          <div
            className="mb-1 max-w-full truncate border-l-[3px] pl-2 text-[13px]"
            style={{ borderColor: COLORS.link, color: COLORS.sub }}
          >
            <span className="font-medium">
              {replyTo.senderName || "Message"}
            </span>
            {": "}
            {replyTo.text || "Attachment"}
          </div>
        )}

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

        {reactions?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {reactions.map((r) => (
              <button
                key={r.e}
                onClick={() => onReact(r.e)}
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
      </div>

      {!pending && (
        <div
          className={`absolute -top-3.5 right-5 items-center rounded-lg border bg-white px-0.5 py-0.5 shadow-sm group-hover:flex ${
            pickerOpen ? "flex" : "hidden"
          }`}
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
                className="absolute bottom-full right-0 z-20 mb-1 flex gap-0.5 rounded-xl border bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                style={{ borderColor: COLORS.line }}
              >
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
}) {
  const endRef = useRef(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  return (
    <div className="chat-main min-h-0 flex-1 overflow-y-auto pb-2 pt-3">
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

        return (
          <Message
            key={m.id}
            message={m}
            showHeader={showHeader}
            onReact={(emoji) => onReact(convo.id, m.id, emoji)}
            onReply={onReply}
            onDelete={setToDelete}
            canDelete={
              !!currentUserId &&
              String(m.sender?.uuid) === String(currentUserId)
            }
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
