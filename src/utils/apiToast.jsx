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

// Shared toast body: message as title, backend data underneath
const buildToastContent = (message, detail) => {
  const detailText = formatDetail(detail);
  return (
    <div>
      <div>{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600 break-words">
          {detailText}
        </div>
      )}
    </div>
  );
};

// Backend message as the title, backend data underneath
export const showApiToast = (type, message, detail) => {
  toast[type](buildToastContent(message, detail), { autoClose: 5000 });
};

// Works whether the service returns the axios response, the body, or nothing
export const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

// Pulls the title + detail out of an error (shared by show/resolve error)
const getApiErrorParts = (error, fallback) => {
  const errBody = error?.response?.data;
  return {
    message: errBody?.message || errBody?.error || error?.message || fallback,
    detail: errBody?.data ?? (errBody?.message ? errBody?.error : undefined),
  };
};

// Success toast using the backend message (falls back to your text)
export const showApiSuccess = (res, fallback) => {
  const body = getApiBody(res);
  showApiToast("success", body?.message || fallback);
};

// Error toast: backend message + data (or error) from error.response.data
export const showApiError = (error, fallback) => {
  const { message, detail } = getApiErrorParts(error, fallback);
  showApiToast("error", message, detail);
};

// ---------------------------------------------------------------------------
// Loading-toast variants: use with `const tid = toast.loading("...")`
// They update that same toast instead of opening a new one.
// ---------------------------------------------------------------------------

const resolveToast = (tid, type, message, detail) => {
  toast.update(tid, {
    render: buildToastContent(message, detail),
    type,
    isLoading: false,
    autoClose: 5000,
    closeOnClick: true,
    draggable: true,
  });
};

// Turns the loading toast into a success toast (backend message or fallback)
export const resolveApiSuccess = (tid, res, fallback) => {
  const body = getApiBody(res);
  resolveToast(tid, "success", body?.message || fallback);
};

// Turns the loading toast into an error toast (backend message + data)
export const resolveApiError = (tid, error, fallback) => {
  const { message, detail } = getApiErrorParts(error, fallback);
  resolveToast(tid, "error", message, detail);
};
