import React, { useEffect, useRef, useState } from "react";
import { COLORS, Icon, UserAvatar, iconOf, titleOf } from "./chat_sidebar";
import { FiBell, FiBellOff, FiMoreVertical, FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";
import { useNotificationPermission } from "../../Hooks/useNotifications";
import DeleteConfirmationModal from "../../ui/deletemodal";

export default function ChatViewHead({ convo, onBack, onlineIds, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);
  const [permission, requestPermission] = useNotificationPermission();

  const isDm = convo.kind === "dm";
  const title = titleOf(convo);
  const members = convo.members || [];
  const peerOnline = isDm && onlineIds.has(String(convo.peer?.uuid));

  // close the three-dot menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const confirm = async () => {
    if (deleting) return;
    setDeleting(true);
    const ok = await onDelete(convo.id);
    // on success this conversation unmounts; on failure close the modal
    if (!ok) {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

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
              <UserAvatar user={convo.peer} size={26} online={peerOnline} />
              <span
                className="truncate text-[17px] font-medium"
                style={{ color: COLORS.text }}
              >
                {title}
              </span>
              <span className="text-[12px]" style={{ color: COLORS.sub }}>
                {peerOnline ? "Active" : "Away"}
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

        <div className="flex items-center gap-3">
          {!isDm && (
            <>
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
            </>
          )}

          {/* desktop notifications: permission is asked only on this click */}
          {permission === "default" && (
            <button
              onClick={async () => {
                const result = await requestPermission();
                if (result === "granted")
                  toast.success("Desktop notifications enabled");
                else if (result === "denied")
                  toast.info(
                    "Notifications are blocked in your browser settings",
                  );
              }}
              title="Enable desktop notifications"
              aria-label="Enable desktop notifications"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F2F4F3]"
              style={{ color: COLORS.sub }}
            >
              <FiBell size={18} />
            </button>
          )}
          {permission === "denied" && (
            <span
              title="Notifications are blocked in your browser settings"
              className="flex h-8 w-8 items-center justify-center"
              style={{ color: COLORS.offline }}
            >
              <FiBellOff size={18} />
            </span>
          )}

          {/* vertical three-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title="More"
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#F2F4F3] ${
                menuOpen ? "bg-[#F2F4F3]" : ""
              }`}
              style={{ color: menuOpen ? COLORS.text : COLORS.sub }}
            >
              <FiMoreVertical size={19} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150"
                style={{ borderColor: COLORS.line }}
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition-colors hover:bg-[#fbe8ea]"
                  style={{ color: COLORS.link }}
                >
                  <FiTrash2 size={16} />
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!isDm && convo.topic && (
        <div
          className="shrink-0 truncate border-b px-5 py-1.5 text-[13px]"
          style={{ borderColor: COLORS.line, color: COLORS.sub }}
        >
          {convo.topic}
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={confirmOpen}
        onClose={() => !deleting && setConfirmOpen(false)}
        onConfirm={confirm}
        itemName={title}
      />
    </>
  );
}
