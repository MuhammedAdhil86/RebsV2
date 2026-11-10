import React, { useEffect, useState } from "react";
import {
  FiX,
  FiImage,
  FiFilm,
  FiMusic,
  FiFileText,
  FiFile,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi";
import chatService from "../../service/chatService";
import { COLORS, UserAvatar } from "./chat_shared";
import { dayLabel, timeLabel, PinIcon } from "./ChatViewer";

const when = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${dayLabel(iso)}, ${timeLabel(iso)}`;
};

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const errText = (e, fallback) => e?.response?.data?.message || fallback;

// loading / empty / error line used by every tab
function Note({ children, error }) {
  return (
    <div
      className="px-4 py-6 text-center text-[13.5px]"
      style={{ color: error ? COLORS.link : COLORS.sub }}
    >
      {children}
    </div>
  );
}

const MEDIA_ICON = {
  image: FiImage,
  video: FiFilm,
  audio: FiMusic,
  document: FiFileText,
};

/* ------------------------------ Pinned ------------------------------ */
function PinsTab({ convo, onGoTo, onUnpin }) {
  const [state, setState] = useState({ loading: true, error: "", items: [] });
  const [busyId, setBusyId] = useState(null);

  // reloads when pinTick changes (pin / unpin from me or from a socket event)
  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    chatService
      .fetchPins(convo.id)
      .then((items) => !off && setState({ loading: false, error: "", items }))
      .catch(
        (e) =>
          !off &&
          setState({
            loading: false,
            error: errText(e, "Couldn't load pinned messages"),
            items: [],
          }),
      );
    return () => {
      off = true;
    };
  }, [convo.id, convo.pinTick]);

  if (state.loading && !state.items.length) return <Note>Loading…</Note>;
  if (state.error) return <Note error>{state.error}</Note>;
  if (!state.items.length) return <Note>No pinned messages yet.</Note>;

  return (
    <div>
      {state.items.map((p) => {
        const loaded = convo.messages.some((m) => String(m.id) === p.id);
        const preview = p.content || (p.type !== "text" ? `[${p.type}]` : "");
        return (
          <div
            key={p.id}
            className="border-b px-4 py-3"
            style={{ borderColor: COLORS.line }}
          >
            <div
              className="text-[13px] font-medium"
              style={{ color: COLORS.text }}
            >
              {p.senderName}
              <span className="ml-2 font-normal" style={{ color: COLORS.sub }}>
                {when(p.createdAt)}
              </span>
            </div>
            <div
              className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-[14px]"
              style={{ color: COLORS.text }}
            >
              {preview}
            </div>
            {p.pin && (
              <div
                className="mt-1 flex items-center gap-1 text-[12px]"
                style={{ color: COLORS.link }}
              >
                <PinIcon size={12} filled />
                Pinned by {p.pin.pinnedByName} · {when(p.pin.pinnedAt)}
              </div>
            )}
            <div className="mt-2 flex gap-3 text-[13px]">
              <button
                onClick={() => onGoTo(p.id)}
                disabled={!loaded}
                title={loaded ? "" : "Message is not loaded in this chat"}
                className="font-medium disabled:opacity-40"
                style={{ color: COLORS.link }}
              >
                Go to message
              </button>
              <button
                disabled={busyId === p.id}
                onClick={async () => {
                  setBusyId(p.id);
                  await onUnpin(convo.id, p.id);
                  setBusyId(null);
                }}
                className="disabled:opacity-40"
                style={{ color: COLORS.sub }}
              >
                {busyId === p.id ? "Unpinning…" : "Unpin"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ Media ------------------------------ */
function MediaTab({ convo }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    counts: null,
    items: [],
    hasMore: false,
  });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let off = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.all([
      chatService.fetchMediaCounts(convo.id),
      chatService.fetchMedia(convo.id),
    ])
      .then(
        ([counts, media]) =>
          !off &&
          setState({
            loading: false,
            error: "",
            counts,
            items: media.items,
            hasMore: media.hasMore,
          }),
      )
      .catch(
        (e) =>
          !off &&
          setState({
            loading: false,
            error: errText(e, "Couldn't load shared media"),
            counts: null,
            items: [],
            hasMore: false,
          }),
      );
    return () => {
      off = true;
    };
  }, [convo.id]);

  if (state.loading) return <Note>Loading…</Note>;
  if (state.error) return <Note error>{state.error}</Note>;

  const { counts, items, hasMore } = state;
  const chips = [
    { key: "all", label: "All", n: counts?.total ?? items.length },
    { key: "image", label: "Images", n: counts?.image ?? 0 },
    { key: "video", label: "Videos", n: counts?.video ?? 0 },
    { key: "audio", label: "Audio", n: counts?.audio ?? 0 },
    { key: "document", label: "Docs", n: counts?.document ?? 0 },
  ];
  const shown =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className="rounded-full border px-2.5 py-[3px] text-[12.5px]"
            style={
              filter === c.key
                ? {
                    background: COLORS.tint,
                    borderColor: COLORS.link,
                    color: COLORS.link,
                  }
                : { borderColor: COLORS.line, color: COLORS.sub }
            }
          >
            {c.label} {c.n}
          </button>
        ))}
      </div>

      {!shown.length && <Note>No files here.</Note>}

      {shown.map((m) => {
        const Icon = MEDIA_ICON[m.type] || FiFile;
        const thumb =
          m.type === "image" && m.url ? (
            <img
              src={m.url}
              alt={m.name}
              className="h-11 w-11 shrink-0 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
              style={{ background: COLORS.mist, color: COLORS.sub }}
            >
              <Icon size={20} />
            </span>
          );
        const body = (
          <>
            {thumb}
            <span className="min-w-0">
              <span
                className="block truncate text-[13.5px] font-medium"
                style={{ color: COLORS.text }}
              >
                {m.name}
              </span>
              <span
                className="block truncate text-[12px]"
                style={{ color: COLORS.sub }}
              >
                {m.senderName} · {m.sizeLabel || formatSize(m.size)}
              </span>
              <span className="block text-[12px]" style={{ color: COLORS.sub }}>
                {when(m.createdAt)}
              </span>
            </span>
          </>
        );
        const cls = "flex items-center gap-3 px-4 py-2 hover:bg-[#F2F4F3]";
        return m.url ? (
          <a
            key={m.id}
            href={m.url}
            target="_blank"
            rel="noreferrer"
            className={cls}
          >
            {body}
          </a>
        ) : (
          <div key={m.id} className={cls} title="Link not available yet">
            {body}
          </div>
        );
      })}

      {hasMore && (
        <Note>More files exist. Loading more is not available yet.</Note>
      )}
    </div>
  );
}

/* ----------------------------- Members ----------------------------- */
function MembersTab({
  convo,
  onlineIds,
  currentUserId,
  people,
  peopleLoading,
  onLoadPeople,
  onAdd,
  onRemove,
}) {
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(() => new Set());
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState(null); // member being removed
  const [removingId, setRemovingId] = useState(null);

  const members = convo.members || [];
  const have = new Set(members.map((m) => m.uuid));
  const s = q.trim().toLowerCase();
  const candidates = (people || []).filter(
    (p) =>
      !have.has(String(p.uuid)) && (!s || p.name.toLowerCase().includes(s)),
  );

  const toggle = (uuid) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) next.delete(uuid);
      else next.add(uuid);
      return next;
    });

  const submit = async () => {
    if (!picked.size || saving) return;
    setSaving(true);
    const ok = await onAdd(convo.id, [...picked]);
    setSaving(false);
    if (ok) {
      setPicked(new Set());
      setQ("");
      setAdding(false);
    }
  };

  return (
    <div>
      {convo.kind !== "dm" && (
        <div className="px-4 py-3">
          {!adding ? (
            <button
              onClick={() => {
                onLoadPeople?.();
                setAdding(true);
              }}
              className="flex items-center gap-2 text-[14px] font-medium"
              style={{ color: COLORS.link }}
            >
              <FiUserPlus size={16} /> Add people
            </button>
          ) : (
            <div>
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search people to add"
                className="h-9 w-full rounded-md border px-3 text-[14px] outline-none focus:border-[#1d1d1f]"
                style={{ borderColor: "#b9bdbb", color: COLORS.text }}
              />
              <div className="mt-2 max-h-48 overflow-y-auto">
                {peopleLoading && <Note>Loading people…</Note>}
                {!peopleLoading && !candidates.length && (
                  <Note>No one to add.</Note>
                )}
                {candidates.map((p) => {
                  const on = picked.has(String(p.uuid));
                  return (
                    <button
                      key={p.uuid}
                      onClick={() => toggle(String(p.uuid))}
                      className="flex w-full items-center gap-2.5 px-1 py-1.5 text-left hover:bg-[#F2F4F3]"
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
                      <UserAvatar user={p} size={26} />
                      <span
                        className="truncate text-[14px]"
                        style={{ color: COLORS.text }}
                      >
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setAdding(false);
                    setPicked(new Set());
                  }}
                  className="text-[13px]"
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!picked.size || saving}
                  className="h-8 rounded-md px-3 text-[13px] font-medium text-white disabled:opacity-50"
                  style={{ background: COLORS.active }}
                >
                  {saving ? "Adding…" : `Add ${picked.size || ""}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!members.length && <Note>No members.</Note>}

      {members.map((m) => {
        const isMe = String(m.uuid) === String(currentUserId);
        const asking = confirmId === m.uuid;
        return (
          <div key={m.uuid} className="px-4 py-2">
            <div className="flex items-center gap-3">
              <UserAvatar
                user={m}
                size={30}
                online={isMe ? true : onlineIds.has(String(m.uuid))}
              />
              <span
                className="min-w-0 flex-1 truncate text-[14.5px]"
                style={{ color: COLORS.text }}
              >
                {m.name}
                {isMe && <span style={{ color: COLORS.sub }}> (You)</span>}
              </span>
              {convo.kind !== "dm" && !isMe && onRemove && !asking && (
                <button
                  onClick={() => setConfirmId(m.uuid)}
                  title="Remove from this chat"
                  aria-label={`Remove ${m.name}`}
                  className="rounded p-1 hover:bg-[#fbe8ea]"
                  style={{ color: COLORS.link }}
                >
                  <FiUserMinus size={16} />
                </button>
              )}
            </div>

            {asking && (
              <div className="mt-1.5 flex items-center justify-end gap-3 text-[13px]">
                <span style={{ color: COLORS.sub }}>Remove {m.name}?</span>
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={removingId === m.uuid}
                  style={{ color: COLORS.sub }}
                >
                  Cancel
                </button>
                <button
                  disabled={removingId === m.uuid}
                  onClick={async () => {
                    setRemovingId(m.uuid);
                    await onRemove(convo.id, [String(m.uuid)]);
                    setRemovingId(null);
                    setConfirmId(null);
                  }}
                  className="font-medium disabled:opacity-50"
                  style={{ color: COLORS.link }}
                >
                  {removingId === m.uuid ? "Removing…" : "Remove"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------ Panel ------------------------------ */
export default function ChatInfoPanel({
  convo,
  onClose,
  onGoTo,
  onUnpin,
  onAddParticipants,
  onRemoveParticipants,
  onlineIds,
  currentUserId,
  people,
  peopleLoading,
  onLoadPeople,
}) {
  const [tab, setTab] = useState("pins");
  const tabs = [
    { key: "pins", label: "Pinned" },
    { key: "media", label: "Media" },
    { key: "members", label: `Members ${(convo.members || []).length}` },
  ];

  return (
    <aside
      className="absolute inset-0 z-30 flex flex-col border-l bg-white md:static md:inset-auto md:w-[320px] md:shrink-0"
      style={{ borderColor: COLORS.line }}
    >
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: COLORS.line }}
      >
        <div className="text-[16px] font-medium" style={{ color: COLORS.text }}>
          Details
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="rounded p-1 hover:bg-[#F2F4F3]"
          style={{ color: COLORS.sub }}
        >
          <FiX size={18} />
        </button>
      </div>

      <div
        className="flex shrink-0 border-b"
        style={{ borderColor: COLORS.line }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 border-b-2 py-2.5 text-[13.5px] font-medium"
            style={{
              borderColor: tab === t.key ? COLORS.link : "transparent",
              color: tab === t.key ? COLORS.link : COLORS.sub,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto">
        {tab === "pins" && (
          <PinsTab convo={convo} onGoTo={onGoTo} onUnpin={onUnpin} />
        )}
        {tab === "media" && <MediaTab convo={convo} />}
        {tab === "members" && (
          <MembersTab
            convo={convo}
            onlineIds={onlineIds}
            currentUserId={currentUserId}
            people={people}
            peopleLoading={peopleLoading}
            onLoadPeople={onLoadPeople}
            onAdd={onAddParticipants}
            onRemove={onRemoveParticipants}
          />
        )}
      </div>
    </aside>
  );
}
