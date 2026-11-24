import React, { useState, useEffect } from "react";
import {
  FiMessageSquare,
  FiHeart,
  FiUser,
  FiSend,
  FiFileText,
  FiTrash2,
  FiEdit2,
  FiX,
  FiPlus,
} from "react-icons/fi";
import { toast } from "react-toastify"; // uses the global <ToastContainer /> from App.jsx
import { showApiSuccess, showApiError } from "../utils/apiToast"; // adjust path to where your toast helper file lives

import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import announceService from "../service/announceService";
import DeleteConfirmationModal from "../ui/deletemodal";
// Celebrations view (lives in ../ui).
import CelibrationLayout from "../components/celebration";
// Create announcement modal.
import AnnouncementModal from "../components/dashboard/announcement"; // <-- adjust path to where AnnouncementModal.jsx lives

const EMOJIS = ["👍", "❤️", "🔥", "🙌", "😍"];
const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

// Tabs: Announcement is first, Celebration is second.
const TABS = [
  { key: "announcements", label: "Announcement" },
  { key: "celebrations", label: "Celebration" },
];

// Priority options (matches the create modal: 1 = High, 2 = Medium, 3 = Low).
const PRIORITY_OPTIONS = [
  { value: "1", label: "High" },
  { value: "2", label: "Medium" },
  { value: "3", label: "Low" },
];

// Get attachment type from API or filename.
const getAttachmentType = (item) => {
  const type = (item.attachment_type || "").toLowerCase();

  if (type) return type;

  return (item.attachment?.split(".").pop() || "").toLowerCase();
};

// Safely encode attachment URLs.
const safeUrl = (url) => {
  if (!url) return "";

  try {
    return encodeURI(decodeURI(url));
  } catch {
    return url;
  }
};

// Get attachment filename.
const getFileName = (url) => {
  try {
    return decodeURIComponent(url.split("/").pop());
  } catch {
    return url.split("/").pop();
  }
};

/* ================= EMOJI HELPERS ================= */

// user_emojis can be ["👍"] or [{ id, emoji }]. Support both shapes.
const getEmojiChar = (entry) =>
  typeof entry === "string" ? entry : entry?.emoji;

// Find the current user's reaction entry for a given emoji.
const findMyReaction = (item, emojiChar) =>
  (item.user_interaction?.user_emojis || []).find(
    (entry) => getEmojiChar(entry) === emojiChar,
  );

// Has the current user already reacted with this emoji?
const hasReacted = (item, emojiChar) =>
  Boolean(findMyReaction(item, emojiChar));

// Id sent to DELETE /announcement/emojis/remove/{id}.
// Uses the reaction record id when the API returns it, otherwise the announcement id.
const getRemoveId = (item, reaction) => {
  if (reaction && typeof reaction === "object") {
    const reactionId = reaction.id ?? reaction.emoji_id ?? reaction.reaction_id;
    if (reactionId !== undefined && reactionId !== null) return reactionId;
  }

  return item.id;
};

// Instantly add or remove one emoji in the local announcement data
// (counts + the current user's own reactions), before the API answers.
const applyEmojiLocally = (item, emojiChar, shouldAdd) => {
  const counts = Array.isArray(item.emojis_count) ? item.emojis_count : [];

  const nextCounts = shouldAdd
    ? counts.some((e) => e.emoji === emojiChar)
      ? counts.map((e) =>
          e.emoji === emojiChar ? { ...e, count: (e.count || 0) + 1 } : e,
        )
      : [...counts, { emoji: emojiChar, count: 1 }]
    : counts
        .map((e) =>
          e.emoji === emojiChar
            ? { ...e, count: Math.max(0, (e.count || 0) - 1) }
            : e,
        )
        .filter((e) => (e.count || 0) > 0);

  const mine = item.user_interaction?.user_emojis || [];
  const usesObjects = mine.some((e) => typeof e === "object");

  const nextMine = shouldAdd
    ? [...mine, usesObjects ? { emoji: emojiChar } : emojiChar]
    : mine.filter((e) => getEmojiChar(e) !== emojiChar);

  return {
    ...item,
    emojis_count: nextCounts,
    user_interaction: {
      ...item.user_interaction,
      user_emojis: nextMine,
    },
  };
};

const EMPTY_EDIT_FORM = {
  title: "",
  description: "",
  priority: "1",
  attachment: null,
};

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which tab is active: "announcements" (first) or "celebrations" (second).
  const [view, setView] = useState("announcements");

  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [likingIds, setLikingIds] = useState(new Set());

  // Announcements with an emoji add/remove request in progress.
  const [emojiBusyIds, setEmojiBusyIds] = useState(new Set());

  // Create modal state (announcement).
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Celebration create button: each click bumps this number, which opens the form.
  const [celebrationCreateTrigger, setCelebrationCreateTrigger] = useState(0);

  // Delete modal states.
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal states.
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch announcements.
  const loadAnnouncements = async () => {
    try {
      const response = await announceService.fetchAnnouncements();
      const rawData = response?.data ? response.data : response;

      setAnnouncements(Array.isArray(rawData) ? rawData : []);
    } catch (error) {
      console.error("Failed to load announcements:", error);
      showApiError(error, "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // Toggle comments.
  const toggleComments = (id) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Update comment input.
  const handleInputChange = (id, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Toggle like.
  const handleLikeToggle = async (id) => {
    if (likingIds.has(id)) return;

    setLikingIds((prev) => new Set(prev).add(id));

    const previous = announcements;

    // Optimistic update.
    setAnnouncements((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const hasLiked = item.user_interaction?.has_liked || false;

        return {
          ...item,
          likes_count: hasLiked
            ? Math.max(0, (item.likes_count || 0) - 1)
            : (item.likes_count || 0) + 1,
          user_interaction: {
            ...item.user_interaction,
            has_liked: !hasLiked,
          },
        };
      }),
    );

    try {
      const { liked } = await announceService.toggleLike(id);

      // Reconcile state with API response.
      setAnnouncements((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;

          const currentlyLiked = item.user_interaction?.has_liked || false;

          if (currentlyLiked === liked) return item;

          return {
            ...item,
            likes_count: liked
              ? (item.likes_count || 0) + 1
              : Math.max(0, (item.likes_count || 0) - 1),
            user_interaction: {
              ...item.user_interaction,
              has_liked: liked,
            },
          };
        }),
      );
    } catch (error) {
      console.error("Failed to toggle like:", error);
      setAnnouncements(previous);
      showApiError(error, "Failed to update like");
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Submit comment.
  const handleCommentSubmit = async (id) => {
    const text = commentInputs[id]?.trim();

    if (!text) {
      toast.error("Please write a comment first");
      return;
    }

    try {
      const result = await announceService.postComment(id, text);

      showApiSuccess(result, "Comment posted");

      handleInputChange(id, "");
      await loadAnnouncements();
    } catch (error) {
      console.error("Failed to post comment:", error);
      showApiError(error, "Failed to post comment");
    }
  };

  /* ================= EMOJI ================= */

  // Add the emoji, or remove it if the user already reacted with it.
  // The screen updates instantly; if the API fails, it rolls back.
  const handleEmojiToggle = async (item, emojiChar) => {
    if (emojiBusyIds.has(item.id)) return;

    const myReaction = findMyReaction(item, emojiChar);
    const isRemoving = Boolean(myReaction);
    const previous = announcements;

    setEmojiBusyIds((prev) => new Set(prev).add(item.id));

    // Instant update.
    setAnnouncements((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? applyEmojiLocally(entry, emojiChar, !isRemoving)
          : entry,
      ),
    );

    try {
      if (isRemoving) {
        // DELETE /announcement/emojis/remove/{id}
        const removeResult = await announceService.deleteEmoji(
          getRemoveId(item, myReaction),
        );

        showApiSuccess(removeResult, "Reaction removed");
      } else {
        await announceService.postEmoji(item.id, emojiChar);
      }

      // Quietly sync with the server (also picks up reaction ids).
      await loadAnnouncements();
    } catch (error) {
      console.error("Failed to update emoji:", error);
      setAnnouncements(previous);
      showApiError(
        error,
        isRemoving ? "Failed to remove reaction" : "Failed to add reaction",
      );
    } finally {
      setEmojiBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  /* ================= CREATE ================= */

  // Open / close the create announcement modal.
  const handleOpenCreateModal = () => setIsCreateModalOpen(true);
  const handleCloseCreateModal = () => setIsCreateModalOpen(false);

  // After a successful broadcast, reload the list so the new one shows up.
  const handleCreateSuccess = () => {
    loadAnnouncements();
  };

  /* ================= EDIT ================= */

  // Open edit modal pre-filled with the announcement's current values.
  const handleEditClick = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditForm({
      title: announcement.title || "",
      description: announcement.description || "",
      priority: String(announcement.priority ?? "1"),
      attachment: null, // only set when the admin picks a new file
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (isUpdating) return;

    setIsEditModalOpen(false);
    setEditingAnnouncement(null);
    setEditForm(EMPTY_EDIT_FORM);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setEditForm((prev) => ({ ...prev, attachment: file }));
  };

  const handleConfirmUpdate = async (e) => {
    e.preventDefault();

    if (!editingAnnouncement || isUpdating) return;

    if (!editForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!editForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await announceService.updateAnnouncement(
        editingAnnouncement.id,
        {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          priority: editForm.priority,
          attachment: editForm.attachment, // null => file fields are not sent
        },
      );

      showApiSuccess(result, "Announcement updated successfully");

      setIsEditModalOpen(false);
      setEditingAnnouncement(null);
      setEditForm(EMPTY_EDIT_FORM);

      await loadAnnouncements(); // refresh with the latest server values
    } catch (error) {
      console.error("Failed to update announcement:", error);
      showApiError(error, "Failed to update announcement");
    } finally {
      setIsUpdating(false);
    }
  };

  /* ================= DELETE ================= */

  // Open delete confirmation modal.
  const handleDeleteClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  // Close delete confirmation modal.
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;

    setIsDeleteModalOpen(false);
    setSelectedAnnouncement(null);
  };

  // Confirm and delete announcement.
  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement || isDeleting) return;

    const announcementId = selectedAnnouncement.id;

    setIsDeleting(true);

    try {
      const result = await announceService.deleteAnnouncement(announcementId);

      // Remove the deleted announcement immediately.
      setAnnouncements((prev) =>
        prev.filter((item) => item.id !== announcementId),
      );

      // Clean up related local state.
      setExpandedComments((prev) => {
        const next = { ...prev };
        delete next[announcementId];
        return next;
      });

      setCommentInputs((prev) => {
        const next = { ...prev };
        delete next[announcementId];
        return next;
      });

      setIsDeleteModalOpen(false);
      setSelectedAnnouncement(null);

      showApiSuccess(result, "Announcement deleted successfully");
    } catch (error) {
      console.error("Failed to delete announcement:", error);
      showApiError(error, "Failed to delete announcement");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format announcement and comment dates.
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render image attachments or downloadable/openable file cards.
  const renderAttachment = (item) => {
    const type = getAttachmentType(item);
    const url = safeUrl(item.attachment);

    if (IMAGE_TYPES.includes(type)) {
      return (
        <img
          src={url}
          alt={item.title || "Announcement attachment"}
          className="w-full h-full object-cover"
        />
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-gray-500 hover:text-black transition-colors"
      >
        <FiFileText size={32} />

        <span className="text-[10px] font-bold uppercase">
          {type || "file"}
        </span>

        <span className="text-[11px] text-center line-clamp-2 break-all">
          {getFileName(url)}
        </span>

        <span className="text-[10px] text-black font-medium underline">
          Open file
        </span>
      </a>
    );
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        <div className="p-4 mx-auto space-y-6 pb-4">
          {/* Tabs: Announcement (first) | Celebration (second) + black Create button */}
          <div className="flex items-center justify-between gap-6 border-b border-gray-200">
            <div className="flex items-center gap-6">
              {TABS.map((tab) => {
                const isActive = view === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setView(tab.key)}
                    className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                      isActive
                        ? "border-black text-black font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Same black button on both tabs: creates an announcement or a celebration */}
            <button
              type="button"
              onClick={
                view === "announcements"
                  ? handleOpenCreateModal
                  : () => setCelebrationCreateTrigger((n) => n + 1)
              }
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 px-3.5 py-2 rounded-lg transition-colors shadow-sm"
            >
              <FiPlus size={14} />
              <span>
                {view === "announcements"
                  ? "Create Announcement"
                  : "Create Celebration"}
              </span>
            </button>
          </div>

          {/* ================= CELEBRATIONS TAB ================= */}
          {view === "celebrations" && (
            <CelibrationLayout createTrigger={celebrationCreateTrigger} />
          )}

          {/* ================= ANNOUNCEMENTS TAB ================= */}
          {view === "announcements" && (
            <>
              {loading ? (
                <div className="bg-white p-12 flex justify-center rounded-lg shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
                </div>
              ) : announcements.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-400">No announcements yet.</p>
                </div>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col ${
                      item.attachment ? "md:flex-row" : ""
                    }`}
                  >
                    {/* Attachment */}
                    {item.attachment && (
                      <div className="w-full md:w-1/3 lg:w-1/4 h-48 md:h-auto bg-gray-50 flex-shrink-0 border-r border-gray-100">
                        {renderAttachment(item)}
                      </div>
                    )}

                    {/* Announcement content */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Title, audience and actions */}
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800 bg-gray-100 px-2 py-1 rounded">
                              {item.audience_type || "All"}
                            </span>

                            <h2 className="text-[16px] text-gray-900 mt-2 font-semibold break-words">
                              {item.title}
                            </h2>
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">
                              {formatDate(item.createdOn)}
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={() => handleEditClick(item)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-2.5 py-2 rounded-lg transition-colors"
                                title="Edit announcement"
                                aria-label={`Edit ${item.title || "announcement"}`}
                              >
                                <FiEdit2 size={15} />
                                <span>Edit</span>
                              </button>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(item)}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-black hover:bg-gray-100 px-2.5 py-2 rounded-lg transition-colors"
                                title="Delete announcement"
                                aria-label={`Delete ${item.title || "announcement"}`}
                              >
                                <FiTrash2 size={15} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-gray-600 text-[12px] leading-relaxed whitespace-pre-line">
                            {item.description}
                          </p>
                        )}

                        {/* Emoji reaction counts (click your own reaction to remove it) */}
                        {item.emojis_count && item.emojis_count.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {item.emojis_count.map((emo, index) => {
                              const reactedByMe = hasReacted(item, emo.emoji);

                              return (
                                <span
                                  key={`${emo.emoji}-${index}`}
                                  onClick={() =>
                                    reactedByMe &&
                                    handleEmojiToggle(item, emo.emoji)
                                  }
                                  title={
                                    reactedByMe
                                      ? "Click to remove your reaction"
                                      : undefined
                                  }
                                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                                    reactedByMe
                                      ? "bg-gray-100 border-gray-400 text-black font-semibold cursor-pointer"
                                      : "bg-gray-50 border-gray-100 text-gray-600"
                                  }`}
                                >
                                  <span>{emo.emoji}</span>
                                  <span className="text-[10px] opacity-70">
                                    {emo.count}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div>
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-6">
                            {/* Like */}
                            <button
                              type="button"
                              onClick={() => handleLikeToggle(item.id)}
                              disabled={likingIds.has(item.id)}
                              className={`flex items-center gap-2 transition-colors disabled:opacity-50 ${
                                item.user_interaction?.has_liked
                                  ? "text-red-500 font-medium"
                                  : "text-gray-500 hover:text-red-500"
                              }`}
                            >
                              <FiHeart
                                className={
                                  item.user_interaction?.has_liked
                                    ? "text-red-500 fill-red-500"
                                    : ""
                                }
                              />

                              <span className="text-xs">
                                {item.likes_count || 0} Likes
                              </span>
                            </button>

                            {/* Comments toggle */}
                            <button
                              type="button"
                              onClick={() => toggleComments(item.id)}
                              className={`flex items-center gap-2 transition-colors ${
                                expandedComments[item.id]
                                  ? "text-black font-medium"
                                  : "text-gray-500 hover:text-black"
                              }`}
                            >
                              <FiMessageSquare />

                              <span className="text-xs">
                                {item.comments?.length || 0} Comments
                              </span>
                            </button>
                          </div>

                          {/* Emoji picker (click again on one you used to remove it) */}
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-lg">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleEmojiToggle(item, emoji)}
                                className="text-xs p-1 hover:scale-125 transition-transform duration-150"
                                aria-label={
                                  hasReacted(item, emoji)
                                    ? `Remove ${emoji} reaction`
                                    : `React with ${emoji}`
                                }
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comments drawer */}
                        {expandedComments[item.id] && (
                          <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/70 rounded-lg p-4 space-y-4">
                            {/* Add comment */}
                            <div className="flex gap-2 bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                              <input
                                type="text"
                                value={commentInputs[item.id] || ""}
                                onChange={(e) =>
                                  handleInputChange(item.id, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleCommentSubmit(item.id);
                                  }
                                }}
                                placeholder="Write a response..."
                                className="flex-1 text-[12px] px-2.5 py-1.5 focus:outline-none text-gray-700 bg-transparent"
                              />

                              <button
                                type="button"
                                onClick={() => handleCommentSubmit(item.id)}
                                className="bg-black text-white p-2 rounded hover:bg-gray-800 transition-colors shrink-0"
                                aria-label="Send comment"
                              >
                                <FiSend size={12} />
                              </button>
                            </div>

                            {/* Discussion feed */}
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                Discussion Feed
                              </h4>

                              {item.comments && item.comments.length > 0 ? (
                                item.comments.map((comment) => (
                                  <div
                                    key={comment.id}
                                    className="flex gap-3 items-start"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white shadow-sm">
                                      {comment.user_image ? (
                                        <img
                                          src={safeUrl(comment.user_image)}
                                          alt={comment.user_name || "User"}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                          <FiUser size={14} />
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                      <div className="flex justify-between items-center gap-2 mb-1">
                                        <span className="text-[12px] text-gray-800 font-semibold">
                                          {comment.user_name}
                                        </span>

                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>

                                      <p className="text-[12px] text-gray-600">
                                        {comment.comment}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic text-center py-2">
                                  No comment entries posted.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      {/* Create announcement modal */}
      <AnnouncementModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit announcement modal */}
      {isEditModalOpen && editingAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleCloseEditModal}
        >
          <form
            onSubmit={handleConfirmUpdate}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">
                Edit Announcement
              </h3>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={isUpdating}
                className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    handleEditFieldChange("title", e.target.value)
                  }
                  className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) =>
                    handleEditFieldChange("description", e.target.value)
                  }
                  className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none"
                  placeholder="Announcement description"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) =>
                    handleEditFieldChange("priority", e.target.value)
                  }
                  className="w-full text-[13px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black bg-white"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-700 mb-1">
                  Attachment (PDF or image)
                </label>

                {editingAnnouncement.attachment && !editForm.attachment && (
                  <p className="text-[11px] text-gray-500 mb-2 break-all">
                    Current file:{" "}
                    <a
                      href={safeUrl(editingAnnouncement.attachment)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black underline hover:text-gray-600"
                    >
                      {getFileName(editingAnnouncement.attachment)}
                    </a>
                  </p>
                )}

                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleEditFileChange}
                  className="block w-full text-[12px] text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[12px] file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />

                <p className="text-[11px] text-gray-400 mt-1">
                  Leave empty to keep the current attachment.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={isUpdating}
                className="text-xs font-medium text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="text-xs font-medium text-white bg-black hover:bg-gray-800 px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={selectedAnnouncement?.title || "this announcement"}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
};

export default Announcement;
