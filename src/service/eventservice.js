import axiosInstance from "./axiosinstance";
import {
  getEvents,
  postEvents,
  getTimezone,
  deleteEvent as deleteEventapi,
  cancelEvent,
  postAddWeekOff,
} from "../api/api";

export const fetchEvents = async () => {
  try {
    const response = await axiosInstance.get(getEvents);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching events data:", error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await axiosInstance.post(postEvents, eventData);
    return response.data.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const fetchTimeZone = async () => {
  try {
    const response = await axiosInstance.get(getTimezone);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching timezone data:", error);
    throw error;
  }
};

export const deleteEventApi = async (id) => {
  try {
    const url = deleteEventapi.replace(":id", id);
    console.log("id is", id);

    const response = await axiosInstance.delete(url);
    console.log("deleted event", response);

    return response.data.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const cancelEventapi = async (eventId) => {
  try {
    const response = await axiosInstance.put(
      cancelEvent.replace(":id", eventId)
    );
    console.log("cancel event respose", response);
    return response.data.data;
  } catch (error) {
    console.error("Error cancelling the event:", error);
    throw error;
  }
};

export const fetchHolidayEvents = async (month, year) => {
  if (!month || !year) {
    const today = new Date();
    month = String(today.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
    year = today.getFullYear();
  }

  try {
    const response = await axiosInstance.get(`/admin/holiday/get/${month}/${year}`);
    
    // Transform the response data if needed
    const holidays = response.data.data.map(holiday => ({
      ...holiday,
      start_date: holiday.date, // Ensure consistent property names
      end_date: holiday.date,
      title: holiday.name || "Holiday", // Provide default title if name is missing
      type: "holiday"
    }));

    return holidays;
  } catch (error) {
    console.error(`Error fetching holidays for ${month}/${year}:`, error);
    throw error;
  }
};

export const fetchWeeklyOffEvents = async (month, year) => {
  if (!month || !year) {
    const today = new Date();
    month = String(today.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
    year = today.getFullYear();
  }

  try {
    const response = await axiosInstance.get(`/admin/weekly-off/get/${month}/${year}`);
    
    // Transform the response data if needed
    const weeklyOffs = response.data.data.map(weeklyOff => ({
      ...weeklyOff,
      start_date: weeklyOff.date, // Ensure consistent property names
      end_date: weeklyOff.date,
      title: "Weekly Off", // Default title for weekly offs
      type: "weeklyOff"
    }));

    return weeklyOffs;
  } catch (error) {
    console.error(`Error fetching weekly offs for ${month}/${year}:`, error);
    throw error;
  }
};

export const createWeeklyOff = async (weeklyOffData) => {
  try {
    const response = await axiosInstance.post(postAddWeekOff, weeklyOffData);
    console.log("Weekly off added:", response);
    return response.data.data;
  } catch (error) {
    console.error("Error adding weekly off:", error);
    throw error;
  }
};