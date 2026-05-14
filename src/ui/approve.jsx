import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { AiOutlinePlus } from "react-icons/ai";
import AddNote from "../ui/AddNote";
import useLeaveStore from "../store/useleaveStore";
// --- ADDED THIS IMPORT ---
import toast from "react-hot-toast";

const LeaveRequestApprove = ({ user, onClose }) => {
  const { updateLeaveStatus } = useLeaveStore();
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);

  useEffect(() => {
    try {
      const localStorageUser = JSON.parse(localStorage.getItem("user"));
      setCurrentUser(localStorageUser);
    } catch (err) {
      console.error("Error reading user from localStorage:", err);
    }
  }, []);

  // ... (Keep all your existing date logic/helper functions exactly as they are)
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
    return leave && (leave.half_day === "true" || leave.half_day === true);
  };

  const toggleDateSelection = (date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter((d) => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  // UPDATED HANDLE APPROVE
  const handleApprove = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date to approve."); // REPLACED ALERT
      return;
    }

    const loadingToast = toast.loading("Updating status...");
    try {
      await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: "Approved",
        remarks: note,
        role: currentUser.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      toast.success("Leave Approved successfully!", { id: loadingToast });
      if (onClose) onClose(); // CLOSE UI ON SUCCESS
    } catch (err) {
      toast.error(err.response?.data?.message || "Error approving leave", {
        id: loadingToast,
      });
    }
  };

  // UPDATED HANDLE REJECT
  const handleReject = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date to reject."); // REPLACED ALERT
      return;
    }

    const loadingToast = toast.loading("Updating status...");
    try {
      await updateLeaveStatus({
        leaveRefNo: user.leave_ref_no,
        status: "Rejected",
        remarks: note,
        role: currentUser.user_type === "Manager" ? "manager" : "admin",
        dates: selectedDates,
      });
      toast.success("Leave Rejected successfully!", { id: loadingToast });
      if (onClose) onClose(); // CLOSE UI ON SUCCESS
    } catch (err) {
      toast.error(err.response?.data?.message || "Error rejecting leave", {
        id: loadingToast,
      });
    }
  };

  const toggleDrawer = (open) => setDrawerOpen(open);
  const isSuperAdmin = currentUser && currentUser.user_type === "Super admin";
  const shouldShowApprovalButtons =
    isSuperAdmin ||
    user.manager_approval_status === "Approved" ||
    currentUser?.user_type === "Manager";

  // ... (Keep existing calendar formatting logic)
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

  return (
    <div className="max-w-md font-poppins mx-auto mt-4">
      <div className="pb-3 text-black font-medium text-lg">
        Leave Request Approval
      </div>

      <div className="p-3 bg-white border border-gray-300 rounded-lg mb-6">
        {/* User Info Section (Unchanged) */}
        <div className="mb-4 flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-xl font-medium text-gray-600">
            {user.name && user.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-base text-black font-semibold">{user.name}</h3>
            <p className="text-xs text-gray-600">
              {user.type} | {totalDays} day(s)
            </p>
          </div>
        </div>

        {/* ... (Reason and Status UI Unchanged) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Start Date</p>
            <p className="text-sm text-black">
              {firstLeaveDate ? formatDate(firstLeaveDate) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">End Date</p>
            <p className="text-sm text-black">
              {endLeaveDate ? formatDate(endLeaveDate) : "N/A"}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600">Reason</p>
          <p className="text-sm text-black">{user.reason}</p>
        </div>

        {shouldShowApprovalButtons && (
          <>
            <div className="mb-4">
              <button
                onClick={() => toggleDrawer(true)}
                className="w-full py-2 px-4 font-semibold bg-gray-100 text-black rounded-xl flex items-center justify-center"
              >
                <AiOutlinePlus className="mr-2" /> Add a Note
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleReject}
                className="flex-1 py-2 px-4 border font-semibold border-red-500 text-red-500 rounded-xl hover:bg-red-50 transition duration-200"
              >
                Reject
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 px-4 font-semibold bg-green-500 text-white rounded-xl hover:bg-green-600 transition duration-200"
              >
                Approve
              </button>
              {/* CANCEL BUTTON: Explicitly calls onClose to close UI */}
              <button
                type="button"
                onClick={() => onClose && onClose()}
                className="flex-1 py-2 px-4 border font-semibold border-yellow-400 text-yellow-400 rounded-xl hover:bg-yellow-50 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      {/* Drawer & Calendar (Unchanged) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30">
          <div className="bg-white w-96 p-6 h-full shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-black font-bold"
              onClick={() => toggleDrawer(false)}
            >
              X
            </button>
            <AddNote
              onSubmit={(noteText) => {
                setNote(noteText);
                toggleDrawer(false);
              }}
            />
          </div>
        </div>
      )}

      <div className="p-3 border border-gray-300 rounded-lg flex">
        <div className="w-3/4 grid grid-cols-7 gap-1">
          {calendarDates.map((date, idx) => {
            const dateStr = dayjs(date).format("YYYY-MM-DD");
            const isSelected = selectedDates.includes(dateStr);
            return (
              <div
                key={idx}
                onClick={() => toggleDateSelection(date)}
                className={`h-8 w-8 flex items-center justify-center rounded-full cursor-pointer
                  ${isSelected ? "bg-blue-500 text-white" : isHalfDay(date) ? "bg-lime-500 text-white" : isLeaveDay(date) ? "bg-black text-white" : "bg-gray-100 text-black"}`}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
        <div className="w-1/4 flex flex-col space-y-4 ml-4">
          <div className="bg-black text-center text-xs font-semibold p-2 rounded-lg text-white">
            Total Days: {totalDays}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestApprove;
