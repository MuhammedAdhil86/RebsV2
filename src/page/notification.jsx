import React, { useState, useEffect } from "react";
import announceService from "../service/announceService";
import {
  Calendar,
  MessageSquare,
  ThumbsUp,
  Heart,
  Megaphone,
  XCircle,
  Clock,
  Layers,
  Loader2,
  Paperclip,
  RefreshCw,
} from "lucide-react";

const formatNotificationDate = (dateString) => {
  if (!dateString || dateString.startsWith("0001")) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getNotifications = async () => {
      try {
        setLoading(true);
        const res = await announceService.fetchNotifications();
        setNotifications(res || []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setError("Could not retrieve notifications. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    getNotifications();
  }, []);

  // Safe optimistic toggle utility mapping target fields correctly
  const toggleLocalAnnouncementLikeState = (list, targetNotificationId) => {
    return list.map((item) => {
      if (item.id !== targetNotificationId || item.type !== "announcement")
        return item;

      const currentHasLiked = item.data?.user_interaction?.has_liked || false;
      const currentCount = item.data?.likes_count || 0;

      return {
        ...item,
        data: {
          ...item.data,
          likes_count: currentHasLiked
            ? Math.max(0, currentCount - 1)
            : currentCount + 1,
          user_interaction: {
            ...item.data?.user_interaction,
            has_liked: !currentHasLiked,
          },
        },
      };
    });
  };

  // 1. Optimistic Like Toggle with rollback handling
  const handleLikeToggle = async (notificationId, announcementId) => {
    if (!announcementId) return;

    // Update local state instantly for a lightning fast UI response
    setNotifications((prev) =>
      toggleLocalAnnouncementLikeState(prev, notificationId),
    );

    try {
      await announceService.toggleLike(announcementId);
    } catch (err) {
      console.error("Failed to persist like adjustment:", err);
      // Revert back if API call fails
      setNotifications((prev) =>
        toggleLocalAnnouncementLikeState(prev, notificationId),
      );
    }
  };

  // 2. Comment Posting Integration
  const handleCommentSubmit = async (
    notificationId,
    announcementId,
    commentText,
  ) => {
    if (!commentText.trim() || !announcementId) return;
    try {
      const response = await announceService.postComment(
        announcementId,
        commentText,
      );

      setNotifications((prevList) =>
        prevList.map((item) => {
          if (item.id !== notificationId) return item;
          const currentComments = item.data?.comments || [];
          return {
            ...item,
            data: {
              ...item.data,
              comments: [
                ...currentComments,
                response?.data || { id: Date.now(), text: commentText },
              ],
            },
          };
        }),
      );
    } catch (err) {
      console.error("Failed to attach comment reference:", err);
    }
  };

  // 3. Emoji Selection Bar Integration
  const handleEmojiSelect = async (announcementId, emojiType) => {
    if (!announcementId) return;
    try {
      await announceService.postEmoji(announcementId, emojiType);
    } catch (err) {
      console.error("Failed to map emoji collection payload:", err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <p className="text-xs font-medium text-gray-500">
          Loading tracking feeds...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-red-100 text-center max-w-md mx-auto my-4">
        <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-xs font-semibold text-gray-900">
          Connection Error
        </h3>
        <p className="text-[11px] text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white max-w-xl mx-auto rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
          <p className="text-[11px] text-gray-500">
            System updates and team interactions
          </p>
        </div>
        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
          {notifications.length} Alerts
        </span>
      </div>

      <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto [scrollbar-width:thin]">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            item={notification}
            onLikeToggle={handleLikeToggle}
            onCommentSubmit={handleCommentSubmit}
            onEmojiSelect={handleEmojiSelect}
          />
        ))}

        {notifications.length === 0 && (
          <div className="p-12 text-center">
            <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-xs italic">
              No workspace actions logged.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* Polymorphic Layout Card Component */
const NotificationCard = ({
  item,
  onLikeToggle,
  onCommentSubmit,
  onEmojiSelect,
}) => {
  const { id, type, created_at, data = {} } = item;
  const [commentInput, setCommentInput] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  // 1. LEAVE APPLICATIONS Layout Card
  if (type === "leave") {
    const isApproved = data.status === "Approved";
    const isRejected = data.status === "Rejected";

    return (
      <div className="p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            isApproved
              ? "bg-green-50 text-green-600"
              : isRejected
                ? "bg-red-50 text-red-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          <Calendar className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-gray-800 leading-snug">
              <span className="font-semibold text-gray-900">
                {data.name || "Employee"}
              </span>{" "}
              {data.designation ? `(${data.designation})` : ""} applied for
              leave.
            </p>
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {formatNotificationDate(created_at)}
            </span>
          </div>

          {data.reason && (
            <p className="text-[11px] text-gray-600 mt-1 bg-gray-50 px-2 py-1.5 rounded border border-gray-100 italic">
              "{data.reason}"
            </p>
          )}

          <div className="flex items-center gap-2.5 mt-2 text-[10px] font-medium text-gray-500">
            {data.no_of_days && (
              <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                Duration: {data.no_of_days} d
              </span>
            )}
            {data.leave_ref_no && (
              <span className="text-gray-400">Ref: #{data.leave_ref_no}</span>
            )}
            <span
              className={`px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ml-auto ${
                isApproved
                  ? "bg-green-100 text-green-700"
                  : isRejected
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {data.status || "Pending"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. SYSTEM ANNOUNCEMENTS Layout Card (Supports Actions & Interactive Red Hearts)
  if (type === "announcement") {
    const hasLiked = data.user_interaction?.has_liked || false;
    const likesCount = data.likes_count || 0;
    const commentsCount = data.comments?.length || 0;

    return (
      <div className="p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 bg-blue-50/10">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
          <Megaphone className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-xs font-bold text-gray-900 truncate">
              {data.title || "System Announcement"}
            </h4>
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {formatNotificationDate(created_at)}
            </span>
          </div>

          {data.description && (
            <p className="text-[11px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
              {data.description}
            </p>
          )}

          {data.attachment && (
            <div className="mt-2">
              <a
                href={data.attachment}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-semibold bg-blue-50/50 hover:bg-blue-50 px-2 py-1 rounded border border-blue-100"
              >
                <Paperclip className="w-3 h-3" /> View{" "}
                {data.attachment_type || "Attachment"}
              </a>
            </div>
          )}

          {/* ❤️ Interactive Like/Comment Action Footer Area */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-gray-100/70">
            <button
              type="button"
              onClick={() => onLikeToggle(id, data.id)} // Passes notification tracking entry ID AND target data element ID
              className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors group ${
                hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform group-active:scale-90 ${
                  hasLiked ? "fill-red-500 stroke-red-500" : "stroke-current"
                }`}
              />
              <span>{likesCount} Likes</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCommentBox(!showCommentBox)}
              className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-blue-600 font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-gray-300 stroke-current" />
              <span>{commentsCount} Comments</span>
            </button>

            {/* Quick Emoji Strip */}
            <div className="flex items-center gap-1 ml-auto bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
              {["👍", "❤️", "🔥", "🙌"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onEmojiSelect(data.id, emoji)}
                  className="hover:scale-125 transition-transform text-xs p-0.5"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Collapsible Comment Bar */}
          {showCommentBox && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a workspace response..."
                className="flex-1 text-[11px] border border-gray-200 rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  onCommentSubmit(id, data.id, commentInput);
                  setCommentInput("");
                }}
                className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. ANNOUNCEMENT ENGAGEMENTS Layout Cards (Social Feed logs)
  if (type === "announcement_like" || type === "announcement_comment") {
    const isLike = type === "announcement_like";
    return (
      <div className="p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3">
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            isLike
              ? "bg-indigo-50 text-indigo-600"
              : "bg-purple-50 text-purple-600"
          }`}
        >
          {isLike ? (
            <ThumbsUp className="w-3.5 h-3.5" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-gray-700 leading-snug">
              <span className="font-semibold text-gray-900 block mb-0.5">
                {data.title ||
                  (isLike
                    ? "Announcement Interaction"
                    : "New Activity Summary")}
              </span>
              <span
                className={isLike ? "text-gray-500" : "text-gray-800 italic"}
              >
                {data.description
                  ? isLike
                    ? data.description
                    : `"${data.description}"`
                  : "Workspace update logged."}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {formatNotificationDate(created_at)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 4. SHIFT SWAPPING UPDATES Layout Card
  if (type === "shift_swap") {
    const isApproved = data.status?.toLowerCase() === "approved";
    return (
      <div className="p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 bg-slate-50/30">
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            isApproved
              ? "bg-emerald-50 text-emerald-600"
              : "bg-zinc-50 text-slate-600"
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="text-xs text-gray-700 leading-snug">
              <span className="font-semibold text-gray-900 block mb-0.5">
                Shift Swap Request Update
              </span>
              <p className="text-gray-600">
                <span className="font-medium text-gray-800">
                  {data.requester_name}
                </span>{" "}
                requested a swap with{" "}
                <span className="font-medium text-gray-800">
                  {data.target_name}
                </span>{" "}
                for date{" "}
                <span className="font-medium text-gray-700">
                  {formatNotificationDate(data.swap_date).split(",")[0]}
                </span>
                .
              </p>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {formatNotificationDate(created_at)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px]">
            <span
              className={`px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[9px] ${
                isApproved
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {data.status || "Pending"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Universal Fallback Catch-All layout
  return (
    <div className="p-3.5 text-[11px] text-gray-400 italic bg-gray-50/50">
      Workspace activity updated (ID: #{id || "N/A"})
    </div>
  );
};

export default Notification;
