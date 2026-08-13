import axiosInstance from "./axiosinstance";
import { 
  getHappinessRating, 
  getDashboardList, 
  getAdminAttendanceHappinessGraph,
  submitHappinessRating as submitHappinessRatingEndpoint 
} from "../api/api"; 

const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get(getDashboardList);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error fetching dashboard data", error);
    throw error;
  }
};

const fetchHappinessRating = async () => {
  try {
    const response = await axiosInstance.get(getHappinessRating);
    return response.data;
  } catch (error) {
    console.error("Error fetching happiness rating", error);
    throw error;
  }
};

const submitHappinessRating = async (payload) => {
  try {
    const response = await axiosInstance.put(submitHappinessRatingEndpoint, payload);
    return response.data;
  } catch (error) {
    console.error("Error submitting happiness rating", error);
    throw error;
  }
};

const getHappinessGraphData = async (payload) => {
  try {
    const response = await axiosInstance.post(getAdminAttendanceHappinessGraph, payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching happiness graph data", error);
    throw error;
  }
};

const dashboardService = {
  getDashboardData,
  fetchHappinessRating,
  submitHappinessRating,
  getHappinessGraphData,
};

export default dashboardService;