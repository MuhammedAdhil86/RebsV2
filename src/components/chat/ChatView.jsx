import React, { useEffect, useRef, useState } from "react";
import ChatSidebar, { COLORS, titleOf } from "./chat_sidebar";
import { toast } from "react-toastify";
import chatService, { toMessage } from "../../service/chatService";
import { getDepartmentData } from "../../service/companyService";
import { subscribeEvents, subscribeStatus } from "../../ws/useChatSocket";
import ChatViewHead from "./ChatViewHead";
import ChatViewer, { prefixOf } from "./ChatViewer";
import ChatTool from "./ChatTool";
import {
  describeState,
  isAppActive,
  showChatNotification,
  useChatNotificationLifecycle,
} from "../../Hooks/useNotifications";

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

// WebSocket event type meaning "this conversation was deleted".
// NOT VERIFIED against the backend: set this to the exact `type` it sends.
// The payload is expected as evt.data.conversation_id, like chat_message.
const CONVERSATION_DELETED = "conversation_deleted";

// Delete detection. Exact match first; the fallback also accepts any
// conversation/chat event whose type says delete/remove (but not a single
// message being deleted). Remove the fallback once the real type is known.
const isConversationDeleted = (type = "") =>
  type === CONVERSATION_DELETED ||
  (/(conversation|chat|channel|dm)/i.test(type) &&
    /(delet|remov)/i.test(type) &&
    !/message/i.test(type));

function useConversations(currentUser) {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [online, setOnline] = useState(false);
  // true when the open chat was removed by someone else (drives the empty state)
  const [unavailable, setUnavailable] = useState(false);

  // refs so the socket handler never reads stale state
  const activeIdRef = useRef(null);
  const convosRef = useRef([]);
  const userRef = useRef(currentUser);
  const hasConnectedRef = useRef(false);
  const countedRef = useRef(new Set()); // message ids already counted as unread
  const deletingRef = useRef(new Set()); // conversations I am deleting right now
  const deletedRef = useRef(new Set()); // tombstones: deleted ids must never come back
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

  useChatNotificationLifecycle();
  const selectRef = useRef(null); // lets a notification click open its chat

  // Native notification for an incoming message. Only when the user is NOT
  // looking at the app (other tab / minimized / window unfocused); while the
  // app is active your existing toasts handle it. Never for my own messages.
  const notifyIncoming = ({
    convo,
    convoId,
    id,
    senderName,
    text,
    hasFile,
  }) => {
    console.log("[notify] incoming message", {
      convoId,
      id,
      ...describeState(),
    });
    if (isAppActive()) return;
    const who = senderName || "";
    let title;
    if (!convo) title = who || "New message";
    else if (convo.kind === "dm") title = who || titleOf(convo);
    else title = `${who || "Someone"} in ${prefixOf(convo)}${titleOf(convo)}`;

    showChatNotification({
      id,
      convoId,
      title,
      body: text || (hasFile ? "Sent an attachment" : ""),
      onOpen: (cid) => selectRef.current?.(cid),
    });
  };

  const patch = (id, fn) =>
    setConvos((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));

  // Drop tombstoned conversations from a server list
  const alive = (list) => list.filter((c) => !deletedRef.current.has(c.id));

  // Remove a conversation everywhere: list, active chat and message state.
  // Idempotent, so duplicate events or responses change nothing.
  // external = removed by someone else (shows the "no longer available" state).
  const dropConvo = (id, external = false) => {
    deletedRef.current.add(id);
    setConvos((prev) => prev.filter((c) => c.id !== id));
    if (activeIdRef.current === id) {
      activeIdRef.current = null; // stop in-flight work targeting it right away
      setActiveId(null);
      setUnavailable(external);
    }
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

  // After a reconnect: catch up on anything missed while offline, including
  // conversations deleted in the meantime (they are absent from the fresh list)
  const syncAfterReconnect = async () => {
    refreshPeople();
    try {
      const list = await chatService.fetchConversations();
      const fresh = alive(list);
      const freshIds = new Set(fresh.map((c) => c.id));

      const gone = convosRef.current.filter((c) => !freshIds.has(c.id));
      gone.forEach((c) => deletedRef.current.add(c.id));
      const activeGone = gone.some((c) => c.id === activeIdRef.current);

      setConvos((prev) => mergeConvos(fresh, prev));
      if (activeGone) {
        activeIdRef.current = null;
        setActiveId(null);
        setUnavailable(true);
        toast.info("This conversation was deleted");
        return;
      }

      const id = activeIdRef.current;
      if (id) {
        try {
          const messages = await chatService.fetchMessages(id);
          if (!deletedRef.current.has(id))
            patch(id, (c) => ({ ...c, messages }));
        } catch (err) {
          const st = err?.response?.status;
          if (st === 404 || st === 410) dropConvo(id, true);
        }
      }
    } catch (err) {
      console.warn("[chat] reconnect sync failed", err);
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
      // DEBUG: shows every socket event this client receives
      console.log("[WS evt]", evt?.type, evt);

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

      // a conversation was deleted: remove it instantly (handled only once)
      if (isConversationDeleted(evt.type)) {
        const delId = String(
          d.conversation_id ??
            d.conversationId ??
            d.chat_id ??
            d.conversation?.id ??
            d.id ??
            "",
        );
        if (!delId) {
          console.warn("[WS] delete event has no conversation id", evt);
          return;
        }
        if (deletedRef.current.has(delId)) return; // duplicate event
        const existed = convosRef.current.some((c) => c.id === delId);
        const mine = deletingRef.current.has(delId); // my own delete echo
        dropConvo(delId, !mine);
        if (existed && !mine) toast.info("This conversation was deleted");
        return;
      }

      const convoId = String(d.conversation_id ?? "");
      if (!convoId) {
        console.warn("[WS] no conversation_id in", evt);
        return;
      }

      // late messages / notifications for a deleted conversation are ignored,
      // so they can never bring it back (e.g. via the "unknown DM" reload)
      if (deletedRef.current.has(convoId)) return;

      const me = String(userRef.current?.uuid ?? "");
      const known = convosRef.current.find((c) => c.id === convoId);

      // conversation not in the list yet (new DM): reload the list
      if (!known) {
        const fromMe = d.sender_id != null && String(d.sender_id) === me;
        const bump = evt.type === "chat_text" && !fromMe;
        if (
          !fromMe &&
          (evt.type === "chat_text" || evt.type === "chat_message")
        ) {
          notifyIncoming({
            convoId,
            id: d.message_id ?? d.id,
            senderName: d.sender_name,
            text: d.text ?? d.message ?? d.content ?? "",
          });
        }
        chatService
          .fetchConversations()
          .then((list) =>
            setConvos((prev) =>
              mergeConvos(alive(list), prev).map((c) =>
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

        if (!mine) {
          notifyIncoming({
            convo: known,
            convoId,
            id: msg.id,
            senderName: msg.sender?.name,
            text: msg.text,
            hasFile: !!msg.file,
          });
        }

        patch(convoId, (c) => {
          if (c.messages.some((m) => m.id === msg.id)) return c;

          // replace our own temporary message (text AND file name must match,
          // so a caption-less attachment never replaces the wrong temp)
          const messages = c.messages.filter(
            (m) =>
              !(
                String(m.id).startsWith("tmp-") &&
                mine &&
                m.text === msg.text &&
                (m.file?.name ?? null) === (msg.file?.name ?? null)
              ),
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

        const sender = known.members.find(
          (m) => String(m.uuid) === String(d.sender_id),
        );
        notifyIncoming({
          convo: known,
          convoId,
          id: d.message_id ?? d.id,
          senderName:
            sender?.name ??
            d.sender_name ??
            (known.kind === "dm" ? known.peer?.name : ""),
          text: d.text ?? d.message ?? d.content ?? "",
        });

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

      syncAfterReconnect();
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
      if (deletedRef.current.has(id)) return; // deleted while loading
      patch(id, (c) => ({ ...c, messages, loaded: true, loading: false }));
    } catch (err) {
      // conversation no longer exists (deleted by someone else)
      const st = err?.response?.status;
      if (st === 404 || st === 410) return dropConvo(id, true);
      patch(id, (c) => ({ ...c, loading: false }));
    }
  };

  const select = async (id) => {
    setActiveId(id);
    setUnavailable(false);
    const target = convosRef.current.find((c) => c.id === id);

    if (target?.unread > 0) {
      patch(id, (c) => ({ ...c, unread: 0 }));
      chatService.markRead(id).catch(() => {});
    }
    if (target && !target.loaded) await loadMessages(id);
  };

  selectRef.current = select;

  const clearActive = () => setActiveId(null);

  const sendMessage = async (id, text) => {
    if (deletedRef.current.has(id)) return; // conversation no longer exists
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
      const st = err?.response?.status;
      if (st === 404 || st === 410) {
        dropConvo(id, true);
        toast.info("This conversation was deleted");
        return;
      }
      patch(id, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== tempId),
      }));
    }
  };

  // Send one or more files. The API accepts one file per request, so the
  // caption goes with the first file only.
  const sendFiles = async (id, files, text = "") => {
    if (deletedRef.current.has(id)) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const caption = i === 0 ? text : "";
      const tempId = `tmp-${Date.now()}-${i}`;
      const previewUrl = URL.createObjectURL(file);

      const temp = {
        id: tempId,
        sender: currentUser,
        text: caption,
        createdAt: new Date().toISOString(),
        file: {
          name: file.name,
          size: file.size,
          url: previewUrl,
          mime: file.type,
          uploading: true,
        },
        reactions: [],
        replies: 0,
      };
      patch(id, (c) => ({ ...c, messages: [...c.messages, temp] }));

      try {
        const saved = await chatService.sendAttachment(id, file, caption);
        if (saved) {
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
          "[chat] send attachment failed",
          err?.response?.status,
          err?.response?.data || err,
        );
        const st = err?.response?.status;
        if (st === 404 || st === 410) {
          dropConvo(id, true);
          toast.info("This conversation was deleted");
          return;
        }
        patch(id, (c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== tempId),
        }));
        toast.error(
          err?.response?.data?.message || `Couldn't send ${file.name}`,
        );
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  // Voice note = just a file. The endpoint has no duration field, so
  // `duration` is unused for now.
  const sendVoice = (id, file /*, duration */) => sendFiles(id, [file], "");

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
          deletedRef.current.delete(found.id);
          setUnavailable(false);
          setActiveId(found.id);
          loadMessages(found.id);
        }
        return;
      }

      const id = String(rawId);
      deletedRef.current.delete(id);
      setUnavailable(false);
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

  // Reload the list (the create responses have no members) and open the new chat
  const openCreated = async (res) => {
    const rawId = res?.id ?? res?.conversation_id;

    const list = await chatService.fetchConversations();
    setConvos((prev) => mergeConvos(alive(list), prev));

    if (rawId != null) {
      const id = String(rawId);
      deletedRef.current.delete(id);
      setUnavailable(false);
      setActiveId(id);
      loadMessages(id);
    }
  };

  // Create a channel from selected people
  const createChannel = async ({ name, employeeUuids }) => {
    try {
      const res = await chatService.createChannel({ name, employeeUuids });
      await openCreated(res);
      toast.success("Channel created");
      return true;
    } catch (err) {
      console.error("[chat] create channel failed", err);
      toast.error(
        err?.response?.data?.message || "Couldn't create the channel",
      );
      return false;
    }
  };

  // Departments for the "Create team" picker (normalised to { id, name })
  const loadDepartments = async () => {
    try {
      const list = await getDepartmentData();
      setDepartments(
        (Array.isArray(list) ? list : [])
          .map((d) => ({
            id: d.id ?? d.department_id,
            name: d.name ?? d.department_name ?? d.title ?? "",
          }))
          .filter((d) => d.id != null && d.name),
      );
    } catch (err) {
      console.warn("[chat] load departments failed", err);
    }
  };

  // Create a team (whole department)
  const createTeam = async ({ name, departmentId }) => {
    try {
      const res = await chatService.createTeam({ name, departmentId });
      await openCreated(res);
      toast.success("Team created");
      return true;
    } catch (err) {
      console.error("[chat] create team failed", err);
      toast.error(err?.response?.data?.message || "Couldn't create the team");
      return false;
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
    departments,
    loadDepartments,
    startDirect,
    createChannel,
    createTeam,
    select,
    clearActive,
    sendMessage,
    sendFiles,
    sendVoice,
    toggleReaction,
    deleteConversation,
    unavailable,
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

function Conversation({
  convo,
  onBack,
  onSend,
  onSendFiles,
  onSendVoice,
  onReact,
  onlineIds,
  onDelete,
}) {
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
        onSendFiles={(files, text) => onSendFiles(convo.id, files, text)} // File[] + caption
        onSendVoice={({ file, duration }) =>
          onSendVoice(convo.id, file, duration)
        } // File + seconds
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
    departments,
    loadDepartments,
    startDirect,
    createChannel,
    createTeam,
    select,
    clearActive,
    sendMessage,
    sendFiles,
    sendVoice,
    toggleReaction,
    deleteConversation,
    unavailable,
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
          onCreateChannel={createChannel}
          departments={departments}
          onLoadDepartments={loadDepartments}
          onCreateTeam={createTeam}
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
            {unavailable
              ? "This conversation is no longer available."
              : "Select a conversation to start chatting"}
          </div>
        ) : (
          <Conversation
            key={active.id}
            convo={active}
            onBack={clearActive}
            onSend={sendMessage}
            onSendFiles={sendFiles}
            onSendVoice={sendVoice}
            onReact={toggleReaction}
            onlineIds={onlineIds}
            onDelete={deleteConversation}
          />
        )}
      </section>
    </div>
  );
}
