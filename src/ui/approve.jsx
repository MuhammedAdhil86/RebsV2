import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { AiOutlinePlus } from "react-icons/ai";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import useLeaveStore from "../store/useleaveStore";
import ModalButton from "./button/modalbutton";

// ---------- TOAST HELPERS (backend message + data in one toast) ----------
const formatDetail = (detail) => {
  if (detail === null || detail === undefined || detail === "") return "";
  if (Array.isArray(detail)) return detail.map(formatDetail).join(", ");
  if (typeof detail === "object") {
    return Object.entries(detail)
      .map(([k, v]) => `${k}: ${formatDetail(v)}`)
      .join(" | ");
  }
  return String(detail);
};

// If an id is passed (from toast.loading), that loading toast is updated in
// place. Otherwise a new toast of the given type is shown.
const showApiToast = (type, message, detail, id) => {
  const detailText = formatDetail(detail);

  const content = (
    <div>
      <div>{message}</div>
      {detailText && (
        <div className="mt-1 text-[12px] font-normal text-gray-600 break-words">
          {detailText}
        </div>
      )}
    </div>
  );

  if (id !== undefined && id !== null) {
    toast.update(id, {
      render: content,
      type,
      isLoading: false,
      autoClose: 5000,
      closeOnClick: true,
      closeButton: true,
      draggable: true,
    });
  } else {
    toast[type](content, { autoClose: 5000 });
  }
};

// Works whether the store returns the axios response, the body, or nothing
const getApiBody = (res) =>
  res?.data?.message !== undefined || res?.data?.status_code !== undefined
    ? res.data
    : res;

// Badge colours for approval / leave status (lowercase input)
const getApprovalBadge = (status) => {
  if (status.includes("approved")) return "bg-green-100 text-green-700";
  if (status.includes("rejected"))
    return "bg-red-50 text-red-600 border border-red-200";
  return "bg-gray-100 text-gray-700"; // pending / anything else
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const LeaveRequestApprove = ({ user, onClose }) => {
  const { updateLeaveStatus } = useLeaveStore();
  const [note, setNote] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState(""); // "Approved" | "Rejected" (which button shows the spinner)

  useEffect(() => {
    try {
      const localStorageUser = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(localStorageUser);
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
    }
  }, []);

  const handleClose = () => {
    if (!submitting && onClose) onClose();
  };

  // Close with the Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !submitting && onClose) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  const leaveDates = user.leave_date || [];
  const firstLeaveDate =
    leaveDates.length > 0
      ? new Date(Math.min(...leaveDates.map((l) => new Date(l.date))))
      : null;
  const endLeaveDate =
    leaveDates.length > 0
      ? new Date(Math.max(...leaveDates.map((l) => new Date(l.date))))
      : firstLeaveDate;
  const totalDays = leaveDates.length;

  const isLeaveDay = (date) => {
    const leave = leaveDates.find((l) =>
      dayjs(l.date).isSame(dayjs(date), "day"),
    );
    return !!leave;
  };

  const isHalfDay = (date) => {
    const leave = leaveDates.find((l) =>
      dayjs(l.date).isSame(dayjs(date), "day"),
    );
    return !!leave && (leave.half_day === "true" || leave.half_day === true);
  };

  const toggleDateSelection = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  // Shared approve / reject flow
  const submitStatus = async (nextStatus) => {
    if (submitting) return;
    const verb = nextStatus === "Approved" ? "approve" : "reject";

    if (selectedDates.length === 0) {
      toast.error(`Please select at least one date to ${verb}.`);
      return;
    }

    setSubmitting(true);
    setAction(nextStatus);
    const loadingToast = toast.loading("Updating status...");
    try {
      const res = await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: nextStatus,
        remarks: note,
        role: currentUser?.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      const body = getApiBody(res);
      showApiToast(
        "success",
        body?.message || `Leave ${nextStatus} successfully!`,
        null,
        loadingToast,
      );
      setSubmitting(false);
      setAction("");
      if (onClose) onClose(); // close modal on success
    } catch (err) {
      const errBody = err.response?.data;
      showApiToast(
        "error",
        errBody?.message ||
          errBody?.error ||
          err.message ||
          `Error trying to ${verb} leave`,
        errBody?.data ?? (errBody?.message ? errBody?.error : undefined),
        loadingToast,
      );
      setSubmitting(false);
      setAction("");
    }
  };

  const handleApprove = () => submitStatus("Approved");
  const handleReject = () => submitStatus("Rejected");

  // Inline note: submit saves the note and hides the input
  const handleNoteSubmit = () => {
    if (noteDraft.trim() === "") {
      toast.error("Please write a note before submitting.");
      return;
    }
    setNote(noteDraft);
    setNoteOpen(false);
  };

  // Pending  -> Reject + Approve
  // Approved -> only Reject
  // Rejected -> only Approve
  const leaveStatus = String(user.status ?? "").toLowerCase();
  const isPending = leaveStatus === "pending" || leaveStatus === "";
  const isApproved = leaveStatus === "approved";
  const isRejected = leaveStatus === "rejected";
  const showRejectButton = isPending || isApproved;
  const showApproveButton = isPending || isRejected;

  const isSuperAdmin = currentUser && currentUser.user_type === "Super admin";
  const managerApproval = String(user.manager_approval_status ?? "")
    .trim()
    .toLowerCase();
  // Buttons show when the manager has approved OR the request is still pending
  // with the manager, plus the super admin / manager roles as before.
  const shouldShowApprovalButtons =
    isSuperAdmin ||
    managerApproval === "approved" ||
    managerApproval === "pending" ||
    currentUser?.user_type === "Manager";

  // Footer is shown only when at least one button will appear
  const showFooter =
    shouldShowApprovalButtons && (showRejectButton || showApproveButton);

  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  };

  const calendarDates = firstLeaveDate
    ? (function (date) {
        const d = new Date(date);
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const dates = [];
        let curr = new Date(firstDay);
        while (curr <= lastDay) {
          dates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }
        return dates;
      })(firstLeaveDate)
    : [];

  // Blank cells so day 1 sits under the right weekday
  const leadingBlanks =
    calendarDates.length > 0 ? calendarDates[0].getDay() : 0;

  // ---------- Theme styles ----------
  const labelCls = "text-[11px] text-gray-500 mb-1";
  const boxCls = "bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-[2px] font-poppins text-[12px]"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-[960px] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <span className="p-2 bg-slate-100 rounded-lg">
              <Icon
                icon="solar:clipboard-check-outline"
                className="w-5 h-5 text-black"
              />
            </span>
            <div>
              <h2 className="text-[16px] text-gray-900">
                Leave Request Approval
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Review the leave dates and update the request status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            disabled={submitting}
            className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
          >
            <Icon icon="material-symbols:close" className="w-6 h-6" />
          </button>
        </div>

        {/* BODY: details on the left, calendar on the right */}
        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5">
            {/* ---------- LEFT: DETAILS ---------- */}
            <div className="space-y-4 min-w-0">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 bg-slate-100 border border-gray-200 rounded-full flex items-center justify-center text-[15px] text-gray-700 uppercase">
                  {user.name && user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-medium text-gray-800 leading-tight truncate">
                    {user.name}
                  </h3>
                  <p className="text-[12px] text-gray-500">
                    {user.type} | {totalDays} day(s)
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={boxCls}>
                  <p className={labelCls}>Start Date</p>
                  <p className="text-[13px] text-gray-800 tabular-nums">
                    {firstLeaveDate ? formatDate(firstLeaveDate) : "N/A"}
                  </p>
                </div>
                <div className={boxCls}>
                  <p className={labelCls}>End Date</p>
                  <p className="text-[13px] text-gray-800 tabular-nums">
                    {endLeaveDate ? formatDate(endLeaveDate) : "N/A"}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className={boxCls}>
                <p className={labelCls}>Reason</p>
                <p className="text-[13px] text-gray-800 break-words">
                  {user.reason}
                </p>
              </div>

              {/* Manager approval info */}
              {managerApproval && (
                <>
                  {managerApproval === "pending" && (
                    <div className="flex items-start gap-3 bg-slate-50 border border-gray-200 px-4 py-3 rounded-lg">
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                      <div>
                        <p className="text-[13px] text-gray-800">
                          Pending for manager approval
                        </p>
                        <p className="text-[11px] text-gray-500">
                          The manager has not yet responded to this leave
                          request.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className={boxCls}>
                      <p className={labelCls}>Manager Approval</p>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] inline-block capitalize ${getApprovalBadge(managerApproval)}`}
                      >
                        {managerApproval}
                      </span>
                    </div>
                    <div className={boxCls}>
                      <p className={labelCls}>Leave Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] inline-block capitalize ${getApprovalBadge(leaveStatus)}`}
                      >
                        {leaveStatus || "pending"}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Note */}
              {shouldShowApprovalButtons && (
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setNoteDraft(note);
                      setNoteOpen((o) => !o);
                    }}
                    className="w-full py-2 px-4 text-[12px] bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <AiOutlinePlus className="mr-2" /> Add a Note
                  </button>

                  {noteOpen && (
                    <div className="mt-3">
                      <textarea
                        className="w-full h-24 px-3 py-2.5 text-[13px] text-gray-800 placeholder-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black resize-none"
                        placeholder="Type your note here..."
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <ModalButton
                          variant="secondary"
                          onClick={() => setNoteOpen(false)}
                        >
                          Close
                        </ModalButton>
                        <ModalButton
                          variant="primary"
                          onClick={handleNoteSubmit}
                        >
                          Submit
                        </ModalButton>
                      </div>
                    </div>
                  )}

                  {!noteOpen && note && (
                    <div className={`mt-3 ${boxCls}`}>
                      <p className={labelCls}>Note</p>
                      <p className="text-[13px] text-gray-800 break-words">
                        {note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ---------- RIGHT: CALENDAR ---------- */}
            <div className="border border-gray-200 rounded-lg p-4 self-start min-w-0">
              {/* Month + total days */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-[13px] font-medium text-gray-800">
                  {firstLeaveDate
                    ? dayjs(firstLeaveDate).format("MMMM YYYY")
                    : "No leave dates"}
                </p>
                <div className="flex items-center gap-2 bg-slate-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                  <p className="text-[14px] font-medium text-gray-800 tabular-nums">
                    {totalDays}
                  </p>
                  <p className="text-[11px] text-gray-500">Total Days</p>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[10px] py-1 ${
                      i === 0 || i === 6 ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1.5">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
                {calendarDates.map((date, idx) => {
                  const dateStr = dayjs(date).format("YYYY-MM-DD");
                  const isSelected = selectedDates.includes(dateStr);
                  const half = isHalfDay(date);
                  const leave = isLeaveDay(date);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleDateSelection(date)}
                      className={`relative mx-auto h-9 w-9 flex items-center justify-center rounded-full cursor-pointer text-[12px] tabular-nums transition-colors
                        ${
                          isSelected
                            ? "bg-black text-white"
                            : half
                              ? "bg-gray-100 text-gray-900 ring-1 ring-gray-400"
                              : leave
                                ? "bg-gray-200 text-gray-900"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      {date.getDate()}
                      {half && (
                        <span
                          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                            isSelected ? "bg-white" : "bg-gray-600"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend + selected count */}
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-500">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                    Leave day
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-100 ring-1 ring-gray-400" />
                    Half day
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-black" />
                    Selected
                  </span>
                </div>
                <span className="text-gray-700 tabular-nums">
                  {selectedDates.length} selected
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER: Reject + Approve only */}
        {showFooter && (
          <div className="px-6 py-4 border-t border-gray-100 bg-slate-50/60 flex justify-end gap-2">
            {showRejectButton && (
              <ModalButton
                variant="danger"
                onClick={handleReject}
                disabled={submitting}
                loading={submitting && action === "Rejected"}
              >
                Reject
              </ModalButton>
            )}

            {showApproveButton && (
              <ModalButton
                variant="primary"
                onClick={handleApprove}
                disabled={submitting}
                loading={submitting && action === "Approved"}
              >
                Approve
              </ModalButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequestApprove;
