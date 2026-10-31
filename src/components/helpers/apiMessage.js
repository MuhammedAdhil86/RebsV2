// src/helpers/apiMessage.js
// Helpers to read the backend's message / error out of a response for hot toasts.

const text = (v) => (typeof v === "string" ? v.trim() : "");

// Turns a response body into an object (accepts an object or a JSON string)
const toBody = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === "object" ? raw : null;
};

// errors can be a string, an array, or { field: ["msg"] }
const joinErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors
      .map((e) => text(e?.message ?? e))
      .filter(Boolean)
      .join(", ");
  }
  if (errors && typeof errors === "object") {
    return Object.values(errors).flat().map(text).filter(Boolean).join(", ");
  }
  return text(errors);
};

/**
 * True when the backend replied (even with HTTP 200) but says it failed,
 * e.g. { ok: false, error: "..." }.  Pass the response BODY (res.data).
 */
export const isApiFailure = (body) =>
  body?.ok === false || body?.success === false;

/**
 * Success message from an axios response (or a body).
 * Reads res.data.message, res.message, res.data.data.message, in that order.
 */
export const getApiMessage = (res, fallback = "Success") =>
  text(res?.data?.message) ||
  text(res?.message) ||
  text(res?.data?.data?.message) ||
  fallback;

/**
 * Error message from a thrown axios error (or { response: { data: body } }).
 * Returns "message" or "message: detail" when the backend sends both.
 */
export const getApiError = (err, fallback = "Something went wrong") => {
  const body = toBody(err?.response?.data) || toBody(err?.responseText);

  if (body) {
    const message =
      text(body.message) || text(body.error) || joinErrors(body.errors);
    const detail = text(body.data) || text(body.detail);

    if (message && detail && detail !== message) return `${message}: ${detail}`;
    if (message || detail) return message || detail;
  }

  // No response from the server at all (network down, timeout...)
  if (!err?.response && err?.message) {
    return err.message === "Network Error"
      ? "Network error. Please check your connection."
      : err.message;
  }

  return fallback;
};
