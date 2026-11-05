import React, { useEffect, useRef, useState } from "react";
import ChatSidebar, {
  COLORS,
  Icon,
  UserAvatar,
  iconOf,
  titleOf,
} from "./chat_sidebar";
import chatService, { toMessage } from "../../service/chatService";
import { connectChatSocket } from "../../service/chatSocket";

// After a refetch, keep messages we already loaded (the list API has none)
const mergeConvos = (fresh, old) =>
  fresh.map((f) => {
    const o = old.find((c) => c.id === f.id);
    return o
      ? { ...f, messages: o.messages, loaded: o.loaded, loading: o.loading }
      : f;
  });

function nextReactions(list = [], emoji) {
  const existing = list.find((r) => r.e === emoji);
  if (!existing) return [...list, { e: emoji, n: 1, mine: true }];
  if (existing.mine) {
    return list
      .map((r) => (r.e === emoji ? { ...r, n: r.n - 1, mine: false } : r))
      .filter((r) => r.n > 0);
  }
  return list.map((r) =>
    r.e === emoji ? { ...r, n: r.n + 1, mine: true } : r,
  );
}

function useConversations(currentUser) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [online, setOnline] = useState(false);

  // refs so the socket handler never reads stale state
  const activeIdRef = useRef(null);
  const convosRef = useRef([]);
  const userRef = useRef(currentUser);
  const hasConnectedRef = useRef(false);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    convosRef.current = convos;
  }, [convos]);
  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  const active = convos.find((c) => c.id === activeId) || null;

  const patch = (id, fn) =>
    setConvos((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await chatService.fetchConversations();
        if (!cancelled) setConvos(list);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- realtime ----------
  useEffect(() => {
    const handleEvent = (evt) => {
      // ASSUMED: { type:"message", conversation_id, data:{...message} }
      if (evt.type === "message") {
        const convoId = String(evt.conversation_id);
        const msg = toMessage(evt.data);
        const me = String(userRef.current?.uuid ?? "");
        const mine = msg.sender?.uuid === me;
        const known = convosRef.current.find((c) => c.id === convoId);

        // message for a conversation we don't have yet (new DM / channel)
        if (!known) {
          chatService
            .fetchConversations()
            .then((list) => setConvos((prev) => mergeConvos(list, prev)))
            .catch(() => {});
          return;
        }

        const isOpen = activeIdRef.current === convoId;

        patch(convoId, (c) => {
          if (c.messages.some((m) => m.id === msg.id)) return c;

          // replace our optimistic copy if this is our own echo
          const messages = c.messages.filter(
            (m) =>
              !(String(m.id).startsWith("tmp-") && mine && m.text === msg.text),
          );

          return {
            ...c,
            // not loaded yet: skip, the full fetch will include it
            messages: c.loaded ? [...messages, msg] : messages,
            unread: isOpen || mine ? c.unread : c.unread + 1,
          };
        });

        if (isOpen && !mine) chatService.markRead(convoId).catch(() => {});
      }

      // ASSUMED: { type:"reaction", conversation_id, message_id,
      //            reactions:[{ emoji, count, reacted_by_me }] }
      if (evt.type === "reaction") {
        const reactions = toMessage({
          id: evt.message_id,
          reactions: evt.reactions,
        }).reactions;
        patch(String(evt.conversation_id), (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === String(evt.message_id) ? { ...m, reactions } : m,
          ),
        }));
      }
    };

    const sock = connectChatSocket({
      onEvent: handleEvent,
      onStatus: (isOnline) => {
        setOnline(isOnline);
        if (!isOnline) return;

        // first connect: initial load already ran. Reconnect: catch up.
        if (!hasConnectedRef.current) {
          hasConnectedRef.current = true;
          return;
        }
        chatService
          .fetchConversations()
          .then((list) => setConvos((prev) => mergeConvos(list, prev)))
          .catch(() => {});

        const id = activeIdRef.current;
        if (id) {
          chatService
            .fetchMessages(id)
            .then((messages) => patch(id, (c) => ({ ...c, messages })))
            .catch(() => {});
        }
      },
    });

    return () => sock.close();
  }, []);

  // ---------- actions ----------
  const loadMessages = async (id) => {
    patch(id, (c) => ({ ...c, loading: true }));
    try {
      const messages = await chatService.fetchMessages(id);
      patch(id, (c) => ({ ...c, messages, loaded: true, loading: false }));
    } catch {
      patch(id, (c) => ({ ...c, loading: false }));
    }
  };

  const select = async (id) => {
    setActiveId(id);
    const target = convosRef.current.find((c) => c.id === id);

    if (target?.unread > 0) {
      patch(id, (c) => ({ ...c, unread: 0 }));
      chatService.markRead(id).catch(() => {});
    }
    if (target && !target.loaded) await loadMessages(id);
  };

  const clearActive = () => setActiveId(null);

  const sendMessage = async (id, text) => {
    const tempId = `tmp-${Date.now()}`;
    const temp = {
      id: tempId,
      sender: currentUser,
      text,
      createdAt: new Date().toISOString(),
      file: null,
      reactions: [],
      replies: 0,
    };
    patch(id, (c) => ({ ...c, messages: [...c.messages, temp] }));

    try {
      const saved = await chatService.sendMessage(id, { text });
      if (saved) {
        patch(id, (c) => {
          // the socket echo may have already added the saved message
          const hasSaved = c.messages.some((m) => m.id === saved.id);
          return {
            ...c,
            messages: hasSaved
              ? c.messages.filter((m) => m.id !== tempId)
              : c.messages.map((m) => (m.id === tempId ? saved : m)),
          };
        });
      }
    } catch {
      patch(id, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== tempId),
      }));
    }
  };

  const toggleReaction = async (convoId, messageId, emoji) => {
    const apply = () =>
      patch(convoId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id !== messageId
            ? m
            : { ...m, reactions: nextReactions(m.reactions, emoji) },
        ),
      }));

    apply();
    try {
      await chatService.toggleReaction(messageId, emoji);
    } catch {
      apply(); // toggling again reverts the optimistic change
    }
  };

  const loadPeople = async () => {
    if (peopleLoading) return;
    setPeopleLoading(true);
    try {
      setPeople(await chatService.fetchTeammates());
    } catch {
    } finally {
      setPeopleLoading(false);
    }
  };

  const startDirect = async (person) => {
    const existing = convosRef.current.find(
      (c) => c.kind === "dm" && c.peer?.uuid === person.uuid,
    );
    if (existing) return select(existing.id);

    try {
      const res = await chatService.startDirectChat(person.uuid);
      const id = String(res?.id ?? res?.conversation_id ?? `d-${person.uuid}`);
      setConvos((prev) =>
        prev.some((c) => c.id === id)
          ? prev
          : [
              ...prev,
              {
                id,
                kind: "dm",
                name: person.name,
                topic: "",
                private: false,
                members: [],
                peer: person,
                unread: 0,
                messages: [],
                loaded: false,
                loading: false,
              },
            ],
      );
      setActiveId(id);
      loadMessages(id);
    } catch {}
  };

  return {
    convos,
    active,
    activeId,
    loading,
    online,
    people,
    peopleLoading,
    loadPeople,
    startDirect,
    select,
    clearActive,
    sendMessage,
    toggleReaction,
  };
}

function useAppSidebarWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = document.querySelector("div.fixed.left-0.top-0.bg-black");

    const update = () => {
      if (window.innerWidth < 768) return setWidth(0);
      setWidth(el ? el.getBoundingClientRect().width : window.innerWidth * 0.2);
    };

    update();
    const ro =
      typeof ResizeObserver !== "undefined" && el
        ? new ResizeObserver(update)
        : null;
    if (el) ro?.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return width;
}

const prefixOf = (c) => (c.kind === "team" ? "" : c.private ? "🔒 " : "#");

const nounOf = (c) => (c.kind === "team" ? "team" : "channel");

const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const dayLabel = (iso) => {
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

const timeLabel = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function withDayDividers(messages = []) {
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

function Message({ message, showHeader, onReact }) {
  const user = message.sender ?? { name: "Unknown" };
  const { file, reactions, replies } = message;

  const FileTag = file?.url ? "a" : "div";
  const fileProps = file?.url
    ? { href: file.url, target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <div className="group relative flex gap-2.5 px-5 py-[3px] hover:bg-[#F2F4F3]">
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

        <div
          className="whitespace-pre-wrap break-words text-[15px] leading-[22px]"
          style={{ color: COLORS.text }}
        >
          {message.text}
        </div>

        {file && (
          <FileTag
            {...fileProps}
            className="mt-1.5 flex w-fit items-center gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: COLORS.line }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-md bg-[#fbe8ea]"
              style={{ color: COLORS.link }}
            >
              <Icon name="file" size={20} />
            </span>
            <div>
              <div
                className="text-[14px] font-medium"
                style={{ color: COLORS.link }}
              >
                {file.name}
              </div>
              <div className="text-[12px]" style={{ color: COLORS.sub }}>
                {file.size}
              </div>
            </div>
          </FileTag>
        )}

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

      <div
        className="absolute -top-3.5 right-5 hidden items-center rounded-lg border bg-white px-0.5 py-0.5 shadow-sm group-hover:flex"
        style={{ borderColor: COLORS.line, color: COLORS.sub }}
      >
        <button
          onClick={() => onReact("👍")}
          title="React"
          className="rounded p-1.5 hover:bg-[#F2F4F3]"
        >
          <Icon name="smile" size={17} />
        </button>
        <button
          title="Reply in thread"
          className="rounded p-1.5 hover:bg-[#F2F4F3]"
        >
          <Icon name="reply" size={17} />
        </button>
        <button title="More" className="rounded p-1.5 hover:bg-[#F2F4F3]">
          <Icon name="more" size={17} />
        </button>
      </div>
    </div>
  );
}

function Header({ convo, onBack }) {
  const isDm = convo.kind === "dm";
  const title = titleOf(convo);
  const members = convo.members || [];

  return (
    <>
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b pl-16 pr-4 md:pl-4"
        style={{ borderColor: COLORS.line }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            onClick={onBack}
            className="mr-1 md:hidden"
            style={{ color: COLORS.sub }}
            aria-label="Back"
          >
            <Icon name="back" size={20} />
          </button>

          {isDm ? (
            <>
              <UserAvatar user={convo.peer} size={26} />
              <span
                className="truncate text-[17px] font-medium"
                style={{ color: COLORS.text }}
              >
                {title}
              </span>
            </>
          ) : (
            <>
              <Icon
                name={iconOf(convo)}
                size={17}
                style={{ color: COLORS.text }}
              />
              <span
                className="truncate text-[17px] font-medium"
                style={{ color: COLORS.text }}
              >
                {title}
              </span>
            </>
          )}
        </div>

        {!isDm && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center sm:flex">
              {members.slice(0, 3).map((m, i) => (
                <div
                  key={m.uuid}
                  className="rounded-[7px] border-2 border-white"
                  style={{ marginLeft: i ? -8 : 0 }}
                >
                  <UserAvatar user={m} size={24} />
                </div>
              ))}
            </div>
            <button
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[13px] hover:bg-[#F2F4F3]"
              style={{ borderColor: COLORS.line, color: COLORS.sub }}
            >
              <Icon name="users" size={14} /> {members.length}
            </button>
          </div>
        )}
      </div>

      {!isDm && convo.topic && (
        <div
          className="shrink-0 truncate border-b px-5 py-1.5 text-[13px]"
          style={{ borderColor: COLORS.line, color: COLORS.sub }}
        >
          {convo.topic}
        </div>
      )}
    </>
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

function MessageList({ convo, onReact }) {
  const endRef = useRef(null);

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
          />
        );
      })}

      <div ref={endRef} />
    </div>
  );
}

const FORMAT_BUTTONS = [
  ["B", "font-medium"],
  ["I", "italic"],
  ["S", "line-through"],
];

function Composer({ resetKey, placeholder, onSend }) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0;

  useEffect(() => setText(""), [resetKey]);

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="shrink-0 px-5 pb-4">
      <div
        className="rounded-lg border focus-within:border-[#1d1d1f]"
        style={{ borderColor: "#b9bdbb" }}
      >
        <div
          className="flex items-center gap-0.5 rounded-t-lg bg-[#F2F4F3] px-2 py-1"
          style={{ color: COLORS.sub }}
        >
          {FORMAT_BUTTONS.map(([label, cls]) => (
            <button
              key={label}
              className={`h-7 w-7 rounded text-[14px] hover:bg-[#dfe3e1] ${cls}`}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-[#cfd3d1]" />
          <button className="rounded p-1.5 text-[13px] font-medium hover:bg-[#dfe3e1]">
            &lt;/&gt;
          </button>
        </div>

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className="block max-h-40 w-full resize-none bg-transparent px-3 py-2 text-[15px] outline-none placeholder:text-[#8a8e8d]"
          style={{ color: COLORS.text }}
        />

        <div
          className="flex items-center justify-between px-2 pb-1.5"
          style={{ color: COLORS.sub }}
        >
          <div className="flex items-center gap-0.5">
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Attach file"
            >
              <Icon name="clip" size={18} />
            </button>
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Emoji"
            >
              <Icon name="smile" size={18} />
            </button>
            <button
              className="rounded p-1.5 hover:bg-[#F2F4F3]"
              aria-label="Mention"
            >
              <Icon name="at" size={18} />
            </button>
          </div>
          <button
            onClick={submit}
            disabled={!canSend}
            aria-label="Send message"
            className="flex items-center rounded-md px-2.5 py-1.5 transition disabled:cursor-not-allowed"
            style={{
              background: canSend ? COLORS.active : "#dfe3e1",
              color: canSend ? "#fff" : "#9a9e9d",
            }}
          >
            <Icon name="send" size={16} />
          </button>
        </div>
      </div>

      <div
        className="mt-1 px-1 text-right text-[11.5px]"
        style={{ color: COLORS.sub }}
      >
        <span className="font-medium">Enter</span> to send ·{" "}
        <span className="font-medium">Shift + Enter</span> for a new line
      </div>
    </div>
  );
}

function Conversation({ convo, onBack, onSend, onReact }) {
  const title = titleOf(convo);
  const placeholder =
    convo.kind === "dm"
      ? `Message ${title}`
      : `Message ${prefixOf(convo)}${title}`;

  return (
    <div className="flex h-full flex-col bg-white">
      <Header convo={convo} onBack={onBack} />
      <MessageList convo={convo} onReact={onReact} />
      <Composer
        resetKey={convo.id}
        placeholder={placeholder}
        onSend={(text) => onSend(convo.id, text)}
      />
    </div>
  );
}

export default function ChatView({ currentUser }) {
  const {
    convos,
    active,
    activeId,
    loading,
    online,
    people,
    peopleLoading,
    loadPeople,
    startDirect,
    select,
    clearActive,
    sendMessage,
    toggleReaction,
  } = useConversations(currentUser);
  const left = useAppSidebarWidth();

  return (
    <div
      className="fixed bottom-0 right-0 top-0 z-30 flex bg-white font-normal"
      style={{ left, fontFamily: "Poppins, sans-serif" }}
    >
      <aside
        className={`${active ? "hidden md:block" : "block"} h-full w-full shrink-0 md:w-[250px] lg:w-[280px]`}
      >
        <ChatSidebar
          convos={convos}
          activeId={activeId}
          loading={loading}
          online={online}
          currentUser={currentUser}
          onSelect={select}
          people={people}
          peopleLoading={peopleLoading}
          onLoadPeople={loadPeople}
          onStartDm={startDirect}
        />
      </aside>

      <section
        className={`${active ? "block" : "hidden md:block"} h-full min-w-0 flex-1`}
      >
        {!active ? (
          <div
            className="hidden h-full items-center justify-center text-[15px] md:flex"
            style={{ color: COLORS.sub }}
          >
            Select a conversation to start chatting
          </div>
        ) : (
          <Conversation
            key={active.id}
            convo={active}
            onBack={clearActive}
            onSend={sendMessage}
            onReact={toggleReaction}
          />
        )}
      </section>
    </div>
  );
}
