import React, { useState } from "react";
import { COLORS, Icon, UserAvatar, titleOf } from "./chat_shared";
import Teams from "./Teams";
import Channels from "./Channels";
import DirectMessages from "./DirectMessages";

// Re-exported so existing imports like
//   import ChatSidebar, { COLORS, titleOf } from "./chat_sidebar"
// keep working in ChatView, ChatTool, ChatViewer, ChatViewHead.
export { COLORS, Icon, UserAvatar, titleOf, iconOf } from "./chat_shared";

const NO_ONE = new Set();

export default function ChatSidebar({
  convos,
  activeId,
  loading,
  online = false,
  onlineIds = NO_ONE,
  currentUser,
  onSelect,
  people,
  peopleLoading,
  onLoadPeople,
  onStartDm,
  onCreateChannel,
  departments = [],
  onLoadDepartments,
  onCreateTeam,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({ teams: true, channels: true, dms: true });
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  const q = query.trim().toLowerCase();
  const match = (c) => !q || titleOf(c).toLowerCase().includes(q);

  const teams = convos.filter((c) => c.kind === "team" && match(c));
  const channels = convos.filter((c) => c.kind === "channel" && match(c));
  const dms = convos.filter((c) => c.kind === "dm" && match(c));

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{ background: COLORS.side }}
    >
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b pl-16 pr-4 md:pl-4"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <div className="text-[17px] font-medium text-white">REBS Workspace</div>
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: online ? COLORS.online : COLORS.offline }}
          title={online ? "Connected" : "Reconnecting…"}
        />
      </div>

      <div className="shrink-0 px-3 py-2.5">
        <div
          className="flex h-[30px] items-center gap-2 rounded-md px-2.5"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          <Icon name="search" size={15} className="text-white/80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a team, channel or person"
            className="w-full bg-transparent text-[13.5px] text-white outline-none placeholder:text-white/70"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <Teams
          teams={teams}
          activeId={activeId}
          onSelect={onSelect}
          departments={departments}
          onLoadDepartments={onLoadDepartments}
          onCreateTeam={onCreateTeam}
          open={open.teams}
          onToggle={() => toggle("teams")}
        />

        <Channels
          channels={channels}
          activeId={activeId}
          onSelect={onSelect}
          onlineIds={onlineIds}
          people={people}
          peopleLoading={peopleLoading}
          onLoadPeople={onLoadPeople}
          onCreateChannel={onCreateChannel}
          open={open.channels}
          onToggle={() => toggle("channels")}
        />

        <DirectMessages
          dms={dms}
          activeId={activeId}
          onSelect={onSelect}
          onlineIds={onlineIds}
          people={people}
          peopleLoading={peopleLoading}
          onLoadPeople={onLoadPeople}
          onStartDm={onStartDm}
          open={open.dms}
          onToggle={() => toggle("dms")}
        />
      </div>

      {loading && (
        <div
          className="px-4 py-3 text-[14px]"
          style={{ color: COLORS.sideText }}
        >
          Loading conversations…
        </div>
      )}
      {!loading && teams.length + channels.length + dms.length === 0 && (
        <div
          className="px-4 py-3 text-[14px]"
          style={{ color: COLORS.sideText }}
        >
          {q ? `Nothing matches “${query}”.` : "No conversations yet."}
        </div>
      )}

      <div
        className="flex shrink-0 items-center gap-2.5 border-t px-4 py-2.5"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <UserAvatar user={currentUser} size={30} />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-medium text-white">
            {currentUser?.name}
          </div>
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ color: COLORS.sideText }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: COLORS.online }}
            />{" "}
            Active
          </div>
        </div>
      </div>
    </div>
  );
}
