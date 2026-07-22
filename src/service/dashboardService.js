import axiosInstance from "./axiosinstance";
import { 
  getHappinessRating, 
  getDashboardList, 
  getAdminAttendanceHappinessGraph 
} from "../api/api"; 

const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get(getDashboardList);
    return response.data.data;
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

const getHappinessGraphData = async (payload) => {
  try {
    console.log("Fetching happiness graph with payload:", payload);
    const response = await axiosInstance.post(getAdminAttendanceHappinessGraph, payload);
    console.log("Happiness graph response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching happiness graph data", error);
    throw error;
  }
};

const dashboardService = {
  getDashboardData,
  fetchHappinessRating,
  getHappinessGraphData,
};

export default dashboardService;