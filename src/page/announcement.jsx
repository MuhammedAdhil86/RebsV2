import React, { useState, useEffect } from "react";
import { FiMessageSquare, FiHeart, FiUser, FiSend } from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import HeaderGlobal from "../ui/headerglobal";
import announceService from "../service/announceService";

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

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

  const toggleComments = (id) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleInputChange = (id, value) => {
    setCommentInputs((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // 1. Like Toggle Handler with Optimistic UI adjustment
  const handleLikeToggle = async (id) => {
    setAnnouncements((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const hasLiked = item.user_interaction?.has_liked || false;
        return {
          ...item,
          likes_count: hasLiked
            ? Math.max(0, item.likes_count - 1)
            : item.likes_count + 1,
          user_interaction: {
            ...item.user_interaction,
            has_liked: !hasLiked,
          },
        };
      }),
    );

    try {
      await announceService.toggleLike(id);
      loadAnnouncements(); // Sync with exact database records
    } catch (error) {
      console.error("Failed to toggle like record state:", error);
      loadAnnouncements();
    }
  };

  // 2. Post Comment Handler sending text string to backend
  const handleCommentSubmit = async (id) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;

    try {
      await announceService.postComment(id, text);
      handleInputChange(id, ""); // Reset specific form line text field
      loadAnnouncements(); // Dynamic list reload sequence
    } catch (error) {
      console.error("Failed to process comment transaction line:", error);
    }
  };

  // 3. Post Emoji Interaction Handler (Fixed Object Payload Mismatch)
  const handleEmojiSelect = async (id, emojiChar) => {
    try {
      // ✅ Pass the raw string directly ("👍") to match your service's argument signature
      await announceService.postEmoji(id, emojiChar);
      loadAnnouncements(); // Refresh layout numbers dynamically
    } catch (error) {
      console.error("Failed to append target emoji indicator:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-4">
        <HeaderGlobal userName="Admin" />

        {/* Main Feed Container */}
        <div className="p-4 mx-auto space-y-6 pb-10 max-w-4xl">
          {loading ? (
            <div className="bg-white p-12 flex justify-center rounded-lg shadow-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col ${
                  item.attachment ? "md:flex-row" : ""
                }`}
              >
                {/* Media Section */}
                {item.attachment && (
                  <div className="w-full md:w-1/3 lg:w-1/4 h-48 md:h-auto bg-gray-50 flex-shrink-0 border-r border-gray-100">
                    <img
                      src={item.attachment}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Main Information Panel */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {item.audience_type || "All"}
                        </span>
                        <h2 className="text-[16px] text-gray-900 mt-2 font-semibold">
                          {item.title}
                        </h2>
                      </div>
                      <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap ml-4">
                        {formatDate(item.createdOn)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-[12px] leading-relaxed whitespace-pre-line">
                      {item.description}
                    </p>

                    {/* Display Accumulated Emoji Counts */}
                    {item.emojis_count && item.emojis_count.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {item.emojis_count.map((emo, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                              item.user_interaction?.user_emojis?.includes(
                                emo.emoji,
                              )
                                ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
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

                  {/* Actions / Stats Dock Container */}
                  <div>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        {/* Like Activation Toggle Button */}
                        <button
                          onClick={() => handleLikeToggle(item.id)}
                          className={`flex items-center gap-2 transition-colors ${
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
                            {item.likes_count} Likes
                          </span>
                        </button>

                        {/* Comment Action Area Trigger line */}
                        <button
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

                      {/* Floating Emoji Strip selection array list inline */}
                      <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-lg">
                        {["👍", "❤️", "🔥", "🙌", "😍"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(item.id, emoji)}
                            className="text-xs p-1 hover:scale-125 transition-transform duration-150"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collapsible Discussion Layout Drawer */}
                    {expandedComments[item.id] && (
                      <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50/70 rounded-lg p-4 space-y-4">
                        {/* Comment Post Input Box layout segment */}
                        <div className="flex gap-2 bg-white p-1 rounded-md border border-gray-200 shadow-sm">
                          <input
                            type="text"
                            value={commentInputs[item.id] || ""}
                            onChange={(e) =>
                              handleInputChange(item.id, e.target.value)
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleCommentSubmit(item.id)
                            }
                            placeholder="Write a response..."
                            className="flex-1 text-[12px] px-2.5 py-1.5 focus:outline-none text-gray-700 bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => handleCommentSubmit(item.id)}
                            className="bg-black text-white p-2 rounded hover:bg-gray-800 transition-colors shrink-0"
                          >
                            <FiSend size={12} />
                          </button>
                        </div>

                        {/* Discussion Render Block Map cycle */}
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
                                      src={comment.user_image}
                                      alt={comment.user_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <FiUser size={14} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[12px] text-gray-800 font-semibold">
                                      {comment.user_name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Announcement;
