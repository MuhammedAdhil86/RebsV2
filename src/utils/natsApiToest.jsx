import React from "react";
import { toast } from "react-toastify";

/* ---------------- ERROR CLASS ---------------- */

export class NatsApiError extends Error {
  constructor(message, response, body) {
    super(message);
    this.name = "NatsApiError";
    this.response = response; // full axios response (or raw body)
    this.body = body; // the { ok: false, error, ... } body
  }
}

/* ---------------- HELPERS ---------------- */

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

// Gets the best message from a NatsApiError, axios error or normal error
export const getNatsErrMsg = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

// Same layout as your REST toast: message as title, detail underneath
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

/* ---------------- OK CHECK ---------------- */

// NATS replies are always HTTP 200: { ok: true, ... } or { ok: false, error }.
// Throws a NatsApiError when ok is false.
export const assertNatsOk = (res) => {
  for (const body of [res, res?.data]) {
    if (body && typeof body === "object" && body.ok === false) {
      throw new NatsApiError(
        body.error || body.message || "Request failed",
        res,
        body,
      );
    }
  }
  return res;
};

/* ---------------- TOASTS ---------------- */

// Turns a loading toast into a result toast
const resolveToast = (id, type, message, detail, autoClose = 5000) => {
  toast.update(id, {
    render: buildToastContent(message, detail),
    type,
    isLoading: false,
    autoClose,
    closeOnClick: true,
    draggable: true,
  });
};

// Error toast. Pass a loading toast id to replace that toast.
export const showNatsError = (err, { id, fallback, duration = 6000 } = {}) => {
  const message = getNatsErrMsg(err, fallback);

  if (id !== undefined && id !== null) {
    resolveToast(id, "error", message, undefined, duration);
  } else {
    toast.error(buildToastContent(message), { autoClose: duration });
  }
};

// Success toast. Pass a loading toast id to replace that toast.
export const showNatsSuccess = (message, { id } = {}) => {
  if (id !== undefined && id !== null) {
    resolveToast(id, "success", message);
  } else {
    toast.success(buildToastContent(message), { autoClose: 5000 });
  }
};

/* ---------------- ONE-CALL WRAPPER ---------------- */

// Runs a request, handles loading, success and NATS errors.
// Returns the response, or null if it failed.
//
// onError(err) is optional. Return true if you handled the error yourself
// (for example by opening a popup): the loading toast is dismissed and no
// error toast is shown.
export const callNatsApi = async (
  request,
  { loading, success, errorFallback, onError } = {},
) => {
  const id = loading ? toast.loading(loading) : undefined;

  try {
    const res = assertNatsOk(await request());

    if (success) showNatsSuccess(success, { id });
    else if (id !== undefined) toast.dismiss(id);

    return res;
  } catch (err) {
    if (onError && onError(err) === true) {
      if (id !== undefined) toast.dismiss(id);
      return null;
    }

    showNatsError(err, { id, fallback: errorFallback });
    return null;
  }
};
