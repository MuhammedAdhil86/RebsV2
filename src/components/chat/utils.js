/** Pure helpers for reading conversation / message objects. */

export const titleOf = (c) =>
  c.kind === "dm" ? (c.peer?.name ?? c.name) : c.name;

/** Returns an icon name understood by <Icon name=... /> */
export const iconOf = (c) =>
  c.kind === "team" ? "users" : c.private ? "lock" : "hash";

export const prefixOf = (c) =>
  c.kind === "team" ? "" : c.private ? "🔒 " : "#";

export const nounOf = (c) => (c.kind === "team" ? "team" : "channel");

/* ------------------------------ date helpers ----------------------------- */

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

/**
 * Turns a flat, oldest-first message list into the list the UI renders:
 * a `{ day }` divider whenever the date changes, and each message with a
 * ready-to-show `time`.
 */
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
