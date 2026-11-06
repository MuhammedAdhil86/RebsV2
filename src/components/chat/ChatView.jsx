import React, { useEffect, useRef, useState } from "react";
import ChatSidebar, { COLORS, titleOf } from "./chat_sidebar";
import { toast } from "react-toastify";
import chatService, { toMessage } from "../../service/chatService";
import { subscribeEvents, subscribeStatus } from "../../ws/useChatSocket";
import ChatViewHead from "./ChatViewHead";
import ChatViewer, { prefixOf } from "./ChatViewer";
import ChatTool from "./ChatTool";

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

const PRESENCE_POLL = 30000;

// websocket event types that mean "this conversation was deleted"
// (template: confirm the exact name with your backend)
const DELETE_EVENTS = new Set([
  "conversation_deleted",
  "chat_deleted",
  "chat_delete",
]);

function useConversations(currentUser) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [online, setOnline] = useState(false);

  // refs so the socket handler never reads stale state
  const activeIdRef = useRef(null);
  const convosRef = useRef([]);
  const userRef = useRef(currentUser);
  const hasConnectedRef = useRef(false);
  const countedRef = useRef(new Set()); // message ids already counted as unread
  const deletingRef = useRef(new Set()); // conversations I am deleting right now
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

  // Remove a conversation from the list; close it if it is open
  const dropConvo = (id) => {
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (activeIdRef.current === id) setActiveId(null);
  };

  // Fetch teammates and rebuild the people list + the set of online uuids
  const refreshPeople = async () => {
    try {
      const list = await chatService.fetchTeammates();
      const me = String(userRef.current?.uuid ?? "");
      setPeople(list.filter((p) => p.uuid !== me)); // hide yourself
      setOnlineIds(new Set(list.filter((p) => p.online).map((p) => p.uuid)));
    } catch (err) {
      console.warn("[chat] fetchTeammates failed", err);
    }
  };

  // ---------- initial load ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await chatService.fetchConversations();
        if (!cancelled) setConvos(list);
      } catch (err) {
        console.warn("[chat] fetchConversations failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- online status: load now, then refresh every 30s ----------
  useEffect(() => {
    refreshPeople();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refreshPeople();
    }, PRESENCE_POLL);
    return () => clearInterval(t);
  }, []);

  // ---------- realtime (shared socket, started in App.jsx) ----------
  useEffect(() => {
    const handleEvent = (evt) => {
      // presence update (template: confirm the event name with your backend)
      if (evt.type === "presence") {
        const id = String(evt.data?.uuid ?? "");
        if (!id) return;
        setOnlineIds((prev) => {
          const next = new Set(prev);
          if (evt.data?.is_online) next.add(id);
          else next.delete(id);
          return next;
        });
        return;
      }

      const d = evt.data ?? {};
      const convoId = String(d.conversation_id ?? "");
      if (!convoId) {
        console.warn("[WS] no conversation_id in", evt);
        return;
      }

      // someone deleted this conversation: remove it instantly for everyone
      if (DELETE_EVENTS.has(evt.type)) {
        const existed = convosRef.current.some((c) => c.id === convoId);
        const wasOpen = activeIdRef.current === convoId;
        dropConvo(convoId);
        // no extra toast for the person who deleted it (they get their own)
        if (existed && !deletingRef.current.has(convoId)) {
          toast.info(
            wasOpen
              ? "This conversation was deleted"
              : "A conversation was deleted",
          );
        }
        return;
      }

      const me = String(userRef.current?.uuid ?? "");
      const known = convosRef.current.find((c) => c.id === convoId);

      // conversation not in the list yet (new DM): reload the list
      if (!known) {
        const fromMe = d.sender_id != null && String(d.sender_id) === me;
        const bump = evt.type === "chat_text" && !fromMe;
        chatService
          .fetchConversations()
          .then((list) =>
            setConvos((prev) =>
              mergeConvos(list, prev).map((c) =>
                bump && c.id === convoId ? { ...c, unread: c.unread + 1 } : c,
              ),
            ),
          )
          .catch(() => {});
        return;
      }

      const isOpen = activeIdRef.current === convoId;

      // chat_message: the actual message for the conversation screen
      if (evt.type === "chat_message") {
        const msg = toMessage(d);
        if (!msg.createdAt) msg.createdAt = evt.created_at;
        const mine = msg.sender?.uuid === me;

        // API sends sender_name "": take the person from the participants
        if (!msg.sender?.name) {
          const person = known.members.find((m) => m.uuid === msg.sender?.uuid);
          if (person) msg.sender = person;
          else if (mine) msg.sender = userRef.current;
        }

        patch(convoId, (c) => {
          if (c.messages.some((m) => m.id === msg.id)) return c;

          // replace our own temporary message
          const messages = c.messages.filter(
            (m) =>
              !(String(m.id).startsWith("tmp-") && mine && m.text === msg.text),
          );

          return { ...c, messages: c.loaded ? [...messages, msg] : messages };
        });

        if (isOpen && !mine) chatService.markRead(convoId).catch(() => {});
        return;
      }

      // chat_text: notification, used only for the unread badge
      if (evt.type === "chat_text") {
        if (d.sender_id != null && String(d.sender_id) === me) return;

        const key = d.message_id ?? d.id;
        if (key != null) {
          const k = String(key);
          if (countedRef.current.has(k)) return;
          countedRef.current.add(k);
          if (countedRef.current.size > 500) {
            countedRef.current.delete(countedRef.current.values().next().value);
          }
        }

        if (isOpen) {
          chatService.markRead(convoId).catch(() => {});
        } else {
          patch(convoId, (c) => ({ ...c, unread: c.unread + 1 }));
        }
      }
    };

    const offEvents = subscribeEvents(handleEvent);

    const offStatus = subscribeStatus((isOnline) => {
      setOnline(isOnline);
      if (!isOnline) return;

      // first report: initial load already ran. Later reconnects: catch up.
      if (!hasConnectedRef.current) {
        hasConnectedRef.current = true;
        return;
      }

      refreshPeople();

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
    });

    return () => {
      offEvents();
      offStatus();
    };
  }, []);

  // ---------- actions ----------
  const loadMessages = async (id) => {
    patch(id, (c) => ({ ...c, loading: true }));
    try {
      const messages = await chatService.fetchMessages(id);
      patch(id, (c) => ({ ...c, messages, loaded: true, loading: false }));
    } catch (err) {
      // conversation no longer exists (deleted by someone else)
      if (err?.response?.status === 404) return dropConvo(id);
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
      console.log("[chat] send response:", saved);
      if (saved) {
        // API returns sender_name "", so keep our own name and avatar
        const full = saved.sender?.name
          ? saved
          : { ...saved, sender: currentUser };
        patch(id, (c) => {
          // the socket echo may have already added the saved message
          const hasSaved = c.messages.some((m) => m.id === full.id);
          return {
            ...c,
            messages: hasSaved
              ? c.messages.filter((m) => m.id !== tempId)
              : c.messages.map((m) => (m.id === tempId ? full : m)),
          };
        });
      }
    } catch (err) {
      console.error(
        "[chat] send failed",
        err?.response?.status,
        err?.response?.data || err,
      );
      if (err?.response?.status === 404) {
        dropConvo(id);
        toast.info("This conversation was deleted");
        return;
      }
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

  // Delete a whole conversation on the server, then remove it from the list.
  // Returns true when it worked.
  const deleteConversation = async (id) => {
    deletingRef.current.add(id);
    try {
      await chatService.deleteConversation(id);
      dropConvo(id);
      toast.success("Conversation deleted");
      return true;
    } catch (err) {
      console.error("[chat] delete conversation failed", err);
      toast.error(
        err?.response?.data?.message || "Couldn't delete the conversation",
      );
      return false;
    } finally {
      deletingRef.current.delete(id);
    }
  };

  // Called when the "New message" picker opens
  const loadPeople = async () => {
    if (peopleLoading) return;
    setPeopleLoading(true);
    await refreshPeople();
    setPeopleLoading(false);
  };

  const startDirect = async (person) => {
    const existing = convosRef.current.find(
      (c) => c.kind === "dm" && c.peer?.uuid === person.uuid,
    );
    if (existing) return select(existing.id);

    try {
      const res = await chatService.startDirectChat(person.uuid);
      const rawId = res?.id ?? res?.conversation_id ?? res?.conversation?.id;

      // API returned no id: reload the list and find the DM by peer uuid
      if (rawId == null) {
        const list = await chatService.fetchConversations();
        setConvos((prev) => mergeConvos(list, prev));
        const found = list.find(
          (c) => c.kind === "dm" && c.peer?.uuid === person.uuid,
        );
        if (found) {
          setActiveId(found.id);
          loadMessages(found.id);
        }
        return;
      }

      const id = String(rawId);
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
                members: [person],
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
    } catch (err) {
      console.warn("[chat] startDirect failed", err);
    }
  };

  return {
    convos,
    active,
    activeId,
    loading,
    online,
    onlineIds,
    people,
    peopleLoading,
    loadPeople,
    startDirect,
    select,
    clearActive,
    sendMessage,
    toggleReaction,
    deleteConversation,
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

function Conversation({ convo, onBack, onSend, onReact, onlineIds, onDelete }) {
  const title = titleOf(convo);
  const placeholder =
    convo.kind === "dm"
      ? `Message ${title}`
      : `Message ${prefixOf(convo)}${title}`;

  return (
    <div className="flex h-full flex-col bg-white">
      <ChatViewHead
        convo={convo}
        onBack={onBack}
        onlineIds={onlineIds}
        onDelete={onDelete}
      />
      <ChatViewer convo={convo} onReact={onReact} />
      <ChatTool
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
    onlineIds,
    people,
    peopleLoading,
    loadPeople,
    startDirect,
    select,
    clearActive,
    sendMessage,
    toggleReaction,
    deleteConversation,
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
          onlineIds={onlineIds}
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
            onlineIds={onlineIds}
            onDelete={deleteConversation}
          />
        )}
      </section>
    </div>
  );
}
