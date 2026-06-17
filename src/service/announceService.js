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
  toggleLike: async (id) => {
    try {
      const response = await axiosInstance.post(addLike(id));
      console.log(`Like status updated for announcement #${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error toggling like on announcement #${id}:`, error);
      throw error;
    }
  },

  // NEW: Add a comment to an announcement
  postComment: async (id, commentText) => {
    try {
      // Assuming your backend expects an object with comment details
      const response = await axiosInstance.post(addComment(id), {
        description: commentText // adjust key to match backend layout requirements
      });
      console.log(`Comment posted successfully on announcement #${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error posting comment on announcement #${id}:`, error);
      throw error;
    }
  },

  // NEW: React with an emoji to an announcement
  postEmoji: async (id, emojiType) => {
    try {
      const response = await axiosInstance.post(addEmoji(id), {
        emoji: emojiType // adjust body parameter depending on API signature expectations
      });
      console.log(`Emoji interaction sent on announcement #${id}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error dropping emoji on announcement #${id}:`, error);
      throw error;
    }
  }
};

export default announceService;