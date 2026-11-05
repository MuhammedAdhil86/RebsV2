import React, { useEffect, useRef, useState } from "react";
import ChatSidebar, {
  COLORS,
  Icon,
  UserAvatar,
  iconOf,
  titleOf,
} from "../components/chat/chat_sidebar"; // check this path
import chatService, { toMessage } from "../../service/chatService"; // and this one
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

        // API sends sender_name "": look the person up in the participants
        if (!msg.sender.name) {
          const person = known.members.find((m) => m.uuid === msg.sender.uuid);
          if (person) msg.sender = person;
          else if (mine) msg.sender = userRef.current;
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
      const list = await chatService.fetchTeammates();
      const me = String(userRef.current?.uuid ?? "");
      setPeople(list.filter((p) => p.uuid !== me)); // hide yourself
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

// ...everything below stays as you have it
// (useAppSidebarWidth, prefixOf, Message, Header, Composer, ChatView, etc.)
