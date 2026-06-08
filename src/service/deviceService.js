import axiosInstance from "./axiosinstance";
import { getDeviceChangeRequests, putApproveDeviceRequestBase, getDeviceHistoryByUser } from "../api/api";

/**
 * High-Scale Data Transformer Layer
 * Placed here sequentially so it initializes before arrow expressions use it.
 */
class DeviceHistoryTransformer {
  static transformRow(item) {
    if (!item) return null;
    
    return {
      device: item.device ?? "Unknown Device",
      device_id: item.device_id ?? "",
      is_active: !!(item.is_active ?? true),
      
      // Flatten SQL Null wrapper objects safely
      approved_by: item.approved_by?.Valid ? item.approved_by.String : (item.approved_by || null),
      approved_by_name: item.approved_by_name?.Valid ? item.approved_by_name.String : (item.approved_by_name || "N/A"),
      
      first_used_at: item.first_used_at ?? null,
      last_used_at: item.last_used_at?.Valid ? item.last_used_at.Time : (item.last_used_at || null),
    };
  }

  static transformCollection(rawCollection) {
    if (!Array.isArray(rawCollection)) return [];
    
    const transformed = [];
    const len = rawCollection.length;
    
    for (let i = 0; i < len; i++) {
      const parsed = this.transformRow(rawCollection[i]);
      if (parsed) transformed.push(parsed);
    }
    
    return transformed;
  }
}

/**
 * Fetches staff device change request logs
 * Method: GET
 */
export const fetchDeviceChangeRequests = async () => {
  try {
    const response = await axiosInstance.get(getDeviceChangeRequests);
    return response.data?.data ?? [];
  } catch (error) {
    const backendMessage =
      error.response?.data?.data || 
      error.response?.data?.message || 
      error.message;
    throw new Error(String(backendMessage));
  }
};

/**
 * Updates the approval status of a staff device change request
 * Method: PUT
 * URL Format: /staff/device/approve/{requestId}?action={approved|rejected}
 * @param {number|string} requestId - The primary tracking database ID or user identifier
 * @param {string} targetStatus - Query parameter option ("approved" or "rejected")
 * @param {Object} payload - Body payload containing { remarks }
 */
export const fetchUpdateDeviceStatus = async (requestId, targetStatus, payload) => {
  try {
    const response = await axiosInstance.put(
      `${putApproveDeviceRequestBase}/${requestId}?action=${targetStatus}`, 
      payload
    );
    return response.data;
  } catch (error) {
    const backendMessage =
      error.response?.data?.data || 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message;
    throw new Error(String(backendMessage));
  }
};

/**
 * High-Scale Enterprise Function
 * Fetches, flattens, and sanitizes multi-log histories cleanly.
 * Method: GET
 */
export const fetchDeviceHistoryByUser = async (uuid) => {
  try {
    const response = await axiosInstance.get(getDeviceHistoryByUser(uuid));
    const payload = response.data?.data ?? response.data;

    return DeviceHistoryTransformer.transformCollection(payload);
  } catch (error) {
    console.error(`[Device Service Error] Fetch failed for user ${uuid}:`, error);
    throw error;
  }
};