import { testingInstance } from "./axiosinstance";
import {
  postCreateLetterPdfTemplate,
  putUpdateLetterPdfTemplate,
  postGenerateLetter,
  postSendLetter,
  getEmailPurposes,
  deleteEmailTemplate,
} from "../api/api";

/**
 * Development logger helper
 */
const devLog = (...args) => {
  if (import.meta.env.DEV) {
    console.log("[Cloudflare Service]:", ...args);
  }
};

/**
 * 1. Fetch available document purposes from Cloudflare tunnel
 * Filters down to only those ending with '_pdf'
 */
export const fetchCloudflarePdfPurposes = async () => {
  try {
    const response = await testingInstance.get(getEmailPurposes);
    devLog("Purposes Response:", response?.data);

    const allPurposes = response?.data?.data ?? [];

    return allPurposes.filter((item) =>
      String(item).toLowerCase().trim().endsWith("_pdf")
    );
  } catch (error) {
    console.error(
      "Error fetching purposes via tunnel:",
      error?.response?.data || error?.message || error
    );
    return [];
  }
};

/**
 * 2. Create Letter PDF Template (POST /letter/template/create)
 * Supports multipart/form-data for PDF/DOCX templates or regular JSON
 */
export const createLetterPdfTemplateService = async (formDataOrPayload) => {
  try {
    devLog("Creating PDF Template:", formDataOrPayload);

    const isFormData = formDataOrPayload instanceof FormData;
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await testingInstance.post(
      postCreateLetterPdfTemplate,
      formDataOrPayload,
      config
    );
    return response?.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to create PDF template";
    console.error("Create PDF Template Error:", message);
    throw new Error(message);
  }
};

/**
 * 3. Update Letter PDF Template (PUT /letter/template/update)
 * Supports multipart/form-data or JSON payload
 */
export const updateLetterPdfTemplateService = async (formDataOrPayload) => {
  try {
    devLog("Updating PDF Template:", formDataOrPayload);

    const isFormData = formDataOrPayload instanceof FormData;
    const config = isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};

    const response = await testingInstance.put(
      putUpdateLetterPdfTemplate,
      formDataOrPayload,
      config
    );
    return response?.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to update PDF template";
    console.error("Update PDF Template Error:", message);
    throw new Error(message);
  }
};

/**
 * 4. Generate Letter PDF (POST /letter/generate)
 * Payload requires user_id (UUID string) and purpose (e.g., 'insurance_claim_confirmation_pdf')
 */
export const generateLetterService = async (userId, purpose) => {
  // Supports both generateLetterService(userId, purpose) and generateLetterService({ userId, purpose })
  const resolvedUserId = typeof userId === "object" ? userId?.userId || userId?.user_id : userId;
  const resolvedPurpose = typeof userId === "object" ? userId?.purpose || userId?.letter_category : purpose;

  const payload = {
    user_id: String(resolvedUserId || "").trim(),
    purpose: String(resolvedPurpose || "").trim(),
  };

  try {
    devLog("Generating Letter with payload:", payload);
    const response = await testingInstance.post(postGenerateLetter, payload);
    return response?.data;
  } catch (error) {
    console.error("Generate Letter Error:", error);
    // Keep error properties intact so extractErrorMessage() in Letter.jsx can parse backend validation errors
    throw error;
  }
};

/**
 * 5. Send Letter via Email (POST /letter/send)
 * Payload requires user_id, purpose, cc, and bcc
 */
export const sendLetterService = async (userId, purpose, cc = [], bcc = []) => {
  const payload = {
    user_id: String(userId).trim(),
    purpose: String(purpose).trim(),
    cc: Array.isArray(cc) ? cc : [],
    bcc: Array.isArray(bcc) ? bcc : [],
  };

  try {
    devLog("Sending Letter Email:", payload);
    const response = await testingInstance.post(postSendLetter, payload);
    return response?.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to send letter email";
    console.error("Send Letter Email Error:", message);
    throw new Error(message);
  }
};

/**
 * 6. Delete Letter Template (DELETE /admin/templates/{id})
 */
export const deleteLetterTemplateService = async (templateId) => {
  if (!templateId) {
    throw new Error("Template ID is required for deletion");
  }

  const endpoint = deleteEmailTemplate(templateId);

  try {
    devLog("Deleting Template:", endpoint);
    const response = await testingInstance.delete(endpoint);
    return response?.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to delete template";
    console.error("Delete Template Error:", message);
    throw new Error(message);
  }
};