import axiosInstance from "./axiosinstance";

const getDashboardData = async () => {
  try {
    const response = await axiosInstance.get("/admin/dashboard/list");

    // ✅ Log the full response
    console.log("Raw API response:", response);

    // ✅ Log the data we will use
    console.log("Dashboard data:", response.data.data);

    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard data", error);
    throw error;
  }
};

const dashboardService = {
  getDashboardData,
};

export default dashboardService;
