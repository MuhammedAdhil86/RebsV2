import axiosInstance from "./axiosinstance";
// Added getAnnouncement to the imports below
import { postAnnouncement, getDept, getStaff, getAllNotification,getAnnouncement,addLike,addComment,addEmoji, } from "../api/api"; 

const announceService = {
  addAnnouncement: async (announcementData) => {
    try {
      console.log(
        "Data being sent to backend for announcement:",
        announcementData
      );

      const response = await axiosInstance.post(
        postAnnouncement,
        announcementData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data.data;
    } catch (error) {
      console.error("Error adding announcement:", error);
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

  // New function added below
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
toggleLike: async (announcementId) => {
    try {
      const response = await axiosInstance.post(addLike(announcementId));
      return response.data;
    } catch (error) {
      console.error(`Error adding like to announcement #${announcementId}:`, error);
      throw error;
    }
  },

  // Calls: POST /announcement/comment/add/{id}
postComment: async (announcementId, commentText) => {
  try {
    const response = await axiosInstance.post(addComment(announcementId), {
      comment: commentText // ✅ Fixed key name and resolved double-nesting payload issue
    });
    return response.data;
  } catch (error) {
    console.error(`Error posting comment on announcement #${announcementId}:`, error);
    throw error;
  }
},
  // Calls: POST /announcement/emojis/add/{id}
  postEmoji: async (announcementId, emojiType) => {
    try {
      const response = await axiosInstance.post(addEmoji(announcementId), {
        emoji: emojiType
      });
      return response.data;
    } catch (error) {
      console.error(`Error posting emoji on announcement #${announcementId}:`, error);
      throw error;
    }
  }
};

export default announceService;