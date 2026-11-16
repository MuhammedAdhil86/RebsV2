import React from "react";
import { toast } from "react-toastify";

// Turns strings, arrays and objects into readable text
export const formatDetail = (detail) => {
  if (detail === null || detail === undefined || detail === "") return "";
  if (Array.isArray(detail)) return detail.map(formatDetail).join(", ");
  if (typeof detail === "object") {
    return Object.entries(detail)
      .map(([k, v]) => `${k}: ${formatDetail(v)}`)
      .join(" | ");
  }
  return String(detail);
};

// Backend message as the title, backend data underneath
export const showApiToast = (type, message, detail) => {
  const detailText = formatDetail(detail);

  toast[type](
    <div>
      <div>{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600 break-words">
          {detailText}
        </div>
      )}
    </div>,
    { autoClose: 5000 },
  );
};

// Works whether the service returns the axios response, the body, or nothing
export const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

// Success toast using the backend message (falls back to your text)
export const showApiSuccess = (res, fallback) => {
  const body = getApiBody(res);
  showApiToast("success", body?.message || fallback);
};

// Error toast: backend message + data (or error) from error.response.data
export const showApiError = (error, fallback) => {
  const errBody = error?.response?.data;
  showApiToast(
    "error",
    errBody?.message || errBody?.error || error?.message || fallback,
    errBody?.data ?? (errBody?.message ? errBody?.error : undefined),
  );
};
