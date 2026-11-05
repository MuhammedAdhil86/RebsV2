import { useEffect, useState } from "react";
import { ME } from "./constants";
import { INITIAL_CONVERSATIONS } from "./mockData";

/**
 * Local-state store for conversations.
 * Swap the internals for API / socket calls later; the returned API stays the same.
 */
export function useConversations(initialActiveId = "t-hr") {
  const [convos, setConvos] = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState(initialActiveId);

  const active = convos.find((c) => c.id === activeId) || null;

  const select = (id) => {
    setActiveId(id);
    setConvos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  };

  const clearActive = () => setActiveId(null);

  const sendMessage = (id, text) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    setConvos((prev) =>
      prev.map((c) => {
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

  const toggleReaction = (convoId, messageId, emoji) => {
    setConvos((prev) =>
      prev.map((c) =>
        c.id !== convoId
          ? c
          : {
              ...c,
              messages: c.messages.map((m) =>
                m.id !== messageId
                  ? m
                  : { ...m, reactions: nextReactions(m.reactions, emoji) },
              ),
            },
      ),
    );
  };

  return {
    convos,
    active,
    activeId,
    select,
    clearActive,
    sendMessage,
    toggleReaction,
  };
}

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

/**
 * The app's own sidebar is fixed on the left (20% wide, 6% when collapsed).
 * Measure it so the chat starts exactly at its edge, even when it collapses.
 */
export function useAppSidebarWidth() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = document.querySelector("div.fixed.left-0.top-0.bg-black");

    const update = () => {
      // mobile: the app sidebar is an overlay drawer
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
