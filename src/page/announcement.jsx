import React, { useState, useEffect } from "react";
import {
  FiBell,
  FiMessageSquare,
  FiHeart,
  FiPaperclip,
  FiUser,
} from "react-icons/fi";
import DashboardLayout from "../ui/pagelayout";
import announceService from "../service/announceService";

const Announcement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await announceService.fetchAnnouncements();
        setAnnouncements(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Failed to load announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    loadAnnouncements();
  }, []);

  const toggleComments = (id) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
    <DashboardLayout userName="Admin" onLogout={() => {}}>
      {/* Header */}
      <div className="bg-white flex justify-between items-center p-4 mb-4 shadow-sm rounded-lg">
        <h1 className="text-lg font-medium text-gray-800">Announcements</h1>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-300">
            <FiBell className="text-gray-600 text-lg" />
          </div>
          <button className="text-sm text-gray-700 border border-gray-300 px-4 py-1 rounded-full">
            Settings
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 mx-auto space-y-6 pb-10">
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
              {/* ✅ LEFT SIDE IMAGE - Only renders if attachment exists */}
              {item.attachment && (
                <div className="w-full md:w-1/3 lg:w-1/4 h-48 md:h-auto bg-gray-50 flex-shrink-0 border-r border-gray-100">
                  <img
                    src={item.attachment}
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* ✅ DATA SECTION - Automatically takes 100% width if no image exists */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {item.audience_type}
                    </span>
                    <h2 className="text-[16px]  text-gray-900 mt-2">
                      {item.title}
                    </h2>
                  </div>
                  <span className="text-[12px] text-gray-400 font-medium">
                    {formatDate(item.createdOn)}
                  </span>
                </div>

                <p className="text-gray-600 text-[12px] leading-relaxed whitespace-pre-line flex-1">
                  {item.description}
                </p>

                {/* Interaction Bar */}
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-6">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors">
                    <FiHeart
                      className={
                        item.user_interaction?.has_liked
                          ? "text-red-500 fill-red-500"
                          : ""
                      }
                    />
                    <span className="text-xs ">{item.likes_count}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(item.id)}
                    className={`flex items-center gap-2 transition-colors ${
                      expandedComments[item.id]
                        ? "text-black"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    <FiMessageSquare />
                    <span className="text-xs ">
                      {item.comments?.length || 0} Comments
                    </span>
                  </button>
                </div>

                {/* Expanded Comments Section */}
                {expandedComments[item.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-xs  text-gray-400 uppercase mb-4 tracking-tight">
                      Discussion
                    </h4>
                    <div className="space-y-4">
                      {item.comments && item.comments.length > 0 ? (
                        item.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex gap-3 items-start"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-white">
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
                                <span className="text-[12px]  text-gray-800">
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
                        <p className="text-xs text-gray-400 italic text-center">
                          No comments yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
};

export default Announcement;
