import axiosInstance from "./axiosinstance";
// Added getAnnouncement to the imports below
import { postAnnouncement, getDept, getStaff, getAnnouncement } from "../api/api"; 

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
};

export default announceService;