import { createElement as h } from "react";
import { COLORS, USERS } from "./constants";

/**
 * Tiny shared primitives (icon, avatar, presence dot).
 * Written without JSX so the only .jsx files are Sidebar and ChatView.
 */

const ICON_PATHS = {
  hash: "M9.4 3 8.700 7H5v2h3.300l-.7 4H4v2h3.300l-.7 4h2l.7-4h4l-.7 4h2l.7-4H19v-2h-3.300l.7-4H20V7h-3.300l.7-4h-2l-.7 4h-4l.7-4Zm-.4 6h4l-.7 4h-4Z",
  lock: "M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2ZM9 6a3 3 0 0 1 6 0v2H9Z",
  caret: "M8 5l8 7-8 7Z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z",
  search:
    "M15.500 14h-.8l-.3-.3a6.500 6.500 0 1 0-.7.7l.3.3v.8l5 5 1.500-1.500Zm-6 0a4.500 4.500 0 1 1 0-9 4.500 4.500 0 0 1 0 9Z",
  back: "M12 4l1.400 1.400L7.800 11H20v2H7.800l5.600 5.600L12 20l-8-8Z",
  smile:
    "M9 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 6.500c2 0 3.700-1.200 4.400-3H7.600c.7 1.800 2.400 3 4.400 3ZM12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z",
  reply: "M10 9V5l-7 7 7 7v-4.100c5 0 8.500 1.600 11 5.100-1-5-4-10-11-11Z",
  more: "M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  at: "M12 2a10 10 0 1 0 5 18.600l-1-1.700A8 8 0 1 1 20 12v1.500a1.500 1.500 0 0 1-3 0V12a5 5 0 1 0-1.500 3.600A3.500 3.500 0 0 0 22 13.500V12A10 10 0 0 0 12 2Zm0 13a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z",
  clip: "M16.500 6.500v9.800a4.500 4.500 0 0 1-9 0V5.800a3 3 0 0 1 6 0v9.500a1.500 1.500 0 0 1-3 0V6.500H9.100v8.800a3 3 0 0 0 6 0V5.800a4.500 4.500 0 0 0-9 0v10.500a6 6 0 0 0 12 0V6.500Z",
  send: "M2 21l21-9L2 3v7l15 2-15 2Z",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-1 7V3.500L18.500 9Z",
  users:
    "M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.300 0-7 1.200-7 3.500V19h14v-2.500C15 14.200 10.300 13 8 13Zm8 0c-.3 0-.6 0-1 .1 1.200.9 2 2 2 3.400V19h6v-2.500c0-2.300-4.700-3.500-7-3.500Z",
};

export function Icon({ name, size = 16, className = "", style }) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "currentColor",
      className,
      style,
      "aria-hidden": "true",
    },
    h("path", { d: ICON_PATHS[name] }),
  );
}

const initials = (name = "") =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export function UserAvatar({ id, size = 36 }) {
  const user = USERS[id];
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        background: user.color,
        fontSize: size * 0.38,
      },
      className:
        "flex shrink-0 items-center justify-center rounded-[6px] font-medium text-white",
    },
    initials(user.name),
  );
}

export function Presence({ online }) {
  return h("span", {
    className: online
      ? "inline-block h-[9px] w-[9px] rounded-full"
      : "inline-block h-[9px] w-[9px] rounded-full border-[1.5px]",
    style: online
      ? { background: COLORS.online }
      : { borderColor: COLORS.sideText, background: "transparent" },
  });
}
