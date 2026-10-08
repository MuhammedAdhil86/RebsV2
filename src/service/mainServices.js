import axiosInstance, { testingInstance } from "./axiosinstance";
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
  getLetterPurposes,
  postCloneEmailTemplate,
  getGeneratedLettersUrl,
  deleteGeneratedLetterUrl,
  deleteEmailTemplate,
  postSendLetter,
  postAddWeekOff,
  getManualPurposes,
  postSendCustomEmailByPurpose,
  getPurposePlaceholders,
  postSendCustomEmail
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
/**
 * Fetch list of letter purposes
 * @returns {Promise<string[]>} Array of purpose strings
 */
export const fetchLetterPurposes = async () => {
  try {
    const response = await axiosInstance.get(getLetterPurposes);

    // devLog if you are using it in your codebase:
    // devLog("Letter Purposes Response:", response);

    // Support both direct array and wrapped response shapes
    const rawData = response?.data?.data ?? response?.data ?? [];

    return Array.isArray(rawData) ? rawData : [];
  } catch (error) {
    console.error(
      "Error fetching letter purposes:",
      error?.response?.data || error?.message
    );
    return [];
  }
};

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
export const fetchManualPurposes = async () => {
  try {
    const response = await axiosInstance.get(getManualPurposes);
    return response.data;
  } catch (error) {
    throw error?.response?.data || { message: "Failed to fetch manual mail purposes" };
  }
};
export const fetchPurposePlaceholders = async (purpose) => {
  if (!purpose) return [];

  try {
    const url = `/admin/templates/by-purpose/${encodeURIComponent(purpose)}/placeholders`;
    devLog("Purpose Placeholders URL:", url);

    const response = await axiosInstance.get(url);
    devLog("Purpose Placeholders Response:", response);

    const raw = response?.data?.placeholders ?? response?.data?.data ?? [];

    return (Array.isArray(raw) ? raw : [])
      .map((item) => (typeof item === "string" ? item : item?.placeholder || item?.label))
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching purpose placeholders:", error?.response?.data || error?.message);
    return [];
  }
};/**
 * Send a custom (composed) email
 * POST /admin/send/custom-email
 */
export const sendCustomEmailService = async ({
  to = [],
  cc = [],
  bcc = [],
  subject = "",
  body = "",
  data = {},
  attachments = [], // File[]
  use_manual_templates = false,
}) => {
  // Remove empty strings so the backend doesn't reject "invalid address"
  const clean = (list) =>
    Array.isArray(list)
      ? list.map((e) => String(e).trim()).filter((e) => e.length > 0)
      : [];

  const cleanTo = clean(to);
  if (cleanTo.length === 0) {
    throw new Error("At least one recipient is required");
  }
  if (!String(subject).trim()) {
    throw new Error("Subject is required");
  }

  const formData = new FormData();
  formData.append("use_manual_templates", String(Boolean(use_manual_templates)));
  formData.append("to", cleanTo.join(","));
  formData.append("cc", clean(cc).join(","));
  formData.append("bcc", clean(bcc).join(","));
  formData.append("subject", String(subject).trim());
  formData.append("body", body || "");
  formData.append("data", JSON.stringify(data || {}));
  (attachments || []).forEach((file) => formData.append("attachment", file));

  try {
    devLog("Send Custom Email (compose):", postSendCustomEmail);

    const response = await axiosInstance.post(postSendCustomEmail, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000, // mail sending with attachments can be slow
    });

    devLog("Send Custom Email Response:", response);
    return response?.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to send email";

    console.error("sendCustomEmailService error:", { url: postSendCustomEmail, error: errorMessage });
    throw new Error(errorMessage);
  }
};
/**
 * Send a custom email by purpose
 * POST /admin/send/custom-email/by-purpose/{purpose}
 */
export const sendCustomEmailByPurposeService = async ({
  purpose,
  use_manual_templates = true,
  to = [],
  cc = [],
  bcc = [],
  data = {},
  attachment = null,
}) => {
  if (!purpose) {
    throw new Error("Purpose is required to send the email");
  }

  // Remove empty strings so the backend doesn't reject "invalid address"
  const clean = (list) =>
    Array.isArray(list)
      ? list.map((e) => String(e).trim()).filter((e) => e.length > 0)
      : [];

  const cleanTo = clean(to);
  if (cleanTo.length === 0) {
    throw new Error("At least one recipient is required");
  }

  const formData = new FormData();
  formData.append("use_manual_templates", String(Boolean(use_manual_templates)));
  cleanTo.forEach((email) => formData.append("to", email));
  clean(cc).forEach((email) => formData.append("cc", email));
  clean(bcc).forEach((email) => formData.append("bcc", email));
  formData.append("data", JSON.stringify(data || {}));
  if (attachment) formData.append("attachment", attachment);

  let url = "";

  try {
    url = postSendCustomEmailByPurpose.replace("{purpose}", purpose);
    devLog("Send Custom Email URL:", url);

    const response = await axiosInstance.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    devLog("Send Custom Email Response:", response);
    return response?.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      "Failed to send custom email";

    console.error("sendCustomEmailByPurposeService error:", { url, error: errorMessage });
    throw new Error(errorMessage);
  }
};

export const fetchEmailPlaceholders = async () => {
  try {
    const response = await axiosInstance.get(getEmailPlaceholders);
    devLog("Email Placeholders Response:", response);

    // Accommodate both response.data.data and response.data
    const rawData = Array.isArray(response?.data)
      ? response.data
      : response?.data?.data ?? [];

    // Extract only the clean placeholder string
    return rawData
      .map((item) => (typeof item === "string" ? item : item?.placeholder || item?.label))
      .filter(Boolean);
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
  is_default,
}) => {
  try {
    const payload = {
      name,
      subject,
      body_html,
      is_manual: Boolean(is_manual),
      is_default: Boolean(is_default),
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
  template_type = "mail",
  is_default,
}) => {
  if (!purpose) {
    throw new Error("Purpose is required to update the template");
  }

  let url = "";

  try {
    url = updateEmailTemplate.replace("{purpose}", purpose);

    const payload = {
      name,
      subject,
      body_html,
      template_type,
      is_default: Boolean(is_default),
    };

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



// ✅ FIXED:
export const generateLetterService = async (userId, purpose) => {
  const payload = {
    user_id: String(userId),
    purpose: String(purpose), // ✅ Correct key
  };

  try {
    devLog("Generating Letter with Payload:", payload);
    const response = await testingInstance.post(postGenerateLetter, payload);
    return response?.data;
  } catch (error) {
    const serverMessage = error?.response?.data?.message || error?.message;
    console.error("Generate Letter Backend Error:", serverMessage);
    throw new Error(serverMessage);
  }
};

export const getGeneratedLettersService = async () => {
  try {
    const response = await axiosInstance.get(getGeneratedLettersUrl);
    console.log("Generated letters response:", response);
    // Accommodates direct array, response.data, or response.data.data
    return Array.isArray(response?.data)
      ? response.data
      : response?.data?.data ?? [];
  } catch (error) {
    console.error(
      "Error fetching generated letters:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

/**
 * Delete a generated letter by ID
 * Endpoint: DELETE /letter/generated/{id}
 */
export const deleteGeneratedLetterService = async (id) => {
  if (!id) {
    throw new Error("Letter ID is required for deletion");
  }

  try {
    const response = await axiosInstance.delete(deleteGeneratedLetterUrl(id));
    console.log(`Deleted letter ${id} response:`, response);
    return response?.data;
  } catch (error) {
    console.error(
      `Error deleting generated letter ${id}:`,
      error?.response?.data || error?.message
    );
    throw error;
  }
};





// export const generateLetterService = async (userId, category) => {
//   // Ensure the keys match EXACTLY what the backend documentation says
//   const payload = {
//     user_id: String(userId),
//     letter_category: String(category),
//   };

//   try {
//     devLog("Generating Letter with Payload:", payload);
//     const response = await axiosInstance.post(postGenerateLetter, payload);
//     return response?.data;
//   } catch (error) {
//     // This will help you see if it's a 404, 500, or Proxy error
//     const serverMessage = error?.response?.data?.message || error?.message;
//     console.error("Generate Letter Backend Error:", serverMessage);
//     throw new Error(serverMessage);
//   }
// };






/**
 * Send an Email Letter
 */
export const sendLetterService = async (userId, purpose, cc = [], bcc = []) => {
  const isObject = typeof userId === "object" && userId !== null;

  const resolvedUserId = isObject ? userId.user_id || userId.userId : userId;
  const resolvedPurpose = isObject ? userId.purpose || userId.letter_category : purpose;
  const resolvedCc = isObject ? userId.cc : cc;
  const resolvedBcc = isObject ? userId.bcc : bcc;

  // Filter out any empty string "" so gomail doesn't throw "invalid address"
  const cleanCc = Array.isArray(resolvedCc)
    ? resolvedCc.map((e) => String(e).trim()).filter((e) => e.length > 0)
    : [];

  const cleanBcc = Array.isArray(resolvedBcc)
    ? resolvedBcc.map((e) => String(e).trim()).filter((e) => e.length > 0)
    : [];

  const payload = {
    user_id: String(resolvedUserId || "").trim(),
    purpose: String(resolvedPurpose || "").trim(),
    cc: cleanCc,
    bcc: cleanBcc,
  };

  try {
    const response = await axiosInstance.post(postSendLetter, payload);
    return response?.data;
  } catch (error) {
    console.error("Error sending letter email:", error?.response?.data || error?.message);
    throw error;
  }
};
/**
 * Delete Email/Letter Template
 * DELETE admin/templates/{id}
 *
 * @param {string|number} id - Template ID
 */
export const deleteEmailTemplateService = async (id) => {
  if (!id) {
    throw new Error("Template ID is required to delete template");
  }

  try {
    // Directly calls the imported function inline on this line
    const response = await axiosInstance.delete(deleteEmailTemplate(id));
    return response?.data;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to delete template";

    console.error("deleteEmailTemplateService error:", errorMessage);
    throw new Error(errorMessage);
  }
};