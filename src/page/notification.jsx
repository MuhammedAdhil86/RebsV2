import React, { useState, useEffect } from "react";
import announceService from "../service/announceService";
import {
  Calendar,
  MessageSquare,
  ThumbsUp,
  Heart,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Loader2,
  Paperclip,
} from "lucide-react";

// Helper to format ISO date strings cleanly
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
        const data = await announceService.fetchNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setError("Could not retrieve notifications. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    getNotifications();
  }, []);

  // Handler to toggle standard local layout interactions instantly
  const handleLocalLikeToggle = (notificationId) => {
    setNotifications((prevList) => prevPrevListMap(prevList, notificationId));
  };

  const prevPrevListMap = (list, targetId) => {
    return list.map((item) => {
      if (item.id !== targetId || item.type !== "announcement") return item;

      const currentHasLiked = item.data?.user_interaction?.has_liked || false;
      const currentCount = item.data?.likes_count || 0;

      return {
        ...item,
        data: {
          ...item.data,
          likes_count: currentHasLiked ? currentCount - 1 : currentCount + 1,
          user_interaction: {
            ...item.data.user_interaction,
            has_liked: !currentHasLiked,
          },
        },
      };
    });
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
      {/* Header Container */}
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

      {/* Scrollable Notification List */}
      <div className="divide-y divide-gray-50 max-h-[450px] overflow-y-auto [scrollbar-width:thin]">
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            item={notification}
            onLikeToggle={handleLocalLikeToggle}
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
const NotificationCard = ({ item, onLikeToggle }) => {
  const { id, type, created_at, data } = item;

  // 1. LEAVE APPLICATIONS
  if (type === "leave") {
    if (!data.name && !data.reason) {
      return (
        <div className="p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 text-xs text-gray-400 italic">
          <Clock className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
          <div className="flex-1">
            Empty leave request fragment shell received.
          </div>
          <span className="text-[10px] shrink-0">
            {formatNotificationDate(created_at)}
          </span>
        </div>
      );
    }

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
                {data.name || "N/A"}
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

  // 2. SYSTEM ANNOUNCEMENTS
  if (type === "announcement") {
    if (!data.title && !data.description) return null;

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
              {data.title}
            </h4>
            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
              {formatNotificationDate(created_at)}
            </span>
          </div>

          <p className="text-[11px] text-gray-600 mt-1 whitespace-pre-line leading-relaxed">
            {data.description}
          </p>

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
              onClick={() => onLikeToggle(id)}
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

            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
              <MessageSquare className="w-4 h-4 text-gray-300" />
              <span>{commentsCount} Comments</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ANNOUNCEMENT ENGAGEMENTS (Likes & Comments Feed Items)
  if (type === "announcement_like" || type === "announcement_comment") {
    const isLike = type === "announcement_like";
    if (!data.title && !data.description) return null;

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
                {data.title}
              </span>
              <span
                className={isLike ? "text-gray-500" : "text-gray-800 italic"}
              >
                {isLike ? data.description : `"${data.description}"`}
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

  return null;
};

export default Notification;
