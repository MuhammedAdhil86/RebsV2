/**
 * Safely parses API error responses across varying backend structures
 * (JSON string payloads, nested data objects, arrays, or fallback network errors).
 *
 * @param {import("axios").AxiosError|Error|any} error - The caught error instance
 * @param {string} [fallbackMessage="An unexpected error occurred."] - Default message
 * @returns {string} The formatted user-facing error message
 */
export const extractErrorMessage = (
  error,
  fallbackMessage = "An unexpected error occurred."
) => {
  if (!error?.response) {
    return error?.message || fallbackMessage;
  }

  let resData = error.response.data;

  // 1. Safely handle JSON strings returned by backend
  if (typeof resData === "string") {
    try {
      resData = JSON.parse(resData);
    } catch {
      return resData.trim() || fallbackMessage;
    }
  }

  if (typeof resData !== "object" || resData === null) {
    return fallbackMessage;
  }

  // 2. Priority extraction hierarchy
  const { data, message, error: errDetail, detail, errors } = resData;

  // Specific detail message inside "data" (e.g. character limit validation)
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  // Generic message string
  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  // Array of message strings or objects
  if (Array.isArray(message) && message.length > 0) {
    const firstMsg = message[0];
    if (typeof firstMsg === "string") return message.join(", ");
    if (typeof firstMsg === "object" && firstMsg !== null) {
      return firstMsg.message || firstMsg.msg || fallbackMessage;
    }
  }

  // Standard framework error keys (Django, Express, FastAPI)
  if (typeof errDetail === "string" && errDetail.trim()) return errDetail.trim();
  if (typeof detail === "string" && detail.trim()) return detail.trim();

  // Nested validation dictionary (e.g. { field: ["error"] })
  if (typeof errors === "object" && errors !== null) {
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      const fieldError = errors[firstKey];
      const detailMsg = Array.isArray(fieldError) ? fieldError.join(", ") : fieldError;
      return `${firstKey}: ${detailMsg}`;
    }
  }

  return fallbackMessage;
};