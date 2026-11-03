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
  FiLayout,
  FiBell,
} from "react-icons/fi";
import toast from "react-hot-toast";

import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import announceService from "../service/announceService";
import DeleteConfirmationModal from "../ui/deletemodal";
// Celebrations view (lives in ../ui).
import CelibrationLayout from "../components/celebration";

const EMOJIS = ["👍", "❤️", "🔥", "🙌", "😍"];
const IMAGE_TYPES = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

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

const EMPTY_EDIT_FORM = {
  title: "",
  description: "",
  priority: "1",
  attachment: null,
};

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Which list is visible: "announcements" or "celebrations".
  const [view, setView] = useState("announcements");

  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [likingIds, setLikingIds] = useState(new Set());

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
      await announceService.postComment(id, text);

      handleInputChange(id, "");
      await loadAnnouncements();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  // Add emoji reaction.
  const handleEmojiSelect = async (id, emojiChar) => {
    try {
      await announceService.postEmoji(id, emojiChar);
      await loadAnnouncements();
    } catch (error) {
      console.error("Failed to add emoji:", error);
    }
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
      await announceService.updateAnnouncement(editingAnnouncement.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        priority: editForm.priority,
        attachment: editForm.attachment, // null => file fields are not sent
      });

      toast.success("Announcement updated successfully");

      setIsEditModalOpen(false);
      setEditingAnnouncement(null);
      setEditForm(EMPTY_EDIT_FORM);

      await loadAnnouncements(); // refresh with the latest server values
    } catch (error) {
      console.error("Failed to update announcement:", error);

      toast.error(
        error.response?.data?.message || "Failed to update announcement",
      );
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
      await announceService.deleteAnnouncement(announcementId);

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

      toast.success("Announcement deleted successfully");
    } catch (error) {
      console.error("Failed to delete announcement:", error);

      toast.error(
        error.response?.data?.message || "Failed to delete announcement",
      );
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
          {/* Toolbar: one button switches between Layout and Announcement */}
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[14px] font-semibold text-gray-900">
              {view === "announcements" ? "Announcements" : "Celebrations"}
            </h2>

            <button
              type="button"
              onClick={() =>
                setView((v) =>
                  v === "announcements" ? "celebrations" : "announcements",
                )
              }
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
              title={
                view === "announcements"
                  ? "Switch to layout"
                  : "Back to announcements"
              }
            >
              {view === "announcements" ? (
                <>
                  <FiLayout size={14} />
                  <span>Celebration</span>
                </>
              ) : (
                <>
                  <FiBell size={14} />
                  <span>Announcement</span>
                </>
              )}
            </button>
          </div>

          {/* ================= CELEBRATIONS VIEW ================= */}
          {view === "celebrations" && <CelibrationLayout />}

          {/* ================= ANNOUNCEMENTS VIEW ================= */}
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

                        {/* Emoji reaction counts */}
                        {item.emojis_count && item.emojis_count.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-4">
                            {item.emojis_count.map((emo, index) => (
                              <span
                                key={`${emo.emoji}-${index}`}
                                className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                                  item.user_interaction?.user_emojis?.includes(
                                    emo.emoji,
                                  )
                                    ? "bg-gray-100 border-gray-400 text-black font-semibold"
                                    : "bg-gray-50 border-gray-100 text-gray-600"
                                }`}
                              >
                                <span>{emo.emoji}</span>
                                <span className="text-[10px] opacity-70">
                                  {emo.count}
                                </span>
                              </span>
                            ))}
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

                          {/* Emoji picker */}
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-lg">
                            {EMOJIS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() =>
                                  handleEmojiSelect(item.id, emoji)
                                }
                                className="text-xs p-1 hover:scale-125 transition-transform duration-150"
                                aria-label={`React with ${emoji}`}
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
