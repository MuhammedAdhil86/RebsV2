import axiosInstance from "./axiosinstance";
// Added getAnnouncement to the imports below
import {
  postAnnouncement,
  getDept,
  getStaff,
  getAllNotification,
  getAnnouncement,
  addLike,
  addComment,
  addEmoji,
  deleteAnnouncement,
  toggleLikeApi,
  updateAnnouncement,
  postCelebration,
  getCelebrations,
  deleteCelebration,
  getNotificationCount, // <- NEW
  markNotificationRead, // <- NEW
  markAllNotificationsRead, // <- NEW
} from "../api/api";

/*
  Add these to ../api/api.js:

  export const getNotificationCount = "/employee/notification/count";
  export const markNotificationRead = (id) => `/employee/notification/${id}/read`;
  export const markAllNotificationsRead = "/employee/notification/read-all";
*/

const announceService = {
  addAnnouncement: async (announcementData) => {
    try {
      console.log(
        "Data being sent to backend for announcement:",
        announcementData,
      );

      const response = await axiosInstance.post(
        postAnnouncement,
        announcementData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data.data;
    } catch (error) {
      console.error("Error adding announcement:", error);
      throw error;
    }
  },

  // Calls: PUT /admin/announcement/update/{id}
  // Accepts either a ready-made FormData, or a plain object:
  // { title, description, priority, attachment (File, optional), attachment_type (optional) }
  updateAnnouncement: async (id, announcementData) => {
    try {
      let body = announcementData;

      if (!(announcementData instanceof FormData)) {
        body = new FormData();
        body.append("title", announcementData.title ?? "");
        body.append("description", announcementData.description ?? "");
        body.append("priority", String(announcementData.priority ?? ""));

        // Only send file fields when a new file was picked
        if (announcementData.attachment) {
          body.append("attachment", announcementData.attachment);

          // Send the real file extension in capitals (PDF, PNG, JPG...),
          // matching the update API body. The page lowercases it when reading.
          const extension = (
            announcementData.attachment.name?.split(".").pop() || ""
          ).toUpperCase();

          body.append(
            "attachment_type",
            announcementData.attachment_type || extension,
          );
        }
      }

      const response = await axiosInstance.put(updateAnnouncement(id), body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Announcement updated:", response.data);
      return response.data.data ?? response.data;
    } catch (error) {
      console.error(
        `Error updating announcement #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Calls: POST /employee/celebration/upsert  (multipart/form-data)
  // Accepts either a ready-made FormData, or a plain object:
  // { celebration_type: "BIRTHDAY" | "WORK_ANNIVERSARY",
  //   celebration_text: "<html>...</html>",
  //   document (File, optional) }
  // Allowed placeholders in celebration_text:
  // {{.CompanyName}}, {{.EmployeeName}}, {{.EmployeeImageURL}}
  upsertCelebration: async (celebrationData) => {
    try {
      let body = celebrationData;

      if (!(celebrationData instanceof FormData)) {
        body = new FormData();
        body.append("celebration_type", celebrationData.celebration_type ?? "");
        body.append("celebration_text", celebrationData.celebration_text ?? "");

        // Only send the file when one was picked
        if (celebrationData.document) {
          body.append("document", celebrationData.document);
        }
      }

      const response = await axiosInstance.post(postCelebration, body, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Celebration saved:", response.data);
      return response.data.data ?? response.data;
    } catch (error) {
      console.error(
        "Error saving celebration:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Calls: GET /employee/celebration/list?celebration_type=BIRTHDAY
  // celebration_type: "BIRTHDAY" | "WORK_ANNIVERSARY" (omit to fetch all)
  // Returns the array from response.data.data
  fetchCelebrations: async (celebrationType) => {
    try {
      const response = await axiosInstance.get(getCelebrations, {
        params: celebrationType ? { celebration_type: celebrationType } : {},
      });

      console.log("Celebrations fetched:", response.data);

      const list = response.data?.data ?? response.data;
      return Array.isArray(list) ? list : [];
    } catch (error) {
      console.error(
        "Error fetching celebrations:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // Calls: DELETE /employee/celebration/delete?celebration_type=BIRTHDAY
  // celebrationType: "BIRTHDAY" | "WORK_ANNIVERSARY"
  deleteCelebration: async (celebrationType) => {
    try {
      const response = await axiosInstance.delete(
        deleteCelebration(celebrationType),
      );

      console.log("Celebration deleted:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        `Error deleting celebration ${celebrationType}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  fetchDepartments: async () => {
    try {
      const response = await axiosInstance.post(getDept);

      console.log("Departments fetched:", response.data);

      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      throw error;
    }
  },

  fetchStaff: async () => {
    try {
      const response = await axiosInstance.get(getStaff);
      console.log("Staff fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching staff:", error);
      throw error;
    }
  },

  fetchAnnouncements: async () => {
    try {
      const response = await axiosInstance.get(getAnnouncement);
      console.log("Announcements fetched:", response.data);

      // Returning response.data.data to match your addAnnouncement pattern
      // If your API returns the array directly, change this to response.data
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching announcements:", error);
      throw error;
    }
  },

  fetchNotifications: async () => {
    try {
      const response = await axiosInstance.get(getAllNotification);
      console.log("Notifications fetched:", response.data);

      // Returning response.data.data or falling back to response.data
      return response.data.data || response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  // NEW
  // Calls: GET /employee/notification/count
  // Returns: { total, unread }
  fetchNotificationCount: async () => {
    try {
      const response = await axiosInstance.get(getNotificationCount);
      console.log("Notification count fetched:", response.data);

      const data = response.data?.data;
      return {
        total: Number(data?.total ?? 0),
        unread: Number(data?.unread ?? 0),
      };
    } catch (error) {
      console.error(
        "Error fetching notification count:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // NEW
  // Calls: PATCH /employee/notification/{id}/read   body: { is_read: boolean }
  // isRead: true = mark read, false = mark unread
  markNotificationRead: async (id, isRead = true) => {
    try {
      const response = await axiosInstance.patch(
        markNotificationRead(id),
        { is_read: Boolean(isRead) },
        { silent: true }, // no toast per click, same as toggleLike
      );
      return response.data;
    } catch (error) {
      console.error(
        `Error updating read status of notification #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  // NEW
  // Calls: PATCH /employee/notification/read-all   (no body)
  // Returns: { updated } - number of records changed
  markAllNotificationsRead: async () => {
    try {
      const response = await axiosInstance.patch(markAllNotificationsRead);
      console.log("All notifications marked read:", response.data);

      return { updated: Number(response.data?.data?.updated ?? 0) };
    } catch (error) {
      console.error(
        "Error marking all notifications as read:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  toggleLike: async (announcementId) => {
    try {
      const response = await axiosInstance.post(
        toggleLikeApi(announcementId),
        null,
        { silent: true }, // no toast on success or failure for likes
      );
      return {
        liked: response.data?.data?.liked ?? false,
        message: response.data?.message,
      };
    } catch (error) {
      console.error(
        `Error toggling like on announcement #${announcementId}:`,
        error,
      );
      throw error;
    }
  },

  // Calls: POST /announcement/comment/add/{id}
  postComment: async (announcementId, commentText) => {
    try {
      const response = await axiosInstance.post(addComment(announcementId), {
        comment: commentText,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error posting comment on announcement #${announcementId}:`,
        error,
      );
      throw error;
    }
  },

  // Calls: POST /announcement/emojis/add/{id}
  postEmoji: async (announcementId, emojiType) => {
    try {
      const response = await axiosInstance.post(addEmoji(announcementId), {
        emoji: emojiType,
      });
      return response.data;
    } catch (error) {
      console.error(
        `Error posting emoji on announcement #${announcementId}:`,
        error,
      );
      throw error;
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      const response = await axiosInstance.delete(deleteAnnouncement(id));

      console.log("Announcement deleted:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        `Error deleting announcement #${id}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};

export default announceService;
