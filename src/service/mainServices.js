import axiosInstance from "./axiosinstance";
import {
  getCategory,
  getEmailPurposes,
  getEmailPlaceholders,
  postCreateEmailTemplate,
  getEmailTemplates,
  updateEmailTemplate,
  uploadEmailTemplateFile,
  getDefulatEmailTemplate,
  postGenerateLetter,
  getWeeklyOffShifts,
  postCloneEmailTemplate,
  deleteEmailTemplate,
  postSendLetter,
  postAddWeekOff,
} from "../api/api";

/**
 * Helper: log only in development
 */
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

// -------------------- General API Calls --------------------
export const fetchCategory = async () => {
  try {
    const response = await axiosInstance.get(getCategory);
    devLog("Category Response:", response);
    return response?.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching category:", error?.response?.data || error?.message);
    throw error;
  }
};

export const fetchAttachments = async (uuid) => {
  try {
    const endpoint = `/staff/admin/document/get/${uuid}`;
    const response = await axiosInstance.get(endpoint);
    devLog("Attachments Response:", response);
    return response?.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching attachments:", error?.response?.data || error?.message);
    throw error;
  }
};

export const attachmentUpload = async (employeeUUID, attachmentData) => {
  try {
    const endpoint = `/staff/admin/document/upload/${employeeUUID}`;
    const response = await axiosInstance.post(endpoint, attachmentData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    devLog("Upload Response:", response);
    return response?.data;
  } catch (error) {
    console.error("Error adding attachment:", error?.response?.data || error?.message);
    throw error;
  }
};

// -------------------- Email API Calls --------------------
export const fetchEmailPurposes = async () => {
  try {
    const response = await axiosInstance.get(getEmailPurposes);
    devLog("Email Purposes Response:", response);
    return response?.data?.data ?? [];
  } catch (error) {
    console.error("Error fetching email purposes:", error?.response?.data || error?.message);
    return [];
  }
};

export const fetchEmailPlaceholders = async () => {
  try {
    const response = await axiosInstance.get(getEmailPlaceholders);
    devLog("Email Placeholders Response:", response);

    const rawData = response?.data?.data ?? [];

    return rawData.map((item) => ({
      label: item.placeholder,
      placeholder: item.placeholder,
    }));
  } catch (error) {
    console.error("Error fetching placeholders:", error?.response?.data || error?.message);
    return [];
  }
};

// -------------------- CREATE EMAIL TEMPLATE --------------------
export const createEmailTemplate = async ({
  name,
  purpose,
  subject,
  body_html,
  is_manual,
}) => {
  try {
    const payload = {
      name,
      subject,
      body_html,
      is_manual: Boolean(is_manual),
    };

    if (purpose) {
      payload.purpose = purpose;
    }

    devLog("Create Email Template Payload:", payload);

    const response = await axiosInstance.post(postCreateEmailTemplate, payload);

    devLog("Create Email Template Response:", response);

    return response?.data;
  } catch (error) {
    console.error("Error creating email template:", error?.response?.data || error?.message);
    throw error;
  }
};

// -------------------- FETCH EMAIL TEMPLATES --------------------
export const fetchEmailTemplates = async () => {
  const url = getEmailTemplates;

  try {
    const response = await axiosInstance.get(url);
    devLog("Email Templates API Response:", response);

    const data = response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch email templates";

    console.error("fetchEmailTemplates error:", { url, error: errorMessage });
    throw new Error(errorMessage);
  }
};

// -------------------- UPDATE EMAIL TEMPLATE --------------------
export const updateEmailTemplateService = async ({
  purpose,
  name,
  subject,
  body_html,
}) => {
  if (!purpose) {
    throw new Error("Purpose is required to update the template");
  }

  let url = "";

  try {
    url = updateEmailTemplate.replace("{purpose}", purpose);

    const payload = { name, subject, body_html };

    const response = await axiosInstance.put(url, payload);

    devLog("Update Email Template Response:", response);

    return response?.data || {};
  } catch (error) {
    const errorMessage =
      error?.response?.data?.error ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update email template";

    console.error("updateEmailTemplateService error:", { url, error: errorMessage });

    throw new Error(errorMessage);
  }
};

// -------------------- UPLOAD EMAIL TEMPLATE FILE --------------------
export const uploadEmailTemplateFileService = async (fileData) => {
  try {
    const formData = new FormData();
    Object.keys(fileData).forEach((key) => formData.append(key, fileData[key]));

    const response = await axiosInstance.post(uploadEmailTemplateFile, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    devLog("Upload Email Template Response:", response);
    return response?.data;
  } catch (error) {
    console.error("Error uploading email template file:", error?.response?.data || error?.message);
    throw error;
  }
};

// -------------------- FETCH DEFAULT EMAIL TEMPLATES --------------------
export const fetchDefaultEmailTemplates = async () => {
  const url = getDefulatEmailTemplate;

  try {
    const response = await axiosInstance.get(url);
    devLog("Default Email Templates:", response);

    const data = response?.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
      "Failed to fetch default email templates"
    );
  }
};

// -------------------- CLONE DEFAULT EMAIL TEMPLATE --------------------
export const cloneDefaultEmailTemplate = async (default_template_id) => {
  try {
    const payload = { default_template_id };
    devLog("Clone Default Template Payload:", payload);

    const response = await axiosInstance.post(postCloneEmailTemplate, payload);

    devLog("Clone Default Template Response:", response);
    return response?.data;
  } catch (error) {
    console.error("Error cloning default template:", error?.response?.data || error?.message);
    throw error;
  }
};
export const fetchWeeklyOffShifts = async (type) => {
  try {
    // We append the type parameter to the URL
    const response = await axiosInstance.get(`${getWeeklyOffShifts}?type=${type}`);
    devLog(`${type} Shifts Response:`, response);
    
    return response?.data?.data ?? [];
  } catch (error) {
    console.error(`Error fetching ${type} shifts:`, error?.response?.data || error?.message);
    return []; // Return empty array so Promise.all doesn't fail
  }
};

export const createWeeklyOff = async (payload) => {
  try {
    devLog("Post Weekly Off Payload:", payload);

    const response = await axiosInstance.post(postAddWeekOff, payload);

    devLog("Post Weekly Off Response:", response);
    
    return response?.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to add weekly off";

    console.error("createWeeklyOff error:", { 
      url: postAddWeekOff, 
      error: errorMessage 
    });
    
    throw error;
  }
};

export const deleteEmailTemplateService = async (id) => {
  if (!id) throw new Error("Template ID is required");

  // FIX: Call the function with the id instead of template literals
  const url = deleteEmailTemplate(id); 

  try {
    const response = await axiosInstance.delete(url);
    return response.data; 
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message || 
      error?.response?.data?.error || 
      "Failed to delete email template";
    throw new Error(errorMessage);
  }
};

export const generateLetterService = async (userId, category) => {
  // Ensure the keys match EXACTLY what the backend documentation says
  const payload = {
    user_id: String(userId),
    letter_category: String(category),
  };

  try {
    devLog("Generating Letter with Payload:", payload);
    const response = await axiosInstance.post(postGenerateLetter, payload);
    return response?.data;
  } catch (error) {
    // This will help you see if it's a 404, 500, or Proxy error
    const serverMessage = error?.response?.data?.message || error?.message;
    console.error("Generate Letter Backend Error:", serverMessage);
    throw new Error(serverMessage);
  }
};
/**
 * Send an Email Letter
 */
export const sendLetterService = async (userId, category, cc = [], bcc = []) => {
  const payload = {
    user_id: String(userId),
    letter_category: String(category),
    cc: cc,
    bcc: bcc,
  };
  const response = await axiosInstance.post(postSendLetter, payload);
  return response?.data;
};