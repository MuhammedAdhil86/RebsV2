import axiosInstance from "./axiosinstance";
import { 
  // --- Physical Asset Endpoints ---
  getAssetDashboard, 
  postCreateAsset, 
  getAssetType, 
  getAssetAllocatebyId, 
  getAssetstype, 
  postAssetAllocation, 
  postReturnAsset, 
  FetchAssets, 
  addAssetType,
  // --- Digital Asset Endpoints ---
  getDigitalDashboard,
  getDigitalAsset,
  postCreateDigitalAsset,
  updateDigitalAsset,
  getAccountType,
  getAuthenticator,
  postAllocateDigital,
  getDigitalAssetById,
  postReturnDigital,
  deleteDigitalAsset
} from "../api/api";

/**
 * @description Senior Developer Transformation Layer.
 * Unified gatekeeper for both Physical and Digital data structures.
 */
const transformAsset = (asset) => ({
  id: asset.id ?? "",
  asset_name: asset.asset_name || asset.name || asset.account_name || "N/A", 
  asset_type: asset.asset_type || asset.type || "General",
  asset_type_id: asset.asset_type_id || "N/A",
  asset_status: asset.asset_status || asset.status || "available",
  condition: asset.condition ?? "Good",
  purchase_date: asset.purchase_date ?? null,
  last_maintenance: asset.last_maintenance ?? null,
  created_on: asset.created_on || asset.createdOn || null,
  
  // Media & Identification
  image: asset.image || null,
  staff_id: asset.staff_id || null,
  staff_name: asset.staff_name || "N/A",

  // Digital-Specific logic
  isDigital: Boolean(
    asset.is_digital || 
    asset.account_type || 
    (asset.asset_type || asset.type || "").toLowerCase().includes("digital")
  ),
  login_url: asset.login_url || null,
  username: asset.username || null,
});

/**
 * @description Centralized Error Handler
 */
const handleError = (error, context) => {
  const normalizedError = error instanceof Error 
    ? error 
    : new Error(`${context} failed`, { cause: error });
  
  if (import.meta.env.DEV) {
    console.group(`❌ Service Error: ${context}`);
    console.error("Original Error:", normalizedError.cause || error);
    console.groupEnd();
  }
  throw normalizedError;
};

// ==========================================
// 1. PHYSICAL ASSET SERVICES (Existing)
// ==========================================

export const fetchAssets = async () => {
  try {
    const { data } = await axiosInstance.get(FetchAssets);
    if (import.meta.env.DEV) {
      console.groupCollapsed("📡 API Trace: fetchAssets (Physical)");
      console.table(data?.data?.slice(0, 5));
      console.groupEnd();
    }
    if (!data?.data || !Array.isArray(data.data)) return [];
    return data.data.map(transformAsset);
  } catch (error) {
    handleError(error, "fetchAssets");
  }
};

export const fetchDashboard = async () => {
  try {
    const { data } = await axiosInstance.get(getAssetDashboard);
    return data?.data ?? null;
  } catch (error) {
    handleError(error, "fetchDashboard");
  }
};

export const createAsset = async (assetData) => {
  try {
    const { data } = await axiosInstance.post(
      postCreateAsset, 
      assetData, 
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data?.data ?? data;
  } catch (error) {
    handleError(error, "createAsset");
  }
};
export const assetType = async () => {
  try {
    const { data } = await axiosInstance.get(getAssetType);
    return data?.data ?? [];
  } catch (error) {
    handleError(error, "assetType");
  }
};

export const addAsset = async (assetTypeData) => {
  try {
    const { data } = await axiosInstance.post(addAssetType, assetTypeData);
    return data;
  } catch (error) {
    handleError(error, "addAsset");
  }
};

export const fetchAssetAllocationById = async (id) => {
  try {
    const { data } = await axiosInstance.get(getAssetAllocatebyId(id));
    return data;
  } catch (error) {
    handleError(error, `fetchAssetAllocationById(${id})`);
  }
};

export const allocateAsset = async (payload) => {
  try {
    const { data } = await axiosInstance.post(postAssetAllocation, payload);
    return data;
  } catch (error) {
    throw error.response?.data || new Error(error.message);
  }
};

export const returnAsset = async (assetId, staffId) => {
  try {
    const { data } = await axiosInstance.post(postReturnAsset, {
      asset_id: assetId,
      staff_id: staffId,
    });
    return data;
  } catch (error) {
    throw error.response?.data || new Error(error.message);
  }
};

export const updateAsset = async (id, editAsset) => {
  try {
    const { data } = await axiosInstance.put(
      `/admin/asset/update/${id}`,
      editAsset,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  } catch (error) {
    handleError(error, `updateAsset(${id})`);
  }
};

export const removeAsset = async (id) => {
  if (!id) throw new Error("Deletion failed: Missing Asset ID");
  try {
    const { data } = await axiosInstance.delete(`/admin/asset/delete/${id}`);
    return data;
  } catch (error) {
    handleError(error, `removeAsset(${id})`);
  }
};

// ==========================================
// 2. DIGITAL ASSET SERVICES (New)
// ==========================================

export const fetchDigitalAssets = async () => {
  try {
    const { data } = await axiosInstance.get(getDigitalAsset);

    const assets = data?.data;

    if (!Array.isArray(assets)) return [];

    // ✅ RETURN RAW DATA (SAFE)
    return assets;

  } catch (error) {
    handleError(error, "fetchDigitalAssets");
    return [];
  }
};
export const fetchDigitalDashboard = async () => {
  try {
    const { data } = await axiosInstance.get(getDigitalDashboard);
    return data?.data ?? null;
  } catch (error) {
    handleError(error, "fetchDigitalDashboard");
  }
};

export const createDigitalAsset = async (digitalData) => {
  try {
    const { data } = await axiosInstance.post(
      postCreateDigitalAsset, 
      digitalData, // This must be the FormData object from your component
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data?.data ?? data;
  } catch (error) {
    handleError(error, "createDigitalAsset");
  }
};
export const fetchAccountTypes = async () => {
  try {
    const { data } = await axiosInstance.get(getAccountType);
    return data?.data ?? [];
  } catch (error) {
    handleError(error, "fetchAccountTypes");
  }
};

export const fetchAuthenticators = async () => {
  try {
    const { data } = await axiosInstance.get(getAuthenticator);

    // ✅ Add this line
    console.log("Authenticators API Response:", data);

    return data?.data ?? [];
  } catch (error) {
    handleError(error, "fetchAuthenticators");
  }
};
export const allocateDigitalAsset = async (payload) => {
  try {
    const { data } = await axiosInstance.post(postAllocateDigital, payload);
    return data;
  } catch (error) {
    handleError(error, "allocateDigitalAsset");
  }
};

export const fetchDigitalTimelineById = async (id) => {
  // Validate ID early to save a network request
  if (!id) {
    console.warn("fetchDigitalTimelineById: No ID provided");
    return null;
  }

  try {
    console.log(`[API Request] Fetching Timeline for ID: ${id}...`);
    
    const { data, status } = await axiosInstance.get(getDigitalAssetById(id));

    // Log success with status and preview of data
    console.log(`[API Success] ID: ${id} | Status: ${status}`, data);

    // Ensure we return the data or a fallback empty array if data is null
    return data || []; 
    
  } catch (error) {
    // Enhanced console error for faster debugging
    console.error(`[API Error] fetchDigitalTimelineById(${id}):`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    // Pass it to your global handler
    handleError(error, `fetchDigitalTimelineById(${id})`);
    
    // Return null or throw so the UI can handle the error state
    throw error; 
  }
};
export const returnDigitalAsset = async (payload) => {
  try {
    const { data } = await axiosInstance.post(postReturnDigital, payload);
    return data;
  } catch (error) {
    handleError(error, "returnDigitalAsset");
  }
};

export const removeDigitalAsset = async (id) => {
  if (!id) throw new Error("Deletion failed: Missing Digital Asset ID");
  try {
    const { data } = await axiosInstance.delete(deleteDigitalAsset(id));
    return data;
  } catch (error) {
    handleError(error, `removeDigitalAsset(${id})`);
  }
};

export const editDigitalAsset = async (id, digitalData) => {
  if (!id) throw new Error("Update failed: Missing Digital Asset ID");

  try {
    const { data } = await axiosInstance.put( // ⚠️ or PUT depending on backend
      updateDigitalAsset(id),
      digitalData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data?.data ?? data;

  } catch (error) {
    handleError(error, `editDigitalAsset(${id})`);
  }
};