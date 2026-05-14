import axiosInstance from "./axiosinstance";
import {
  getEvents,
  postEvents,
  getTimezone,
  deleteEvent as deleteEventapi,
  cancelEvent,
  getLeave,
  getHoliday,
  getWeekOff,
  getEventbyDate,
  getLeavebyDate
} from "../api/api";

/**
 * 1. Fetch Monthly Events
 * Returns an array of events for the calendar grid.
 */
export const fetchEvents = async (month, year) => {
  try {
    const response = await axiosInstance.get(`${getEvents}?month=${month}&year=${year}`);
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching events data:", error);
    return []; 
  }
};

/**
 * 2. Fetch Monthly Leaves
 * Returns an array of approved leaves for the calendar dots.
 */
export const fetchMonthlyLeaves = async (month, year) => {
  try {
    const response = await axiosInstance.get(`${getLeave}?month=${month}&year=${year}`);
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching monthly leave data:", error);
    return [];
  }
};

/**
 * 3. Fetch Single Day Details
 * Concurrent request to get both events and leaves for the selected sidebar date.
 */
export const fetchDailyDetails = async (date) => {
  try {
    const [eventsRes, leavesRes] = await Promise.all([
      axiosInstance.get(`${getEventbyDate}?date=${date}`),
      axiosInstance.get(`${getLeavebyDate}?date=${date}`)
    ]);

    return {
      events: Array.isArray(eventsRes.data?.data) ? eventsRes.data.data : [],
      leaves: Array.isArray(leavesRes.data?.data) ? leavesRes.data.data : []
    };
  } catch (error) {
    console.error("Error fetching daily details:", error);
    return { events: [], leaves: [] };
  }
};

/**
 * 4. Fetch Yearly Holidays
 */
export const fetchHolidayEvents = async (year) => {
  try {
    const response = await axiosInstance.get(getHoliday, { params: { year } });
    // Handles various nested structures from backend
    const data = response.data?.data || response.data?.holidays || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
};

/**
 * 5. Fetch Weekly Offs
 */
export const fetchWeeklyOffEvents = async (year) => {
  try {
    const url = getWeekOff.replace(":year", year);
    const response = await axiosInstance.get(url);
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching weekly offs:", error);
    return [];
  }
};

/**
 * 6. Create New Event
 */
export const createEvent = async (eventData) => {
  try {
    const response = await axiosInstance.post(postEvents, eventData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error; // Throw so component toast can handle it
  }
};

/**
 * 7. Fetch Timezone list
 */
export const fetchTimeZone = async () => {
  try {
    const response = await axiosInstance.get(getTimezone);
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return [];
  }
};

/**
 * 8. Delete Event (ID injection)
 */
export const deleteEventApi = async (id) => {
  try {
    const url = deleteEventapi.replace(":id", id);
    const response = await axiosInstance.delete(url);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

/**
 * 9. Cancel Event (Status Update)
 */
export const cancelEventapi = async (eventId) => {
  try {
    const url = cancelEvent.replace(":id", eventId);
    const response = await axiosInstance.put(url);
    return response.data?.data || response.data;
  } catch (error) {
    console.error("Error cancelling event:", error);
    throw error;
  }
};